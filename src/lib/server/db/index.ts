// import 'dotenv/config';
// import { eq } from 'drizzle-orm';
// import * as schema from './schema';
// import { faker } from '@faker-js/faker';
// import { url } from 'arktype/internal/keywords/string.ts';
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql';
import { DB_FILE_NAME } from '$app/env/private'

const client = createClient({ url: DB_FILE_NAME })

export const db = drizzle({client})