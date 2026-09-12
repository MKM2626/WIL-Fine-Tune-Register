import { query, form, command, requested } from "$app/server";
import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, fine_tunes, technologies, rules, customer_rules, tags, fine_tune_tags} from "#lib/server/db/schema";
import { eq, and, gt, asc, desc, like, lt, or, gte, lte, sql, ne, isNotNull, isNull, countDistinct, inArray, max } from 'drizzle-orm'
import { SvelteSet } from "svelte/reactivity";
import { alias } from "drizzle-orm/cockroach-core";
import { AppError } from "#lib/errors/appError";


// get one fine tune detail
const ftSchema = type("string.numeric.parse")
export const getFineTune = query(ftSchema, async (ftId) => {
    const creatorAnalyst = alias(analysts, "creator_analyst")
    const finaliseAnalyst = alias(analysts, 'finalise_analyst')
    const previousFineTune = alias(fine_tunes, 'previous_fine_tune');

    const before = db
        .select({fineTune: previousFineTune.fineTune})
        .from(previousFineTune)
        .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
        .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
        .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
        .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
        .where(
            and(
                eq(previousFineTune.customerRuleId, fine_tunes.customerRuleId),
                lt(previousFineTune.date, fine_tunes.date)
            )
        )
        .orderBy(desc(previousFineTune.date))
        .get()

    const result = await db.select({
        date: fine_tunes.date,
        customerRuleId: fine_tunes.customerRuleId,
        name: fine_tunes.name,
        rule: rules.name,
        customer: customers.name,
        technology: technologies.name,

        // Look at better ways, and more code like practices
        before: sql<string>`COALESCE((${before}),'Initial Rule')`,
        after: fine_tunes.fineTune,
        globalId: fine_tunes.globalId,
        finalised: fine_tunes.finalised,

        analystId: creatorAnalyst.id,
        analyst: creatorAnalyst.name,

        finalisedAnalystId: finaliseAnalyst.id,
        finalisedAnalystName: finaliseAnalyst.name,
        comment: fine_tunes.comment
    })
    .from(fine_tunes)
    .leftJoin(customer_rules, eq(fine_tunes.customerRuleId, customer_rules.id))
    .leftJoin(customers, eq(customer_rules.customerId, customers.id))
    .leftJoin(rules, eq(customer_rules.ruleId, rules.id))
    .leftJoin(technologies, eq(customers.technologyId, technologies.id))
    .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
    .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
    .where(eq(fine_tunes.id, ftId))
    .get()

    if (!result) error(404, 'Fine tune does not exist.')


    // use .get to throw errors, if !result throw new error('Fine tune does not exist')
    // const [isBefore] = await db.select({before: fine_tunes.fineTune}).from(fine_tunes).where(and(eq(fine_tunes.customerRuleId, result.customerRuleId), lt(fine_tunes.date, result.date))).orderBy(desc(fine_tunes.date)).limit(1)

    return { 
        date: result.date,
        customerRuleId: String(result.customerRuleId),
        rule: result.rule,
        customer: result.customer,
        // technologyId: String(result.technologyId),
        technology: result.technology,
        // before: isBefore?.before ?? "Initial Rule", 
        before: result.before,
        after: result.after, 
        finalised: result.finalised,
        global: result.globalId == null ? false : true,
        analystId: String(result.analystId),
        analyst: result.analyst,
        comment: result.comment
    }
})


// Don't think would use?
export const getDetails = query(ftSchema, async (crId) => {
    const result = await db.select({
        date: customer_rules.date,
        rule: rules.name,
        customer: customers.name
    })
    .from(customer_rules)
    .leftJoin(customers, eq(customer_rules.customerId, customers.id))
    .leftJoin(rules, eq(customer_rules.ruleId, rules.id))
    .where(eq(customer_rules.id, crId))
    .get()

    if (!result) error(404, "Customer Rule does not exist.")

    return result
})

    // .leftJoin(analysts, eq(fine_tunes.analystId, analysts.id))
            // .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
            // .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))

// get multiple fine tune details
const gFTSchema = type({
    customerRuleId: "string.numeric.parse",
    page: "number > 0",
    pageSize: "number > 0",
    descending: "boolean = true",

    "search?": ['instanceof', SvelteSet<string>],

    "name?": "0 < string < 73",
    "fineTune?": "string > 0",
    "analyst?": "0 < string < 255",
    "finalisedAnalyst?": "0 < string < 255",
    "comment?": "string",
    "tags?": ['instanceof', SvelteSet<string>],

    "expireyDate?": "boolean",

    "global?": "boolean",
    "finalised?": "boolean",

    "fineTuneId?": "string.numeric.parse",

    "start?": "Date",
    "end?": "Date",
})
// ADD PAGE RANGE, NOT JUST A PAGE. START PAGE, END PAGE.
export const getFineTuneDetails = query(gFTSchema, async (data) => {
    const searchTerms = data.search?.size ? Array.from(data.search, term => term.trim()).filter(term => term!== '') : []
    const searchTags = data.tags?.size ? Array.from(data.tags, term => term.trim()).filter(term => term!== '') : []

    const creatorAnalyst = alias(analysts, "creator_analyst")
    const finaliseAnalyst = alias(analysts, 'finalise_analyst')
    const previousFineTune = alias(fine_tunes, 'previous_fine_tune')

    const where = and(
        searchTerms.length ? and(
            ...searchTerms.map(term => or(
                like(fine_tunes.name, `%${term}%`), 
                like(fine_tunes.fineTune, `%${term}%`),
                like(analysts.name, `%${term}%`),
                like(fine_tunes.comment, `%${term}%`),
                like(tags.name, `%${term}%`)
            ))
        ) : undefined,

        data.name ? like(fine_tunes.name, `%${data.name}%`) : undefined,
        data.fineTune ? like(fine_tunes.fineTune, `%${data.fineTune}%`) : undefined,
        data.analyst ? and(like(analysts.name, data.analyst), eq(fine_tunes.analystId, analysts.id)) : undefined,
        data.finalisedAnalyst ? and(like(analysts.name, data.finalisedAnalyst), eq(fine_tunes.finalisedAnalystId, analysts.id)) : undefined,
        data.comment ? like(fine_tunes.comment, data.comment) : undefined,

        searchTags.length ? and(
            ...searchTags.map(term => like(tags.name, `%${term}%`))
        ) : undefined,

        data.expireyDate !== undefined ? data.expireyDate ? isNotNull(fine_tunes.expireyDate) : isNull(fine_tunes.expireyDate) : undefined,
        data.finalised !== undefined ? eq(fine_tunes.finalised, data.finalised) : undefined,
        data.global !== undefined ? data.global ? isNotNull(fine_tunes.globalId) : isNull(fine_tunes.globalId) : undefined,

        data.start ? gte(fine_tunes.date, data.start) : undefined,
        data.end ? lte(fine_tunes.date, data.end) : undefined,
    )

    const [{ totalRows }] = await db
        .select({
            totalRows: countDistinct(fine_tunes.id)
        })
        .from(fine_tunes)
        .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
        .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
        .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
        .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
        .where(where)
    
    const totalPages = Math.ceil(totalRows / data.pageSize)
    const sort = data.descending ? desc(fine_tunes.date) : asc(fine_tunes.date)

    let page = data.page

    if (data.fineTuneId) {
        const selected = await db
            .select({
                date: fine_tunes.date
            })
            .from(fine_tunes)
            .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
            .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
            .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
            .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
            .where(and(where, eq(fine_tunes.id, data.fineTuneId)))
            .get();

        if (!selected) error(404, "Fine Tune does not exist.")

        const [{selectedCount}] = await db
            .select({ selectedCount: countDistinct(fine_tunes.id)})
            .from(fine_tunes)
            .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
            .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
            .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
            .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
            .where(and(where, data.descending? gt(fine_tunes.date, selected.date) : lt(fine_tunes.date, selected.date)))

        page = Math.floor(selectedCount / data.pageSize) + 1;
    }

    const before = db
        .select({fineTune: previousFineTune.fineTune})
        .from(previousFineTune)
        .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
        .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
        .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
        .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
        .where(
            and(
                eq(previousFineTune.customerRuleId, fine_tunes.customerRuleId),
                lt(previousFineTune.date, fine_tunes.date)
            )
        )
        .orderBy(desc(previousFineTune.date))
        .get()

    const rows = await db
        .select({
            id: sql<string>`${fine_tunes.id}`.mapWith(String), 
            date: fine_tunes.date,
            name: fine_tunes.name,
            before: sql<string>`COALESCE((${before}),'Initial Rule')`,
            
            after: fine_tunes.fineTune,
            globalId: fine_tunes.globalId,
            finalised: fine_tunes.finalised,
            analystName: creatorAnalyst.name,
            finaliseAnalystName: finaliseAnalyst.name,
            comment: fine_tunes.comment,
            tags: sql<string[]>`json_group_array(${tags.name})`.as('tags'),
            version: fine_tunes.version
        })
        .from(fine_tunes)
        .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
        .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
        .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
        .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
        .where(where)
        .orderBy(sort)
        .groupBy(fine_tunes.id)
        .limit(data.pageSize)
        .offset((page - 1) * data.pageSize)

    return {
        rows,
        page, 
        pageSize: data.pageSize,
        totalRows,
        totalPages
    }
})

// customer rule only
// take in cr id

const crSchema = type("string.numeric.parse")
export const getCustomerRuleDetails = query(crSchema, async (crId) => {
    const result = await db.select({
        date: customer_rules.date,
        rule: rules.name,
        customer: customers.name,
        technology: technologies.name,
    })
    .from(customer_rules)
    .leftJoin(customers, eq(customer_rules.customerId, customers.id))
    .leftJoin(rules, eq(customer_rules.ruleId, rules.id))
    .leftJoin(technologies, eq(customers.technologyId, technologies.id))
    .where(eq(customer_rules.id, crId))
    .get()

    if (!result) error(404, "Customer Rule does not exist.")

    return result
})

// Should also be fine?, CHECK analysts
// return number as string
export const getRules = query(async() => {
    return await db.select({id: sql<string>`${rules.id}`.mapWith(String), name: sql<string>`${rules.name}`.mapWith(String)}).from(rules)
})

export const getAnalysts = query(async() => { 
    return await db.select({id: sql<string>`${analysts.id}`.mapWith(String), name: sql<string>`${analysts.name}`.mapWith(String)}).from(analysts)
})

export const getCustomers = query(async() => {
    return await db.select({id: sql<string>`${customers.id}`.mapWith(String), name: sql<string>`${customers.name}`.mapWith(String), technologyId: sql<string>`${customers.technologyId}`.mapWith(String)}).from(customers)
})

export const getTechnology = query(async() => {
    return await db.select({id: sql<string>`${technologies.id}`.mapWith(String), name: sql<string>`${technologies.name}`.mapWith(String)}).from(technologies)
})


// should be fine?
const dSchema = type("string.numeric.parse")
export const deleteFineTune = command(dSchema, async (ftID) => {
    // throw new Error() or error()
    const result = await db.delete(fine_tunes).where(eq(fine_tunes.id, ftID))

    if (!result) {
        throw new AppError(
            'Failed to delete fine tune.',
            'FINE_TUNE_DELETE'
        )
    }

    for await (const { query } of requested(getCustomerRules, 1)) {
        query.refresh();
    }
    return { success: true} 
});

export const deleteCustomerRule = command(dSchema, async (crId) => {
    // throw new Error() or error()

    const result = await Promise.all([
        db.delete(fine_tunes).where(eq(fine_tunes.customerRuleId, crId)),
        db.delete(customer_rules).where(eq(customer_rules.id, crId))
    ])

    if (!result) {
        if (!result) {
            throw new AppError(
                'Failed to delete customer rule.',
                'CUSTOMER_RULE_DELETE'
            )
        }
    }

    for await (const { query } of requested(getCustomerRules, 1)) {
        query.refresh();
    }
    return { success: true} 
});


// Update other fields?
const editSchema = type({
        id: "string.numeric.parse",
        analystId: "string.numeric.parse",
        "after?": "string > 0",
        "finalised?": "boolean",
        "comment?": "string",
        "tags?": "string[]",
    })
export const editForm = form(
    editSchema, async (data) => {

        const inputTags = data.tags?.length ? data.tags.map(term => term.trim()).filter(term => term!== '') : []

        try {
            await db.transaction(async (tx) => {


                let tagIds: { tagId: number }[] = []

                if (inputTags.length > 0 ) {
                    await tx.insert(tags).values(inputTags.map((name) => ({name}))).onConflictDoNothing()
                    tagIds = await tx.select({tagId: tags.id}).from(tags).where(inArray(tags.name, inputTags))
                }

                await tx.delete(fine_tune_tags).where(eq(fine_tune_tags.fineTuneId, data.id))

                if (inputTags.length > 0) {
                    await tx.insert(fine_tune_tags).values(tagIds.map(({ tagId }) => ({ fineTuneId: data.id, tagId})))
                }



                const finalised = await tx.select({finalised: fine_tunes.finalised}).from(fine_tunes).where(eq(fine_tunes.id, data.id)).get()

                await tx.update(fine_tunes)
                    .set({
                        fineTune: data.after ? finalised?.finalised ? data.after : undefined : undefined,
                        comment: data.comment ? data.comment.trim() == "" ? null : data.comment : undefined,
                        finalised: data.finalised !== undefined ? finalised?.finalised ? data.finalised ? true : false : undefined : undefined,
                        analystId: data.analystId
                    })
                    .where(eq(fine_tunes.id, data.id))


            });
        } catch(error) {
            throw new AppError(
                'Failed to edit fine tune.',
                'FINE_TUNE_EDIT'
            )
        }

        for await (const { query } of requested(getCustomerRules, 1)) {
            query.refresh();
        }

        redirect(303, `/details/${data.id}`)
    }
)

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

// Need update fine tune
const updateSchema = type({
    customerRuleId: "string.numeric.parse",
    analystID: "string.numeric.parse",
    after: "string > 0",
    global: "boolean = false",
    finalised: "boolean = false",
    "comment?": "string",
    "name?": "string",
    "expireyDate?": "string.date.parse",
    "tags?": 'string[]', 
})
export const updateForm = form(
    updateSchema,
    async (data) => {
        const comment = data.comment ? data.comment.trim() == "" ? null : data.comment : undefined
        const name = data.name ? data.name.trim() == "" ? null : data.comment : undefined
        const expiryDate = data.expireyDate ? data.expireyDate : undefined
        const tags = data.tags?.length ? data.tags.map(term => term.trim()).filter(term => term!== '') : []
        const globalId = data.global ? crypto.randomUUID() : undefined
        const finalisedAnalystId = data.finalised ? data.analystID : undefined

        let createFineTune: { id: number }[] = []

        // Maybe put more error codes on stuff
        try {
            await db.transaction(async (tx) => {
                // await Promise.all([
                //     (async () => {
                        const previousFineTuneId = tx.select({ id: fine_tunes.id}).from(fine_tunes).where(eq(fine_tunes.customerRuleId, data.customerRuleId)).orderBy(desc(fine_tunes.version)).limit(1)

                        createFineTune = await tx.insert(fine_tunes).values({
                            customerRuleId: data.customerRuleId, 
                            analystId: data.analystID,
                            fineTune: data.after,
                            comment: comment,
                            expireyDate: expiryDate,
                            finalised: data.finalised,
                            previousFineTuneId:  sql`(${previousFineTuneId})`,
                            finalisedAnalystId: finalisedAnalystId,
                            globalId: globalId,
                            name: name,
                            version: sql`COALESCE(( SELECT MAX(${fine_tunes.version}) FROM ${fine_tunes} WHERE ${fine_tunes.customerRuleId} = ${data.customerRuleId} ), 0) + 1`
                        }).returning({ id: fine_tunes.id})

                    // })(), // end of async

                    // (async () => {
                        // tech id
                        if (data.global) {
                            const customerInfo = await tx
                                .select({
                                    ruleId: customer_rules.ruleId,
                                    customerId: customer_rules.customerId,
                                    technolologyId: customers.technologyId
                                })
                                .from(customer_rules)
                                .innerJoin(customers, eq(customer_rules.customerId, customers.id))
                                .where(eq(customer_rules.id, data.customerRuleId))
                                .get()

                            if (!customerInfo) error(500, 'Database failed to find selected customer.');

                            const globalCustomerRules = await tx
                                .select({ id: customer_rules.id })
                                .from(customer_rules)
                                .leftJoin(customers, eq(customer_rules.customerId, customers.id))
                                .where(and(
                                    eq(customer_rules.ruleId, customerInfo.ruleId),
                                    eq(customers.technologyId, customerInfo.technolologyId),
                                    ne(customers.id, customerInfo.customerId)
                                    )
                                )

                            // Need to map previous fine tune id
                            await tx.insert(fine_tunes).values(
                                globalCustomerRules.map((customerRule) => ({
                                    customerRuleId: customerRule.id,
                                    analystId: data.analystID,
                                    fineTune: data.after,
                                    comment,
                                    expireyDate: expiryDate,
                                    finalised: data.finalised,
                                    finalisedAnalystId,
                                    globalId,
                                    name,
                                    // look at correlated db select
                                    version: sql<number>`COALESCE( (SELECT MAX(${fine_tunes.version}) FROM ${fine_tunes} WHERE ${fine_tunes.customerRuleId} = ${customerRule.id}), 0) + 1`
                                }))
                            );
                        }
                //     })() // end of second async
                // ]) // end of promise all
            })// End transaction
        } catch(error) {
            throw new AppError(
                'Failed to update fine tune.',
                'UPDATE_FINE_TUNE'
            )
        }

        for await (const { query } of requested(getCustomerRules, 1)) {
            query.refresh();
        }
        redirect(303, `/details/${data.customerRuleId}?fineTune=${createFineTune[0].id}`)
        
    }
)
/*
global search 

fine tune 
name
analyst
finalist analyst
tags
comment 
rule 
customer
technology 

date range

expirey date, only if the first fine tune has one

sort by date 

finalised 

global 


*/

const searchSchema = type({
    "search?": ['instanceof', SvelteSet<string>],

    "rule?": "string",
    "customer?": "string",
    "technology?": "string",
    "name?": "string",
    "fine_tune?": "string",
    "finalisedAnalyst?": "string",
    "analyst?": "string",
    "comment?": "string",
    "tags?": ['instanceof', SvelteSet<string>],
    "expireyDate?": "boolean",

    "finalised?": "boolean",
    "global?": "boolean",

    page: "number > 0",
    pageSize: "number > 0",

    descending: "boolean = true",

    "start?": "Date",
    "end?": "Date"
})
// Only customer rule
export const getCustomerRules = query(searchSchema, 
    async (data) => {

        const searchTerms = data.search?.size ? Array.from(data.search, term => term.trim()): []
        const searchTags = data.tags?.size ? Array.from(data.tags, term => term.trim()).filter(term => term!== '') : []

        const where = and(
            searchTerms.length ? and(
                ...searchTerms.map(term => or(
                        like(rules.name, `%${term}%`),
                        like(customers.name, `%${term}%`),
                        like(technologies.name, `%${term}%`),
                        like(fine_tunes.name, `%${term}%`),
                        like(analysts.name, `%${term}%`),
                        like(fine_tunes.fineTune, `%${term}%`),
                        like(fine_tunes.comment, `%${term}%`),
                        like(tags.name,`%${term}%`),
                    ))
            ) : undefined, 

            data.rule ? like(rules.name, `%${data.rule}%`) : undefined,
            data.customer ? like(customers.name, `%${data.customer}%`) : undefined,
            data.technology ? like(technologies.name, `%${data.technology}%`) : undefined,
            data.name ? like(fine_tunes.name, `%${data.name}%`) : undefined,
            data.fine_tune ? like(fine_tunes.fineTune, `%${data.fine_tune}%`) : undefined,
            data.analyst ? and(like(analysts.name, `%${data.analyst}%`), eq(fine_tunes.analystId, analysts.id)) : undefined,
            data.finalisedAnalyst ? and(like(analysts.name, `%${data.analyst}%`), eq(fine_tunes.finalisedAnalystId, analysts.id)) : undefined,
            data.comment ? like(fine_tunes.comment, `%${data.comment}%`) : undefined,

            searchTags.length ? and(
                ...searchTags.map(term => like(tags.name, `%${term}%`)) 
            ) : undefined,

            // MAKE WORK
            data.expireyDate !== undefined ? data.expireyDate ? and(isNotNull(fine_tunes.expireyDate), eq(fine_tunes.date, db.select({ latestDate: max(fine_tunes.date) }).from(fine_tunes).where(eq(fine_tunes.customerRuleId, )))) : isNull(fine_tunes.expireyDate) : undefined,

            data.expireyDate !== undefined ? data.expireyDate ? and(isNotNull(fine_tunes.expireyDate), eq(fine_tunes.version, db.select({ latestVersion: max(fine_tunes.version) }).from(fine_tunes).where(eq(fine_tunes.customerRuleId, fine_tunes.customerRuleId )))) : isNull(fine_tunes.expireyDate) : undefined,

            data.start ? gte(fine_tunes.date, data.start) : undefined,
            data.end ? lte(fine_tunes.date, data.end) : undefined,

            data.finalised !== undefined ? eq(fine_tunes.finalised, data.finalised) : undefined,
            data.global !== undefined ? data.global ? isNotNull(fine_tunes.globalId) : isNull(fine_tunes.globalId) : undefined
        )

        const [{ totalRows }] = await db.select({
            totalRows: countDistinct(fine_tunes.id)
        })
        .from(fine_tunes)
        .leftJoin(rules, eq(fine_tunes.ruleId, rules.id))
        .leftJoin(customers, eq(fine_tunes.customerId, customers.id))
        .leftJoin(technologies, eq(customers.technologyId, technologies.id))
        .leftJoin(analysts, eq(fine_tunes.analystId, analysts.id))
        .where(where)

        const totalPages = Math.ceil(totalRows / data.pageSize)

        const sort = data.descending ? desc(fine_tunes.date) : fine_tunes.date

        const rows = await db.select({ 
            id: sql<string>`${fine_tunes.id}`.mapWith(String), 
            date: fine_tunes.date, 
            rule: rules.name, 
            customer: customers.name, 
            technology: technologies.name,
            finalised: fine_tunes.finalised})
            .from(fine_tunes)
            .leftJoin(rules, eq(fine_tunes.ruleId, rules.id))
            .leftJoin(customers, eq(fine_tunes.customerId, customers.id))
            .leftJoin(technologies, eq(customers.technologyId, technologies.id))
            .leftJoin(analysts, eq(fine_tunes.analystId, analysts.id))
            .where(where)
            .orderBy(sort)
            .limit(data.pageSize)
            .offset((data.page - 1) * data.pageSize)

        return {
            rows,
            page: data.page,
            pageSize: data.pageSize,
            totalRows,
            totalPages
        };        
    }
)

// need get of customer rule and the fine tune details. TRY to keep same structure
export const getCSV = query(
    searchSchema,
    async (data) => {

        const searchTerms = [...data.search!]?.map(term => term.trim().split(/\s+/)).filter(Boolean) ?? []

        const where = and(searchTerms.length
            ? or(
                ...searchTerms.map(term =>
                    or(
                        like(rules.name, `%${term}%`),
                        like(customers.name, `%${term}%`),
                        like(technologies.name, `%${term}%`),
                        like(analysts.name, `%${term}%`),
                        like(fine_tunes.fineTune, `%${term}%`),
                        like(fine_tunes.comment, `%${term}%`),
                    )
                )
            )
            : undefined, 

            data.start ? gte(fine_tunes.date, data.start) : undefined,

            data.end ? lte(fine_tunes.date, data.end) : undefined,

            data.finalised !== undefined ? eq(fine_tunes.finalised, data.finalised) : undefined
        )

        const sort = data.descending ? desc(fine_tunes.date) : fine_tunes.date

        const rows = await db.select({
            Date: fine_tunes.date, 
            Rule: rules.name, 
            Customer: customers.name, 
            Technology: technologies.name,
            "Global Id": fine_tunes.globalId,
            "Fine Tune": fine_tunes.fineTune,
            Finalised: sql`${fine_tunes.finalised}`.mapWith((val) => val ? "Yes" : "No"),
            Analyst: analysts.name,
            Comment: fine_tunes.comment
        })
        .from(fine_tunes)
        .leftJoin(rules, eq(fine_tunes.ruleId, rules.id))
        .leftJoin(customers, eq(fine_tunes.customerId, customers.id))
        .leftJoin(technologies, eq(customers.technologyId, technologies.id))
        .leftJoin(analysts, eq(fine_tunes.analystId, analysts.id))
        .where(where)
        .orderBy(sort)

        // move error handing to the client, just let it be a function
        let success = rows.length > 0
        let message =  success ? undefined : "There are no records"

        if (!success) {
            return {
                success: success,
                message: message
            }
        }

        let date = [data.start, data.end].filter(Boolean).join(" / ")

        const distinctCustomers = await db.selectDistinct({customer: customers.name}).from(fine_tunes)
            .leftJoin(rules, eq(fine_tunes.ruleId, rules.id))
            .leftJoin(customers, eq(fine_tunes.customerId, customers.id))
            .leftJoin(technologies, eq(customers.technologyId, technologies.id))
            .leftJoin(analysts, eq(fine_tunes.analystId, analysts.id))
            .where(where)
        const distinctRules = await db.selectDistinct({rules: rules.name}).from(fine_tunes)
            .leftJoin(rules, eq(fine_tunes.ruleId, rules.id))
            .leftJoin(customers, eq(fine_tunes.customerId, customers.id))
            .leftJoin(technologies, eq(customers.technologyId, technologies.id))
            .leftJoin(analysts, eq(fine_tunes.analystId, analysts.id))
            .where(where)

        return {
            success: success,
            rows: rows,
            distinctCustomers: distinctCustomers,
            distinctRules: distinctRules,
            date: date,
        }
    }
)