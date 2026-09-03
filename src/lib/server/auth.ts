import { betterAuth } from "better-auth"
import { sveltekitCookies } from "better-auth/svelte-kit"
// import { getRequest } from "@sveltejs/kit/node"
import { error } from '@sveltejs/kit'
import { getRequestEvent } from "$app/server"
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, BETTER_AUTH_TRUSTED_ORIGINS, ORGANISATION } from '$app/env/private'

export const auth = betterAuth({
    
    user: {
        additionalFields: {
            teams: {
                type: "string[]",
                required: true,
                defaultValue: [],
                input: true,
                returned: true
            }
        }
    },

    // use stateless with secondary storage to be able to revoke session on refresh 
    trustedOrigin: [BETTER_AUTH_TRUSTED_ORIGINS],
    // session: {
    //     cookieCache: {
    //         // enabled: true, 
    //         // maxAge: 7 * 24 * 60 * 60,
    //         maxAge: 60 * 60,
    //         strategy: "jwt",
    //         refreshCache: {
    //             // updateAge: 12 * 60 * 60
    //             updateAge: 30 * 60
    //         },
    //         version: "2" // Change version invalidates all session, maybe on delete user it changes session?
    //     }
    // },
    // account: {
    //     storeStateStrategy: "cookie",
    //     storeAccountCookie: true
    // },
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

                if (!userResponse.ok) {
                    error(404, "Your profile does not exist")
                }

                const profile = await userResponse.json();

                const teamNames = ["Admin", "Senior", "Junior"];

                const teams = (
                    await Promise.all(
                        teamNames.map(async (team) => {
                            const response = await fetch(
                                `https://api.github.com/orgs/${ORGANISATION}/teams/${team}/memberships/${profile.login}`,
                                headers
                            );

                            return response.ok ? team.toLowerCase() : null;
                        })
                    )
                ).filter((team): team is string => team !== null);

                console.log(teams)

                return {
                    user: {
                        name: profile.name ?? profile.login,
                        email: profile.email ?? `${profile.id}@github.placeholder.invalid`,
                        image: profile.avatar_url,
                        emailVerified: true,
                        teams
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