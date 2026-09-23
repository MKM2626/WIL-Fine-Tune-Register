// import { type } from 'arktype';

// const toastSchema = type({
// 	message: 'string',
// 	type: "'success' | 'error'"
// });

// export type Toast = typeof toastSchema.infer;

// let toast = $state<Toast | null>(null);

// let timeout: ReturnType<typeof setTimeout>;

// export function showToast(
// 	message: string,
// 	type: Toast['type'] = 'success'
// ) {
// 	toast = { message, type };

// 	clearTimeout(timeout);

// 	timeout = setTimeout(() => {
// 		toast = null;
// 	}, 1500);
// }

// export function getToast() {
// 	return toast;
// }

// toast.svelte.ts
export type ToastType = 'success' | 'error';

export interface ToastItem {
    id: string;
    message: string;
    type: 'success' | 'error';
}

class ToastManager {
    // Reactive array holding active toasts
    list = $state<ToastItem[]>([]);

    send(message: string, type: ToastType = 'success', duration = 1500) {
        const id = crypto.randomUUID();
        this.list.push({ id, message, type });

        // Auto-dismiss after duration
        setTimeout(() => this.dismiss(id), duration);
    }

    dismiss(id: string) {
        this.list = this.list.filter(t => t.id !== id);
    }
}

// Export a single instance to use across files
export const toast = new ToastManager();