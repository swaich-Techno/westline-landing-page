import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isIP } from 'node:net';
import { build, loadEnv } from 'vite';

const root = process.cwd();
const env = { ...loadEnv('production', root, ''), ...process.env };
const requestedOrigin = (env.VITE_SITE_URL ?? '').trim();
const release = env.RELEASE === 'true';
let origin = '';

if (requestedOrigin) {
  let url;
  try {
    url = new URL(requestedOrigin);
  } catch {
    throw new Error('VITE_SITE_URL must be the actual HTTPS site origin, for example the assigned Cloudflare Pages address.');
  }
  const placeholder = /(^|\.)(localhost|example\.com|example\.org|example\.net|invalid|test|local)$/.test(url.hostname)
    || /^(your[-.]|placeholder\.)/.test(url.hostname);
  if (
    url.protocol !== 'https:' || !url.hostname.includes('.') || placeholder
    || isIP(url.hostname) || url.hostname.startsWith('[')
    || url.username || url.password || url.search || url.hash || url.port
    || (url.pathname !== '/' && url.pathname !== '')
  ) {
    throw new Error('VITE_SITE_URL must be a real public HTTPS origin without a path, port, credentials, query, or fragment.');
  }
  origin = url.origin;
}

if (release && !origin) {
  throw new Error('Release blocked: configure VITE_SITE_URL with the actual assigned HTTPS origin before setting RELEASE=true.');
}

// Match the origin in client configuration, rendered content, and metadata.
process.env.VITE_SITE_URL = origin;

await build({ root, build: { outDir: 'dist', emptyOutDir: true } });
await build({
  root,
  publicDir: false,
  build: {
    ssr: 'src/entry-server.tsx',
    outDir: '.prerender',
    emptyOutDir: true,
  },
});

const { render } = await import(pathToFileURL(resolve(root, '.prerender/entry-server.js')).href);
const template = await readFile(resolve(root, 'dist/index.html'), 'utf8');
const pages = [
  {
    path: '/',
    title: 'Westline Dispatch | Back-Office Support for Mobile Repair Teams',
    description: 'Dispatch coordination, invoice preparation, and clear shift handovers for US mobile truck and trailer repair businesses. Request a sample by email.',
  },
  {
    path: '/privacy/',
    title: 'Privacy Policy | Westline Dispatch',
    description: 'How Westline Dispatch handles website enquiries, business information, email correspondence, and service onboarding.',
  },
  {
    path: '/terms/',
    title: 'Terms of Service | Westline Dispatch',
    description: 'Terms for using the Westline Dispatch website, sample reports, and information about separately agreed operations-support services.',
  },
];

function escape(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function metadata(page, noindex = !origin) {
  const canonical = origin ? `${origin}${page.path}` : '';
  return [
    `<title>${escape(page.title)}</title>`,
    `<meta name="description" content="${escape(page.description)}" />`,
    `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:locale" content="en_US" />',
    '<meta property="og:site_name" content="Westline Dispatch" />',
    `<meta property="og:title" content="${escape(page.title)}" />`,
    `<meta property="og:description" content="${escape(page.description)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escape(page.title)}" />`,
    `<meta name="twitter:description" content="${escape(page.description)}" />`,
    ...(canonical && !noindex ? [
      `<link rel="canonical" href="${escape(canonical)}" />`,
      `<meta property="og:url" content="${escape(canonical)}" />`,
      `<meta property="og:image" content="${escape(origin)}/social-card.png" />`,
      '<meta property="og:image:width" content="1200" />',
      '<meta property="og:image:height" content="630" />',
      '<meta property="og:image:alt" content="Westline Dispatch — your repair team handles the road; we handle the back office." />',
      `<meta name="twitter:image" content="${escape(origin)}/social-card.png" />`,
    ] : []),
  ].join('\n    ');
}

for (const page of pages) {
  const destination = resolve(root, 'dist', page.path.replace(/^\//, ''));
  await mkdir(destination, { recursive: true });
  const html = template
    .replace(/<!--page-meta:start-->[\s\S]*?<!--page-meta:end-->/, metadata(page))
    .replace('<!--app-html-->', render(page.path));
  if (!html.includes('<main') || html.includes('<!--app-html-->')) {
    throw new Error(`Prerender verification failed for ${page.path}.`);
  }
  await writeFile(join(destination, 'index.html'), html);
}

// A real 404 file disables Cloudflare Pages' implicit SPA fallback.
const notFound = template
  .replace(/<!--page-meta:start-->[\s\S]*?<!--page-meta:end-->/, metadata({
    path: '/404.html',
    title: 'Page Not Found | Westline Dispatch',
    description: 'This page could not be found. Return to Westline Dispatch for operations support for mobile repair businesses.',
  }, true))
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
  .replace('<!--app-html-->', `<main style="max-width:48rem;margin:14vh auto;padding:2rem;font-family:Inter Variable,Inter,sans-serif;color:#102538"><p style="font-weight:750;letter-spacing:.12em">WESTLINE DISPATCH</p><h1 style="font-size:clamp(2rem,6vw,4rem);line-height:1.1;margin:3rem 0 1rem">That page is off route.</h1><p style="font-size:1.15rem;line-height:1.7">The page may have moved, or the link may be incorrect.</p><a href="/" style="display:inline-block;background:#c9874c;color:#102538;padding:1rem 1.5rem;border-radius:.5rem;font-weight:700;margin-top:1.25rem">Return to Westline Dispatch</a></main>`);
await writeFile(resolve(root, 'dist/404.html'), notFound);

const sitemap = origin
  ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${escape(origin + page.path)}</loc></url>`).join('\n')}\n</urlset>\n`
  : '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" />\n';
await writeFile(resolve(root, 'dist/sitemap.xml'), sitemap);
await writeFile(resolve(root, 'dist/robots.txt'), origin
  ? `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');

console.log(`Prerendered ${pages.length} pages and a static 404. ${origin ? `Canonical origin: ${origin}` : 'Preview build: noindex; empty sitemap; no canonical origin.'}`);
