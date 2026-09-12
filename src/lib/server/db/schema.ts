import { primaryKey, varchar } from "drizzle-orm/cockroach-core";
import { sqliteTable, text, integer, unique, foreignKey } from "drizzle-orm/sqlite-core";

export const rules = sqliteTable('rules', {
	id: integer().primaryKey({ autoIncrement: true }),
	name: varchar({ length: 255}).notNull()
});

export const technologies = sqliteTable("technologies", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: varchar({ length: 255}).notNull()
});

export const customers = sqliteTable("customers", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: varchar({ length: 255}).notNull(),
	technologyId: integer().notNull().references(() => technologies.id) // saying customer technologyId no exist no column
});

export const analysts = sqliteTable("analysts", {
	id: integer().primaryKey({ autoIncrement: true }),
	githubId: integer().notNull(),
	name: varchar({ length: 255}).notNull(),
});

export const customer_rules = sqliteTable('customer_rules', {
	id: integer().primaryKey({ autoIncrement: true }),
	date: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
	ruleId: integer().references(() => rules.id).notNull(),
	customerId: integer().references(() => customers.id).notNull(),
}, (t) => ([
	unique("unique_rule_customer").on(t.ruleId, t.customerId),
]))

export const fine_tunes = sqliteTable("fine_tunes", {
    id: integer().primaryKey({ autoIncrement: true }),
	previousFineTuneId: integer('previous_fine_tune_id'),
	version: integer().notNull(),
    date: integer({ mode: 'timestamp_ms' }).$defaultFn(() => new Date()).notNull(),
	expireyDate: integer({ mode: 'timestamp_ms' }),
    customerRuleId: integer().references(() => customer_rules.id).notNull(),
	globalId: varchar({ length: 36}),

	name: varchar({ length: 72}),
	fineTune: text().notNull(),  
	comment: text(),

	analystId: integer().references(() => analysts.id).notNull(),

	finalised: integer ({ mode: "boolean"}).notNull().$defaultFn(() => false),
	finalisedAnalystId: integer().references(() => analysts.id),
}, (t) => [
	unique('unique_version').on(t.version), 
	foreignKey({
		columns: [t.previousFineTuneId],
		foreignColumns: [t.id],
		name: 'previous_fine_tune_id_fk'
	})
]);

export const fine_tune_tags = sqliteTable("fine_tune_tags", {
	fineTuneId: integer().references(() => fine_tunes.id).notNull(),
	tagId: integer().references(() => tags.id).notNull(),
	}, 
	(table) => [ primaryKey({ columns: [table.fineTuneId, table.tagId] })]

)

export const tags = sqliteTable("tags", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: varchar({ length: 72}).notNull().unique(),
})

// export const analyst_comment_history = sqliteTable("analyst_comment_history", {
// 	id: integer().primaryKey({ autoIncrement: true }),
// 	date: integer({ mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
// 	analystId: integer().references(() => analysts.id).notNull(),
// 	fineTuneId: integer().references(() => fine_tunes.id).notNull(),
// 	comment: text().notNull()
// })




// Assume there is version control for rules
// export const golden_rules = sqliteTable("golden_rules", {
// 	ruleId: integer().primaryKey({ autoIncrement: true }),
// 	date: integer({ mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
	
// 	fineTune: text().notNull(),

// 	analystId: integer().references(() => analysts.id).notNull(),
// 	comment: text()
// })

// export const drafts = sqliteTable("drafts", {
// 	id: integer().primaryKey({ autoIncrement: true }),
// 	date: integer({ mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),

// 	tags: text('tags', { mode: 'json' }).$type<string[]>(), 

// 	ruleId: integer().references(() => rules.id),
//     customerId: integer().references(() => customers.id),

// 	globalId: text(),

// 	fineTune: text(),
	
//     comment: text()
// })

// later add user and roles v