<script lang="ts">
    let {
        open = false,
        onClose,
        onExport,
    }: {
        open: boolean
        onClose: () => void
        onExport: (option: ExportOption) => void
    } = $props()

    type ExportOption = "Customer rules" | "All fine tunes" | "Filtered fine tunes"

    let option: ExportOption = $state("Customer rules")
</script>

{#if open}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-text"
        role="presentation"
        onclick={(event) => {
            if (event.target === event.currentTarget) {
                onClose()
            }
        }}
    >
        <div
            class="w-full max-w-md rounded-lg bg-bg p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
        >
            <div class="mb-6 flex items-start justify-between">
                <div>
                    <h2 id="export-title" class="text-lg font-semibold">
                        Export data
                    </h2>

                    <p class="mt-1 text-sm opacity-60">
                        Choose what you want to export.
                    </p>
                </div>

                <button
                    type="button"
                    class="opacity-60 hover:opacity-100"
                    onclick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            <div class="space-y-3">
                <label class="flex cursor-pointer gap-3 rounded-md border p-4">
                    <input
                        type="radio"
                        bind:group={option}
                        value="Customer rules"
                    />

                    <div>
                        <div class="font-medium">Customer rules</div>
                        <div class="text-sm opacity-60">
                            Export the latest fine tune for each customer rule.
                        </div>
                    </div>
                </label>

                <label class="flex cursor-pointer gap-3 rounded-md border p-4">
                    <input
                        type="radio"
                        bind:group={option}
                        value="All fine tunes"
                    />

                    <div>
                        <div class="font-medium">All fine tunes</div>
                        <div class="text-sm opacity-60">
                            Export every fine tune, including previous versions.
                        </div>
                    </div>
                </label>

                <label class="flex cursor-pointer gap-3 rounded-md border p-4">
                    <input
                        type="radio"
                        bind:group={option}
                        value="Filtered fine tunes"
                    />

                    <div>
                        <div class="font-medium">Filtered fine tunes</div>
                        <div class="text-sm opacity-60">
                            Export only fine tunes matching the current filters.
                        </div>
                    </div>
                </label>
            </div>

            <div class="mt-6 flex justify-end gap-2">
                <button
                    type="button"
                    class="rounded-md px-4 py-2 text-sm opacity-70 hover:opacity-100"
                    onclick={onClose}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="rounded-md bg-primary px-4 py-2 text-sm font-medium cursor-pointer"
                    onclick={() => onExport(option)}
                >
                    Export
                </button>
            </div>
        </div>
    </div>
{/if}