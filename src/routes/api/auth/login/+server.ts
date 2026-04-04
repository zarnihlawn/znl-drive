import { LoginBodyEmailInterface } from '$lib/model/interface/auth.interface';
import { logInWithEmailAndPassword } from '$lib/remote/auth-remote/login.remote';
import { redirect, error } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { RequestHandler } from '@sveltejs/kit';

async function readCredentials(request: Request): Promise<{ email: string; password: string }> {
	const type = request.headers.get('content-type') ?? '';
	if (type.includes('application/json')) {
		const body = (await request.json()) as { email?: string; password?: string };
		return { email: body.email ?? '', password: body.password ?? '' };
	}
	const form = await request.formData();
	return {
		email: String(form.get('email') ?? ''),
		password: String(form.get('password') ?? '')
	};
}

export const POST: RequestHandler = async ({ request }) => {
	let email: string;
	let password: string;
	try {
		({ email, password } = await readCredentials(request));
	} catch {
		throw error(400, 'Invalid request body');
	}

	const parsed = LoginBodyEmailInterface.safeParse({ email, password });
	if (!parsed.success) {
		throw error(400, 'Invalid email or password');
	}

	try {
		await logInWithEmailAndPassword(parsed.data, request.headers);
	} catch {
		throw error(401, 'Invalid email or password');
	}

	const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
	if (wantsJson) {
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
	}

	throw redirect(303, resolve('/home'));
};
