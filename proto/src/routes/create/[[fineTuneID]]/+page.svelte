<script lang="ts">
	import { goto } from '$app/navigation';
	import { getAnalysts, getCustomers, getTechnology, getRules, getFineTune, createForm } from "#lib/remote/registers.remote";
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
	
	let ftId = $derived(params.fineTuneID);
	let isExist = $derived(!!ftId);

	let fineTune = $derived(ftId ? getFineTune(ftId) : null)

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
        )?.name ?? 'No technology'
    );
</script>


<!-- the select changes, doesn't retain selection, when clicking another -->
 
<form {...createForm}>
	<h1>{isExist ? "Update Fine Tune" : "Create Fine Tune"}</h1>

    <section class="card">
        <h2>Rule Details</h2>

		{#if isExist && fineTune?.current}
			<input
				{...createForm.fields.ruleID.as(
					'hidden',
					fineTune.current.ruleId
				)}
			/>

			<input
				{...createForm.fields.customerID.as(
					'hidden',
					fineTune.current.customerId
				)}
			/>

			<div>
				<label for="rule">Rule:</label>
				<span>{fineTune?.current?.rule}</span>
			</div>

			<div>
				<label for="customer">Customer:</label>
				<span>{fineTune?.current?.customer}</span>
			</div>

			<div>
				<label for="technology">Technology:</label>
				<span>{fineTune?.current?.technology}</span>
			</div>

		{:else}
			<div>
				<label for="rule">Rule:</label>
				<select
					id="rule"
					{...createForm.fields.ruleID.as("select")}
				>
					{#each rules as rule}
						<option value={rule.id}>
							{rule.name}
						</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="customer">Customer:</label>
				<select
					id="customer"
					{...createForm.fields.customerID.as("select")}
				>
					{#each customers as customer}
						<option value={customer.id}>
							{customer.name}
						</option>
					{/each}
				</select>
			</div>

			<div>
				<label for='Technology'>Technology:</label>
				<span>{technologyName}</span>
			</div>
			
		{/if}
        
		<div>
			<input
				id="global"
				{...createForm.fields.global.as('checkbox')}
			/>
			<label for="global">
				Global — apply to all customers using this technology
			</label>
		</div>
    </section>

    <section class="card">
        <h2>Fine Tune Details</h2>
        
		<div class="field">
            <label for="after">Fine Tune Entry:</label>
            <textarea
				id="after"
				{...createForm.fields.after.as("text")}
            ></textarea>
        </div>

        <div class="field">
            <label for="analyst">Analyst:</label>
            <select
                id="analyst"
                {...createForm.fields.analystID.as("select")}
            >
                {#each analysts as analyst}
                    <option value={analyst.id}>
                        {analyst.name}
                    </option>
                {/each}
            </select>
        </div>

        <div class="field">
            <label for="comment">Comment:</label>
            <textarea
				id="comment"
				{...createForm.fields.comment.as("text")}
            ></textarea>
        </div>

        <div class="action">
			<button type="button" onclick={() => goto('/')}>Cancel</button>
			<button type="submit">Save</button>
		</div>
    </section>
</form>

<style>
	form {
		max-width: 900px;
		margin: 2rem auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem;
		border: 1px solid #ddd;
		border-radius: 10px;
		background: white;
	}
	h1, h2 {
		margin: 0
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.field label {
		font-weight: 600;
		font-size: 0.9rem;
	}
	.infoGrid { 
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}
	.info {
		display: flex;
		flex-direction: column;
	}

	textarea,
	select {
		width: 100%;
		padding: 0.75rem;
		font: inherit;
		border: 1px solid #ccc;
		border-radius: 6px;
		box-sizing: border-box;
	}

	textarea {
		resize: vertical;
		min-height: 100px;
	}

	select, 
	textarea {
		width: 100%;
		padding: 0.75rem;
		font: inherit;
		border: 1px solid #ccc;
		border-radius: 6px;
		box-sizing: border-box;
	}

	textarea {
		resize: vertical;
		min-height: 100px;
	}
	select {
		cursor: pointer;
	}

	.action {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.5rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font: inherit;
		font-weight: 600;
	}
	button:hover {
		opacity: 0.9;
	}
	
</style>
