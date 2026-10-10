'use strict';
/* Partida online (lockstep): o servidor decide as entradas de cada rodada (pergunta, acertos, acoes, itens) e cada aparelho
   roda o mesmo combate com o mesmo sorteio. Este arquivo cuida da conexao, do relogio, do estado compartilhado e do snapshot;
   js/game/app.js chama estas funcoes quando ONL.on. Sem sala online, ONL.on = false e o jogo roda como antes (offline). */
(() => {
  const ok = !!(window.NET && !NET.MOCK && window.MATCH && NET.room());
  const ONL = window.ONL = { on: ok };
  if (!ok) return;
  const room = NET.room();
  const SHARED = ['ib', 'phase2', 'chestAt', 'heroes', 'bossHp', 'rage', 'hardNext', 'ice', 'cd', 'marks', 'burn', 'buff', 'ultCd', 'ultReady', 'round', 'dazedNext', 'thrustCd', 'teleCd', 'prepNext', 'stun', 'enraged', 'sinceHard', 'forceHard', 'streak', 'gag'];
  const clone = o => JSON.parse(JSON.stringify(o === undefined ? null : o));
  let watcher = null, waiters = [], stopped = false;

  Object.assign(ONL, {
    room: room.id, s: null, matchId: null, seed: 0, boss: 0, me: null, err: null, lastOk: Date.now(),
    /* estado atual do servidor (atualizado pelo acompanhamento) */
    round() { return this.s && this.s.round || null; },
    match() { return this.s && this.s.match || null; },
    /* horario do servidor -> relogio local */
    local(ms) { return ms - MATCH.offset; },
    left(ms) { return Math.max(0, ms - MATCH.srvNow()); },
    /* cur = numero (no servidor) da ultima rodada concluida; a proxima e cur + 1 (as arcas tambem contam como rodada) */
    cur: 0,
    async init() {
      await NET.ready();
      const s = await MATCH.state(room.id, true);
      this.s = s;
      const m = s.match;
      if (!m || m.status !== 'playing') throw new Error('sem_partida');
      if (!s.me) throw new Error('sem_grupo');
      this.matchId = m.id; this.seed = Number(m.seed) || 0; this.boss = m.boss || 0; this.me = s.me;
      const snap = s.snapshot && typeof s.snapshot === 'object' && s.snapshot.state ? s.snapshot : null;
      this.snap = snap && m.snapshot_round ? { round: m.snapshot_round, state: snap.state } : null;
      this.cur = this.snap ? this.snap.round : (s.round ? s.round.n - 1 : 0);
      watcher = MATCH.watch(room.id, st => { this.s = st; this.lastOk = Date.now(); this.err = null; this.flush(); }, { onError: e => { this.err = e; this.flush(); } });
      return s;
    },
    flush() { const w = waiters; waiters = []; w.forEach(f => { if (!f.done()) waiters.push(f); }); },
    refresh() { return watcher ? watcher.refresh() : Promise.resolve(); },
    /* espera ate pred(estado) ser verdadeiro; devolve o estado (ou null se a partida acabou / saiu) */
    wait(pred, opts) {
      opts = opts || {};
      return new Promise(res => {
        let fin = false, t = null;
        const done = () => {
          if (fin) return true;
          const s = this.s;
          if (stopped || (opts.cancel && opts.cancel())) { fin = true; clearTimeout(t); res(null); return true; }
          if (s && pred(s)) { fin = true; clearTimeout(t); res(s); return true; }
          return false;
        };
        if (done()) return;
        waiters.push({ done });
        if (opts.timeout) t = setTimeout(() => { if (!fin) { fin = true; res(null); } }, opts.timeout);
        this.refresh();
      });
    },
    /* a rodada do servidor para a rodada n do jogo */
    waitNext(cancel) { return this.wait(s => !!(s.round && s.round.n > this.cur) || (s.match && s.match.status !== 'playing'), { cancel }); },
    stop() { stopped = true; if (watcher) watcher.stop(); flushAll(); },
    /* estado compartilhado (sem ouro, mochila, loja e estatisticas, que sao de cada aparelho) */
    pack(state) { const o = {}; SHARED.forEach(k => { o[k] = clone(state[k]); }); return o; },
    unpack(state, o) { SHARED.forEach(k => { if (o[k] !== undefined) state[k] = clone(o[k]); }); },
    /* guarda o estado do fim da rodada n do jogo (o primeiro a gravar vale) */
    async putSnapshot(state, n) {
      try { await MATCH.snapshot(this.matchId, n, { state: this.pack(state) }); } catch (e) { /* ja gravado por outro aparelho */ }
    }
  });
  function flushAll() { const w = waiters; waiters = []; w.forEach(f => f.done()); }
  addEventListener('pagehide', () => { /* nada a fazer: o servidor ve a ausencia pela presenca */ });
})();
