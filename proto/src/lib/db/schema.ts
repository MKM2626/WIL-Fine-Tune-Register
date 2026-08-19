import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const rules = sqliteTable('rules', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()), 
	name: text().notNull()
});

// text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
export const technologies = sqliteTable("technologies", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()), 
	name: text().notNull()
});

export const customers = sqliteTable("customers", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()), 
	name: text().notNull(),

	technologyId: text("technology_id").notNull().references(() => technologies.id)
});

export const analysts = sqliteTable("analysts", {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()), 
	name: text().notNull()
});

// put in global after, based on which technology is being changed

export const fine_tunes = sqliteTable("fine_tunes", {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()), 
    date: int({ mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
    ruleId: text().references(() => rules.id).notNull(),
    customerId: text().references(() => customers.id).notNull(),
	globalId: text(),
	global: int({ mode: "boolean"}).notNull().default(false),
	before: text().notNull(),
    after: text().notNull(),
    analystId: text().references(() => analysts.id).notNull(),
    comment: text()
});

