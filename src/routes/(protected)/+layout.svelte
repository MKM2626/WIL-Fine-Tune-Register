<script lang="ts">
    let { children, params } = $props();
    import { getCustomerRules } from '#lib/remote/getCustomerRules.remote'
    import { goto } from "$app/navigation";
    import { setCRSearchContext, type CRSearchInfo } from "#lib/context/customerRuleSearch";
    import Toast from '#lib/components/Toast.svelte'
    import FilterToggle from '#lib/components/FilterToggle.svelte';
    import { downloadCSV } from '#lib/utils/downloadCSV';
    import { authClient } from '#lib/auth-client'
    import { setNextContext, type crNextRow } from '#lib/context/crNextRow'
    import { onMount } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { slide } from 'svelte/transition';
    import { LogOut, Download, SquarePlus, CalendarArrowDown, CalendarArrowUp, X, ListFilter, ChevronsLeft, ChevronsRight, CalendarDays, CalendarClock, Globe, CircleCheck, CircleX} from '@lucide/svelte/icons'
    import { atLeast } from '#lib/roles'

    // Session
    const session = authClient.useSession() 

    // Selected id pull
    let selectedId = $derived<string | null>(params.customerRuleId ?? null)
    // Search input
    let crSearchInfo = $state<CRSearchInfo>({ page: 1, pageSize: 50, descending: true, isFineTuneSort: true})
    // Set next row
    let deleteAndProceed = $state<crNextRow>({ id: null})
    
    // Filter buttons
    let searchFinalised = $state('')
    let searchGlobal = $state('')
    let searchExpiryDate = $state('')
    let dateIsFineTune = $state(true)
    let expandedSearch = $state(false)
    
    // set search and delete context
    setCRSearchContext(crSearchInfo)
    setNextContext(deleteAndProceed)

    // Pagination input
    let pageInput = $state(1);

    // dates inputs
    let startDateInput = $state('')
    let endDateInput = $state('')

    

    // search fields
    const filterFields = [
        { key: 'search', label: 'Any field', prefix: 'Any' },

        { key: 'name', label: 'Fine tune name', prefix: 'N' },
        { key: 'fineTune', label: 'Fine tune', prefix: 'FT' },
        { key: 'rule', label: 'Rule', prefix: 'R' },
        { key: 'version', label: 'Version', prefix: 'V'},
        { key: 'customer', label: 'Customer', prefix: 'C' },
        
        { key: 'technology', label: 'Technology', prefix: 'T' },
        { key: 'analyst', label: 'Analyst', prefix: 'A' },
        { key: 'finalisedAnalyst', label: 'Finalised analyst', prefix: 'FA' },
        { key: 'comment', label: 'Comment', prefix: 'Cm' },
        { key: 'tags', label: 'Tag', prefix: '#' }
    ] as const // prevents change of key values, allowing typescript to use it

    // filter key type
    type FilterKey = (typeof filterFields)[number]["key"]


    // Inputs 
    let filterInputs = $state<Record<FilterKey, string>>({
        search: '', rule: '', version: '', customer: '', technology: '', fineTune: '', 
        name: '', analyst: '', finalisedAnalyst: '', comment: '', tags: ''
    })

    // Gets current number of filters applied
    const filterCount = $derived(
        filterFields.reduce((count, field) => count + (crSearchInfo[field.key]?.size ?? 0), 0)
    )


    let results = $derived(await getCustomerRules(crSearchInfo))

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

    function resetPage() {
        crSearchInfo.page = 1
        pageInput = 1
    }

    function addFilter(key: FilterKey, input: string) {
        const search = input.trim()
        if (search.trim() == '') return
        if (!crSearchInfo[key]) {
            crSearchInfo[key] = new SvelteSet<string>()
        }
        crSearchInfo[key].add(search)
        resetPage()
    }

    function removeFilter(key: FilterKey, value: string) {
        crSearchInfo[key]?.delete(value)
        if (!crSearchInfo[key]?.size) delete crSearchInfo[key]
        resetPage()
    }

    function submitInput(key: FilterKey) {
        addFilter(key, filterInputs[key])
        filterInputs[key] = ''
    }

    function clearDate() {
        startDateInput =  ''
        startDateInput = ''

        if (dateIsFineTune) {
            delete crSearchInfo.ftStart
            delete crSearchInfo.ftEnd
        }
        else {
            delete crSearchInfo.crStart
            delete crSearchInfo.crEnd
        }
        
    }

    function applyStart() {
        if (startDateInput !== "") {
            if (dateIsFineTune) crSearchInfo.ftStart = new Date(startDateInput)
            else crSearchInfo.crStart = new Date(startDateInput)

            resetPage()
        }
    }

    function applyEnd() { 
        if (startDateInput !== "" && startDateInput < endDateInput) {
            if (dateIsFineTune) crSearchInfo.ftEnd = new Date(endDateInput)
            else crSearchInfo.crEnd = new Date(endDateInput)
            resetPage()
        }
        else {
            clearDate()
        }
    }

    function toggleDate() {
        const oldPrefix = dateIsFineTune ? 'ft' : 'cr'

        delete crSearchInfo[`${oldPrefix}Start`]
        delete crSearchInfo[`${oldPrefix}End`]

        dateIsFineTune = !dateIsFineTune

        const newPrefix = dateIsFineTune ? 'ft' : 'cr'

        if (startDateInput) crSearchInfo[`${newPrefix}Start`] = new Date(startDateInput)
        if (endDateInput) crSearchInfo[`${newPrefix}End`] = new Date(endDateInput)

        crSearchInfo.isFineTuneSort = !crSearchInfo.isFineTuneSort
        resetPage()
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

            crSearchInfo.page = pageInput;
            }
    }

    async function previousPage() {
        if (crSearchInfo.page > 1) {
            crSearchInfo.page--;
            pageInput = crSearchInfo.page;
        }
    }

    async function nextPage() {
        if (results) {
            const maxPage = results.totalPages
            if (crSearchInfo.page < maxPage) {
                crSearchInfo.page++;
                pageInput = crSearchInfo.page;
            }
        }
    }

    function searchFinalisedBtn() {
        if (searchFinalised == '') {
            searchFinalised = 'true'
            crSearchInfo.finalised = true

        } else if (searchFinalised == 'true') {
            searchFinalised = 'false'
            crSearchInfo.finalised = false
        } else {
            searchFinalised = ''
            delete crSearchInfo.finalised
        }
        resetPage()
    }

    function searchGlobalBtn() {
        if (searchGlobal == '') {
            searchGlobal = 'true'
            crSearchInfo.global = true

        } else if (searchGlobal == 'true') {
            searchGlobal = 'false'
            crSearchInfo.global = false
        
        } else {
            searchGlobal = ''
            delete crSearchInfo.global

        }
        resetPage()
    }

    function searchExpiryBtn() {
        if (searchExpiryDate == '') {
            searchExpiryDate = 'true'
            crSearchInfo.expiryDate = true

        } else if (searchGlobal == 'true') {
            searchExpiryDate = 'false'
            crSearchInfo.expiryDate = false

        } else {
            searchExpiryDate = ''
            delete crSearchInfo.expiryDate
        }

        resetPage()
    }
</script>

<div class="flex w-screen h-screen overflow-hidden">
    
    <div class="flex-4/10 w-110 min-w-90  px-6 pt-4 pb-2 bg-bg-dark text-text flex flex-col overflow-hidden">
        <div class="flex gap-2 items-center justify-between">
            <h1 class="text-xl shrink-0 lg:text-2xl xl:text-3xl transition-all duration-400 ease-in-out">
                Customer Rules
            </h1>

            <div class='flex flex-row gap-2 xl:gap-4 transition-all duration-200 ease-in-out'>
                {#if atLeast($session.data?.user.role, 'senior')}
                    <button 
                        class="px-3 py-2 font-semibold rounded-lg bg-bg-light border border-border hover:brightness-125 transition-all duration-250 ease-out"
                        onclick={()=>goto(`/create`)} 
                    >
                        <SquarePlus />
                    </button>
                {/if}

                <button 
                    type="button"
                    class="px-3 py-2 font-semibold rounded-lg bg-bg-light border border-border hover:brightness-125 transition-all duration-250 ease-out"
                    onclick={()=>downloadCSV(crSearchInfo)}
                >
                    <Download />
                </button>

                <button 
                    type="button"
                    class="px-3 py-2 font-semibold rounded-lg bg-bg-light border border-border hover:brightness-125 transition-all duration-250 ease-out"
                    onclick={async () => {await authClient.signOut(); goto('/login')}}
                >
                    <LogOut />
                </button>
            </div>
        </div>
        

        <div class="pt-3 flex flex-col gap-y-4">

            <div class="flex flex-wrap gap-x-4 gap-y-2 ">

                <div class="flex min-w-0 grow  flex-col gap-1">
                    <label for="dateFrom" class="text-text-muted text-xs font-medium">From:</label>
                    <input id="dateFrom" type="date" bind:value={startDateInput} onblur={applyStart}
                        class="h-11 w-full min-w-0 px-3 text-text bg-bg-light border border-border rounded-lg hover:border-action/60 focus:border-action transition-all duration-250 ease-out">
                </div>

                <div class="flex min-w-0 grow items-end gap-4">
                    <div class="flex min-w-0 grow flex-col gap-1">
                        <label for="dateTo" class="text-text-muted text-xs font-medium">To:</label>
                        <input id="dateTo" type="date" bind:value={endDateInput} onblur={applyEnd}
                            class="h-11 w-full min-w-0 px-3 text-text bg-bg-light border border-border rounded-lg hover:border-action/60 focus:border-action transition-all duration-250 ease-out">
                    </div>

                    <button
                        type="button"
                        onclick={() => crSearchInfo.descending = !crSearchInfo.descending}
                        class="flex w-12 h-11 shrink-0 bg-bg-light justify-center items-center text-text border border-border rounded-lg hover:border-action transition-all duration-250 ease-out"
                    >
                        <!-- {crSearchInfo.descending ? "▼" : "▲"} -->
                        {#if crSearchInfo.descending}
                            <CalendarArrowDown />
                        {:else}
                             <CalendarArrowUp />
                        
                        {/if}
                    </button>

                    <button
                        type="button"
                        onclick={() => clearDate()}
                        class="flex w-12 h-11 shrink-0 bg-bg-light justify-center items-center text-text border border-border rounded-lg hover:border-action transition-all duration-250 ease-out"
                    >
                        <X />
                    </button>
                </div>
            </div>



            <div class="flex gap-x-4 gap-y-2 items-center">
                <input 
                    class="w-full py-2 px-4 bg-bg-light rounded-lg border border-border outline-none hover:border-action/60 focus:border-action transition-all duration-250 ease-out"
                    type="text" 
                    placeholder="Search" 
                    bind:value={filterInputs.search}
                    onkeydown={(e) => {
                        if (e.key === "Enter") submitInput('search');
                    }}
                >

                <button
                    onclick={()=>{expandedSearch = !expandedSearch}}
                    class="rounded-lg w-12 h-11 bg-bg-light shrink-0 shadow-sm flex items-center justify-center before:text-white before:text-xs before:font-medium border border-border outline-none hover:border-action transition-all duration-250 ease-out"

                >
                    <ListFilter class="transition-transform duration-300 {expandedSearch ? 'rotate-180' : ''}" />
                </button>
            </div>

            
            <!-- expandedSearch -->

                {#if expandedSearch}
                    <div transition:slide={{ duration: 300 }} class="overflow-hidden">

                        <div class="grid grid-cols-2 gap-x-4 gap-y-3 @sm:grid-cols-4">
                            <FilterToggle label="Date" type="mode" icon={CalendarDays}
                                value={dateIsFineTune ? 'Fine tune' : 'Rule'}
                                title="Which date the From/To range applies to"
                                onclick={toggleDate} />

                            <FilterToggle label="Expiry" icon={CalendarClock}
                                value={searchExpiryDate == 'true' ? 'Yes' : 'Any'}
                                type={searchExpiryDate == 'true' ? 'on' : 'off'}
                                title="First fine tune has an expiry date"
                                onclick={searchExpiryBtn} />

                            <FilterToggle label="Global" icon={Globe}
                                value={searchGlobal == 'true' ? 'Yes' : searchGlobal == 'false' ? 'No' : 'Any'}
                                type={searchGlobal == 'true' ? 'yes' : searchGlobal == 'false' ? 'no' : 'off'}
                                title="Rule has a global fine tune"
                                onclick={searchGlobalBtn} />


                            <FilterToggle label="Status" icon={searchFinalised == 'false' ? CircleX : CircleCheck}
                                value={searchFinalised == 'true' ? 'Finalised' : searchFinalised == 'false' ? 'Pending' : 'Any'}
                                type={searchFinalised == 'true' ? 'yes' : searchFinalised == 'false' ? 'pending' : 'off'}
                                title="Fine tune finalised or pending"
                                onclick={searchFinalisedBtn} />
                        </div>
                        

                        <div class="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-3">
                            {#each filterFields as field (field.key) }
                                {#if field.key !== 'search'}
                                    <input
                                        type="text"
                                        placeholder={field.label}
                                        aria-label={field.label}
                                        title="{field.label} (press Enter to add)"
                                        bind:value={filterInputs[field.key]}
                                        onkeydown={(e) => { if (e.key === "Enter") submitInput(field.key)}}
                                        class="min-w-0 px-3 py-1.5 bg-bg-light border border-border rounded-md text-sm text-text focus:outline-none focus:border-action hover:border-action/60 transition-all duration-250 ease-out"
                                    >
                                {/if}
                            {/each}
                        </div>
                        
                        
                    </div>
                {/if}

                {#if filterCount > 0}
                    <div class="mt-0 flex max-h-24 flex-wrap items-center gap-2 overflow-y-auto pr-1">
                        {#each filterFields as field (field.key)}
                            {#each crSearchInfo[field.key] ?? [] as filter (filter)}
                                <button
                                    type="button"
                                    title="Remove {field.label}: {filter}"
                                    onclick={() => removeFilter(field.key, filter)}
                                    class="flex items-stretch overflow-hidden rounded-full border border-action/30 bg-action/10 text-xs outline-none hover:border-action transition-all duration-250 ease-out"
                                >
                                    <span class="bg-action/20 px-2 py-1 font-semibold text-indigo-200">{field.prefix}</span>
                                    <span class="px-2 py-1 text-indigo-300">{filter} ×</span>
                                </button>
                            {/each}
                        {/each}
                    </div>
                {/if}
        </div>

        <div class="py-4">
            <div class=" border border-border rounded-lg"></div>
        </div>
            

        

        <div class="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
            {#if results}
                {#each results.rows as row (row.id)}
                    <button
                        type="button"
                        aria-current={selectedId === row.id ? 'true' : undefined}
                        onclick={() => goto(`/details/${row.id}`)}
                        class="relative w-full shrink-0 overflow-hidden rounded-lg border py-2.5 pr-4 pl-5 text-left transition-colors duration-250 ease-out focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action/60
                            {selectedId === row.id
                                ? 'border-action/60 bg-action/10'
                                : 'border-border bg-bg-light hover:border-action/40'}"
                    >
                        <span
                            class="absolute inset-y-0 left-0 w-1 {row.finalised ? 'bg-green-500' : 'bg-amber-500'}"
                            aria-hidden="true"
                        ></span>
                        <span class="sr-only">{row.finalised ? 'Finalised' : 'Pending'}</span>

                        <div class="flex items-baseline justify-between gap-3">
                            <span class="min-w-0 truncate text-base font-medium text-text" title={row.customer}>
                                {row.customer}
                            </span>
                            <span class="shrink-0 text-xs text-text-muted">{row.date.toLocaleDateString()}</span>
                        </div>

                        <p class="mt-0.5 line-clamp-2 text-sm text-text-muted" title={row.rule}>
                            {row.rule}
                        </p>
                    </button>
                {/each}

                {#if results.rows.length === 0}
                    <p class="px-2 py-6 text-center text-sm text-text-muted">
                        No fine tunes match these filters. Remove a search or clear the dates to widen the search.
                    </p>
                {/if}
            {/if}
        </div>

        <div class="pt-2 flex items-center justify-center">
            <div class="flex items-center justify-center">
                <button
                    class="px-1"
                     type="button"
                     onclick={previousPage}
                     disabled={crSearchInfo.page < 2}
                  >
                     <ChevronsLeft />
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
                     disabled={results ? crSearchInfo.page >= results.totalPages : true}
                  >
                    <ChevronsRight />
                </button>
            </div>
        </div>
    </div>

    <div class="flex-7/10 px-6 pb-6 bg-bg border-l border-border text-text overflow-y-auto">

        <main class="">
            {@render children()}
        </main>
            

            
    </div>
</div>

<Toast />

