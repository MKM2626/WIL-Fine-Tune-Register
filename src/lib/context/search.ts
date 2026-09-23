import { createContext } from "svelte";

export interface SearchInfo { 
        search?: string[], 
        page: number, 
        pageSize: number, 
        descending: boolean,
        start?: Date,
        end?: Date
        finalised?: boolean,
    }

export const [getSearchContext, setSearchContext] = createContext<SearchInfo>();