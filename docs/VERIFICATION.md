# Verification — updated October 20, 2026

## Current integration status

The optional enquiry form, D1 endpoint, migration, advanced worker, and revised legal pages are deployed at https://westline-dispatch.pages.dev. Both form request types were saved through the live browser UI and confirmed in the production D1 console.

Static inspection of the new feature confirms:

- The form requires name, email, and company; request type is sample or general enquiry, and the message is optional.
- Browser and server length limits agree. The API validates values, accepts bounded JSON, checks cross-site requests, and uses parameterized SQL.
- A success message requires HTTP `201`, `ok: true`, and a nonempty saved-record identifier. Failures retain input and offer email contact. Duplicate submits are blocked while a request is in flight.
- The schema stores only the stated contact/request fields, a generated identifier, and UTC creation time. The handler does not log submitted data or collect IP/user-agent fields in the application table.
- Database failures cannot return success, and no public read endpoint is provided. Hourly insertion caps are checked in the insert statement.
- Fields have associated labels, optional message help, a Privacy Policy link, a live success announcement, and an error alert. Without JavaScript, the disabled form points visitors to email.
- Privacy and Terms, effective October 20, describe both channels and do not promise automatic email notifications or sample delivery.

## Enquiry release results

- Frontend and backend TypeScript checks, production build, and built-output verification passed. Generated output includes the advanced worker and API-only routing. The artifact check covers 77 local links/assets and 20 encoded email drafts.
- All 11 tests using real SQLite passed: persistence, normalization, parameterized text, validation, method/origin/media checks, streamed size limits, unavailable database behavior, atomic per-email/global hourly caps, and static asset fallback.
- A local browser submission was persisted in SQLite and its confirmation reference matched the row.
- Live sample reference `3e867fa0` and enquiry reference `013ed700` matched D1 records with generated UUIDs, UTC times, request types, and synthetic messages. No email was sent.
- Before binding D1, the live form correctly displayed its error/email fallback and preserved input. Retrying after redeployment saved the request and cleared the fields.
- New form layout checked at 320, 390, 768, and 1440 pixels with no horizontal overflow. Mobile form focus styling was inspected visually. Earlier navigation/filter/FAQ tests below remain applicable; the new release does not change those controls.
- Public `/`, `/privacy/`, and `/terms/` return 200 and correct distinct titles/canonicals. Sitemap and robots use the assigned origin. Unknown pages return 404, and GET `/api/enquiries` returns 405 without exposing data.
- Production client JavaScript is approximately 83 kB gzip; the worker is approximately 1.9 kB gzip.

## Earlier static-site results — October 16, 2026

### Build and generated output

- Strict TypeScript and production Vite client/server builds pass.
- Home, Privacy, and Terms are prerendered as readable HTML; a static 404 is included.
- `npm run test:build` checks the built artifact: 76 local links/assets, 19 email drafts, 3 exact fictional job records, disclosure labels, page metadata, and indexing controls.
- Preview builds omit an unconfirmed canonical origin and remain noindex. Release builds require the actual public HTTPS origin.
- At that checkpoint, client JavaScript was approximately 81 kB gzip and one 48 kB Inter Latin variable font was served locally. The new form changes the bundle and adds D1 storage; remeasure the final build. No analytics, external font requests, or paid email API are introduced.

### Browser checks

- Chrome-based in-app browser: tested 320, 390, 768, and 1440 pixel viewports; no page-level horizontal overflow.
- Mobile navigation opens, closes with Escape, restores focus to its toggle, and closes after following a section link.
- Handover filters show 3 total jobs, 1 completed repair, and 2 pending repairs. Expanding the completed job reveals its invoice review status.
- Native FAQ disclosures respond to Enter. Visible focus styles and sticky navigation offsets are present.
- Privacy and Terms load directly with their own titles and headings.
- Email draft destinations, subjects, and body fields are decoded and checked without sending mail.
- No browser console warnings or errors observed during these checks.
- Reduced-motion handling is implemented in CSS; no looping animation is used. This check did not emulate an OS-level reduced-motion setting or run a screen reader.

### Copy and accessibility review

- All requested sections and all three supplied records are included.
- Fictional-data notices remain present when filtering the demonstration.
- Copper buttons use navy text (contrast approximately 5.25:1). Report labels were increased and low-contrast job labels darkened after review.
- No fabricated customers, locations, phone numbers, testimonials, statistics, certifications, service coverage, or pricing are displayed.

## Publication

- Live production origin: https://westline-dispatch.pages.dev.
- D1 `westline-enquiries` (`be765ed8-5596-47b9-8c61-d0b9f0ab9caf`) is bound as `DB`. Database creation, schema application, binding, and both live submission types were verified in Cloudflare.
- Source destination: `swaich-Techno/westline-landing-page`, branch `main`. Deployment uses manual Direct Upload; source pushes do not trigger publishing.
- Two clearly labelled synthetic verification records remain for the owner to distinguish from real requests. No notifications are generated; the owner must check D1 and follow up manually.

These are development checks, not a claim of formal accessibility certification. Cross-device browser and assistive-technology testing can be expanded as the site evolves.
