# Public links

Public links let anyone with the URL preview or download a **file** or **folder** you own, without signing in.

## Creating a link

From the file actions in **Home**, enable a public link for the item. The server issues a short random **token** and stores it with your user id and optional expiry.

## URLs you will see

- **Share page (human-friendly):** `https://your-host/<token>` — the anonymous preview page loads metadata from `GET /api/public/share/<token>`.
- **Direct file/stream:** `https://your-host/api/public/files/<token>` — returns file bytes or a folder ZIP as implemented by the API.

For **images**, the app may also surface a direct image URL when the MIME type allows inline display.

## Revoking

You can revoke a public link from the same flow you used to create it. Revoked links stop working immediately for new requests.

## Static docs route

The documentation site lives under **`/onboarding/docs`**. It does **not** collide with public share URLs: share pages use `/<token>` at the site root, while docs use the fixed `/onboarding/docs` path prefix.
