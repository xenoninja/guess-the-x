# Guess The X

Guess The X is a family of daily deduction games where players identify a hidden subject from structured clues. The first game is **Guess The Football Player**, a fully client-side football Daily Puzzle at `/football`.

The app loads a versioned football Parquet data asset in the browser with DuckDB-Wasm, selects a deterministic answer for the UTC Puzzle Date, and stores Puzzle Progress locally. The v1 build is intentionally static: no backend, accounts, analytics, share flow, PWA/offline support, or anti-cheat service.

## Tech Stack

- Vite
- TypeScript
- Vitest
- DuckDB-Wasm
- Cloudflare Pages static hosting

## Local Development

Install dependencies:

```sh
npm install
```

Start the Vite dev server:

```sh
npm run dev
```

Open the local URL printed by Vite, then visit:

- `/` for the Guess The X home page
- `/football` for Guess The Football Player
- `/football?reset=1` to clear today's local Puzzle Progress for development

## Verification

Run the test suite:

```sh
npm run test
```

Build the production artifact:

```sh
npm run build
```

The production output is written to `dist/`.

To preview the built site locally:

```sh
npm exec vite -- preview
```

## Cloudflare Pages Deployment

Deploy this project as a Cloudflare Pages static site.

Recommended Git integration settings:

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root

The checked-in `public/_redirects` file contains:

```txt
/* /index.html 200
```

Cloudflare Pages copies this into the build output, allowing direct navigation to client-side routes such as `/football` and `/football/`.

Manual deployment with Wrangler is also possible after building:

```sh
npm run build
npx wrangler pages deploy dist --project-name <cloudflare-pages-project-name>
```

Use the Cloudflare dashboard to connect the GitHub repository for automatic production deployments from `master` and preview deployments from pull requests.

