const fs = require('fs').promises;
const path = require('path');

function sanitizeReaderHtml(html) {
  if (!html) return html;
  let s = String(html);
  s = s.replace(/<div[^>]*id=["']?toolbar["']?[^>]*>[\s\S]*?<\/div>/gi, '');
  s = s.replace(/<div[^>]*id=["']?thumb-strip["']?[^>]*>[\s\S]*?<\/div>/gi, '');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
  s = s.replace(/ on[a-zA-Z]+=(\"[^\"]*\"|\'[^\']*\'|[^\s>]+)/gi, '');
  return s;
}

async function sanitizeFolder(folder) {
  const dir = path.join(process.cwd(), folder);
  try {
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (!f.toLowerCase().endsWith('.html')) continue;
      const filePath = path.join(dir, f);
      const orig = await fs.readFile(filePath, 'utf8');
      const sanitized = sanitizeReaderHtml(orig);
      if (sanitized !== orig) {
        const backupDir = path.join(process.cwd(), 'public', 'readers_backups');
        await fs.mkdir(backupDir, { recursive: true });
        const backupPath = path.join(backupDir, f + '.bak');
        await fs.writeFile(backupPath, orig, 'utf8');
        await fs.writeFile(filePath, sanitized, 'utf8');
        console.log('Sanitized:', filePath, 'backup->', backupPath);
      } else {
        console.log('No changes needed:', filePath);
      }
    }
  } catch (err) {
    console.warn('Folder read error, skipping:', folder, err.message);
  }
}

(async () => {
  console.log('Sanitizing public/readers and public/uploads/readers...');
  await sanitizeFolder('public/readers');
  await sanitizeFolder('public/uploads/readers');
  console.log('Done.');
})();
