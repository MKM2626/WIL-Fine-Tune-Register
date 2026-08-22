import { query, form, command } from "$app/server";
import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/db'
import { analysts, customers, fine_tunes, technologies, rules} from "#lib/db/schema";
import { eq, and, gt, asc, desc, like, notLike, lt, count, or, gte, lte, sql, ne } from 'drizzle-orm'

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

    const globals = result.globalId ? await db.select({customers: customers.name}).from(fine_tunes).leftJoin(customers, eq(fine_tunes.customerId, customers.id)).where(eq(fine_tunes.globalId, result.globalId)) : null
    
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

const gSchema = type("string")
export const getGlobals = query(gSchema, async(glId) => {
    return await db.select({
        customers: customers.name
    })
    .from(fine_tunes)
    .leftJoin(customers, eq(fine_tunes.customerId, customers.id))
    .where(eq(fine_tunes.globalId, glId))
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
    await db.delete(fine_tunes).where(eq(fine_tunes.id, ftID))
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

        if (finalised.finalsed || data.after == null) {
            await db.update(fine_tunes).set({
                comment: data.comment,
                analystId: data.analystId
            })
            .where(eq(fine_tunes.id, data.id))
            redirect(303, `/details/${data.id}`)
        }

        await db.update(fine_tunes).set({
            fineTune: data.after,
            comment: data.comment,
            analystId: data.analystId,
            finalised: data.finalised
        })
        .where(eq(fine_tunes.id, data.id))
        redirect(303, `/details/${data.id}`)
    }
)

const createSchema = type({
    ruleID: "string.numeric.parse",
    customerID: "string.numeric.parse",
    after: "string",
    global: "boolean = false",
    analystID: "string.numeric.parse",
    comment: "string",
    finalised: "boolean = false"
})
export const createForm = form(
    createSchema,
    async (data) => {

        const comment = data.comment == "" ? null : data.comment

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
                finalised: data.finalised
            })
        }
        redirect(303, `/details/${returnId.id}`)
    }
)


const searchSchema = type({
    "search?": "string",

    page: "number",
    pageSize: "number",

    descending: "boolean",

    "start?": "Date",
    "end?": "Date"
})

export const search = query(searchSchema, 
    async (data) => {
        
        const searchTerms = data.search?.trim().split(/\s+/).filter(Boolean) ?? [];

        const where = and(searchTerms.length
            ? and(
                ...searchTerms.map(term =>
                    or(
                        like(rules.name, `%${term}%`),
                        like(customers.name, `%${term}%`),
                        like(technologies.name, `%${term}%`)
                    )
                )
            )
            : undefined, 

            data.start ? gte(fine_tunes.date, data.start) : undefined,

            data.end ? lte(fine_tunes.date, data.end) : undefined
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
            id: fine_tunes.id, 
            date: fine_tunes.date, 
            rule: rules.name, 
            customer: customers.name, 
            technology: technologies.name})
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