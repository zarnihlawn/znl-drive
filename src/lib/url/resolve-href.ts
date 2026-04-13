import { resolve } from '$app/paths';

/** Build href including app `paths.base` for dynamic paths (typed `resolve` rejects plain `string`). */
export const resolveHref: (path: string) => string = resolve as (path: string) => string;
