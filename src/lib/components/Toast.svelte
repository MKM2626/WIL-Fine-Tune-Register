<script lang="ts">
    import { toast, type ToastType } from './toast.svelte.ts';
    import { fly } from 'svelte/transition';

    const typeClasses: Record<ToastType, string> = {
        success: 'bg-green-500 border-green-600',
        error: 'bg-red-500 border-red-600'
    };
</script>

<div class="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
    <div class="relative w-80 h-24">
        {#each toast.list as item, index (item.id)}
            {@const scale = 1 - index * 0.05}
            {@const translateY = index * -12} 
            {@const translateZ = index * -30}

                <div
                    in:fly={{ y: 200 }} out:fly={{ y: 200, duration: 200 }}
                    class="absolute bottom-0 right-0 w-full text-text  p-4 rounded-lg shadow-xl border pointer-events-auto transition-all duration-300 ease-in-out {typeClasses[item.type]}"
                    class:hidden={index >= 3}
                    style:transform="translate3d(0, {translateY}px, {translateZ}px) scale({scale})"
                    style:z-index={100 - index}
                    style:opacity={1 - index * 0.1}
                >
                    <div class="flex justify-between items-center">
                        {#if item.type === 'success'}
                            <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                                ✓
                            </span>
                        {:else if item.type === 'error'}
                            <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                                !
                            </span>
                        {/if}
                        
                        <span class="flex-1 ml-4">{item.message} </span>

                        <button
                            class="shrink-0 hover:brightness-125 text-2xl"
                            type="button"
                            onclick={() => toast.dismiss(item.id)}
                        >
                            ×
                        </button>
                    </div>
                </div>

        {/each}
    </div>
</div>

