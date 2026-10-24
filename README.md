# Westline Dispatch

An email-first website for Westline Dispatch, serving US mobile commercial truck and trailer repair businesses. It combines prerendered public pages with an optional Cloudflare D1-backed enquiry form. This repository is separate from Westline Office.

## Local development

Use Node.js 22.12 or newer supported LTS and npm.

```sh
npm install
npm run dev
```

To check and preview the production output:

```sh
npm run typecheck
npm run build
npm run test:api
npm run test:build
npm run preview:api
```

The build writes `dist/`. The homepage, `/privacy/`, and `/terms/` contain prerendered HTML, so the copy remains readable before JavaScript loads. React hydrates navigation, the sample documents, and the enquiry form. The stack is React, TypeScript, Vite, Tailwind CSS, and Lucide; Inter is served locally.

The production package also includes `dist/_worker.js` and `dist/_routes.json` for the enquiry API. `npm run preview:api` serves the build on port 4175 and uses the same handler with a persistent local SQLite database in ignored `test-results/`. Use synthetic data only. To check failure handling, run `npm run preview:api -- --port 4176 --database-unavailable`. Vite's `dev` and `preview` servers only show the frontend; they do not run the API. Production uses Cloudflare D1 through the `DB` binding.

## Configuration

Business settings live in `src/config/site.ts`.

| Setting          | Current value or action                                                         |
| ---------------- | ------------------------------------------------------------------------------- |
| `name`           | Westline Dispatch                                                               |
| `email`          | `westline.dispatch365@gmail.com`, confirmed by the owner                        |
| `siteUrl`        | Derived from `VITE_SITE_URL`; set only after the real public origin is assigned |
| `postalAddress`  | Empty until an actual business address is confirmed                             |
| `operatingHours` | Empty until coverage hours are confirmed                                        |
| `teamLocations`  | Empty until actual staffing locations and roles are confirmed                   |
| `phone`          | Empty until a real business number is supplied                                  |
| `socialLinks`    | Empty until actual business profiles are supplied                               |

Unconfirmed optional settings stay empty and are not displayed publicly. Do not insert invented contact details, coverage claims, testimonials, customer logos, prices, or performance figures.

For a release build, set `VITE_SITE_URL` to the exact HTTPS origin shown in the Cloudflare Pages dashboard and set `RELEASE=true`. Release validation rejects a missing or non-public origin. Local builds may omit the origin; they are previews, not publication-ready SEO output. See [deployment instructions](docs/DEPLOYMENT.md) before publishing.

The enquiry API requires a Cloudflare D1 binding named `DB` and the schema in `migrations/0001_enquiries.sql`. The actual database and Pages project must be created in the owner's Cloudflare account; no production database ID or site origin is invented in this repository.

## Content and behavior

- Primary sample/contact links use encoded `mailto:` URLs; they open an editable email draft and never claim a message was sent. The recipient remains visible in the contact section.
- The optional enquiry form accepts a name, email address, company, request type (`sample` or `enquiry`), and optional message. Successful submissions are stored with a server-generated identifier and UTC creation time.
- A form confirmation means the record was saved. There is no automated email notification. Once configured, a Cloudflare Access protected, read-only `/admin/` viewer lets the operator review new D1 enquiries and follow up manually. It fails closed when Access settings are absent. See [deployment instructions](docs/DEPLOYMENT.md).
- The API exposes `POST /api/enquiries`, uses parameterized SQL, validates input, and applies hourly submission caps. It has no public list, read, update, or delete endpoint. The application table contains no IP address or browser user-agent. Hosting may process separate technical request logs.
- The sample library includes a fictional three-job handover plus a service report and invoice draft for one job. Each has a downloadable PDF. The draft omits unknown rates, parts prices, taxes and totals rather than inventing them.
- Service hours, responsibilities, approval requirements, and client information handling are established during onboarding. Repair and financial decisions remain with the client.
- There are no visitor accounts, payment flows, advertising trackers, or analytics scripts. Cloudflare credentials belong in the owner's account or CLI authentication, never in client code.
- Legal pages describe both the email and stored-form enquiry flows. Revisit their text before changing data collection or service arrangements.

## Verification

Before release, run the type check, endpoint tests, production build, and `npm run test:build`. Review the homepage and both legal routes at 320, 390, 768, and 1440 pixels, including zoom and reduced motion. Check keyboard focus, the mobile menu and Escape dismissal, FAQs, filters, expandable records, anchors, and decoded email drafts without sending email. Verify both form request types, real database persistence, and honest failure behavior. Confirm that no page overflows horizontally.

Inspect built HTML with JavaScript disabled, unique titles and descriptions, canonical URLs, Open Graph tags, `sitemap.xml`, and `robots.txt`. Canonical and sitemap origins must match the actual deployment origin.

Recorded results and remaining checks are in [VERIFICATION.md](docs/VERIFICATION.md).

## Deployment status

Live as of October 20, 2026: **https://westline-dispatch.pages.dev**. Source is maintained on `main` in `swaich-Techno/westline-landing-page`. Cloudflare Pages uses Direct Upload, with the `westline-enquiries` D1 database bound as `DB`. Both sample requests and general enquiries were submitted through the live form and verified in D1.

This project uses Free allowances. Deployments are manual; pushing GitHub alone does not update the live site. Form submissions do not send email notifications. Review enquiries in the Cloudflare dashboard and follow up manually. See [deployment and operating instructions](docs/DEPLOYMENT.md).
