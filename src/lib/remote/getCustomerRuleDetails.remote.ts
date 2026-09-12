import { query, form, command, requested } from "$app/server";
import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, fine_tunes, technologies, rules, customer_rules, tags, fine_tune_tags} from "#lib/server/db/schema";
import { eq, and, gt, asc, desc, like, lt, or, gte, lte, sql, ne, isNotNull, isNull, countDistinct, inArray, max } from 'drizzle-orm'
import { SvelteSet } from "svelte/reactivity";
import { alias } from "drizzle-orm/cockroach-core";
import { AppError } from "#lib/errors/appError";

const crSchema = type("string.numeric.parse")
export const getCustomerRuleDetails = query(crSchema, async (crId) => {
    const result = await db.select({
        date: customer_rules.date,
        rule: rules.name,
        customer: customers.name,
        technology: technologies.name,
    })
    .from(customer_rules)
    .leftJoin(customers, eq(customer_rules.customerId, customers.id))
    .leftJoin(rules, eq(customer_rules.ruleId, rules.id))
    .leftJoin(technologies, eq(customers.technologyId, technologies.id))
    .where(eq(customer_rules.id, crId))
    .get()

    if (!result) error(404, "Customer Rule does not exist.")

    return result
})