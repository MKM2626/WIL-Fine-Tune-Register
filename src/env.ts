import {defineEnvVars} from '@sveltejs/kit/env'

export const variables = defineEnvVars({
    GITHUB_CLIENT_ID: {},
    GITHUB_CLIENT_SECRET: {},

    DB_FILE_NAME: {},

    BETTER_AUTH_SECRET: {},
    BETTER_AUTH_BASE_URL: {}
})