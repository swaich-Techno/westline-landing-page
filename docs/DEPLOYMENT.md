# Deploy Westline Dispatch

The target is Cloudflare Pages Free with the real `pages.dev` origin assigned to the project. This site builds to static files and requires no paid API, database, email service, or Pages Functions.

## Required access and values

- A Cloudflare account with access to create a Pages project.
- For Git integration, access to authorize Cloudflare for `swaich-Techno/westline-landing-page` and a way to publish this source to that repository. The connector reported `push: false` during implementation setup; it cannot publish commits with that access.
- The actual production HTTPS origin from the new Pages project, for `VITE_SITE_URL`. Do not guess a domain or copy a preview URL into the production configuration.

The contact email is already configured as `westline.dispatch365@gmail.com`. Postal address, operating hours, team locations, phone, and social profiles are optional and remain omitted until confirmed by the business owner.

## Recommended: Git integration

1. Publish this repository's source and lockfile to `swaich-Techno/westline-landing-page` using an authorized GitHub account. Preserve the separate Westline Office repository.
2. In Cloudflare's Workers & Pages area, create a Pages application and connect that exact GitHub repository. Authorize only the repository access needed for this project.
3. Select the intended production branch containing the reviewed source. Use the repository root as the build root, `npm run build` as the build command, and `dist` as the output directory. Use Node.js 22.12 or a newer supported LTS.
4. Obtain the assigned production origin from the project dashboard. If project creation requires an initial deployment, treat that build as a bootstrap preview; it has no confirmed production SEO origin yet.
5. Set the production build environment variables `VITE_SITE_URL` to that exact HTTPS origin and `RELEASE` to `true`. Rebuild and deploy the current source. The release gate prevents a build without a public HTTPS origin.
6. Complete the verification below on the deployed URL before treating it as launched.

Cloudflare's Git integration deploys repository changes and supports branch previews. Set preview builds to the intended canonical production origin, rather than treating an ephemeral preview hostname as the canonical site. Configure preview access/indexing according to the project's sharing needs. See [Cloudflare's Git integration guide](https://developers.cloudflare.com/pages/configuration/git-integration/).

## Alternative: direct upload

Use direct upload when Git publishing is unavailable and the owner wants to manage builds locally. Cloudflare documents that a direct-upload project cannot later switch to Git integration; that change requires a new project. See the [direct-upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/).

1. Sign in to Cloudflare and create a Pages direct-upload project, then obtain its assigned production origin. If an initial upload is required to establish the project, replace it with the release build below before launch.
2. Install dependencies locally with `npm install`, then run `npm run typecheck`.
3. Set `VITE_SITE_URL` to the actual assigned HTTPS origin and `RELEASE=true` in the shell environment. Run `npm run build`. Do not substitute an invented project address.
4. Upload the complete `dist` folder using the Pages dashboard. Alternatively, use an authenticated Wrangler CLI to deploy `dist` to the exact project just created. Do not upload the source tree, `node_modules`, or environment files.
5. Verify the production URL and record the project name, origin, source commit, and deployed build date for future updates.

## Release verification

- Open `/`, `/privacy/`, and `/terms/` directly. Refresh both legal routes to confirm that they are served independently.
- Read the built HTML or disable JavaScript and confirm substantive copy is present. Re-enable JavaScript and verify navigation, FAQs, all handover filters, and expanded records.
- Check layouts at 320, 390, 768, and 1440 pixels, keyboard-only navigation, visible focus, mobile-menu dismissal, zoom, and reduced motion.
- Verify every navigation anchor and legal link. Inspect the decoded `mailto:` recipient, subject, and body without sending messages; they must use `westline.dispatch365@gmail.com`.
- Confirm both fictional-data labels remain visible, no unverified claims or empty placeholders appear, and client approval boundaries remain clear.
- Inspect page-specific titles, descriptions, canonical URLs, and Open Graph image URLs. Check `sitemap.xml` and `robots.txt`; all production URLs must use the exact assigned origin.
- Keep analytics, paid upgrades, and new data-collection features disabled unless separately requested. Reassess the Privacy Policy before introducing any collection feature.

## Updates and recovery

Retain the source commit corresponding to each verified deployment. For Git integration, publish the reviewed change through the repository and inspect the resulting deployment. For direct upload, rebuild from the retained source with the same production origin before uploading. If an update fails validation, use Cloudflare's deployment history to restore the last verified version, then correct and rebuild the source.

Change `VITE_SITE_URL` and rebuild if the public origin changes. Keep production metadata, sitemap URLs, and documented deployment status aligned with the actual site. A successful local build alone does not establish that the website has been published.
