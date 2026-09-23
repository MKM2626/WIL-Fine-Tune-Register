<script lang="ts">
	import { goto } from '$app/navigation';
    import { page } from '$app/state'

    let { error } = $props()
    
    let errorType = $state()

    switch (page.status) {
        case 400:
            errorType = 'Bad Request'
            break
        case 401:
            errorType = 'Unauthorised'
            break
        case 403:
            errorType = "Forbidden"
            break
        case 404:
            errorType = "Not Found"
            break
        case 500: 
            errorType = "Internal Server Error"
            break
        case 503:
            errorType = "Service Unavailable"
            break
    }

</script>


<div class='flex flex-col min-h-screen items-center justify-center bg-bg-dark px-20 text-text'>

    <h1 class="text-2xl -mb-10 font-semibold text-action">ERROR</h1>

    <h2 class="text-[200px] font-bold">{page.status}</h2>

    <h1 class="text-2xl -mt-10 font-semibold text-action">{errorType}</h1>

    <p class="mt-5">{error.message}</p>

    <button 
        class="bg-action/75 mt-5 px-4 w-30 py-2 rounded-lg shadow-lg border border-border hover:brightness-125 hover:text-text"
        onclick={() => goto('/')}
    >
        Go Home
    </button>

    <button   
        class="bg-bg-light mt-5 px-4 py-2 w-30 rounded-lg shadow-lg border border-border hover:brightness-125 hover:text-text"
        onclick={() => history.back()}
    >
        Go Back
    </button>


</div>