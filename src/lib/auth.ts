import { betterAuth } from "better-auth"
import { sveltekitCookies } from "better-auth/svelte-kit"
import { getRequest } from "@sveltejs/kit/node"
import { getRequestEvent } from "$app/server"
import { jwt } from "better-auth/plugins"
// import { drizzleAdapter } from "better-auth/adapters/drizzle"
// import { db } from "./db"
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET} from '$app/env/private'

export const auth = betterAuth({
    // database: drizzleAdapter(db, {
    //     provider: "sqlite"
    // }),

    // could use user to authenticate, !== to list of allowed users reject
    // user: {
    //     validateUserInfo: ({ user, source }) => {
    //     if (source.oauth?.providerId !== "google") return;
    //     if (!user.email?.endsWith("@example.com")) {
    //         return {
    //         error: "email_not_allowed",
    //         errorDescription: "Use your example.com email to sign in",
    //         };
    //     }
    //     },
    // },

    // use stateless with secondary storage to be able to revoke session on refresh 
    session: {
        cookieCache: {
            enabled: true, 
            maxAge: 7 * 24 * 60 * 60,
            strategy: "jwe",
            refreshCache: {
                updateAge: 12 * 60 * 60
            },
            version: "2" // Change version invalidates all session, maybe on delete user it changes session?
        }
    },
    account: {
        storeStateStrategy: "cookie",
        storeAccountCookie: true
    },
    socialProviders: { 
        github: {
            clientId: GITHUB_CLIENT_ID,
            clientSecret: GITHUB_CLIENT_SECRET
        }
    },
    plugins: [
        sveltekitCookies(getRequestEvent),
        jwt()
    ],
    baseURL: {
        allowedHosts: ["*"]
    },
    
})