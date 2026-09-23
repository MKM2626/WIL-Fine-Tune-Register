<script lang="ts">
    type Option = {
        id: string;
        name: string;
    };

    let {
        options,

        placeholder = 'Select...',
        onSelect
    }: {
        options: Option[];

        placeholder?: string;
        onSelect: (option: Option) => void;
    } = $props();

    let open = $state(false);
    let search = $state('');

    let filteredOptions = $derived(
        options.filter((option) =>
            option.name.toLowerCase().includes(search.toLowerCase())
        )
    );

    function selectOption(option: Option) {
        search = option.name;
        open = false;
        onSelect(option);
    }
</script>

<div class="relative">
    <div class="bg-bg-light rounded-lg p-4">
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

    {#if open}
        <div class="pb-8">
            <div class="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-lg bg-bg-light border border-border shadow-lg">
                {#if filteredOptions.length > 0}
                    {#each filteredOptions as option}
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