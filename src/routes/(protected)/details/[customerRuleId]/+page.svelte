<script lang="ts">
    let { params } = $props();
    import { deleteCustomerRule, deleteFineTune } from "#lib/remote/delete.remote";
    import { getFineTuneDetails } from "#lib/remote/getFineTuneDetails.remote";
    import type { inputFTDetailsSchema } from "#lib/types/getFineTuneDetailsSchema";
    import { getCustomerRules } from "#lib/remote/getCustomerRules.remote";
    import { getCRSearchContext } from "#lib/context/customerRuleSearch";
    import { goto } from "$app/navigation";
    import { fade, slide } from 'svelte/transition';
    import { page } from "$app/state";
    import { toast } from "#lib/components/toast.svelte.js";
    import { authClient } from '#lib/auth-client'
    import { getNextContext } from "#lib/context/crNextRow"
	import { handleError } from "#lib/errors/handleError";
	import { getCustomerRuleDetails } from "#lib/remote/getCustomerRuleDetails.remote";
    import type { FineTuneRow } from "#lib/types/getFineTuneDetailsSchema";
	import { diffWords } from "diff";
	import { SvelteSet } from "svelte/reactivity";
    import { CalendarArrowDown, CalendarArrowUp, X, ListFilter, RefreshCw, SquareCheckBig, Trash, CalendarDays, Globe, CircleX, CircleCheck, ChevronDown, ChevronUp } from '@lucide/svelte/icons'
	import FilterToggle from "#lib/components/FilterToggle.svelte";
	import FineTuneCard from "#lib/components/FineTune.svelte";
	import { finaliseCustomerRule } from "#lib/remote/finaliseCustomerRule.remote";
    import ConfirmPopUp from "#lib/components/ConfirmPopUp.svelte"
    import { atLeast } from '#lib/roles'

    // Session
    const session = authClient.useSession() 

    // Selected id
    let id = $derived(params.customerRuleId);
    // Selected Fine Tune Id
    const fineTuneId = $derived(page.url.searchParams.get('fineTune') ?? null)
    // Search Input
    let ftSearchInfo = $state<inputFTDetailsSchema>({ page: 1, pageSize: 50, descending: true })
    let prevSearch: inputFTDetailsSchema = { page: 1, pageSize: 50, descending: true  }
    
    // Filter buttons
    let searchFinalised = $state('')
    let searchGlobal = $state('')
    let searchExpiryDate = $state('')
    let expandedSearch = $state(false)

    // confirm pop up 
    let deleteRuleOpen = $state(false)

    // get search and delete context
    const next = getNextContext()
    const crSearchInfo = getCRSearchContext()
    
    // Page inputs / controls
    let startPage = $state(0)
    let endPage = $state(0)
    let prevStartPage = 0
    let prevEndPage = 0

    // Date inputs
    let startDateInput = $state('')
    let endDateInput = $state('')


    // search fields 
    const filterFields = [
        { key: 'search', label: 'Any field', prefix: 'Any' },

        { key: 'name', label: 'Fine tune name', prefix: 'N' },
        { key: 'version', label: 'Fine tune version', prefix: 'V'},
        { key: 'fineTune', label: 'Fine tune', prefix: 'FT' },
        { key: 'analyst', label: 'Analyst', prefix: 'A' },
        { key: 'finalisedAnalyst', label: 'Finalised analyst', prefix: 'FA' },
        { key: 'comment', label: 'Comment', prefix: 'Cm' },
        { key: 'tags', label: 'Tag', prefix: '#' }
    ] as const // prevents change of key values, allowing typescript to use it
    
    // filter key type
    type FilterKey = (typeof filterFields)[number]["key"]

    // inputs
    let filterInputs = $state<Record<FilterKey, string>>({
        search: '', fineTune: '', version: '', analyst: '', finalisedAnalyst: '', comment: '', tags: '', name: ''
    })

    // Gets current number of filters applied
    const filterCount = $derived(
        filterFields.reduce((count, field) => count + (ftSearchInfo[field.key]?.size ?? 0), 0)
    )



    // Store rows, and expand state of other parts of the component
    let rows: FineTuneRow[] = $state([])

    // Get fine tunes and customer rules
    let results = $derived(await getFineTuneDetails({ customerRuleId: params.customerRuleId, ...ftSearchInfo, ...(fineTuneId !== null ? { fineTuneId} : {}) }))
    let customerRuleDetails = $derived(await getCustomerRuleDetails(params.customerRuleId))


    const moveOut = 0;
    const delay = 0;
    const moveIn = 0;

    
    // determines if a delete is in progress, so one cannot continuously press it before its completed
    let deleting = $state(false)
    let finalising = $state(false)


    // Need to change current page to trigger row appends
    $effect(() => {
        const currentStartPage = startPage
        const currentEndPage = endPage
        const currentSearch = ftSearchInfo

        if (currentStartPage === 0 && currentEndPage === 0) {
            startPage = results.page
            endPage = results.page
            rows = results.rows.map(({before, after, ...row}) => ({...getDiff(before, after), ...row}))
            return // Will always cause prev start and search page to change
        }

        // condition of if search applied replace rows 
        else if (prevSearch !== currentSearch) {
            startPage = 1 // Search will always default to first page, regardless of ftSearch in url
            endPage = 1

            rows = results.rows.map(({before, after, ...row}) => ({...getDiff(before, after), ...row}))
            return // Will always cause prev start and search page to change
        }

        else if (currentStartPage !== prevStartPage) {
            rows.unshift(...results.rows.map(({before, after, ...row}) => ({...getDiff(before, after), ...row})))
        }

        else if (currentEndPage !== prevEndPage) {
            rows.push(...results.rows.map(({before, after, ...row}) => ({...getDiff(before, after), ...row})))
        }

        prevStartPage = currentStartPage
        prevEndPage = currentEndPage
        prevSearch = currentSearch
    })

    function resetPage() {
        ftSearchInfo.page = 1
        // pageInput = 1 // no long using page input
    }

    function addFilter(key: FilterKey, input: string) {
        const search = input.trim()
        if (search.trim() == '') return
        if (!ftSearchInfo[key]) {
            ftSearchInfo[key] = new SvelteSet<string>()
        }
        ftSearchInfo[key].add(search)
        resetPage()
    }

    function removeFilter(key: FilterKey, value: string) {
        ftSearchInfo[key]?.delete(value)
        if (!ftSearchInfo[key]?.size) delete ftSearchInfo[key]
        resetPage()
    }

    function submitInput(key: FilterKey) {
        addFilter(key, filterInputs[key])
        filterInputs[key] = ''
    }

    function clearDate() {
        startDateInput =  ''
        startDateInput = ''

        delete ftSearchInfo.start
        delete ftSearchInfo.end
    }

    function applyStart() {
        if (startDateInput !== "") {
            ftSearchInfo.start = new Date(startDateInput)
            resetPage()
        }
    }

    function applyEnd() { 
        if (startDateInput !== "" && startDateInput < endDateInput) {
            ftSearchInfo.end = new Date(endDateInput)
            resetPage()
        }
        else clearDate()
    }

    

    function getDiff(before: string, after: string) {
        if (before == 'Initial Rule') {
            return {
                before: [{ class: "text-text", text: before}], 
                after: [{ class: "text-text", text: after}]
            }
        }

        const differences = diffWords(before, after);

        let beforeResult = []
        let afterResult = []

        for (const part of differences) {
            if (part.removed) {
                beforeResult.push({ class: "text-red-500", text: part.value})
            }
            else if (part.added) {
                afterResult.push({ class: "text-green-500", text: part.value})
            }
            else {
                beforeResult.push({ class: "text-text", text: part.value})
                afterResult.push({ type: "same", text: part.value})
            }
        }

        return { 
            before: beforeResult,
            after: afterResult
        }
    }

    function nextPage() {
        if (endPage < results.totalPages) {
            endPage++
            ftSearchInfo.page = endPage
            return
        }
        toast.error("Max page reached")
    }

    function prevPage() {
        if (startPage > 1) {
            endPage--
            ftSearchInfo.page = startPage
            return
        }
        toast.error("Max page reached")
    }

    function searchGlobalBtn() {
        if (searchGlobal == '') {
            searchGlobal = 'true'
            ftSearchInfo.global = true
            ftSearchInfo.page = 1


        } else if (searchGlobal == 'true') {
            searchGlobal = 'false'
            ftSearchInfo.global = false
            ftSearchInfo.page = 1

        } else {
            searchGlobal = ''
            delete ftSearchInfo.global
            ftSearchInfo.page = 1

        }
    }

    function searchExpiryBtn() {
        if (searchExpiryDate == '') {
            searchExpiryDate = 'true'
            ftSearchInfo.expiryDate = true

        } else if (searchGlobal == 'true') {
            searchExpiryDate = 'false'
            ftSearchInfo.expiryDate = false

        } else {
            searchExpiryDate = ''
            delete ftSearchInfo.expiryDate
        }

        resetPage()
    }

    function searchFinalisedBtn() {
        if (searchFinalised == '') {
            searchFinalised = 'true'
            ftSearchInfo.finalised = true

        } else if (searchFinalised == 'true') {
            searchFinalised = 'false'
            ftSearchInfo.finalised = false
        } else {
            searchFinalised = ''
            delete ftSearchInfo.finalised
        }
        resetPage()
    }
    
    async function delFt(fineTuneId: string, index: number) {
        if (deleting) return 
        if (!atLeast($session.data?.user.role, 'senior')) return
        
        deleting = true

        const deletedRule = rows[index]


        try {
            await deleteFineTune(fineTuneId).updates(
                getCustomerRules(crSearchInfo).withOverride((results) => ({
                    ...results
                }))
            )
            
            rows.splice(index, 1)
        }
        catch (error) {
            handleError(error)
            history.back()
            rows.splice(index, 0, deletedRule)
        }
       finally {
            deleting=false
            if (filterCount == 0 && rows.length == 0 && startPage == 1) goto(`/details/${next.id}`)
            toast.success('Deleted')
       }
    }

    async function delRule() {
        if (deleting) return
        if (!atLeast($session.data?.user.role, 'admin')) return

        deleting = true

        try {
            await deleteCustomerRule(id).updates(
                 getCustomerRules(crSearchInfo).withOverride((results) => ({
                    ...results
                }))
            )
            goto(`/details/${next.id}`)
            toast.success('Deleted')
        }
        catch (error) {
            handleError(error)
            history.back()
            
        }
       finally {
            deleting=false
       }
    }

    async function finalise() {
        if (finalising) return
        if (!atLeast($session.data?.user.role, 'senior')) return



        finalising = true

        try {
            await finaliseCustomerRule(id).updates(
                getCustomerRules(crSearchInfo).withOverride((results) => ({
                    ...results
                }))
            )

            if (ftSearchInfo.finalised !== undefined) goto(`/details/${next.id}`)
            
            toast.success('Finalised')
            rows[0].finalised = true
        } catch (error) {
            handleError(error)
            history.back()
            rows[0].finalised = false
        }
        finally {
            finalising = false
        }
    }
</script>

<div class="flex items-center justify-between pb-3  pt-4 overflow-hidden sticky gap-2 top-0 z-1 bg-bg">
    <header class="text-3xl shrink-0">
        Fine Tunes
    </header>

    <div class="flex gap-3">

        {#if atLeast($session.data?.user.role, 'senior')}
            {#if startPage == 1 && ftSearchInfo.descending == true && rows[0]?.finalised == false}
                <button 
                    class="px-4 py-2 font-semibold rounded-lg bg-bg-light border border-border hover:brightness-125 transition"
                    onclick={finalise}
                    disabled={finalising}
                >
                    <SquareCheckBig />
                </button>
            {/if}
            
        {/if}
        
        {#if rows[0]?.finalised && startPage == 1 && ftSearchInfo.descending == true}
            <button 
                class="px-4 py-2 font-semibold rounded-lg bg-bg-light border border-border hover:brightness-125 transition"
                onclick={()=> goto(`/details/${id}/${rows[0].id}/update`)}
            >
                <RefreshCw />
            </button>
        {/if}
        
        <!-- Need to call pop up component to confirm customer rule delete -->
        {#if atLeast($session.data?.user.role, 'admin')}
            <button 
                class="px-4 py-2 font-semibold rounded-lg bg-bg-light border border-border hover:brightness-125 transition"
                onclick={() => {deleteRuleOpen = true}}
                disabled={deleting}
            >
                <Trash />
            </button>
        {/if}
        
    </div>
</div>

<ConfirmPopUp
    bind:open={deleteRuleOpen}
    title="Delete this customer rule?"
    confirmLabel="Delete customer rule"
    loading={deleting}
    onconfirm={delRule}
>
    <p>
        This will permanently delete the customer rule <strong class="text-text">{customerRuleDetails.rule}</strong> for <strong class="text-text">{customerRuleDetails.customer}</strong>, including its entire fine tune history. This action cannot be undone.
    </p>
</ConfirmPopUp>

<div class=" flex flex-col gap-y-4">

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
                onclick={() => ftSearchInfo.descending = !ftSearchInfo.descending}
                class="flex w-12 h-11 shrink-0 bg-bg-light justify-center items-center text-text border border-border rounded-lg hover:border-action transition-all duration-250 ease-out"
            >
                {#if ftSearchInfo.descending}
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

            <div class="grid grid-cols-3 gap-x-4 gap-y-3 @sm:grid-cols-4">

                <FilterToggle label="Expiry" icon={CalendarDays}
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

    {#if filterCount > 0 && startPage == 1}
        <div class="mt-0 flex max-h-24 flex-wrap items-center gap-2 overflow-y-auto pr-1">
            {#each filterFields as field (field.key)}
                {#each ftSearchInfo[field.key] ?? [] as filter (filter)}
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


<div class="@container mt-4 rounded-xl border border-border bg-bg-light px-5 py-4 shadow-md">

    <div in:fade={{ duration: moveIn, delay: delay }} out:fade={{ duration: moveOut }}>

        <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <h2
                class="min-w-0 wrap-break-words text-xl font-semibold text-text"
                title={customerRuleDetails.customer}
            >
                {customerRuleDetails.customer}
            </h2>

            <span
                class="inline-flex shrink-0 items-center gap-1.5 pt-1 text-xs text-text-muted"
                title={customerRuleDetails.date.toLocaleString()}
            >
                <CalendarDays size={14} />
                Rule created {customerRuleDetails.date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: "numeric", minute: "numeric", second: "numeric" })}
            </span>
        </div>

        <div class="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-border pt-3 @md:grid-cols-3">
            <div class="min-w-0 @md:col-span-2">
                <p class="text-xs font-medium text-text-muted">Rule</p>
                <p class="wrap-break-wordbreak-words text-sm text-text">{customerRuleDetails.rule}</p>
            </div>

            <div class="min-w-0">
                <p class="text-xs font-medium text-text-muted">Technology</p>
                <p class="wrap-break-words text-sm text-text">{customerRuleDetails.technology}</p>
            </div>
        </div>

    </div>
</div>

{#if rows.length > 0 && startPage == 1}
    <div class="sticky flex justify-center mt-2">
        <span class="h-10 w-0.5 bg-border"></span>
    </div>
{/if}

{#if startPage > 1}
    {#if startPage > 1}
        <div class="flex justify-center pt-4 pb-2">
            <button
                type="button"
                onclick={prevPage}
                class="rounded-xl w-full items-center justify-center border border-border bg-bg gap-1 inline-flex py-1 px-2 pl-4 text-xs font-medium text-text-muted transition-colors hover:border-action hover:bg-bg-light"
            >
                Load previous fine tunes
                <ChevronUp size={14} />
            </button>
        </div>
    {/if}
{/if}





<div class="overflow-y-scroll">

    <div class="">

        {#each rows as row, index (row.id)}
            {#key row}
                <FineTuneCard
                    {row}
                    onedit={(r) => goto(`/details/${id}/${r.id}/edit`)}
                    ondelete={(r) => delFt(r.id, index)}
                    selectedId={results.selectedId}
                />
            {/key}
            

            {#if index + 1 < rows.length}
                <!-- your existing connector code, unchanged -->
                 {#if rows[index + 1].id === row.previousFineTuneId}
                    <div class="flex justify-center mt-2">
                        <span class="h-10 w-0.5 bg-border"></span>
                    </div>
                {:else}
                    <!-- <div class="flex justify-center mt-2"> -->
                        <div class="h-10 flex justify-center mt-2">
                            <svg
                                class="h-full w-4 text-border"
                                viewBox="0 0 16 100"
                                preserveAspectRatio="none"
                                fill="none"
                            >
                                <path
                                    d="M8 0 V42 L3 48 L13 54 L8 60 V100"
                                    class="stroke-current"
                                    stroke-width="2"
                                    vector-effect="non-scaling-stroke"
                                />
                            </svg>
                        </div>
                    <!-- </div> -->
                    
                {/if}
            {/if}
        {/each}
        

        {#if endPage < results.totalPages}
            <div class="flex justify-center pt-4 pb-2">
                <button
                    type="button"
                    onclick={nextPage}
                    class="rounded-xl w-full items-center justify-center border border-border bg-bg gap-1 inline-flex py-1 px-2 pl-4 text-xs font-medium text-text-muted transition-colors hover:border-action hover:bg-bg-light"
                >
                    Load previous fine tunes
                    <ChevronDown size={14} />
                </button>
            </div>
        {/if}
    </div>
</div>
