import { query } from "$app/server";
// import { error, redirect } from '@sveltejs/kit';  
// import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, technologies, rules, tags } from "#lib/server/db/schema";
import { sql } from 'drizzle-orm'
import { type } from "arktype"
import { error } from "@sveltejs/kit";
// import { SvelteSet } from "svelte/reactivity";
// import { alias } from "drizzle-orm/cockroach-core";
// import { AppError } from "#lib/errors/appError";

export const getRules = query(async() => {
    return await db.select({id: sql<string>`${rules.id}`.mapWith(String), name: rules.name}).from(rules)
})

export const getAnalysts = query(async() => { 
    return await db.select({id: sql<string>`${analysts.id}`.mapWith(String), name: analysts.name}).from(analysts)
})

export const getCustomers = query(async() => {
    return await db.select({id: sql<string>`${customers.id}`.mapWith(String), name: customers.name, technologyId: sql<string>`${customers.technologyId}`.mapWith(String)}).from(customers)
})

export const getTechnology = query(async() => {
    return await db.select({id: sql<string>`${technologies.id}`.mapWith(String), name: technologies.name}).from(technologies)
})

export const getTags = query(async() => {
    return await db.select({id: tags.id, name: tags.name}).from(tags)
})





// the other fine tunes that share this fine tune's global id
export const getGlobalFineTunes = query(
    type({ fineTuneId: "string.numeric.parse" }),
    async (data) => {
        const current = await db.query.fine_tunes.findFirst({
            where: { id: data.fineTuneId },
            columns: { globalId: true }
        })

        if (!current?.globalId) error(400, "Global fine tunes do not exist")

        const globalFineTunes = await db.query.fine_tunes.findMany({
            where: {
                globalId: current.globalId,
                id: { ne: data.fineTuneId }
            },
            columns: { id: true, customerRuleId: true },
            with: {
                customerRule: { with: { customer: { columns: { name: true } } } }
            }
        })

        return globalFineTunes.map(ft => ({
            fineTuneId: ft.id,
            customerRuleId: ft.customerRuleId,
            name: ft.customerRule.customer.name
        }))
    }
)