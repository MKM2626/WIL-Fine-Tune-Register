// import 'dotenv/config';
// import { eq } from 'drizzle-orm';
// import * as schema from './schema';
// import { faker } from '@faker-js/faker';
// import { url } from 'arktype/internal/keywords/string.ts';
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql';

const client = createClient({ url: 'file:local.db' })

export const db = drizzle({client})