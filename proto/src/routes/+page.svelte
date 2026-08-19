<script lang="ts">
   import { search } from "#lib/remote/registers.remote";
   import { deleteRow } from "#lib/remote/registers.remote";

   // filter options
   const textOp = ["Contains", "Equals", "Does not contain"];
   const dateOp = ["Contains", "Greater than", "Less than"];
   const boolOp = ["Yes", "No", "Any"];

   // Inputs
   let date = $state("");
   let ruleName = $state("");
   let customer = $state("");
   let technology = $state("");
   let before = $state("");
   let after = $state("");
   let analyst = $state("");
   let comments = $state("");

   let global = $state("Any");

   // Operations
   let dateOperation = $state("Contains");
   let ruleOperation = $state("Contains");
   let customerOperation = $state("Contains");
   let technologyOperation = $state("Contains");
   let beforeOperation = $state("Contains");
   let afterOperation = $state("Contains");
   let analystOperation = $state("Contains");
   let commentsOperation = $state("Contains");

   // Filters
   let appliedFilters = $state<Record<string, unknown>>({});

   // Pagination 
   let page = $state(1)
   let pageSize = $state(500)

   let pageInput = $state(1);
   let pageSizeInput = $state(500);

   // The results from call
   let results = $derived(search({...appliedFilters, page, pageSize}))

   // Pagination controls
   async function applyPageSize() {
      if (pageSizeInput < 1) {
         pageSizeInput = 1;
      }
      if (pageSizeInput >= 1000) {
         pageSizeInput = 1000;
      }

      pageSize = pageSizeInput;
      page = 1;
      pageInput = 1;
   }

   async function applyPage() {
      const maxPage = (await results).totalPages
      if (pageInput < 1) {
         pageInput = 1;
      }
      if (pageInput > maxPage) {
         pageInput = maxPage
      }

      page = pageInput;
   }

   async function previousPage() {
      if (page > 1) {
         page--;
         pageInput = page;
      }
   }

   async function nextPage() {
      const maxPage = (await results).totalPages
      if (page < maxPage) {
         page++;
         pageInput = page;
      }
   }

   // Delete row
   async function del(id: string) {
      await deleteRow(id)
      // await search({...appliedFilters, page, pageSize}).refresh();
      await results.refresh()
   }

   // Build filter 
   function buildFilters() {
      const filters: Record<string, unknown> = {};

      if (date !== "") {
         filters.date = {
               value: new Date(date),
               operation: dateOperation
         };
      }

      if (ruleName !== "") {
         filters.ruleName = {
               value: ruleName,
               operation: ruleOperation
         };
      }

      if (customer !== "") {
         filters.customer = {
               value: customer,
               operation: customerOperation
         };
      }

      if (technology !== "") {
         filters.technology = {
               value: technology,
               operation: technologyOperation
         };
      }

      if (before !== "") {
         filters.before = {
               value: before,
               operation: beforeOperation
         };
      }

      if (after !== "") {
         filters.after = {
               value: after,
               operation: afterOperation
         };
      }

      if (analyst !== "") {
         filters.analyst = {
               value: analyst,
               operation: analystOperation
         };
      }

      if (comments !== "") {
         filters.comments = {
               value: comments,
               operation: commentsOperation
         };
      }

      if (global !== "Any") {
         filters.global = {
               value: global === "Yes"
         };
      }
      return filters;
   }

   function filterBtn() {
      appliedFilters = buildFilters()
      page = 1;
      pageInput = 1;
   }

   const direction = ''
   

</script>

<table class="border-separate border border-gray-400 table-auto">
   <thead>
      <tr>
        <th colspan="12">
            <div class="flex items-center justify-between px-5">
                
               <div class="flex items-center gap-3">
                  <label>
                     Page size:
                     <input
                        type="number"
                        bind:value={pageSizeInput}
                        onblur={applyPageSize}
                        onkeydown={(e) => {
                           if (e.key === "Enter") applyPageSize();
                        }}
                     />
                     of {(await results).totalRows} rows
                  </label>
               </div>

               <div class="flex items-center gap-3">
                  <button
                     type="button"
                     onclick={previousPage}
                     disabled={page < 2}
                  >
                     previous
                  </button>

                  <label>
                     Page:
                     <input
                           type="number"
                           bind:value={pageInput}
                           max={(await results).totalPages}
                           onblur={applyPage}
                           onkeydown={(e) => {
                              if (e.key === "Enter") applyPage();
                           }}
                     />
                     of {(await results).totalPages}
                  </label>

                  <button
                     type="button"
                     onclick={nextPage}
                     disabled={page >= (await results).totalPages}
                  >
                     Next
                  </button>
               </div>

            </div>
         </th>
      </tr>

      <tr>
         <th class="border border-gray-300 ..." rowspan="2">Date</th>
         <th class="border border-gray-300 ..." rowspan="2">Rule Name</th>
         <th class="border border-gray-300 ..." rowspan="2">Customer</th>
         <th class="border border-gray-300 ..." rowspan="2">Technology</th>
         <th class="border border-gray-300 ..." colspan="2">Fine Tune</th>
         <th class="border border-gray-300 ..." rowspan="2">Global Candidant</th>
         <th class="border border-gray-300 ..." rowspan="2">Analyst</th>
         <th class="border border-gray-300 ..." rowspan="2">Comments</th>
         <th class="border border-gray-300 ..." rowspan="2" colspan="3"><a href="/create">Create</a></th>
      </tr>
      <tr>
         <th class="border border-gray-300 ...">Before</th>
         <th class="border border-gray-300 ...">After</th>
      </tr>

      <!-- search -->
       <!-- maybe do onblur and onclick on below? instead of filter button? Nah-->
      <tr>
         <th class="border border-gray-300 ..."><input type="date" bind:value={date}></th>
         <th class="border border-gray-300 ..."><input bind:value={ruleName}></th>
         <th class="border border-gray-300 ..."><input bind:value={customer}></th>
         <th class="border border-gray-300 ..."><input bind:value={technology}></th>
         <th class="border border-gray-300 ..."><input bind:value={before}></th>
         <th class="border border-gray-300 ..."><input bind:value={after}></th>
         <th class="border border-gray-300 ..." rowspan="2">
            <select bind:value={global}>
               {#each boolOp as op}
                  <option value={op}>
                     {op}
                  </option>
               {/each}
            </select>
         </th>
         <th class="border border-gray-300 ..."><input bind:value={analyst}></th>
         <th class="border border-gray-300 ..."><input bind:value={comments}></th>
         <th class="border border-gray-300 ..." rowSpan="2" colspan="3"><button type="button" onclick={filterBtn}>Filter</button></th>
      </tr>
      <!-- filter -->
      <tr>
         <th class="border border-gray-300 ...">
            <select bind:value={dateOperation}>
               {#each dateOp as op}
                  <option value={op}>
                     {op}
                  </option>
               {/each}
            </select>
         </th>
         <th class="border border-gray-300 ...">
            <select bind:value={ruleOperation}>
               {#each textOp as op}
                  <option value={op}>
                     {op}
                  </option>
               {/each}
            </select>
         </th>
         <th class="border border-gray-300 ...">
            <select bind:value={customerOperation}>
               {#each textOp as op}
                  <option value={op}>
                     {op}
                  </option>
               {/each}
            </select>
         </th>
         <th class="border border-gray-300 ...">
            <select bind:value={technologyOperation}>
               {#each textOp as op}
                  <option value={op}>
                     {op}
                  </option>
               {/each}
            </select>
         </th>
         <th class="border border-gray-300 ...">
            <select bind:value={beforeOperation}>
               {#each textOp as op}
                  <option value={op}>
                     {op}
                  </option>
               {/each}
            </select>
         </th>
         <th class="border border-gray-300 ...">
            <select bind:value={afterOperation}>
               {#each textOp as op}
                  <option value={op}>
                     {op}
                  </option>
               {/each}
            </select>
         </th>
         <th class="border border-gray-300 ...">
            <select bind:value={analystOperation}>
               {#each textOp as op}
                  <option value={op}>
                     {op}
                  </option>
               {/each}
            </select>
         </th>
         <th class="border border-gray-300 ...">
            <select bind:value={commentsOperation}>
               {#each textOp as op}
                  <option value={op}>
                     {op}
                  </option>
               {/each}
            </select>
         </th>
      </tr>

      
   </thead>
   <tbody>
      {#each (await results).data as row}
         <tr>
            <td class="border border-gray-300 ...">{row.date.toISOString()}</td>
            <td class="border border-gray-300 ...">{row.rule}</td>
            <td class="border border-gray-300 ...">{row.customer}</td>
            <td class="border border-gray-300 ...">{row.technology}</td>
            <td class="border border-gray-300 ...">{row.before}</td>
            <td class="border border-gray-300 ...">{row.after}</td>
            <td class="border border-gray-300 ...">{row.global ? 'Yes' : 'No'}</td>
            <td class="border border-gray-300 ...">{row.analyst}</td>
            <td class="border border-gray-300 ...">{row.comment}</td>

            <!-- Buttons -->
            <td class="border border-gray-300 ...">
               <a href="/edit/{row.id}">EDIT</a>
            </td>
            <td class="border border-gray-300 ...">
               <a href="/create/{row.id}">UPDATE</a>
            </td>
            <td class="border border-gray-300 ...">
               <button type="button" onclick={() => del(row.id)}>DELETE</button>
            </td>
         </tr>
      
      {/each}
   </tbody>
</table>

<style>
   
</style>
