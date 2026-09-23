import { query } from "$app/server";
import { error } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, fine_tunes, tags, fine_tune_tags } from "#lib/server/db/schema";
import { eq, and, asc, desc, like, or, gte, lte, sql, isNotNull, isNull, countDistinct } from 'drizzle-orm'
import { SvelteSet } from "svelte/reactivity";
import { alias } from "drizzle-orm/cockroach-core";

// get multiple fine tune details
const GetFTDetailsSchema = type({
    customerRuleId: "string.numeric.parse",
    page: "number > 0",
    pageSize: "number > 0",
    descending: "boolean = true",

    "search?": ['instanceof', SvelteSet<string>],

    "name?": ['instanceof', SvelteSet<string>],
    "fineTune?": ['instanceof', SvelteSet<string>],
    "analyst?": ['instanceof', SvelteSet<string>],
    "finalisedAnalyst?": ['instanceof', SvelteSet<string>],
    "comment?": ['instanceof', SvelteSet<string>],
    "tags?": ['instanceof', SvelteSet<string>],
    "version?": ['instanceof', SvelteSet<string>],

    "expiryDate?": "boolean",

    "global?": "boolean",
    "finalised?": "boolean",

    "fineTuneId?": "string.numeric.parse",

    "start?": "Date",
    "end?": "Date",
})


export const getFineTuneDetails = query(GetFTDetailsSchema, async (data) => {
    const cleanSearchSet = (set: SvelteSet<string> | undefined) => {
            if (!set?.size) return [];
            const result = [];
            for (const term of set) {
                const trimmed = term.trim();
                if (trimmed !== '') result.push(trimmed);
            }
            return result;
        }
    
    // inputs
    const searchAny = cleanSearchSet(data.search)
    const searchName = cleanSearchSet(data.name)
    const searchFineTune = cleanSearchSet(data.fineTune)
    const searchFinalisedAnalyst = cleanSearchSet(data.finalisedAnalyst)
    const searchAnalyst = cleanSearchSet(data.analyst)
    const searchComment = cleanSearchSet(data.comment)
    const searchTags = cleanSearchSet(data.tags)
    const searchVersion = cleanSearchSet(data.version)

    let start: Date | undefined = data.start
    let end: Date | undefined = data.end

    if (data.start && data.end && data.end < data.start) {
        start = undefined
        end = undefined
    }

    // alias tables
    const creatorAnalyst = alias(analysts, "creator_analyst")
    const finaliseAnalyst = alias(analysts, 'finalise_analyst')
    const previousFineTune = alias(fine_tunes, 'previous_fine_tune');

    const where = and(
        searchAny.length ? and(
            ...searchAny.map(term => or(
                like(fine_tunes.name, `%${term}%`), 
                like(fine_tunes.fineTune, `%${term}%`),
                like(creatorAnalyst.name, `%${term}%`),
                like(finaliseAnalyst.name, `%${term}%`),
                like(fine_tunes.comment, `%${term}%`),
                like(tags.name, `%${term}%`), 
                
                /^\d+$/.test(term) ? eq(fine_tunes.version, Number(term)) : undefined
            ))
        ) : undefined,

        searchName.length ? or(...searchName.map(term => like(fine_tunes.name, `%${term}%`))) : undefined,
        searchFineTune.length ? or(...searchFineTune.map(term => like(fine_tunes.fineTune, `%${term}%`))) : undefined,
       
        searchAnalyst.length ? or(...searchAnalyst.map(term => like(creatorAnalyst.name, `%${term}%`))) : undefined,
        searchFinalisedAnalyst.length ? or(...searchFinalisedAnalyst.map(term => like(finaliseAnalyst.name, `%${term}%`))) : undefined,

        searchComment.length ? or(...searchComment.map(term => like(fine_tunes.comment, `%${term}%`))) : undefined,

        searchVersion.length ? or( ...searchVersion.map(Number).filter(Number.isInteger).map(term => eq(fine_tunes.version, term))) : undefined,

        searchTags.length ? or( ...searchTags.map(term => like(tags.name, `%${term}%`))) : undefined,

        data.expiryDate !== undefined ? data.expiryDate ? isNotNull(fine_tunes.expiryDate) : isNull(fine_tunes.expiryDate) : undefined,
        data.finalised !== undefined ? eq(fine_tunes.finalised, data.finalised) : undefined,
        data.global !== undefined ? data.global ? isNotNull(fine_tunes.globalId) : isNull(fine_tunes.globalId) : undefined,

        start ? gte(fine_tunes.date, start) : undefined,
        end ? lte(fine_tunes.date, end) : undefined,

        eq(fine_tunes.customerRuleId, data.customerRuleId)
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
    // const sort = data.descending ? desc(fine_tunes.date) : asc(fine_tunes.date)
    const sort = data.descending ? desc(fine_tunes.version) : asc(fine_tunes.version)

    let page = data.page

    if (data.fineTuneId !== undefined) {
        const selected = await db
            .select({
                // date: fine_tunes.date,
                version: fine_tunes.version
            })
            .from(fine_tunes)
            .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
            .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
            .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
            .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
            .leftJoin(previousFineTune, eq(fine_tunes.previousFineTuneId, previousFineTune.id))
            .where(where)
            .orderBy(sort)
            .groupBy(fine_tunes.id) // TODO: Fine out if needed
            .get()
            // .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
            // .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
            // .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
            // .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
            // .where(and(where, eq(fine_tunes.id, data.fineTuneId)))
            // .get();


        if (!selected) error(404, "Fine Tune does not exist.")

        const [{selectedCount}] = await db
            .select({ selectedCount: countDistinct(fine_tunes.id)})
            .from(fine_tunes)
            .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
            .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
            .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
            .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
            .leftJoin(previousFineTune, eq(fine_tunes.previousFineTuneId, previousFineTune.id))
            .where(where)
            .orderBy(sort)
            .groupBy(fine_tunes.id) // TODO: Fine out if needed

            // .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
            // .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
            // .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
            // .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
            // // .where(and(where, data.descending? gt(fine_tunes.date, selected.date) : lt(fine_tunes.date, selected.date)))
            // .where(and(where, data.descending? gt(fine_tunes.version, selected.version) : lt(fine_tunes.version, selected.version)))
            // // TODO: Think I need a order by on this
            // .orderBy(sort)


        page = Math.floor(selectedCount / data.pageSize) + 1;
    }



    

    const rows = await db
        .select({
            id: sql<string>`${fine_tunes.id}`.mapWith(String), 
            date: fine_tunes.date,
            name: fine_tunes.name,

            version: fine_tunes.version,
            previousFineTuneId: sql<string>`${fine_tunes.previousFineTuneId}`.mapWith(String),

            before: sql<string>`COALESCE(${previousFineTune.fineTune}, 'Initial Rule')`,
            after: fine_tunes.fineTune,

            expiryDate: fine_tunes.expiryDate,

            globals: sql`
                (
                    SELECT json_group_array(
                        json_object(
                            'fineTuneId', ft.id,
                            'customerRuleId', cr.id,
                            'name', c.name
                        )
                    )
                    FROM fine_tunes ft
                    JOIN customer_rules cr ON ft.customerRuleId = cr.id
                    JOIN customers c ON cr.customerId = c.id
                    WHERE ft.globalId IS NOT NULL
                        AND ft.globalId = ${fine_tunes.globalId}
                        AND ft.id != ${fine_tunes.id}
                )
            `.mapWith((value) => JSON.parse(value as string) as { fineTuneId: number; customerRuleId: number; name: string }[]),

            globalId: fine_tunes.globalId,
            finalised: fine_tunes.finalised,
            analystName: creatorAnalyst.name,
            finaliseAnalystName: finaliseAnalyst.name,
            comment: fine_tunes.comment,
            tags: sql`COALESCE( json_group_array(${tags.name}) FILTER (WHERE ${tags.name} IS NOT NULL), '[]')`.mapWith((value) => JSON.parse(value as string) as string[])
        })
        .from(fine_tunes)
        .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
        .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
        .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
        .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
        .leftJoin(previousFineTune, eq(fine_tunes.previousFineTuneId, previousFineTune.id))
        .where(where)
        .orderBy(sort)
        .groupBy(fine_tunes.id) // TODO: Fine out if needed
        .limit(data.pageSize)
        .offset((page - 1) * data.pageSize)




    



    return {
        rows,
        page, 
        pageSize: data.pageSize,
        totalRows,
        totalPages, 
        selectedId: data.fineTuneId ? String(data.fineTuneId) : null
    }
})





