import { SvelteSet } from "svelte/reactivity";
import { type } from "arktype"

export const inputFTDetailsSchema = type({

    page: "number > 0",
    pageSize: "number > 0",
    descending: "boolean = true",

    "search?": ['instanceof', SvelteSet<string>],

    "name?": ['instanceof', SvelteSet<string>],
    "fineTune?": ['instanceof', SvelteSet<string>],
    "version?": ['instanceof', SvelteSet<string>],
    "analyst?": ['instanceof', SvelteSet<string>],
    "finalisedAnalyst?": ['instanceof', SvelteSet<string>],
    "comment?": ['instanceof', SvelteSet<string>],
    "tags?": ['instanceof', SvelteSet<string>],

    "expiryDate?": "boolean",

    "global?": "boolean",
    "finalised?": "boolean",

    "fineTuneId?": "string.numeric.parse",

    "start?": "Date",
    "end?": "Date",
})
export type inputFTDetailsSchema = typeof inputFTDetailsSchema.inferIn


// export type FineTuneRow = ({
//     id: string,
//     date: Date,
//     name: string | null,
//     version: number,
//     previousFineTune: number | null,
//     before: string,
//     after: string,
//     globals: {
//         fineTuneId: number;
//         customerRuleId: number;
//         name: string;
//     }[],
//     globalId: string | null,
//     finalised: boolean,
//     analystName: string | null,
//     finaliseAnalystName: string | null,
//     comment: string | null,
//     tags: string[],
// })


export type FineTuneRow = ({
    id: string;
    date: Date;
    name: string | null;
    version: number;
    expiryDate: Date | null;
    previousFineTuneId: string | null;
    globals: {
        fineTuneId: number;
        customerRuleId: number;
        name: string;
    }[];
    globalId: string | null;
    finalised: boolean;
    analystName: string | null;
    finaliseAnalystName: string | null;
    comment: string | null;
    tags: string[];
    before: {
        class: string;
        text: string;
    }[];
    after: ({
        class: string;
        text: string;
        type?: undefined;
    } | {
        type: string;
        text: string;
        class?: undefined;
    })[];
})




