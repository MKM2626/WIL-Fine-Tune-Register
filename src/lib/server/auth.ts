import { betterAuth } from "better-auth"
import { sveltekitCookies } from "better-auth/svelte-kit"
// import { getRequest } from "@sveltejs/kit/node"
import { error } from '@sveltejs/kit'
import { getRequestEvent } from "$app/server"
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, BETTER_AUTH_TRUSTED_ORIGINS, ORGANISATION } from '$app/env/private'
import { ROLES, type Role} from '#lib/roles'
import { db } from '#lib/server/db/index'
import { analysts } from './db/schema.ts'
import { sql } from 'drizzle-orm';

async function getGithubRole(login: string, headers: RequestInit): Promise<Role | null> {
    for (const role of ROLES) {

        const response = await fetch(
            `https://api.github.com/orgs/${ORGANISATION}/teams/${role}/memberships/${login}`,
            headers
        )

        if (response.status === 404) continue
        if (!response.ok) error(500, `GitHub team check failed: ${response.status}`)

        const membership = await response.json()
        if (membership.state === 'active') return role
        
    }
    return null
}

export const auth = betterAuth({

    advanced: {
        trustedProxyHeaders: true
    },
    
    user: {
        additionalFields: {
            // teams: {
            //     type: "string[]",
            //     required: true,
            //     defaultValue: [],
            //     input: true,
            //     returned: true
            // }
            role: {
                type: "string",
                required: true,
                input: true // NEED it to set this but allows user to change role
            },
            analystId: {
                type: "number",
                required: true,
                input: true
            }
        }
    },

    // use stateless with secondary storage to be able to revoke session on refresh 
    trustedOrigin: BETTER_AUTH_TRUSTED_ORIGINS.split(","),

    socialProviders: { 
        github: {
            clientId: GITHUB_CLIENT_ID,
            clientSecret: GITHUB_CLIENT_SECRET,
            scope: ["user:email", "read:org"],

            getUserInfo: async (token) => {
                const headers = { 
                    headers: {
                        Authorization: `Bearer ${token.accessToken}`,
                        Accept: "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2026-03-10"
                    }
                }

                const userResponse = await fetch( 
                    "https://api.github.com/user", 
                    headers
                )

                if (!userResponse.ok) error(404, "Your profile does not exist")
                

                const profile = await userResponse.json();



                // Should change to set to highest clearance
                // Team names should be an environment variable
                // const teamNames = ["Admin", "Senior", "Junior"];

                // const teams = (
                //     await Promise.all(
                //         teamNames.map(async (team) => {
                //             const response = await fetch(
                //                 `https://api.github.com/orgs/${ORGANISATION}/teams/${team}/memberships/${profile.login}`,
                //                 headers
                //             );

                //             return response.ok ? team.toLowerCase() : null;
                //         })
                //     )
                // ).filter((team): team is string => team !== null);

                const role = await getGithubRole(profile.login, headers);
                if (!role) error(403, 'You need to be a member of the organisation to sign in.');

                console.log(role)



                const [inserted] = await db.insert(analysts).values({ githubId: profile.id, email: profile.email ?? `${profile.id}@github.placeholder.invalid`, name: profile.name ?? profile.login})
                    .onConflictDoUpdate({
                        target: analysts.githubId, 
                        set: {
                            email: sql`excluded.email`,
                            name: sql`excluded.name`
                        }
                    })
                    .returning({ id: analysts.id})

                

                return {
                    user: {
                        name: profile.name ?? profile.login,
                        email: profile.email ?? `${profile.id}@github.placeholder.invalid`,
                        image: profile.avatar_url,
                        emailVerified: true,
                        role: role, 
                        analystId: inserted.id

                    },
                    data: profile
                };
            }
            
        }
    },
    plugins: [
        sveltekitCookies(getRequestEvent),
    ],
    baseURL: {
        allowedHosts: ["*"],
        fallback: "http://localhost:5173"
    }
})