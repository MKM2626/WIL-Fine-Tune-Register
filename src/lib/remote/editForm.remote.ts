import { query, form, command, requested } from "$app/server";
import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, fine_tunes, technologies, rules, customer_rules, tags, fine_tune_tags} from "#lib/server/db/schema";
import { eq, and, gt, asc, desc, like, lt, or, gte, lte, sql, ne, isNotNull, isNull, countDistinct, inArray, max } from 'drizzle-orm'
import { SvelteSet } from "svelte/reactivity";
import { alias } from "drizzle-orm/cockroach-core";
import { AppError } from "#lib/errors/appError";
import { getCustomerRules } from '#lib/remote/registers.remote' // change to own file

// Update other fields?
const editSchema = type({
        id: "string.numeric.parse",
        analystId: "string.numeric.parse",
        "after?": "string > 0",
        "finalised?": "boolean",
        "comment?": "string",
        "tags?": "string[]",
    })
export const editForm = form(
    editSchema, async (data) => {

        const inputTags = data.tags?.length ? data.tags.map(term => term.trim()).filter(term => term!== '') : []

        try {
            await db.transaction(async (tx) => {
                // await Promise.all([
                    // (async () => {
                        let tagIds: { tagId: number }[] = []

                        if (inputTags.length > 0 ) {
                            await tx.insert(tags).values(inputTags.map((name) => ({name}))).onConflictDoNothing()
                            tagIds = await tx.select({tagId: tags.id}).from(tags).where(inArray(tags.name, inputTags))
                        }

                        await tx.delete(fine_tune_tags).where(eq(fine_tune_tags.fineTuneId, data.id))

                        if (inputTags.length > 0) {
                            await tx.insert(fine_tune_tags).values(tagIds.map(({ tagId }) => ({ fineTuneId: data.id, tagId})))
                        }
                    // })(),

                    // (async () => {
                        const finalised = await tx.select({finalised: fine_tunes.finalised}).from(fine_tunes).where(eq(fine_tunes.id, data.id)).get()

                        await tx.update(fine_tunes)
                            .set({
                                fineTune: data.after ? finalised?.finalised ? data.after : undefined : undefined,
                                comment: data.comment ? data.comment.trim() == "" ? null : data.comment : undefined,
                                finalised: data.finalised !== undefined ? finalised?.finalised ? data.finalised ? true : false : undefined : undefined,
                                analystId: data.analystId
                            })
                            .where(eq(fine_tunes.id, data.id))
                    // })()
                // ])
            });
        } catch(error) {
            throw new AppError(
                'Failed to edit fine tune.',
                'FINE_TUNE_EDIT'
            )
        }

        for await (const { query } of requested(getCustomerRules, 1)) {
            query.refresh();
        }

        redirect(303, `/details/${data.id}`)
    }
)