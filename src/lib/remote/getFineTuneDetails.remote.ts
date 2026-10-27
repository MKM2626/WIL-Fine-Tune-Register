import { query } from "$app/server";
// import { error } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { SvelteSet } from "svelte/reactivity";

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

    // helpers
    const contains = (term: string) => ({ like: `%${term}%` })
    const versions = searchVersion.map(Number).filter(Number.isInteger)
    const orderBy = { version: data.descending ? "desc" : "asc" } as const



    const where = {
        customerRuleId: data.customerRuleId,

        // Const required for isNotNull and isNull, to stop typescript error
        expiryDate: data.expiryDate === undefined ? undefined : data.expiryDate ? { isNotNull: true as const } : { isNull: true as const },
        globalId: data.global === undefined ? undefined : data.global ? { isNotNull: true as const } : { isNull: true as const },

        finalisedAnalystId: data.finalised === undefined ? undefined : data.finalised ? { isNotNull: true as const } : { isNull: true as const },

        date: start || end ? { gte: start, lte: end } : undefined,

        name: searchName.length ? { OR: searchName.map(contains) } : undefined,
        fineTune: searchFineTune.length ? { OR: searchFineTune.map(contains) } : undefined,
        comment: searchComment.length ? { OR: searchComment.map(contains) } : undefined,
        version: versions.length ? { in: versions } : undefined,

        analyst: searchAnalyst.length ? { OR: searchAnalyst.map(term => ({ name: contains(term) })) } : undefined,
        finalisedAnalyst: searchFinalisedAnalyst.length ? { OR: searchFinalisedAnalyst.map(term => ({ name: contains(term) })) } : undefined,
        tags: searchTags.length ? { OR: searchTags.map(term => ({ name: contains(term) })) } : undefined,

   
        AND: searchAny.length
            ? searchAny.map(term => ({
                OR: [
                    { name: contains(term) },
                    { fineTune: contains(term) },
                    { comment: contains(term) },
                    { analyst: { name: contains(term) } },
                    { finalisedAnalyst: { name: contains(term) } },
                    { tags: { name: contains(term) } },
                    ...(/^\d+$/.test(term) ? [{ version: Number(term) }] : [])
                ]
            }))
            : undefined
    } 

    const matches = await db.query.fine_tunes.findMany({
        where,
        columns: { id: true },
        orderBy
    })

    const totalRows = matches.length
    const totalPages = Math.ceil(totalRows / data.pageSize)

    let page = data.page

    if (data.fineTuneId !== undefined) {
        const index = matches.findIndex(m => m.id === data.fineTuneId)
        if (index !== -1) page = Math.floor(index / data.pageSize) + 1
    }

    const results = await db.query.fine_tunes.findMany({
        where,
        with: {
            analyst: { columns: { name: true } },
            finalisedAnalyst: { columns: { name: true } },
            previousFineTune: { columns: { fineTune: true } },
            tags: { columns: { name: true } }
        },
        orderBy,
        limit: data.pageSize,
        offset: (page - 1) * data.pageSize
    })

    const rows = results.map(result => ({
        id: String(result.id),
        date: result.date,
        name: result.name,

        version: result.version,
        previousFineTuneId: result.previousFineTuneId === null ? null : String(result.previousFineTuneId),

        before: result.previousFineTune?.fineTune ?? 'Initial Rule',
        after: result.fineTune,

        expiryDate: result.expiryDate,
        globalId: result.globalId,
        finalised: result.finalisedAnalystId !== null,

        analystName: result.analyst.name,
        finaliseAnalystName: result.finalisedAnalyst?.name ?? null,
        comment: result.comment,
        tags: result.tags.map(t => t.name)
    }))

    return {
        rows,
        page, 
        pageSize: data.pageSize,
        totalRows,
        totalPages, 
        selectedId: data.fineTuneId ? String(data.fineTuneId) : null
    }
})