import { query, form, command, requested } from "$app/server";
import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, fine_tunes, technologies, rules} from "#lib/server/db/schema";
import { eq, and, gt, asc, desc, like, notLike, lt, count, or, gte, lte, sql, ne } from 'drizzle-orm'
import { SvelteSet } from "svelte/reactivity";



const ftSchema = type("string.numeric.parse")
export const getFineTune = query(ftSchema, async (ftId) => {
    const [result] = await db.select({
        date: fine_tunes.date,
        ruleId: fine_tunes.ruleId,
        rule: rules.name,
        customerId: fine_tunes.customerId,
        customer: customers.name,
        // technologyId: customers.technologyId,
        technology: technologies.name,
        after: fine_tunes.fineTune,
        globalId: fine_tunes.globalId,
        finalised: fine_tunes.finalised,
        analystId: fine_tunes.analystId,
        analyst: analysts.name,
        comment: fine_tunes.comment
    })
    .from(fine_tunes)
    .leftJoin(customers, eq(fine_tunes.customerId, customers.id))
    .leftJoin(rules, eq(fine_tunes.ruleId, rules.id))
    .leftJoin(technologies, eq(customers.technologyId, technologies.id))
    .leftJoin(analysts, eq(fine_tunes.analystId, analysts.id))
    .where(eq(fine_tunes.id, ftId))
    .limit(1)

    const [isBefore] = await db.select({before: fine_tunes.fineTune}).from(fine_tunes).where(and(eq(fine_tunes.ruleId, result.ruleId), eq(fine_tunes.customerId, result.customerId), lt(fine_tunes.date, result.date))).orderBy(desc(fine_tunes.date)).limit(1)

    return { 
        date: result.date,
        ruleId: String(result.ruleId),
        rule: result.rule,
        customerId: String(result.customerId),
        customer: result.customer,
        // technologyId: String(result.technologyId),
        technology: result.technology,
        before: isBefore?.before ?? "Initial Rule",
        after: result.after,
        finalised: result.finalised,
        global: result.globalId == null ? false : true,
        analystId: String(result.analystId),
        analyst: result.analyst,
        comment: result.comment
    }
    
})

export const getDetails = query(ftSchema, async (ftId) => {
    const [result] = await db.select({
        date: fine_tunes.date,
        ruleId: fine_tunes.ruleId,
        rule: rules.name,
        customerId: fine_tunes.customerId,
        customer: customers.name,
        // technologyId: customers.technologyId,
        technology: technologies.name,
        after: fine_tunes.fineTune,
        globalId: fine_tunes.globalId,
        finalised: fine_tunes.finalised,
        // analystId: fine_tunes.analystId,
        analyst: analysts.name,
        comment: fine_tunes.comment
    })
    .from(fine_tunes)
    .leftJoin(customers, eq(fine_tunes.customerId, customers.id))
    .leftJoin(rules, eq(fine_tunes.ruleId, rules.id))
    .leftJoin(technologies, eq(customers.technologyId, technologies.id))
    .leftJoin(analysts, eq(fine_tunes.analystId, analysts.id))
    .where(eq(fine_tunes.id, ftId))
    .limit(1)

    const [isBefore] = await db.select({before: fine_tunes.fineTune}).from(fine_tunes).where(and(eq(fine_tunes.ruleId, result.ruleId), eq(fine_tunes.customerId, result.customerId), lt(fine_tunes.date, result.date))).orderBy(desc(fine_tunes.date)).limit(1)

    const globals = result.globalId ? await db.select({id: fine_tunes.id, customers: customers.name}).from(fine_tunes).leftJoin(customers, eq(fine_tunes.customerId, customers.id)).where(eq(fine_tunes.globalId, result.globalId)) : null
    
    return { 
        date: result.date,
        // ruleId: String(result.ruleId),
        rule: result.rule,
        // customerId: String(result.customerId),
        customer: result.customer,
        // technologyId: String(result.technologyId),
        technology: result.technology,
        before: isBefore?.before ?? "Initial Rule",
        after: result.after,
        global: result.globalId === null ? false : true,
        globals: globals,
        finalised: result.finalised,
        // analystId: String(result.analystId),
        analyst: result.analyst,
        comment: result.comment
    }
})

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



const dSchema = type("string.numeric.parse")
export const deleteRow = command(dSchema, async (ftID) => {
    // throw new Error()
    await db.delete(fine_tunes).where(eq(fine_tunes.id, ftID))

    for await (const { query } of requested(search, 1)) {
        query.refresh();
    }
    return { success: true} 
});



const editSchema = type({
        id: "string.numeric.parse",
        "after?": "string",
        "finalised?": "boolean",
        comment: "string",
        analystId: "string.numeric.parse"
    })
export const editForm = form(
    editSchema, 
    async (data) => {

        // Need to add if finalised handler. If finalised can't change fine tune, otherwise can.
        // Would need database call

        const [finalised] = await db.select({finalsed: fine_tunes.finalised}).from(fine_tunes).where(eq(fine_tunes.id, data.id))

        const comment = data.comment.trim() == "" ? null : data.comment
        
        if (finalised.finalsed) {
            console.log('after')
            await db.update(fine_tunes).set({
                comment: comment,
                analystId: data.analystId
            })
            .where(eq(fine_tunes.id, data.id))

            for await (const { query } of requested(search, 1)) {
                query.refresh();
            }

            redirect(303, `/details/${data.id}`)
        }

        await db.update(fine_tunes).set({
            fineTune: data.after,
            comment: comment,
            analystId: data.analystId,
            finalised: data.finalised
        })
        .where(eq(fine_tunes.id, data.id))

        for await (const { query } of requested(search, 1)) {
            query.refresh();
        }

        redirect(303, `/details/${data.id}`)
    }
)

const createSchema = type({
    ruleID: "string.numeric.parse",
    customerID: "string.numeric.parse",
    after: "string > 0",
    global: "boolean = false",
    analystID: "string.numeric.parse",
    comment: "string",
    finalised: "boolean = false"
})
export const createForm = form(
    createSchema,
    async (data) => {
        console.log('start')

        const comment = data.comment.trim() == "" ? null : data.comment

        // If is create, and if already exists, don't create
        if (!data.global) {
            const [returnId] = await db.insert(fine_tunes).values({
                ruleId: data.ruleID, 
                customerId: data.customerID, 
                fineTune: data.after, 
                analystId: data.analystID, 
                comment: comment,
                finalised: data.finalised
            }).returning({
                id: fine_tunes.id
            })

            console.log(returnId.id)
            for await (const { query } of requested(search, 1)) {
                query.refresh();
            }

            redirect(303, `/details/${returnId.id}`)
        }

        // get tech id
        const [technologyId] = await db.select({
            technologyId: customers.technologyId
        })
        .from(customers)
        .where(eq(customers.id, data.customerID))
        .limit(1)

        // get customers who use same technology id 
        const globalCustomers = await db.select({
            customerId: customers.id
        })
        .from(customers)
        .where(and(eq(customers.technologyId, technologyId.technologyId), ne(customers.id, data.customerID)))

        // insert many based no tech id 

        const globalId = crypto.randomUUID()
        
        const [returnId] = await db.insert(fine_tunes).values({
            ruleId: data.ruleID,
            customerId: data.customerID,
            globalId: globalId,
            fineTune: data.after, 
            analystId: data.analystID, 
            comment: comment,
            finalised: data.finalised
        }).returning({
            id: fine_tunes.id
        })

        for (const { customerId } of globalCustomers) {
            await db.insert(fine_tunes).values({
                ruleId: data.ruleID,
                customerId: customerId,
                globalId: globalId,
                fineTune: data.after, 
                analystId: data.analystID, 
                comment: comment,
                finalised: false
            })
        }

        for await (const { query } of requested(search, 1)) {
            query.refresh();
        }
        redirect(303, `/details/${returnId.id}`)
    }
)


const searchSchema = type({
    "search?": ['instanceof', SvelteSet<string>],

    "rule?": "string",
    "customer?": "string",
    "technology?": "string",
    "analyst?": "string",
    "fine_tune?": "string",
    "comment?": "string",

    "finalised?": "boolean",
    "global?": "boolean",

    page: "number",
    pageSize: "number",

    descending: "boolean",

    "start?": "Date",
    "end?": "Date"
})

export const search = query(searchSchema, 
    async (data) => {

        const searchTerms = data.search?.size ? Array.from(data.search, term => term.trim()): [];
        console.log(searchTerms)

        const where = and(searchTerms.length
            ? and(
                ...searchTerms.map(term =>
                    or(
                        // lots or redundant searches. Some searches may not be applied, but thats how it goes.
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

            data.rule ? like(rules.name, `%${data.rule}%`) : undefined,
            data.customer ? like(customers.name, `%${data.customer}%`) : undefined,
            data.technology ? like(technologies.name, `%${data.technology}%`) : undefined,
            data.analyst ? like(analysts.name, `%${data.analyst}%`) : undefined,
            data.fine_tune ? like(fine_tunes.fineTune, `%${data.fine_tune}%`) : undefined,
            data.comment ? like(fine_tunes.comment, `%${data.comment}%`) : undefined,

            data.start ? gte(fine_tunes.date, data.start) : undefined,

            data.end ? lte(fine_tunes.date, data.end) : undefined,

            data.finalised !== undefined ? eq(fine_tunes.finalised, data.finalised) : undefined
        )

        const [{ totalRows }] = await db.select({
            totalRows: count()
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