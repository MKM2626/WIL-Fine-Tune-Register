import { createContext } from "svelte";

export interface DeleteAndProceed { 
        id: string | null
    }

// rows: {
//     id: string;
//     date: Date;
//     rule: string | null;
//     customer: string | null;
//     technology: string | null;
//     finalised: boolean;
// }[] | undefined

// export interface FTContext { 
//     delete: () => Promise<void>;
//     // create: ( 
//     //     id: string,
//     //     date: Date,
//     //     rule: string | null,
//     //     customer: string | null,
//     //     technology: string | null,
//     //     finalised: boolean
//     // ) => Promise<void>
//     // update: () => Promise<void>
//     // edit: () => Promise<void>
// }

export const [getDeleteContext, setDeleteContext] = createContext<DeleteAndProceed>(); 