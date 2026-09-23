import { createContext } from "svelte";
import type { SvelteSet } from "svelte/reactivity";

export interface SearchInfo { 
        search?: SvelteSet<string>, 
        page: number, 
        pageSize: number, 
        descending: boolean,
        start?: Date,
        end?: Date
        finalised?: boolean,
        global?: boolean,

        rule?: string,
        customer?: string,
        technology?: string,
        analyst?: string,
        fine_tune?: string,
        comment?: string
    }

export const [getSearchContext, setSearchContext] = createContext<SearchInfo>();