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

export type ToastType = 'success' | 'error';

export interface ToastItem {
    id: string;
    message: string;
    type: 'success' | 'error';
}

class ToastManager {
    list = $state<ToastItem[]>([]);

    send(message: string, type: ToastType = 'success', duration = 6000) {
        const id = crypto.randomUUID();
        this.list.unshift({ id, message, type });

        setTimeout(() => this.dismiss(id), duration);
    }

    dismiss(id: string) {
        this.list = this.list.filter(t => t.id !== id);
    }
}

export const toast = new ToastManager();