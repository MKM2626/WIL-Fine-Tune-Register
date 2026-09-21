<script lang="ts">
    import { goto } from '$app/navigation';
    import { slide } from 'svelte/transition';
    import { Pencil, Trash, Globe, ChevronDown, CalendarDays, CalendarClock, MessageSquare, CircleCheck, CircleX } from '@lucide/svelte/icons';
    import type { FineTuneRow } from '#lib/types/getFineTuneDetailsSchema';

    // TODO need to include session control on delete 
    let {
        row,
        onedit,
        ondelete, 
        selectedId
    }: {
        row: FineTuneRow;
        onedit?: (row: FineTuneRow) => void;
        ondelete?: (row: FineTuneRow) => void;
        selectedId: string | null
    } = $props();

    // height while collapsed, around p-30
    const COLLAPSED_PX = 112;

    let globalOpen = $state(false);
    let diffOpen = $state(false);
    let contentHeight = $state(0); // the actual height of the diff fine tune which is measured by bind:clientHeight

    // Show more will only appear when the content height is taller then the actual height
    const canExpand = $derived(contentHeight > COLLAPSED_PX);

    // Just show first fine tune, no initial rule
    const isInitial = $derived(row.before.length === 1 && row.before[0].text === 'Initial Rule')

    const expired = $derived(row.expiryDate && row.expiryDate < new Date())

    const globalCount = $derived(row.globals?.length ?? 0)

</script>

<!-- contained makes finding @md width so much easier: TOOK out bg-light from top and border of action -->
<article class="@container relative mt-2 overflow-hidden rounded-xl border shadow-md 
    {selectedId == row.id ? 'border-action/60 bg-action/10' : 'border-border bg-bg-light'}"
>
    <span
        class="absolute inset-y-0 left-0 w-1 {row.finalised ? 'bg-green-500' : 'bg-amber-500'}"
    ></span>

    <!-- name and action buttons -->
    <header class="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <h3
            class="min-w-0 line-clamp-2 wrap-break-words text-base font-medium text-text "
            title={row.name ?? undefined}
        >
            <span class="text-text-muted text-xs font-medium mr-0.5">v{row.version}</span> 
            {row.name ?? 'No name provided'}
        </h3>

        <div class="flex shrink-0 items-center gap-2">
            <button
                type="button"
                title="Edit"
                onclick={() => onedit?.(row)}
                class="flex size-9 items-center justify-center rounded-lg border border-border bg-bg text-text-muted transition-colors hover:border-indigo-500 hover:text-text"
            >
                <Pencil size={16} />
            </button>

            <button
                type="button"
                title="Delete"
                onclick={() => ondelete?.(row)}
                class="flex size-9 items-center justify-center rounded-lg border border-border bg-bg text-text-muted transition-colors hover:border-red-500 hover:text-text"
            >
                <Trash size={16} />
            </button>
        </div>
    </header>

    <!-- Global expand, dates, and finalisation -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 pb-3 text-xs">
        <span
            class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium
                {row.finalised
                    ? 'border-green-500/40 bg-green-500/10 text-green-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300'}"
        >
            <!-- <span class="size-2 rounded-full {row.finalised ? 'bg-green-500' : 'bg-amber-500'}"></span> -->
            {#if row.finalised} 
                <CircleCheck size={14} />
            {:else}
                <CircleX size={14}/>
            {/if}
            {row.finalised ? 'Finalised' : 'Pending'}
        </span>

        <span class="inline-flex items-center gap-1.5 text-text-muted">
            <CalendarDays size={14} />
            Created {row.date.toISOString()}
        </span>

        {#if row.expiryDate}
            <span class="inline-flex items-center gap-1.5 {expired ? 'text-red-400' : 'text-text-muted'}">
                <CalendarClock size={14} />
                {expired ? 'Expired' : 'Expires'} {row.expiryDate.toISOString()}
            </span>
        {/if}

        {#if row.globalId}
            <button
                type="button"
                onclick={() => (globalOpen = !globalOpen)}
                class="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 py-1 font-medium text-text-muted transition-colors hover:border-indigo-500 hover:text-text"
            >
                <Globe size={14} />
                Global
                {#if globalCount > 0}
                    <span class="rounded-full bg-bg-light px-1.5 text-[10px] text-text">{globalCount}</span>
                {/if}
                <ChevronDown size={14} class="transition-transform {globalOpen ? 'rotate-180' : ''}" />
            </button>
        {/if}
    </div>

    <!-- global expand area section -->
    {#if globalOpen}
        <div transition:slide={{ duration: 300 }} class="px-5 pb-3">
            <div class="max-h-48 overflow-y-auto rounded-lg border border-border bg-bg p-3">
                <p class="mb-2 text-xs font-medium text-text-muted">Global customers</p>

                <div class="grid grid-cols-2 gap-2 @2xl:grid-cols-4">
                    {#each row.globals as customer (`${customer.customerRuleId}-${customer.fineTuneId}`)}
                        <button
                            type="button"
                            title={customer.name}
                            onclick={() => goto(`/details/${customer.customerRuleId}?fineTune=${customer.fineTuneId}`)}
                            class="min-w-0 truncate rounded-lg border border-border bg-bg-light px-3 py-2 text-left text-xs text-text transition-colors hover:border-indigo-500"
                        >
                            {customer.name}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    {/if}

    <!-- Analysts, give 1 col when narrow and two when not -->
    <section class="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-border px-5 py-3 @md:grid-cols-2">
        <div class="min-w-0">
            <p class="text-xs font-medium text-text-muted">Analyst</p>
            <p class="truncate text-sm text-text" title={row.analystName}>
                {row.analystName} 
            </p>
        </div>

        <div class="min-w-0">
            <p class="text-xs font-medium text-text-muted">Finalised by</p>
            <p class="truncate text-sm text-text" title={row.finaliseAnalystName ?? ''}>
                <!-- Only when not finalised -->
                {row.finaliseAnalystName ?? '—'}
            </p>
        </div>
    </section>

    <!-- Rule change / diff area -->
    <section class="border-t border-border px-5 py-3">
        <p class="mb-2 text-xs font-medium text-text-muted">{isInitial ? 'Initial rule' : 'Rule changes'}</p>

        <div
            // relative to set position
            class="relative overflow-hidden rounded-lg border border-border bg-bg transition-all duration-300 ease-out"
            style:max-height="{diffOpen ? contentHeight : COLLAPSED_PX}px"
        >
            <!-- height of actual div / diff component -->
            <div bind:clientHeight={contentHeight}> 
                {#if isInitial}
                    <!-- needed more space between lines -->
                    <div class="p-3 text-sm leading-6"> 
                        {#each row.after as diff, index (index)}<span class="whitespace-pre-wrap {diff.class}">{diff.text}</span>{/each}
                    </div>
                {:else}
                    <!-- change grid rows and divider based on container width -->
                    <div class="grid grid-cols-1 divide-y divide-border @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
                        <div class="min-w-0 p-3">
                            <p class="mb-1 text-xs font-medium text-text-muted">Before</p>
                            <div class="text-sm leading-6">
                                {#each row.before as diff, index (index)}<span class="whitespace-pre-wrap {diff.class}">{diff.text}</span>{/each}
                            </div>
                        </div>

                        <div class="min-w-0 p-3">
                            <p class="mb-1 text-xs font-medium text-text-muted">After</p>
                            <div class="text-sm leading-6">
                                {#each row.after as diff, index (index)}<span class="whitespace-pre-wrap {diff.class}">{diff.text}</span>{/each}
                            </div>
                        </div>
                    </div>
                {/if}
            </div>

            {#if canExpand && !diffOpen}
                <div class="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-bg to-transparent"></div>
            {/if}
        </div>

        {#if canExpand}
            <button
                type="button"
                onclick={() => (diffOpen = !diffOpen)}
                class="mt-1 flex w-full items-center justify-center gap-1 rounded-md py-1 text-xs text-text-muted transition-colors hover:text-text"
            >
                {diffOpen ? 'Show less' : 'Show more'}
                <ChevronDown size={14} class="transition-transform {diffOpen ? 'rotate-180' : ''}" />
            </button>
        {/if}
    </section>

    <!-- Only render comment and tags if they are available -->
    {#if row.comment || row.tags.length}
        <section class="flex flex-col gap-3 border-t border-border px-5 py-3">
            {#if row.comment}
                <p class="flex gap-2 text-sm text-text">
                    <MessageSquare size={16} class="mt-1 shrink-0 text-text-muted" />
                    <span class="min-w-0 whitespace-pre-wrap wrap-break-words">{row.comment}</span>
                </p>
            {/if}

            {#if row.tags.length}
                <div class="flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-1">
                    {#each row.tags as tag, i (i)}
                        <span class="rounded-full border border-action/30 bg-action/10 px-2.5 py-0.5 text-xs text-indigo-300">
                            # {tag}
                        </span>
                    {/each}
                </div>
            {/if}
        </section>
    {/if}
</article>