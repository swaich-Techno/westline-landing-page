import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const dist = resolve(root, 'dist');
const routes = ['/', '/privacy/', '/terms/'];
const documents = new Map(await Promise.all(routes.map(async (route) => [
  route, await readFile(resolve(dist, `.${route}index.html`), 'utf8'),
])));

function decode(value) {
  return value.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, (entity) => {
    const named = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
    if (named[entity]) return named[entity];
    return String.fromCodePoint(entity.startsWith('&#x')
      ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10));
  });
}
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)]));
}
function text(html) {
  return decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}
function canonical(html) {
  const tag = [...html.matchAll(/<link\b[^>]*>/g)].find(([tag]) => attributes(tag).rel === 'canonical');
  return tag ? attributes(tag[0]).href : '';
}
function meta(html, key) {
  const tag = [...html.matchAll(/<meta\b[^>]*>/g)].find(([tag]) => {
    const attr = attributes(tag);
    return attr.name === key || attr.property === key;
  });
  return tag ? attributes(tag[0]).content : '';
}

const home = documents.get('/');
const origin = canonical(home) ? new URL(canonical(home)).origin : '';
const titles = new Set();
const descriptions = new Set();
const emailSubjects = new Set();
let checkedEmails = 0;
let checkedLinks = 0;

for (const [route, html] of documents) {
  assert.match(html, /<html lang="en-US">/, `${route}: document language`);
  assert.match(html, /<main\b/, `${route}: content must be prerendered`);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${route}: one main heading`);
  assert.ok(text(html).length > 2500, `${route}: substantive HTML before JavaScript`);
  assert.ok(!html.includes('<!--app-html-->'), `${route}: no unresolved render marker`);
  assert.ok(!/<form\b/.test(html), `${route}: email-only contact flow`);
  const title = text(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const description = meta(html, 'description');
  assert.ok(title && description, `${route}: metadata present`);
  titles.add(title);
  descriptions.add(description);
  assert.equal(meta(html, 'og:title'), title, `${route}: matching Open Graph title`);
  assert.equal(meta(html, 'og:description'), description, `${route}: matching Open Graph description`);
  assert.equal(meta(html, 'robots'), origin ? 'index, follow' : 'noindex, follow', `${route}: indexing policy`);
  assert.equal(canonical(html), origin ? origin + route : '', `${route}: canonical URL`);
  assert.equal(meta(html, 'og:url'), origin ? origin + route : '', `${route}: Open Graph URL`);

  const ids = [...html.matchAll(/\bid="([^"]*)"/g)].map(([, id]) => id);
  assert.equal(new Set(ids).size, ids.length, `${route}: no duplicated element IDs`);

  for (const [tag] of html.matchAll(/<(?:a|link|script)\b[^>]*>/g)) {
    const attr = attributes(tag);
    const href = attr.href ?? attr.src;
    if (!href) continue;
    if (href.startsWith('mailto:')) {
      const email = new URL(href);
      assert.equal(email.pathname, 'westline.dispatch365@gmail.com', 'Every email uses the confirmed recipient');
      const subject = email.searchParams.get('subject');
      const body = email.searchParams.get('body') ?? '';
      assert.ok(subject?.startsWith('Westline Dispatch'), 'Editable draft has a useful subject');
      for (const field of ['Company name:', 'Service area:', 'Support needed:', 'Desired coverage hours and time zone:']) {
        assert.ok(body.includes(field), `Draft contains ${field}`);
      }
      assert.ok(body.includes('\r\n'), 'Draft retains encoded line breaks');
      emailSubjects.add(subject);
      checkedEmails += 1;
      continue;
    }
    if (/^https:/.test(href)) continue;
    assert.ok(!/^[a-z]+:/i.test(href), `${route}: unsupported link scheme ${href}`);
    const url = new URL(href, `https://contract.invalid${route}`);
    if (documents.has(url.pathname)) {
      if (url.hash) assert.ok(documents.get(url.pathname).includes(`id="${url.hash.slice(1)}"`), `${route}: anchor ${href} exists`);
    } else {
      await access(resolve(dist, `.${url.pathname}`));
    }
    checkedLinks += 1;
  }
}

assert.equal(titles.size, routes.length, 'Each page has a unique title');
assert.equal(descriptions.size, routes.length, 'Each page has a unique description');
assert.equal(emailSubjects.size, 3, 'Sample, proposal, and contact drafts are distinct');
assert.ok(checkedEmails >= 10, 'Contact CTAs are present throughout the site');
assert.match(text(home), /Your Repair Team Handles the Road\. We Handle the Back Office\./);
assert.equal((home.match(/class="job-detail"/g) ?? []).length, 3, 'Exactly three expandable fictional jobs');
for (const value of ['Unit 2184', 'Trailer air leak', 'Awaiting client review', 'Unit 405', 'Brake chamber replacement', 'Contact repair manager', 'Unit 7201', 'Electrical system issue', 'Confirm ETA']) {
  assert.ok(text(home).includes(value), `Required supplied sample detail: ${value}`);
}
assert.equal((home.match(/DEMONSTRATION DATA/g) ?? []).length, 2, 'Hero and interactive report label the data');
assert.equal((home.match(/Illustrative example — not a real customer record\./g) ?? []).length, 2, 'Both examples explain their fictional status');

const robots = await readFile(resolve(dist, 'robots.txt'), 'utf8');
const sitemap = await readFile(resolve(dist, 'sitemap.xml'), 'utf8');
if (origin) {
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`), 'Robots references the real sitemap');
  assert.ok(robots.includes('Allow: /') && !robots.includes('Disallow: /'), 'Release indexing is enabled');
  assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => decode(url)), routes.map(route => origin + route));
  await access(resolve(dist, 'social-card.png'));
} else {
  assert.ok(robots.includes('Disallow: /'), 'Preview crawling is disabled');
  assert.ok(!sitemap.includes('<loc>'), 'Preview never invents a sitemap origin');
}

const notFound = await readFile(resolve(dist, '404.html'), 'utf8');
assert.match(notFound, /noindex, follow/, '404 is excluded from indexing');
assert.match(notFound, /href="\/"/, '404 offers a way home');
assert.ok(!notFound.includes('<script'), 'Static 404 cannot hydrate the homepage');
const headers = await readFile(resolve(dist, '_headers'), 'utf8');
assert.match(headers, /X-Content-Type-Options: nosniff/);
assert.match(headers, /X-Frame-Options: DENY/);
await access(resolve(dist, 'favicon.svg'));

const releaseGuard = spawnSync(process.execPath, ['scripts/build.mjs'], {
  cwd: root,
  env: { ...process.env, RELEASE: 'true', VITE_SITE_URL: '' },
  encoding: 'utf8',
});
assert.notEqual(releaseGuard.status, 0, 'Release must fail without the actual origin');
assert.match(releaseGuard.stderr, /Release blocked/, 'Release failure explains required configuration');

console.log(`Build contracts passed: ${routes.length} readable pages, ${checkedLinks} local links/assets, ${checkedEmails} encoded email drafts, 3 fictional jobs, ${origin ? 'release' : 'preview'} SEO, 404, headers, and release guard.`);
