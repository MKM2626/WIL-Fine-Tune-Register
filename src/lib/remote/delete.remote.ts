import { command, requested } from "$app/server";
// import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { fine_tunes, customer_rules} from "#lib/server/db/schema";
import { eq } from 'drizzle-orm'
// import { SvelteSet } from "svelte/reactivity";
// import { alias } from "drizzle-orm/cockroach-core";
import { AppError } from "#lib/errors/appError";
import { getCustomerRules } from '#lib/remote/getCustomerRules.remote'

// TODO: Seniors should be able to delete fine tunes, but only if they are not finalised. Other wise only admin.
// TODO: Seniors can't delete customer rules
// TODO: On delete, if fine tune after the deleted one, change its previous fine tune to the deleted fine tunes previous fine tune.

// should be fine?
const dSchema = type("string.numeric.parse")
export const deleteFineTune = command(dSchema, async (ftID) => {
    // throw new Error() or error()
    const result = await db.delete(fine_tunes).where(eq(fine_tunes.id, ftID))

    if (!result) {
        throw new AppError(
            'Failed to delete fine tune.',
            'FINE_TUNE_DELETE'
        )
    }

    for await (const { query } of requested(getCustomerRules, 1)) {
        query.refresh();
    }
    return { success: true} 
});

export const deleteCustomerRule = command(dSchema, async (crId) => {
    // throw new Error() or error()

    const result = await Promise.all([
        db.delete(fine_tunes).where(eq(fine_tunes.customerRuleId, crId)),
        db.delete(customer_rules).where(eq(customer_rules.id, crId))
    ])

    if (!result) {
        if (!result) {
            throw new AppError(
                'Failed to delete customer rule.',
                'CUSTOMER_RULE_DELETE'
            )
        }
    }

    for await (const { query } of requested(getCustomerRules, 1)) {
        query.refresh();
    }
    return { success: true} 
});