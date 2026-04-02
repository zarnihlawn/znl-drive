import { z } from 'zod';

export const LoginBodyEmailInterface = z.object({
	email: z.email(),
	password: z.string().min(8)
});

export const SendOtpBodyEmailInterface = z.object({
	email: z.email()
});

export const VerifyOtpBodyEmailInterface = z.object({
	email: z.email(),
	otp: z.string().length(6)
});

export const SignUpBodyEmailInterface = z.object({
	name: z.string().min(1),
	email: z.email(),
	password: z.string().min(8),
	otp: z.string().length(6)
});
