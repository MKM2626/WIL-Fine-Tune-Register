import { toast } from '../components/toast.svelte.ts'
import { isHttpError } from '@sveltejs/kit';



// Unsure of what type it should be
export function handleError( error: unknown ): void {

    console.log(error)

    if (isHttpError(error) && error.status < 500) {
        toast.error(error.body.message)
        return
    }


    throw error
}


    // if (error instanceof AppError) {
    //     console.log('before')
    //     toast.error(error.message)
    //     console.log('after')
    //     return
    // }

    // console.log('no is instance')
    // throw error

