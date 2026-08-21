import { createContext } from "svelte";
import { type } from 'arktype'

// const SearchInfo = type({
//     "search?": "string", 
//      page: "number", 
//     pageSize: "number", 
//     descending: "boolean",
//     "start?": "Date",
//     "end?": "Date"
// })

// export type SearchInfo = typeof SearchInfo.infer

export interface SearchInfo { 
        search?: string, 
        page: number, 
        pageSize: number, 
        descending: boolean,
        start?: Date,
        end?: Date
    }


export const [getSearchContext, setSearchContext] = createContext<SearchInfo>();