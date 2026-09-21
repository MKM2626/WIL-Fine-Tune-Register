import { command, requested, getRequestEvent } from "$app/server";
// import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { fine_tunes, customer_rules, fine_tune_tags} from "#lib/server/db/schema";
import { eq } from 'drizzle-orm/sqlite-core/expressions'
// import { SvelteSet } from "svelte/reactivity";
// import { alias } from "drizzle-orm/cockroach-core";
import { AppError } from "#lib/errors/appError";
import { getCustomerRules } from '#lib/remote/getCustomerRules.remote'
import { count, inArray } from "drizzle-orm";

// TODO: change to new role selector
// TODO: put new restriction request on this

// should be fine?
const dSchema = type("string.numeric.parse")
export const deleteFineTune = command(dSchema, async (ftId) => {

    const event = getRequestEvent()

    if (!event.locals.user?.teams.includes('admin') || !event.locals.user?.teams.includes('senior') ) {
        throw new AppError(
            'You are not authorised',
            'DELETE_FINE_TUNE',
            401
        )
    }
    
    try{
        await db.transaction(async (tx) => {
            const selectedFineTune = await tx
                .select({ prev: fine_tunes.previousFineTuneId, crId: fine_tunes.customerRuleId })
                .from(fine_tunes)
                .where(eq(fine_tunes.id, ftId))
                .get()

            if (!selectedFineTune) throw new AppError('Fine tune not found.', 'FINE_TUNE_DELETE');

            await tx.update(fine_tunes).set({ previousFineTuneId: selectedFineTune.prev })
                .where(eq(fine_tunes.previousFineTuneId, ftId));

            await tx.delete(fine_tune_tags).where(eq(fine_tune_tags.fineTuneId, ftId))
            await tx.delete(fine_tunes).where(eq(fine_tunes.id, ftId));

            const [{ remaining }] = await tx
                .select({ remaining: count() }).from(fine_tunes)
                .where(eq(fine_tunes.customerRuleId, selectedFineTune.crId));
            if (remaining === 0) {
                await tx.delete(customer_rules).where(eq(customer_rules.id, selectedFineTune.crId));
            }
        });
    } catch (error) {
        if (error instanceof AppError) throw error

        throw new AppError(
            'Failed to delete fine tune',
            'DELETE_FINE_TUNE',
            500
        )
    }

    for await (const { query } of requested(getCustomerRules, 1)) query.refresh()
})

export const deleteCustomerRule = command(dSchema, async (crId) => {

    const event = getRequestEvent()

    if (!event.locals.user?.teams.includes('admin') || !event.locals.user?.teams.includes('senior') ) {
        throw new AppError(
            'You are not authorised',
            'DELETE_CUSTOMER_RULE',
            401
        )
    }

    try {
        await db.transaction(async (tx) => {
            const ftIds = tx.select({ id: fine_tunes.id }).from(fine_tunes).where(eq(fine_tunes.customerRuleId, crId));

            await tx.delete(fine_tune_tags).where(inArray(fine_tune_tags.fineTuneId, ftIds))
            await tx.delete(fine_tunes).where(eq(fine_tunes.customerRuleId, crId))

            await tx.delete(customer_rules)
                .where(eq(customer_rules.id, crId))
                .returning({ id: customer_rules.id })
        })
    } catch (error) {
        if (error instanceof AppError) throw error

        throw new AppError(
            'Failed to delete customer rule',
            'DELETE_CUSTOMER_RULE',
            500
        )
    }

    for await (const { query } of requested(getCustomerRules, 1)) {
        query.refresh();
    }
    
});