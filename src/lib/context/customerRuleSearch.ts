import { createContext } from "svelte";
import type { SvelteSet } from "svelte/reactivity";


export interface CRSearchInfo { 
    
        search?: SvelteSet<string>, 

        rule?: SvelteSet<string>,
        customer?: SvelteSet<string>,
        technology?: SvelteSet<string>,
        version?: SvelteSet<string>,

        name?: SvelteSet<string>,
        fineTune?: SvelteSet<string>,
        finalisedAnalyst?: SvelteSet<string>,
        analyst?: SvelteSet<string>,
        comment?: SvelteSet<string>
        tags?: SvelteSet<string>, 
        expiryDate?: boolean,

        finalised?: boolean,
        global?: boolean,

        page: number, 
        pageSize: number, 
        descending: boolean,
        isFineTuneSort: boolean,

        ftStart?: Date,
        ftEnd?: Date

        crStart?: Date,
        crEnd?: Date
    }

export const [getCRSearchContext, setCRSearchContext] = createContext<CRSearchInfo>();