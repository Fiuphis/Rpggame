/* Chat da sala (v328): botão de balão com contador de não lidas; abre um painel com o histórico da sala (últimas 100 mensagens).
   Texto livre até 140 letras, 1 mensagem a cada 2 s. Não existe durante a luta com o chefe (o servidor recusa), mas adm pode falar sempre.
   Mensagens de adm levam selo ADM e brilho. Criador e adm apagam mensagens (aparece "apagada" para quem já a viu: some da lista).
   Uso: CHAT.mount({ room: '<uuid>' }) / CHAT.unmount(). Sem sala ou em modo simulado, não faz nada. */
(() => {
'use strict';
const CSS = `
#cht-btn{position:fixed;z-index:2147483100;right:max(10px,env(safe-area-inset-right));bottom:max(64px,calc(env(safe-area-inset-bottom) + 56px));width:46px;height:46px;padding:0;border:2px solid #e8c46a;background:linear-gradient(180deg,#2a2150,#120d28);color:#ffe08a;font:700 11px/1 var(--F,monospace);cursor:pointer;box-shadow:0 2px 0 #000,0 0 10px rgba(232,196,106,.35);image-rendering:pixelated;display:flex;align-items:center;justify-content:center}
#cht-btn:active{filter:brightness(1.3)}
#cht-btn svg{width:26px;height:26px;display:block;shape-rendering:crispEdges}
#cht-btn i{position:absolute;top:-8px;right:-8px;min-width:19px;height:19px;padding:0 4px;background:#d63a4a;color:#fff;border:2px solid #fff3d0;font:700 11px/15px var(--F,monospace);font-style:normal;text-align:center}
#cht-btn i[hidden]{display:none}
#cht-btn.on{display:none}
#cht-pn{position:fixed;z-index:2147483101;left:50%;transform:translateX(-50%);bottom:0;width:min(100vw,560px);height:min(62vh,520px);display:flex;flex-direction:column;background:linear-gradient(180deg,#171230,#0b0818);border:3px solid #e8c46a;border-bottom:0;box-shadow:0 -6px 24px rgba(0,0,0,.7);font-family:var(--F,monospace);font-weight:700;color:#f4e2b0}
#cht-pn[hidden]{display:none}
#cht-pn .hd{flex:none;display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:2px solid #5b4a22;color:#ffe08a;letter-spacing:.12em;font-size:13px}
#cht-pn .hd button{width:30px;height:30px;border:2px solid #5b4a22;background:#1d1740;color:#ffe08a;font:inherit;cursor:pointer}
#cht-ls{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
#cht-ls .em{margin:auto;text-align:center;color:#9c8fb4;font-size:12px;line-height:1.5}
.cm{position:relative;max-width:88%;align-self:flex-start;padding:5px 8px 6px;background:#241d49;border:2px solid #3b3270;font-size:13px;line-height:1.35;word-break:break-word}
.cm.me{align-self:flex-end;background:#2c2a14;border-color:#7a6a2c}
.cm .nm{display:block;font-size:10px;letter-spacing:.1em;color:#9fb4ff;margin-bottom:2px}
.cm.me .nm{color:#ffe08a}
.cm .tx{display:block}
.cm .dl{position:absolute;top:2px;right:2px;width:20px;height:20px;border:0;background:transparent;color:#9c8fb4;font:inherit;font-size:12px;cursor:pointer;padding:0}
.cm .dl.ok{color:#ff7080}
.cm.adm{align-self:stretch;max-width:100%;background:linear-gradient(180deg,#4a1218,#1b0709);border:2px solid #e8c46a;box-shadow:0 0 10px rgba(232,196,106,.7),inset 0 0 0 1px #7a2430;animation:chtg 2.2s ease-in-out infinite alternate}
.cm.adm .nm{color:#ffe08a}
.cm.adm .tx{color:#fff1c8}
.cm .seal{display:inline-block;margin-right:5px;padding:1px 4px;background:#e8c46a;color:#3a0f14;letter-spacing:.08em;font-size:10px}
@keyframes chtg{from{box-shadow:0 0 6px rgba(232,196,106,.5),inset 0 0 0 1px #7a2430}to{box-shadow:0 0 16px rgba(255,224,138,.95),inset 0 0 0 1px #a33344}}
#cht-pn form{flex:none;display:flex;gap:6px;padding:8px 10px max(8px,env(safe-area-inset-bottom));border-top:2px solid #5b4a22;background:#0e0a22}
#cht-in{flex:1;min-width:0;height:36px;padding:0 8px;border:2px solid #5b4a22;background:#120d28;color:#f4e2b0;font:inherit;font-size:14px;border-radius:0}
#cht-in:disabled{opacity:.5}
#cht-sd{flex:none;height:36px;padding:0 12px;border:2px solid #e8c46a;background:#3a2f12;color:#ffe08a;font:inherit;font-size:12px;letter-spacing:.1em;cursor:pointer}
#cht-sd:disabled{opacity:.45;filter:grayscale(.6)}
#cht-st{flex:none;min-height:16px;padding:0 10px 4px;font-size:10px;color:#ff9aa6;letter-spacing:.04em}
@media (prefers-reduced-motion:reduce){.cm.adm{animation:none}}
`;
const NET = () => window.NET, esc = s => String(s == null ? '' : s);
const ssg = k => { try { return sessionStorage.getItem(k); } catch { return null; } }, sss = (k, v) => { try { sessionStorage.setItem(k, v); } catch {} };
let st = null;   // estado da sala montada

function mount(o) {
  const n = NET(); if (!n || n.MOCK) return;
  const room = o && o.room; if (!room) return;
  if (st && st.room === room) return;
  unmount();
  if (!document.getElementById('cht-css')) { const s = document.createElement('style'); s.id = 'cht-css'; s.textContent = CSS; document.head.appendChild(s); }
  const btn = document.createElement('button'); btn.id = 'cht-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Chat da sala');
  btn.innerHTML = '<svg viewBox="0 0 13 13"><path fill="#ffe08a" d="M2 1h9v1h1v6h-1v1H6v1H5v1H4v-1H3V9H2V8H1V2h1z"/><path fill="#120d28" d="M3 3h7v1H3zM3 5h7v1H3zM3 7h4v1H3z"/></svg><i hidden>0</i>';
  const pn = document.createElement('div'); pn.id = 'cht-pn'; pn.hidden = true;
  pn.innerHTML = '<div class="hd"><span>CHAT DA SALA</span><button type="button" aria-label="Fechar">X</button></div><div id="cht-ls"></div><div id="cht-st"></div><form autocomplete="off"><input id="cht-in" maxlength="140" placeholder="Escreva uma mensagem" enterkeyhint="send"><button id="cht-sd" type="submit">ENVIAR</button></form>';
  document.body.appendChild(btn); document.body.appendChild(pn);
  const S = st = { room, msgs: [], last: 0, seen: Number(ssg('bd1_chat_seen_' + room)) || 0, open: false, canSend: true, canDel: false, busy: false, timer: 0, gone: false, btn, pn, ls: pn.querySelector('#cht-ls'), stt: pn.querySelector('#cht-st'), inp: pn.querySelector('#cht-in'), sd: pn.querySelector('#cht-sd'), badge: btn.querySelector('i'), delArm: 0 };
  btn.onclick = () => (S.open ? close() : open());
  pn.querySelector('.hd button').onclick = close;
  pn.querySelector('form').onsubmit = e => { e.preventDefault(); send(); };
  S.ls.addEventListener('click', e => {
    const b = e.target.closest('.dl'); if (!b) return; const id = Number(b.dataset.id);
    if (S.delArm !== id) { S.delArm = id; b.classList.add('ok'); b.textContent = '?'; setTimeout(() => { if (S.delArm === id) { S.delArm = 0; b.classList.remove('ok'); b.textContent = 'x'; } }, 2500); return; }
    S.delArm = 0; S.msgs = S.msgs.filter(m => m.id !== id); paint();
    NET().rpc('chat_delete', { p_room: room, p_id: id }).catch(() => {});
  });
  poll(); schedule();
  document.addEventListener('visibilitychange', S.vis = () => { if (!document.hidden) poll(); });
}

function schedule() { const S = st; if (!S) return; clearTimeout(S.timer); S.timer = setTimeout(async () => { await poll(); schedule(); }, S.open ? 2500 : 7000); }

async function poll() {
  const S = st; if (!S || S.busy || document.hidden || S.gone) return; S.busy = true; const room = S.room;
  try {
    const r = await NET().rpc('chat_list', { p_room: room, p_after: S.last });
    if (st !== S) return;
    S.canSend = !!r.can_send; S.canDel = !!r.can_del;
    const dels = new Set(r.dels || []);
    if (dels.size) S.msgs = S.msgs.filter(m => !dels.has(m.id));
    (r.msgs || []).forEach(m => { if (!S.msgs.some(x => x.id === m.id)) S.msgs.push(m); if (m.id > S.last) S.last = m.id; });
    S.msgs.sort((a, b) => a.id - b.id); if (S.msgs.length > 100) S.msgs = S.msgs.slice(-100);
    paint(); count();
  } catch (e) {
    if (/fora_da_sala|sala_nao_encontrada/.test(String((e && e.message) || e))) { S.gone = true; unmount(); }
  } finally { S.busy = false; }
}

function paint() {
  const S = st; if (!S) return;
  const nb = S.ls.scrollHeight - S.ls.scrollTop - S.ls.clientHeight < 40;
  if (!S.msgs.length) S.ls.innerHTML = '<div class="em">Ninguém falou ainda.<br>As mensagens ficam guardadas nesta sala.</div>';
  else {
    S.ls.innerHTML = '';
    S.msgs.forEach(m => {
      const d = document.createElement('div'); d.className = 'cm' + (m.mine ? ' me' : '') + (m.adm ? ' adm' : '');
      const nm = document.createElement('span'); nm.className = 'nm';
      if (m.adm) { const sl = document.createElement('span'); sl.className = 'seal'; sl.textContent = 'ADM'; nm.appendChild(sl); }
      nm.appendChild(document.createTextNode(String(m.name || 'jogador').toUpperCase()));
      const tx = document.createElement('span'); tx.className = 'tx'; tx.textContent = m.text;
      d.appendChild(nm); d.appendChild(tx);
      if (S.canDel) { const b = document.createElement('button'); b.type = 'button'; b.className = 'dl'; b.dataset.id = m.id; b.textContent = 'x'; b.setAttribute('aria-label', 'Apagar mensagem'); d.appendChild(b); }
      S.ls.appendChild(d);
    });
    if (nb || S.fresh) S.ls.scrollTop = S.ls.scrollHeight;
  }
  S.inp.disabled = !S.canSend; S.sd.disabled = !S.canSend;
  S.inp.placeholder = S.canSend ? 'Escreva uma mensagem' : 'Chat fechado durante a luta';
  if (S.canSend && S.stt.dataset.k === 'bt') { S.stt.textContent = ''; S.stt.dataset.k = ''; }
  if (!S.canSend) { S.stt.textContent = 'O chat volta quando a luta terminar.'; S.stt.dataset.k = 'bt'; }
}

function count() {
  const S = st; if (!S) return;
  if (S.open) { const top = S.msgs.length ? S.msgs[S.msgs.length - 1].id : 0; if (top > S.seen) { S.seen = top; sss('bd1_chat_seen_' + S.room, String(top)); } }
  const n = S.msgs.filter(m => m.id > S.seen && !m.mine).length;
  S.badge.hidden = n < 1; S.badge.textContent = n > 99 ? '99+' : String(n);
}

function open() { const S = st; if (!S) return; S.open = true; S.pn.hidden = false; S.btn.classList.add('on'); S.fresh = true; paint(); S.fresh = false; S.ls.scrollTop = S.ls.scrollHeight; count(); poll(); schedule(); }
function close() { const S = st; if (!S) return; S.open = false; S.pn.hidden = true; S.btn.classList.remove('on'); S.inp.blur(); count(); schedule(); }

async function send() {
  const S = st; if (!S || !S.canSend) return; const t = S.inp.value.trim(); if (!t) return;
  S.sd.disabled = true; S.stt.textContent = ''; S.stt.dataset.k = '';
  try { await NET().rpc('chat_send', { p_room: S.room, p_text: t }); S.inp.value = ''; await poll(); S.ls.scrollTop = S.ls.scrollHeight; }
  catch (e) {
    const m = String((e && e.message) || e);
    S.stt.textContent = /devagar/.test(m) ? 'Devagar: uma mensagem a cada 2 segundos.' : /chat_na_batalha/.test(m) ? 'O chat fica fechado durante a luta.' : /mensagem_invalida/.test(m) ? 'Mensagem de 1 a 140 letras.' : /fora_da_sala/.test(m) ? 'Você não está nesta sala.' : NET().msg(e);
    if (/chat_na_batalha/.test(m)) { S.canSend = false; paint(); }
  }
  if (st === S) { S.sd.disabled = !S.canSend; if (S.canSend) S.inp.focus(); }
}

function unmount() {
  const S = st; if (!S) return; st = null; clearTimeout(S.timer); document.removeEventListener('visibilitychange', S.vis);
  S.btn.remove(); S.pn.remove();
}

window.CHAT = { mount, unmount, open: () => open(), room: () => st && st.room, isOpen: () => !!(st && st.open) };
})();
