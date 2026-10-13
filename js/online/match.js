'use strict';
/* Cliente da partida online: chamadas ao servidor (rpc) e acompanhamento do estado da sala.
   O servidor decide as entradas de cada rodada; o combate roda igual em todos os aparelhos (ver js/game/app.js, R()). */
(() => {
  const N = () => window.NET;
  const call = (fn, args) => N().rpc(fn, args);
  let offset = 0;   // relogio do servidor menos o relogio local (ms)
  /* modo espectador (so adm): le o estado da classe escolhida e nao grava nada */
  let SP = null; try { const q = /[?&]spec=([0-9a-f-]{36}):(mage|guerreiro|tank|cleriga)/.exec(location.search); SP = q ? { room: q[1], grp: q[2], mini: /[?&]mini=1/.test(location.search) } : JSON.parse(sessionStorage.getItem('bd1_spec') || 'null'); } catch (e) {}
  if (SP && !(SP.room && SP.grp)) SP = null;
  const nop = () => Promise.resolve(null);

  const M = {
    get offset() { return offset; },
    spec: SP,
    srvNow: () => Date.now() + offset,
    /* estado da sala/partida; ajusta o relogio com o horario do servidor */
    async state(room, snap) {
      const t0 = Date.now(), s = await (SP ? call('spectate_state', { p_room: SP.room, p_grp: SP.grp, p_snapshot: !!snap }) : call('match_state', { p_room: room, p_snapshot: !!snap })), t1 = Date.now();
      if (s && s.now) offset = s.now - (t0 + t1) / 2;
      return s;
    },
    lobby: room => call('room_lobby', { p_room: room }),
    stage: (room, st) => call('set_room_stage', { p_room: room, p_stage: st }),
    start: (room, boss) => call('start_match', { p_room: room, p_boss: boss || 0 }),
    vote: (round, option) => call('cast_vote', { p_round: round, p_option: option }),
    /* sempre com os 6 argumentos nomeados (existem versoes antigas da funcao) */
    act: (round, a) => call('cast_action', { p_round: round, p_skill: a.skill, p_element: a.element || null, p_target: a.target || null, p_ult: !!a.ult, p_ult_target: a.ultTarget || null }),
    item: (round, item, target, extra) => call('round_use_item', { p_round: round, p_item: item, p_target: target || null, p_extra: extra || 0 }),
    ack: round => call('ack_round', { p_round: round }),
    advance: (room, rank, kind) => call('advance_round', { p_room: room, p_rank: rank == null ? null : rank, p_kind: kind || 'q' }),
    snapshot: (match, round, state) => call('put_snapshot', { p_match: match, p_round: round, p_state: state }),
    end: (match, result) => call('end_match', { p_match: match, p_result: result }),
    stats: (match, stats) => call('report_stats', { p_match: match, p_stats: stats }),
    report: match => call('match_report', { p_match: match }),
    introState: room => call('intro_state', { p_room: room }),
    introVote: (room, yes) => call('intro_vote', { p_room: room, p_yes: !!yes }),
    introDone: room => call('intro_done', { p_room: room }),

    /* acompanha o estado: consulta a cada 1,5 s (3 s com a aba escondida) e logo depois de cada acao propria */
    watch(room, onState, opts) {
      opts = opts || {};
      let stop = false, timer = null, busy = false, again = false;
      const tick = async () => {
        if (stop) return;
        if (busy) { again = true; return; }
        busy = true;
        try { const s = await M.state(room, opts.snap && opts.snap()); if (!stop) onState(s); }
        catch (e) { if (!stop && opts.onError) opts.onError(e); }
        busy = false;
        if (again) { again = false; tick(); }
      };
      const loop = () => { if (stop) return; tick(); timer = setTimeout(loop, document.hidden ? 3000 : 1500); };
      const vis = () => { if (!document.hidden) { clearTimeout(timer); loop(); } };
      document.addEventListener('visibilitychange', vis);
      loop();
      return { refresh: tick, stop() { stop = true; clearTimeout(timer); document.removeEventListener('visibilitychange', vis); } };
    }
  };
  if (SP) {   // espectador: nenhuma escrita chega ao servidor
    ['stage', 'start', 'vote', 'act', 'item', 'ack', 'advance', 'snapshot', 'end', 'stats', 'introVote', 'introDone'].forEach(k => { M[k] = nop; });
    M.introState = () => Promise.resolve({ on: false, skip: 0, voters: 0, need: 0, mine: false });
  }
  window.MATCH = M;
})();
