import { createContext } from "svelte";
import type { SvelteSet } from "svelte/reactivity";

export interface CRSearchInfo { 
    
        search?: SvelteSet<string>, 

        rule?: string,
        customer?: string,
        technology?: string,

        name?: string,
        fineTune?: string,
        finalisedAnalyst?: string,
        analyst?: string,
        comment?: string
        tags?: SvelteSet<string>, 
        expiryDate?: boolean,

        finalised?: boolean,
        global?: boolean,

        page: number, 
        pageSize: number, 
        descending: boolean,

        ftStart?: Date,
        ftEnd?: Date

        crStart?: Date,
        crEnd?: Date
    }

export const [getCRSearchContext, setCRSearchContext] = createContext<CRSearchInfo>();