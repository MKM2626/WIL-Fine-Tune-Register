import { createContext } from "svelte";

export interface IsDelete { 
        bool: Boolean
    }

export const [getIsDelete, setIsDelete] = createContext<IsDelete>(); 