import { query, form, command, requested } from "$app/server";
import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, fine_tunes, technologies, rules, customer_rules, tags, fine_tune_tags} from "#lib/server/db/schema";
import { eq, and, gt, asc, desc, like, lt, or, gte, lte, sql, ne, isNotNull, isNull, countDistinct, inArray, max } from 'drizzle-orm'
import { alias } from "drizzle-orm/cockroach-core";
import { AppError } from "#lib/errors/appError";

// get one fine tune detail
const ftSchema = type("string.numeric.parse")
export const getFineTune = query(ftSchema, async (ftId) => {
    const creatorAnalyst = alias(analysts, "creator_analyst")
    const finaliseAnalyst = alias(analysts, 'finalise_analyst')
    const previousFineTune = alias(fine_tunes, 'previous_fine_tune');

    const result = await db.select({
        date: fine_tunes.date,
        customerRuleId: sql<string>`${fine_tunes.customerRuleId}`.mapWith(String),
        name: fine_tunes.name,
        rule: rules.name,
        customer: customers.name,
        technology: technologies.name,
        version: fine_tunes.version,
        previousFineTuneId: fine_tunes.previousFineTuneId,

        before: sql<string>`COALESCE(${previousFineTune.fineTune}, 'Initial Rule')`,
        after: fine_tunes.fineTune,
        
        globalId: fine_tunes.globalId,
        finalised: fine_tunes.finalised,

        analystId: creatorAnalyst.id,
        analyst: creatorAnalyst.name,

        finalisedAnalystId: finaliseAnalyst.id,
        finalisedAnalystName: finaliseAnalyst.name,
        comment: fine_tunes.comment
    })
    .from(fine_tunes)
    .leftJoin(customer_rules, eq(fine_tunes.customerRuleId, customer_rules.id))
    .leftJoin(customers, eq(customer_rules.customerId, customers.id))
    .leftJoin(rules, eq(customer_rules.ruleId, rules.id))
    .leftJoin(technologies, eq(customers.technologyId, technologies.id))
    .leftJoin(creatorAnalyst, eq(fine_tunes.analystId, creatorAnalyst.id))
    .leftJoin(finaliseAnalyst, eq(fine_tunes.finalisedAnalystId, finaliseAnalyst.id))
    .leftJoin(previousFineTune, eq(fine_tunes.previousFineTuneId, previousFineTune.id))
    .where(eq(fine_tunes.id, ftId))
    .get()

    if (!result) error(404, 'Fine tune does not exist.')

    return result
 
})