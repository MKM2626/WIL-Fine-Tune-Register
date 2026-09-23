import { form, requested, getRequestEvent } from "$app/server";
import { error, isHttpError, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { fine_tunes, tags, fine_tune_tags} from "#lib/server/db/schema";
import { eq, inArray } from 'drizzle-orm'
// import { SvelteSet } from "svelte/reactivity";
// import { alias } from "drizzle-orm/cockroach-core";
import { getCustomerRules } from '#lib/remote/getCustomerRules.remote'
import { atLeast } from "#lib/roles";

// Update other fields?
// TODO: allow edit on fine tune, and expiry date only if not finalised

//TODO: allow name edit

const editSchema = type({
        id: "string.numeric.parse",
        // Can not edit once finalised
        "expiryDate?": "string",
        "name?": "string",
        "fineTune?": type("string > 0").configure({message: () => "Must not be empty"}),

        finalised: "boolean = false",
        "comment?": "string",
        "newTags?": 'string[]', 
        "existingTags?": 'number[]'
    })
export const editForm = form(
    editSchema, async (data) => {
        const { locals } = getRequestEvent()
        if (!locals.user) error(401, 'Please sign in.')
        const isAllowed = atLeast(locals.user?.role, 'senior')
        
        const comment = data.comment ? data.comment.trim() == "" ? null : data.comment : undefined
        const name = data.name ? data.name.trim() == "" ? null : data.name : undefined
        const expiryDate = data.expiryDate && data.expiryDate.trim() !== '' ?  new Date(data.expiryDate) : undefined
        

        const inputTags = data.newTags?.length ? data.newTags.map(term => term.trim()).filter(term => term!== '') : []
        const fineTune = data.fineTune? data.fineTune : undefined
        let tagIds: number[] = [...(data.existingTags ?? [])]

        let createFineTune = {} as { customerRuleId: number}

        try {
            await db.transaction(async (tx) => {
                // await Promise.all([
                    // (async () => {

                        if (inputTags.length > 0 ) {
                            await tx.insert(tags).values(inputTags.map((name) => ({name}))).onConflictDoNothing()
                            const found = await tx.select({id: tags.id}).from(tags).where(inArray(tags.name, inputTags))
                            tagIds.push(...found.map((tag) => tag.id))
                        }

                        tagIds = [...new Set (tagIds)]

                        

                        // await tx.delete(fine_tune_tags).where(eq(fine_tune_tags.fineTuneId, data.id))

                        if (tagIds.length > 0) {
                            await tx.insert(fine_tune_tags).values(tagIds.map((tagId) => ({ fineTuneId: data.id, tagId})))
                        }
                    // })(),

                    // (async () => {
                        const finalised = await tx.select({finalised: fine_tunes.finalised}).from(fine_tunes).where(eq(fine_tunes.id, data.id)).get()

                        createFineTune = await tx.update(fine_tunes)
                            .set({
                                name: finalised?.finalised ? undefined : name,
                                fineTune: finalised?.finalised ? undefined : fineTune,
                                expiryDate: finalised?.finalised ? undefined : expiryDate,
                                comment: comment,
                                finalised: finalised?.finalised ? undefined : isAllowed ?  data.finalised : undefined
                            })
                            .where(eq(fine_tunes.id, data.id))
                            .returning({ customerRuleId: fine_tunes.customerRuleId}).get()
                    // })()
                // ])
            });
        } catch(err) {
            if (isHttpError(error) && error.status < 500) throw err
            
            throw error(404, 'Failed to save edit')
        }

        for await (const { query } of requested(getCustomerRules, 1)) {
            query.refresh();
        }

        redirect(303, `/details/${createFineTune.customerRuleId}?fineTune=${data.id}`)
    }
)