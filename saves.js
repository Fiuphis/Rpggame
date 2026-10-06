/* Saves do jogo (Crônicas do Saber).
   O jogo continua lendo e gravando as chaves de sempre (progresso e moedas/itens por grupo): elas são o "save ativo".
   Aqui ficam N compartimentos (slots) com cópias dessas chaves. Trocar de save = guardar o ativo, carregar o escolhido.
   Estrutura em localStorage 'bd1_slots': {v:1, active:1, list:{1:{name, ts, data:{prog, saves:{mage,...}}}, 2:null, 3:null}} */
(() => {
'use strict';
const KEY = 'bd1_slots', COUNT = 3, GROUPS = ['mage', 'guerreiro', 'tank', 'cleriga'], ORDER = [0, 1, 2, 5, 4, 3];
const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} };
const empty = () => ({prog:null, saves:{}});
const snapshot = () => { const d = empty(); d.prog = get('bd1_progress'); GROUPS.forEach(g => { const v = get('bd1_save_' + g); if (v != null) d.saves[g] = v; }); return d; };
const apply = d => { set('bd1_progress', d.prog || null); GROUPS.forEach(g => set('bd1_save_' + g, (d.saves && d.saves[g]) || null)); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clean = n => String(n || '').replace(/[^A-Za-z0-9À-ÿ \-]/g, '').trim().slice(0, 12).toUpperCase();
function read(){
  try { const d = JSON.parse(get(KEY)); if (d && d.v === 1 && d.list) return d; } catch {}
  // primeira vez: o progresso que já existe no aparelho vira o SAVE 1
  const d = {v:1, active:1, list:{}}; for (let i = 1; i <= COUNT; i++) d.list[i] = null;
  d.list[1] = {name:'SAVE 1', ts:Date.now(), data:snapshot()}; write(d); return d;
}
function write(d){ const j = JSON.stringify(d); set(KEY, j); idbPut(j); }
// cópia de segurança em IndexedDB: se o localStorage for apagado (limpeza do navegador), os saves voltam daqui
function idb(){ return new Promise((ok, no) => { try { const r = indexedDB.open('bd1_saves', 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); } catch (e) { no(e); } }); }
function idbPut(j){ idb().then(db => { db.transaction('k', 'readwrite').objectStore('k').put(j, 'slots'); }).catch(() => {}); }
function idbGet(){ return idb().then(db => new Promise(ok => { const q = db.transaction('k').objectStore('k').get('slots'); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null); })).catch(() => null); }
function sync(){   // o que está no jogo agora pertence ao save ativo
  const d = read(), s = d.list[d.active], now = snapshot();
  if (!s) d.list[d.active] = {name:'SAVE ' + d.active, ts:Date.now(), data:now};
  else if (!same(s.data, now)) { s.data = now; s.ts = Date.now(); }
  write(d); return d;
}
function summary(s){
  if (!s) return null;
  let done = [], gold = 0, items = 0;
  try { const p = JSON.parse(s.data.prog); if (p && Array.isArray(p.done)) done = p.done; } catch {}
  GROUPS.forEach(g => { try { const x = JSON.parse(s.data.saves[g]); if (x) { gold += x.gold || 0; items += (x.inventory || []).length; } } catch {} });
  return {name:s.name, ts:s.ts, done, gold, items};
}
function restore(j){ try { const d = JSON.parse(j); if (!d || d.v !== 1 || !d.list) return false; set(KEY, j); const s = d.list[d.active]; if (s) apply(s.data); idbPut(j); return true; } catch { return false; } }
const ready = (async () => {
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch {}
  if (!get(KEY)) { const j = await idbGet(); if (j) restore(j); }
  else idbPut(get(KEY));
})();
window.Saves = {
  ready,
  exportCode(){ sync(); return 'BD1:' + btoa(unescape(encodeURIComponent(get(KEY)))); },
  importCode(c){ try { c = String(c || '').trim(); if (!c.startsWith('BD1:')) return false; return restore(decodeURIComponent(escape(atob(c.slice(4))))); } catch { return false; } },
  COUNT, ORDER,
  state(){ const d = sync(); return {active:d.active, slots:Array.from({length:COUNT}, (_, i) => summary(d.list[i + 1]))}; },
  active(){ const d = read(); return d.active; },
  activeName(){ const d = read(), s = d.list[d.active]; return s ? s.name : 'SAVE ' + d.active; },
  load(n){ const d = sync(); const s = d.list[n]; if (!s) return false; apply(s.data); d.active = n; write(d); return true; },
  newGame(n){ const d = sync(); if (d.active === n) { apply(empty()); } d.list[n] = {name:(d.list[n] && d.list[n].name) || 'SAVE ' + n, ts:Date.now(), data:empty()}; write(d); return true; },   // novo jogo vazio (sem carregar, a menos que seja o ativo)
  saveTo(n){ const d = sync(); if (d.active === n) return false; const old = d.list[n]; d.list[n] = {name:old ? old.name : 'SAVE ' + n, ts:Date.now(), data:JSON.parse(JSON.stringify(d.list[d.active].data))}; write(d); return true; },   // copia o jogo atual para o compartimento n
  rename(n, name){ const d = read(), s = d.list[n]; const c = clean(name); if (!s || !c) return false; s.name = c; write(d); return true; },
  remove(n){ const d = sync(); if (d.active === n) { apply(empty()); d.list[n] = {name:'SAVE ' + n, ts:Date.now(), data:empty()}; } else d.list[n] = null; write(d); return true; }   // apagar o ativo reinicia o jogo dele
};
})();
