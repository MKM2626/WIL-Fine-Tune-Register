import { query } from "$app/server";
// import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, fine_tunes, technologies, rules, customer_rules, tags, fine_tune_tags } from "#lib/server/db/schema";
import { eq, and, desc, like, or, gte, lte, isNotNull, isNull, countDistinct, max, asc, exists, sql } from 'drizzle-orm'
import { SvelteSet } from "svelte/reactivity";
import { alias } from "drizzle-orm/cockroach-core";

// import { AppError } from "#lib/errors/appError";


// ? Might be better if search only applies to the customer rule.
const getCustomerRulesSchema = type({
    "search?": ['instanceof', SvelteSet<string>],

    "rule?": "string",
    "customer?": "string",
    "technology?": "string",
    "name?": "string",
    "fineTune?": "string",
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

    // For fine tunes
    "ftStart?": "Date",
    "ftEnd?": "Date",

    // For customer rules
    "crStart?" : "Date",
    "crEnd?": "Date"
})
// Only customer rule
export const getCustomerRules = query(getCustomerRulesSchema, 
    async (data) => {
        // const searchFineTune = alias(fine_tunes, "searchFineTune")
        // const latestFineTune = alias(fine_tunes, "latestFineTuneRow")

        const searchTerms = data.search?.size ? Array.from(data.search, term => term.trim()): []
        const searchTags = data.tags?.size ? Array.from(data.tags, term => term.trim()).filter(term => term!== '') : []

        const creatorAnalyst = alias(analysts, "creator_analyst")
        const finaliseAnalyst = alias(analysts, 'finalise_analyst')

        const searchedFineTunes = alias(fine_tunes, "searchedFineTune")

        // TODO: Unsure if it will get the latest FT 

        // TODO: Validate the date ranges, don't trust user input

        const latestVersion = db
            .select({
                // id: fine_tunes.id,
                customerRuleId: fine_tunes.customerRuleId,
                // version: fine_tunes.version,
                maxVersion: max(fine_tunes.version).as('maxVersion'),
                // finalised: fine_tunes.finalised,
                // expiryDate: fine_tunes.expiryDate,
                // date: fine_tunes.date,
                // rowNum: sql<number>`ROW_NUMBER() OVER (
                //     PARTITION BY ${fine_tunes.customerRuleId} 
                //     ORDER BY ${fine_tunes.version} DESC
                //     )`.as('row_num'),
            })
            .from(fine_tunes)
            .groupBy(fine_tunes.customerRuleId)
            .as('sq');

        const latestFineTunes = db
            .select({
                customerRuleId: latestVersion.customerRuleId,
                // version: latestVersion.version,
                // finalised: latestVersion.finalised,
                // expiryDate: latestVersion.expiryDate,
                // date: latestVersion.date
                version: fine_tunes.version,
                finalised: fine_tunes.finalised,
                expiryDate: fine_tunes.expiryDate,
                date: fine_tunes.date
            })
            .from(fine_tunes)
            .innerJoin(latestVersion, and(eq(fine_tunes.customerRuleId, latestVersion.customerRuleId), eq(fine_tunes.version, latestVersion.maxVersion)))
            // .where(eq(latestVersion.rowNum, 1))
            .as('latestFineTunes')


        // const latestFineTune = db 
        //     .select({
        //         customerRuleId: fine_tunes.customerRuleId, 
        //         version: max(fine_tunes.version).as('version'),
                // finalised: fine_tunes.finalised,
                // expiryDate: fine_tunes.expiryDate,
                // date: fine_tunes.date
        //     })
        //     .from(fine_tunes)
        //     .groupBy(fine_tunes.customerRuleId)
        //     .as("latestFineTune")

        // This will be the rule, customer technology, from customer rule table
        const customerRuleConditions = and(
            searchTerms.length > 0 ? and(
                ...searchTerms.map(term => or(
                    // like(rules.name, `%${term}%`),
                    like(customers.name, `%${term}%`),
                    // like(technologies.name, `%${term}%`)
                ))
            ) : undefined, 

            data.rule ? like(rules.name, `%${data.rule}%`) : undefined,
            data.customer ? like(customers.name, `%${data.customer}%`) : undefined,
            data.technology ? like(technologies.name, `%${data.technology}%`) : undefined,

            data.crStart ? gte(customer_rules.date, data.crStart) : undefined,
            data.crEnd ? lte(customer_rules.date, data.crEnd) : undefined
        )

        // Search for historical fine tunes
        const fineTuneSearchConditions = and(
            searchTerms.length ? and(
                ...searchTerms.map(term => or(
                    like(searchedFineTunes.name, `%${term}%`),
                    like(creatorAnalyst.name, `%${term}%`),
                    like(finaliseAnalyst.name, `%${term}%`),
                    like(searchedFineTunes.fineTune, `%${term}%`),
                    like(searchedFineTunes.comment, `%${term}%`),
                    like(tags.name,`%${term}%`), 
                ))
            ) : undefined, 

            data.name ? like(searchedFineTunes.name, `%${data.name}%`) : undefined,
            data.fineTune ? like(searchedFineTunes.fineTune, `%${data.fineTune}%`) : undefined,

            data.analyst ? like(creatorAnalyst.name, `%${data.analyst}%`) : undefined,
            data.finalisedAnalyst ? like(finaliseAnalyst.name, `%${data.finalisedAnalyst}%`) : undefined,

            data.comment ? like(searchedFineTunes.comment, `%${data.comment}%`) : undefined,

            searchTags.length ? and(
                ...searchTags.map(term => like(tags.name, `%${term}%`)) 
            ) : undefined,

            data.ftStart ? gte(searchedFineTunes.date, data.ftStart) : undefined,
            data.ftEnd ? lte(searchedFineTunes.date, data.ftEnd) : undefined,

            data.global !== undefined ? data.global ? isNotNull(searchedFineTunes.globalId) : isNull(searchedFineTunes.globalId) : undefined
        )

        const fineTuneExists = fineTuneSearchConditions ? exists(
                // maybe {} in select, prevent 
                db.select().from(searchedFineTunes)
                .leftJoin(creatorAnalyst, eq(searchedFineTunes.analystId, creatorAnalyst.id))
                .leftJoin(finaliseAnalyst, eq(searchedFineTunes.finalisedAnalystId, finaliseAnalyst.id))
                .leftJoin(fine_tune_tags, eq(searchedFineTunes.id, fine_tune_tags.fineTuneId))
                .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
                .where(
                    and(
                        eq(searchedFineTunes.customerRuleId, customer_rules.id),
                        fineTuneSearchConditions
                    )
                )
            ) : undefined

        // Condition for the latest fine tune, put expiry date and
        const latestFineTuneConditions = and(
            // Think expiry date should go here 
            // Need to include 
            data.expiryDate !== undefined ? data.expiryDate ? isNotNull(latestFineTunes.expiryDate) : isNull(latestFineTunes.expiryDate) : undefined,

            data.finalised !== undefined ? eq(latestFineTunes.finalised, data.finalised) : undefined,
        )

        const where = and(
            or(
                customerRuleConditions,
                
                fineTuneExists,
            ),
            latestFineTuneConditions
        )

        // * needs to be sorted by date, as some fine tunes that are the latest may have less versions that older fine tunes with more versions
        const sort = data.descending ? desc(latestFineTunes.date) : asc(latestFineTunes.date)

        const [{ totalRows }] = await db.select({
            totalRows: countDistinct(customer_rules.id) // ? might be able to change to count now
        })
            .from(customer_rules)
            .leftJoin(rules, eq(customer_rules.ruleId, rules.id))
            .leftJoin(customers, eq(customer_rules.customerId, customers.id))
            .leftJoin(technologies, eq(customers.technologyId, technologies.id))

            .innerJoin(latestFineTunes, eq(customer_rules.id, latestFineTunes.customerRuleId))

            // .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
            // .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))

            // left join latestFineTuneRow
            // leftJoin latest fine tune 

            
            // ? Don't think I need join on this, as it would be in the exists where clause
            // .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
            // .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
            .where(where)
            .orderBy(sort)
        

        const totalPages = Math.ceil(totalRows / data.pageSize)


        const rows = await db.select({ 
            id: sql<string>`${customer_rules.id}`.mapWith(String),
            date: latestFineTunes.date, 
            rule: rules.name, 
            customer: customers.name, 
            technology: technologies.name,
            finalised: latestFineTunes.finalised})
            .from(customer_rules)
            .leftJoin(rules, eq(customer_rules.ruleId, rules.id))
            .leftJoin(customers, eq(customer_rules.customerId, customers.id))
            .leftJoin(technologies, eq(customers.technologyId, technologies.id))

            // .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
            // .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))

            .innerJoin(latestFineTunes, eq(customer_rules.id, latestFineTunes.customerRuleId))

            // .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
            // .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
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