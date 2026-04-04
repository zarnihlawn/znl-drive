import type { LoginBodyEmailInterface } from '$lib/model/interface/auth.interface';
import { auth } from '$lib/server/auth';
import { resolve } from '$app/paths';
import { z } from 'zod';

export async function logInWithEmailAndPassword(
	data: z.infer<typeof LoginBodyEmailInterface>,
	headers: Headers
) {
	return auth.api.signInEmail({
		body: {
			email: data.email,
			password: data.password,
			callbackURL: resolve('/home')
		},
		headers
	});
}
