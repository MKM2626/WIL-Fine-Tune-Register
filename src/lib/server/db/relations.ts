import { defineRelations } from "drizzle-orm"
import * as schema from "./schema.ts"

export const relations = defineRelations(schema, (r) => ({
    technologies: {
        customers: r.many.customers()
    }, 

    customers: {
		technology: r.one.technologies({
			from: r.customers.technologyId,
			to: r.technologies.id,
            optional: false
		}),
		customerRules: r.many.customer_rules()
	},

    rules: {
		customerRules: r.many.customer_rules()
	},
    
    customer_rules: {
		rule: r.one.rules({
			from: r.customer_rules.ruleId,
			to: r.rules.id,
            optional: false
		}),
		customer: r.one.customers({
			from: r.customer_rules.customerId,
			to: r.customers.id,
            optional: false
		}),
		fineTunes: r.many.fine_tunes()
	},

    analysts: {
		createdFineTunes: r.many.fine_tunes({ alias: "creator" }),
		finalisedFineTunes: r.many.fine_tunes({ alias: "finaliser" })
	},

    fine_tunes: {
		customerRule: r.one.customer_rules({
			from: r.fine_tunes.customerRuleId,
			to: r.customer_rules.id,
            optional: false
		}),
		analyst: r.one.analysts({
			from: r.fine_tunes.analystId,
			to: r.analysts.id,
			alias: "creator",
            optional: false
		}),
		finalisedAnalyst: r.one.analysts({
			from: r.fine_tunes.finalisedAnalystId,
			to: r.analysts.id,
			alias: "finaliser"
		}),
		previousFineTune: r.one.fine_tunes({
			from: r.fine_tunes.previousFineTuneId,
			to: r.fine_tunes.id,
			alias: "previous"
		}),
		nextFineTunes: r.one.fine_tunes({ 
            from: r.fine_tunes.id,
            to: r.fine_tunes.previousFineTuneId,
            alias: "previous"
        }),
        

		tags: r.many.tags({
			from: r.fine_tunes.id.through(r.fine_tune_tags.fineTuneId),
			to: r.tags.id.through(r.fine_tune_tags.tagId)
		})
	},

    tags: {
		fineTunes: r.many.fine_tunes({
			from: r.tags.id.through(r.fine_tune_tags.tagId),
			to: r.fine_tunes.id.through(r.fine_tune_tags.fineTuneId)
		})
	}
}))