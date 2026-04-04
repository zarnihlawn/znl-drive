// client side service

import type { StatusColorEnum } from '$lib/model/enum/color.enum';
import type { ToastInterface } from '$lib/model/interface/toast.interface';
import { ToastState } from '$lib/state/toast.state.svelte';

let nextToastId = 1;

export class ToastService {
	addToast(message: string, type: StatusColorEnum) {
		const newToast: ToastInterface = {
			id: nextToastId++,
			message,
			type
		};
		ToastState.push(newToast);

		// Auto-remove after 5s
		setTimeout(() => this.removeToast(newToast.id), 5000);
	}

	removeToast(id: number) {
		const index = ToastState.findIndex((a) => a.id === id);
		if (index !== -1) {
			ToastState.splice(index, 1);
		}
	}

	clearAll() {
		ToastState.splice(0, ToastState.length);
	}
}

export const toastService = new ToastService();
