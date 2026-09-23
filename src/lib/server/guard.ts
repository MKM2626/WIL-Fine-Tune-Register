import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { atLeast, type Role } from '../roles.ts';

export function requireRole(min: Role = 'junior') {
    const { locals } = getRequestEvent();
    if (!locals.user) error(401, 'Please sign in.');
    if (!atLeast(locals.user.role, min)) error(403, 'You do not have permission to do that.');


    return locals.user;
}