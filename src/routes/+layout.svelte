<script lang="ts">
    let { children } = $props();
    import './layout.css'
    import { search } from "#lib/remote/registers.remote";
    import { goto } from "$app/navigation"
    import { setSearchContext, type SearchInfo } from "#lib/context/search";
    import  Toast  from '#lib/components/Toast.svelte'
    import { downloadCSV } from '#lib/utils/downloadCSV';


    // The results from call
    // let searchInfo = $state({search: undefined, page: 1, pageSize: 500, descending: true, start: undefined, end: undefined})

    let selectedId = $state()

    let searchInfo = $state<SearchInfo>({ page: 1, pageSize: 12, descending: true})

    setSearchContext(searchInfo)

    // Inputs
    let searchInput = $state("")
    let startInput = $state('')
    let endInput = $state('')
    let pageInput = $state(1);
    
    let results = $derived(await search(searchInfo))

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
            searchInfo.search = []
        }

        if (!searchInfo.search.includes(search)) {
            searchInfo.search.push(search)
        }
    
        searchInput = ''
        searchInfo.page = 1
        pageInput = 1
    }

    function removeSearch(search: string) {
        if (!searchInfo.search) return;

        searchInfo.search = searchInfo.search.filter(
            (item) => item !== search
        );

        if (searchInfo.search.length === 0) {
            delete searchInfo.search;
        }

        searchInfo.page = 1
        pageInput = 1
    }

    async function applyPage() {
        const maxPage = (await results).totalPages
        if (pageInput < 1) {
            pageInput = 1;
        }
        if (pageInput > maxPage) {
            pageInput = maxPage
        }

        searchInfo.page = pageInput;
    }

    async function previousPage() {
        if (searchInfo.page > 1) {
            searchInfo.page--;
            pageInput = searchInfo.page;

        }
    }

    async function nextPage() {
        const maxPage = (await results).totalPages
        if (searchInfo.page < maxPage) {
            searchInfo.page++;
            pageInput = searchInfo.page;

        }
    }

    let searchFinalised = $state('')

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
</script>

<div class="flex w-screen h-screen overflow-hidden">
    
    <div class="flex-4/10 w-110 min-w-90 p-6 bg-bg-dark text-text flex flex-col overflow-hidden">
        
        <div class="flex items-center justify-between">
            <header class="text-3xl">
                Fine Tunes
            </header>

            <div class='gap-4 flex flex-row'>
                <div class="gap-3">
                    <button 
                        class="px-4 py-2 font-bold rounded-lg bg-bg-light hover:brightness-125 transition-all duration-250 ease-out"
                        onclick={()=>goto(`/create`)} 
                    >
                        Create
                    </button>
                </div>

                <div class="gap-3">
                    <button 
                        type="button"
                        class="px-4 py-2 font-bold rounded-lg bg-bg-light hover:brightness-125 transition-all duration-250 ease-out"
                        onclick={()=>downloadCSV(searchInfo)}
                    >
                        Export
                    </button>
                </div>
            </div>
            

        </div>
        

        <div class="pt-5 flex flex-col gap-5">
            <!-- next iteration, put buttons outside of card. Like search box -->
            <div class="py-3 px-4 bg-bg-light rounded-lg flex flex-wrap items-end-safe gap-4">
                <!-- <div class="flex-1 flex flex-wrap gap-3"> -->
                    <div class="flex-1 flex flex-wrap items-center gap-1">
                        <span class="shrink-0 text-sm text-text-muted">From:</span>
                        <input type="date" bind:value={startInput} onblur={applyStart} class="full-w min-w-0 px-3 py-2 text-text bg-bg border-2 border-border rounded-lg hover:border-action/60 focus:border-action transition-all duration-250 ease-out">
                    </div>

                    <div class="flex-1 flex flex-wrap items-center gap-1">
                        <span class="shrink-0 text-sm text-text-muted">To:</span>
                        <input type="date" bind:value={endInput} onblur={applyEnd} class="full-w min-w-0 px-3 py-2 text-text bg-bg border-2 border-border rounded-lg hover:border-action/60 focus:border-action transition-all duration-250 ease-out">
                    </div>
                <!-- </div> -->

                <div class="shrink-0 flex justify-between gap-2">
                    <button
                        type="button"
                        onclick={() => searchInfo.descending = !searchInfo.descending}
                        class="w-11 h-10 flex items-center justify-center bg-bg text-text border-2 border-border rounded-lg hover:border-action transition-all duration-250 ease-out"
                    >
                        {searchInfo.descending ? "▼" : "▲"}
                    </button>

                    <button
                        type="button"
                        onclick={() => clearDate()}
                        class="w-11 h-10 flex items-center justify-center bg-bg text-text border-2 border-border rounded-lg hover:border-action transition-all duration-250 ease-out"
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
                        placeholder="Search - (rule customer tech)" 
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

                {#if searchInfo.search?.length} 
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

        
        <!-- <div class="flex-1 overflow-y-auto flex flex-col gap-3 pt-5 border-t-4 border-border">
            {#each (await testSearch(searchInfo)).rows as row}
                <button
                    class="py-5 bg-bg-light rounded-lg border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end"
                    onclick={() => goto(`/test/details/${row.id}`)}
                >
                    {row.date.toLocaleDateString()} - {row.rule} - {row.customer} - {row.technology}
                </button>
            {/each}
        </div> -->

        <div class="py-5">
            <div class=" border-4 border-bg-light rounded-lg"></div>
        </div>
            

        <div class="flex-1 overflow-y-auto flex flex-col gap-3">
            {#each (await results).rows as row}
                <button
                    class="px-5 py-3 bg-bg-light rounded-lg text-wrap text-left transition-all duration-250 ease-out border-l-0 border-l-bg-light hover:brightness-125
                        {selectedId == row.id ? "border-l-5 border-l-indigo-500" : " "}"

                    onclick={() => {
                        selectedId = row.id
                        goto(`/details/${row.id}`);
                    }}
                >
                    <div class="flex flex-col gap-1 items-start">
                        <div class="flex w-full justify-between items-center">
                            <span class="text-xl">{row.date.toLocaleDateString()}</span>
                            <input type="checkbox" checked={row.finalised} disabled class="appearance-none h-5 w-5 rounded-xs shadow-sm border border-red-500 bg-red-500 flex items-center justify-center before:content-['✗'] before:text-white before:text-xs before:font-medium checked:bg-green-500 checked:border-green-500 checked:before:content-['✓']">
                        </div>
                        <div class="text flex flex-wrap items-center gap-x-5">
                            <span class="text-lg">{row.rule}</span> 
                            <span class="text-sm">{row.customer}</span>  
                            <!-- <span class="text-sm">{row.technology}</span> -->
                        </div>  
                    </div>
                </button>
            {/each}
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
                        max={(await results).totalPages}
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
                        {(await results).totalPages}
                    </span>
                </div>

                <button
                    class="px-1"
                     type="button"
                     onclick={nextPage}
                     disabled={searchInfo.page >= (await results).totalPages}
                  >
                     »
                </button>
            </div>
        </div>
    </div>

    <div class="flex-7/10 p-6 bg-bg border-l border-border text-text overflow-y-auto">
        {@render children()}
    </div>
</div>

<Toast />

