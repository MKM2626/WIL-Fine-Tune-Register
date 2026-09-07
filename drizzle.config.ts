import { Config, defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config()

export default defineConfig({
	out: './drizzle',
	schema: './src/lib/server/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url: "file:local.db",
	}
}) satisfies Config;
