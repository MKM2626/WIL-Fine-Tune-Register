import { toast } from '#lib/components/toast.svelte';
import { AppError } from './appError';

// Unsure of what type it should be
export function handleError( error: unknown ): void {

    console.error(error);

    if (error instanceof AppError) {
        toast.error(error.message);
        return;
    }

    throw error;
}