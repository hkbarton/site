# hkbarton.com

Astro 7 + Keystatic on Cloudflare Workers. Read `README.md` first — it covers the
routes, the content model, and the standing constraints.

## Development

Start the dev server in background mode:

```
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status`, and `astro dev logs`.
Server-side errors from the workerd runtime only appear in `astro dev logs`.

To exercise the real Worker rather than the dev server, use `npm run preview`,
which builds and serves through Wrangler.

## Things that will bite you

- Every server route runs inside workerd, in dev too. Node APIs are only
  available because `nodejs_compat` is set in `wrangler.jsonc`.
- `astro.config.mjs` carries a CommonJS interop plugin for two packages in
  Keystatic's import graph that ship CommonJS only. Without it the Keystatic API
  route dies with `ReferenceError: exports is not defined`. The comment there
  explains when it can be removed.
- Keystatic must stay in GitHub mode. Local mode is unsupported outside Node.
- Keystatic's one-click GitHub App setup also does not work here, for the same
  reason: `handleGitHubAppCreation` is in its Node build only. Create the app by
  hand; `README.md` has the exact settings.
- Never rename a published page path. See `README.md`.
- `assets.run_worker_first` in `wrangler.jsonc` lists the Keystatic paths. Remove
  it and the admin 404s in a browser while `curl` still sees 200, because
  `not_found_handling: "404-page"` answers navigation requests from the asset
  worker without ever reaching the Worker. Test admin routes with
  `-H 'Sec-Fetch-Mode: navigate'`, not a plain curl.
