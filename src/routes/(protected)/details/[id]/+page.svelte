<script lang="ts">
	import { getDetails, deleteRow, search } from "#lib/remote/registers.remote.js";
    import { getSearchContext } from "#lib/context/search";
    import { goto } from "$app/navigation";
    import { diffWords } from 'diff';
    import { fade, fly, slide } from 'svelte/transition';
    import { toast } from '#lib/components/toast.svelte.js'
    import { authClient } from '#lib/auth-client'

    const session = authClient.useSession() 

    let { params } = $props();
    let id =$derived(params.id);

    const moveOut = 200;
    const delay = 200;
    const moveIn = 200;

    let selectedFineTune = $derived(await getDetails(id))

    const searchInfo = getSearchContext()

    let deleting = $state(false)
    let expanded = $state(false);

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


    async function del() {
        if (!$session.data?.user.teams.includes('admin')) return
        if (deleting) return 

        deleting = true

        try {
            await deleteRow(id)
            search(searchInfo).refresh()
            toast.send('Deleted')
            goto("/")
        }
        catch (error) {
            toast.send(error instanceof Error ? error.message : "Failed to delete", "error")
        }
       finally {
            deleting=false
       }
    }
</script>

<div class="flex items-center justify-between pb-5">
    <header class="text-3xl">
        Fine Tune Details
    </header>

    <div class="flex gap-3">
        <button 
            class="px-4 py-2 font-bold rounded-lg bg-bg-light border border-border hover:brightness-125 transition"
            onclick={()=> goto(`/edit/${id}`)}
        >
            Edit
        </button>

        <button 
            class="px-4 py-2 font-bold rounded-lg bg-bg-light border border-border hover:brightness-125 transition"
            onclick={()=> goto(`/update/${id}`)}
        >
            Update
        </button>

        {#if $session.data?.user.teams.includes('admin')}
            <button 
                class="px-4 py-2 font-bold rounded-lg bg-bg-light border border-border hover:brightness-125 transition"
                onclick={()=>del()}
                disabled={deleting}
            >
                Delete
            </button>
        {/if}
        
    </div>
</div>



<div class="bg-bg-light rounded-lg p-5 flex flex-col gap-3 overflow-hidden">
    <div class="flex">
        <span class="w-32 text-text-muted">
            Date:
        </span>
        {#key params.id}

            <span in:fade={{ duration: moveIn, delay: delay }} out:fade={{ duration: moveOut}}>
                {selectedFineTune.date.toLocaleDateString()}
            </span>

            
        {/key}
    </div>

    <div class="flex">
        <span class="w-32 text-text-muted">
            Rule:
        </span>
        {#key params.id}
            <span in:fade={{ duration: moveIn, delay: delay }} out:fade={{ duration: moveOut}}>
                {selectedFineTune.rule}
            </span>
        {/key}
            
    </div>

        <div class="flex">
        <span class="w-32 text-text-muted">
            Customer:
        </span>
        {#key params.id}
            <span in:fade={{ duration: moveIn, delay: delay }} out:fade={{ duration: moveOut}}>
                {selectedFineTune.customer}
            </span>
        {/key}

        
    </div>

    <div class="flex">
        <span class="w-32 text-text-muted">
            Technology:
        </span>
        {#key params.id}
            <span in:fade={{ duration: moveIn, delay: delay }} out:fade={{ duration: moveOut}}>
                {selectedFineTune.technology}
            </span>
        {/key}
    </div>

    <div class="flex">
        <span class="w-32 text-text-muted">
            Analyst:
        </span>
        {#key params.id}
            <span in:fade={{ duration: moveIn, delay: delay }} out:fade={{ duration: moveOut}}>
                {selectedFineTune.analyst}
            </span>
        {/key}
    </div>

    <div class="flex">
        <span class="w-32 text-text-muted">
            Finalised: 
        </span>
        {#key params.id}
            <input type="checkbox" checked={selectedFineTune.finalised} disabled in:fade={{ duration: moveIn, delay: delay }} out:fade={{ duration: moveOut}} class="appearance-none h-4 w-4 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']">
        {/key}
    </div>
        

    <!-- colour changes when move off page, want green / red checked / not checked -->

    <div class="flex">
        <span class="w-32 text-text-muted">
            Global: 
        </span>
        {#key params.id}
            <input type="checkbox" checked={selectedFineTune.global} disabled in:fade={{ duration: moveIn, delay: delay }} out:fade={{ duration: moveOut}} class="appearance-none h-4 w-4 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']">
        {/key}
    </div>
        
    {#if selectedFineTune.global}
        <div class="bg-bg-light">
            <button
                type="button"
                class="pl-4 pr-5 py-2 bg-bg border-2 rounded-lg border-border hover:border-indigo-500"
                onclick={() => expanded = !expanded}
            >
                <span>
                    {expanded ? '▲' : '▼'} Global Customers:
                </span>
            </button>

            {#if expanded}
                <div 
                    transition:slide={{ duration: 400}}
                    class="overflow-hidden"
                >
                    <div class="mt-2 bg-bg-light rounded-lg grid grid-cols-4 gap-2">
                        {#each selectedFineTune.globals as global}
                            <!-- in futer click on to take to same rule of that customer -->
                            <button 
                                class="wrap-break-words text-wrap py-2 px-2 text-center bg-bg border border-border hover:border-indigo-500 rounded-lg"
                            >
                                {global.customers}
                            </button>
                        {/each}
                    </div>
                    
                </div>
            {/if}
        </div>
    {/if}
</div>

    <!-- <div class="bg-bg-light border border-border rounded-lg p-4">
        {#each otherDiffs.before as diff}
            <span class={diff.type === 'removed' ? 'text-red-500' : diff.type === 'added' ? 'text-green-500' : 'text-text'}>
                {diff.text}
            </span>
        {/each}
    </div> -->

<div class="mt-5">
    <h3 class="text-xl mb-2">
        Previous Fine Tune:
    </h3>
    <div class="bg-bg-light rounded-lg p-4">
        {#key params.id}
            <span in:fade={{ duration: moveIn, delay: delay }} out:fade={{ duration: moveOut}}>
                {@html diffs.before} 
            </span>
        {/key}
    </div>
</div>

<div class="mt-5">
    <h3 class="text-xl mb-2">
        Updated Fine Tune:
    </h3>
    <div class="bg-bg-light  rounded-lg p-4">
        {#key params.id}
            <span in:fade={{ duration: moveIn, delay: delay }} out:fade={{ duration: moveOut}}>
                {@html diffs.after}
            </span>
        {/key}
    </div>
</div>

<div class="mt-5">
    <h3 class="text-xl mb-2">
        Comments:
    </h3>
    <div class="bg-bg-light  rounded-lg p-4 transition:fade">
        {#key params.id}   
            <span in:fade={{ duration: moveIn, delay: delay }} out:fade={{ duration: moveOut}} >
                {selectedFineTune.comment ?? "No comment"}
            </span>
        {/key}  
    </div>
</div>
