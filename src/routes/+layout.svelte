<script lang="ts">
    let { children } = $props();
    import './layout.css'
    import { search } from "#lib/remote/registers.remote";
    import { goto } from "$app/navigation"
    import { setSearchContext, type SearchInfo } from "#lib/context/search";

     // The results from call
    // let searchInfo = $state({search: undefined, page: 1, pageSize: 500, descending: true, start: undefined, end: undefined})

    let searchInfo = $state<SearchInfo>({ page: 1, pageSize: 12, descending: true})

    let selectedId = $state()

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
        }
    }

    function applyEnd() { 
        // searchInfo.start = new Date(startInput)
        if (startInput != "" && startInput < endInput) {
            searchInfo.end = new Date(endInput)
        }
        else {
            clearDate()
        }
            

    }

    function applySearch() {
        if (searchInput == "") {
            delete searchInfo.search
        }
        else { 
            searchInfo.search = searchInput
        }

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

     let dateValue = $state("");
  let isFocused = $state(false);

  // Dynamically evaluate the input type to trick Safari
  let inputType = $derived(isFocused || dateValue ? "date" : "text");
</script>

<div class="flex w-screen min-w-fit h-screen overflow-hidden">
    
    <div class="flex-4/10 w-110 min-w-95 p-6 bg-bg-dark text-text flex flex-col overflow-hidden">
        
        <div class="flex items-center justify-between">
            <header class="text-3xl">
                Fine Tunes
            </header>

            <div class="flex gap-3">
                <button 
                    class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
                    onclick={()=>goto(`/create`)} 
                >
                    Create
                </button>
            </div>

        </div>
        

        <div class="py-5 flex flex-col gap-5">
            <div class="py-3 px-4 bg-bg-light rounded-lg border border-border flex justify-between gap-4">
                
                <div class="flex flex-col gap-2">

                    <label class="flex items-center gap-3">
                        <span class="w-12 shrink-0 text-text">
                            From:
                        </span>

                        <div class="relative bg-bg-light rounded-lg border border-border">
                            <!-- {#if !startInput}
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    00/00/0000
                                </span>
                            {/if}

                            <input
                                type="date"
                                bind:value={startInput}
                                class:text-transparent={!startInput}
                                onblur={applyStart}
                                class="w-full px-3 py-2 bg-transparent outline-none rounded-lg text-text"> -->

                            <!-- make chrome date picker icon white -->
                            <input type="date" bind:value={startInput} onblur={applyStart} class="w-full px-3 py-2 text-text">

                        </div>
                    </label>

                    <label class="flex items-center gap-3">
                        <span class="w-12 shrink-0 text-text">
                            To:
                        </span>

                        <div class="relative bg-bg-light rounded-lg border border-border flex items-center">
                            <!-- {#if !endInput}
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                                    00/00/0000
                                </span>
                            {/if}

                            <input
                                type="date"
                                bind:value={endInput}
                                class:text-transparent={!endInput}
                                onblur={applyEnd}
                                class="w-full px-3 py-2 bg-transparent outline-none rounded-lg text-text"
                            > -->

                            <input type="date" bind:value={endInput} class="w-full px-3 py-2 text-text">
                        </div>
                    </label>
                </div>


                <div class="flex flex-col justify-center gap-2">
                    <button
                        type="button"
                        onclick={() => searchInfo.descending = !searchInfo.descending}
                        class="w-11 h-10 flex items-center justify-center rounded-md border border-border bg-bg hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
                    >
                        {searchInfo.descending ? "▼" : "▲"}
                    </button>

                    <button
                        type="button"
                        onclick={() => clearDate()}
                        class="w-11 h-10 rounded-md bg-bg text-text hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
                    >
                      clear
                      <!-- use icon instead -->
                    </button>
                </div>
                
            </div>

            <div>
                <input 
                    class="w-full py-2 px-4 bg-bg-light rounded-lg border border-border outline-none"
                    type="text" 
                    placeholder="Search - (rule, customer, tech)" 
                    bind:value={searchInput}
                    onblur={applySearch}
                    onkeydown={(e) => {
                        if (e.key === "Enter") applySearch();
                    }}
                >
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


        <!-- Myabe make button into column, and make information different colours -->
        <div class="flex-1 overflow-y-auto flex flex-col gap-3 pt-5 border-t-4 border-border">
            {#each (await search(searchInfo)).rows as row}
                <button
                    class="p-5 bg-bg rounded-lg border border-border text-wrap text-left hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end"
                    class:bg-bg-light={selectedId === row.id}
                    onclick={() => {
                        selectedId = row.id;
                        goto(`/details/${row.id}`);
                    }}
                >
                    <!-- <span>{row.date.toLocaleDateString()} - {row.rule} - {row.customer} - {row.technology}</span> -->
                    <div class="grid grid-rows-4">
                        <div class="text-lg flex justify-between">{row.date.toLocaleDateString()} {row.rule}</div>  
                        <!-- <span class="text">{row.rule}</span>   -->
                        <span class="text-sm">{row.customer}</span>  
                        <span class="text-sm">{row.technology}</span>
                    </div>
                   
                </button>
            {/each}
        </div>



        <div class="pt-5  flex items-center justify-center">
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

    <div class="flex-6/10 p-6 bg-bg border-l border-border text-text overflow-y-auto">
        {@render children()}
    </div>
</div>