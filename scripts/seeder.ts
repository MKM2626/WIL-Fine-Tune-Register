import * as schema from '../src/lib/server/db/schema.ts';
import { faker } from '@faker-js/faker';
import { db } from "../src/lib/server/db/index.ts"


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
for (let i = 0; i <40; i++) {
    mockCustomers.push({
        name: faker.commerce.productName(),
        technologyId: faker.helpers.arrayElement(actualTechnologies).id,

    })
}

const actualCustomers = await db.insert(schema.customers).values(mockCustomers).returning()

const mockAnalysts: (typeof schema.analysts.$inferInsert) []= [];
for (let i = 0; i <20; i++) {
    mockAnalysts.push({
        userName: faker.internet.username(),
        name: faker.helpers.maybe(() => faker.person.fullName(), {probability: 0.7})
    })
}

const actualAnalysts = await db.insert(schema.analysts).values(mockAnalysts).returning()

const mockCustomerRules: (typeof schema.customer_rules.$inferInsert) []=[]
for (let i = 0; i <1000; i++) {
    mockCustomerRules.push({
        date: faker.date.between({from: new Date('2000-01-01'), to: new Date('2025-12-31T23:59:59.999Z')}),
        ruleId: faker.helpers.arrayElement(actualRules).id,
        customerId: faker.helpers.arrayElement(actualCustomers).id
    })
}

const actualCustomerRules = await db.insert(schema.customer_rules).values(mockCustomerRules).returning()

const mockFineTunes: (typeof schema.fine_tunes.$inferInsert) []= [];
for (let i = 0; i <1000; i++) {

    mockFineTunes.push({
        customerRuleId: faker.helpers.arrayElement(actualCustomerRules).id,
        date: faker.date.between({from: new Date('2000-01-01'), to: new Date('2025-12-31T23:59:59.999Z')}),

        fineTune: faker.helpers.fake( 'Rule: {{person.firstName}} must not exceed {{number.int}} limits.'),
       
        finalised: true,
        finalisedAnalystId: faker.helpers.arrayElement(actualAnalysts).id,

        analystId: faker.helpers.arrayElement(actualAnalysts).id,

        comment: faker.helpers.maybe(() => faker.lorem.sentence(), {probability: 0.2})
    })
}

await db.insert(schema.fine_tunes).values(mockFineTunes)





// const shuffleRules = faker.helpers.shuffle([...actualRules])
// const mockGoldenRules: (typeof schema.golden_rules.$inferInsert) []=[]
// for (let i = 0; i <5; i++) {

//     // let primaryCrit = faker.location.country()
//     const uniqueRule = shuffleRules.pop()
//     mockGoldenRules.push({
//         ruleId: uniqueRule?.id, 
        
//         fineTune: faker.helpers.fake( 'Rule: {{person.firstName}} must not exceed {{number.int}} limits.'),

//         analystId: faker.helpers.arrayElement(actualAnalysts).id,
//         comment: faker.helpers.maybe(() => faker.lorem.sentence(), {probability: 0.2})

//     })
// }



// const mockDrafts: (typeof schema.drafts.$inferInsert) [] = []
// for (let i = 0; i <5; i++) {
    
//     // let primaryCrit = faker.location.country()
//     mockDrafts.push({
//         ruleId: faker.helpers.arrayElement(actualRules).id,
//         date: faker.date.anytime(),
//         customerId: faker.helpers.arrayElement(actualCustomers).id,
        
//         fineTune: faker.helpers.maybe(() => faker.helpers.fake( 'Rule: {{person.firstName}} must not exceed {{number.int}} limits.'), {probability: 0.5}),

//         analystId: faker.helpers.arrayElement(actualAnalysts).id,
//         comment: faker.helpers.maybe(() => faker.lorem.sentence(), {probability: 0.2})
//     })
// }


