// server side service

import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import multer from 'multer';
import type { Options } from 'multer';

/** Default max upload size (bytes). Override via `limits.fileSize`. */
export const MULTER_DEFAULT_FILE_SIZE = 100 * 1024 * 1024; // 100 MiB

const defaultLimits: NonNullable<Options['limits']> = {
	fileSize: MULTER_DEFAULT_FILE_SIZE
};

/**
 * Reusable multer factories for multipart `multipart/form-data` on Node (Express / Connect / custom servers).
 *
 * SvelteKit route handlers use the Fetch `Request` API — prefer `await request.formData()` there.
 * Use this when you attach multer to a Node `IncomingMessage` (e.g. custom server in front of the app).
 */
export class MulterService {
	/**
	 * Store files in memory as `Buffer` (see `Express.Multer.File.buffer`).
	 */
	static createMemory(options?: Options): multer.Multer {
		return multer({
			storage: multer.memoryStorage(),
			limits: { ...defaultLimits, ...options?.limits },
			...options
		});
	}

	/**
	 * Store files on disk under `destination` with unique filenames.
	 * Creates the directory with `mkdirSync(..., { recursive: true })` if needed.
	 */
	static createDisk(
		destination: string = join(tmpdir(), 'znl-drive-uploads'),
		options?: Options & {
			/** Build final filename; default is `uuid + extname(originalname)`. */
			resolveFilename?: (originalname: string) => string;
		}
	): multer.Multer {
		mkdirSync(destination, { recursive: true });
		const { resolveFilename, ...rest } = options ?? {};
		return multer({
			storage: multer.diskStorage({
				destination,
				filename: (_req, file, cb) => {
					const name =
						resolveFilename?.(file.originalname) ?? `${randomUUID()}${extname(file.originalname)}`;
					cb(null, name);
				}
			}),
			limits: { ...defaultLimits, ...rest?.limits },
			...rest
		});
	}

	/**
	 * Shorthand: memory storage + `single(fieldName)` middleware.
	 */
	static single(fieldName: string, options?: Options) {
		return this.createMemory(options).single(fieldName);
	}

	/**
	 * Shorthand: memory storage + `array(fieldName, maxCount)` middleware.
	 */
	static array(fieldName: string, maxCount: number, options?: Options) {
		return this.createMemory(options).array(fieldName, maxCount);
	}

	/**
	 * Shorthand: memory storage + `fields(fields)` middleware.
	 */
	static fields(fieldList: readonly { name: string; maxCount?: number }[], options?: Options) {
		return this.createMemory(options).fields(fieldList);
	}

	/**
	 * Shorthand: memory storage + `any()` middleware.
	 */
	static any(options?: Options) {
		return this.createMemory(options).any();
	}
}
