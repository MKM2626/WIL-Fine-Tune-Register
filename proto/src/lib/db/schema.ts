import { int, sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const rules = sqliteTable('rules', {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text().notNull()
});

export const technologies = sqliteTable("technologies", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text().notNull()
});

export const customers = sqliteTable("customers", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text().notNull(),

	technologyId: integer().notNull().references(() => technologies.id) // saying customer technologyId no exist no column
});

export const analysts = sqliteTable("analysts", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text().notNull()
});

export const fine_tunes = sqliteTable("fine_tunes", {
    id: integer().primaryKey({ autoIncrement: true }),
    date: int({ mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
    ruleId: integer().references(() => rules.id).notNull(),
    customerId: integer().references(() => customers.id).notNull(),
	globalId: text(),

	fineTune: text().notNull(),  

	finalised: integer ({ mode: "boolean"}).notNull().$defaultFn(() => false),

    analystId: integer().references(() => analysts.id).notNull(),
    comment: text()
});



// Assume there is version control for rules
export const golden_rules = sqliteTable("golden_rules", {
	ruleId: integer().primaryKey({ autoIncrement: true }),
	date: int({ mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
	
	fineTune: text().notNull(),

	analystId: integer().references(() => analysts.id).notNull(),
	comment: text()
})

export const drafts = sqliteTable("drafts", {
	id: integer().primaryKey({ autoIncrement: true }),
	date: int({ mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),

	tags: text('tags', { mode: 'json' }).$type<string[]>(), 

	ruleId: integer().references(() => rules.id),
    customerId: integer().references(() => customers.id),

	globalId: text(),

	fineTune: text(),

    analystId: integer().references(() => analysts.id).notNull(),
    comment: text()
})

// later add user and roles v