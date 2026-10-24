# Deploy and operate Westline Dispatch

The target is Cloudflare Pages with Workers Free and D1 Free allowances. Public pages are prerendered; the optional enquiry form uses a Pages worker and a D1 database. Email remains the primary contact channel. There is no paid email service, automated notification, or automatic sample delivery.

## Current status — October 20, 2026

The site is live at **https://westline-dispatch.pages.dev**. Pages project: `westline-dispatch`, production branch: `main`, deployment method: Direct Upload. D1 database: `westline-enquiries`, ID: `be765ed8-5596-47b9-8c61-d0b9f0ab9caf`, binding: `DB`. The migration and indexes were applied, then the site was redeployed with the binding. Both request types were saved through the public form and confirmed in D1. No paid plan was selected.

For subsequent releases, build with `VITE_SITE_URL=https://westline-dispatch.pages.dev` and `RELEASE=true`, then upload the contents of `dist` through **Workers & Pages → westline-dispatch → Create deployment → Production**. GitHub pushes do not deploy automatically. Only upload built assets, never the source checkout or local database.

Two synthetic launch-verification records remain in the database, both named `Westline deployment test` at `qa@example.com`, company `Fictional verification record`. They require no response. Their reference prefixes are `3e867fa0` (sample) and `013ed700` (enquiry).

## Account and database setup

1. Use the owner's Cloudflare account and Free plan. The production database and binding already exist as listed above; the steps below apply when recreating the environment. Preserve the separate Westline Office repository.
2. Create a D1 database in that account. Record its actual name and identifier from the dashboard; none is preassigned in the source.
3. Apply the complete `migrations/0001_enquiries.sql` file to the chosen database. The D1 console can execute its statements. With an authenticated Wrangler CLI, use `npx wrangler d1 execute DATABASE_NAME --remote --file=migrations/0001_enquiries.sql`, replacing `DATABASE_NAME` with the actual created name.
4. In the Pages project's **Settings → Bindings**, add a D1 database binding named exactly `DB` and select that database. Redeploy after adding or changing the binding. Configure production and preview bindings separately; use a separate preview database for test enquiries. See [Cloudflare's D1 binding instructions](https://developers.cloudflare.com/pages/functions/bindings/#d1-databases).
5. Confirm the `enquiries` table and its two indexes exist before enabling live submissions. The migration is idempotent for this initial schema; future schema changes require a new migration.

The table contains `id`, `created_at` (UTC), `name`, `email`, `company`, `request_type`, and `message`. It has no IP-address or user-agent column. Database credentials are not browser configuration and must not be added to `VITE_` variables.

## Build and publish

Use Node.js 22.12 or a newer supported LTS. Run the typecheck, endpoint tests, production build, and `npm run test:build` before deploying. The build root is the repository root, the command is `npm run build`, and the output directory is `dist`.

The output must include the prerendered pages, three sample PDFs, assets, `dist/_worker.js`, and `dist/_routes.json`. The compiled worker implements `/api/enquiries` and the private admin viewer; the routes file invokes it for `/api/*` and `/admin/*`, leaving ordinary pages and assets static. Cloudflare's advanced mode uses the compiled worker rather than separately compiling the source `functions/` directory. See [advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/).

Set `VITE_SITE_URL` to the actual assigned production HTTPS origin and `RELEASE=true` for the release build. If a first upload is needed to obtain the project address, treat it as a bootstrap preview, then rebuild with the confirmed origin. Preview builds without an origin are noindex and omit an invented canonical address. Never substitute a guessed domain or ephemeral deployment URL for the production origin.

### Git integration

1. Push the reviewed enquiry integration and lockfile to the repository's intended production branch.
2. Create or select a Pages project connected to that repository. Set the build command, output directory, Node version, and production environment variables as described above.
3. Complete the migration and `DB` binding, then trigger a fresh deployment.
4. Verify the actual deployment before marking it launched. Git integration supports automatic deployments and branch previews; configure preview origin/indexing and a separate database deliberately. See [Cloudflare's Git integration guide](https://developers.cloudflare.com/pages/configuration/git-integration/).

### Direct upload

1. Create or select the intended direct-upload Pages project in the authenticated account and record its actual origin.
2. Build locally with the actual origin and release flag. Confirm that `_worker.js` and `_routes.json` are present at the top level of `dist`.
3. Upload the complete `dist` directory through the Pages dashboard, or deploy it with an authenticated Wrangler CLI. Do not upload the source tree, `node_modules`, or environment files.
4. Apply the migration, bind `DB`, and redeploy so the worker receives the binding.
5. Verify the final deployment and record its project name, origin, source commit, and date.

Dashboard upload does not compile a source `functions/` folder, which is why this build includes `_worker.js`. Cloudflare supports that precompiled worker for direct upload. A direct-upload project cannot later switch to Git integration; create a new project for that change. See the [direct-upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/).

## Review and follow up on requests

There is no automatic inbox notification. The operator can review stored requests through the authenticated Cloudflare account and reply manually from the business email account. The new private viewer at `/admin/` is available only after completing all steps below; until then it returns a generic unavailable response without exposing records.

### Enable the private enquiry viewer

1. In Cloudflare Zero Trust, create an Access application for the exact production hostname and `/admin/*` path. Restrict its **Allow** policy to the one verified operator email. Confirm that Cloudflare offers this path-scoped protection on the current Pages hostname before making any release claim. Use the Free plan only.
2. Copy the actual Access team domain and application audience (AUD) tag from that application. Configure Pages **server-side** production environment variables `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, and `ADMIN_EMAIL`. The team domain must be the exact `name.cloudflareaccess.com` hostname, not a URL; the audience tag is the 64-character application tag. Set `ADMIN_EMAIL` to the operator's authorized sign-in email. Never prefix these variables with `VITE_`.
3. Confirm that `DB` remains bound to `westline-enquiries`. Deploy a build whose `_routes.json` includes `/admin` and `/admin/*`; the worker must run on every private path. The worker verifies the Access JWT signature, audience, issuer, expiry and exact operator email before reading D1. A missing or invalid configuration fails closed.
4. Test `/admin/` in a private browser while signed out (no records), then sign in with the authorized account and confirm the read-only enquiry list. Test a different email and invalid/expired assertion; neither may see data. The viewer has no reply, edit or delete action. Use the D1 console for verified correction and deletion requests.
5. Review the viewer routinely. It is a manual inbox and does not generate an email alert or guarantee a response time. If Access setup is unavailable, continue reviewing D1 through the Cloudflare account; do not publish an unprotected list endpoint.

Open the bound D1 database's console and run:

```sql
SELECT id, created_at, name, email, company, request_type, message
FROM enquiries
ORDER BY created_at DESC
LIMIT 100;
```

`sample` means a sample handover was requested; `enquiry` means the visitor wants to discuss operations support. Times are UTC. The success screen shows the first eight characters of the record's identifier as a reference. Use the full identifier when managing a specific record. There is no public endpoint for reading or deleting records. The console supports SQL queries; see [Cloudflare's SQL guide](https://developers.cloudflare.com/d1/sql-api/sql-statements/).

Keep enquiry details in the owner's authorized systems. For an access, correction, or deletion request, verify the relevant record and requester, then manage only that record through the Cloudflare account. No automatic retention cleanup is configured. Review retained enquiries according to the Privacy Policy and the business's actual needs; do not invent a fixed deletion period.

The API limits accepted submissions to five per normalized email address and 100 in total during the preceding hour. It returns `429` when a cap is reached. Missing bindings, schema errors, or storage failures return `503`; the UI preserves the visitor's fields and offers email as the fallback. These limits are basic request controls, not a guarantee against abuse.

Stay on the Free plan and monitor Workers and D1 usage in Cloudflare. D1 Free queries stop when account allowances are exhausted; do not enable a paid upgrade without a separate decision. See [D1 pricing and limits](https://developers.cloudflare.com/d1/platform/pricing/).

## Live verification and recovery

- Open and refresh `/`, `/privacy/`, and `/terms/`; verify readable HTML before JavaScript and an actual 404 for unknown pages.
- Check navigation, keyboard focus, mobile-menu dismissal, FAQs, filters, expanded records, and 320/390/768/1440-pixel layouts.
- Decode all email drafts without sending messages. Every recipient must be `westline.dispatch365@gmail.com`.
- Submit one clearly marked test enquiry for each request type. Confirm a `201` response, matching D1 records, UTC timestamps, and saved-request text. Remove only those identified test records after verification.
- Test invalid input and unavailable storage in preview. Confirm no success appears on failure, fields remain available, and email fallback works. Verify that GET requests do not expose stored records.
- Confirm the fictional-data notices, approval boundaries, and Privacy Policy accurately describe the deployed functionality.
- Verify titles, descriptions, canonical URLs, Open Graph image URLs, sitemap, and robots.txt against the real production origin.

Retain the source commit for every verified deployment. If an application update fails, restore the last verified deployment and repair the source. Rolling back a Pages deployment does not roll back the D1 database. Preserve enquiry records when changing code or schema. If the public origin changes, update `VITE_SITE_URL`, rebuild, and recheck metadata and sitemap URLs.
