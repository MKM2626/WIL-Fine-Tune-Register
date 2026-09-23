import { query } from "$app/server";
// import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, fine_tunes, technologies, rules, tags, fine_tune_tags, customer_rules } from "#lib/server/db/schema";
import { eq, and, desc, like, or, gte, lte, max, isNotNull, isNull, exists, asc, sql } from 'drizzle-orm'
import { SvelteSet } from "svelte/reactivity";
import { alias } from "drizzle-orm/sqlite-core";
import { error } from "@sveltejs/kit";
// import { SvelteSet } from "svelte/reactivity";
// import { alias } from "drizzle-orm/cockroach-core";
// import { AppError } from "#lib/errors/appError";

const getCSVSchema = type({
    // Left search
    crSearchInfo: {
        "search?": ['instanceof', SvelteSet<string>],

        "rule?": ['instanceof', SvelteSet<string>],
        "customer?": ['instanceof', SvelteSet<string>],
        "technology?": ['instanceof', SvelteSet<string>],
        "name?": ['instanceof', SvelteSet<string>],

        "fine_tune?": ['instanceof', SvelteSet<string>],
        "finalisedAnalyst?": ['instanceof', SvelteSet<string>],
        "analyst?": ['instanceof', SvelteSet<string>],
        "comment?": ['instanceof', SvelteSet<string>],
        "tags?": ['instanceof', SvelteSet<string>],
        "expiryDate?": "boolean",

        "finalised?": "boolean",
        "global?": "boolean",

        descending: "boolean = true",
        
        "ftStart?": "Date",
        "ftEnd?": "Date",

        "crStart?" : "Date",
        "crEnd?": "Date",
    },
    
    // Options
    // option: "'Customer rules' | 'All fine tunes' | 'Filtered fine tunes'"
    // * customer rules gets only the rules that are exposed on the left hand column
    // * all fine tunes gets all fine tunes of customer rules that are exposed on the left hand column
    // * filtered fine tunes, gets the fine tunes that match the search of the left hand column.
        // E.g. Search specific fine tune name, customer rule exposed in left hand column, but only return fine tunes that match that customer rule
        // Expiry date and finalised are fields set on the customer rule exposure. Not really applied on the filter
})

export const getCSV = query(
    getCSVSchema,
    async (data) => {

        const searchTerms = data.crSearchInfo.search?.size ? Array.from(data.crSearchInfo.search, term => term.trim()): []
        const searchTags = data.crSearchInfo.tags?.size ? Array.from(data.crSearchInfo.tags, term => term.trim()).filter(term => term!== '') : []

        const creatorAnalyst = alias(analysts, "creator_analyst")
        const finaliseAnalyst = alias(analysts, 'finalise_analyst')

        const searchedFineTunes = alias(fine_tunes, "searchedFineTune")

        // Sub query for latest fine tunes
        const latestVersion = db
            .select({
                customerRuleId: fine_tunes.customerRuleId,
                maxVersion: max(fine_tunes.version).as('maxVersion'),
            })
            .from(fine_tunes)
            .groupBy(fine_tunes.customerRuleId)
            .as('latestVersion');

        // Gets details of latest fine tunes
        const latestFineTunes = db
            .select({
                customerRuleId: latestVersion.customerRuleId,
                version: fine_tunes.version,
                finalised: fine_tunes.finalised,
                expiryDate: fine_tunes.expiryDate,
                date: fine_tunes.date
            })
            .from(fine_tunes)
            // Filters out so only latest Version is visible
            .innerJoin(latestVersion, and(eq(fine_tunes.customerRuleId, latestVersion.customerRuleId), eq(fine_tunes.version, latestVersion.maxVersion)))
            .as('latestFineTunes')

        // * could make global search a separate conditions, to keep scope of customer rule conditions and fine tune search conditions distinct

        // Customer Rule Conditions
        const customerRuleConditions = and(
            searchTerms.length ? and(
                ...searchTerms.map(term => or(
                    like(rules.name, `%${term}%`),
                    like(customers.name, `%${term}%`),
                    like(technologies.name, `%${term}%`),
                    
                ))
            ) : undefined, 

            data.crSearchInfo.rule ? like(rules.name, `%${data.crSearchInfo.rule}%`) : undefined,
            data.crSearchInfo.customer ? like(customers.name, `%${data.crSearchInfo.customer}%`) : undefined,
            data.crSearchInfo.technology ? like(technologies.name, `%${data.crSearchInfo.technology}%`) : undefined,

            data.crSearchInfo.crStart ? gte(customer_rules.date, data.crSearchInfo.crStart) : undefined,
            data.crSearchInfo.crEnd ? lte(customer_rules.date, data.crSearchInfo.crEnd) : undefined
        )

        // Fine tune tags 
        const fineTuneTags = db
            .select({
                fineTuneId: fine_tune_tags.fineTuneId, 
                tags: sql<string>`GROUP_CONCAT(DISTINCT ${tags.name} )`.mapWith((val) => val?.replace(/,/g, ', ')).as('tags')
            })
            .from(fine_tune_tags)
            .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
            .groupBy(fine_tune_tags.fineTuneId)
            .as('fineTuneTags')

        // Fine Tune Search Conditions for outer most query 
        // const fineTuneSearchConditions = and(
        //     searchTerms.length ? and(
        //         ...searchTerms.map(term => or(
        //             like(fine_tunes.name, `%${term}%`),
        //             like(creatorAnalyst.name, `%${term}%`),
        //             like(finaliseAnalyst.name, `%${term}%`),
        //             like(fine_tunes.fineTune, `%${term}%`),
        //             like(fine_tunes.comment, `%${term}%`),
        //             like(fineTuneTags.tags,`%${term}%`),  // THis problem
        //         ))
        //     ) : undefined, 

        //     data.crSearchInfo.name ? like(fine_tunes.name, `%${data.crSearchInfo.name}%`) : undefined,
        //     data.crSearchInfo.fine_tune ? like(fine_tunes.fineTune, `%${data.crSearchInfo.fine_tune}%`) : undefined,

        //     data.crSearchInfo.analyst ? like(creatorAnalyst.name, `%${data.crSearchInfo.analyst}%`) : undefined,
        //     data.crSearchInfo.finalisedAnalyst ? like(finaliseAnalyst.name, `%${data.crSearchInfo.finalisedAnalyst}%`) : undefined,

        //     data.crSearchInfo.comment ? like(fine_tunes.comment, `%${data.crSearchInfo.comment}%`) : undefined,

        //     searchTags.length ? and(
        //         ...searchTags.map(term => like(fineTuneTags.tags, `%${term}%`)) 
        //     ) : undefined,

        //     data.crSearchInfo.ftStart ? gte(fine_tunes.date, data.crSearchInfo.ftStart) : undefined,
        //     data.crSearchInfo.ftEnd ? lte(fine_tunes.date, data.crSearchInfo.ftEnd) : undefined,

        //     data.crSearchInfo.global !== undefined ? data.crSearchInfo.global ? isNotNull(fine_tunes.globalId) : isNull(fine_tunes.globalId) : undefined
        // )
            
        // Fine Tune Exists Search Conditions
        const fineTuneExistsSearchConditions = and(
            searchTerms.length ? and(
                ...searchTerms.map(term => or(
                    like(searchedFineTunes.name, `%${term}%`),
                    like(creatorAnalyst.name, `%${term}%`),
                    like(finaliseAnalyst.name, `%${term}%`),
                    like(searchedFineTunes.fineTune, `%${term}%`),
                    like(searchedFineTunes.comment, `%${term}%`),
                    like(tags.name,`%${term}%`),  // THis problem
                ))
            ) : undefined, 

            data.crSearchInfo.name ? like(searchedFineTunes.name, `%${data.crSearchInfo.name}%`) : undefined,
            data.crSearchInfo.fine_tune ? like(searchedFineTunes.fineTune, `%${data.crSearchInfo.fine_tune}%`) : undefined,

            data.crSearchInfo.analyst ? like(creatorAnalyst.name, `%${data.crSearchInfo.analyst}%`) : undefined,
            data.crSearchInfo.finalisedAnalyst ? like(finaliseAnalyst.name, `%${data.crSearchInfo.finalisedAnalyst}%`) : undefined,

            data.crSearchInfo.comment ? like(searchedFineTunes.comment, `%${data.crSearchInfo.comment}%`) : undefined,

            searchTags.length ? and(
                ...searchTags.map(term => like(tags.name, `%${term}%`)) 
            ) : undefined,

            data.crSearchInfo.ftStart ? gte(searchedFineTunes.date, data.crSearchInfo.ftStart) : undefined,
            data.crSearchInfo.ftEnd ? lte(searchedFineTunes.date, data.crSearchInfo.ftEnd) : undefined,

            data.crSearchInfo.global !== undefined ? data.crSearchInfo.global ? isNotNull(searchedFineTunes.globalId) : isNull(searchedFineTunes.globalId) : undefined
        )
    
        // Fine Tune search exists 
        const fineTuneExists = fineTuneExistsSearchConditions ? exists(
                db.select().from(searchedFineTunes)
                .leftJoin(creatorAnalyst, eq(searchedFineTunes.analystId, creatorAnalyst.id))
                .leftJoin(finaliseAnalyst, eq(searchedFineTunes.finalisedAnalystId, finaliseAnalyst.id))

                .leftJoin(fine_tune_tags, eq(searchedFineTunes.id, fine_tune_tags.fineTuneId))
                .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
                .where(
                    and(
                        eq(searchedFineTunes.customerRuleId, customer_rules.id),
                        fineTuneExistsSearchConditions
                    )
                )
            ) : undefined

        const latestFineTuneConditions = and(
            data.crSearchInfo.expiryDate !== undefined ? data.crSearchInfo.expiryDate ? isNotNull(latestFineTunes.expiryDate) : isNull(latestFineTunes.expiryDate) : undefined,
            data.crSearchInfo.finalised !== undefined ? eq(latestFineTunes.finalised, data.crSearchInfo.finalised) : undefined,
        )


        // Left column search 
        // Or is included as global search terms are applied to both customer rule conditions and fine tune conditions. IF and, it would not expose customer rules correctly
        const customerRuleWhere = and( or(customerRuleConditions, fineTuneExists), latestFineTuneConditions)



        // problem is any, not defined

        // ! just do one type
        

        // type define this 
        // let rows
        // if (data.option === "Customer rules") {
        //     rows = await db
        //         .select({
        //             Rule: rules.name,
        //             Customer: customers.name,
        //             Technology: technologies.name,
        //             "Latest Update": sql<string>`strftime('%Y-%m-%dT%H:%M:%fWZ', ${latestFineTunes.date} / 1000.0, 'unixepoch')`,
        //             Finalised: sql<string>`${latestFineTunes.finalised}`.mapWith((val) => val ? "Yes" : "No"),
        //         })
        //         .from(customer_rules)
        //         .leftJoin(rules, eq(customer_rules.ruleId, rules.id))
        //         .leftJoin(customers, eq(customer_rules.customerId, customers.id))
        //         .leftJoin(technologies, eq(customers.technologyId, technologies.id))
        //         .innerJoin( latestFineTunes, eq(customer_rules.id, latestFineTunes.customerRuleId) )
        //         .where(customerRuleWhere)
        //         .orderBy(data.crSearchInfo.descending ? desc(latestFineTunes.date) : asc(latestFineTunes.date))
        // }

        // * Filtered fine tunes need testing
        // else {
            const rows = await db
                .select({
                    Rule: rules.name,
                    Customer: customers.name,
                    Technology: technologies.name,

                    Name: fine_tunes.name,
                    "Fine Tune": fine_tunes.fineTune,
                    Date: sql<string>`strftime('%Y-%m-%dT%H:%M:%fWZ', ${fine_tunes.date} / 1000.0, 'unixepoch')`,
                    "Expiry Date": sql<string>`strftime('%Y-%m-%dT%H:%M:%fWZ', ${fine_tunes.expiryDate} / 1000.0, 'unixepoch')`, // can be null
                    Comment: fine_tunes.comment,
                    Finalised: sql`${fine_tunes.finalised}`.mapWith((val) => val ? "Yes" : "No"),

                    Analyst: creatorAnalyst.name,
                    "Finalised Analyst": finaliseAnalyst.name,
                    Tags: fineTuneTags.tags
                    
                })
                .from(fine_tunes)
                .innerJoin( customer_rules, eq(fine_tunes.customerRuleId, customer_rules.id) )
                .innerJoin( latestFineTunes, eq(customer_rules.id, latestFineTunes.customerRuleId))
                
                .leftJoin(rules, eq(customer_rules.ruleId, rules.id))
                .leftJoin(customers, eq(customer_rules.customerId, customers.id))
                .leftJoin( technologies, eq(customers.technologyId, technologies.id) )
                .leftJoin( creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
                .leftJoin( finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id) )
                .leftJoin( fineTuneTags, eq(fineTuneTags.fineTuneId, fine_tunes.id))
 
                // Could make filtered fine tunes be customerRuleConditions, latestFineTuneConditions and searchFineTuneConditions (remove repeat of fineTuneExists)
                // .where(data.option === "All fine tunes" ? customerRuleWhere : and(customerRuleConditions, latestFineTuneConditions, fineTuneSearchConditions) )
                .where(customerRuleWhere)
                
                .orderBy(data.crSearchInfo.descending ? desc(fine_tunes.date) : asc(fine_tunes.date))
        // }



        if (!rows) {
            error(400, 'Database failed to find results')
        }


        const distinctCustomers = [...new Set(rows.map(row => row.Customer))]
        const distinctRules = [...new Set(rows.map(row => row.Rule))]

        const date = [data.crSearchInfo.ftStart, data.crSearchInfo.ftEnd].filter(Boolean).join(" / ")


        return {
            rows: rows,
            distinctCustomers: distinctCustomers,
            distinctRules: distinctRules,
            date: date,
        }
    }
)