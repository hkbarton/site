# hkbarton.com

Personal site: a landing page, occasional blog posts, and standalone pages such as
app privacy policies. Astro 7, edited with Keystatic, served from Cloudflare Workers.

## Routes

| Path | What |
|---|---|
| `/` | Landing page: intro, project links, recent posts |
| `/blog` | Post index, newest first |
| `/blog/<slug>` | A post |
| `/keyline/privacy` | Keyline privacy policy, bare layout |
| `/howcomet/privacy` | Howcomet privacy policy, bare layout |
| `/rss.xml` | Feed |
| `/keystatic` | CMS admin, the only server-rendered route |

Every route except `/keystatic` and `/api/keystatic/*` is prerendered at build time.
URLs never carry a trailing slash; Cloudflare redirects the slashed form.

## Content

Posts are `.md` files in `src/content/posts/`. Pages are `.md` files in
`src/content/pages/<app>/<page>.md`, which is what puts the privacy policies at
`/<app>/privacy`. Frontmatter schemas live in `src/content.config.ts`.

`bare: true` on a page renders the document with no site nav and no footer. That
is the mode the app privacy policies use.

`draft: true` on a post hides it from the index, the feed, and the build. Drafts
are still visible in `npm run dev`.

Images referenced from markdown go through `astro:assets`, so they are optimized
at build time. Keep them under `src/assets/images/`, never in `public/`.

## Writing

Primary workflow is iA Writer against `src/content/posts/`, then commit and push.
Add that folder as a Library location in iA Writer.

Keystatic at `/keystatic` is the fallback, for image uploads and for editing away
from the laptop. It commits to this repo through a GitHub App, which triggers a
Workers build.

Keystatic runs in GitHub mode, not local mode. Its API route refuses
`storage: { kind: 'local' }` outside Node, and the Cloudflare adapter runs every
server route inside workerd, in `astro dev` as well as in production.

## Commands

| Command | What |
|---|---|
| `npm run dev` | Dev server on 127.0.0.1:4321 |
| `npm run build` | Build to `dist/` |
| `npm run preview` | Build, then serve the real Worker locally via Wrangler |
| `npm run deploy` | Build and deploy to Cloudflare |
| `npm run check` | Type check |

Wrangler is a project dependency, not a global install. The npm scripts above
resolve it from `node_modules` on their own. Running it directly from the
terminal needs `npx`, as in `npx wrangler whoami`.

## Environment

Keystatic's GitHub App produces four values. Copy `.env.example` to `.env` for
local dev. Never commit the real values.

In production they do **not** all go to the same place:

| Value | When it is read | Where it goes in production |
|---|---|---|
| `KEYSTATIC_GITHUB_CLIENT_ID` | runtime | `wrangler secret put` |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | runtime | `wrangler secret put` |
| `KEYSTATIC_SECRET` | runtime | `wrangler secret put` |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | build time | build environment variable |

```
npx wrangler secret put KEYSTATIC_GITHUB_CLIENT_ID
npx wrangler secret put KEYSTATIC_GITHUB_CLIENT_SECRET
npx wrangler secret put KEYSTATIC_SECRET
```

The first three are read through `getSecret()` from `astro:env/server`, which the
Cloudflare adapter resolves against the Worker's env at request time. The app
slug is read through `import.meta.env` in the admin UI, so it is inlined into the
client bundle when `astro build` runs. A Worker secret never reaches it — set it
in the Workers Build settings, or in `.env` if you deploy from the laptop.

## Domain and DNS

The apex is `hkbarton.com`, registered at Squarespace. Workers custom domains
require the zone to live on Cloudflare, so the nameservers have to move; there is
no way to attach a Worker while DNS stays elsewhere.

The Worker is named `site`, after the repository, because that is what
Cloudflare's git-push build created. `wrangler.jsonc` matches it, so a local
`npm run deploy` updates the same Worker the build does rather than making a
second one. It also answers on `https://site.hkbarton-blog.workers.dev`, which is
useful for checking a deploy before DNS points at it.

**On Cloudflare.** The dashboard section is **Domains**, not "Websites" — it was
renamed. Go to Domains, **Onboard a domain**, enter `hkbarton.com`, take the Free
plan. Cloudflare scans the existing records and shows you two assigned
nameservers. Check the scan kept the `v=spf1 -all` TXT record on the apex. There
are no MX records, so there is no mail to preserve.

**On Squarespace.** Open the domain, then DNS, then Domain Nameservers, then
**Use Custom Nameservers**. It asks for your password or 2FA. It then prompts to
disable DNSSEC — accept. `hkbarton.com` currently has DNSSEC on with a DS record
published at the registry, and leaving it on while the nameservers move makes the
domain fail to resolve for any validating resolver. Enter the two Cloudflare
nameservers and save. Propagation can take up to 48 hours.

If the domain ever returns SERVFAIL from Google DNS (`dig @8.8.8.8 hkbarton.com`)
while it still answers with `+cd`, the cause is a stale DNSSEC DS record left at
the registry by the old provider. The parent says the zone is signed, Cloudflare
does not sign it, so validating resolvers refuse the answer. Fix it by turning
DNSSEC off at Squarespace, which withdraws the DS.

**Back on Cloudflare,** once the zone reads Active: Workers & Pages, the
`hkbarton` Worker, Settings, Domains & Routes, Add, Custom Domain. Add
`hkbarton.com` and `www.hkbarton.com`. Cloudflare writes the DNS records itself,
so do not add A or CNAME records by hand. Re-enable DNSSEC from Cloudflare
afterwards if you want it.

## Connecting Keystatic to GitHub

Create the GitHub App **by hand**. Keystatic's one-click "Create GitHub App"
button on `/keystatic/setup` cannot work in this project: the handler behind it,
`handleGitHubAppCreation`, ships only in Keystatic's Node build, and the
Cloudflare adapter runs every server route inside workerd, in `astro dev` as well
as in production. The button returns 500 rather than doing anything.

Nothing is lost by doing it manually. The settings below are exactly the manifest
Keystatic would have submitted.

**1. Create the app** at <https://github.com/settings/apps/new>.

| Field | Value |
|---|---|
| GitHub App name | `hkbarton Keystatic` (any name; note the slug it generates) |
| Homepage URL | `https://hkbarton.com/keystatic` |
| Callback URL | `https://hkbarton.com/api/keystatic/github/oauth/callback` |
| Add a second callback URL | `http://127.0.0.1:4321/api/keystatic/github/oauth/callback` |
| Request user authorization (OAuth) during installation | tick it |
| Webhook → Active | untick it |
| Where can this app be installed | Only on this account |

Repository permissions: **Contents** read and write, **Metadata** read-only,
**Pull requests** read-only. Leave everything else alone.

**2. Collect four values.** On the app page, note the **Client ID**, then press
*Generate a new client secret* and copy it. The **slug** is the last path segment
of the app's public URL, `https://github.com/apps/<slug>`. Generate the fourth
yourself:

```
openssl rand -hex 32
```

**3. Install the app** on `hkbarton/site` via *Install App* in the sidebar.

**4. Set them.** Three are runtime secrets on the Worker:

```
npx wrangler secret put KEYSTATIC_GITHUB_CLIENT_ID
npx wrangler secret put KEYSTATIC_GITHUB_CLIENT_SECRET
npx wrangler secret put KEYSTATIC_SECRET
```

`PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` is a **build** variable, not a secret. Add it
under the Worker's Settings → Build → Variables, then trigger a build so it gets
inlined into the admin bundle. See the Environment table above for why.

Put all four in `.env` as well, for local dev.

Until all three secrets exist, every `/api/keystatic/*` route returns 500 by
design. Keystatic throws on purpose when the config is incomplete in production.

## Standing constraints

- Never rename a published page path, especially the privacy policy URLs. They
  are registered in App Store Connect. Add a Cloudflare redirect rule instead.
- `compatibility_date` in `wrangler.jsonc` is pinned. Bumping it changes runtime
  behaviour, so it gets its own commit and its own deploy.
- No analytics, no third-party scripts, no consent banner.
