<script lang="ts">
	import { getFineTune, deleteRow, testSearch, getGlobals } from "#lib/remote/registers.remote.js";
    import { getSearchContext } from "#lib/context/search";
    import { goto } from "$app/navigation";
	import type { derived } from "svelte/store";
    // import diff from 'fast-diff'
    import { diffWords } from 'diff'

    let { params } = $props();
    let id =$derived(params.id);

    let selectedFineTune = $derived(await getFineTune(id))

    let globals = $derived(selectedFineTune.global ? await getGlobals(selectedFineTune.globalId!) : null)

    const searchInfo = getSearchContext()

    function getDiff(before: string, after: string) {
        const differences = diffWords(before, after);

        let beforeResult = '';
        let afterResult = '';

        for (const part of differences) {
            if (part.removed) {
                beforeResult += `<span class="text-red-500">${part.value}</span>`;
            } 
            else if (part.added) {
                afterResult += `<span class="text-green-500">${part.value}</span>`;
            } 
            else {
                beforeResult += part.value;
                afterResult += part.value;
            }
        }

        return {
            before: beforeResult,
            after: afterResult
        };
    }

    let diffs = $derived(getDiff(selectedFineTune.before, selectedFineTune.after))
    
    let expanded = $state(false);

    async function del() {
        await deleteRow(id)
        testSearch(searchInfo).refresh()
        goto("/test/")
    }
</script>

<div class="flex items-center justify-between pb-5">
    <header class="text-3xl">
        Fine Tune Details
    </header>

    <div class="flex gap-3">
        <button 
            class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
            onclick={()=> goto(`/test/edit/${id}`)}
        >
            Edit
        </button>

        <button 
            class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
            onclick={()=> goto(`/test/update/${id}`)}
        >
            Update
        </button>

        <button 
            class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
            onclick={()=>del()}
        >
            Delete
        </button>
    </div>
</div>

<div class="bg-bg-light border border-border rounded-lg p-5 flex flex-col gap-3">
    <div class="flex">
        <span class="w-32 text-text-muted">
            Date:
        </span>
        <span>
            {selectedFineTune.date.toLocaleDateString()}
        </span>
    </div>

    <div class="flex">
        <span class="w-32 text-text-muted">
            Rule:
        </span>
        <span>
            {selectedFineTune.rule}
        </span>
    </div>

        <div class="flex">
        <span class="w-32 text-text-muted">
            Customer:
        </span>
        <span>
            {selectedFineTune.customer}
        </span>
    </div>

    <div class="flex">
        <span class="w-32 text-text-muted">
            Technology:
        </span>
        <span>
            {selectedFineTune.technology}
        </span>
    </div>

    <div class="flex">
        <span class="w-32 text-text-muted">
            Analyst:
        </span>
        <span>
            {selectedFineTune.analyst}
        </span>
    </div>

    <!-- colour changes when move off page, want green / red checked / not checked -->

    <div class="flex">
        <span class="w-32 text-text-muted">
            Global: 
        </span>
        <input type="checkbox" checked={selectedFineTune.global} disabled class="checked:accent-green-800">
    </div>

    <!-- Can't get it to space evenly  -->

    <!-- {#if selectedFineTune.global}
        <div class="flex">
            <span class="w-32 text-text-muted">
                Global Customers:
            </span>
            <div class="justify-">
                {#each globals as global}
                    <span>
                        {global.customers}
                    </span>
                {/each}
            </div>
            
        </div>
    {/if} -->

    <!-- <div class="flex min-w-0">
        <span class="w-32 shrink-0 text-text-muted">
            Global Customers:
        </span>

        <div class="flex flex-1 min-w-0 flex-wrap gap-x-6 gap-y-2">
            {#each globals as global}
                <span>
                    {global.customers}
                </span>
            {/each}
        </div>
    </div> -->

    {#if selectedFineTune.global}
        <div>
            <button
                type="button"
                class="w-full flex items-center text-left"
                onclick={() => expanded = !expanded}
            >
                <span class="w-32 shrink-0 text-text-muted">
                    Global Customers:
                </span>

                <span class="text-text-muted">
                    {expanded ? '▲' : '▼'}
                </span>
            </button>

            {#if expanded}
                <div class="ml-32 mt-3 grid grid-cols-5 gap-x-6 gap-y-2">
                    {#each globals as global}
                        <span class="min-w-0 wrap-break-words">
                            {global.customers}
                        </span>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
    
</div>

<div class="mt-5">
    <h3 class="text-xl mb-2">
        Before:
    </h3>

    <div class="bg-bg-light border border-border rounded-lg p-4">
        {@html diffs.before}
    </div>

  
    
</div>

<div class="mt-5">
    <h3 class="text-xl mb-2">
        After:
    </h3>

    <div class="bg-bg-light border border-border rounded-lg p-4">
        {@html diffs.after}
    </div>
</div>

<div class="mt-5">
    <h3 class="text-xl mb-2">
        Comments:
    </h3>

    <div class="bg-bg-light border border-border rounded-lg p-4">
        {selectedFineTune.comment ?? "No comment"}
    </div>
</div>
