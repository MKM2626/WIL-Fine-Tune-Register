<script lang="ts">
	import { getAnalysts, getFineTune, createForm, search } from "#lib/remote/registers.remote";
    import { getSearchContext } from "#lib/context/search";
	import { goto } from "$app/navigation";


    const searchInfo = getSearchContext()

	let { params } = $props();

    let id = $derived(params.id)

	let fineTune = $derived(await getFineTune(id));

	let analysts = await getAnalysts();
 
    let lastId = ''

    $effect(() => {
        const id = params.id

        if (params.id == lastId) return

        lastId = id

        createForm.fields.ruleID.set(fineTune.ruleId)
        createForm.fields.customerID.set(fineTune.customerId)
        createForm.fields.after.set(fineTune.after);
        createForm.fields.global.set(fineTune.global)
		createForm.fields.comment.set(fineTune.comment ?? "");
		createForm.fields.analystID.set(fineTune.analystId);
		createForm.fields.finalised.set(fineTune.finalised);
    })
</script>

<form {...createForm} class="max-w-5xl">

    <div class="flex items-center justify-between pb-5">

        <header class="text-3xl">
            Update Fine Tune
        </header>

        <div class="flex gap-3">
            <button 
                type="button"
                onclick={()=>goto(`/details/${params.id}`)}
                class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
            >
                Cancel
            </button>

            <button
                type="submit"
                onclick={()=>search(searchInfo).refresh()}
                class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
            >
                Save
            </button>
        </div>
    </div>

    <input type="hidden" {...createForm.fields.ruleID.as("select")} />
    <input type="hidden" {...createForm.fields.customerID.as("select")} />

    <div class="bg-bg-light border border-border rounded-lg p-5 flex flex-col gap-3">
        <div class="flex">
            <span class="w-32 text-text-muted">
                Rule:
            </span>

            <span>
                {fineTune.rule}
            </span>
        </div>

        <div class="flex">
            <span class="w-32 text-text-muted">
                Customer:
            </span>
            
            <span>
                {fineTune.customer}
            </span>
        </div>

        <div class="flex">
            <span class="w-32 text-text-muted">
                Technology:
            </span>

            <span>
                {fineTune.technology}
            </span>
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Global:
        </h3>

        <div class="bg-bg-light border border-border rounded-lg p-4 flex items-center gap-3">
        
            <input {...createForm.fields.global.as("checkbox")} class="appearance-none h-4 w-4 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center cursor-pointer before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']"/>  
            <label for='global'>
                 Apply to all customers using this technology
            </label>
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Finalised:
        </h3>

        <div class="bg-bg-light border border-border rounded-lg p-4 flex items-center gap-3">
        
            <input {...createForm.fields.global.as("checkbox")} class="appearance-none h-4 w-4 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center cursor-pointer before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']"/>  
            <label for='global'>
                Will only finalise the chosen customer, even if set to global.
            </label>
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Fine Tune Entry:
        </h3>

        <div class="bg-bg-light border border-border rounded-lg p-4">
            <textarea
                rows="4"
                class="w-full px-3 py-2 rounded-lg bg-bg border border-border outline-none"
                {...createForm.fields.after.as("text")}
            ></textarea>
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Analyst: 
        </h3>

        <div class="bg-bg-light border border-border rounded-lg p-4">
            <select
                class="w-full px-3 py-2 rounded-lg bg-bg border border-border outline-none"
                {...createForm.fields.analystID.as("select")}
            >
                {#each analysts as analyst}
                    <option value={analyst.id}> 
                        {analyst.name}
                    </option>
                {/each}
            </select>
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Comment:
        </h3>
        <div class="bg-bg-light border border-border rounded-lg p-4">
            <textarea
                rows="4"
                class="w-full px-3 py-2 rounded-lg bg-bg border border-border outline-none"
                {...createForm.fields.comment.as("text")}
            ></textarea>
        </div>
    </div>
</form>