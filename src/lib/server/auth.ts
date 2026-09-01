import { betterAuth } from "better-auth"
import { sveltekitCookies } from "better-auth/svelte-kit"
// import { getRequest } from "@sveltejs/kit/node"
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
                console.log(token)

                const userResponse = await fetch( 
                    "https://api.github.com/user",
                    {
                        headers: {
                            Authorization: `Bearer ${token.accessToken}`,
                            Accept: "application/vnd.github+json",
                            "X-GitHub-Api-Version": "2026-03-10"
                        }
                    }
                )

                if (!userResponse.ok) {
                    throw new Error(
                        `GitHub /user failed: ${userResponse.status}`
                    );
                }

                const profile = await userResponse.json();

                async function isTeamMember(teamSlug: string) {
                    const response = await fetch(
                        `https://api.github.com/orgs/${ORGANISATION}/teams/${teamSlug}/memberships/${profile.login}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token.accessToken}`,
                                Accept: "application/vnd.github+json",
                                "X-GitHub-Api-Version": "2026-03-10"
                            }
                        }
                    );

                    return response.ok;
                }

                const isAdmin = await isTeamMember("Admin");
                const isSenior = await isTeamMember("Senior");
                const isJunior = await isTeamMember("Junior");

                const teams: string[] = [];

                if (isAdmin) {teams.push("admin")}
                if (isSenior) {teams.push("senior")}
                if (isJunior) {teams.push("junior")}

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