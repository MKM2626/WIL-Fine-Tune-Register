import { analysts, customer_rules, customers, fine_tune_tags, fine_tunes, rules, tags, technologies } from '../src/lib/server/db/schema.ts';
import { faker } from '@faker-js/faker';
import { db } from "../src/lib/server/db/index.ts"
import { eq, desc } from 'drizzle-orm'

// * Configuration

const TECHNOLOGY_COUNT = 6
const CUSTOMER_COUNT = 40
const RULE_COUNT = 80
const ANALYST_COUNT = 8
const TAG_COUNT = 25

const CUSTOMER_RULES_MIN = 15
const CUSTOMER_RULES_MAX = 30

const FINE_TUNE_MIN_VERSIONS = 1
const FINE_TUNE_MAX_VERSIONS = 5

const FINE_TUNE_TAGS_MIN = 1
const FINE_TUNE_TAGS_MAX = 4

const DAYS_BETWEEN_FINE_TUNES = 12
const DAYS_UNTIL_EXPIRY_DATE = 24

// Probability that the latest version of a customer rule is left unfinalised.

// Earlier versions are always finalised.
const UNFINALISED_LATEST_PROBABILITY = 0.40

// Number of global updates to create.
const GLOBAL_UPDATE_COUNT = 10

// Probability that a fine tune receives a tag.
const TAG_PROBABILITY = 0.7

const COMMENT_PROBABILITY = 0.6

const NAME_PROBABILITY = 0.6

const EXPIRY_DATE_PROBABILITY = 0.4


// Helper functions
function generateFineTune(): string {
    const operators = [">", ">=", "=", "<", "<="];

	const field = faker.helpers.arrayElement([
		"src_ip",
		"user",
		"hostname",
		"process",
		"event_count"
	])

	const operator = faker.helpers.arrayElement(operators);
	const threshold = faker.number.int({ min: 3, max: 50 });

	return `log(event="${faker.hacker.ingverb()} ${faker.hacker.noun()}") | stats count by ${field} | where count ${operator} ${threshold}`;
}

function generateComment(): string | null | undefined {
    return faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: COMMENT_PROBABILITY })
}

function generateName(): string | null | undefined {
    return faker.helpers.maybe(() => faker.word.words({ count: { min: 5, max: 10}}), { probability: NAME_PROBABILITY })
}

// main
async function seed() {
    console.log("Starting database seeding...")

    await db.transaction(async (tx) => {

        console.log("Clearing existing data...")

        await tx.delete(fine_tune_tags);
        await tx.delete(fine_tunes);
        await tx.delete(customer_rules);
        await tx.delete(tags);
        await tx.delete(analysts);
        await tx.delete(customers);
        await tx.delete(rules);
        await tx.delete(technologies);

        // Technologies
        console.log("Creating technologies...")
        const insertedTechnologies = await tx
            .insert(technologies)
            .values(Array.from({ length: TECHNOLOGY_COUNT }, () => ({ name: faker.commerce.productName() })))
            .returning()
         console.log(`  - ${insertedTechnologies.length} technologies`)


        // Customers
        console.log("Creating customers...")
        const insertedCustomers = await tx
            .insert(customers)
            .values(Array.from({length: CUSTOMER_COUNT}, () => ({ name: faker.company.name(), technologyId: faker.helpers.arrayElement(insertedTechnologies).id})))
            .returning()
        console.log(`   - ${insertedCustomers.length} customers`)


        // Rules
        console.log("Creating rules...")
        const insertedRules = await tx  
            .insert(rules)
            .values(Array.from({ length: RULE_COUNT }, () => ({ name: faker.company.catchPhrase()})))
            .returning()
        console.log(`   - ${insertedRules.length} rules`)


        // Analysts
        console.log("Creating analysts...")
        const insertedAnalysts = await tx
            .insert(analysts)
            .values( Array.from({length: ANALYST_COUNT}, () => ({ email: faker.internet.email(), name: faker.person.fullName()})) )
            .returning()
        console.log(`   - ${insertedAnalysts.length} analysts`)


        // Tags
        console.log("Creating tags...")
        const insertedTags = await tx
            .insert(tags)
            .values(Array.from({ length: TAG_COUNT}, () => ({ name: faker.lorem.word()})))
            .returning()
        console.log(`   - ${insertedTags.length} tags`)


        // Customer rules
        console.log("Creating customer rules...")
        const customerRuleValues = []
        for (const customer of insertedCustomers) {
			const numberOfRules = faker.number.int({ min: CUSTOMER_RULES_MIN, max: CUSTOMER_RULES_MAX });

			const selectedRules = faker.helpers.arrayElements( insertedRules, numberOfRules )

            const currentDate = faker.date.between({from: new Date('2000-01-01'), to: new Date('2025-12-31T23:59:59.999Z')})

			for (const rule of selectedRules) {
				customerRuleValues.push({
					customerId: customer.id,
					ruleId: rule.id,
					date: new Date(currentDate.setDate(currentDate.getDate() + DAYS_BETWEEN_FINE_TUNES))
				})
                    
			}
            
		}
		const insertedCustomerRules = await tx
			.insert(customer_rules)
			.values(customerRuleValues)
			.returning()
		console.log(`   - ${insertedCustomerRules.length} customer rules`)

        
        // non global Fine tunes 
        console.log("Creating fine tunes...")
        const insertedFineTunes = []

        for (const customerRule of insertedCustomerRules) {
            const versionCount = faker.number.int({ min: FINE_TUNE_MIN_VERSIONS, max: FINE_TUNE_MAX_VERSIONS })

            let previousFineTuneId: number | null  = null

            const currentDate = faker.date.between({from: new Date('2000-01-01'), to: new Date('2025-12-31T23:59:59.999Z')})

            for (let version = 1; version <= versionCount; version++) {

                const date = new Date(currentDate.getTime() + version * DAYS_BETWEEN_FINE_TUNES * 24 * 60 * 60 * 100)

                const expiryDate = faker.helpers.maybe(() => new Date( date.getTime() + DAYS_UNTIL_EXPIRY_DATE * 24 * 60 * 60 * 1000), { probability: EXPIRY_DATE_PROBABILITY })

                const analyst = faker.helpers.arrayElement( insertedAnalysts )
                const finalisedAnalyst = faker.helpers.arrayElement( insertedAnalysts )

                // Every version except the latest is finalised.
                const isLatest = version === versionCount 

                // If not latest, always true, otherwise do probability
                const finalised = !isLatest || faker.datatype.boolean({ probability: 1 - UNFINALISED_LATEST_PROBABILITY })

                const payload: typeof fine_tunes.$inferInsert = {
                        customerRuleId: customerRule.id,
                        version,
                        previousFineTuneId,
                        date: date,
                        expiryDate: expiryDate,
                        globalId: null,
                        name: generateName(),
                        fineTune: generateFineTune(),
                        comment: generateComment(),
                        analystId: analyst.id,
                        finalised,
                        finalisedAnalystId: finalised ? finalisedAnalyst.id : null
                    }

                const [thisFineTune] = await tx
                    .insert(fine_tunes)
                    .values(payload)
                    .returning()

                insertedFineTunes.push(thisFineTune)

                previousFineTuneId = thisFineTune.id
            }
        }
        console.log(`   - ${insertedFineTunes.length} fine tunes`)


        // Tags for non global fine tunes
        console.log("Assigning fine tune tags...")

        const fineTuneTagValues = []

        for (const fineTune of insertedFineTunes) {
            if ( !faker.datatype.boolean({ probability: TAG_PROBABILITY }) ) continue

            const numberOfTags = faker.number.int({ min: FINE_TUNE_TAGS_MIN, max: FINE_TUNE_TAGS_MAX })

            const selectedTags = faker.helpers.arrayElements( insertedTags, numberOfTags )

            for (const tag of selectedTags) {
                fineTuneTagValues.push({
                    fineTuneId: fineTune.id,
                    tagId: tag.id
                });
            }
        }

        if (fineTuneTagValues.length > 0) {
            await tx
                .insert(fine_tune_tags)
                .values(fineTuneTagValues);
        }
        console.log(`   - ${fineTuneTagValues.length} fine tune tag relations`)



        // Global fine tunes
        console.log("Creating global fine tunes...")

        const insertedGlobalFineTunes = []

        // Group customer rules by rule + technology
        const customerRulesByRuleTechnology =
            new Map<string, typeof insertedCustomerRules>()

        for (const customerRule of insertedCustomerRules) {
            const customer = insertedCustomers.find(
                (customer) => customer.id === customerRule.customerId
            )

            if (!customer) continue

            const key = `${customerRule.ruleId}-${customer.technologyId}`

            const customerRules = customerRulesByRuleTechnology.get(key) ?? []

            customerRules.push(customerRule)

            customerRulesByRuleTechnology.set(key, customerRules)
        }

        const globalCombinations = new Set<string>()

        for (let globalIndex = 0; globalIndex < GLOBAL_UPDATE_COUNT; globalIndex++) {

            let technology: typeof insertedTechnologies[number]
            let rule: typeof insertedRules[number]
            let key: string

            do {
                technology = faker.helpers.arrayElement(insertedTechnologies)
                rule = faker.helpers.arrayElement(insertedRules)

                key = `${rule.id}-${technology.id}`
            } while (globalCombinations.has(key))

            globalCombinations.add(key)

            const globalCustomerRules =
                customerRulesByRuleTechnology.get(key) ?? []

            console.log(`   Global update ${globalIndex + 1}/${GLOBAL_UPDATE_COUNT}: ${technology.name} - ${rule.name}`)

            if (globalCustomerRules.length === 0) {
                console.log(`   Global update  ${technology.name} - ${rule.name} failed `)
                continue
            }

            const globalId = faker.string.uuid()

            const name = "Global " + generateName()
            const fineTune = generateFineTune()
            const analyst = faker.helpers.arrayElement(insertedAnalysts)

            for (const customerRule of globalCustomerRules) {
                const [latest] = await tx
                    .select()
                    .from(fine_tunes)
                    .where(eq(fine_tunes.customerRuleId, customerRule.id))
                    .orderBy(desc(fine_tunes.version))
                    .limit(1)

                if (!latest || !latest.finalised) continue

                const date = new Date( latest.date.getTime() + DAYS_BETWEEN_FINE_TUNES * 24 * 60 * 60 * 1000 )

                const expiryDate = faker.helpers.maybe(() => new Date( date.getTime() + DAYS_UNTIL_EXPIRY_DATE * 24 * 60 * 60 * 1000 ), { probability: EXPIRY_DATE_PROBABILITY } )

                const payload: typeof fine_tunes.$inferInsert = {
                    customerRuleId: customerRule.id,
                    version: latest.version + 1,
                    previousFineTuneId: latest.id,
                    date,
                    expiryDate,
                    globalId,
                    name,
                    fineTune,
                    comment: `Global fine tune applied to customers using ${technology.name} ${rule.name}.`,
                    analystId: analyst.id,
                    finalised: false,
                    finalisedAnalystId: null
                }

                const [globalFineTune] = await tx
                    .insert(fine_tunes)
                    .values(payload)
                    .returning()

                insertedGlobalFineTunes.push(globalFineTune)

                if (faker.datatype.boolean({ probability: TAG_PROBABILITY })) {
                    const selectedTags = faker.helpers.arrayElements(
                        insertedTags,
                        faker.number.int({
                            min: FINE_TUNE_TAGS_MIN,
                            max: FINE_TUNE_TAGS_MAX
                        })
                    )

                    for (const tag of selectedTags) {
                        await tx
                            .insert(fine_tune_tags)
                            .values({
                                fineTuneId: globalFineTune.id,
                                tagId: tag.id
                            })
                    }
                }
            }
        }

        // Finished
        console.log("Database seed complete")
    })

    console.log("\n Seed finished successfully")
}

// Run
seed().catch((error) => {
	console.error("");
	console.error("Database seed failed:");
	console.error(error);
})