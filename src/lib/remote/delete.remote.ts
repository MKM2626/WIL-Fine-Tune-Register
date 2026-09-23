import { command, requested } from "$app/server";
// import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { fine_tunes, customer_rules, fine_tune_tags} from "#lib/server/db/schema";
import { eq } from 'drizzle-orm/sqlite-core/expressions'
// import { SvelteSet } from "svelte/reactivity";
// import { alias } from "drizzle-orm/cockroach-core";
import { getCustomerRules } from '#lib/remote/getCustomerRules.remote'
import { count, inArray } from "drizzle-orm";
import { requireRole } from '../server/guard'
import { error, isHttpError } from "@sveltejs/kit";

// TODO: change to new role selector
// TODO: put new restriction request on this

// should be fine?
const dSchema = type("string.numeric.parse")
export const deleteFineTune = command(dSchema, async (ftId) => {

    requireRole('senior')
    
    try {
        await db.transaction(async (tx) => {
            const selectedFineTune = await tx
                .select({ prev: fine_tunes.previousFineTuneId, crId: fine_tunes.customerRuleId })
                .from(fine_tunes)
                .where(eq(fine_tunes.id, ftId))
                .get()

            if (!selectedFineTune) error(404, 'Fine tune not found');

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
    }
    catch (err) {
        if (isHttpError(error) && error.status < 500) throw err

        throw error(404, 'Failed to delete fine tune')
    }


    for await (const { query } of requested(getCustomerRules, 1)) query.refresh()
})

export const deleteCustomerRule = command(dSchema, async (crId) => {

    requireRole('senior')

    try {
        await db.transaction(async (tx) => {
            const ftIds = tx.select({ id: fine_tunes.id }).from(fine_tunes).where(eq(fine_tunes.customerRuleId, crId));

            await tx.delete(fine_tune_tags).where(inArray(fine_tune_tags.fineTuneId, ftIds))
            await tx.delete(fine_tunes).where(eq(fine_tunes.customerRuleId, crId))

            await tx.delete(customer_rules)
                .where(eq(customer_rules.id, crId))
                .returning({ id: customer_rules.id })
        })
    } catch (err) {
        if (isHttpError(error) && error.status < 500) throw err

        throw error(404, 'Failed to delete customer rule')
    }

    for await (const { query } of requested(getCustomerRules, 1)) {
        query.refresh();
    }
    
});