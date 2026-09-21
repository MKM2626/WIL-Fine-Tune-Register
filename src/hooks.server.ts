import { auth } from "#lib/server/auth";
import { type Handle, redirect } from '@sveltejs/kit'
import { svelteKitHandler } from 'better-auth/svelte-kit'
import { building } from "$app/env"; 
import { sequence } from "@sveltejs/kit/hooks";
import { error } from '@sveltejs/kit'
import {isRole, atLeast} from '#lib/roles'

const authentication: Handle = async ({ event, resolve }) => {
    return svelteKitHandler({event, resolve, auth, building });
};

const session: Handle = async ({ event, resolve }) => {
    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    if (session) {
        event.locals.session = session.session;
        event.locals.user = session.user;
    }

    return resolve(event);
};

const route_guard: Handle = async ({ event, resolve }) => {
    if (event.route.id?.startsWith('/(protected)') && !event.locals.session) {
        redirect(303, '/login')
    }

    if (event.locals.session && !isRole(event.locals.user?.role)) {
        error(401, "You are not permitted to access this service")
    }

    // if (event.locals.user?.role.length === 0 && event.locals.session) {
    //     error(401, "You are not permitted to access this service")
    // }


    if (event.route.id?.startsWith('/(protected)/create') && !atLeast(event.locals.user?.role, 'senior')) {
        error(403, 'You are not permitted to create a new rule');
    }

    // if (event.route.id?.startsWith('/(protected)/create') && (!event.locals.user?.teams.includes('admin') || !event.locals.user?.teams.includes('senior'))) {
    //     error(403, 'You are not permitted to create a new rule');
    // }

    return resolve(event);
};

export const handle = sequence(authentication, session, route_guard);

