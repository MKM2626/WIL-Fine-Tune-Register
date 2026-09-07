<script lang="ts">
    let { children, params } = $props();
    import { search } from "#lib/remote/registers.remote";
    import { goto } from "$app/navigation";
    import { setSearchContext, type SearchInfo } from "#lib/context/search";
    import  Toast  from '#lib/components/Toast.svelte';
    import { downloadCSV } from '#lib/utils/downloadCSV';
    import { authClient } from '#lib/auth-client'
    // import { setIsDelete, type IsDelete } from '#lib/context/deleteNextDetail'
    import { onMount } from "svelte";
	import { SvelteSet } from "svelte/reactivity";

    const session = authClient.useSession() 

    let selectedId = $derived<string | null>(params.id ?? null)
    let searchInfo = $state<SearchInfo>({ page: 1, pageSize: 12, descending: true})
    // let isDelete = $state<IsDelete>({ bool: false})

    let searchFinalised = $state('')
    
    setSearchContext(searchInfo)

    // setIsDelete(isDelete)

    // Inputs
    let searchInput = $state("")
    let startInput = $state('')
    let endInput = $state('')
    let pageInput = $state(1);
    
    let results = $derived(search(searchInfo))

    onMount(() => {
        if (results.current) {
            goto(`/details/${results.current.rows[0].id}`)
        }
    })

    function clearDate() {
        startInput = ''
        endInput = ''
        delete searchInfo.start
        delete searchInfo.end
    }

    function applyStart() {
        if (startInput !== "") {
            searchInfo.start = new Date(startInput)
            searchInfo.page = 1
            pageInput = 1
        }
    }

    function applyEnd() { 
        // searchInfo.start = new Date(startInput)
        if (startInput != "" && startInput < endInput) {
            searchInfo.end = new Date(endInput)
            searchInfo.page = 1
            pageInput = 1
        }
        else {
            clearDate()
        }
            

    }

    function applySearch() {
        const search = searchInput.trim()

        if (!search) return 

        if (!searchInfo.search) {
            searchInfo.search = new SvelteSet<string>()
        }

        // const currentSearch = searchInfo.search ?? [];
        if (!searchInfo.search.has(search)) {
            searchInfo.search.add(search)
            // searchInfo = {
            //     ...searchInfo,
            //     search: [...currentSearch, searchVal],
            //     page: 1
            // };
        }
    
        // goto('/')
        searchInput = ''
        searchInfo.page = 1
        pageInput = 1
    }

    function removeSearch(search: string) {
        if (!searchInfo.search) return;

        // searchInfo.search = searchInfo.search.filter(
        //     (item) => item !== search
        // );

        searchInfo.search.delete(search)

        if (searchInfo.search.size === 0) {
            delete searchInfo.search;
        }

        searchInfo.page = 1
        pageInput = 1
    }

    async function applyPage() {
        if (results.current) {
            const maxPage = results.current.totalPages
            if (pageInput < 1) {
                pageInput = 1;
            }
            if (pageInput > maxPage) {
                pageInput = maxPage
            }

            searchInfo.page = pageInput;
            }
    }

    async function previousPage() {
        if (searchInfo.page > 1) {
            searchInfo.page--;
            pageInput = searchInfo.page;

        }
    }

    async function nextPage() {
        if (results.current) {
            const maxPage = results.current.totalPages
            if (searchInfo.page < maxPage) {
                searchInfo.page++;
                pageInput = searchInfo.page;
            }
        }

        
    }

    function searchFinalisedBtn() {
        if (searchFinalised == '') {
            searchFinalised = 'true'
            searchInfo.finalised = true
            searchInfo.page = 1
            pageInput = 1

        } else if (searchFinalised == 'true') {
            searchFinalised = 'false'
            searchInfo.finalised = false
            searchInfo.page = 1
            pageInput = 1
        } else {
            searchFinalised = ''
            delete searchInfo.finalised
            searchInfo.page = 1
            pageInput = 1
        }
    }

    function ftClick(rowId: string) {
        if (!results.loading && results.current) {
            goto(`/details/${rowId}`)
        }

        // if (selectedId.id == rowId) {
        //     selectedId.id = null
        //     goto('/')
        //     return
        // }
        

    }

    // function deleteNextDetail() {
    //     goto(`/details/${results.rows[0].id}`)
    // }
</script>

<div class="flex w-screen h-screen overflow-hidden">
    
    <div class="flex-4/10 w-110 min-w-90 p-6 bg-bg-dark text-text flex flex-col overflow-hidden">
        <div class="flex items-center justify-between">
            <header class="text-3xl">
                Fine Tunes
            </header>

            <div class='gap-4 flex flex-row'>
                {#if $session.data?.user.teams.includes('admin') || $session.data?.user.teams.includes('senior')}
                    <div class="gap-3">
                        <button 
                            class="px-4 py-2 font-semibold rounded-lg bg-bg-light hover:brightness-125 transition-all duration-250 ease-out"
                            onclick={()=>goto(`/create`)} 
                        >
                            Create
                        </button>
                    </div>
                {/if}
                
                <div class="gap-3">
                    <button 
                        type="button"
                        class="px-4 py-2 font-semibold rounded-lg bg-bg-light hover:brightness-125 transition-all duration-250 ease-out"
                        onclick={()=>downloadCSV(searchInfo)}
                    >
                        Export
                    </button>
                </div>
            </div>
        </div>
        

        <div class="pt-5 flex flex-col gap-5">
            <div class="flex gap-x-4">
                <div class="flex grow items-start flex-wrap gap-4">
                    <div class="flex grow justify-between gap-4">
                        <span class="text-text">From:</span>
                        <input type="date" bind:value={startInput} onblur={applyStart} class="full-w min-w-0 px-3 py-2 text-text bg-bg-light border-2 border-border rounded-lg hover:border-action/60 focus:border-action transition-all duration-250 ease-out">
                    </div>

                    <div class="flex grow justify-between gap-4">
                        <span class="text-text">To:</span>
                        <input type="date" bind:value={endInput} onblur={applyEnd} class="full-w min-w-0 px-3 py-2 text-text bg-bg-light border-2 border-border rounded-lg hover:border-action/60 focus:border-action transition-all duration-250 ease-out">
                    </div>
                </div>

                <div class="flex  flex-wrap justify-end gap-y-4 gap-4">
                    <button
                        type="button"
                        onclick={() => searchInfo.descending = !searchInfo.descending}
                        class="w-13 h-11 bg-bg-light text-text border-2 border-border rounded-lg hover:border-action transition-all duration-250 ease-out"
                    >
                        {searchInfo.descending ? "▼" : "▲"}
                    </button>

                    <button
                        type="button"
                        onclick={() => clearDate()}
                        class="w-13 h-11  bg-bg-light text-text border-2 border-border rounded-lg hover:border-action transition-all duration-250 ease-out"
                    >
                        clear
                    </button>
                </div>
            </div>

            

            <div>
                <div class="flex flex-row gap-x-4 items-center">
                    <input 
                        class="w-full py-2 px-4 bg-bg-light rounded-lg border-2 border-border outline-none hover:border-action/60 focus:border-action transition-all duration-250 ease-out"
                        type="text" 
                        placeholder="Search" 
                        bind:value={searchInput}
                        onblur={applySearch}
                        onkeydown={(e) => {
                            if (e.key === "Enter") applySearch();
                        }}
                    >

                    <button
                        onclick={()=>searchFinalisedBtn()}
                        class="rounded-lg py-2 px-4 shadow-sm flex items-center justify-center before:text-white before:text-xs before:font-medium border-2 border-border outline-none hover:border-action transition-all duration-250 ease-out
                                {searchFinalised == "true" ? "bg-green-500" : searchFinalised == "false" ? "bg-red-500" : "bg-bg-light"}
                                "
                    >
                        {searchFinalised == "true" ? "✗" : searchFinalised == "false" ? "✓" : "—"}
                    </button>
                </div>

                {#if (searchInfo.search?.size ?? 0) > 0} 
                    <div class="max-h-24 flex flex-wrap overflow-y-auto items-center gap-2 mt-2 pr-1">
                        {#each searchInfo.search as search}
                            <button
                                type="button"
                                onclick={()=>removeSearch(search)}
                                class="px-3 py-1.5 bg-bg-light rounded-lg border-2 border-border outline-none hover:border-action transition-all duration-250 ease-out"
                            >
                                {search} x
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>


        </div>


        <div class="py-5">
            <div class=" border-4 border-bg-light rounded-lg"></div>
        </div>
            

        <div class="flex-1 overflow-y-auto flex flex-col gap-3">

            {#if results.error}
                <p>error</p>
            {:else if results.loading}
                <p>loading</p>
            {:else if results.ready}
                {#each results.current.rows as row}
                    <button
                        class="px-5 py-3 bg-bg-light rounded-lg text-wrap text-left transition-all duration-250 ease-out border-l-0 border-l-bg-light hover:brightness-125
                            {selectedId === row.id ? "border-l-5 border-l-indigo-500" : " "}"

                        onclick={() => ftClick(row.id)}
                    >
                        <div class="flex flex-col gap-1 items-start">
                            <div class="flex w-full justify-between items-center">
                                <span class="text-xl">{row.date.toLocaleDateString()}</span>
                                <input type="checkbox" checked={row.finalised} disabled class="appearance-none h-5 w-5 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']">
                            </div>
                            <div class="text flex flex-wrap items-center gap-x-5">
                                <span class="text-lg">{row.customer}</span> 
                                <span class="text-sm">{row.rule}</span>  
                                <!-- <span class="text-sm">{row.technology}</span> -->
                            </div>  
                        </div>
                    </button>
                {/each}
            {/if}

        </div>

        <div class="pt-5 flex items-center justify-center">
            <div class="flex items-center justify-center">
                <button
                    class="px-1"
                     type="button"
                     onclick={previousPage}
                     disabled={searchInfo.page < 2}
                  >
                     «
                </button>

                <div>
                    
                    <input
                    
                        class="w-5 px-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        type="number"
                        bind:value={pageInput}
                        max={results.current ? results.current.totalPages : 0}
                        onblur={applyPage}
                        onkeydown={(e) => {
                            if (e.key === "Enter") applyPage();
                        }}
                    />
                    <span
                    class="px-1"
                    >
                        /
                    </span>
                    <span
                        class="px-1"
                    >
                        {results.current ? results.current.totalPages : 0}
                    </span>
                </div>

                <button
                    class="px-1"
                     type="button"
                     onclick={nextPage}
                     disabled={results.current ? searchInfo.page >= results.current.totalPages : true}
                  >
                     »
                </button>
            </div>
        </div>
    </div>

    <div class="flex-7/10 p-6 bg-bg border-l border-border text-text overflow-y-auto">
        {#if results.loading} 
            <p>hiu</p>
        {:else if results.current}
            {@render children()}
        {/if}
    </div>
</div>

<Toast />

