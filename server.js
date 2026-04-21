/**
 * Workspace — Local Server
 * Serves HTML tools + JSON read/write endpoints
 * Zero external dependencies, Node built-ins only
 *
 * Endpoints:
 *   GET  /data/:name   → reads   ~/workspace/data/<name>.json
 *                                (name ∈ plan-and-track, sessions, context-catchup)
 *   POST /data/:name   → writes  ~/workspace/data/<name>.json
 *   GET  /*            → serves static files from this folder
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const FILES_DIR = path.join(ROOT, 'files');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR);

const PRESENTABLE_EXTS = ['.jsx','.js','.tsx','.html','.htm','.md','.markdown','.svg','.mermaid','.mmd','.png','.jpg','.jpeg','.gif','.webp'];

const MIME = {
  '.html': 'text/html',
  '.htm':  'text/html',
  '.js':   'application/javascript',
  '.jsx':  'text/plain',
  '.tsx':  'text/plain',
  '.css':  'text/css',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.md':   'text/markdown',
  '.markdown': 'text/markdown',
  '.mermaid': 'text/plain',
  '.mmd':  'text/plain',
  '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    return res.end();
  }

  // === SHUTDOWN ===
  if (url.pathname === '/api/shutdown' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
    res.end(JSON.stringify({ ok: true, message: 'Shutting down' }));
    setTimeout(() => process.exit(0), 500);
    return;
  }

  // === CLEAR ALL DATA (workspace-level) ===
  // Forces a _pre-clear vault snapshot for each tool (so today's data is never
  // lost even if the vault was seeded from an empty state), then resets the
  // three tool JSONs to their empty schemas.
  if (url.pathname === '/api/clear-all' && req.method === 'POST') {
    try {
      const backupDir = path.join(DATA_DIR, 'backups');
      const vaultDir = path.join(DATA_DIR, 'vault');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
      if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir);

      const todayStr = new Date().toISOString().slice(0, 10);
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const tools = ['plan-and-track', 'sessions', 'context-catchup'];

      const cleared = [];
      for (const name of tools) {
        const filePath = path.join(DATA_DIR, `${name}.json`);
        if (fs.existsSync(filePath)) {
          // 1. Rolling backup (same as normal save)
          fs.copyFileSync(filePath, path.join(backupDir, `${name}_${ts}.json`));
          // 2. Pre-clear vault snapshot — always written, unique suffix so it
          //    never overwrites the daily vault file.
          fs.copyFileSync(
            filePath,
            path.join(vaultDir, `${name}_${todayStr}_pre-clear_${ts}.json`)
          );
        }

        // 3. Reset to empty schema
        let empty;
        if (name === 'plan-and-track') {
          let theme = 'light';
          try {
            const cur = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (cur && cur.theme) theme = cur.theme;
          } catch {}
          empty = {
            _schemaVersion: 17,
            theme,
            archivedSections: [],
            userName: 'Name',
            userRole: 'Role',
            focusAreas: [],
            thisWeek: [],
            previousWeeks: [],
            nextSteps: [],
            timeline: [],
            weeklyReports: [],
            initiatives: [],
            contextItems: [],
            sessions: []
          };
        } else if (name === 'sessions') {
          empty = [];
        } else if (name === 'context-catchup') {
          empty = { vacationPeriod: { from: '', to: '' }, analyzedAt: null, items: [] };
        }
        fs.writeFileSync(filePath, JSON.stringify(empty), 'utf-8');
        cleared.push(name);
      }

      res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
      return res.end(JSON.stringify({ ok: true, cleared, preClearVaultStamp: ts }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json', ...cors });
      return res.end(JSON.stringify({ error: String(e && e.message || e) }));
    }
  }

  // === DATA API ===
  const dataMatch = url.pathname.match(/^\/data\/([a-z0-9_-]+)$/i);
  if (dataMatch) {
    const name = dataMatch[1];
    const filePath = path.join(DATA_DIR, `${name}.json`);

    if (req.method === 'GET') {
      const noCache = { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' };
      if (!fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': 'application/json', ...noCache, ...cors });
        return res.end('null');
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json', ...noCache, ...cors });
      return res.end(data);
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        // Validate JSON
        try { JSON.parse(body); } catch {
          res.writeHead(400, { 'Content-Type': 'application/json', ...cors });
          return res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
        // Write with backup
        if (fs.existsSync(filePath)) {
          const backupDir = path.join(DATA_DIR, 'backups');
          if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          fs.copyFileSync(filePath, path.join(backupDir, `${name}_${ts}.json`));
          // Keep only last 20 backups per name
          const backups = fs.readdirSync(backupDir)
            .filter(f => f.startsWith(name + '_'))
            .sort();
          while (backups.length > 20) {
            fs.unlinkSync(path.join(backupDir, backups.shift()));
          }
        }
        fs.writeFileSync(filePath, body, 'utf-8');

        // Daily vault: first save of each date gets a permanent snapshot (no retention cap).
        const vaultDir = path.join(DATA_DIR, 'vault');
        if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir);
        const todayStr = new Date().toISOString().slice(0, 10);
        const vaultFile = path.join(vaultDir, `${name}_${todayStr}.json`);
        if (!fs.existsSync(vaultFile)) {
          fs.copyFileSync(filePath, vaultFile);
        }

        res.writeHead(200, { 'Content-Type': 'application/json', ...cors });
        res.end(JSON.stringify({ ok: true, saved: name }));
      });
      return;
    }
  }

  // === FILES API — list presentable files (recursive) ===
  const apiNoCache = { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' };
  if (url.pathname === '/api/files' && req.method === 'GET') {
    try {
      const results = [];
      function scanDir(dir, prefix) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath, prefix ? prefix + '/' + entry.name : entry.name);
          } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (PRESENTABLE_EXTS.includes(ext)) {
              const stat = fs.statSync(fullPath);
              const relativePath = prefix ? prefix + '/' + entry.name : entry.name;
              const lastChanged = new Date(Math.max(stat.mtime.getTime(), stat.ctime.getTime()));
              results.push({
                name: entry.name,
                path: relativePath,
                folder: prefix || null,
                ext: ext.replace('.', ''),
                size: stat.size,
                modified: lastChanged.toISOString()
              });
            }
          }
        }
      }
      scanDir(FILES_DIR, '');
      results.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      res.writeHead(200, { 'Content-Type': 'application/json', ...apiNoCache, ...cors });
      return res.end(JSON.stringify(results));
    } catch(e) {
      res.writeHead(200, { 'Content-Type': 'application/json', ...apiNoCache, ...cors });
      return res.end('[]');
    }
  }

  // === CONTEXT CATCH-UP FOLDER API ===
  if (url.pathname === '/api/context-catchup-files' && req.method === 'GET') {
    const catchupDir = path.join(FILES_DIR, 'Context-catch-up');
    if (!fs.existsSync(catchupDir)) {
      res.writeHead(200, { 'Content-Type': 'application/json', ...apiNoCache, ...cors });
      return res.end(JSON.stringify({ exists: false, files: [], count: 0 }));
    }
    try {
      const files = fs.readdirSync(catchupDir)
        .filter(f => !f.startsWith('.') && !f.startsWith('_'));
      res.writeHead(200, { 'Content-Type': 'application/json', ...apiNoCache, ...cors });
      return res.end(JSON.stringify({ exists: true, files, count: files.length }));
    } catch(e) {
      res.writeHead(200, { 'Content-Type': 'application/json', ...apiNoCache, ...cors });
      return res.end(JSON.stringify({ exists: false, files: [], count: 0 }));
    }
  }

  // === STATIC FILES ===
  let filePath = path.join(ROOT, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    return res.end('Not found');
  }
  if (fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': contentType, ...cors });
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`\n  ✦ Workspace`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → http://localhost:${PORT}/show-and-note.html`);
  console.log(`  → http://localhost:${PORT}/plan-and-track.html`);
  console.log(`\n  Data dir:  ${DATA_DIR}`);
  console.log(`  Files dir: ${FILES_DIR} (drop presentable files here)`);
  console.log(`  Auto-backups on every save (last 20 kept)\n`);
});
