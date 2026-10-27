import { db } from "../src/lib/server/db/index.ts"
import * as schema from '../src/lib/server/db/schema.ts';
// import { drizzle } from 'drizzle-orm/libsql';

await db.delete(schema.fine_tunes)
await db.delete(schema.analysts)
await db.delete(schema.customers)
await db.delete(schema.rules)
await db.delete(schema.technologies)
await db.delete(schema.customer_rules)
await db.delete(schema.fine_tune_tags)
await db.delete(schema.tags)
