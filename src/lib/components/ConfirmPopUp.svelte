<script lang="ts">
    import type { Snippet } from 'svelte';
    import { TriangleAlert } from '@lucide/svelte/icons';

    let {
        open = $bindable(false),
        title,
        confirmLabel = 'Delete',
        cancelLabel = 'Cancel',
        loading = false,
        onconfirm,
        children
    }: {
        open?: boolean;
        title: string;
        confirmLabel?: string;
        cancelLabel?: string;
        loading?: boolean;
        onconfirm: () => void | Promise<void>;
        children?: Snippet;
    } = $props();

    let dialog = $state<HTMLDialogElement>();

    $effect(() => {
        if (!dialog) return;

        if (open && !dialog.open) {
            dialog.showModal();
        }

        if (!open && dialog.open) {
            dialog.close();
        }
    });

    function close() {
        open = false
    }

    async function confirm() {
        if (loading) return

        open = false
        await onconfirm()
    }
</script>
<!-- experimenting with new css components -->
<dialog 
    bind:this={dialog}
    onclose={() => (open = false)}
    // prevent default action
    oncancel={(e) => loading && e.preventDefault()}  
    // close pop up
    onclick={(e) => e.target === dialog && close()}
    class="m-auto w-full max-w-md rounded-xl border border-border bg-bg-light p-5 text-text shadow-xl backdrop:bg-black/60"
>
    <div class="flex gap-3">
        <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
            <TriangleAlert size={20} />
        </div>

        <div class="min-w-0 flex-1">
            <h2 class="font-semibold">{title}</h2>

            <div class="mt-1 text-sm leading-6 text-text-muted">
                <!-- I can now render input, yay -->
                {@render children?.()} 
            </div>
        </div>
    </div>

    <div class="mt-5 flex justify-end gap-2">
        <button
            type="button"
            onclick={close}
            disabled={loading}
            class="rounded-lg border border-border bg-bg px-4 py-2 text-sm hover:border-action disabled:opacity-50"
        >
            {cancelLabel}
        </button>

        <button
            type="button"
            onclick={confirm}
            disabled={loading}
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
            {confirmLabel}
        </button>
    </div>
</dialog>