import type { User, Session } from 'better-auth'

export type AppUser = User & {teams: string[]}

