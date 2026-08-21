<script lang="ts">
	import { getAnalysts, getCustomers, getTechnology, getRules, createForm, search } from "#lib/remote/registers.remote";
    import { getSearchContext } from "#lib/context/search";
	import { goto } from "$app/navigation";

    const searchInfo = getSearchContext()

	let analysts = await getAnalysts();
	let rules = await getRules();
	let customers = await getCustomers();
	let technologies = await getTechnology();

    const initialCustomer = customers[0]

    if (initialCustomer) {
         createForm.fields.customerID.set(initialCustomer.id);
    }
    
	const selectedCustomer = $derived(
		customers.find(
			(customer) => customer.id == createForm.fields.customerID.value()
		)
	);

	const technologyName = $derived(
		technologies.find(
			(technology) => technology.id == selectedCustomer?.technologyId
		)?.name ?? "No technology"
	);
</script>


<form {...createForm} class="max-w-5xl">

    <div class="flex items-center justify-between pb-5">

        <header class="text-3xl">
            Create Fine Tune
        </header>

        <div class="flex gap-3">
            <button 
                type="button"
                onclick={()=>goto(`/`)}
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

    <!-- Rule Details -->
    <div class="bg-bg-light border border-border rounded-lg p-5 flex flex-col gap-3">
        <div class="flex">
            <span class="w-32 text-text-muted">
                Rule:
            </span>

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

        </div>

        <div class="flex">
            <span class="w-32 text-text-muted">
                Customer:
            </span>

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
        </div>

        <div class="flex">
            <span class="w-32 text-text-muted">
                Technology:
            </span>

            <span>
                {technologyName}
            </span>
        </div>
    </div>

    <div class="mt-5 bg-bg-light border border-border rounded-lg p-5">
        <div class="flex items-center gap-3">
            <input
                id="global"
                {...createForm.fields.global.as("checkbox")}
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
                {...createForm.fields.after.as("text")}
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
                {...createForm.fields.analystID.as("select")}
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
                {...createForm.fields.comment.as("text")}
            ></textarea>
        </div>
    </div>
</form>