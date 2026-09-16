
// import { getCSV } from '#lib/remote/registers.remote'
import { getCSV } from "../remote/getCSV.remote";
import { toast } from '../components/toast.svelte.js'
import type { CRSearchInfo } from '../context/customerRuleSearch'
import { handleError } from "../errors/handleError";

export async function downloadCSV(inputCRSearchInfo: CRSearchInfo) {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const  {page, pageSize, ...crSearchInfo} = inputCRSearchInfo


    try {
        const data = await getCSV({ crSearchInfo})

        const ruleOrCustomer = data.distinctCustomers.length > data.distinctRules.length ?  data.distinctRules.join(' + ') : data.distinctCustomers.join((' + '))

        const filename = crSearchInfo.search ? [data.date, ruleOrCustomer].filter(value => value !== null && value !== undefined && value !== '').join(' | ') : [data.date,`All Fine Tune`].filter(value => value !== null && value !== undefined && value !== '').join(' | ')

        // can't diff between yes or no
        const headers = Object.keys(data.rows[0])

        const escapeCSV = (value: string | null) => value === null ? '' : `"${String(value).replace(/"/g, '""')}"` 
        const csvRows = data.rows.map(row => 
            // added header to be as keyof typeof row, as i know its always going to be a type of row
            headers.map(header => escapeCSV(row[header as keyof typeof row])).join(',')
        );

        const csvString = [headers.map(escapeCSV).join(','), ...csvRows].join('\r\n')

        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename + ".csv");
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Downloaded ${filename}`)
        
    } catch(error) {
        console.log("this error", error)

        handleError(error)
    }
}