<script lang="ts">

    type Option = {
        id: string;
        name: string;
    };

    let {
        options,
        placeholder = 'Select...',
        selected = undefined,
        onSelect,
        onClear,
    }: {
        options: Option[];
        placeholder?: string;
        selected?: string;
        onSelect: (option: Option) => void;
        onClear?: () => void;
    } = $props();

    let open = $state(false);
    let chosen = $derived<string | number | undefined>(undefined)

    $effect(() => {
        chosen = selected
	})

    let chosenName = $derived(
        options.find((option) => String(option.id) === String(chosen))?.name ?? ''
    )

    let search = $derived(chosenName);

    let filteredOptions = $derived(
        search === chosenName
            ? options
            : options.filter((option) => option.name.toLowerCase().includes(search.toLowerCase()))
    );

    function selectOption(option: Option) {
        chosen = option.id
        search = option.name
        onSelect(option)
        open = false
    }

    function leave() {
        if (search.trim() === '' && chosen !== undefined) {
            chosen = undefined
            onClear?.()
        }
        search = chosenName
        open = false
    }
</script>

<div class="relative">
    <div class="">
        <input
            type="text"
            value={search}
            oninput={(event) => {search = event.currentTarget.value}}
            onclick={() => open = true}
            onfocus={(event) => {open = true; event.currentTarget.select()}}
            placeholder={placeholder}
            onblur={leave}
            onkeydown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();

                    if (open && search !== chosenName && filteredOptions.length > 0) {
                        selectOption(filteredOptions[0])
                    }
                }

                if (event.key == `Escape`) {
                    search = chosenName
                    open = false
                }

            }}
            class="w-full px-3 py-2 rounded-lg bg-bg border border-border hover:border-action/60 focus:border-action outline-none"
        />
    </div>

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
</div>
