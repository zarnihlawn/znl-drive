# Storage providers

ZNL-DRIVE can target more than one storage backend. The list is defined in code as `STORAGE_PROVIDERS` and kept in sync with the database master table.

## Available targets

| Id       | Label  |
| -------- | ------ |
| `local`  | Local  |
| `tigris` | Tigris |

## Switching targets

Use the **storage provider** dropdown in the top bar. The choice is persisted in the client and applied to **new** uploads and folder creation. Existing rows already stored under another provider stay where they are until you move them through product-specific flows (if any).

## API usage

Drive APIs take a `storageProvider` query parameter or body field where relevant; invalid values return **400**.
