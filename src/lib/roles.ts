export const ROLES = ['admin', 'senior', 'junior'] as const
export type Role = (typeof ROLES)[number];

export function isRole(value: string | null | undefined) {
    return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function atLeast(role: string | null | undefined | null, min: Role): boolean {
    return isRole(role) && ROLES.indexOf(role as Role) <= ROLES.indexOf(min)
    // if first isRole fails, i don't think it will matter if the index of fails
}