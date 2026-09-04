<script lang="ts">
    import { getFineTune, getAnalysts, editForm, search } from "#lib/remote/registers.remote";
	import { getSearchContext } from "#lib/context/search";
    import { goto } from "$app/navigation";
    import { toast } from '#lib/components/toast.svelte.js'
    import ComboBox from "#lib/components/comboBox.svelte"


    const searchInfo = getSearchContext()

    let { params } = $props();

    let fineTune = $derived(await getFineTune(params.id));

    let analysts = await getAnalysts();

    let lastId = ''

    $effect(() => {
        const id = params.id

        if (params.id == lastId) return

        lastId = id

        editForm.fields.id.set(params.id)
        editForm.fields.after.set(fineTune.after);
		editForm.fields.comment.set(fineTune.comment ?? "");
		editForm.fields.analystId.set(fineTune.analystId);
		editForm.fields.finalised.set(fineTune.finalised);
    })

    function submit() {
        search(searchInfo).refresh()
        toast.send('Saved')
    }
</script>


<form {...editForm} class="max-w-5xl">
    <div class="flex items-center justify-between pb-5">
        <header class="text-3xl">
            Edit Fine Tune
        </header>

        <div class="flex gap-3">
            <button
                type="button"
                onclick={()=>goto(`/details/${params.id}`)}
                class="px-4 py-2 font-semibold rounded-lg bg-bg-light border border-border hover:brightness-125 transition-all duration-250 ease-out"
            >
                Cancel
            </button>

            <button
                type="submit"
                onclick={()=>submit()}
                class="px-4 py-2 font-semibold rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:brightness-125 transition-all duration-250 ease-out"
            >
                Save
            </button>
        </div>
    </div>

    <input type="hidden" {...editForm.fields.id.as("select")}/>

    <div class="bg-bg-light rounded-lg p-5 flex flex-col gap-3">
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

    {#if !fineTune.finalised}
        <div class="mt-5">
            <h3 class="text-xl mb-2">
                Finalise:
            </h3>

            <div class="p-4 bg-bg-light  rounded-lg  flex items-center gap-3">
                <input {...editForm.fields.finalised.as("checkbox")} class="appearance-none h-5 w-5 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center cursor-pointer before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']"/>  
                <label for='finalised' class="text-text-muted">
                    Once finalised, you won't be able to edit the fine tune.
                </label>
            </div>
        </div>
    {/if}

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Previous Fine Tune:
        </h3>

        <div class="bg-bg-light rounded-lg p-4">
            {fineTune.before}
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            {fineTune.global && !fineTune.finalised ? "Suggested Fine Tune:" : "Updated Fine Tune"}
        </h3>

        <div class="bg-bg-light rounded-lg p-4">
            {#if fineTune.finalised}
                {fineTune.after}
            {:else}
                <textarea
                    id="after"
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

        <div class="bg-bg-light  rounded-lg p-4">
            <select
                id="analyst"
                class="w-full px-3 py-2 rounded-lg bg-bg border-2 border-border hover:border-action/60 focus:border-action outline-none"
                {...editForm.fields.analystId.as("select")}
            >
                {#each analysts as analyst}

                    <option value={analyst.id}>
                        {analyst.name}
                    </option>

                {/each}
            </select>
        </div>

        <!-- <ComboBox
            options={analysts}
            placeholder="select an analyst..."
            onSelect={(analyst) => editForm.fields.analystId.set(analyst.id)}
        ></ComboBox> -->
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Comment:
        </h3>

        <div class="bg-bg-light rounded-lg p-4">
        <textarea
                id="comment"
                rows="4" 
                class="w-full px-3 py-2 rounded-lg bg-bg border-2 border-border outline-none hover:border-action/60 focus:border-action transition-all duration-250 ease-out"
                {...editForm.fields.comment.as("text")}
            ></textarea>
        </div>
    </div>
</form>

