import { form, requested, getRequestEvent } from "$app/server";
import { error, isHttpError, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { customers, fine_tunes, customer_rules, tags, fine_tune_tags } from "#lib/server/db/schema";
import { eq, and, desc, sql, ne, inArray, max } from 'drizzle-orm'
// import { SvelteSet } from "svelte/reactivity";
// import { alias } from "drizzle-orm/cockroach-core";
import { getCustomerRules } from '#lib/remote/getCustomerRules.remote'
import { atLeast } from '../roles.ts'

// Need update fine tune
const updateSchema = type({
    customerRuleId: "string.numeric.parse",
    // analystID: "string.numeric.parse",
    
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
        const globalId = data.global ? crypto.randomUUID() : undefined

        const inputTags = data.newTags?.length ? data.newTags.map(term => term.trim()).filter(term => term!== '') : []
        let tagIds: number[] = [...(data.existingTags ?? [])]

        const analystId = locals.user?.analystId

       

        const finalisedAnalystId = data.finalised ? isAllowed ? locals.user?.analystId : undefined : undefined

        // let createFineTune: { id: number }[] = []

        let createFineTune = {} as { id: number}

        // Maybe put more error codes on stuff
        try {
            await db.transaction(async (tx) => {


                const previousFineTune = await tx.select({ id: fine_tunes.id, finalised: fine_tunes.finalised}).from(fine_tunes).where(eq(fine_tunes.customerRuleId, data.customerRuleId)).orderBy(desc(fine_tunes.version)).get()

                if (!previousFineTune) {
                    error(400, 'Failed to find previous fine tune')
                }

                if (!previousFineTune.finalised) {
                    error(400,  'Last fine tune has not been finalised')
                }
                createFineTune = await tx.insert(fine_tunes).values({
                    customerRuleId: data.customerRuleId, 
                    analystId: analystId,
                    fineTune: data.fineTune,
                    comment: comment,
                    expiryDate: expiryDate,
                    finalised: isAllowed ? data.finalised : false,
                    previousFineTuneId:  previousFineTune.id,
                    finalisedAnalystId: finalisedAnalystId,
                    globalId: globalId,
                    name: name,
                    // TODO: use sub query, not magic sql
                    version: sql`COALESCE(( SELECT MAX(${fine_tunes.version}) FROM ${fine_tunes} WHERE ${fine_tunes.customerRuleId} = ${data.customerRuleId} ), 0) + 1`
                }).returning({ id: fine_tunes.id }).get()


                if (inputTags.length > 0 ) {
                    // await tx.insert(tags).values(inputTags.map((name) => ({name}))).onConflictDoNothing()
                    // tagIds = await tx.select({tagId: tags.id}).from(tags).where(inArray(tags.name, inputTags))
                    await tx.insert(tags).values(inputTags.map((name) => ({name}))).onConflictDoNothing()
                    const found = await tx.select({id: tags.id}).from(tags).where(inArray(tags.name, inputTags))
                    tagIds.push(...found.map((tag) => tag.id))
                }

                tagIds = [...new Set (tagIds)]

                // await tx.delete(fine_tune_tags).where(eq(fine_tune_tags.fineTuneId, createFineTune.id))

                if (tagIds.length > 0) {
                    await tx.insert(fine_tune_tags).values(tagIds.map((tagId) => ({ fineTuneId: createFineTune.id, tagId})))
                }




                if (data.global && isAllowed) {

                    // ? Might be able to turn global customer rules into a subquery of this 
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
                    const latestVersion = db
                        .select({
                            customerRuleId: fine_tunes.customerRuleId,
                            maxVersion: max(fine_tunes.version).as('maxVersion'),
                        })
                        .from(fine_tunes)
                        .groupBy(fine_tunes.customerRuleId)
                        .as('sq');

                    // Gets the details of the latest fine tune sub query
                    const latestFineTunes = db
                        .select({
                            customerRuleId: latestVersion.customerRuleId,
                            finalised: fine_tunes.finalised,
                        })
                        .from(fine_tunes)
                        .innerJoin(latestVersion, and(eq(fine_tunes.customerRuleId, latestVersion.customerRuleId), eq(fine_tunes.version, latestVersion.maxVersion)))
                        // .where(eq(latestVersion.rowNum, 1))
                        .as('latestFineTunes')

                    // Get the customer rule id for all same ruleId, technologyId, and not already made customer id
                    const globalCustomerRules = await tx
                        .select({ id: customer_rules.id })
                        .from(customer_rules)
                        .leftJoin(customers, eq(customer_rules.customerId, customers.id))
                        // join latest fine tune
                        .leftJoin(latestFineTunes, eq(customer_rules.id, latestFineTunes.customerRuleId))
                        .where(and(
                            eq(customer_rules.ruleId, customerInfo.ruleId),
                            eq(customers.technologyId, customerInfo.technologyId),
                            ne(customers.id, customerInfo.customerId), 
                            // Latest fine tune must be finalised 
                            eq(latestFineTunes.finalised, true)
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
                                finalised: false,
                                finalisedAnalystId,
                                globalId,
                                name,
                                previousFineTuneId: sql<number>`
                                    (
                                        SELECT ${fine_tunes.id}
                                        FROM ${fine_tunes}
                                        WHERE ${fine_tunes.customerRuleId} = ${customerRule.id}
                                        ORDER BY ${fine_tunes.version} DESC
                                        LIMIT 1
                                    )`,
                                // TODO: look at correlated db select
                                // ? don't think it's possible
                                version: sql<number>`
                                    (
                                        SELECT MAX(${fine_tunes.version}) + 1
                                        FROM ${fine_tunes}
                                        WHERE ${fine_tunes.customerRuleId} = ${customerRule.id}
                                    )`
                            }))
                        ).returning({  id: fine_tunes.id })

                        // TODO: Might be a better way then deleting all and then reassigning?
                        // const globalFineTuneIds = globalFineTunes.map((ft) => ft.id)

                        // await tx.delete(fine_tune_tags).where(inArray(fine_tune_tags.fineTuneId, globalFineTuneIds))

                        if (tagIds.length > 0) {
                            await tx.insert(fine_tune_tags).values( globalFineTunes.flatMap((ft) => tagIds.map((tagId) => ({ fineTuneId: ft.id, tagId}))))
                        }
                    }
                        
                    



                }

            })// End transaction
        } catch(err) {
            if (isHttpError(error) && error.status < 500) throw err
            
            throw error(404, 'Failed to update fine tune')
        }

        for await (const { query } of requested(getCustomerRules, 1)) {
            query.refresh();
        }
        redirect(303, `/details/${data.customerRuleId}?fineTune=${createFineTune.id}`)
    }
)