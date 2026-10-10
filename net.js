/* Rede do jogo (Crônicas do Saber): conversa com o Supabase.
   Cada aparelho entra com login anônimo (sem cadastro) e só chama funções do servidor (rpc); as regras de salas, grupos e votos ficam lá.
   Sem servidor (ou com ?mock=1) a camada simulada devolve salas de mentira, para testar a tela. */
(() => {
'use strict';
let URL_ = 'https://cdwagfofjjhnykbzixut.supabase.co'; const KEY = 'sb_publishable_ywPS1-BCFSX90jMkktI1sg_sJZn0woN';
const GROUPS = ['mage', 'guerreiro', 'tank', 'cleriga'], RK = 'bd1_room';
const ss = { get: k => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch {} } };
if (/[?&]mock(=1)?(&|$)/.test(location.search)) ss.set('bd1_mock', '1'); if (/[?&]mock=0/.test(location.search)) ss.set('bd1_mock', null);
const MOCK = ss.get('bd1_mock') === '1';
{ const m = location.search.match(/[?&]sb=([^&]+)/); if (m && /^http:\/\/(localhost|127\.0\.0\.1)[:/]/.test(decodeURIComponent(m[1]))) ss.set('bd1_sb', decodeURIComponent(m[1])); const o = ss.get('bd1_sb'); if (o) URL_ = o; }   // so para testes locais (servidor de teste)

const MSG = {
  nao_autenticado: 'Entre novamente no jogo.', sala_nao_encontrada: 'Sala não encontrada. Confira o código.', muitas_tentativas: 'Muitas tentativas. Aguarde alguns minutos.',
  limite_de_salas: 'Você já tem 3 salas abertas.', grupo_cheio: 'Essa classe está cheia.', fora_da_sala: 'Você não está nessa sala.', grupo_invalido: 'Classe inválida.',
  offline: 'Sem conexão com o servidor.', usuario_existe: 'Esse nome de usuário já existe.', email_exists: 'Esse nome de usuário já existe.', user_already_exists: 'Esse nome de usuário já existe.', usuario_invalido: 'Use de 3 a 16 letras minúsculas, números ou _.', 'Invalid login credentials': 'Usuário ou senha incorretos.', credenciais: 'Usuário ou senha incorretos.', codigo_invalido: 'Código de recuperação incorreto.', senha_curta: 'A senha precisa de pelo menos 6 caracteres.', weak_password: 'Senha fraca. Use pelo menos 6 caracteres.', limite_de_saves: 'Limite de 4 saves nesta classe.', precisa_de_conta: 'Entre na sua conta para usar saves.', save_desatualizado: 'Este save foi alterado em outro aparelho.', save_nao_encontrado: 'Save não encontrado.', nome_invalido: 'Dê um nome de 1 a 20 letras.', over_request_rate_limit: 'Muitas tentativas. Aguarde um pouco.', auth: 'Não foi possível entrar no servidor. Tente de novo.'
};
const msg = e => { const m = String((e && (e.message || e.code)) || e || ''); const k = Object.keys(MSG).find(x => m.includes(x)); return k ? MSG[k] : 'Algo deu errado. Tente de novo.'; };
const norm = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

// ---------- servidor de verdade ----------
let sb = null, readyP = null;
function real() {
  if (readyP) return readyP;
  readyP = (async () => {
    if (!window.supabase || !window.supabase.createClient) throw new Error('offline');
    sb = window.supabase.createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'bd1_auth' } });
    const { data } = await sb.auth.getSession();
    if (!data.session) { const r = await sb.auth.signInAnonymously(); if (r.error) throw new Error('auth'); }
    return true;
  })().catch(e => { readyP = null; throw e; });
  return readyP;
}
const rpc = async (fn, args) => { await real(); const r = await sb.rpc(fn, args || {}); if (r.error) throw r.error; return r.data; };

// ---------- simulado (testes) ----------
const M = (() => {
  const rooms = [
    { id: 'm1', code: 'AB12CD', name: 'TURMA A', is_public: true, status: 'lobby', boss_idx: 0, counts: { mage: 3, guerreiro: 5, tank: 2, cleriga: 1 } },
    { id: 'm2', code: 'ZK9Q4T', name: 'NOITE DE ESTUDO', is_public: true, status: 'battle', boss_idx: 1, counts: { mage: 7, guerreiro: 7, tank: 6, cleriga: 7 } },
    { id: 'm3', code: 'HX3M7P', name: null, is_public: true, status: 'lobby', boss_idx: 0, counts: { mage: 0, guerreiro: 1, tank: 0, cleriga: 0 } },
    { id: 'm4', code: 'PR1V4D', name: 'SO OS AMIGOS', is_public: false, status: 'lobby', boss_idx: 0, counts: { mage: 1, guerreiro: 0, tank: 1, cleriga: 0 } },
  ];
  const tot = c => GROUPS.reduce((s, g) => s + (c[g] || 0), 0), wait = ms => new Promise(r => setTimeout(r, ms));
  return {
    async list() { await wait(250); return rooms.filter(r => r.is_public).map(r => ({ id: r.id, name: r.name, status: r.status, boss_idx: r.boss_idx, players: tot(r.counts), counts: { ...r.counts }, created_at: new Date().toISOString() })); },
    async create(pub, name) { await wait(250); const r = { id: 'm' + (rooms.length + 1), code: Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random() * 32 | 0]).join(''), name: name || null, is_public: !!pub, status: 'lobby', boss_idx: 0, counts: { mage: 0, guerreiro: 0, tank: 0, cleriga: 0 } }; rooms.push(r); return r; },
    async join(id, code) { await wait(250); const c = norm(code); const r = c ? rooms.find(x => x.code === c) : rooms.find(x => x.id === id && x.is_public); if (!r) throw new Error('sala_nao_encontrada'); return r; },
    async counts(id) { const r = rooms.find(x => x.id === id); return GROUPS.map(g => ({ grp: g, n: r ? r.counts[g] : 0 })); },
    async pick(id, g) { const r = rooms.find(x => x.id === id); if (g && r && r.counts[g] >= 7) throw new Error('grupo_cheio'); }
  };
// Cópia automática do progresso para o save da conta (a cada 20 s se mudou, ao esconder a aba e ao sair).
if (!/(salas|conta|saves)\.html$/.test(location.pathname)) {
  const push = f => { if (ss.get('bd1_save')) window.NET.SV.sync(f); };
  setInterval(() => push(false), 20000);
  addEventListener('visibilitychange', () => { if (document.hidden) push(false); });
  addEventListener('pagehide', () => push(false));
}
// Presença: enquanto o jogador estiver numa sala, avisa o servidor a cada 15 s em qualquer tela (seleção, mapa, batalha), para a contagem não "cair".
if (!/salas\.html$/.test(location.pathname)) {
  const beat = () => { const r = room(); if (r && !document.hidden && !MOCK) window.NET.heartbeat(r.id); };
  setInterval(beat, 15000); setTimeout(beat, 1500);
  addEventListener('visibilitychange', () => { if (!document.hidden) beat(); });
}
})();

const room = () => { try { return JSON.parse(ss.get(RK)); } catch { return null; } };
const setRoom = r => ss.set(RK, r ? JSON.stringify({ id: r.id, code: r.code, name: r.name || null, pub: r.is_public !== false }) : null);
const cnt = rows => { const o = { mage: 0, guerreiro: 0, tank: 0, cleriga: 0 }; (rows || []).forEach(r => { o[r.grp] = Number(r.n) || 0; }); return o; };


// ---------- conta (nome + senha) e saves ----------
const DOM = '@cronicas-do-saber.app', mail = u => String(u).toLowerCase() + DOM, userOk = u => /^[a-z0-9_]{3,16}$/.test(u);
const fail = c => { throw new Error(c); };
const LS = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const gen = n => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random() * 32 | 0]).join('');
const code12 = () => { const c = gen(12); return c.slice(0, 4) + '-' + c.slice(4, 8) + '-' + c.slice(8); };
const AM = {   // simulado
  accs: () => LS.get('bd1_mock_acc') || {}, saves: () => LS.get('bd1_mock_saves') || [],
  cur: () => ss.get('bd1_mock_user'),
  wait: ms => new Promise(r => setTimeout(r, ms))
};
const ACC = {
  async account() {
    if (MOCK) { const u = AM.cur(); return u ? { username: u } : null; }
    await real(); const { data } = await sb.auth.getSession(); const us = data.session && data.session.user;
    if (!us || us.is_anonymous || !us.email) return null;
    return { username: us.email.split('@')[0] };
  },
  async signUp(user, pass) {
    user = String(user || '').toLowerCase(); if (!userOk(user)) fail('usuario_invalido'); if (String(pass || '').length < 6) fail('senha_curta');
    if (MOCK) { await AM.wait(300); const a = AM.accs(); if (a[user]) fail('usuario_existe'); const c = code12(); a[user] = { p: pass, c }; LS.set('bd1_mock_acc', a); ss.set('bd1_mock_user', user); return c; }
    await real(); const { data } = await sb.auth.getSession(); const cur = data.session && data.session.user;
    if (cur && cur.is_anonymous) {            // o jogador anônimo vira conta (mesmo usuário, mesmas salas)
      const r = await sb.auth.updateUser({ email: mail(user), password: pass }); if (r.error) throw r.error;
      const rf = await sb.auth.refreshSession(); if (rf.error) throw rf.error;
    } else { const r = await sb.auth.signUp({ email: mail(user), password: pass }); if (r.error) throw r.error; if (!r.data.session) fail('auth'); }
    try { return await rpc('register_profile', { p_username: user }); }
    catch (e) { try { await sb.auth.signOut(); } catch {} throw e; }
  },
  async signIn(user, pass) {
    user = String(user || '').toLowerCase(); if (!userOk(user) || !pass) fail('credenciais');
    if (MOCK) { await AM.wait(300); const a = AM.accs()[user]; if (!a || a.p !== pass) fail('credenciais'); ss.set('bd1_mock_user', user); return { username: user }; }
    await real(); const r = await sb.auth.signInWithPassword({ email: mail(user), password: pass }); if (r.error) throw r.error; return { username: user };
  },
  async changePassword(user, old, nw) {   // confere a senha atual e troca por a nova
    if (String(nw || '').length < 6) fail('senha_curta');
    if (MOCK) { await AM.wait(250); const a = AM.accs(), x = a[user]; if (!x || x.p !== old) fail('credenciais'); x.p = nw; LS.set('bd1_mock_acc', a); return true; }
    await real(); const r = await sb.auth.signInWithPassword({ email: mail(user), password: old }); if (r.error) fail('credenciais');
    const u = await sb.auth.updateUser({ password: nw }); if (u.error) throw u.error; return true;
  },
  async signOut() {
    ss.set(RK, null); ss.set('bd1_save', null); ss.set('bd1_acc', null);
    if (MOCK) { ss.set('bd1_mock_user', null); return; }
    try { await real(); await sb.auth.signOut(); } catch {}
  },
  async recover(user, code, pass) {
    user = String(user || '').toLowerCase(); if (!userOk(user)) fail('usuario_invalido'); if (String(pass || '').length < 6) fail('senha_curta');
    if (MOCK) { await AM.wait(300); const a = AM.accs(), x = a[user]; if (!x || x.c.replace(/-/g, '') !== String(code).toUpperCase().replace(/[^A-Z0-9]/g, '')) fail('codigo_invalido'); x.p = pass; x.c = code12(); LS.set('bd1_mock_acc', a); return x.c; }
    let res; try { res = await fetch(URL_ + '/functions/v1/recover', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ username: user, code, password: pass }) }); } catch { fail('offline'); }
    const j = await res.json().catch(() => ({})); if (!res.ok || !j.ok) fail(j.error || 'auth'); return j.code;
  },
  async listSaves() {
    if (MOCK) { await AM.wait(200); const u = AM.cur(); return AM.saves().filter(x => x.owner === u).map(({ data, owner, ...r }) => ({ ...r, resumo: data && data.resumo || null })); }
    await real(); const r = await sb.from('saves').select('id,class,slot,name,rev,updated_at,resumo:data->resumo').order('slot'); if (r.error) throw r.error; return r.data || [];
  },
  async createSave(name) {
    for (const c of ['mage', 'guerreiro', 'tank', 'cleriga']) { try { return await ACC._create(c, name); } catch (e) { if (!String((e && e.message) || e).includes('limite_de_saves')) throw e; } }
    fail('limite_de_saves');
  },
  async _create(cls, name) {
    if (MOCK) { await AM.wait(250); const u = AM.cur(), all = AM.saves(), mine = all.filter(x => x.owner === u && x.class === cls); let s = 1; while (mine.some(x => x.slot === s) && s <= 4) s++; if (s > 4) fail('limite_de_saves');
      const row = { id: 'sv' + gen(8), owner: u, class: cls, slot: s, name: (String(name || '').trim() || 'SAVE ' + s).slice(0, 20), rev: 0, updated_at: new Date().toISOString(), data: {} }; all.push(row); LS.set('bd1_mock_saves', all); const { data, owner, ...o } = row; return o; }
    return rpc('create_save', { p_class: cls, p_name: name || '' });
  },
  async renameSave(id, name) { if (MOCK) { await AM.wait(150); const all = AM.saves(), x = all.find(v => v.id === id); if (!x) fail('save_nao_encontrado'); x.name = String(name).slice(0, 20); LS.set('bd1_mock_saves', all); return; } return rpc('rename_save', { p_id: id, p_name: name }); },
  async deleteSave(id) { if (MOCK) { await AM.wait(150); LS.set('bd1_mock_saves', AM.saves().filter(v => v.id !== id)); return; } return rpc('delete_save', { p_id: id }); },
  async readSave(id) {
    if (MOCK) { const x = AM.saves().find(v => v.id === id); if (!x) fail('save_nao_encontrado'); return { id, data: x.data, rev: x.rev }; }
    await real(); const r = await sb.from('saves').select('id,data,rev').eq('id', id).single(); if (r.error) throw r.error; return r.data;
  },
  async writeSave(id, data, rev) {
    if (MOCK) { const all = AM.saves(), x = all.find(v => v.id === id); if (!x || x.rev !== rev) fail('save_desatualizado'); x.data = data; x.rev++; x.updated_at = new Date().toISOString(); LS.set('bd1_mock_saves', all); return x.rev; }
    return rpc('write_save', { p_id: id, p_data: data, p_rev: rev });
  }
};


// ---------- progresso do jogo <-> save da conta ----------
// O jogo grava o progresso no aparelho (bd1_progress e bd1_save_<classe>). Com um save de conta ativo (bd1_save), uma cópia vai para o servidor.
const GK = ['mage', 'guerreiro', 'tank', 'cleriga'];
const lsg = k => { try { return localStorage.getItem(k); } catch { return null; } }, lss = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
const jp = s => { try { return JSON.parse(s); } catch { return null; } };
const SV = {
  active() { return jp(ss.get('bd1_save')); },
  snapshot() {   // save generico: guarda o progresso e o ouro/itens de TODAS as classes, mais a classe escolhida por ultimo
    const prog = lsg('bd1_progress'), p = jp(prog) || {}, saves = {}; let cls = ss.get('bd1_pref_class') || null;
    GK.forEach(g => { const v = lsg('bd1_save_' + g); if (v != null) saves[g] = v; });
    if (!GK.includes(cls)) { const a = SV.active(); cls = a && a.cls || null; }
    const s = jp(saves[cls || 'mage']) || {};
    const her = {}; GK.forEach(g => { const x = jp(saves[g]); if (x) her[g] = { o: Number(x.gold) || 0, i: Array.isArray(x.inventory) ? x.inventory.length : 0 }; });
    return { v: 2, cls, prog, saves, resumo: { fase: Array.isArray(p.done) ? p.done.length : 0, moedas: Number(s.gold) || 0, cls, her } };
  },
  apply(data) {   // coloca o save da conta no jogo (vazio = jogo novo); aceita o formato antigo (por classe)
    GK.forEach(g => lss('bd1_save_' + g, null)); lss('bd1_progress', null);
    let cls = null;
    if (data && data.v === 2) { if (data.prog != null) lss('bd1_progress', data.prog); GK.forEach(g => { if (data.saves && data.saves[g] != null) lss('bd1_save_' + g, data.saves[g]); }); cls = data.cls || null; }
    else if (data && data.v === 1) { if (data.prog != null) lss('bd1_progress', data.prog); if (data.save != null && data.class) lss('bd1_save_' + data.class, data.save); cls = data.class || null; }
    try { ss.set('bd1_save_hash', null); ss.set('bd1_pref_class', GK.includes(cls) ? cls : null); } catch {}
    return cls;
  },
  async sync(force) {
    const a = SV.active(); if (!a || !a.id) return false;
    const data = SV.snapshot(), h = JSON.stringify(data);
    if (!force && ss.get('bd1_save_hash') === h) return false;
    const act = async () => { const rev = await ACC.writeSave(a.id, data, a.rev); a.rev = rev; ss.set('bd1_save', JSON.stringify(a)); ss.set('bd1_save_hash', h); return true; };
    try { return await act(); }
    catch (e) {
      if (!String((e && e.message) || e).includes('save_desatualizado')) return false;
      try { const cur = await ACC.readSave(a.id); a.rev = cur.rev; return await act(); } catch { return false; }   // outro aparelho gravou: vale o que está aqui
    }
  }
};

window.NET = {
  ...ACC, SV,
  GROUPS, MOCK, msg, norm, room, setRoom, rpc,
  ready: () => MOCK ? Promise.resolve(true) : real(),
  async listRooms() { return MOCK ? M.list() : rpc('list_public_rooms'); },
  async createRoom(pub, name) { const r = MOCK ? await M.create(pub, name) : await rpc('create_room', { p_public: !!pub, p_name: name || null }); setRoom(r); return r; },
  async joinRoom(id, code) { const r = MOCK ? await M.join(id, code) : await rpc('join_room', { p_room: id || null, p_code: code ? norm(code) : null }); if (!r || !r.id) throw new Error('sala_nao_encontrada'); setRoom(r); return r; },
  async counts(id) { return cnt(MOCK ? await M.counts(id) : await rpc('room_counts', { p_room: id })); },
  async pickGroup(id, g) { return MOCK ? M.pick(id, g) : rpc('pick_group', { p_room: id, p_grp: g || null }); },
  async heartbeat(id) { if (MOCK) return; try { await rpc('heartbeat', { p_room: id }); } catch {} },
  async leave(id) { setRoom(null); if (MOCK) return; try { await rpc('leave_room', { p_room: id }); } catch {} }
};
// Presença: enquanto o jogador estiver numa sala, avisa o servidor a cada 15 s em qualquer tela (seleção, mapa, batalha), para a contagem não "cair".
if (!/salas\.html$/.test(location.pathname)) {
  const beat = () => { const r = room(); if (r && !document.hidden && !MOCK) window.NET.heartbeat(r.id); };
  setInterval(beat, 15000); setTimeout(beat, 1500);
  addEventListener('visibilitychange', () => { if (!document.hidden) beat(); });
}
})();
