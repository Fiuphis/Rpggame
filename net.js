/* Rede do jogo (Crônicas do Saber): conversa com o Supabase.
   Cada aparelho entra com login anônimo (sem cadastro) e só chama funções do servidor (rpc); as regras de salas, grupos e votos ficam lá.
   Sem servidor (ou com ?mock=1) a camada simulada devolve salas de mentira, para testar a tela. */
(() => {
'use strict';
const URL_ = 'https://cdwagfofjjhnykbzixut.supabase.co', KEY = 'sb_publishable_ywPS1-BCFSX90jMkktI1sg_sJZn0woN';
const GROUPS = ['mage', 'guerreiro', 'tank', 'cleriga'], RK = 'bd1_room';
const ss = { get: k => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch {} } };
if (/[?&]mock(=1)?(&|$)/.test(location.search)) ss.set('bd1_mock', '1'); if (/[?&]mock=0/.test(location.search)) ss.set('bd1_mock', null);
const MOCK = ss.get('bd1_mock') === '1';

const MSG = {
  nao_autenticado: 'Entre novamente no jogo.', sala_nao_encontrada: 'Sala não encontrada. Confira o código.', muitas_tentativas: 'Muitas tentativas. Aguarde alguns minutos.',
  limite_de_salas: 'Você já tem 3 salas abertas.', grupo_cheio: 'Essa classe está cheia.', fora_da_sala: 'Você não está nessa sala.', grupo_invalido: 'Classe inválida.',
  offline: 'Sem conexão com o servidor.', auth: 'Não foi possível entrar no servidor. Tente de novo.'
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

window.NET = {
  GROUPS, MOCK, msg, norm, room, setRoom,
  ready: () => MOCK ? Promise.resolve(true) : real(),
  async listRooms() { return MOCK ? M.list() : rpc('list_public_rooms'); },
  async createRoom(pub, name) { const r = MOCK ? await M.create(pub, name) : await rpc('create_room', { p_public: !!pub, p_name: name || null }); setRoom(r); return r; },
  async joinRoom(id, code) { const r = MOCK ? await M.join(id, code) : await rpc('join_room', { p_room: id || null, p_code: code ? norm(code) : null }); setRoom(r); return r; },
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
