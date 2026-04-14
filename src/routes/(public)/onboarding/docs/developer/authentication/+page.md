# Authentication

## Browser sessions

Most of the product assumes a **Better Auth** cookie session established after login or signup. Browser calls to `/api/drive/**` automatically send cookies on same-origin `fetch`.

## Developer API keys

For scripts and backends, you can use a **developer API key** instead of a cookie.

- Keys are created only after **developer mode** is enabled for your user (Profile → Developer in the UI).
- New secrets are shown once; stored keys are listed with a masked form: `znldv_<prefix>…<last4>`.
- Send the raw secret as either:
  - `Authorization: Bearer <secret>`, or
  - `X-API-Key: <secret>`

The drive layer resolves the key to your user via `tryResolveUserFromDeveloperApiKey` inside `requireApiSession`.

## Which routes accept keys?

**Drive and file APIs** use `requireApiSession`: valid **cookie session OR developer API key**.

**Developer admin APIs** (`/api/developer/**`) use `requireCookieApiSession` only — you must be logged in in a browser (or send the session cookie). Managing keys and toggling developer mode is intentionally **not** exposed to API-key-only clients.

## Enabling developer mode

`GET` and `POST /api/developer/mode` read and update the flag. Both require a cookie session. `POST` expects JSON `{ "enabled": boolean }`.

## Public and cron

- **`/api/public/**`\*\* — no authentication; guarded by link token validity.
- **`POST /api/cron/purge-trash`** — `Authorization: Bearer <CRON_SECRET>`, not a user session.

See the [REST API reference](./rest-api) for the full table.
