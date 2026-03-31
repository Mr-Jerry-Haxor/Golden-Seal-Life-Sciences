import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
  durationMs: number;
};

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastItemsSignal = signal<ToastItem[]>([]);

  readonly toastItems = this.toastItemsSignal.asReadonly();

  show(options: {
    message: string;
    tone?: ToastTone;
    durationMs?: number;
  }): string {
    const id = crypto.randomUUID();
    const toast: ToastItem = {
      id,
      message: options.message,
      tone: options.tone || 'info',
      durationMs: options.durationMs ?? 3200
    };

    this.toastItemsSignal.update((items) => [toast, ...items].slice(0, 6));

    if (toast.durationMs > 0) {
      window.setTimeout(() => {
        this.dismiss(id);
      }, toast.durationMs);
    }

    return id;
  }

  dismiss(id: string): void {
    this.toastItemsSignal.update((items) => items.filter((item) => item.id !== id));
  }

  clearAll(): void {
    this.toastItemsSignal.set([]);
  }
}
