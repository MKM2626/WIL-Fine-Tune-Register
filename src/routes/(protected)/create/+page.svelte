<script lang="ts">
	import { getAnalysts, getCustomers, getTechnology, getRules, createForm, search } from "#lib/remote/registers.remote";
    import { getSearchContext } from "#lib/context/search";
    import { toast } from '#lib/components/toast.svelte.js'
    import ComboBox from '#lib/components/comboBox.svelte'
    import { authClient } from '#lib/auth-client'
    import { tabIndentation } from '#lib/utils/keyDownTextArea'
	import { onMount } from "svelte";

    const session = authClient.useSession() 

    const searchInfo = getSearchContext()

	let analysts = await getAnalysts();
	let rules = await getRules();
	let customers = await getCustomers();
	let technologies = await getTechnology();

    const initialCustomer = customers[0]

    if (initialCustomer) {
         createForm.fields.customerID.set(initialCustomer.id);
    }
    
	const selectedCustomer = $derived(
		customers.find(
			(customer) => customer.id == createForm.fields.customerID.value()
		)
	);

	const technologyName = $derived(
		technologies.find(
			(technology) => technology.id == selectedCustomer?.technologyId
		)?.name
	);

    onMount(() => {
        createForm.fields.ruleID.set('')
        createForm.fields.customerID.set('')
        createForm.fields.after.set('');
        
        createForm.fields.global.set(false)
        
		createForm.fields.comment.set('');
		createForm.fields.analystID.set('');
		createForm.fields.finalised.set(false);
    })
</script>

<form class="max-w-5xl" {...createForm.enhance(async (form) => {
    try {
        const result = await form.submit().updates(
            search(searchInfo).withOverride((results) => ({...results}))
        )
        
        if (result) {
            toast.send('Saved')
        }
        else {
            toast.send('Invalid data', 'error')
        }
    } catch(error) {
        toast.send('Something went wrong', 'error')
    }
})}>

    <div class="flex items-center justify-between pb-5">

        <header class="text-3xl">
            Create Fine Tune
        </header>

        <div class="flex gap-3">
            <button 
                type="button"
                onclick={()=>history.back()}
                class="px-4 py-2 font-semibold rounded-lg bg-bg-light border border-border hover:brightness-125 transition-all duration-250 ease-out"
            >
                Cancel
            </button>

            <button
                type="submit"
                class="px-4 py-2 font-semibold rounded-lg bg-bg-light border border-border hover:brightness-125 transition-all duration-250 ease-out"
            >
                Save
            </button>
        </div>
    </div>

    <div class="bg-bg-light shadow-md rounded-lg p-5 flex flex-col gap-3">
        <div class="flex">
            <span class="w-32 text-text-muted">
                Rule:
            </span>

            <!-- <select
                class="flex-1 px-3 py-2 rounded-lg bg-bg border-2 border-border hover:border-action/60 focus:border-action transition-all duration-250 ease-out outline-none"
                {...createForm.fields.ruleID.as("select")}
            >
                {#each rules as rule}
                    <option value={rule.id}>
                        {rule.name}
                    </option>
                {/each}
            </select> -->

            <div class='flex-1'>
                <ComboBox 
                    options={rules}
                    placeholder="Select rule..."
                    onSelect={(rule) => {createForm.fields.ruleID.set(rule.id)}}
                />
            </div>
            

            <input type="hidden" {...createForm.fields.ruleID.as("text")}/>

        </div>

        <div class="flex">
            <span class="w-32 text-text-muted">
                Customer:
            </span>

            <!-- <select
                class="flex-1 px-3 py-2 rounded-lg bg-bg border-2 border-border outline-none hover:border-action/60 focus:border-action transition-all duration-250 ease-out"
                {...createForm.fields.customerID.as("select")}
            >
                {#each customers as customer}
                    <option value={customer.id}>
                        {customer.name}
                    </option>
                {/each}
            </select> -->

            <div class='flex-1'>
                <ComboBox 
                    options={customers}
                    placeholder="Select customer..."
                    onSelect={(customer) => {createForm.fields.customerID.set(customer.id)}}
                />
            </div>
            

            <input type="hidden" {...createForm.fields.customerID.as("text")}/>
        </div>

        <div class="flex">
            <span class="w-32 text-text-muted">
                Technology:
            </span>

            <span>
                {technologyName ?? "No customer selected"}
            </span>
        </div>
    </div>


    {#if $session.data?.user.teams.includes('admin') || $session.data?.user.teams.includes('senior') || !$session.data?.user.teams.includes('junior')}
        <div class="mt-5">
            <h3 class="text-xl mb-2">
                Global
            </h3>

            <div class="bg-bg-light shadow-md rounded-lg p-4 flex items-center gap-3">
                <input {...createForm.fields.global.as("checkbox")} class="appearance-none h-4 w-4 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center cursor-pointer before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']"/>
                <label for="global" >
                    Will apply to all customers using this technology
                </label>
            </div>
        </div>
    {/if}

    {#if !$session.data?.user.teams.includes('junior') || $session.data?.user.teams.includes('senior') || $session.data?.user.teams.includes('admin')}
        <div class="mt-5">
            <h3 class="text-xl mb-2">
                Finalised
            </h3>

            <div class="bg-bg-light shadow-md rounded-lg p-4 flex items-center gap-3">
                <input {...createForm.fields.finalised.as("checkbox")} class="appearance-none h-4 w-4 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center cursor-pointer before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']"/>
                <label for="global" >
                    Will only finalise the chosen customer, even if set to global.
                </label>
            </div>
        </div>
    {/if}

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Fine Tune Entry:
        </h3>

        <div class="bg-bg-light shadow-md rounded-lg p-4">
            <textarea
                rows="4"
                use:tabIndentation
                class="w-full px-3 py-2 rounded-lg bg-bg border-2 border-border outline-none hover:border-action/60 focus:border-action transition-all duration-250 ease-out"
                {...createForm.fields.after.as("text")}
            ></textarea>
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Analyst:
        </h3>

        <div class="bg-bg-light shadow-md rounded-lg p-4">
            <ComboBox
                options={analysts}
                placeholder="Select analyst..."
                onSelect={(analyst) => {createForm.fields.analystID.set(analyst.id)}}
            />
        </div>
        
    </div> 

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Comment:
        </h3>
        <div class="bg-bg-light shadow-md rounded-lg p-4">
            <textarea
                use:tabIndentation
                rows="4"
                class="w-full px-3 py-2 rounded-lg bg-bg border-2 border-border outline-none hover:border-action/60 focus:border-action transition-all duration-250 ease-out"
                {...createForm.fields.comment.as("text")}
            ></textarea>
        </div>
    </div>
</form>