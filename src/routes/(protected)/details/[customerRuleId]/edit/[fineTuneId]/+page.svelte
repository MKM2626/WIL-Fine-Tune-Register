<script lang="ts">
    import { getFineTune, getAnalysts, editForm, search } from "#lib/remote/registers.remote";
	import { getSearchContext } from "#lib/context/search";
    import { toast } from '#lib/components/toast.svelte.js'
    import ComboBox from "#lib/components/comboBox.svelte"
	import { onMount } from "svelte";
	import { tabIndentation } from "#lib/utils/keyDownTextArea.js";
    import { authClient } from '#lib/auth-client'

    const session = authClient.useSession() 

    const searchInfo = getSearchContext()

    let { params } = $props();

    let fineTune = $derived(await getFineTune(params.fineTuneId));

    let analysts = await getAnalysts();

    onMount(() => {
        editForm.fields.id.set(params.fineTuneId)
        editForm.fields.after.set(fineTune.after);
		editForm.fields.comment.set(fineTune.comment ?? "");
		editForm.fields.analystId.set(fineTune.analystId);
		editForm.fields.finalised.set(fineTune.finalised);
    })
</script>


<form class="max-w-5xl" {...editForm.enhance(async (form) => {
    try {
        const result = await form.submit().updates(
            search(searchInfo).withOverride((results) => ({...results}))
        )
        if (result) {
            toast.send('Saved')
        } else {
            toast.send('Invalid data', 'error')
        }
    } catch(error) {
        toast.send('Something went wrong', 'error')
    }
})}>
    <div class="flex items-center justify-between pb-5">
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

    <input type="hidden" {...editForm.fields.id.as("select")}/>

    <div class="bg-bg-light shadow-md rounded-lg p-5 flex flex-col gap-3">
        <div class="flex">
            <span class="w-32 text-text-muted">
                Date:
            </span>

            <span>
                {fineTune.date.toLocaleDateString()}
            </span>
        </div>


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

        <!-- {#if fineTune.finalised} 
            <div class="flex">
                <span class="w-32 text-text-muted">
                    Finalised: 
                </span>
                <input type="checkbox" checked={fineTune.finalised} disabled class="appearance-none h-4 w-4 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center cursor-pointer before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']">
            </div>
        {/if} -->

        {#if fineTune.finalised} 
            <div class="flex items-center">
                <span class="w-32 text-text-muted">
                    Finalised: 
                </span>

                <input type="checkbox" checked={fineTune.finalised} disabled class="appearance-none h-4 w-4 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']">
            </div>
        {/if}

        
        <div class="flex">
            <span class="w-32 text-text-muted">
                Global: 
            </span>
            <input type="checkbox" checked={fineTune.global} disabled class="appearance-none h-4 w-4 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']">
        </div>
    </div>

    {#if !$session.data?.user.teams.includes('junior') || $session.data?.user.teams.includes('senior') || !$session.data?.user.teams.includes('admin')}
        {#if !fineTune.finalised}
            <div class="mt-5">
                <h3 class="text-xl mb-2">
                    Finalise:
                </h3>

                <div class="p-4 bg-bg-light shadow-md rounded-lg  flex items-center gap-3">
                    <input {...editForm.fields.finalised.as("checkbox")} class="appearance-none h-5 w-5 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center cursor-pointer before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']"/>  
                    <label for='finalised' class="text-text-muted">
                        Once finalised, you won't be able to edit the fine tune.
                    </label>
                </div>
            </div>
        {/if}
    {/if}

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Previous Fine Tune:
        </h3>

        <div class="bg-bg-light shadow-md rounded-lg p-4">
            {fineTune.before}
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            {fineTune.global && !fineTune.finalised ? "Suggested Fine Tune:" : "Updated Fine Tune"}
        </h3>

        <div class="bg-bg-light shadow-md rounded-lg p-4">
            {#if fineTune.finalised}
                {fineTune.after}
            {:else}
                <textarea
                    id="after"
                    use:tabIndentation
                    rows="4"
                    class="w-full px-3 py-2 rounded-lg bg-bg border-2 border-border outline-none hover:border-action/60 focus:border-action transition-all duration-250 ease-out"
                    {...editForm.fields.after.as("text")}
                ></textarea>
            {/if}
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Analyst:
        </h3>

        <div class="bg-bg-light shadow-md rounded-lg p-4">
            <!-- <select
                id="analyst"
                class="w-full px-3 py-2 rounded-lg bg-bg border-2 border-border hover:border-action/60 focus:border-action outline-none"
                {...editForm.fields.analystId.as("select")}
            >
                {#each analysts as analyst}

                    <option value={analyst.id}>
                        {analyst.name}
                    </option>

                {/each}
            </select> -->

            <ComboBox
                options={analysts}
                selected={editForm.fields.analystId.value()}
                placeholder="Select analyst..."
                onSelect={(analyst) => {editForm.fields.analystId.set(analyst.id)}}
            />
        </div>
        <input type="hidden" {...editForm.fields.analystId.as("text")}/>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Comment:
        </h3>

        <div class="bg-bg-light shadow-md rounded-lg p-4">
        <textarea
                id="comment"
                use:tabIndentation
                rows="4" 
                class="w-full px-3 py-2 rounded-lg bg-bg border-2 border-border outline-none hover:border-action/60 focus:border-action transition-all duration-250 ease-out"
                {...editForm.fields.comment.as("text")}
            ></textarea>
        </div>
    </div>
</form>

