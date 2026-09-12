import { query, form, command, requested } from "$app/server";
import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, fine_tunes, technologies, rules, customer_rules, tags, fine_tune_tags} from "#lib/server/db/schema";
import { eq, and, gt, asc, desc, like, lt, or, gte, lte, sql, ne, isNotNull, isNull, countDistinct, inArray, max } from 'drizzle-orm'
import { SvelteSet } from "svelte/reactivity";
import { alias } from "drizzle-orm/cockroach-core";
import { AppError } from "#lib/errors/appError";
import { getCustomerRules } from '#lib/remote/registers.remote' // change to own file

// Create customer rule and fine tune, if exist return error, do other validation, maybe redirect to the customer rule?
const createSchema = type({
    ruleID: "string.numeric.parse",
    customerID: "string.numeric.parse",
    analystID: "string.numeric.parse",
    after: "string > 0",
    global: "boolean = false",
    finalised: "boolean = false",
    "comment?": "string",
    "name?": "string",
    "expireyDate?": "string.date.parse",
    "tags?": 'string[]', 
})
export const createForm = form(
    createSchema,
    async (data) => {
        const comment = data.comment ? data.comment.trim() == "" ? null : data.comment : undefined
        const name = data.name ? data.name.trim() == "" ? null : data.name : undefined
        const expiryDate = data.expireyDate ? data.expireyDate : undefined
        const inputTags = data.tags?.length ? data.tags.map(term => term.trim()).filter(term => term!== '') : []
        const globalId = data.global ? crypto.randomUUID() : undefined
        const finalisedAnalystId = data.finalised ? data.analystID : undefined

        let createCustomerRule = {} as { id: number }
        let createFineTune = {} as { id: number }

        // Maybe put more error codes on stuff
        // No previous fine tune id insert, as these are creating all new customer rules, and new fine tunes
        try {
            await db.transaction(async (tx) => {
                createCustomerRule = await tx.insert(customer_rules).values({ ruleId: data.ruleID, customerId: data.customerID}).onConflictDoNothing().returning({ id: customer_rules.id}).get()

                if (!createCustomerRule) {
                    throw new AppError(
                        'Customer rule already exists.',
                        'CREATE_CUSTOMER_RULE',
                        409
                    )
                }

                createFineTune = await tx.insert(fine_tunes).values({
                    customerRuleId: createCustomerRule.id, 
                    analystId: data.analystID,
                    fineTune: data.after,
                    comment: comment,
                    expireyDate: expiryDate,
                    finalised: data.finalised,
                    finalisedAnalystId: finalisedAnalystId,
                    globalId: globalId,
                    name: name,
                    // Might be a better code way?
                    version: sql`COALESCE(( SELECT MAX(${fine_tunes.version}) FROM ${fine_tunes} WHERE ${fine_tunes.customerRuleId} = ${createCustomerRule.id} ), 0) + 1`
                }).returning({ id: fine_tunes.id}).get()


                let tagIds: { tagId: number }[] = []

                if (inputTags.length > 0 ) {
                    await tx.insert(tags).values(inputTags.map((name) => ({name}))).onConflictDoNothing()
                    tagIds = await tx.select({tagId: tags.id}).from(tags).where(inArray(tags.name, inputTags))
                }

                await tx.delete(fine_tune_tags).where(eq(fine_tune_tags.fineTuneId, createFineTune.id))

                if (inputTags.length > 0) {
                    await tx.insert(fine_tune_tags).values(tagIds.map(({ tagId }) => ({ fineTuneId: createFineTune.id, tagId})))
                }

                if (data.global) {
                    const technology = await tx
                        .select({ id: customers.technologyId })
                        .from(customers)
                        .where(eq(customers.id, data.customerID))
                        .get();

                    if (!technology) error(500, 'Database failed to find selected customer.');

                    const globalCustomers = await tx
                        .select({id: customers.id})
                        .from(customers)
                        .where(
                            and(
                                eq(customers.technologyId, technology.id),
                                ne(customers.id, data.customerID)
                            )
                        );

                    const globalCustomerRules = await tx
                        .insert(customer_rules)
                        .values(globalCustomers.map((customer) => ({
                                ruleId: data.ruleID,
                                customerId: customer.id
                            })))
                        .onConflictDoNothing()
                        .returning({ id: customer_rules.id })

                    const globalFineTunes = await tx.insert(fine_tunes).values(
                        globalCustomerRules.map((customerRule) => ({
                            customerRuleId: customerRule.id,
                            analystId: data.analystID,
                            fineTune: data.after,
                            comment,
                            expireyDate: expiryDate,
                            finalised: false,
                            finalisedAnalystId,
                            globalId,
                            name,
                            version: sql<number>`COALESCE( (SELECT MAX(${fine_tunes.version}) FROM ${fine_tunes} WHERE ${fine_tunes.customerRuleId} = ${customerRule.id}), 0) + 1`
                        }))
                    ).returning({ id: fine_tunes.id})

                    const globalFineTuneIds = globalFineTunes.map((ft) => ft.id)

                    await tx.delete(fine_tune_tags).where(inArray(fine_tune_tags.fineTuneId, globalFineTuneIds))

                    if (inputTags.length > 0) {
                        await tx.insert(fine_tune_tags).values( globalFineTunes.flatMap((ft) => tagIds.map(({tagId}) => ({ fineTuneId: ft.id, tagId}))))
                    }

                    await tx.delete(fine_tune_tags).where(eq(fine_tune_tags.fineTuneId, createFineTune.id))
                }
            })// End transaction
        } catch(error) {
            if (error instanceof AppError) throw error;

            throw new AppError(
                'Failed to create customer rule.',
                'CREATE_CUSTOMER_RULE',
                500
            )
        }

        for await (const { query } of requested(getCustomerRules, 1)) {
            query.refresh();
        }
        redirect(303, `/details/${createCustomerRule.id}?fineTune=${createFineTune.id}`)
    }
)