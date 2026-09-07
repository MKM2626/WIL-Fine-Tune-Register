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
    }

export const [getSearchContext, setSearchContext] = createContext<SearchInfo>();