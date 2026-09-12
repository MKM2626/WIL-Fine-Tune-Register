import { query, form, command, requested } from "$app/server";
import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, fine_tunes, technologies, rules, customer_rules, tags, fine_tune_tags} from "#lib/server/db/schema";
import { eq, and, gt, asc, desc, like, lt, or, gte, lte, sql, ne, isNotNull, isNull, countDistinct, inArray, max } from 'drizzle-orm'
import { SvelteSet } from "svelte/reactivity";
import { alias } from "drizzle-orm/cockroach-core";
import { AppError } from "#lib/errors/appError";


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
export const getFineTuneDetails = query(gFTSchema, async (data) => {
    const searchTerms = data.search?.size ? Array.from(data.search, term => term.trim()).filter(term => term!== '') : []
    const searchTags = data.tags?.size ? Array.from(data.tags, term => term.trim()).filter(term => term!== '') : []

    const creatorAnalyst = alias(analysts, "creator_analyst")
    const finaliseAnalyst = alias(analysts, 'finalise_analyst')
    const previousFineTune = alias(fine_tunes, 'previous_fine_tune');

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

    const rows = await db
        .select({
            id: sql<string>`${fine_tunes.id}`.mapWith(String), 
            date: fine_tunes.date,
            name: fine_tunes.name,
            
            version: fine_tunes.version,
            previousFineTune: fine_tunes.previousFineTuneId,

            before: sql<string>`COALESCE(${previousFineTune.fineTune}, 'Initial Rule')`,
            after: fine_tunes.fineTune,

            globalId: fine_tunes.globalId,
            finalised: fine_tunes.finalised,
            analystName: creatorAnalyst.name,
            finaliseAnalystName: finaliseAnalyst.name,
            comment: fine_tunes.comment,
            tags: sql<string[]>`json_group_array(${tags.name})`.as('tags'),
        })
        .from(fine_tunes)
        .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
        .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
        .leftJoin(fine_tune_tags, eq(fine_tunes.id, fine_tune_tags.fineTuneId))
        .leftJoin(tags, eq(fine_tune_tags.tagId, tags.id))
        .leftJoin(previousFineTune, eq(fine_tunes.previousFineTuneId, previousFineTune.id))
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


