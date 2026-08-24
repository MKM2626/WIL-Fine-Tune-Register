<script lang="ts">
	import { getFineTune } from "#lib/remote/registers.remote";
    let { id, onEdit, onUpdate, onDelete } = $props();

    let selectedFineTune = $derived(await getFineTune(id))
</script>

<div class="flex items-center justify-between pb-5">
    <header class="text-3xl">
        Fine Tune Details
    </header>

    <div class="flex gap-3">
        <div class="flex gap-3">
            <button 
                class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
                onclick={onEdit}
            >
                Edit
            </button>
        </div>

        <div class="flex gap-3">
            <button 
                class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
                onclick={onUpdate}
            >
                Update
            </button>
        </div>

        <div class="flex gap-3">
            <button 
                class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
                onclick={onDelete}
            >
                Delete
            </button>
        </div>
    </div>
</div>

<div class="bg-bg-light border border-border rounded-lg p-5 flex flex-col gap-3">
    <div class="flex">
        <span class="w-32 text-text-muted">
            Date:
        </span>
        <span>
            {selectedFineTune.date.toLocaleDateString()}
        </span>
    </div>

    <div class="flex">
        <span class="w-32 text-text-muted">
            Rule:
        </span>
        <span>
            {selectedFineTune.rule}
        </span>
    </div>

        <div class="flex">
        <span class="w-32 text-text-muted">
            Customer:
        </span>
        <span>
            {selectedFineTune.customer}
        </span>
    </div>

    <div class="flex">
        <span class="w-32 text-text-muted">
            Technology:
        </span>
        <span>
            {selectedFineTune.technology}
        </span>
    </div>

    <div class="flex">
        <span class="w-32 text-text-muted">
            Analyst:
        </span>
        <span>
            {selectedFineTune.analyst}
        </span>
    </div>
</div>

<div class="mt-5">
    <h3 class="text-xl mb-2">
        Before:
    </h3>

    <div class="bg-bg-light border border-border rounded-lg p-4">
        {selectedFineTune.before}
    </div>
</div>

<div class="mt-5">
    <h3 class="text-xl mb-2">
        After:
    </h3>

    <div class="bg-bg-light border border-border rounded-lg p-4">
        {selectedFineTune.after}
    </div>
</div>

<div class="mt-5">
    <h3 class="text-xl mb-2">
        Comments:
    </h3>

    <div class="bg-bg-light border border-border rounded-lg p-4">
        {selectedFineTune.comment ?? "No comment"}
    </div>
</div>
