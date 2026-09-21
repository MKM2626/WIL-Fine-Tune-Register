import { createContext } from "svelte";

export interface crNextRow { 
        id: string | null
    }

export const [getNextContext, setNextContext] = createContext<crNextRow>(); 