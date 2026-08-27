import { getSearchContext } from "#lib/context/search";
import { getCSV } from '#lib/remote/registers.remote'
import { toast } from '#lib/components/toast.svelte.js'
import type { SearchInfo } from '#lib/context/search'

export async function downloadCSV(searchInfo: SearchInfo) {

    let data = await getCSV(searchInfo)

    if (!data.success) {
        toast.send(`${data.message}`, 'error')
        return
    }

    let ruleOrCustomer = data.distinctCustomers.length > data.distinctRules.length ?  data.distinctRules.map(row => row.rules).join(' + ') : data.distinctCustomers.map(row => row.customer).join((' + '))

    let filename = searchInfo.search ? [data.date, ruleOrCustomer].filter(value => value !== null && value !== undefined && value !== '').join(' | ') : [data.date,`All Fine Tune`].filter(value => value !== null && value !== undefined && value !== '').join(' | ')

    let headers = Object.keys(data.rows[0]) as Array<keyof typeof data.rows[0]>
    let escapeCSV = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
    let csvRows = data.rows.map(row => 
        headers.map(header => escapeCSV(row[header])).join(',')
    );

    let csvString = [headers.map(escapeCSV).join(','), ...csvRows].join('\r\n')

    let blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    let url = URL.createObjectURL(blob);

    let link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename + ".csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}