<script lang="ts">
    import { getCustomers, getRules, getTechnology, getTags } from "#lib/remote/getSimple.remote";
    import { getCustomerRules } from "#lib/remote/getCustomerRules.remote";
    import { getCRSearchContext } from "#lib/context/customerRuleSearch";
    import { toast } from '#lib/components/toast.svelte.js'
    import { tabIndentation } from '#lib/utils/keyDownTextArea'
    import { createForm } from '#lib/remote/createForm.remote'
	import { handleError } from "#lib/errors/handleError";
    import { Globe, CircleCheck, CircleX } from '@lucide/svelte/icons'
    import TagInput from "#lib/components/TagInput.svelte"
    import ComboBox from '#lib/components/comboBox.svelte'

    const crSearchInfo = getCRSearchContext()

	let rules = await getRules();
	let customers = await getCustomers();
	let technologies = await getTechnology();
    let tags = await getTags()

    let global = $state(false)

    let finalised = $state(false)


    
	const selectedCustomer = $derived(
		customers.find(
			(customer) => customer.id == createForm.fields.customerId.value()
		)
	);

	const technologyName = $derived(
		technologies.find(
			(technology) => technology.id == selectedCustomer?.technologyId
		)?.name
	);
</script>

<form class="@container mx-auto max-w-5xl" {...createForm.enhance(async (form) => {


    try {
        const result = await form.submit().updates(
            getCustomerRules(crSearchInfo).withOverride((results) => ({...results}))
        )
        if (result) {
            toast.success('Saved') 
            form.element.reset()
        }
        else toast.error('Invalid input')
       
    } catch(error) {
        handleError(error)
    }

})}>

    <div class="flex items-center justify-between pb-5 pt-4">

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

    <div class='flex flex-col gap-4 pb-6'>
        <section class='rounded-xl border border-border bg-bg-light shadow-md'>
            <div class="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 @2xl:grid-cols-2">
                <div>
                    <p class="mb-1 text-xs font-medium text-text-muted">Rule</p>

                    <!-- TODO: put in selected -->
                    <ComboBox 
                        options={rules}
                        selected={createForm.fields.ruleId.value()}
                        placeholder="Select rule..."
                        onSelect={(rule) => createForm.fields.ruleId.set(rule.id)}
                        onClear={() => createForm.fields.ruleId.set('')}
                    />
                    <input {...createForm.fields.ruleId.as('text')} type="hidden"/>
                    {#each createForm.fields.ruleId.issues() as issue (issue)}
                        <p class="pl-1 mt-1 text-xs text-red-500">{issue.message}</p>
                    {/each}
                </div>
                
                <div>
                    <p class="mb-1 text-xs font-medium text-text-muted">Customer</p>
                    <ComboBox
                        options={customers}
                        selected={createForm.fields.customerId.value()}
                        placeholder="Select customer..."
                        onSelect={(customer) => createForm.fields.customerId.set(customer.id)}
                        onClear={() => createForm.fields.customerId.set('')}
                    />
                    <input {...createForm.fields.customerId.as('text')} type='hidden'/>
                    {#each createForm.fields.customerId.issues() as issue (issue)}
                        <p class="pl-1 mt-1 text-xs text-red-500">{issue.message}</p>
                    {/each}
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-5 py-3 text-sm">
                <span class="text-xs font-medium text-text-muted">Technology</span>
                <span class={technologyName ? 'text-text' : 'text-text-muted'}>
                    {technologyName ?? 'Select a customer to see its technology'}
                </span>
            </div>
        </section>

        <section class="rounded-xl border border-border bg-bg-light shadow-md">
            <div class="px-5 py-4">
                <label class="block">
                    <span class="mb-1 block text-xs font-medium text-text-muted">Fine tune name (optional)</span>
                    <input
                        type = 'text'
                        {...createForm.fields.name.as('text')}
                        class="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text transition-all duration-250 ease-out hover:border-action/60 focus:border-action focus:outline-none"
                    />
                </label>
            </div>

            <div class="border-t border-border px-5 py-4">
                <label class="block">
                    <span class="mb-1 block text-xs font-medium text-text-muted">Fine tune entry</span>
                    <textarea
                        rows="6"
                        title="Fine tune"
                        use:tabIndentation
                        {...createForm.fields.fineTune.as('text')}
                        class="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text transition-all duration-250 ease-out hover:border-action/60 focus:border-action focus:outline-none min-h-32 resize-y leading-6"
                    ></textarea>
                    {#each createForm.fields.fineTune.issues() as issue (issue)}
                        <p class="pl-1 mt-1 text-xs text-red-500">{issue.message.replace('fineTune', '')}</p>
                    {/each}
                </label>
            </div>
        </section>

        <section class="rounded-xl border border-border bg-bg-light shadow-md">
            <div class="px-5 py-4">
                <label class='block'>
                    <span class="mb-1 block text-xs font-medium text-text-muted">Expiry date (optional)</span>
                    <input 
                        {...createForm.fields.expiryDate.as('date')}
                        class="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text transition-all duration-250 ease-out hover:border-action/60 focus:border-action focus:outline-none"
                    />
                </label>
            </div>

            <div class="border-t border-border px-5 py-4">
                <label class="block">
                    <span class="mb-1 block text-xs font-medium text-text-muted">Comment (optional)</span>
                    <textarea
                        rows="3"
                        use:tabIndentation
                        {...createForm.fields.comment.as('text')}
                        class="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text transition-all duration-250 ease-out hover:border-action/60 focus:border-action focus:outline-none resize-y leading-6"
                    ></textarea>
                </label>
            </div>

            <div class="border-t border-border px-5 py-4">
                <span class="mb-1 block text-xs font-medium text-text-muted">Tags (optional)</span>
                <!-- modify tag input to save tags from id -->
                <TagInput
                    options={tags}

                    onChange={(existing, created) => {
                        
                        createForm.fields.existingTags.set(existing)
                        createForm.fields.newTags.set(created)
                    }}
                />
            </div>
        </section>

        <section class="rounded-xl border border-border bg-bg-light shadow-md">
            <div class="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 @md:grid-cols-2">

                <button
                    type="button"
                    onclick={() => {global = !global}}
                    class="flex w-full flex-col items-start rounded-lg border px-3 py-1 text-left transition-all duration-250 ease-out {global ? "border-green-500/50 bg-green-500/10" :  "border-border bg-bg hover:border-action"}"
                >   
                    <span class=" items-center font-medium tracking-wide text-text inline-flex gap-x-2">
                        <Globe size={16} class="shrink-0 {global ? "text-green-400" : "text-text-muted"}" />
                        Global
                    </span>
                    <span class="pl-5.5 max-w-full text-sm font-medium text-text-muted">
                        Applies to all customers using this technology
                    </span>
                </button>

                <input {...createForm.fields.global.as('hidden', global)}>


                <button 
                    type="button"
                    onclick={() => {finalised = !finalised}}
                    class="flex w-full flex-col items-start rounded-lg border px-3 py-1 text-left transition-all duration-250 ease-out {finalised ? "border-green-500/50 bg-green-500/10" :  "border-border bg-bg hover:border-action"}"
                >
                    <span class=" items-center font-medium tracking-wide text-text inline-flex gap-x-2">
                        {#if finalised}
                            <CircleCheck size={16} class="shrink-0 text-green-400" />
                        {:else }
                            <CircleX size={16} class="shrink-0 text-text-muted" />
                        {/if}
                        Status
                        
                    </span>
                    <span class="pl-5.5 max-w-full text-xs font-medium  text-text-muted">
                         Finalise only chosen customer, even if set to global
                    </span>
                </button>

                <input {...createForm.fields.finalised.as('hidden', finalised)}>


            </div>
        </section>

    </div>
</form>