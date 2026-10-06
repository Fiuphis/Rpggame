// Servidor de teste local: imita a API do Supabase (login anonimo + rpc) em cima do banco local (PGlite)
// e serve os arquivos do jogo. Uso: node server.mjs [porta]   -> http://localhost:PORTA/game.html?sb=http://localhost:PORTA
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import { randomUUID } from 'node:crypto';
import { makeDb, asUser } from './db.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..', '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.webmanifest': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.svg': 'image/svg+xml' };
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');

export async function startServer(port = 0) {
  const db = await makeDb();
  const meta = {};   // nome da funcao -> { retset, void }
  const rows = (await db.query(`select p.proname, p.proretset, t.typname from pg_proc p join pg_type t on t.oid = p.prorettype where p.pronamespace = 'public'::regnamespace`)).rows;
  for (const r of rows) meta[r.proname] = { retset: r.proretset, isVoid: r.typname === 'void' };

  const session = uid => {
    const exp = Math.floor(Date.now() / 1000) + 86400 * 30;
    const tok = `${b64({ alg: 'none' })}.${b64({ sub: uid, role: 'authenticated', is_anonymous: true, aud: 'authenticated', exp })}.x`;
    return { access_token: tok, token_type: 'bearer', expires_in: 86400 * 30, expires_at: exp, refresh_token: 'r.' + uid, user: { id: uid, aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: {}, user_metadata: {} } };
  };
  const uidOf = req => { const m = (req.headers.authorization || '').match(/Bearer [^.]+\.([^.]+)\./); if (!m) return null; try { return JSON.parse(Buffer.from(m[1], 'base64url').toString()).sub; } catch { return null; } };
  const newUser = async () => { const id = randomUUID(); await db.query(`insert into auth.users (id, is_anonymous) values ($1, true)`, [id]); return id; };

  const send = (res, code, body, type = 'application/json') => {
    res.writeHead(code, { 'content-type': type, 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'cache-control': 'no-store' });
    res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
  };
  const readBody = req => new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d)); });

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      if (req.method === 'OPTIONS') return send(res, 204, '');
      const p = url.pathname;
      if (p === '/auth/v1/signup') { const id = await newUser(); return send(res, 200, session(id)); }
      if (p === '/auth/v1/token') {
        const b = JSON.parse((await readBody(req)) || '{}'), rt = String(b.refresh_token || '');
        const id = rt.startsWith('r.') ? rt.slice(2) : await newUser();
        return send(res, 200, session(id));
      }
      if (p === '/auth/v1/user') { const id = uidOf(req); return id ? send(res, 200, session(id).user) : send(res, 401, { message: 'sem sessao' }); }
      if (p === '/auth/v1/logout') return send(res, 204, '');
      if (p === '/__admin/sql' && req.method === 'POST') {
        const b = JSON.parse(await readBody(req)); const r = await db.query(b.sql, b.params || []); return send(res, 200, r.rows);
      }
      if (p.startsWith('/rest/v1/rpc/')) {
        const fn = p.slice('/rest/v1/rpc/'.length), uid = uidOf(req), m = meta[fn];
        if (!m || fn.startsWith('_')) return send(res, 404, { message: 'funcao inexistente' });
        if (!uid) return send(res, 401, { message: 'sem sessao' });
        const args = JSON.parse((await readBody(req)) || '{}');
        try {
          const names = Object.keys(args);
          const vals = names.map(n => (args[n] !== null && typeof args[n] === 'object') ? JSON.stringify(args[n]) : args[n]);
          const ph = names.map((n, i) => `${n} => $${i + 1}${(args[n] !== null && typeof args[n] === 'object') ? '::jsonb' : ''}`).join(', ');
          const out = await db.transaction(async tx => {
            await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid, role: 'authenticated', is_anonymous: true })]);
            await tx.exec('set local role authenticated');
            if (m.isVoid) { await tx.query(`select public.${fn}(${ph})`, vals); return null; }
            if (m.retset) return (await tx.query(`select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) as r from public.${fn}(${ph}) t`, vals)).rows[0].r;
            return (await tx.query(`select to_jsonb(public.${fn}(${ph})) as r`, vals)).rows[0].r;
          });
          return send(res, 200, out === null ? '' : out);
        } catch (e) { return send(res, 400, { message: String(e.message || e).replace(/^error: /i, ''), code: 'P0001' }); }
      }
      // arquivos estaticos
      let f = normalize(join(root, decodeURIComponent(p === '/' ? '/index.html' : p)));
      if (!f.startsWith(root) || !existsSync(f) || !statSync(f).isFile()) return send(res, 404, 'nao encontrado', 'text/plain');
      return send(res, 200, readFileSync(f), MIME[extname(f)] || 'application/octet-stream');
    } catch (e) { send(res, 500, { message: String(e.message || e) }); }
  });
  await new Promise(r => server.listen(port, r));
  return { server, db, port: server.address().port, close: () => server.close() };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const s = await startServer(parseInt(process.argv[2] || '8787'));
  console.log('servidor de teste em http://localhost:' + s.port);
}
