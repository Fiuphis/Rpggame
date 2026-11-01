// Gera em sw.js a impressao digital (SHA-1, 10 hex) de cada imagem/fonte da lista ASSETS.
// Rode a cada versao: node tools/swrev.mjs   (o service worker so baixa de novo a midia cuja impressao mudou)
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), swp = join(root, 'sw.js');
let sw = readFileSync(swp, 'utf8');
const assets = [...sw.split('\n').find(l => l.startsWith('const ASSETS=')).matchAll(/'\.\/([^']*)'/g)].map(m => m[1]);
const isCode = p => p === '' || p.endsWith('/') || /\.(html|js|css|json|webmanifest)$/.test(p);
const rev = {}, missing = [];
for (const p of assets.filter(p => !isCode(p))) { const f = join(root, p); if (!existsSync(f)) { missing.push(p); continue; } rev[p] = createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 10); }
const line = 'const REV=' + JSON.stringify(rev) + ';';
if (!/^const REV=.*;$/m.test(sw)) throw new Error('linha const REV= nao encontrada em sw.js');
sw = sw.replace(/^const REV=.*;$/m, () => line); writeFileSync(swp, sw);
// aviso: imagens do jogo que nao estao na lista (nao ficam guardadas no aparelho de antemao)
const all = []; const walk = d => { for (const n of readdirSync(join(root, d))) { const r = d + '/' + n; if (statSync(join(root, r)).isDirectory()) walk(r); else if (/\.(png|webp|jpg|woff2)$/.test(n)) all.push(r); } };
walk('assets'); const listed = new Set(assets); const out = all.filter(p => !listed.has(p));
console.log(`REV: ${Object.keys(rev).length} arquivos de midia` + (missing.length ? `; FALTANDO no disco: ${missing.join(', ')}` : '') + (out.length ? `; fora da lista ASSETS: ${out.length} (ex.: ${out.slice(0, 3).join(', ')})` : ''));
