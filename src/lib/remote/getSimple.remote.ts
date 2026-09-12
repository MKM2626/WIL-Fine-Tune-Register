import { query, form, command, requested } from "$app/server";
import { error, redirect } from '@sveltejs/kit';
import { type } from "arktype"
import { db } from '#lib/server/db/index'
import { analysts, customers, fine_tunes, technologies, rules, customer_rules, tags, fine_tune_tags} from "#lib/server/db/schema";
import { eq, and, gt, asc, desc, like, lt, or, gte, lte, sql, ne, isNotNull, isNull, countDistinct, inArray, max } from 'drizzle-orm'
import { SvelteSet } from "svelte/reactivity";
import { alias } from "drizzle-orm/cockroach-core";
import { AppError } from "#lib/errors/appError";

export const getRules = query(async() => {
    return await db.select({id: sql<string>`${rules.id}`.mapWith(String), name: sql<string>`${rules.name}`.mapWith(String)}).from(rules)
})

export const getAnalysts = query(async() => { 
    return await db.select({id: sql<string>`${analysts.id}`.mapWith(String), name: sql<string>`${analysts.name}`.mapWith(String)}).from(analysts)
})

export const getCustomers = query(async() => {
    return await db.select({id: sql<string>`${customers.id}`.mapWith(String), name: sql<string>`${customers.name}`.mapWith(String), technologyId: sql<string>`${customers.technologyId}`.mapWith(String)}).from(customers)
})

export const getTechnology = query(async() => {
    return await db.select({id: sql<string>`${technologies.id}`.mapWith(String), name: sql<string>`${technologies.name}`.mapWith(String)}).from(technologies)
})

export const getTags = query(async() => {
    return await db.select({name: tags.name}).from(tags)
})