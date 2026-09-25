#!/usr/bin/env node
/*
 * Convert the old single-file book readers (22 MB HTML files with every page
 * embedded as base64) into the fast shared reader — with zero dependencies.
 *
 *   node scripts/convert_old_readers.js            # convert every built-in book that still needs it
 *   node scripts/convert_old_readers.js <slug>     # just one book
 *
 * For each book it writes
 *   public/readers/<slug>/p/001.jpg …   (page images, loaded one at a time)
 *   public/readers/<slug>.html          (2 KB shell that loads reader.js + reader.css)
 *
 * Books already converted (shell present, no embedded images) are skipped.
 * For the best quality + in-book search, build from the PDF instead:
 *   python scripts/build_reader.py --pdf public/books/<file>.pdf --slug <slug> --title "<title>"
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const READERS = path.join(ROOT, "public", "readers");
const BACKUPS = path.join(ROOT, "public", "readers_backups");

const BOOKS = [
  { slug: "the-circle-of-ash", title: "The Circle of Ash" },
  { slug: "the-shattered-sky", title: "The Shattered Sky" },
  { slug: "fairy-tales-for-kids", title: "Fairy Tales: For Kids" },
  { slug: "the-student-success-system", title: "The Student Success System" },
  { slug: "the-art-and-science-of-prompting", title: "The Art & Science of Prompting" },
];

const IMG_RE = /data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)/g;

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}
function pngSize(buf) { return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }; }

function findSource(slug) {
  const candidates = [
    path.join(READERS, slug + ".html"),
    path.join(BACKUPS, slug + ".html.bak"),
  ];
  for (const f of candidates) {
    if (!fs.existsSync(f)) continue;
    const html = fs.readFileSync(f, "utf8");
    if (IMG_RE.test(html)) { IMG_RE.lastIndex = 0; return { file: f, html }; }
  }
  return null;
}

function esc(s) { return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function convert({ slug, title, author = "Veer Sukhadiya" }) {
  const src = findSource(slug);
  if (!src) { console.log(`- ${slug}: nothing to convert (already converted or no source)`); return; }

  const outDir = path.join(READERS, slug, "p");
  fs.rmSync(path.join(READERS, slug), { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  let n = 0, size = null, ext = "jpg", m;
  while ((m = IMG_RE.exec(src.html))) {
    n++;
    const buf = Buffer.from(m[2], "base64");
    const isPng = m[1] === "png";
    if (n === 1) ext = isPng ? "png" : m[1] === "webp" ? "webp" : "jpg";
    const dims = isPng ? pngSize(buf) : jpegSize(buf);
    if (n === 2 || (!size && dims)) size = dims || size;
    fs.writeFileSync(path.join(outDir, String(n).padStart(3, "0") + "." + ext), buf);
  }
  if (!n) return;

  const book = { slug, title, author, pages: n, w: (size && size.w) || 788, h: (size && size.h) || 1200, ext, search: false, toc: [{ t: "Cover", p: 1, l: 0 }] };
  const shell = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>${esc(title)} — ${esc(author)}</title>
<link rel="preload" as="image" href="${slug}/p/001.${ext}" fetchpriority="high">
<link rel="stylesheet" href="reader.css?v=3">
</head>
<body>
<noscript>This reader needs JavaScript.</noscript>
<script>window.BOOK = ${JSON.stringify(book).replace(/</g, "\\u003c")};</script>
<script src="reader.js?v=3" defer></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(READERS, slug + ".html"), shell);
  console.log(`✓ ${slug}: ${n} pages extracted from ${path.relative(ROOT, src.file)}`);
}

const only = process.argv[2];
for (const b of BOOKS) if (!only || b.slug === only) convert(b);
