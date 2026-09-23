import { fine_tunes } from "../server/db/schema.ts";
import { command, requested } from "$app/server";
import { getCustomerRules } from "./getCustomerRules.remote.ts";
import { type } from "arktype";
import { db } from '../server/db/index.ts'
import { max, eq, and } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { requireRole } from "../server/guard.ts";
import { error } from "@sveltejs/kit";

const finaliseSchema = type("string.numeric.parse") 
export const finaliseCustomerRule = command(finaliseSchema, async (crId) => {


    requireRole('senior')

    

    const latest = alias(fine_tunes, 'latest');

    const result = await db
        .update(fine_tunes)
        .set({finalised: true})
        .where(and(
            eq(fine_tunes.customerRuleId, crId),
            eq(
                fine_tunes.version,
                db.select({ version: max(latest.version) }).from(latest).where(eq(latest.customerRuleId, crId))
            )
        ))
        .returning({ id: fine_tunes.id });
            

    if (result.length === 0) {
        error(401, 'Failed to finalise customer rule')
    }

    for await (const { query } of requested(getCustomerRules, 1)) {
        query.refresh();
    }
})