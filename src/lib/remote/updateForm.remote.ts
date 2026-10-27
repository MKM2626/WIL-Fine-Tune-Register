import { form, requested, getRequestEvent } from "$app/server";
import { error, isHttpError, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { customers, fine_tunes, customer_rules, tags, fine_tune_tags } from "#lib/server/db/schema";
import { eq, and, desc, ne, inArray, max, isNotNull } from 'drizzle-orm'
import { getCustomerRules } from '#lib/remote/getCustomerRules.remote'
import { atLeast } from '../roles.ts'

const updateSchema = type({
    customerRuleId: "string.numeric.parse",
    fineTune: type("string > 0").configure({ message: () => "Must not be empty"}),
    global: "boolean = false",
    finalised: "boolean = false",
    "comment?": "string",
    "name?": "string",
    "expiryDate?": "string",
    "newTags?": 'string[]', 
    "existingTags?": 'number[]'
})
export const updateForm = form(
    updateSchema,
    async (data) => {
        const { locals } = getRequestEvent()
        if (!locals.user) error(401, 'Please sign in.')
        const isAllowed = atLeast(locals.user?.role, 'senior')

        const comment = data.comment ? data.comment.trim() == "" ? null : data.comment : undefined
        const name = data.name ? data.name.trim() == "" ? null : data.name : undefined
        const expiryDate = data.expiryDate && data.expiryDate.trim() !== '' ?  new Date(data.expiryDate) : undefined
        const globalId = data.global && isAllowed ? crypto.randomUUID() : undefined 

        const inputTags = data.newTags?.length ? data.newTags.map(term => term.trim()).filter(term => term!== '') : []
        let tagIds: number[] = [...(data.existingTags ?? [])]

        const analystId = locals.user?.analystId

       

        const finalisedAnalystId = data.finalised ? isAllowed ? locals.user?.analystId : undefined : undefined

        let createFineTune = {} as { id: number}

        // Maybe put more error codes on stuff
        try {
            await db.transaction(async (tx) => {

                const previousFineTune = await tx.select({ id: fine_tunes.id, finalisedAnalystId: fine_tunes.finalisedAnalystId, version: fine_tunes.version}).from(fine_tunes).where(eq(fine_tunes.customerRuleId, data.customerRuleId)).orderBy(desc(fine_tunes.version)).get()

                if (!previousFineTune) error(400, 'Failed to find previous fine tune')

                if (!previousFineTune.finalisedAnalystId) error(400,  'Last fine tune has not been finalised')

                createFineTune = await tx.insert(fine_tunes).values({
                    customerRuleId: data.customerRuleId, 
                    analystId: analystId,
                    fineTune: data.fineTune,
                    comment: comment,
                    expiryDate: expiryDate,
                    previousFineTuneId: previousFineTune.id,
                    finalisedAnalystId: finalisedAnalystId,
                    globalId: globalId,
                    name: name,
                    version: previousFineTune.version + 1
                }).returning({ id: fine_tunes.id }).get()

                if (inputTags.length > 0 ) {
                    await tx.insert(tags).values(inputTags.map((name) => ({name}))).onConflictDoNothing()
                    const found = await tx.select({id: tags.id}).from(tags).where(inArray(tags.name, inputTags))
                    tagIds.push(...found.map((tag) => tag.id))
                }

                tagIds = [...new Set (tagIds)]

                if (tagIds.length > 0) {
                    await tx.insert(fine_tune_tags).values(tagIds.map((tagId) => ({ fineTuneId: createFineTune.id, tagId})))
                }

                if (data.global && isAllowed) {

                    // Get technology, rule and customer id of entered customer rule
                    const customerInfo = await tx
                        .select({
                            ruleId: customer_rules.ruleId,
                            customerId: customer_rules.customerId,
                            technologyId: customers.technologyId
                        })
                        .from(customer_rules)
                        .innerJoin(customers, eq(customer_rules.customerId, customers.id))
                        .where(eq(customer_rules.id, data.customerRuleId))
                        .get()

                    if (!customerInfo) {
                        error(404, 'Database failed to find selected customer')
                    }

                    // Gets latest fine tunes sub query
                    const latestVersion = tx
                        .select({
                            customerRuleId: fine_tunes.customerRuleId,
                            maxVersion: max(fine_tunes.version).as('maxVersion'),
                        })
                        .from(fine_tunes)
                        .groupBy(fine_tunes.customerRuleId)
                        .as('sq');

                    // Gets the details of the latest fine tune sub query
                    const latestFineTunes = tx
                        .select({
                            id: fine_tunes.id,
                            version: fine_tunes.version,
                            customerRuleId: latestVersion.customerRuleId,
                            finalisedAnalystId: fine_tunes.finalisedAnalystId,
                        })
                        .from(fine_tunes)
                        .innerJoin(latestVersion, and(eq(fine_tunes.customerRuleId, latestVersion.customerRuleId), eq(fine_tunes.version, latestVersion.maxVersion)))
                        // .where(eq(latestVersion.rowNum, 1))
                        .as('latestFineTunes')

                    // Get the customer rule id for all same ruleId, technologyId, and not already made customer id
                    const globalCustomerRules = await tx
                        .select({ id: customer_rules.id, fineTuneId: latestFineTunes.id, version: latestFineTunes.version })
                        .from(customer_rules)
                        .leftJoin(customers, eq(customer_rules.customerId, customers.id))
                        // join latest fine tune
                        .leftJoin(latestFineTunes, eq(customer_rules.id, latestFineTunes.customerRuleId))
                        .where(and(
                            eq(customer_rules.ruleId, customerInfo.ruleId),
                            eq(customers.technologyId, customerInfo.technologyId),
                            ne(customers.id, customerInfo.customerId), 
                            // Latest fine tune must be finalised 
                            isNotNull(latestFineTunes.finalisedAnalystId)
                            )
                        )

                    if (globalCustomerRules.length > 0) {

                        const globalFineTunes = await tx.insert(fine_tunes).values(
                            globalCustomerRules.map((customerRule) => ({
                                customerRuleId: customerRule.id,
                                analystId: analystId,
                                fineTune: data.fineTune,
                                comment,
                                expiryDate: expiryDate,
                                finalisedAnalystId,
                                globalId,
                                name,
                                previousFineTuneId: customerRule.fineTuneId,
                                version: customerRule.version! + 1,
                            }))
                        ).returning({  id: fine_tunes.id })

                        if (tagIds.length > 0) {
                            await tx.insert(fine_tune_tags).values( globalFineTunes.flatMap((ft) => tagIds.map((tagId) => ({ fineTuneId: ft.id, tagId}))))
                        }
                    }
                }

            })
        } catch(err) {
            if (isHttpError(err) && err.status < 500) throw err
            console.log(err)
            
            throw error(404, 'Failed to update fine tune')
        }

        for await (const { query } of requested(getCustomerRules, 1)) {
            query.refresh();
        }
        redirect(303, `/details/${data.customerRuleId}?fineTune=${createFineTune.id}`)
    }
)