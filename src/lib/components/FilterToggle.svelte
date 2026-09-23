<script lang="ts">
    let { icon: Icon, label, value, type = 'off', title, onclick } = $props();

    const types: Record<string, Record< string, string | null>> = {
        // off applies to expiry, global, status
        off: { box: 'border-border bg-bg-light hover:border-action', icon: 'text-text-muted', text: 'text-text-muted' },
        
        // Only for two option button of date
        mode: { box: 'border-border bg-bg-light hover:border-action', icon: 'text-text-muted', text: 'text-text' },
        
        // to the rest of them
        on: { box: 'border-action/50 bg-action/10', icon: 'text-indigo-300', text: 'text-text' },
        yes: { box: 'border-green-500/50 bg-green-500/10',  icon: 'text-green-400', text: 'text-green-300' },
        no: { box: 'border-red-500/50 bg-red-500/10', icon: 'text-red-400', text: 'text-red-300' },
        // only to finalised
        pending: { box: 'border-amber-500/50 bg-amber-500/10', icon: 'text-amber-400', text: 'text-amber-300' }
    }

  
    const selectedType = $derived(types[type as keyof typeof types])
    
</script>

<button
    type="button"
    {onclick}
    title="{title} (click to change)"
    class="flex w-full flex-col items-start rounded-lg border px-3 py-1 text-left transition-all duration-250 ease-out {selectedType.box}"
>
    <span class="text-[10px] font-medium uppercase tracking-wide text-text-muted inline-flex gap-x-2">
        <Icon size={14} class="shrink-0 {selectedType.icon}" />
        {label}
    </span>
    <span class="max-w-full truncate text-sm font-medium {selectedType.text}">{value}</span>
</button>