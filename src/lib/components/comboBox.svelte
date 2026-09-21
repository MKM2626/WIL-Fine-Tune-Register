<script lang="ts">
    import { ChevronDown } from '@lucide/svelte/icons'

    type Option = {
        id: string;
        name: string;
    };

    let {
        options,
        placeholder = 'Select...',
        selected = undefined,
        onSelect
    }: {
        options: Option[];
        placeholder?: string;
        selected?: string;
        onSelect: (option: Option) => void;
    } = $props();

    let open = $state(false);
    let search = $state('');

    $effect(() => {
		if (selected) {
			const option = options.find((option) => option.id === selected);

			if (option) {
				search = option.name;
			}
		}
	});

    let filteredOptions = $derived(
        options.filter((option) =>
            option.name.toLowerCase().includes(search.toLowerCase())
        )
    );

    function selectOption(option: Option) {
        onSelect(option);
        search = option.name;
        open = false;
        
    }
</script>

<div class="relative">
    <div class="">
        <input
            type="text"
            bind:value={search}

            placeholder={placeholder}
            onfocus={() => open = true}
            onblur={() => open = false}
            onkeydown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                }

            }}
            class="w-full px-3 py-2 rounded-lg bg-bg border-2 border-border hover:border-action/60 focus:border-action outline-none"
        />
    </div>

    <ChevronDown
        size={16}
        class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted transition-transform {open ? 'rotate-180' : ''}"
    />

    {#if open}
        <div>
            <div class="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-lg bg-bg-light border border-border shadow-lg">
                {#if filteredOptions.length > 0}
                    <!-- * Each option should have a key -->
                    {#each filteredOptions as option (option.id)} 
                        <button
                            type="button"
                            onmousedown={() => selectOption(option)}
                            class="w-full px-3 py-2 text-left bg-bg hover:bg-bg-light transition-colors"
                        >
                            {option.name}
                        </button>
                    {/each}
                {:else}
                    <div class="px-3 py-2 text-text-muted">
                        No results found
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- {#if open}
        <ul
            id="{uid}-list"
            role="listbox"
            bind:this={listEl}
            class="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-bg-light py-1 shadow-lg"
        >
            {#each filtered as option, i (option.id)}
                <li
                    id="{uid}-opt-{option.id}"
                    role="option"
                    aria-selected={String(option.id) === current}
                    title={option.name}
                    onmousedown={(event) => {
                        event.preventDefault(); // keep focus in the input so blur doesn't fire first
                        choose(option);
                    }}
                    onmousemove={() => (activeIndex = i)}
                    class="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition-colors
                        {i === activeIndex ? 'bg-action/10' : ''}
                        {String(option.id) === current ? 'font-medium text-indigo-300' : 'text-text'}"
                >
                    <span class="min-w-0 truncate">{option.name}</span>
                    {#if String(option.id) === current}
                        <Check size={14} class="shrink-0" />
                    {/if}
                </li>
            {:else}
                <li role="presentation" class="px-3 py-2 text-sm text-text-muted">No matches</li>
            {/each}
        </ul>
    {/if} -->
</div>
