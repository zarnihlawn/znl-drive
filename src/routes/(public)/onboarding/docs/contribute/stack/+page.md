# Stack

| Layer            | Technology                                     |
| ---------------- | ---------------------------------------------- |
| Framework        | **SvelteKit 2** on **Vite**                    |
| UI               | **Svelte 5** (runes)                           |
| Components / CSS | **DaisyUI 5** on **Tailwind CSS 4**            |
| i18n             | **Paraglide** (`@inlang/paraglide-js`)         |
| Auth             | **Better Auth**                                |
| Database         | **Drizzle ORM** (Postgres; e.g. **Neon**)      |
| Docs body        | **mdsvex** + **Tailwind Typography** (`prose`) |

The drive feature set combines server routes under `src/routes/api`, server-only helpers in `src/lib/server`, and client utilities in `src/lib/client`.
