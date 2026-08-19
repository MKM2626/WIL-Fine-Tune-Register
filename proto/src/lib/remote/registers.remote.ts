import { query, form, command } from "$app/server";
import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/db'
import { analysts, customers, fine_tunes, technologies, rules} from "#lib/db/schema";
// import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/arktype";
import { eq, and, gt, asc, desc, like, notLike, lt, count, or, gte, lte } from 'drizzle-orm'
import type { AnyColumn } from "drizzle-orm";

// import { mockData } from "./mockData";
// import type { MockDataType, AnalystType, CustomerType, TechnologyType, RuleType, RegisterType } from "./server/types"


// Haven't done arktype validation
// const ftSchema = type({
//     id: "string.uuid",
//     date: "Date",
//     rule: "string",
//     customer: "string",
//     technology: "string",
//     before: "string",
//     after: "string",
//     global: "boolean",
//     analyst: "string",
//     comment: "string | null",
// })

const ftSchema = type("string.uuid")
export const getFineTune = query(ftSchema, async (ftId) => {
    const [result] = await db.select({
        date: fine_tunes.date,
        ruleId: fine_tunes.ruleId,
        rule: rules.name,
        customerId: fine_tunes.customerId,
        customer: customers.name,
        technologyId: customers.technologyId,
        technology: technologies.name,
        before: fine_tunes.before,
        after: fine_tunes.after,
        globalId: fine_tunes.globalId,
        global: fine_tunes.global,
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

    return result    
})

const gSchema = type("string.uuid")
export const getGlobals = query(gSchema, async(glId) => {
    return await db.select({
        customers: customers.name
    })
    .from(fine_tunes)
    .leftJoin(customers, eq(fine_tunes.customerId, customers.id))
    .where(eq(fine_tunes.globalId, glId))
})



export const getRules = query(async() => {
    return await db.select().from(rules)
})

export const getAnalysts = query(async() => { 
    return await db.select().from(analysts)
})

export const getCustomers = query(async() => {
    return await db.select().from(customers)
})

export const getTechnology = query(async() => {
    return await db.select().from(technologies)
})




// Stretch goal add security and error handling
const dSchema = type("string.uuid")

export const deleteRow = command(dSchema, async (ftID) => {
    const [select] = await db.select({
        global: fine_tunes.global,
        globalId: fine_tunes.globalId
    })
    .from(fine_tunes)
    .where(eq(fine_tunes.id, ftID))
    .limit(1)

    switch (select.global) {
        case true:
            await db.delete(fine_tunes).where(eq(fine_tunes.globalId, select.globalId!))
            
        case false:
            await db.delete(fine_tunes).where(eq(fine_tunes.id, ftID))
            
    }

});

// stretch goal, allow edit of global
const editSchema = type({
        id: "string.uuid",
        after: "string",
        comment: "string",
        analystId: "string.uuid"
    })

export const editForm = form(
    // Global false, update details, update newer one if exists
    // Global true, update all fine tune with global id, update all newer ones if exist

    // edit will not create nor delete global fine tunes, only add or remove them.
    // REALISATION, should not be able to edit global, only upon create or update

    editSchema, 
    async (data) => {

        const [ft] = await db.select({
            global: fine_tunes.global,
            globalId: fine_tunes.globalId,
            ruleId: fine_tunes.ruleId,
            customerId: fine_tunes.customerId,
            date: fine_tunes.date
        })
        .from(fine_tunes)
        .where(eq(fine_tunes.id, data.id))
        .limit(1)

        switch(ft.global) {
            case false:
                await db.update(fine_tunes).set({
                    after: data.after,
                    comment: data.comment,
                    analystId: data.analystId
                })
                .where(eq(fine_tunes.id, data.id))

                const [newer] = await db.select({ 
                    id: fine_tunes.id,
                })
                .from(fine_tunes)
                .where(and(eq(fine_tunes.ruleId, ft.ruleId), eq(fine_tunes.customerId, ft.customerId), gt(fine_tunes.date, ft.date)))
                .orderBy(asc(fine_tunes.date))
                .limit(1)

                if (newer) {
                    await db.update(fine_tunes).set({before: data.after}).where(eq(fine_tunes.id, newer.id))
                }

                redirect(303, `/test/details/${data.id}`)
                
            case true:
                const global = await db.select({ id: fine_tunes.id, customerId: fine_tunes.customerId, date: fine_tunes.date}).from(fine_tunes).where(eq(fine_tunes.globalId, ft.globalId!))

                for (const { id, customerId, date } of global) {
                    await db.update(fine_tunes).set({
                        after: data.after,
                        comment: data.comment,
                        analystId: data.analystId
                    })
                    .where(eq(fine_tunes.id, id))

                    const [newer] = await db.select({id: fine_tunes.id}).from(fine_tunes).where(and(eq(fine_tunes.ruleId, ft.ruleId), eq(fine_tunes.customerId, customerId), gt(fine_tunes.date, date))).orderBy(asc(fine_tunes.date)).limit(1)

                    if (newer) {
                        await db.update(fine_tunes).set({before: data.after}).where(eq(fine_tunes.id, newer.id))
                    }
                }
                redirect(303, `/test/details/${data.id}`)
        }

       
    }
)

const createSchema = type({
    ruleID: "string.uuid",
    customerID: "string.uuid",
    after: "string",
    global: "boolean = false",
    analystID: "string.uuid",
    comment: "string"
})
// Need to test global
export const createForm = form(
    createSchema,
    async (data) => {
        let selectedId = ""

        switch(data.global) {
            case false:

                const [prevFT] = await db.select({
                    after: fine_tunes.after
                })
                .from(fine_tunes)
                .where(and(eq(fine_tunes.ruleId, data.ruleID), eq(fine_tunes.customerId, data.customerID)))
                .orderBy(desc(fine_tunes.date))
                .limit(1)

                const [newFT] = await db.insert(fine_tunes).values({
                    ruleId: data.ruleID, 
                    customerId: data.customerID, 
                    global: data.global, 
                    before: prevFT?.after ?? "Initial Rule", 
                    after: data.after, 
                    analystId: data.analystID, 
                    comment: data.comment
                }).returning({
                    id: fine_tunes.id
                })

                selectedId = newFT.id

                redirect(303, `/test/details/${selectedId}`)

            case true:
                const [custTech] = await db.select({
                    techId: customers.technologyId
                })
                .from(customers)
                .where(eq(customers.id, data.customerID))
                .limit(1)

                const globalCust = await db.select({
                    customerId: customers.id
                })
                .from(customers)
                .where(eq(customers.technologyId, custTech.techId))

                const globalId = crypto.randomUUID()

                for (const { customerId } of globalCust) {

                    const [prevFT] = await db.select({
                        after: fine_tunes.after
                    })
                    .from(fine_tunes)
                    .where(and(eq(fine_tunes.ruleId, data.ruleID), eq(fine_tunes.customerId, customerId)))
                    .orderBy(desc(fine_tunes.date))
                    .limit(1)

                    const [newFT] = await db.insert(fine_tunes).values({
                        ruleId: data.ruleID,
                        customerId: customerId,
                        globalId: globalId,
                        global: data.global,
                        before: prevFT?.after ?? "Initial Rule", 
                        after: data.after, 
                        analystId: data.analystID, 
                        comment: data.comment
                    }).returning({
                        id: fine_tunes.id,
                        customerId: fine_tunes.customerId
                    })

                    if (customerId == data.customerID) {
                        selectedId = newFT.id
                    }
                }
                redirect(303, `/test/details/${selectedId}`)
        }

    }
)

// sort may be easier to do on server side
// need server side sort if doing pagination

const textFilter = type({
    value: "string",
    operation: "'Contains' | 'Equals' | 'Does not contain'"
})

function buildTextFilter(column: AnyColumn, filter: typeof textFilter.infer) {
    switch (filter.operation) {
        case "Equals":
            return eq(column, filter.value);
        case "Contains":
            return like(column, `%${filter.value}%`);
        case "Does not contain":
            return notLike(column, `%${filter.value}%`);
    }
}


const boolFilter = type({
    value: "boolean",
})

function buildBoolFilter(column: AnyColumn, filter: typeof boolFilter.infer ) {
    return eq(column, filter.value)
}


const dateFilter = type({
    value: "Date",
    operation: "'Contains' | 'Greater than' | 'Less than'"
})

function buildDateFilter(column: AnyColumn, filter: typeof dateFilter.infer) {
    switch (filter.operation) {
        case "Contains":
            return like(column, `%${filter.value}%`);
        case "Greater than":
            return gt(column, filter.value);
        case "Less than":
            return lt(column, filter.value);
    }
}


const searchSchema = type({
    "date?": dateFilter, 
    "ruleName?": textFilter,
    "customer?": textFilter,
    "technology?": textFilter,
    "before?": textFilter, 
    "after?": textFilter, 
    "global?": boolFilter,
    "analyst?": textFilter,
    "comments?": textFilter,

    page: "number",
    pageSize: "number",

    "field?": "'Date' | 'rule' | 'customer' | 'technology' | 'before' | 'after' | 'analyst' | 'comment' | 'global'",
    "direction?": "'asc' | 'desc'"
})
// can technically find global group by rule, technology and global set to true. Would have to be same date
export const search = query(searchSchema,
    async (filters) => {

        const where = []
        if (filters.date) { where.push(buildDateFilter(fine_tunes.date, filters.date)) }
        if (filters.ruleName) { where.push(buildTextFilter(rules.name, filters.ruleName)) }
        if (filters.customer) { where.push(buildTextFilter(customers.name, filters.customer)) }
        if (filters.technology) { where.push(buildTextFilter(technologies.name, filters.technology)) }
        if (filters.before) { where.push(buildTextFilter(fine_tunes.before, filters.before)) }
        if (filters.after) { where.push(buildTextFilter(fine_tunes.after, filters.after))} 
        if (filters.global) { where.push(buildBoolFilter(fine_tunes.global, filters.global)) }
        if (filters.analyst) { where.push(buildTextFilter(analysts.name, filters.analyst)) }
        if (filters.comments) { where.push(buildTextFilter(fine_tunes.comment, filters.comments)) }

        const [{ totalRows }] = await db.select({
            totalRows: count()
        })
        .from(fine_tunes)
        .leftJoin(rules, eq(fine_tunes.ruleId, rules.id))
        .leftJoin(customers, eq(fine_tunes.customerId, customers.id))
        .leftJoin(technologies, eq(customers.technologyId, technologies.id))
        .leftJoin(analysts, eq(fine_tunes.analystId, analysts.id))
        .where(and(...where))

        const totalPages = Math.ceil(totalRows / filters.pageSize)

        const data = await db.select({ 
            id: fine_tunes.id, 
            date: fine_tunes.date, 
            rule: rules.name, 
            customer: customers.name, 
            technology: technologies.name, 
            before: fine_tunes.before, 
            after: fine_tunes.after, 
            global: fine_tunes.global, 
            analyst: analysts.name, 
            comment: fine_tunes.comment })
            .from(fine_tunes)
            .leftJoin(rules, eq(fine_tunes.ruleId, rules.id))
            .leftJoin(customers, eq(fine_tunes.customerId, customers.id))
            .leftJoin(technologies, eq(customers.technologyId, technologies.id))
            .leftJoin(analysts, eq(fine_tunes.analystId, analysts.id))
            .where(and(...where))
            .limit(filters.pageSize)
            .offset((filters.page - 1) * filters.pageSize)

        return {
            data,
            page: filters.page,
            pageSize: filters.pageSize,
            totalRows,
            totalPages
        };
    }
)

const testSearchSchema = type({
    "search?": "string",

    page: "number",
    pageSize: "number",

    descending: "boolean", // true desc, false asc

    "start?": "Date",
    "end?": "Date"
})

export const testSearch = query(testSearchSchema, 
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
            technology: technologies.name, 
            before: fine_tunes.before, 
            after: fine_tunes.after, 
            global: fine_tunes.global, 
            analyst: analysts.name, 
            comment: fine_tunes.comment })
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