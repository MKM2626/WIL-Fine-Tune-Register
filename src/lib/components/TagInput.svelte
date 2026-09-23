<script lang="ts">
	import { onMount } from "svelte";

    type Tag = {
        id: number | null
        name: string
    };

    let {
        options,
        placeholder = 'Add tags...',
        selectedTags = [],
        onChange
    }: {
        options: { id: number; name: string }[];
        placeholder?: string;
        selectedTags?: { id: number; name: string}[];
        onChange: (existing: number[], created: string[]) => void;
    } = $props();

    let open = $state(false);
    let search = $state('');
    let selected = $state<Tag[]>([]);

    onMount(() => {
        if (selectedTags.length > 0) {
            selected = selectedTags
        }
    })

    // existing tags that match what is typed and haven't been added yet
    let suggestions = $derived(
        options.filter((option) =>
            option.name.toLowerCase().includes(search.trim().toLowerCase()) &&
            !selected.some((tag) => tag.id === option.id)
        )
    );

    // can add when the typed text isn't an existing or already added tag
    let canAddNew = $derived(
        search.trim() !== '' &&
        !options.some((option) => option.name.toLowerCase() === search.trim().toLowerCase()) &&
        !selected.some((tag) => tag.name.toLowerCase() === search.trim().toLowerCase())
    );

    function update() {
        onChange(
            selected.filter((tag) => tag.id !== null).map((tag) => tag.id as number),
            selected.filter((tag) => tag.id === null).map((tag) => tag.name)
        );
    }

    function addTag(text: string) {
        const name = text.trim()
        if (!name) return

        // if the name matches an existing tag, use that one instead of making a new one
        const existing = options.find((option) => option.name.toLowerCase() === name.toLowerCase())
        const tag: Tag = existing ? { id: existing.id, name: existing.name } : { id: null, name }

        if (!selected.some((item) => item.name.toLowerCase() === tag.name.toLowerCase())) {
            selected.push(tag)
            update()
        }

        search = ''
    }

    function removeTag(index: number) {
        selected.splice(index, 1)
        update()
    }
</script>

<div>
    <div class="relative">
        <input
            type="text"
            bind:value={search}
            placeholder={placeholder}
            onfocus={() => open = true}
            onblur={() => open = false}
            onkeydown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault()
                    addTag(search)
                }

                if (event.key === 'Escape') {
                    open = false
                }
            }}
            class="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text transition-all duration-250 ease-out hover:border-action/60 focus:border-action focus:outline-none"
        />

        {#if open}
            <div class="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-lg bg-bg-light border border-border shadow-lg">
                {#if canAddNew}
                    <button
                        type="button"
                        onmousedown={(event) => {
                            event.preventDefault()
                            addTag(search)
                        }}
                        class="w-full px-3 py-2 text-left text-sm text-indigo-300 bg-bg hover:bg-bg-light transition-colors"
                    >
                        Add "{search.trim()}"
                    </button>
                {/if}

                {#each suggestions as option (option.id)}
                    <button
                        type="button"
                        onmousedown={(event) => {
                            event.preventDefault()
                            addTag(option.name)
                        }}
                        class="w-full px-3 py-2 text-left text-sm bg-bg hover:bg-bg-light transition-colors"
                    >
                        {option.name}
                    </button>
                {:else}
                    {#if !canAddNew}
                        <div class="px-3 py-2 text-sm text-text-muted">
                            No tags found
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}
    </div>

    {#if selected.length > 0}
        <div class="max-h-24 flex flex-wrap overflow-y-auto items-center gap-2 mt-3 pr-1">
            {#each selected as tag, index (tag.name)}
                <button
                    type="button"
                    onclick={() => removeTag(index)}
                    title={tag.id === null ? 'New tag' : 'Existing tag'}
                    class="items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-action/10 text-indigo-300 border outline-none hover:border-action transition-all duration-250 ease-out {tag.id === null ? 'border-dashed border-action/50' : 'border-action/30'}"
                >
                    {tag.name} x
                </button>
            {/each}
        </div>
    {/if}
</div>