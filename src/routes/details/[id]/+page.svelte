<script lang="ts">
	import { getDetails, deleteRow, search } from "#lib/remote/registers.remote.js";
    import { getSearchContext } from "#lib/context/search";
    import { goto } from "$app/navigation";
    import { diffWords } from 'diff'
    import { fade, fly } from 'svelte/transition'

    let { params } = $props();
    let id =$derived(params.id);

    let selectedFineTune = $derived(await getDetails(id))

    const searchInfo = getSearchContext()

    // Could use with DOMPurify
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

    function otherdiff(before: string, after: string) {
        const differences = diffWords(before, after);

        let beforeResult = []
        let afterResult = []

        for (const part of differences) {
            if (part.removed) {
                beforeResult.push({ type: "removed", text: part.value})
            }
            else if (part.added) {
                afterResult.push({ type: "added", text: part.value})
            }
            else {
                beforeResult.push({ type: "same", text: part.value})
                afterResult.push({ type: "same", text: part.value})
            }
        }

        return { 
            before: beforeResult,
            after: afterResult
        }
    }

    // let otherDiffs = $derived(otherdiff(selectedFineTune.before, selectedFineTune.after))
    

    let diffs = $derived(getDiff(selectedFineTune.before, selectedFineTune.after))

    


    let expanded = $state(false);

    async function del() {
        await deleteRow(id)
        search(searchInfo).refresh()
        goto("/")
    }
</script>

<div class="flex items-center justify-between pb-5">
    <header class="text-3xl">
        Fine Tune Details
    </header>

    <div class="flex gap-3">
        <button 
            class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
            onclick={()=> goto(`/edit/${id}`)}
        >
            Edit
        </button>

        <button 
            class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
            onclick={()=> goto(`/update/${id}`)}
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

    <div class="flex">
        <span class="w-32 text-text-muted">
            Finalised: 
        </span>
        <input type="checkbox" checked={selectedFineTune.finalised} disabled class="appearance-none h-4 w-4 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center cursor-pointer before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']">
    </div>

    <!-- colour changes when move off page, want green / red checked / not checked -->

    <div class="flex">
        <span class="w-32 text-text-muted">
            Global: 
        </span>
        <input type="checkbox" checked={selectedFineTune.global} disabled class="appearance-none h-4 w-4 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center cursor-pointer before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']">
    </div>


    {#if selectedFineTune.global}
        <div>
            <button
                type="button"
                class="w-full flex items-center text-left"
                onclick={() => expanded = !expanded}
            >
                <span class="w-32 shrink-0 text-text-muted">
                    {expanded ? '▲' : '▼'} Global Customers:
                </span>

            </button>

            {#if expanded}
                <div class="ml-32 mt-3 grid grid-cols-5 gap-x-6 gap-y-2">
                    {#each selectedFineTune.globals as global}
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
        Previous Fine Tune:
    </h3>

    <div class="bg-bg-light border border-border rounded-lg p-4">
        {#key params.id}
            <div>{@html diffs.before}</div>
        {/key}

        <!-- transition:fly={{ y: 200, duration: 2000 }} -->
    </div>

    <!-- <div class="bg-bg-light border border-border rounded-lg p-4">
        {#each otherDiffs.before as diff}
            <span class={diff.type === 'removed' ? 'text-red-500' : diff.type === 'added' ? 'text-green-500' : 'text-text'}>
                {diff.text}
            </span>
        {/each}
    </div> -->
</div>



<div class="mt-5">
    <h3 class="text-xl mb-2">
        Updated Fine Tune:
    </h3>

    <div class="bg-bg-light border border-border rounded-lg p-4">
        {@html diffs.after}
    </div>

    
    <!-- <div transition:fade|global class="bg-bg-light border border-border rounded-lg p-4">
        {#each otherDiffs.after as diff}
            <span class={diff.type === 'removed' ? 'text-red-500' : diff.type === 'added' ? 'text-green-500' : 'text-text'}>
                {diff.text}
            </span>
        {/each}
    </div> -->
</div>

<div class="mt-5">
    <h3 class="text-xl mb-2">
        Comments:
    </h3>

    <div class="bg-bg-light border border-border rounded-lg p-4 transition:fade">
        {selectedFineTune.comment ?? "No comment"}
    </div>
</div>
