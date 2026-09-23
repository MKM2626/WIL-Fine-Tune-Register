<!-- <script lang="ts">
	import { getToast } from './toast.svelte.ts';

	const toast = $derived(getToast());
</script>

{#if toast}
	<div
		class="fixed top-5 left-5 z-50 rounded-lg px-4 py-3 shadow-lg
			{toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}">
		{toast.message}
	</div>
{/if} -->

<!-- Toasts.svelte -->
<script lang="ts">
    import { toast, type ToastType } from './toast.svelte.ts';

    const typeClasses: Record<ToastType, string> = {
        'success': 'bg-green-500',
        'error': 'bg-red-500'
    };
    
    const getToastsByType = (type: ToastType) => toast.list.filter(t => t.type === type);
    const types: ToastType[] = ['success', 'error'];
</script>

{#each types as type}
    {#if getToastsByType(type).length > 0}
        <div class="fixed z-50 top-22 right-6 flex-col flex gap-1 round rounded-lg pointer-events-none {typeClasses[type]}">
            {#each getToastsByType(type) as item (item.id)}
                <div class="pointer-events-auto flex items-center text-white px-3 py-2 shadow-lg text-sm transition-all duration-300">
                    <span>{item.message}</span>
                    <button class="ml-4 opacity-70 hover:opacity-100" onclick={() => toast.dismiss(item.id)}>✕</button>
                </div>
            {/each}
        </div>
    {/if}
{/each}