import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";


export const load: PageServerLoad = ({ locals }) => {
    if (!locals.user) {
        throw redirect(303, "/login")
    }

    if (locals.user.teams.length === 0) {
        throw redirect(303, "/login")
    }

    if (locals.user.teams.includes('junior') && !locals.user.teams.includes('admin') || !locals.user.teams.includes('senior')) {
        throw redirect(303, '/')
    }

    return {
        user: locals.user,
        session: locals.session
    };
};

