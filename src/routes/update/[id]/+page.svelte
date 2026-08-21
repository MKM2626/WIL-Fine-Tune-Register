<script lang="ts">
	import { getAnalysts, getFineTune, createForm, search } from "#lib/remote/registers.remote";
    import { getSearchContext } from "#lib/context/search";
	import { goto } from "$app/navigation";


    const searchInfo = getSearchContext()

	let { params } = $props();

    let id = $derived(params.id)

	let fineTune = $derived(await getFineTune(id));

	let analysts = await getAnalysts();
 
   
</script>

<form {...createForm} class="max-w-5xl">

    <div class="flex items-center justify-between pb-5">

        <header class="text-3xl">
            Update Fine Tune
        </header>

        <div class="flex gap-3">
            <button 
                type="button"
                onclick={()=>goto(`/details/${params.id}`)}
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

    <input {...createForm.fields.ruleID.as("hidden", fineTune.ruleId)} />
    <input {...createForm.fields.customerID.as("hidden", fineTune.customerId)} />

    <div class="bg-bg-light border border-border rounded-lg p-5 flex flex-col gap-3">
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

    <div class="mt-5 bg-bg-light border border-border rounded-lg p-5">
        <div class="flex items-center gap-3">
            <input
                id="global"
                {...createForm.fields.global.as("checkbox", fineTune.global)}
                class={`appearance-none h-3 w-3 border rounded-xs shadow-sm align-bottom relative flex items-center justify-center font-bold text-[12px] text-white cursor-pointer
                        ${createForm.fields.global.value() ? 'bg-green-500 border-green-500 before:content-["✓"]' : 'bg-red-500 border-red-500 before:content-["✗"]'}`}
            />
            <label for="global">
                Global — apply to all customers using this technology
            </label>
        </div>
    </div>


    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Fine Tune Entry:
        </h3>

        <div class="bg-bg-light border border-border rounded-lg p-4">
            <textarea
                rows="4"
                class="w-full px-3 py-2 rounded-lg bg-bg border border-border outline-none"
                {...createForm.fields.after.as("text", fineTune.after)}
            ></textarea>
        </div>
    </div>

    <div class="mt-5">
        <h3 class="text-xl mb-2">
            Analyst:
        </h3>

        <div class="bg-bg-light border border-border rounded-lg p-4">
            <select
                class="w-full px-3 py-2 rounded-lg bg-bg border border-border outline-none"
                {...createForm.fields.analystID.as("select", fineTune.analystId)}
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
            Comment:
        </h3>
        <div class="bg-bg-light border border-border rounded-lg p-4">
            <textarea
                rows="4"
                class="w-full px-3 py-2 rounded-lg bg-bg border border-border outline-none"
                {...createForm.fields.comment.as("text", fineTune.comment ?? "")}
            ></textarea>
        </div>
    </div>
</form>