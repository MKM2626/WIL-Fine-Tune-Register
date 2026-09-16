import { query } from "$app/server";
// import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, fine_tunes, technologies, rules } from "#lib/server/db/schema";
import { eq, and, desc, like, or, gte, lte, sql, } from 'drizzle-orm'
import { SvelteSet } from "svelte/reactivity";
// import { SvelteSet } from "svelte/reactivity";
// import { alias } from "drizzle-orm/cockroach-core";
// import { AppError } from "#lib/errors/appError";

const getCustomerRulesSchema = type({
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
    "expiryDate?": "boolean",

    "finalised?": "boolean",
    "global?": "boolean",

    page: "number > 0",
    pageSize: "number > 0",

    descending: "boolean = true",

    "start?": "Date",
    "end?": "Date"
})

export const getCSV = query(
    getCustomerRulesSchema,
    async (data) => {

        const searchTerms = [...data.search!]?.map(term => term.trim().split(/\s+/)).filter(Boolean) ?? []
         const searchTags = data.tags?.size ? Array.from(data.tags, term => term.trim()).filter(term => term!== '') : []

        const creatorAnalyst = alias(analysts, "creator_analyst")
        const finaliseAnalyst = alias(analysts, 'finalise_analyst')

        const searchedFineTunes = alias(fine_tunes, "searchedFineTune")

        // TODO: Unsure if the left join will work with this, need testing
        const latestFineTune = db 
            .select({
                customerRuleId: fine_tunes.customerRuleId, 
                version: max(fine_tunes.version).as('version'),
                finalised: fine_tunes.finalised,
                expiryDate: fine_tunes.expiryDate,
                date: fine_tunes.date
            })
            .from(fine_tunes)
            .groupBy(fine_tunes.customerRuleId)
            .as("latestFineTune")

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