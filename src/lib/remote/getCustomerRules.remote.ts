import { query } from "$app/server";
// import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, fine_tunes, technologies, rules, customer_rules, tags, fine_tune_tags } from "#lib/server/db/schema";
import { SQL, eq, and, desc, like, or, gte, lte, isNotNull, isNull, countDistinct, max, asc, exists, sql } from 'drizzle-orm'
import { alias } from "drizzle-orm/sqlite-core";
import { SvelteSet } from "svelte/reactivity";


// import { AppError } from "#lib/errors/appError";


// ? Might be better if search only applies to the customer rule.
const getCustomerRulesSchema = type({
    "search?": ['instanceof', SvelteSet<string>],

    "rule?": ['instanceof', SvelteSet<string>],
    "version?": ['instanceof', SvelteSet<string>],
    "customer?": ['instanceof', SvelteSet<string>],
    "technology?": ['instanceof', SvelteSet<string>],
    "name?": ['instanceof', SvelteSet<string>],
    "fineTune?": ['instanceof', SvelteSet<string>],
    "finalisedAnalyst?": ['instanceof', SvelteSet<string>],
    "analyst?": ['instanceof', SvelteSet<string>],
    "comment?": ['instanceof', SvelteSet<string>],
    "tags?": ['instanceof', SvelteSet<string>],

    "expiryDate?": "boolean",
    "finalised?": "boolean",
    "global?": "boolean",

    page: "number > 0",
    pageSize: "number > 0",
    descending: "boolean = true",
    isFineTuneSort: "boolean = true",

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
        const cleanSearchSet = (set: SvelteSet<string> | undefined) => {
            if (!set?.size) return [];
            const result = [];
            for (const term of set) {
                const trimmed = term.trim();
                if (trimmed !== '') result.push(trimmed);
            }
            return result;
        }

        const searchAny = cleanSearchSet(data.search)
        const searchRule = cleanSearchSet(data.rule)
        const searchCustomer = cleanSearchSet(data.customer)
        const searchTechnology = cleanSearchSet(data.technology)
        const searchName = cleanSearchSet(data.name)
        const searchFineTune = cleanSearchSet(data.fineTune)
        const searchFinalisedAnalyst = cleanSearchSet(data.finalisedAnalyst)
        const searchAnalyst = cleanSearchSet(data.analyst)
        const searchComment = cleanSearchSet(data.comment)
        const searchTags = cleanSearchSet(data.tags)
        const searchVersion = cleanSearchSet(data.version)
        
        let ftStart: Date | undefined = data.ftStart
        let ftEnd: Date | undefined = data.ftEnd

        if (data.ftStart && data.ftEnd && data.ftEnd < data.ftStart) {
            ftStart = undefined
            ftEnd = undefined
        }

        let crStart: Date | undefined = data.crStart
        let crEnd: Date | undefined = data.crEnd

        if (data.crEnd && data.crStart && data.crEnd < data.crStart) {
            crEnd = undefined
            crStart = undefined
        }
       
        

        const creatorAnalyst = alias(analysts, "creator_analyst")
        const finaliseAnalyst = alias(analysts, 'finalise_analyst')
        const searchedFineTunes = alias(fine_tunes, "searchedFineTune")


        const latestVersion = db
            .select({
                customerRuleId: fine_tunes.customerRuleId,
                maxVersion: max(fine_tunes.version).as('maxVersion'),
            })
            .from(fine_tunes)
            .groupBy(fine_tunes.customerRuleId)
            .as('sq');

        const latestFineTunes = db
            .select({
                customerRuleId: latestVersion.customerRuleId,
                version: fine_tunes.version,
                finalised: fine_tunes.finalised,
                expiryDate: fine_tunes.expiryDate,
                date: fine_tunes.date
            })
            .from(fine_tunes)
            .innerJoin(latestVersion, and(eq(fine_tunes.customerRuleId, latestVersion.customerRuleId), eq(fine_tunes.version, latestVersion.maxVersion)))
            .as('latestFineTunes')


        
        // New stuff
        // helper function converts input into number, if not number or unsafe, ignore it
        const toVersion = (term: string) => /^\d+$/.test(term) && Number(term) <= Number.MAX_SAFE_INTEGER ? Number(term) : undefined

        // Find if tag exists
        const fineTuneHasTag = (term: string) =>
            exists(
                db.select({ one: sql`1` }).from(fine_tune_tags)
                    .innerJoin(tags, eq(fine_tune_tags.tagId, tags.id))
                    .where(and(
                        eq(fine_tune_tags.fineTuneId, searchedFineTunes.id),
                        like(tags.name, `%${term}%`)
                    ))
            )

        // Helper function, chuck in condition matching the left joins, and works
        const hasFineTune = (condition: SQL | undefined) =>
            exists(
                db.select({ one: sql`1` }).from(searchedFineTunes)
                    .leftJoin(creatorAnalyst, eq(searchedFineTunes.analystId, creatorAnalyst.id))
                    .leftJoin(finaliseAnalyst, eq(searchedFineTunes.finalisedAnalystId, finaliseAnalyst.id))
                    .where(and(eq(searchedFineTunes.customerRuleId, customer_rules.id), condition))
            )

        

        // This will be the rule, customer technology, from customer rule table
        const customerRuleConditions = and(
            searchRule.length ? and(...searchRule.map(term => like(rules.name, `%${term}%`))) : undefined,
            searchCustomer.length ? and(...searchCustomer.map(term => like(customers.name, `%${term}%`))) : undefined,
            searchTechnology.length ? and(...searchTechnology.map(term => like(technologies.name, `%${term}%`))) : undefined,

            crStart ? gte(customer_rules.date, crStart) : undefined,
            crEnd ? lte(customer_rules.date, crEnd) : undefined
        )

        const anySearchConditions = searchAny.length
            ? and(...searchAny.map(value => {
                const term = `%${value}%`
                const version = toVersion(term)

                return or(
                    like(rules.name, term),
                    like(customers.name, term),
                    like(technologies.name, term),
                    hasFineTune(or(
                        like(searchedFineTunes.name, term),
                        like(creatorAnalyst.name, term),
                        like(finaliseAnalyst.name, term),
                        like(searchedFineTunes.fineTune, term),
                        like(searchedFineTunes.comment, term),
                        fineTuneHasTag(term),
                        version !== undefined ? eq(searchedFineTunes.version, version) : undefined // not a number will ignored
                    ))
                )
            }))
            : undefined

        const versions = searchVersion.map(toVersion).filter((version): version is number => version !== undefined)


        // Search for historical fine tunes
        const fineTuneSearchConditions = and(
            searchName.length ? and(...searchName.map(term => like(searchedFineTunes.name, `%${term}%`))) : undefined,
            searchFineTune.length ? and(...searchFineTune.map(term => like(searchedFineTunes.fineTune, `%${term}%`))) : undefined,
            searchAnalyst.length ? and(...searchAnalyst.map(term => like(creatorAnalyst.name, `%${term}%`))) : undefined,
            searchFinalisedAnalyst.length ? and(...searchFinalisedAnalyst.map(term => like(finaliseAnalyst.name, `%${term}%`))) : undefined,
            searchComment.length ? and(...searchComment.map(term => like(searchedFineTunes.comment, `%${term}%`))) : undefined,
            searchTags.length ? and(...searchTags.map(fineTuneHasTag)) : undefined,

            // there are whole numbers but match to nothing rather than undefined. So 
            searchVersion.length
                ? (versions.length ? or(...versions.map(v => eq(searchedFineTunes.version, v))) : sql`false`)
                : undefined,

            ftStart ? gte(searchedFineTunes.date, ftStart) : undefined,
            ftEnd ? lte(searchedFineTunes.date, ftEnd) : undefined,
            data.global !== undefined
                ? (data.global ? isNotNull(searchedFineTunes.globalId) : isNull(searchedFineTunes.globalId))
                : undefined
        )

       const fineTuneExists = fineTuneSearchConditions ? hasFineTune(fineTuneSearchConditions) : undefined

        // Condition for the latest fine tune
        const latestFineTuneConditions = and(
            data.expiryDate !== undefined
                ? (data.expiryDate ? isNotNull(latestFineTunes.expiryDate) : isNull(latestFineTunes.expiryDate))
                : undefined,
            data.finalised !== undefined ? eq(latestFineTunes.finalised, data.finalised) : undefined
        )

        const where = and(
            anySearchConditions,
            customerRuleConditions,
            fineTuneExists,
            latestFineTuneConditions
        )

        // * needs to be sorted by date, as some fine tunes that are the latest may have less versions that older fine tunes with more versions
        const sortType = data.isFineTuneSort ? latestFineTunes.date : customer_rules.date;
        const sort = data.descending ? desc(sortType) : asc(sortType);


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