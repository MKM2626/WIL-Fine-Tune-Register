import { fine_tunes } from "../server/db/schema.ts";
import { command, requested, getRequestEvent } from "$app/server";
import { getCustomerRules } from "./getCustomerRules.remote.ts";
import { type } from "arktype";
import { db } from '../server/db/index.ts'
import { max, eq, and } from "drizzle-orm";
import { AppError } from "../errors/appError.ts";
import { alias } from "drizzle-orm/sqlite-core";


const finaliseSchema = type("string.numeric.parse") 
export const finaliseCustomerRule = command(finaliseSchema, async (crId) => {


    const event = getRequestEvent()

    if (!event.locals.user?.teams.includes('admin') || !event.locals.user?.teams.includes('senior')) {
        throw new AppError(
            'You are not authorised',
            'FINALISE_CUSTOMER_RULE',
            401
        )
    }

    

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
        throw new AppError(
            'Failed to finalise customer rule',
            'FINALISE_CUSTOMER_RULE',
            401
        )
    }

    for await (const { query } of requested(getCustomerRules, 1)) {
        query.refresh();
    }
})