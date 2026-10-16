# Westline Dispatch

A static, email-first website for Westline Dispatch, serving US mobile commercial truck and trailer repair businesses. This repository is separate from Westline Office.

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
npm run preview -- --host 127.0.0.1
```

The build writes `dist/`. The homepage, `/privacy/`, and `/terms/` contain prerendered HTML, so the copy remains readable before JavaScript loads. React hydrates navigation and the sample handover interactions. The stack is React, TypeScript, Vite, Tailwind CSS, and Lucide; Inter is served locally.

## Configuration

Business settings live in `src/config/site.ts`.

| Setting | Current value or action |
| --- | --- |
| `name` | Westline Dispatch |
| `email` | `westline.dispatch365@gmail.com`, confirmed by the owner |
| `siteUrl` | Derived from `VITE_SITE_URL`; set only after the real public origin is assigned |
| `postalAddress` | Empty until an actual business address is confirmed |
| `operatingHours` | Empty until coverage hours are confirmed |
| `teamLocations` | Empty until actual staffing locations and roles are confirmed |
| `phone` | Empty until a real business number is supplied |
| `socialLinks` | Empty until actual business profiles are supplied |

Unconfirmed optional settings stay empty and are not displayed publicly. Do not insert invented contact details, coverage claims, testimonials, customer logos, prices, or performance figures.

For a release build, set `VITE_SITE_URL` to the exact HTTPS origin shown in the Cloudflare Pages dashboard and set `RELEASE=true`. Release validation rejects a missing or non-public origin. Local builds may omit the origin; they are previews, not publication-ready SEO output. See [deployment instructions](docs/DEPLOYMENT.md) before publishing.

## Content and behavior

- All sample/contact buttons use encoded `mailto:` links; they open an editable email draft and never claim a message was sent. The recipient remains visible in the contact section.
- The sample includes exactly three fictional jobs. It supports All jobs, Completed repairs, and Pending repairs filters, with expandable details. Both fictional-data labels remain visible.
- Service hours, responsibilities, approval requirements, and client information handling are established during onboarding. Repair and financial decisions remain with the client.
- There are no visitor accounts, payment flows, forms, databases, analytics scripts, or API credentials. Hosting providers may process technical request data under their own practices.
- Legal pages describe the current website and email enquiry flow. Revisit their text before changing data collection or service arrangements.

## Verification

Before release, run the type check and production build. Review the homepage and both legal routes at 320, 390, 768, and 1440 pixels, including zoom and reduced motion. Check keyboard focus, the mobile menu and Escape dismissal, FAQs, filters, expandable records, anchors, and email-link recipients and decoded drafts without sending email. Confirm that no page overflows horizontally.

Inspect built HTML with JavaScript disabled, unique titles and descriptions, canonical URLs, Open Graph tags, `sitemap.xml`, and `robots.txt`. Canonical and sitemap origins must match the actual deployment origin.

## Deployment status

The intended production host is Cloudflare Pages Free using its assigned `pages.dev` address. No production URL is claimed by this README. At implementation setup, the connected GitHub repository reported `push: false`; publishing source requires a writable GitHub credential or owner action. Deployment also requires an authenticated Cloudflare account and repository authorization. Update this status only after a deployment has been verified.

See [deployment instructions](docs/DEPLOYMENT.md) for the Git integration and direct-upload paths.
