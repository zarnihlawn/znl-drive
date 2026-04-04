import type { StatusColorEnum } from '../enum/color.enum';

export interface ToastInterface {
	id: number;
	message: string;
	type: StatusColorEnum;
}
