# Errors

## 401 Unauthorized

Returned when:

- A route expects a logged-in user or valid API key and neither is present.
- **`POST /api/cron/purge-trash`** when the `Authorization: Bearer` header does not match `CRON_SECRET`.

For drive APIs, `requireApiSession` throws **401** if there is no valid cookie session **and** no resolvable developer API key.

## 403 Forbidden

Returned when:

- **`POST /api/developer/api-keys`** or **`DELETE /api/developer/api-keys/[id]`** when developer mode is off (`Enable developer mode first`).
- Business rules reject the operation while the user is recognized (less common than 401 for this codebase).

## 503 Service Unavailable

`requireApiSession` and `requireCookieApiSession` wrap session lookup in a try/catch. If the auth service or database errors unexpectedly, the handler logs and returns **503** with a generic message so clients can retry.

**`POST /api/cron/purge-trash`** returns **503** if `CRON_SECRET` is not configured on the server.

## 400 Bad Request

Validation failures: malformed JSON, missing ids, invalid UUIDs, invalid `storageProvider`, etc. Read the response body text for a short message.

## 404 Not Found

Missing files, folders, or API keys when the id does not exist or is not owned by the current user.
