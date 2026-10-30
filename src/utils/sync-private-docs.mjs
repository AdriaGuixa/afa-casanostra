import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_CATEGORIES = new Set(['Estatuts i RRI', 'Formularis']);

/**
 * Simple frontmatter parser for Decap CMS markdown files
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const yaml = match[1];
  const data = {};
  for (const line of yaml.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    data[key] = val;
  }
  return data;
}

export function syncPrivateDocuments(rootDir) {
  const docsDir = path.join(rootDir, 'src', 'content', 'documents');
  const publicDir = path.join(rootDir, 'public');
  const bundlePath = path.join(rootDir, 'src', 'data', 'private_documents_bundle.json');

  const privateDocs = [];
  const publicFiles = new Set();
  const privateFiles = new Set();

  if (fs.existsSync(docsDir)) {
    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const fullPath = path.join(docsDir, file);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const fm = parseFrontmatter(raw);
      const id = file.replace(/\.md$/, '');
      const tipus = fm.tipus || "Actes d'Assemblea";

      if (PUBLIC_CATEGORIES.has(tipus)) {
        if (fm.file) publicFiles.add(fm.file);
      } else {
        let fileBase64 = null;
        let fileName = null;
        if (fm.file) {
          privateFiles.add(fm.file);
          fileName = path.basename(fm.file);
          const relFile = fm.file.startsWith('/') ? fm.file.slice(1) : fm.file;
          const pdfPath = path.join(publicDir, relFile);
          if (fs.existsSync(pdfPath)) {
            fileBase64 = fs.readFileSync(pdfPath).toString('base64');
          }
        }
        privateDocs.push({
          id,
          title: fm.title || id,
          date: fm.date || '',
          tipus,
          description: fm.description || '',
          hasFile: Boolean(fileBase64),
          fileName: fileName || `${id}.pdf`,
          fileBase64
        });
      }
    }
  }

  fs.mkdirSync(path.dirname(bundlePath), { recursive: true });
  fs.writeFileSync(bundlePath, JSON.stringify(privateDocs, null, 2), 'utf8');

  return { privateDocs, publicFiles, privateFiles };
}

export function removePrivateFilesFromDist(rootDir, { publicFiles, privateFiles }) {
  const distDir = path.join(rootDir, 'dist');
  for (const fileUrl of privateFiles) {
    if (publicFiles.has(fileUrl)) continue;
    const relFile = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    const targetPath = path.join(distDir, relFile);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  }
}

export function privateDocsIntegration() {
  let syncResult = { publicFiles: new Set(), privateFiles: new Set() };
  const rootDir = process.cwd();

  return {
    name: 'afa-private-docs-sync',
    hooks: {
      'astro:config:setup': () => {
        syncResult = syncPrivateDocuments(rootDir);
      },
      'astro:build:start': () => {
        syncResult = syncPrivateDocuments(rootDir);
      },
      'astro:build:done': () => {
        removePrivateFilesFromDist(rootDir, syncResult);
      }
    }
  };
}
