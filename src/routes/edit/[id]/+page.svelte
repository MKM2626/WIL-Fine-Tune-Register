<script lang="ts">
    import { getFineTune, getAnalysts, editForm, search } from "#lib/remote/registers.remote";
	import { getSearchContext } from "#lib/context/search";
    import { goto } from "$app/navigation";

    const searchInfo = getSearchContext()

    let { params } = $props();

    let id = $derived(params.id)

    let fineTune = $derived(await getFineTune(params.id));

    let analysts = await getAnalysts();
</script>


<form {...editForm} class="max-w-5xl">
    <div class="flex items-center justify-between pb-5">
        <header class="text-3xl">
            Edit Fine Tune
        </header>

        <div class="flex gap-3">
            <button
                type="button"
                onclick={()=>goto(`/details/${id}`)}
                class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
            >
                Cancel
            </button>

            <button
                type="submit"
                onclick={()=>search(searchInfo).refresh()}
                class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
            >
                Save
            </button>
        </div>
    </div>

    <input 
        type="hidden"
        {...editForm.fields.id.as("select", id)}
    />

    <div class="bg-bg-light border border-border rounded-lg p-5 flex flex-col gap-3">
        <div class="flex">
            <span class="w-32 text-text-muted">
                Date:
            </span>

            <span>
                {fineTune.date.toLocaleDateString()}
            </span>
        </div>


        <div class="flex">
            <span class="w-32 text-text-muted">
                Rule:
            </span>

            <span>
                {fineTune.rule}
            </span>
        </div>


        <div class="flex">
            <span class="w-32 text-text-muted">
                Customer:
            </span>

            <span>
                {fineTune.customer}
            </span>
        </div>


        <div class="flex">
            <span class="w-32 text-text-muted">
                Technology:
            </span>

            <span>
                {fineTune.technology}
            </span>
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Before:
        </h3>

        <div
            class="
                bg-bg-light
                border border-border
                rounded-lg
                p-4
            "
        >
            {fineTune.before}
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Analyst:
        </h3>

        <div class="bg-bg-light border border-border rounded-lg p-4">
           <select
                id="analyst"
                class="w-full px-3 py-2 rounded-lg bg-bg border border-border outline-none"
                {...editForm.fields.analystId.as(
                    "select",
                    fineTune.analystId!
                )}
            >
                {#each analysts as analyst}

                    <option value={analyst.id}>
                        {analyst.name}
                    </option>

                {/each}
            </select>
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            After:
        </h3>

        <div class="bg-bg-light border border-border rounded-lg p-4">
           <textarea
                id="after"
                rows="4"
                class="w-full px-3 py-2 rounded-lg bg-bg border border-border outline-none"
                {...editForm.fields.after.as("text",fineTune.after)}
            ></textarea>
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Comment:
        </h3>

        <div class="bg-bg-light border border-border rounded-lg p-4">
           <textarea
                id="comment"
                rows="4"
                class="w-full px-3 py-2 rounded-lg bg-bg border border-border outline-none"
                {...editForm.fields.comment.as("text",fineTune.comment!)}
            ></textarea>
        </div>
    </div>
</form>