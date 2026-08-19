<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import { getFineTune, getAnalysts, editForm } from "#lib/remote/registers.remote";

	let { params }: PageProps = $props();
	
	let fineTune = $derived(getFineTune(params.fineTuneID))

	// replace with single get fine tune

	// let fineTunes = $state(await getfineTunes());
	let analysts = await getAnalysts();

	// effect 

	// let index = fineTunes.findIndex((finetune) => finetune.id == params.fineTuneID);
	// let fineTune = $state(fineTunes[index])

	
</script>

<form {...editForm}>
	<h1>Edit Fine Tune</h1>

	<section class="card">
		<h2>Fine Tune Details</h2>

		<div class="infoGrid">
			<div class="info">
				<span class="title">Date:</span>
				<span>{fineTune.current?.date.toLocaleString()}</span>
			</div>

			<div class="info">
				<span class="title">Rule:</span>
				<span>{fineTune.current?.rule}</span>
			</div>

			<div class="info">
				<span class="title">Customer:</span>
				<span>{fineTune.current?.customer}</span>
			</div>

			<div class="info">
				<span class="title">Technology:</span>
				<span>{fineTune.current?.technology}</span>
			</div>
			
		</div>
	</section>

	<input type="hidden" {...editForm.fields.id.as("select", params.fineTuneID)}>

	<section class="card">
		<h2>Previous Rule</h2>
		<textarea readonly rows="4">{fineTune.current?.before}</textarea>
	</section>

	<section class="card">
		<h2>Edit Details</h2>

		<div class="field">
			<label for="analyst">Analyst:</label>
			<select
				id="analyst"
				{...editForm.fields.analystId.as("select", fineTune.current?.analystId!)}
			>
				{#each analysts as analyst}
					<option value={analyst.id}>
						{analyst.name}
					</option>
				{/each}

			</select>
		</div>

		<div class="field"> 
			<label for="after">After:</label>
			<textarea
				id="after"
				{...editForm.fields.after.as('text', fineTune.current?.after)}
				rows="4"
			></textarea>
		</div>

		<div class="field">
			<label for="comment">Comment:</label>
			<textarea
				id="comment"
				{...editForm.fields.comment.as('text', fineTune.current?.comment!)}
				rows="4"
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
