// Attempt to load .env without a dependency on the dotenv package
try {
  require('dotenv').config();
} catch (err) {
  // Fallback: read .env manually
  try {
    const dot = require('fs').readFileSync(require('path').join(process.cwd(), '.env'), 'utf8');
    dot.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) return;
      const key = m[1];
      let val = m[2] || '';
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    });
  } catch (e) {
    // ignore
  }
}
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set in environment. Aborting.');
  process.exit(1);
}

async function extractBooksFromLib() {
  const libPath = path.join(process.cwd(), 'lib', 'books.ts');
  const src = await fs.readFile(libPath, 'utf8');
  const marker = 'export const BOOKS';
  const idx = src.indexOf(marker);
  if (idx === -1) throw new Error('BOOKS marker not found in lib/books.ts');
  const eqIdx = src.indexOf('=', idx);
  if (eqIdx === -1) throw new Error('Unable to locate assignment for BOOKS');
  const arrStart = src.indexOf('[', eqIdx);
  if (arrStart === -1) throw new Error('BOOKS array start not found');

  // find matching closing bracket while ignoring quoted strings
  function findMatchingBracket(s, start) {
    let i = start;
    let depth = 0;
    let inSingle = false;
    let inDouble = false;
    let inBack = false;
    for (; i < s.length; i++) {
      const ch = s[i];
      if (ch === '\\' && (inSingle || inDouble || inBack)) {
        i++; // skip escaped char
        continue;
      }
      if (!inDouble && !inBack && ch === "'") inSingle = !inSingle;
      else if (!inSingle && !inBack && ch === '"') inDouble = !inDouble;
      else if (!inSingle && !inDouble && ch === '`') inBack = !inBack;
      else if (!inSingle && !inDouble && !inBack) {
        if (ch === '[') depth++;
        else if (ch === ']') {
          depth--;
          if (depth === 0) return i;
        }
      }
    }
    return -1;
  }

  const arrEndIndex = findMatchingBracket(src, arrStart);
  if (arrEndIndex === -1) throw new Error('BOOKS array end not found (bracket match failed)');
  const arrText = src.slice(arrStart, arrEndIndex + 1);
  const vm = require('vm');
  const script = 'result = ' + arrText + ';';
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(script, ctx);
  return ctx.result;

  // Prefer compiled server JS (safe, no TypeScript annotations)
  const serverDir = path.join(process.cwd(), '.next', 'server');
  let files = [];
  try {
    async function walk(dir) {
      const items = await fs.readdir(dir, { withFileTypes: true });
      for (const it of items) {
        const p = path.join(dir, it.name);
        if (it.isDirectory()) await walk(p);
        else files.push(p);
      }
    }
    await walk(serverDir);
  } catch (e) {
    // fallback to lib/books.ts if .next not present
    const libPath = path.join(process.cwd(), 'lib', 'books.ts');
    const src = await fs.readFile(libPath, 'utf8');
    const marker = 'export const BOOKS';
    const idx = src.indexOf(marker);
    if (idx === -1) throw new Error('BOOKS marker not found in lib/books.ts');
    const arrStart = src.indexOf('[', idx);
    if (arrStart === -1) throw new Error('BOOKS array start not found');

    // find matching closing bracket while ignoring quoted strings
    function findMatchingBracket(s, start) {
      let i = start;
      let depth = 0;
      let inSingle = false;
      let inDouble = false;
      let inBack = false;
      for (; i < s.length; i++) {
        const ch = s[i];
        const prev = s[i - 1];
        if (ch === '\\' && (inSingle || inDouble || inBack)) {
          i++; // skip escaped char
          continue;
        }
        if (!inDouble && !inBack && ch === "'") inSingle = !inSingle;
        else if (!inSingle && !inBack && ch === '"') inDouble = !inDouble;
        else if (!inSingle && !inDouble && ch === '`') inBack = !inBack;
        else if (!inSingle && !inDouble && !inBack) {
          if (ch === '[') depth++;
          else if (ch === ']') {
            depth--;
            if (depth === 0) return i;
          }
        }
      }
      return -1;
    }

    const arrEndIndex = findMatchingBracket(src, arrStart);
    if (arrEndIndex === -1) throw new Error('BOOKS array end not found (bracket match failed)');
    const arrText = src.slice(arrStart, arrEndIndex + 1);
    const vm = require('vm');
    const script = 'result = ' + arrText + ';';
    const ctx = {};
    vm.createContext(ctx);
    vm.runInContext(script, ctx);
    return ctx.result;
  }

  // find first file that contains 'const BOOKS = ['
  for (const f of files) {
    try {
      const txt = await fs.readFile(f, 'utf8');
      const m = txt.match(/const\s+BOOKS\s*=\s*(\[[\s\S]*?\]);/m);
      if (m && m[1]) {
        const arrText = m[1];
        const vm = require('vm');
        const script = 'result = ' + arrText + ';';
        const ctx = {};
        vm.createContext(ctx);
        vm.runInContext(script, ctx);
        return ctx.result;
      }
    } catch (e) {
      // ignore read errors
    }
  }
  throw new Error('Unable to locate BOOKS array in compiled files');
}

async function main() {
  const books = await extractBooksFromLib();
  console.log('Parsed', books.length, 'books from lib/books.ts');

  await mongoose.connect(MONGO_URI, { bufferCommands: false });
  console.log('[mongoose] connected');

  const bookSchema = new mongoose.Schema({
    id: Number,
    slug: String,
    title: String,
    author: String,
    price: Number,
    actualPrice: Number,
    color: String,
    accent: String,
    genre: String,
    pages: Number,
    cover: String,
    reader: String,
    pdf: String,
    description: String,
    highlights: [String],
    htmlContent: String,
    isActive: { type: Boolean, default: true },
  });

  const Book = mongoose.models.Book || mongoose.model('Book', bookSchema);

  const slugs = books.map((b) => b.slug);
  // Remove any DB books not in the original list
  const del = await Book.deleteMany({ slug: { $nin: slugs } });
  console.log('Removed demo/test books count:', del.deletedCount);

  for (const b of books) {
    const doc = {
      id: b.id,
      slug: b.slug,
      title: b.title,
      author: b.author,
      price: b.price,
      actualPrice: b.actualPrice || b.price,
      color: b.color || '#2c3e50',
      accent: b.accent || '#1a252f',
      genre: b.genre || 'General',
      pages: b.pages || 0,
      cover: b.cover,
      reader: b.reader,
      pdf: b.pdf,
      description: b.description,
      highlights: b.highlights || [],
      htmlContent: b.htmlContent || undefined,
      isActive: true,
    };
    await Book.findOneAndUpdate({ id: b.id }, { $set: doc }, { upsert: true });
    console.log('Upserted book:', b.slug);
  }

  console.log('Restore complete.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
