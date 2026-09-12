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