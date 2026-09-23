<script lang="ts">
    let { params } = $props();
    import { getTags } from '#lib/remote/getSimple.remote'
    import { editForm } from '#lib/remote/editForm.remote';
    import { getFineTune } from "#lib/remote/getFineTune.remote";
    import { getCRSearchContext } from "#lib/context/customerRuleSearch";
    import { getCustomerRules } from "#lib/remote/getCustomerRules.remote";
    import { toast } from '#lib/components/toast.svelte.js'
    import { authClient } from '#lib/auth-client'
	import { tabIndentation } from "#lib/utils/keyDownTextArea";
	import { handleError } from "#lib/errors/handleError";
    import { CircleCheck, CircleX, CalendarDays } from '@lucide/svelte/icons'
    import TagInput from '#lib/components/TagInput.svelte';
	import { onMount } from 'svelte';
    import { atLeast } from "#lib/roles";

    const session = authClient.useSession() 

    const searchInfo = getCRSearchContext()

    let ftId = $derived(params.fineTuneId)

    let fineTune = $derived(await getFineTune(ftId));

    const tags = await getTags()

    let finalised = $state(false)

    onMount(() => {
        editForm.fields.id.set(ftId)
        if (fineTune.comment) editForm.fields.comment.set(fineTune.comment)
        if (fineTune.tags) editForm.fields.existingTags.set(fineTune.tags.map((tag) => tag.id))
        editForm.fields.newTags.set([])
        editForm.fields.fineTune.set(fineTune.after);
		editForm.fields.finalised.set(fineTune.finalised);
        editForm.fields.name.set(fineTune.name ? fineTune.name : "No name provided")
    })
</script>


<form class="max-w-5xl" {...editForm.enhance(async (form) => {
    try {
        const result = await form.submit().updates(
            getCustomerRules(searchInfo).withOverride((results) => ({...results}))
        )

        if (result) {
            toast.success('Saved')
            form.element.reset()
        }
        else toast.error('Failed to save')


    } catch(error) {
        handleError(error)
    }
})}>
    <input type="hidden" {...editForm.fields.id.as("select")}/>

    <div class="flex items-center justify-between pb-5 pt-4">
        <header class="text-3xl">
            Edit Fine Tune
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
                class="px-4 py-2 font-semibold rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:brightness-125 transition-all duration-250 ease-out"
            >
                Save
            </button>
        </div>
    </div>

    <div class="flex flex-col gap-4 pb-6">

        <section class="@container rounded-xl border border-border bg-bg-light px-5 py-4 shadow-md">
            <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <h2
                    class="min-w-0 wrap-break-words text-xl font-semibold text-text"
                    title={fineTune.customer}
                >
                    {fineTune.customer}
                </h2>

                <span
                    class="inline-flex shrink-0 items-center gap-1.5 pt-1 text-xs text-text-muted"
                    title={fineTune.date.toLocaleString()}
                >
                    <CalendarDays size={14} />
                    Rule created {fineTune.date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: "numeric", minute: "numeric", second: "numeric" })}
                </span>
            </div>

            <div class="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-border pt-3 @md:grid-cols-3">
                <div class="min-w-0 @md:col-span-2">
                    <p class="text-xs font-medium text-text-muted">Rule</p>
                    <p class="wrap-break-wordbreak-words text-sm text-text">{fineTune.rule}</p>
                </div>

                <div class="min-w-0">
                    <p class="text-xs font-medium text-text-muted">Technology</p>
                    <p class="wrap-break-words text-sm text-text">{fineTune.technology}</p>
                </div>

                
            </div>

            <!-- {#if !atLeast($session.data?.user.role, 'senior')} -->
                <div class="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-border pt-3 @xs:grid-cols-3">


                    <div class="min-w-0 @md:col-span-2">
                        <p class="text-xs font-medium text-text-muted">Finalised</p>
                        <p class="wrap-break-words text-sm text-text">{fineTune.finalised ? "True" : "False"}</p>
                    </div>


                    <div class="min-w-0">
                        <p class="text-xs font-medium text-text-muted">Global</p>
                        <p class="wrap-break-words text-sm text-text">{fineTune.globalId ? "True" : "False"}</p>
                    </div>

                </div>
            <!-- {/if} -->

        </section> 

        <section class="rounded-xl border border-border bg-bg-light shadow-md">
            <div class="px-5 py-4">

                    <label class="block">
                        <span class="mb-1 block text-xs font-medium text-text-muted">{fineTune.finalised ? "Fine tune name" : "Fine tune name (optional)"}</span>
                        <input
                            type = 'text'
                            disabled={fineTune.finalised}
                            {...editForm.fields.name.as('text')}
                            class="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text transition-all duration-250 ease-out hover:border-action/60 focus:border-action focus:outline-none"
                        />
                    </label>


            </div>

            <div class="border-t border-border px-5 py-4">
                <label class="block">
                    <span class="mb-1 block text-xs font-medium text-text-muted">Fine tune entry</span>
                    <textarea
                        rows="6"
                        use:tabIndentation
                        disabled={fineTune.finalised}
                        {...editForm.fields.fineTune.as('text')}
                        class="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text transition-all duration-250 ease-out hover:border-action/60 focus:border-action focus:outline-none min-h-32 resize-y leading-6"
                    ></textarea>
                    {#each editForm.fields.fineTune.issues() as issue (issue)}
                        <p class="pl-1 mt-1 text-xs text-red-500">{issue.message}</p>
                    {/each}
                </label>
            </div>
        </section>

        <section class="rounded-xl border border-border bg-bg-light shadow-md">
            <div class="px-5 py-4">
                <label class='block'>
                    <span class="mb-1 block text-xs font-medium text-text-muted">Expiry date (optional)</span>
                    <input 
                        {...editForm.fields.expiryDate.as('date')}

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

                        {...editForm.fields.comment.as('text')}
                        class="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text transition-all duration-250 ease-out hover:border-action/60 focus:border-action focus:outline-none resize-y leading-6"
                    ></textarea>
                </label>
            </div>

            <div class="border-t border-border px-5 py-4">
                <span class="mb-1 block text-xs font-medium text-text-muted">Tags (optional)</span>
                <TagInput
                    options={tags}
                    selectedTags={fineTune.tags}
                    onChange={(existing, created) => {
                        editForm.fields.existingTags.set(existing)
                        editForm.fields.newTags.set(created)
                    }}
                />
            </div>
        </section>

        {#if atLeast($session.data?.user.role, 'senior') && !fineTune.finalised}
            <section class="rounded-xl border border-border bg-bg-light shadow-md">
                <div class="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 @md:grid-cols-2">

                    <button 
                        type="button"
                        disabled={!atLeast($session.data?.user.role, 'senior')}
                        onclick={() => {finalised = !finalised}}
                        class="flex w-full flex-col items-start rounded-lg border px-3 py-1 text-left transition-all duration-250 ease-out {finalised ? "border-green-500/50 bg-green-500/10" :  "border-border bg-bg hover:border-action"}"
                    >
                        <span class=" items-center font-medium tracking-wide text-text inline-flex gap-x-2">
                            {#if editForm.fields.finalised.value()}
                                <CircleCheck size={16} class="shrink-0 text-green-400" />
                            {:else }
                                <CircleX size={16} class="shrink-0 text-text-muted" />
                            {/if}
                            Status
                            
                        </span>
                        <span class="pl-5.5 max-w-full text-xs font-medium  text-text-muted">
                            Finalise only affect this fine tune, even if it is a global fine tune.
                        </span>
                    </button>

                     <input {...editForm.fields.finalised.as('hidden', finalised)}>

                </div>
            </section>
        {/if}

    </div>
</form>

