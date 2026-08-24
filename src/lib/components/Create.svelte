<script lang="ts">
	import { getAnalysts, getCustomers, getTechnology, getRules, getFineTune, createForm } from "#lib/remote/registers.remote";

	let { id, onCancel, onSubmit } = $props();

	let isUpdate = $derived(id !== "");


	let fineTune = $derived(id ? await getFineTune(id) : null);

	let analysts = await getAnalysts();
	let rules = await getRules();
	let customers = await getCustomers();
	let technologies = await getTechnology();

	const selectedCustomer = $derived(
		customers.find(
			(customer) => customer.id === createForm.fields.customerID.value()
		)
	);

	const technologyName = $derived(
		technologies.find(
			(technology) => technology.id === selectedCustomer?.technologyId
		)?.name ?? "No technology"
	);

    // The values are not being reset
    // Keeps old update changes on new update, with different id, refreshing fixed it
    
    function submit() {
        const id = createForm.result
        onSubmit(id)
    }

</script>


<form {...createForm} class="max-w-5xl">

    <div class="flex items-center justify-between pb-5">

        <header class="text-3xl">
            {isUpdate ? "Update Fine Tune" : "Create Fine Tune"}
        </header>

        <div class="flex gap-3">
            <button 
                type="button"
                onclick={onCancel}
                class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
            >
                Cancel
            </button>

            <button
                type="submit"
                onclick={submit}
                class="px-4 py-2 rounded-lg bg-bg-light border border-border hover:bg-linear-to-b hover:from-gradient-start hover:to-gradient-end transition"
            >
                Save
            </button>
        </div>
    </div>

    {#if isUpdate && fineTune}
        <input {...createForm.fields.ruleID.as("hidden", fineTune.ruleId)} />
        <input {...createForm.fields.customerID.as("hidden", fineTune.customerId)} />
    {/if}


    <!-- Rule Details -->
    <div class="bg-bg-light border border-border rounded-lg p-5 flex flex-col gap-3">
        <div class="flex">
            <span class="w-32 text-text-muted">
                Rule:
            </span>

            {#if isUpdate && fineTune}
                <span>
                    {fineTune.rule}
                </span>
            {:else}
                <select
                    class="flex-1 px-3 py-2 rounded-lg bg-bg border border-border outline-none"
                    {...createForm.fields.ruleID.as("select")}
                >
                    {#each rules as rule}
                        <option value={rule.id}>
                            {rule.name}
                        </option>
                    {/each}
                </select>
            {/if}
        </div>

        <div class="flex">
            <span class="w-32 text-text-muted">
                Customer:
            </span>

            {#if isUpdate && fineTune}
                <span>
                    {fineTune.customer}
                </span>
            {:else}
                <select
                    class="flex-1 px-3 py-2 rounded-lg bg-bg border border-border outline-none"
                    {...createForm.fields.customerID.as("select")}
                >
                    {#each customers as customer}
                        <option value={customer.id}>
                            {customer.name}
                        </option>
                    {/each}
                </select>
            {/if}
        </div>

        <div class="flex">
            <span class="w-32 text-text-muted">
                Technology:
            </span>

            <span>
                {isUpdate ? fineTune?.technology : technologyName}
            </span>
        </div>
    </div>

    <div class="mt-5 bg-bg-light border border-border rounded-lg p-5">
        <div class="flex items-center gap-3">
            <input
                id="global"
                {...createForm.fields.global.as("checkbox", fineTune?.global ?? false)}
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
                {...createForm.fields.after.as(
                    "text",
                    fineTune?.after ?? ""
                )}
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
                {...createForm.fields.analystID.as(
                    "select",
                    fineTune?.analystId
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
            Comment:
        </h3>
        <div class="bg-bg-light border border-border rounded-lg p-4">
            <textarea
                rows="4"
                class="w-full px-3 py-2 rounded-lg bg-bg border border-border outline-none"
                {...createForm.fields.comment.as(
                    "text",
                    fineTune?.comment ?? ""
                )}
            ></textarea>
        </div>
    </div>
</form>