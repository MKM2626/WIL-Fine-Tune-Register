<script lang="ts">
    let { children, params } = $props();
    import { search } from "#lib/remote/registers.remote";
    import { goto } from "$app/navigation";
    import { setSearchContext, type SearchInfo } from "#lib/context/search";
    import Toast from '#lib/components/Toast.svelte'
    import { downloadCSV } from '#lib/utils/downloadCSV';
    import { authClient } from '#lib/auth-client'
    import { setDeleteContext, type DeleteAndProceed } from '#lib/context/deleteAndProceed'
    import { onMount } from "svelte";
	import { SvelteSet } from "svelte/reactivity";

    const session = authClient.useSession() 

    let selectedId = $derived<string | null>(params.id ?? null)
    let searchInfo = $state<SearchInfo>({ page: 1, pageSize: 50, descending: true})
    let deleteAndProceed = $state<DeleteAndProceed>({ id: null})
    let searchFinalised = $state('')
    let searchGlobal = $state('')
    let expandedSearch = $state(false)
    
    setSearchContext(searchInfo)
    setDeleteContext(deleteAndProceed)

    // Inputs
    let globalSearchInput = $state('')
    let startInput = $state('')
    let endInput = $state('')
    let pageInput = $state(1);
    let ruleInput = $state('')
    let customerInput = $state('')
    let technologyInput = $state('')
    let analystInput = $state('')
    let fineTuneInput = $state('')
    let commentInput = $state('')

    let results = $derived(await search(searchInfo))

    onMount(() => {
        if (results) {
            goto(`/details/${results.rows[0].id}`)
        }
    })


    $effect(() => {
        const rows = results.rows;

        if (rows && selectedId !== null) {
            const current = rows.findIndex(row => row.id === selectedId);

            if (current !== -1 && current + 1 < rows.length) {
                const next = rows[current + 1].id;
                
                deleteAndProceed.id = next;
            }
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
        const search = globalSearchInput.trim()

        if (!search) return 

        if (!searchInfo.search) {
            searchInfo.search = new SvelteSet<string>()
        }

        if (!searchInfo.search.has(search)) {
            searchInfo.search.add(search)
        }
    
        globalSearchInput = ''
        searchInfo.page = 1
        pageInput = 1
    }

    function removeSearch(search: string) {
        if (!searchInfo.search) return;

        searchInfo.search.delete(search)

        if (searchInfo.search.size === 0) {
            delete searchInfo.search;
        }

        searchInfo.page = 1
        pageInput = 1
    }

    async function applyPage() {
        if (results) {
            const maxPage = results.totalPages
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
        if (results) {
            const maxPage = results.totalPages
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

    function searchGlobalBtn() {
        if (searchGlobal == '') {
            searchGlobal = 'true'
            searchInfo.global = true
            searchInfo.page = 1
            pageInput = 1

        } else if (searchGlobal == 'true') {
            searchGlobal = 'false'
            searchInfo.global = false
            searchInfo.page = 1
            pageInput = 1
        } else {
            searchGlobal = ''
            delete searchInfo.global
            searchInfo.page = 1
            pageInput = 1
        }
    }

    function applyAdvancedSearch(type: "rule" | "customer" | "technology" | "analyst" | "fine_tune" | "comment", search: string) {
        if (search.trim() === '') {
            delete searchInfo[type];
        } else {
            searchInfo[type] = search.trim();
        }
    }

    function ftClick(rowId: string) {
        // if (!results && results) {
            goto(`/details/${rowId}`)
        // }
    }
</script>

<div class="flex w-screen h-screen overflow-hidden">
    
    <div class="flex-4/10 w-110 min-w-90 p-6 bg-bg-dark text-text flex flex-col overflow-hidden">
        <div class="flex flex-wrap gap-3 items-center justify-between">
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
                
                <div class="gap-3 mx-auto">
                    <button 
                        type="button"
                        class="px-4 py-2 font-semibold rounded-lg bg-bg-light hover:brightness-125 transition-all duration-250 ease-out"
                        onclick={()=>downloadCSV(searchInfo)}
                    >
                        Export
                    </button>
                </div>

                <div class="gap-3">
                    <button 
                        type="button"
                        class="px-4 py-2 font-semibold rounded-lg bg-bg-light hover:brightness-125 transition-all duration-250 ease-out"
                        onclick={async () => {await authClient.signOut(), goto('/login')}}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
        

        <div class="pt-3 flex flex-col gap-5">

            <div class='flex gap-4'>
                <div class='flex grow flex-wrap gap-x-4 gap-y-2'>
                    <div class="flex flex-col grow gap-1">
                        <label for='dateFrom' class="text-text-muted text-xs font-medium">From:</label>
                        <input type="date" bind:value={startInput} onblur={applyStart} class="full-w min-w-0 px-3 py-2 text-text bg-bg-light border border-border rounded-lg hover:border-action/60 focus:border-action transition-all duration-250 ease-out">
                    </div>

                    <div class="flex flex-col grow gap-1">
                        <label for='dateTo' class="text-text-muted text-xs font-medium">To:</label>
                        <input type="date" bind:value={endInput} onblur={applyEnd} class="full-w min-w-0 px-3 py-2 text-text bg-bg-light border border-border rounded-lg hover:border-action/60 focus:border-action transition-all duration-250 ease-out">
                    </div>
                </div>

                <div class='flex flex-wrap gap-x-4 gap-y-2 justify-end items-end'>
                    <button
                        type="button"
                        onclick={() => searchInfo.descending = !searchInfo.descending}
                        class="flex w-12 h-11 bg-bg-light justify-center items-center text-text border border-border rounded-lg hover:border-action transition-all duration-250 ease-out"
                    >
                        {searchInfo.descending ? "▼" : "▲"}
                    </button>

                    <button
                        type="button"
                        onclick={() => clearDate()}
                        class="flex w-12 h-11 bg-bg-light justify-center items-center text-text border border-border rounded-lg hover:border-action transition-all duration-250 ease-out"
                    >
                        clear
                    </button>
                </div>
            </div>


            

            

            <div>
                <div class="flex gap-x-4 gap-y-2 items-center">
                    <input 
                        class="w-full py-2 px-4 bg-bg-light rounded-lg border border-border outline-none hover:border-action/60 focus:border-action transition-all duration-250 ease-out"
                        type="text" 
                        placeholder="Search" 
                        bind:value={globalSearchInput}
                        onkeydown={(e) => {
                            if (e.key === "Enter") applySearch();
                        }}
                    >
                    
                    <button
                        onclick={()=>searchGlobalBtn()}
                        class="rounded-lg w-12 h-11 shrink-0 items-center justify-center shadow-sm flex before:text-white before:text-xs before:font-medium border border-border outline-none hover:border-action transition-all duration-250 ease-out
                                {searchGlobal == "true" ? "bg-green-500/90" : searchGlobal == "false" ? "bg-red-500/90" : "bg-bg-light"}
                                "
                    >
                        🌐
                    </button>

                    <button
                        onclick={()=>searchFinalisedBtn()}
                        class="rounded-lg shadow-sm flex w-12 h-11 shrink-0 items-center justify-center before:text-white before:text-xs before:font-medium border border-border outline-none hover:border-action transition-all duration-250 ease-out
                                {searchFinalised == "true" ? "bg-green-500/90" : searchFinalised == "false" ? "bg-red-500/90" : "bg-bg-light"}
                                "
                    >
                        {searchFinalised == "true" ? "✗" : searchFinalised == "false" ? "✓" : "—"}
                    </button>

                    <button
                        onclick={()=>{expandedSearch = !expandedSearch}}
                        class="rounded-lg w-12 h-11 shrink-0 bg-bg-light shadow-sm flex items-center justify-center before:text-white before:text-xs before:font-medium border border-border outline-none hover:border-action transition-all duration-250 ease-out}"
                    >
                        {expandedSearch ?  "▲" : "▼"}
                    </button>
                </div>

                {#if (searchInfo.search?.size ?? 0) > 0} 
                    <div class="max-h-24 flex flex-wrap overflow-y-auto items-center gap-2 mt-4 pr-1">
                        {#each searchInfo.search as search}
                            <button
                                type="button"
                                onclick={()=>removeSearch(search)}
                                // class="px-3 py-1.5 bg-bg-light rounded-lg border-2 border-border outline-none hover:border-action transition-all duration-250 ease-out"
                                class="items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-action/10 text-indigo-300 border border-action/30 outline-none hover:border-action transition-all duration-250 ease-out"
                            >
                                {search} x
                            </button>
                        {/each}
                    </div>
                {/if}

                {#if expandedSearch}
                    <div class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-3">
                        <div class="flex flex-col gap-1">
                            <label for="rule" class="text-xs font-medium text-text-muted">Rule:</label>
                            <input 
                                type="text" 
                                placeholder="Search rule..." 
                                class="px-3 py-1.5 bg-bg-light border border-border rounded-md text-sm text-text focus:outline-none focus:border-action hover:border-action/60 transition-all duration-250 ease-out"
                                bind:value={ruleInput}
                                oninput={(e) => {
                                    const target = e.currentTarget;
                                    clearTimeout(Number(target.dataset.timerId));
                                    target.dataset.timerId = String(setTimeout(() => {
                                    applyAdvancedSearch("rule", target.value);
                                    }, 500)); 
                                }} 
                            >
                        </div>

                        <div class="flex flex-col gap-1">
                            <label for="customer" class="text-xs font-medium text-text-muted">Customer:</label>
                            <input 
                                type="text" 
                                placeholder="Search customer..." 
                                class="px-3 py-1.5 bg-bg-light border border-border rounded-md text-sm text-text focus:outline-none focus:border-action hover:border-action/60 transition-all duration-250 ease-out"
                                bind:value={customerInput}
                                oninput={(e) => {
                                    const target = e.currentTarget;
                                    clearTimeout(Number(target.dataset.timerId));
                                    target.dataset.timerId = String(setTimeout(() => {
                                    applyAdvancedSearch("customer", target.value);
                                    }, 500)); 
                                }} 
                            >
                        </div>

                        <div class="flex flex-col gap-1">
                            <label for="technology" class="text-xs font-medium text-text-muted">Technology:</label>
                            <input 
                                type="text" 
                                placeholder="Search technology..." 
                                class="px-3 py-1.5 bg-bg-light border border-border rounded-md text-sm text-text focus:outline-none focus:border-action hover:border-action/60 transition-all duration-250 ease-out"
                                bind:value={technologyInput}
                                oninput={(e) => {
                                    const target = e.currentTarget;
                                    clearTimeout(Number(target.dataset.timerId));
                                    target.dataset.timerId = String(setTimeout(() => {
                                    applyAdvancedSearch("technology", target.value);
                                    }, 500)); 
                                }} 
                            >
                        </div>

                        <div class="flex flex-col gap-1">
                            <label for="analyst" class="text-xs font-medium text-text-muted">Analyst:</label>
                            <!-- bind target value for persistence -->
                            <input 
                                type="text" 
                                placeholder="Search analyst..." 
                                class="px-3 py-1.5 bg-bg-light border border-border rounded-md text-sm text-text focus:outline-none focus:border-action hover:border-action/60 transition-all duration-250 ease-out"
                                bind:value={analystInput}
                                oninput={(e) => {
                                    const target = e.currentTarget;
                                    clearTimeout(Number(target.dataset.timerId));
                                    target.dataset.timerId = String(setTimeout(() => {
                                    applyAdvancedSearch("analyst", target.value);
                                    }, 500)); 
                                }} 
                            >
                        </div>

                        <div class="flex flex-col gap-1">
                            <label for="ft" class="text-xs font-medium text-text-muted">Fine tune:</label>
                            <input 
                                type="text" 
                                placeholder="Search fine tune..." 
                                class="px-3 py-1.5 bg-bg-light border border-border rounded-md text-sm text-text focus:outline-none focus:border-action hover:border-action/60 transition-all duration-250 ease-out"
                                bind:value={fineTuneInput}
                                oninput={(e) => {
                                    const target = e.currentTarget;
                                    clearTimeout(Number(target.dataset.timerId));
                                    target.dataset.timerId = String(setTimeout(() => {
                                    applyAdvancedSearch("fine_tune", target.value);
                                    }, 500)); 
                                }} 
                            >
                        </div>

                        <div class="flex flex-col gap-1">
                            <label for="comment" class="text-xs font-medium text-text-muted">Comment:</label>
                            <input 
                                type="text" 
                                placeholder="Search rule..." 
                                class="px-3 py-1.5 bg-bg-light border border-border rounded-md text-sm text-text focus:outline-none focus:border-action hover:border-action/60 transition-all duration-250 ease-out"
                                bind:value={commentInput}
                                oninput={(e) => {
                                    const target = e.currentTarget;
                                    clearTimeout(Number(target.dataset.timerId));
                                    target.dataset.timerId = String(setTimeout(() => {
                                    applyAdvancedSearch("comment", target.value);
                                    }, 500)); 
                                }} 
                            >
                        </div>
                    </div>
                {/if}

            </div>
        </div>

        <div class="py-5">
            <div class=" border-4 border-bg-light rounded-lg"></div>
        </div>
            

        <div class="flex-1 overflow-y-auto flex flex-col gap-3">
            {#if results}
                {#each results.rows as row}
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
                            </div>  
                        </div>
                    </button>
                {/each}
            {/if}

            <!-- {#if results.loading}
                <div class="absolute inset-0 pointer-events-none">
                    <div class="flex flex-col gap-3">
                        {#each Array(10) as _}
                            <div class="h-[76px] rounded-lg bg-bg-light animate-pulse"></div>
                        {/each}
                    </div>
                </div>
            {/if} -->

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
                    
                        class="field-sizing-content min-w-5 px-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        type="number"
                        bind:value={pageInput}
                        max={results ? results.totalPages : 0}
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
                        {results ? results.totalPages : 0}
                    </span>
                </div>

                <button
                    class="px-1"
                     type="button"
                     onclick={nextPage}
                     disabled={results ? searchInfo.page >= results.totalPages : true}
                  >
                     »
                </button>
            </div>
        </div>
    </div>

    <div class="flex-7/10 p-6 bg-bg border-l border-border text-text overflow-y-auto">
    <!-- FIX LOADING FROM FLASHING -->
        <!-- {#if results.loading} 
            <p>hiu</p>
        {:else if results.current} -->
            {@render children()}
        <!-- {/if} -->
    </div>
</div>

<Toast />

