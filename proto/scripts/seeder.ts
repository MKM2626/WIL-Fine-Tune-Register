import * as schema from '../src/lib/db/schema.ts';
import { faker } from '@faker-js/faker';
import { db } from "../src/lib/db/index.ts"


const mockRules: (typeof schema.rules.$inferInsert) []= [];
for (let i = 0; i < 500; i++) {
    mockRules.push({
        name: faker.music.artist()
    })
}

const actualRules = await db.insert(schema.rules).values(mockRules).returning()

const mockTech: (typeof schema.technologies.$inferInsert) []= [];
for (let i = 0; i <2; i++) {
    mockTech.push({
        name: faker.commerce.productName()
    })
}

const actualTechnologies = await db.insert(schema.technologies).values(mockTech).returning()

const mockCustomers: (typeof schema.customers.$inferInsert) []= [];
for (let i = 0; i <50; i++) {
    mockCustomers.push({
        name: faker.commerce.productName(),
        technologyId: faker.helpers.arrayElement(actualTechnologies).id,

    })
}

const actualCustomers = await db.insert(schema.customers).values(mockCustomers).returning()

const mockAnalysts: (typeof schema.analysts.$inferInsert) []= [];
for (let i = 0; i <20; i++) {
    mockAnalysts.push({
        name: faker.person.fullName()
    })
}

const actualAnalysts = await db.insert(schema.analysts).values(mockAnalysts).returning()

const mockFineTunes: (typeof schema.fine_tunes.$inferInsert) []= [];
for (let i = 0; i <10; i++) {
    mockFineTunes.push({
        ruleId: faker.helpers.arrayElement(actualRules).id,
        date: faker.date.anytime(),
        customerId: faker.helpers.arrayElement(actualCustomers).id,
        before: faker.helpers.fake( 'Rule: {{person.firstName}} must not exceed {{number.int}} limits.'),
        after: faker.helpers.fake( 'Rule: {{person.firstName}} must not exceed {{number.int}} limits.'),
        analystId: faker.helpers.arrayElement(actualAnalysts).id,
        comment: faker.helpers.maybe(() => faker.lorem.sentence(), {probability: 0.2})
    })
}


await db.insert(schema.fine_tunes).values(mockFineTunes)

