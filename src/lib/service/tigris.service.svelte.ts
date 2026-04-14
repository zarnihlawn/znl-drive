// server side service

import { readFile } from 'node:fs/promises';
import { env } from '$env/dynamic/private';
import {
	createBucket,
	get,
	getBucketInfo,
	getPresignedUrl,
	head,
	list,
	listBuckets,
	put,
	remove,
	removeBucket
} from '@tigrisdata/storage';

// Local type helpers – mirror SDK shapes we actually use to keep this file typed
type TigrisStorageConfig = {
	bucket?: string;
	accessKeyId?: string;
	secretAccessKey?: string;
	endpoint?: string;
};

type TigrisStorageResponse<T, E> = {
	data?: T;
	error?: E;
};

type PutResponse = {
	contentDisposition?: string;
	contentType?: string;
	modified?: Date;
	path: string;
	size: number;
	url: string;
};

type PutOptions = {
	access?: 'public' | 'private';
	addRandomSuffix?: boolean;
	allowOverwrite?: boolean;
	contentType?: string;
	contentDisposition?: 'inline' | 'attachment';
	multipart?: boolean;
	abortController?: AbortController;
	onUploadProgress?: (args: { loaded: number; total?: number; percentage?: number }) => void;
	config?: TigrisStorageConfig;
};

type GetOptions = {
	contentDisposition?: 'inline' | 'attachment';
	contentType?: string;
	encoding?: string;
	config?: TigrisStorageConfig;
};

type HeadResponse = {
	contentDisposition?: string;
	contentType?: string;
	modified?: Date;
	path: string;
	size: number;
	url: string;
};

type HeadOptions = {
	config?: TigrisStorageConfig;
};

type ListResponseItem = {
	name: string;
	size: number;
	modified?: Date;
	contentType?: string | null;
};

type ListResponse = {
	items: ListResponseItem[];
	paginationToken?: string;
	hasMore?: boolean;
};

type ListOptions = {
	delimiter?: string;
	prefix?: string;
	limit?: number;
	paginationToken?: string;
	config?: TigrisStorageConfig;
};

type GetPresignedUrlOptions = {
	operation: 'get' | 'put';
	expiresIn?: number;
	contentType?: string;
	config?: TigrisStorageConfig;
};

type GetPresignedUrlResponse = {
	url: string;
	method: string;
	expiresIn: number;
};

type CreateBucketOptions = {
	enableSnapshot?: boolean;
	sourceBucketName?: string;
	sourceBucketSnapshot?: string;
	config?: TigrisStorageConfig;
};

type CreateBucketResponse = {
	isSnapshotEnabled: boolean;
	hasForks: boolean;
	sourceBucketName?: string;
	sourceBucketSnapshot?: string;
};

type BucketInfoResponse = {
	isSnapshotEnabled: boolean;
	hasForks: boolean;
	sourceBucketName?: string;
	sourceBucketSnapshot?: string;
};

type ListBucketsOptions = {
	limit?: number;
	paginationToken?: string;
	config?: TigrisStorageConfig;
};

type ListBucketsResponse = {
	buckets: { name: string }[];
	owner?: unknown;
	paginationToken?: string;
};

type RemoveBucketOptions = {
	force?: boolean;
	config?: TigrisStorageConfig;
};

/**
 * Thin, reusable wrapper around the Tigris Storage SDK.
 *
 * - Centralizes env‑based configuration (`$env/dynamic/private` + `process.env` fallback).
 * - Provides typed helpers for common operations (upload, download, delete, list, buckets, presign).
 * - Normalizes error handling so call sites can just `await` and catch.
 *
 * Server-only — import from API routes or `$lib/server/*`, not from client components.
 */
export class TigrisUtil {
	private static readPrivateEnv(...keys: string[]): string | undefined {
		const raw = env as Record<string, string | undefined>;
		for (const key of keys) {
			const v = raw[key];
			if (typeof v === 'string' && v.trim() !== '') return v;
			const p = process.env[key];
			if (typeof p === 'string' && p.trim() !== '') return p;
		}
		return undefined;
	}

	/**
	 * Build default config from environment.
	 * Callers can still override via the `config` option on each method.
	 */
	static getDefaultConfig(): TigrisStorageConfig {
		return {
			bucket: this.readPrivateEnv('TIGRIS_STORAGE_BUCKET', 'TIGRIS_BUCKET'),
			accessKeyId: this.readPrivateEnv('TIGRIS_STORAGE_ACCESS_KEY_ID', 'TIGRIS_ACCESS_KEY'),
			secretAccessKey: this.readPrivateEnv('TIGRIS_STORAGE_SECRET_ACCESS_KEY', 'TIGRIS_SECRET_KEY'),
			endpoint: this.readPrivateEnv('TIGRIS_STORAGE_ENDPOINT') ?? 'https://t3.storage.dev'
		};
	}

	/**
	 * Helper to merge default config with per‑call overrides.
	 */
	private static mergeConfig(override?: TigrisStorageConfig): TigrisStorageConfig | undefined {
		const base = this.getDefaultConfig();
		return { ...base, ...override };
	}

	/**
	 * Upload an object.
	 *
	 * @param path Object key/path in the bucket
	 * @param body Content to upload
	 * @param options Tigris `PutOptions` (access, multipart, progress, etc.)
	 */
	static async upload(
		path: string,
		body: string | ReadableStream | Blob | Buffer,
		options?: PutOptions & { configOverride?: TigrisStorageConfig }
	): Promise<PutResponse> {
		const { configOverride, ...rest } = options ?? {};
		const res = await put(path, body, {
			...rest,
			config: this.mergeConfig(configOverride)
		});

		if (res.error) {
			throw res.error;
		}

		return res.data as PutResponse;
	}

	/**
	 * Upload from a multer file (memory `buffer` or disk `path`).
	 */
	static async uploadFromMulterResult(
		objectKey: string,
		file: Express.Multer.File,
		options?: PutOptions & { configOverride?: TigrisStorageConfig }
	): Promise<PutResponse> {
		const contentType = options?.contentType ?? file.mimetype ?? 'application/octet-stream';

		if (file.buffer !== undefined) {
			return this.upload(objectKey, file.buffer, { ...options, contentType });
		}
		if (file.path) {
			const buf = await readFile(file.path);
			return this.upload(objectKey, buf, { ...options, contentType });
		}
		throw new Error('Multer file has no buffer or path');
	}

	/**
	 * Download an object as string / file / stream.
	 */
	static async downloadString(
		path: string,
		options?: GetOptions & { configOverride?: TigrisStorageConfig }
	): Promise<string> {
		const { configOverride, ...rest } = options ?? {};
		const res = await get(path, 'string', {
			...rest,
			config: this.mergeConfig(configOverride)
		});

		if (res.error) {
			throw res.error;
		}

		return (res.data as unknown as string) ?? '';
	}

	static async downloadFile(
		path: string,
		options?: GetOptions & { configOverride?: TigrisStorageConfig }
	): Promise<File> {
		const { configOverride, ...rest } = options ?? {};
		const res = await get(path, 'file', {
			...rest,
			config: this.mergeConfig(configOverride)
		});

		if (res.error) {
			throw res.error;
		}

		return res.data as File;
	}

	static async downloadStream(
		path: string,
		options?: GetOptions & { configOverride?: TigrisStorageConfig }
	): Promise<ReadableStream | null> {
		const { configOverride, ...rest } = options ?? {};
		const res = await get(path, 'stream', {
			...rest,
			config: this.mergeConfig(configOverride)
		});

		if (res.error) {
			throw res.error;
		}

		return (res.data as unknown as ReadableStream | null) ?? null;
	}

	/**
	 * Delete an object.
	 */
	static async deleteObject(
		path: string,
		options?: { configOverride?: TigrisStorageConfig }
	): Promise<void> {
		const res = await remove(path, {
			config: this.mergeConfig(options?.configOverride)
		});

		if (res.error) {
			throw res.error;
		}
	}

	/**
	 * Get object metadata (size, URL, content type, etc.).
	 */
	static async getMetadata(
		path: string,
		options?: HeadOptions & { configOverride?: TigrisStorageConfig }
	): Promise<HeadResponse> {
		const { configOverride, ...rest } = options ?? {};
		const res = await head(path, {
			...rest,
			config: this.mergeConfig(configOverride)
		});

		if (res.error) {
			throw res.error;
		}

		return res.data as HeadResponse;
	}

	/**
	 * List objects in the current bucket.
	 */
	static async listObjects(
		options?: ListOptions & { configOverride?: TigrisStorageConfig }
	): Promise<ListResponse> {
		const { configOverride, ...rest } = options ?? {};
		const res: TigrisStorageResponse<ListResponse, Error> = (await list({
			...rest,
			config: this.mergeConfig(configOverride)
		})) as unknown as TigrisStorageResponse<ListResponse, Error>;

		if (res.error) {
			throw res.error;
		}

		return res.data as ListResponse;
	}

	/**
	 * Create a bucket.
	 */
	static async createBucket(
		bucketName: string,
		options?: CreateBucketOptions & {
			configOverride?: TigrisStorageConfig;
		}
	): Promise<CreateBucketResponse> {
		const { configOverride, ...rest } = options ?? {};
		const res = await createBucket(bucketName, {
			...rest,
			config: this.mergeConfig(configOverride)
		});

		if (res.error) {
			throw res.error;
		}

		return res.data as CreateBucketResponse;
	}

	/**
	 * Delete a bucket.
	 */
	static async deleteBucket(
		bucketName: string,
		options?: RemoveBucketOptions & {
			configOverride?: TigrisStorageConfig;
		}
	): Promise<void> {
		const { configOverride, ...rest } = options ?? {};
		const res = await removeBucket(bucketName, {
			...rest,
			config: this.mergeConfig(configOverride)
		});

		if (res.error) {
			throw res.error;
		}
	}

	/**
	 * Get info for a single bucket.
	 */
	static async getBucketInfo(
		bucketName: string,
		options?: { configOverride?: TigrisStorageConfig }
	): Promise<BucketInfoResponse> {
		const res = await getBucketInfo(bucketName, {
			config: this.mergeConfig(options?.configOverride)
		});

		if (res.error) {
			throw res.error;
		}

		return res.data as BucketInfoResponse;
	}

	/**
	 * List all buckets for the current account.
	 */
	static async listBuckets(
		options?: ListBucketsOptions & {
			configOverride?: TigrisStorageConfig;
		}
	): Promise<ListBucketsResponse> {
		const { configOverride, ...rest } = options ?? {};
		const res: TigrisStorageResponse<ListBucketsResponse, Error> = (await listBuckets({
			...rest,
			config: this.mergeConfig(configOverride)
		})) as unknown as TigrisStorageResponse<ListBucketsResponse, Error>;

		if (res.error) {
			throw res.error;
		}

		return res.data as ListBucketsResponse;
	}

	/**
	 * Get a presigned URL for GET/PUT.
	 */
	static async getPresignedUrl(
		path: string,
		options: GetPresignedUrlOptions & {
			configOverride?: TigrisStorageConfig;
		}
	): Promise<GetPresignedUrlResponse> {
		const { configOverride, ...rest } = options;
		const res = (await getPresignedUrl(path, {
			...rest,
			config: this.mergeConfig(configOverride)
		})) as unknown as TigrisStorageResponse<GetPresignedUrlResponse, Error>;

		if (res.error) {
			throw res.error;
		}

		return res.data as GetPresignedUrlResponse;
	}

	/**
	 * Convenience helper to list *all* objects (auto‑paginates).
	 */
	static async listAllObjects(
		pageSize = 100,
		options?: Omit<ListOptions, 'limit' | 'paginationToken'> & {
			configOverride?: TigrisStorageConfig;
		}
	): Promise<ListResponseItem[]> {
		const items: ListResponseItem[] = [];
		let paginationToken: string | undefined;

		do {
			const page = await this.listObjects({
				...(options ?? {}),
				limit: pageSize,
				paginationToken,
				configOverride: options?.configOverride
			});

			if (page.items) {
				items.push(...page.items);
			}

			paginationToken = page.paginationToken ?? undefined;
		} while (paginationToken);

		return items;
	}
}
