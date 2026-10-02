/* Lobby de grupos — Banco de Dados I RPG
   Cada classe = 1 grupo de até 7 jogadores. Moedas, inventário e votos são do grupo.
   LOBBY é um adaptador: esta versão guarda tudo em localStorage (só um aparelho enxerga).
   Para contar jogadores de verdade entre celulares, troque as funções por Supabase/Firebase (próxima etapa).
*/
const LOBBY_GROUPS = {
  mage:{name:'MAGO', color:'#4da3ff'},
  knight:{name:'GUERREIRO', color:'#ff5a4d'},
  tank:{name:'TANQUE', color:'#cfd8ff'},
  assassin:{name:'CLÉRIGA', color:'#ffd24d'}
};
const LOBBY_MAX = 7;

const LOBBY = (() => {
  const KEY = 'bd1_lobby', ME = 'bd1_player_id', SEED = 'bd1_lobby_seeded';
  const params = new URLSearchParams(location.search);
  if (params.get('reset')) { localStorage.removeItem(KEY); localStorage.removeItem(SEED); }
  // Modo de teste persiste entre lobby e jogo (?teste=1 liga, ?teste=0 desliga).
  if (params.get('teste') === '1') localStorage.setItem('bd1_test','1');
  if (params.get('teste') === '0') localStorage.removeItem('bd1_test');
  const TEST = localStorage.getItem('bd1_test') === '1';
  const myId = localStorage.getItem(ME) || (() => { const id = 'p' + Math.random().toString(36).slice(2, 10); localStorage.setItem(ME, id); return id; })();
  const empty = () => Object.fromEntries(Object.keys(LOBBY_GROUPS).map(g => [g, []]));
  function read(){ try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) return {...empty(), ...d}; } catch {} return empty(); }
  function write(d){ localStorage.setItem(KEY, JSON.stringify(d)); }
  // ?teste=1 → finge que outros jogadores já entraram (o cavaleiro aparece lotado).
  if (TEST && !localStorage.getItem(SEED)) {
    const d = read(); const fill = {mage:4, knight:7, tank:5, assassin:2};
    for (const g in fill) for (let i = d[g].filter(x => x !== myId).length; i < fill[g]; i++) d[g].push(`bot-${g}-${i}`);
    write(d); localStorage.setItem(SEED, '1');
  }
  return {
    myId, testMode: TEST,
    counts(){ const d = read(), o = {}; for (const g in LOBBY_GROUPS) o[g] = d[g].length; return o; },
    myGroup(){ const d = read(); return Object.keys(LOBBY_GROUPS).find(g => d[g].includes(myId)) || null; },
    join(g){
      const d = read();
      if (!LOBBY_GROUPS[g]) return {ok:false, reason:'invalid'};
      if (d[g].includes(myId)) return {ok:true};
      if (d[g].length >= LOBBY_MAX) return {ok:false, reason:'full'};
      for (const k in d) d[k] = d[k].filter(x => x !== myId);   // um jogador, um grupo
      d[g].push(myId); write(d); return {ok:true};
    },
    setTest(on){
      if (on) { localStorage.setItem('bd1_test','1'); localStorage.removeItem(SEED); }
      else { localStorage.removeItem('bd1_test'); localStorage.removeItem(KEY); localStorage.removeItem(SEED); }
    },
    leave(){ const d = read(); for (const k in d) d[k] = d[k].filter(x => x !== myId); write(d); }
  };
})();
