import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";


export const load: LayoutServerLoad = ({ locals }) => {
    
    console.log(locals.user)

    if (!locals.user) {
        throw redirect(303, "/login")
    }

    // When logged in, then try login, it gives weird invalid origin error
    // This should be using the github teams section
    if (locals.user.teams.length === 0) {
        throw redirect(303, "/login")
    }

    return {
        user: locals.user,
        session: locals.session
    };
};

