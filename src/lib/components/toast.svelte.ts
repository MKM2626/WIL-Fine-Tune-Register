export type ToastType = 'success' | 'error';

export interface ToastItem {
    id: string;
    message: string;
    type: 'success' | 'error';
}

class ToastManager {
    list = $state<ToastItem[]>([]);

    success(message: string, duration = 6000) {
        const id = crypto.randomUUID();
        this.list.unshift({ id, message, type: 'success' });

        setTimeout(() => this.dismiss(id), duration);
    }

    error(message: string, duration = 6000) {
        const id = crypto.randomUUID()
        this.list.unshift({ id, message, type: 'error'})

        setTimeout(() => this.dismiss(id), duration);
    }

    dismiss(id: string) {
        this.list = this.list.filter(t => t.id !== id);
    }
}

export const toast = new ToastManager();