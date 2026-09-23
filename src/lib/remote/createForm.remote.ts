import { form, requested } from "$app/server";
import { redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { customers, fine_tunes, customer_rules, tags, fine_tune_tags} from "#lib/server/db/schema";
import { eq, and, ne, inArray } from 'drizzle-orm'
// import { SvelteSet } from "svelte/reactivity";
// import { alias } from "drizzle-orm/cockroach-core";
import { getCustomerRules } from '#lib/remote/getCustomerRules.remote' 
import { requireRole } from '../server/guard.ts'
import { error } from '@sveltejs/kit';

// Create customer rule and fine tune, if exist return error, do other validation, maybe redirect to the customer rule?
const createSchema = type({
    ruleId: type("string.numeric.parse").configure({ message: () => "Must be selected"}),
    customerId: type("string.numeric.parse").describe("Customer").configure({ message: () => "Must be selected"}),
    "name?": type("string").configure({ message: () => "Name must be a string"}),
    fineTune: type("string > 0").configure({ message: () => "Must not be empty"}),
    global: "boolean = false",
    finalised: "boolean = false",
    createMultiple: "boolean = false",
    "comment?": "string",
    "expiryDate?": type("string"),
    "newTags?": 'string[] > 0', 
    "existingTags?": 'number[]'
})
export const createForm = form(
    createSchema,
    async (data) => {
        const analyst = requireRole('senior')

        const comment = data.comment ? data.comment.trim() == "" ? null : data.comment : undefined
        const name = data.name ? data.name.trim() == "" ? null : data.name : undefined
        const expiryDate = data.expiryDate && data.expiryDate.trim() !== '' ? new Date(data.expiryDate) : undefined
        const inputTags = data.newTags?.length ? data.newTags.map(term => term.trim()).filter(term => term!== '') : []
        let tagIds: number[] = [...(data.existingTags ?? [])]
        const globalId = data.global ? crypto.randomUUID() : undefined
        const finalisedAnalystId = data.finalised ? analyst.analystId : undefined


        let createCustomerRule = {} as { id: number }
        let createFineTune = {} as { id: number }

        // TODO: more error handlers
        // Maybe put more error codes on stuff
        // No previous fine tune id insert, as these are creating all new customer rules, and new fine tunes

            await db.transaction(async (tx) => {
                createCustomerRule = await tx.insert(customer_rules).values({ ruleId: data.ruleId, customerId: data.customerId}).onConflictDoNothing().returning({ id: customer_rules.id}).get()

                if (!createCustomerRule) {
                    error(409, "Customer rule already exists")
                }

                createFineTune = await tx.insert(fine_tunes).values({
                    customerRuleId: createCustomerRule.id, 
                    analystId: analyst.analystId,
                    fineTune: data.fineTune,
                    comment: comment,
                    expiryDate: expiryDate,
                    finalised: data.finalised,
                    finalisedAnalystId: finalisedAnalystId,
                    globalId: globalId,
                    name: name,
                    // TODO Might be a better code way, using subquery?
                    version: 1 // brand new customer rule should only have 1
                }).returning({ id: fine_tunes.id}).get()


                if (inputTags.length > 0 ) {
                    await tx.insert(tags).values(inputTags.map((name) => ({name}))).onConflictDoNothing()
                    const found = await tx.select({id: tags.id}).from(tags).where(inArray(tags.name, inputTags))
                    tagIds.push(...found.map((tag) => tag.id))
                }

                tagIds = [...new Set (tagIds)] // no duplicates


                if (tagIds.length > 0) {
                    await tx.insert(fine_tune_tags).values(tagIds.map(( tagId ) => ({ fineTuneId: createFineTune.id, tagId})))
                }



                if (data.global) { 

                    
                    const technology = await tx
                        .select({ id: customers.technologyId })
                        .from(customers)
                        .where(eq(customers.id, data.customerId))
                        .get();

                    if (!technology) {
                        error(404, "Database failed to find selected customer")
                    }

                    // Find all customers with same technology id
                    const globalCustomers = await tx
                        .select({id: customers.id})
                        .from(customers)
                        .where(
                            and(
                                eq(customers.technologyId, technology.id),
                                ne(customers.id, data.customerId)
                            )
                        )


                    if (globalCustomers.length > 0) {

                        // Make customer rules for all those who don't have a rule yet. If customer rule exists, I ignore it
                        const globalCustomerRules = await tx
                            .insert(customer_rules)
                            .values(globalCustomers.map((customer) => ({
                                    ruleId: data.ruleId,
                                    customerId: customer.id
                                })))
                            .onConflictDoNothing()
                            .returning({ id: customer_rules.id })


                        if (globalCustomerRules.length > 0) {
                            // Make fine tunes for those customers 
                            const globalFineTunes = await tx.insert(fine_tunes).values(
                                globalCustomerRules.map((customerRule) => ({
                                    customerRuleId: customerRule.id,
                                    analystId: analyst.analystId,
                                    fineTune: data.fineTune,
                                    comment,
                                    expiryDate: expiryDate,
                                    finalised: false,
                                    finalisedAnalystId,
                                    globalId,
                                    name,
                                    // TODO: Make possible sub query
                                    version: 1 // Brand new customer rule, so only be 1
                                }))
                            ).returning({ id: fine_tunes.id})

                            if (tagIds.length > 0) {
                                await tx.insert(fine_tune_tags).values( globalFineTunes.flatMap((ft) => tagIds.map((tagId) => ({ fineTuneId: ft.id, tagId}))))
                            }
                        }
                    }
                
                }
            })// End transaction

        for await (const { query } of requested(getCustomerRules, 1)) {
            query.refresh();
        }
        if (data.createMultiple) return

        redirect(303, `/details/${createCustomerRule.id}?fineTune=${createFineTune.id}`)
    }
)