/* Banco de Dados I — RPG
   Front-end mobile build. The supplied PNG remains the visual base.
   Moedas/itens salvos por grupo em localStorage. Votação multiplayer real entre celulares precisa de backend (próxima etapa).
*/

// difficulty: 1 fácil, 2 média, 3 difícil. Dano do contra-ataque e tipo do ataque vêm de DIFFICULTY.
const DIFFICULTY = {
  1:{label:'FÁCIL',   type:'ATAQUE FÍSICO',  damage:18, reward:1, aoe:3},
  2:{label:'MÉDIA',   type:'ATAQUE SOMBRIO', damage:32, reward:2, aoe:5},
  3:{label:'DIFÍCIL', type:'ATAQUE MÍSTICO', damage:50, reward:3, aoe:9}
};
const QUESTIONS = [
  {difficulty:1, text:'Qual das alternativas abaixo representa uma chave primária em um banco de dados?', answers:['Uma tabela de relacionamento','Um campo que identifica unicamente um registro','Um índice não clusterizado','Um comando de seleção'], correct:1},
  {difficulty:1, text:'Qual comando SQL é utilizado para consultar dados de uma tabela?', answers:['INSERT','UPDATE','SELECT','DROP'], correct:2},
  {difficulty:1, text:'O que significa a sigla SGBD?', answers:['Sistema Geral de Banco Digital','Sistema Gerenciador de Banco de Dados','Servidor Gráfico de Base de Dados','Sistema Global de Backup de Dados'], correct:1},
  {difficulty:1, text:'Qual comando SQL remove registros de uma tabela?', answers:['REMOVE','CUT','ERASE','DELETE'], correct:3},
  {difficulty:2, text:'Qual propriedade garante que uma chave primária não se repita?', answers:['Unicidade','Ordenação','Criptografia','Compactação'], correct:0},
  {difficulty:2, text:'Qual cláusula SQL filtra as linhas antes de agrupar os resultados?', answers:['HAVING','WHERE','ORDER BY','LIMIT'], correct:1},
  {difficulty:2, text:'Qual JOIN retorna apenas os registros com correspondência nas duas tabelas?', answers:['LEFT JOIN','RIGHT JOIN','INNER JOIN','CROSS JOIN'], correct:2},
  {difficulty:2, text:'O que é uma chave estrangeira?', answers:['Campo que referencia a chave primária de outra tabela','Chave usada para criptografar dados','Índice que ordena a tabela','Campo que aceita apenas números'], correct:0},
  {difficulty:3, text:'Qual forma normal elimina dependências parciais em chaves primárias compostas?', answers:['1FN','2FN','3FN','FNBC'], correct:1},
  {difficulty:3, text:'No ACID, qual propriedade garante que dados confirmados sobrevivam a falhas?', answers:['Atomicidade','Consistência','Isolamento','Durabilidade'], correct:3},
  {difficulty:3, text:'Qual cláusula filtra os grupos formados por um GROUP BY?', answers:['WHERE','HAVING','DISTINCT','UNION'], correct:1},
  {difficulty:3, text:'Qual nível de isolamento evita leituras sujas, mas permite leituras não repetíveis?', answers:['READ UNCOMMITTED','READ COMMITTED','REPEATABLE READ','SERIALIZABLE'], correct:1}
];

// Banco de ações do Mercador: cada item vira uma pergunta de votação. Para criar ações novas, adicione aqui.
const ITEMS = {
  hp:{name:'Poção de HP', ask:'Comprar poção de HP?', price:10, kind:'hp', amount:35, icon:'potion_hp.png'},
  mana:{name:'Poção de Mana', ask:'Comprar poção de mana?', price:3, kind:'mp', amount:35, icon:'potion_mana.png'}
};

// ===== Configuração do combate (ajuste aqui) =====
const HERO_ORDER = ['mage','knight','tank','assassin'];
const HERO_COLOR = {mage:'#4d8dff', knight:'#d9e6ff', tank:'#ff9d3d', assassin:'#ff3d5c'};
const HERO_X = {mage:12.2, knight:36.1, tank:63.3, assassin:87.4};   // centro do herói (% da largura)
const BOSS_MAX_HP = 450, HERO_MAX_HP = 100;
const ATTACK_DAMAGE = 14;          // dano do ataque básico (quando acertou a pergunta)
const DEFEND_REDUCTION = 0.5;      // defesa reduz o dano pela metade
const RAGE_MAX = 5, RAGE_DODGE = 1, RAGE_WASTED = 5;   // fúria: esquivar após errar +1; defender/esquivar após ACERTAR +5 (enche)
const QUESTION_SECONDS = 15, ACTION_SECONDS = 10;
const ULT_NAME = {mage:'Buraco Negro', knight:'Berserk', tank:'Provocação', assassin:'Luz Sagrada'};
const ULT_ICON = {mage:'orb', knight:'sword2', tank:'hammer2', assassin:'cross'};
const ULT_INFO = {mage:'dano em dobro nesta pergunta', knight:'ataca mesmo errando, com 1,5x de dano, e leva menos dano por 2 perguntas', tank:'todo o dano do boss vai nele (inclusive metade da Onda Sombria dos aliados), com defesa dobrada, por 2 perguntas', assassin:'revive ou cura um herói'};
const HARD_EVERY = 5;   // a cada 5 perguntas sem difícil, a próxima é difícil
const HEAL_AMOUNT = 25, REVIVE_HP = 35;
// Reações entre elementos (Maga): dois elementos diferentes marcados no boss explodem em bônus de dano.
const REACTIONS = {
  'air+fire':{name:'Explosão', dmg:10}, 'fire+water':{name:'Vapor', dmg:8}, 'earth+water':{name:'Lama', dmg:4, rage:-2},
  'air+earth':{name:'Tempestade de Areia', dmg:8}, 'earth+fire':{name:'Magma', dmg:12}, 'air+water':{name:'Gelo', dmg:8}
};

// ===== Atributos do ataque do boss =====
const ELEMENTS = {
  fire:{name:'FOGO', color:'#ff7a2e'}, water:{name:'ÁGUA', color:'#3db4ff'},
  air:{name:'AR', color:'#9fe8d0'}, earth:{name:'TERRA', color:'#c19a52'},
  demon:{name:'DEMONÍACO', color:'#b36bff'}, holy:{name:'SAGRADO', color:'#ffe08a'}
};
// Imunidades do boss: só o SAGRADO o afeta. Elementos comuns não causam dano, marcas nem reações; escudos só ganham bônus contra o que o fere.
const BOSS = {weak:['holy'], immune:['fire','water','air','earth']};
const BOSS_FAMILY = 'DEMONÍACO';   // o boss é demônio/vampiro: todo dano dele é demoníaco
const BOSS_ATTACK = {tipo:'FÍSICO', attr:'demon'};   // o boss ataca fisicamente, com atributo demoníaco/vampírico

// ===== Habilidades por classe =====
// kind: atk | def | dodge | util. mult: multiplicador do dano base. reduce: fração do dano do boss que a defesa corta.
// cd: perguntas de recarga. mana: custo. elem:true = pede o elemento depois. soon:true = efeito chega na etapa 2.
const SKILLS = {
  mage:[
    {id:'mana_atk', kind:'atk', name:'Ataque de Mana', desc:'Raio de mana. Dano normal.', mana:10, cd:0, mult:1},
    {id:'elem_atk', kind:'atk', name:'Ataque Elemental', desc:'Fogo, água, ar ou terra. O Lorde das Trevas é imune a elementos.', mana:20, cd:1, mult:1.3, elem:true},
    {id:'mana_def', kind:'def', name:'Escudo de Mana', desc:'Barreira de mana. Corta 50% do dano.', mana:10, cd:0, reduce:.5},
    {id:'elem_def', kind:'def', name:'Escudo Elemental', desc:'Escudo de um elemento. Só ganha bônus contra o elemento certo.', mana:20, cd:1, reduce:.5, bonus:.65, elem:true},
    {id:'dodge', kind:'dodge', name:'Esquiva', desc:'Foge do ataque.', mana:0, cd:1}
  ],
  knight:[
    {id:'atk', kind:'atk', name:'Ataque Normal', desc:'Golpe de espada. Dano normal.', mana:0, cd:0, mult:1},
    {id:'heavy', kind:'atk', name:'Ataque Pesado', desc:'1,5x o dano normal.', mana:15, cd:1, mult:1.5},
    {id:'pass', kind:'util', name:'Passar a Vez', desc:'Sem ação nem contra-ataque. O aliado escolhido ganha um ataque extra (1,5x) se acertar.', mana:0, cd:0, target:true},
    {id:'def', kind:'def', name:'Defesa', desc:'Ergue o escudo. Corta 50% do dano.', mana:0, cd:0, reduce:.5},
    {id:'dodge', kind:'dodge', name:'Esquiva', desc:'Foge do ataque.', mana:0, cd:1}
  ],
  tank:[
    {id:'atk', kind:'atk', name:'Ataque Normal', desc:'Golpe de martelo. Dano normal.', mana:0, cd:0, mult:1},
    {id:'super', kind:'atk', name:'Ataque Super Pesado', desc:'2x o dano normal.', mana:25, cd:2, mult:2},
    {id:'guard', kind:'util', name:'Proteção Específica', desc:'Escudo sobre 1 herói: o dano dele vai para o Tanque, com 40% a menos.', mana:20, cd:2, target:true},
    {id:'def', kind:'def', name:'Defesa', desc:'Ergue o escudo. Corta 50% do dano.', mana:0, cd:0, reduce:.5},
    {id:'dodge', kind:'dodge', name:'Esquiva', desc:'Foge do ataque.', mana:0, cd:1}
  ],
  assassin:[
    {id:'atk', kind:'atk', name:'Ataque Normal', desc:'Golpe de cajado. Dano normal.', mana:0, cd:0, mult:1},
    {id:'holy_atk', kind:'atk', name:'Ataque Sagrado', desc:'1,5x de dano em demônios, como o boss.', mana:20, cd:1, mult:1.5},
    {id:'def', kind:'def', name:'Defesa Normal', desc:'Ergue as mãos. Corta 50% do dano.', mana:0, cd:0, reduce:.5},
    {id:'holy_def', kind:'def', name:'Defesa Sagrada', desc:'1,5x de defesa contra demônios.', mana:20, cd:1, reduce:.5, bonus:.75, holy:true},
    {id:'dodge', kind:'dodge', name:'Esquiva', desc:'Foge do ataque.', mana:0, cd:1}
  ]
};
// Tipo/atributo e ícone de cada habilidade (Guerreiro e Tanque: só físico; Maga: mágico + mana/elemento; Clériga: físico, sagrado nas especiais)
const SKILL_META = {
  mage:{mana_atk:['MÁGICO','MANA','orb'], elem_atk:['MÁGICO','ELEMENTAL','fire'], mana_def:['MÁGICO','MANA','shield'], elem_def:['MÁGICO','ELEMENTAL','drop'], dodge:[null,null,'dodge']},
  knight:{atk:['FÍSICO',null,'sword'], heavy:['FÍSICO',null,'sword2'], pass:[null,null,'pass'], def:['FÍSICO',null,'shield'], dodge:[null,null,'dodge']},
  tank:{atk:['FÍSICO',null,'hammer'], super:['FÍSICO',null,'hammer2'], guard:[null,null,'guard'], def:['FÍSICO',null,'shield'], dodge:[null,null,'dodge']},
  assassin:{atk:['FÍSICO',null,'staff'], holy_atk:['FÍSICO','SAGRADO','cross'], def:['FÍSICO',null,'shield'], holy_def:['FÍSICO','SAGRADO','cross'], dodge:[null,null,'dodge']}
};
Object.keys(SKILLS).forEach(k => SKILLS[k].forEach(s => { const m = SKILL_META[k][s.id] || []; s.tipo = m[0]; s.attr = m[1]; s.icon = m[2]; }));
const MANA_REGEN = 8;   // mana recuperada por pergunta
const KIND_LABEL = {atk:'ATAQUE', def:'DEFESA', dodge:'ESQUIVA', util:'TÁTICA'};

const GROUPS = {mage:'MAGO', knight:'GUERREIRO', tank:'TANQUE', assassin:'CLÉRIGA'};
const PARAMS = new URLSearchParams(location.search);
// O grupo vem do lobby (página inicial). ?grupo=... só vale junto com ?teste=1.
const TEST_MODE = LOBBY.testMode; // simula os outros 6 jogadores votando
const GROUP_KEY = (TEST_MODE && GROUPS[PARAMS.get('grupo')]) ? PARAMS.get('grupo') : LOBBY.myGroup();
if (!GROUP_KEY) { location.replace('index.html'); }
const activeGroup = GROUP_KEY || 'mage';

// Moedas e itens são independentes por grupo (uma chave de save por classe).
if (PARAMS.get('reset')) Object.keys(GROUPS).forEach(g => localStorage.removeItem(`bd1_save_${g}`));
const SAVE_KEY = `bd1_save_${activeGroup}`;
function loadSave(){
  try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d && typeof d.gold === 'number' && Array.isArray(d.inventory)) return d; } catch {}
  return {gold:10, inventory:[]};
}
const saved = loadSave();

const state = {
  gold:saved.gold, question:0, answered:false,
  inventory:saved.inventory, pendingAction:null, myVote:null, voteLocked:false,
  // todos começam com vida e mana cheias
  heroes:Object.fromEntries(['mage','knight','tank','assassin'].map(k => [k, {hp:100, mp:100}])),
  bossHp:450, rage:0, hardNext:false, over:false,
  cd:{mage:{},knight:{},tank:{},assassin:{}}, marks:[], buff:{bh:0, bers:0, tired:0, taunt:0}, guardFor:null,         // recarga das habilidades (perguntas restantes)
  curAttack:BOSS_ATTACK,
  ultReady:{mage:false,knight:false,tank:false,assassin:false},   // carrega ao acertar pergunta difícil
  curQ:null, lastQ:{1:-1,2:-1,3:-1}
};
function persist(){ localStorage.setItem(SAVE_KEY, JSON.stringify({gold:state.gold, inventory:state.inventory})); }

const $ = s => document.querySelector(s);
const wait = ms => new Promise(r=>setTimeout(r,ms));
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),1800)}
let votes = {yes:0, no:0};
let botTimers = [], voteTimer = null, voteEndsAt = 0;
const VOTE_SECONDS = 10;

function renderGold(){ $('#gold-hud').textContent = state.gold; }

// Quantas pessoas estão no grupo agora (mínimo 1) e quantos votos formam maioria.
function groupMembers(){ return Math.max(1, LOBBY.counts()[activeGroup] || 0); }
function majorityOf(n){ return Math.floor(n / 2) + 1; }

function updateVoteUI(){
  $('#yes-count').textContent = votes.yes;
  $('#no-count').textContent = votes.no;
  document.querySelectorAll('.vote-choice').forEach(b => {
    b.classList.toggle('selected', b.dataset.vote === state.myVote);
    b.disabled = state.voteLocked;
  });
}
function showMerchantText(text){ $('#merchant-question').textContent = text; }

function openMerchantVote(text, action){
  votes = {yes:0, no:0};
  state.pendingAction = action; state.myVote = null; state.voteLocked = false;
  state.voters = groupMembers(); state.need = majorityOf(state.voters);
  showMerchantText(text);
  $('#merchant-vote').classList.add('open');
  updateVoteUI();
  startVoteTimer();
  if (TEST_MODE) startBots();
}
function closeMerchantVote(){
  clearBots(); stopVoteTimer();
  state.pendingAction = null; state.myVote = null; state.voteLocked = false;
  votes = {yes:0, no:0};
  $('#merchant-vote').classList.remove('open');   // volta a mostrar só "Mercador:"
  $('#merchant-timer').textContent = '';
  showMerchantText('');
}

function startVoteTimer(){
  stopVoteTimer();
  voteEndsAt = Date.now() + VOTE_SECONDS * 1000;
  const tick = () => {
    const left = Math.max(0, Math.ceil((voteEndsAt - Date.now()) / 1000));
    $('#merchant-timer').textContent = left + 's';
    $('#merchant-vote').classList.toggle('urgent', left <= 3);
    if (left <= 0) { stopVoteTimer(); onTimeUp(); }
  };
  tick(); voteTimer = setInterval(tick, 250);
}
function stopVoteTimer(){ clearInterval(voteTimer); voteTimer = null; $('#merchant-vote').classList.remove('urgent'); }

function vote(choice){
  if (!state.pendingAction || state.voteLocked) return;
  if (state.myVote === choice) return;
  if (state.myVote) votes[state.myVote] = Math.max(0, votes[state.myVote] - 1);
  votes[choice]++; state.myVote = choice;
  updateVoteUI();
  checkVoteResult();
}

// Decide assim que a maioria do grupo votou igual, ou quando todos já votaram (empate possível com número par).
function checkVoteResult(){
  if (!state.pendingAction || state.voteLocked) return;
  if (votes.yes >= state.need) return resolveVote('yes');
  if (votes.no >= state.need) return resolveVote('no');
  if (votes.yes + votes.no >= state.voters) resolveVote(votes.yes === votes.no ? 'tie' : (votes.yes > votes.no ? 'yes' : 'no'));
}
// Fim dos 10s: vale o que foi votado até agora.
function onTimeUp(){
  if (!state.pendingAction || state.voteLocked) return;
  if (votes.yes + votes.no === 0) return resolveVote('timeout');
  resolveVote(votes.yes === votes.no ? 'tie' : (votes.yes > votes.no ? 'yes' : 'no'));
}

async function resolveVote(result){
  const action = state.pendingAction; if (!action || state.voteLocked) return;
  state.voteLocked = true; clearBots(); stopVoteTimer(); updateVoteUI();
  let msg;
  if (action.type === 'ult') {
    msg = result === 'yes' ? 'Ultimate liberado!' : result === 'no' ? 'Recusado.' : result === 'tie' ? 'Empate. Guardado.' : 'Tempo esgotado.';
    showMerchantText(msg); await wait(1200); const done = state.ultDone; closeMerchantVote();
    if (done) { state.ultDone = null; done(result === 'yes'); }
    return;
  }
  if (result === 'yes') msg = executeBuy(action.item) ? 'Comprada!' : 'Não foi possível.';
  else if (result === 'no') msg = 'Recusado.';
  else if (result === 'tie') msg = 'Empate. Nada comprado.';
  else msg = 'Tempo esgotado.';
  showMerchantText(msg);
  await wait(1200);
  closeMerchantVote();
}

// Pergunta ao grupo (via Mercador) se vai usar o ultimate; resolve true/false.
async function askUlt(hero){
  while (state.pendingAction || state.voteLocked) await wait(300);
  return new Promise(res => { state.ultDone = res; showBanner(`ULTIMATE PRONTO: ${GROUPS[hero]}`, ULT_NAME[hero]); openMerchantVote('Usar ULTIMATE?', {type:'ult', hero}); }).then(r => { hideBanner(); return r; });
}
function requestBuy(type){
  const item = ITEMS[type];
  if (state.pendingAction || state.voteLocked) { toast('Já existe uma votação aberta.'); return; }
  if (state.gold < item.price) { toast('Moedas insuficientes.'); return; }
  if (state.inventory.length >= 6) { toast('Mochila cheia.'); return; }
  openMerchantVote(item.ask, {type:'buy', item:type});
}
function executeBuy(type){
  const item = ITEMS[type];
  if (state.gold < item.price) { toast('Moedas insuficientes.'); return false; }
  if (state.inventory.length >= 6) { toast('Mochila cheia.'); return false; }
  state.gold -= item.price; state.inventory.push(type);
  persist(); renderGold(); renderInventoryHits();
  return true;
}

// Modo de teste: os outros membros do grupo (todos menos você) votam sozinhos, em tempos diferentes.
function clearBots(){ botTimers.forEach(clearTimeout); botTimers = []; }
function startBots(){
  clearBots();
  for (let i = 0; i < state.voters - 1; i++) {
    botTimers.push(setTimeout(() => {
      if (!state.pendingAction || state.voteLocked) return;
      votes[Math.random() < 0.6 ? 'yes' : 'no']++;
      updateVoteUI(); checkVoteResult();
    }, 900 + i * 900 + Math.random() * 500));
  }
}

// ===== HUD dinâmico: barras de vida/mana dos heróis, vida do boss e fúria =====
const HUD = {
  boss:{x:251, y:70, w:525, h:19},
  icons:{mage:80, knight:318, tank:562, assassin:804},
  rage:{x:300, y:100, w:424, h:17},
  heroes:{mage:[128,766,89], knight:[367,766,87], tank:[609,766,89], assassin:[852,766,88]}   // [x, y_vida, largura]
};
const pctX = x => (x / 1024 * 100) + '%', pctY = y => (y / 1536 * 100) + '%';
function mkBar(cls, x, y, w, h){
  const d = document.createElement('div'); d.className = `hud-bar ${cls}`;
  d.style.cssText = `left:${pctX(x)};top:${pctY(y)};width:${pctX(w)};height:${pctY(h)}`;
  d.innerHTML = '<i></i>'; $('#game').appendChild(d); return d.querySelector('i');
}
const bars = {};
function buildHud(){
  bars.boss = mkBar('boss', HUD.boss.x, HUD.boss.y, HUD.boss.w, HUD.boss.h);
  HERO_ORDER.forEach(k => {
    const [x, y, w] = HUD.heroes[k];
    bars[k] = {hp: mkBar('hp', x, y, w, 10), mp: mkBar('mp', x, y + 20, Math.round(w * 0.976 * 10) / 10, 9)};
  });
  HERO_ORDER.forEach(k => {
    const d = document.createElement('div'); d.className = 'ult-icon'; d.dataset.hero = k;
    const ix = HUD.icons[k];
    d.style.cssText = `left:${pctX(ix)};top:${pctY(757)};width:${pctX(44)};height:${pctY(44)};background-position:${ix / (1024 - 44) * 100}% ${757 / (1536 - 44) * 100}%`;
    d.onclick = () => { if (k !== activeGroup || !state.ultReady[k]) return; const c = document.querySelector('#am-list .act-card.ult:not(:disabled)'); if (c) c.click(); else toast('O especial é ativado na vez do seu herói, no menu de habilidades.'); };
    $('#game').appendChild(d); bars['ult_' + k] = d;
  });
  HERO_ORDER.forEach(k => {
    const s = document.createElement('div'); s.className = 'hero-status'; s.hidden = true;
    s.style.cssText = `left:${pctX(HUD.icons[k])};top:${pctY(800)};width:${pctX(150)}`; $('#game').appendChild(s); bars['st_' + k] = s;
  });
  const mk = document.createElement('div'); mk.className = 'boss-marks'; mk.style.cssText = `left:${pctX(HUD.rage.x)};top:${pctY(122)}`; $('#game').appendChild(mk); bars.marks = mk;
  const r = document.createElement('div'); r.className = 'rage';
  r.style.cssText = `left:${pctX(HUD.rage.x - 62)};top:${pctY(HUD.rage.y)};width:${pctX(HUD.rage.w + 62)};height:${pctY(HUD.rage.h)}`;
  r.innerHTML = '<span class="rage-label">FÚRIA</span><div class="rage-seg">' + '<b></b>'.repeat(RAGE_MAX) + '</div>';
  $('#game').appendChild(r); bars.rage = r;
}
function renderHud(){
  const b = state.buff, st = {mage: b.bh > 0 ? 'BURACO NEGRO x2' : '', knight: b.bers > 0 ? `BERSERK ${b.bers}` : b.tired > 0 ? 'EXAUSTO' : '', tank: b.taunt > 0 ? `PROVOCAÇÃO ${b.taunt}` : '', assassin: ''};
  HERO_ORDER.forEach(k => { const el = bars['st_' + k]; if (!el) return; el.textContent = st[k]; el.hidden = !st[k]; el.classList.toggle('bad', k === 'knight' && b.tired > 0); });
  const mk = bars.marks; if (mk) mk.innerHTML = state.marks.length ? '<span>MARCAS</span>' + state.marks.map(e => `<img src="${pixIcon({fire:'fire',water:'drop',air:'wind',earth:'rock'}[e])}" alt="${ELEMENTS[e].name}">`).join('') : '';
  bars.boss.style.width = Math.max(0, state.bossHp / BOSS_MAX_HP * 100) + '%';
  HERO_ORDER.forEach(k => {
    bars[k].hp.style.width = Math.max(0, state.heroes[k].hp / HERO_MAX_HP * 100) + '%';
    bars[k].mp.style.width = Math.max(0, state.heroes[k].mp / 100 * 100) + '%';
  });
  HERO_ORDER.forEach(k => bars['ult_' + k].classList.toggle('ready', !!state.ultReady[k]));
  bars.rage.querySelectorAll('.rage-seg b').forEach((el, i) => el.classList.toggle('on', i < state.rage));
  bars.rage.classList.toggle('full', state.rage >= RAGE_MAX);
}

// ===== Painel (pergunta / ação) =====
function openPanel(){ $('#action-menu').hidden = true; $('#dynamic-question').classList.remove('exiting'); $('#dynamic-ui').hidden = false; $('#dynamic-question').hidden = false; }
function openMenu(){ $('#dynamic-question').hidden = true; const m = $('#action-menu'); m.classList.remove('exiting'); m.hidden = false; $('#dynamic-ui').hidden = false; }
function attackChips(at){
  if (!at) return '';
  const e = ELEMENTS[at.attr];
  return `<span class="chip"><small>TIPO</small><b>${at.tipo}</b></span>` +
         `<span class="chip" style="--ec:${e.color}"><small>ATRIBUTO</small><b><i class="dot"></i>${e.name}</b></span>`;
}
async function closePanel(){
  const m = $('#action-menu'), q = $('#dynamic-question'), ui = $('#dynamic-ui');
  const dq = !m.hidden ? m : q; dq.classList.add('exiting'); await wait(250);
  // some por completo (nada fica na tela durante a resolução)
  m.hidden = true; q.hidden = true; ui.hidden = true; m.classList.remove('exiting'); q.classList.remove('exiting');
}
// ===== Pixel art gerado em código (sprites 11x11 em string -> imagem sem suavização) =====
const PAL = {k:'#0b0814',W:'#f4f1ff',S:'#9aa3c2',Y:'#ffc54e',y:'#ffe9a0',B:'#7a4a22',R:'#e0392d',O:'#ff8a2a',b:'#2f6fe0',l:'#6fb4ff',c:'#8fe8d4',t:'#a8864a',T:'#7a5e30',D:'#4d3a1c',G:'#c9d4ff',P:'#b36bff',g:'#5ee08a'};
const SPR = {
  sword:['.........WW','........WWS','.......WWS.','......WWS..','.....WWS...','.Y..WWS....','..YWWS.....','...YYY.....','..BYYY.....','.BB.Y......','BB.........'],
  sword2:['.........WW','.......RWWS','......RWWS.','.....RWWS..','....RWWS...','.Y.RWWS....','..YWWS.....','...YYY.....','..BYYY.....','.BB.Y......','BB.........'],
  hammer:['.TTTTTTT...','TTGGGGGTT..','TTGGGGGTT..','.TTTTTTT...','...BB......','...BB......','...BB......','...BB......','...BB......','...BB......','...BB......'],
  hammer2:['RTTTTTTTR..','TTGGGGGTT..','TTGGWWGTT..','RTTTTTTTR..','...BB......','...BB......','...BB......','...BB......','...BB......','...BB......','...BB......'],
  shield:['.YYYYYYYYY.','YllllbbbbbY','YllllbbbbbY','YllllbbbbbY','YllllbbbbbY','.YlllbbbbY.','.YlllbbbbY.','..YllbbbY..','...YlbbY...','....YbY....','.....Y.....'],
  guard:['.YYYYYYYYY.','YllllWbbbbY','YllllWbbbbY','YlWWWWWWbbY','YllllWbbbbY','.YlllWbbbY.','.YlllWbbbY.','..YllWbbY..','...YlbbY...','....YbY....','.....Y.....'],
  orb:['....bbb....','..bbllllb..','.bllWWllbb.','.blWWlllbb.','bllWllllllb','bllllllllbb','bllllllllbb','.bllllllbb.','.bbllllbb..','..bbbbbb...','....bbb....'],
  back:['...........','...WW......','..WW.......','.WWWWWWWWW.','WWWWWWWWWWW','.WWWWWWWWW.','..WW.......','...WW......','...........','...........','...........'],
  dodge:['...........','gg....gg...','.gg....gg..','..gg....gg.','...gg....gg','....gg....g','...gg....gg','..gg....gg.','.gg....gg..','gg....gg...','...........'],
  pass:['.....G.....','.....GG....','.....GGG...','GGGGGGGGG..','GGGGGGGGGG.','GGGGGGGGG..','.....GGG...','.....GG....','.....G.....','...........','...........'],
  fire:['.....R.....','....RR.....','...RRRR....','...RROR.R..','..RRROORR..','.RRROOOORR.','.RROOYYORR.','.RROYYYYOR.','.RROYYYYOR.','..RROYYOR..','...RRRRR...'],
  drop:['.....b.....','.....b.....','....bbb....','....bbb....','...bbllb...','..bbllllb..','.bbllWlllb.','.bblWWlllb.','.bbllllllb.','..bbllllb..','...bbbbb...'],
  wind:['...........','..cccccc...','.c......c..','.......cc..','.cccccc....','...........','cccccccc...','.......c...','.c....cc...','..cccc.....','...........'],
  rock:['...........','....tttt...','...tGGGtt..','..tGGGGTtt.','.tGGGGGTTt.','.tGGGTTTTt.','tGGGTTTTTTt','tGTTTTTTTDt','.tTTTTTDDt.','..ttDDDDt..','....tttt...'],
  cross:['....YYY....','....YWY....','....YWY....','YYYYYWYYYYY','YWWWWWWWWWY','YYYYYWYYYYY','....YWY....','....YWY....','....YWY....','....YWY....','....YYY....'],
  staff:['.....y.....','....yYy....','.....y.....','.....Y.....','.....B.....','.....B.....','.....B.....','.....B.....','.....B.....','.....B.....','.....B.....'],
  arrow:['kkkkkkkkkkkkk','kYYYYYYYYYYYk','.kYYyYYYYYYk.','..kYYyYYYYk..','...kYYYYYk...','....kYYYk....','.....kYk.....','......k......']
};
const _pix = {};
function pixIcon(name, repl){
  const key = name + (repl ? JSON.stringify(repl) : ''); if (_pix[key]) return _pix[key];
  const rows = SPR[name], w = Math.max(...rows.map(r => r.length)), c = document.createElement('canvas'); c.width = w; c.height = rows.length;
  const g = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = (repl && repl[ch]) || PAL[ch] || '#f0f'; g.fillRect(x, y, 1, 1); }));
  return _pix[key] = c.toDataURL();
}
// anel pixelado achatado (perspectiva do chão) com degraus
function pixRing(color){
  const w = 48, h = 15, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (x + .5 - w / 2) / (w / 2), dy = (y + .5 - h / 2) / (h / 2), d = dx * dx + dy * dy;
    if (d <= 1 && d > .72) { g.fillStyle = (x + y) % 6 < 3 ? color : '#fff6d0'; g.fillRect(x, y, 1, 1); }
    else if (d <= .72 && d > .5) { g.fillStyle = color + '55'; g.fillRect(x, y, 1, 1); }
  }
  return c.toDataURL();
}
// Marcador da vez: seta pixelada flutuando, moldura dourada no HUD do herói, anel e feixe de luz no chão
function showRing(hero){
  hideRing();
  const col = HERO_COLOR[hero], m = document.createElement('div'); m.id = 'turn-marker'; m.className = 'turn-marker';
  const x = HERO_X[hero];
  const [ix] = [HUD.icons[hero]], hx = HUD.heroes[hero], fx = ix - 4, fw = hx[0] + hx[2] - ix + 8;
  m.style.setProperty('--col', col);
  m.innerHTML =
    `<div class="tm-beam" style="left:${x}%"></div>` +
    `<img class="tm-ring" style="left:${x}%" src="${pixRing(col)}" alt="">` +
    `<div class="tm-frame" style="left:${pctX(fx)};top:${pctY(752)};width:${pctX(fw)};height:${pctY(40)}"></div>` +
    `<img class="tm-arrow" style="left:${x}%" src="${pixIcon('arrow')}" alt="">`;
  $('#game').appendChild(m);
}
function hideRing(){ const m = $('#turn-marker'); if (m) m.remove(); }
function showBanner(t, sub){ const b=$('#turn-banner'); b.innerHTML=`${t}<small>${sub||''}</small>`; b.classList.add('show'); }
function hideBanner(){ $('#turn-banner').classList.remove('show'); }
function floatText(xPct, yPct, text, color){
  const d = document.createElement('div'); d.className = 'dmg-float'; d.textContent = text;
  d.style.left = xPct + '%'; d.style.top = yPct + '%'; d.style.color = color || '#ffd24d';
  $('#game').appendChild(d); setTimeout(() => d.remove(), 1000);
}
function flashHit(){
  const fl = $('#damage-flash'); fl.classList.remove('active'); void fl.offsetWidth; fl.classList.add('active');
  const g = $('#game'); g.classList.remove('hit-shake'); void g.offsetWidth; g.classList.add('hit-shake');
}

// Votação genérica dentro do grupo: mostra contagem ao vivo (o grupo vê entre si), decide por maioria.
// Empate entre as mais votadas = sorteio; ninguém votou = null. O painel continua aberto ao terminar.
function runVote({type, text, options, seconds, side, menu, title, attack}){
  return new Promise(resolve => {
    const voters = groupMembers(), need = majorityOf(voters);
    const sv = options.map(() => 0); let my = null, locked = false, timer = null, bots = [];
    let list;
    if (menu) {
      $('#am-title').textContent = title; $('#am-text').textContent = text;
      $('#am-attack').innerHTML = attackChips(attack);
      $('#am-timer').innerHTML = `<span id="vote-timer" class="dq-side-timer">${seconds}s</span>`;
      list = $('#am-list');
    } else {
      $('#dq-attack').innerHTML = attackChips(attack);
      $('#dq-text').textContent = text;
      $('#dq-side').innerHTML = `${side || ''}<span id="vote-timer" class="dq-side-timer">${seconds}s</span>`;
      list = $('#dq-answers');
    }
    list.innerHTML = '';
    const enabled = options.map((o, i) => o.disabled ? -1 : i).filter(i => i >= 0);
    const btns = options.map((o, i) => {
      const b = document.createElement('button'); b.type = 'button';
      if (menu) {
        b.className = `act-card ${o.kind || ''}`;
        b.innerHTML = `<span class="ac-icon">${o.icon ? `<img src="${pixIcon(o.icon)}" alt="">` : ''}</span><span class="ac-name"></span><span class="ac-desc"></span><span class="ac-chips"></span><b class="cnt">0</b>`;
        b.querySelector('.ac-name').textContent = o.label; b.querySelector('.ac-desc').textContent = o.desc || '';
        b.querySelector('.ac-chips').innerHTML = o.chips || '';
        if (o.color) b.style.setProperty('--ec', o.color);
      } else {
        b.className = 'dq-answer';
        b.innerHTML = `<span class="letter">${String.fromCharCode(97 + i)})</span><span class="label"></span><b class="cnt">0</b>`;
        b.querySelector('.label').textContent = o.label + (o.note ? `  ${o.note}` : '');
      }
      if (o.disabled) { b.disabled = true; b.classList.add('off'); b.querySelector('.cnt').textContent = ''; }
      else b.onclick = () => pick(i);
      list.appendChild(b); return b;
    });
    const total = () => sv.reduce((a, c) => a + c, 0);
    const paint = (final) => btns.forEach((b, i) => { if (options[i].disabled) return; b.querySelector('.cnt').textContent = sv[i]; b.classList.toggle('selected', my === i && !final); });
    const top = () => { const m = Math.max(...sv); return {m, c: sv.map((v, i) => v === m ? i : -1).filter(i => i >= 0)}; };
    function pick(i){ if (locked || my === i) return; if (my !== null) sv[my]--; sv[i]++; my = i; paint(); check(); }
    function check(){
      if (locked) return;
      const idx = sv.findIndex(v => v >= need); if (idx >= 0) return finish(idx, false);
      if (total() >= voters) { const {c} = top(); finish(c[Math.floor(Math.random() * c.length)], c.length > 1); }
    }
    async function finish(idx, tie){
      if (locked) return; locked = true; clearInterval(timer); bots.forEach(clearTimeout);
      btns.forEach(b => b.disabled = true); paint(true);
      if (idx !== null) { btns[idx].classList.add('chosen'); if (tie) toast(`Empate! ${String.fromCharCode(97 + idx)}) sorteada.`); }
      resolve({idx, btns});
    }
    menu ? openMenu() : openPanel();
    const endsAt = Date.now() + seconds * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      const el = $('#vote-timer'); if (el) { el.textContent = left + 's'; el.classList.toggle('urgent', left <= 3); }
      if (left <= 0 && !locked) { clearInterval(timer); const {m, c} = top(); if (m === 0) finish(null, false); else finish(c[Math.floor(Math.random() * c.length)], c.length > 1); }
    };
    tick(); timer = setInterval(tick, 250);
    // modo teste: os outros membros do grupo votam sozinhos
    if (TEST_MODE) for (let i = 0; i < voters - 1; i++) bots.push(setTimeout(() => {
      if (locked) return; sv[enabled[Math.floor(Math.random() * enabled.length)]]++; paint(); check();
    }, 900 + i * 800 + Math.random() * 400));
  });
}

// ===== Rodada: pergunta → ações dos heróis → resolução =====
function pickQuestion(diff){
  const pool = QUESTIONS.map((q, i) => ({q, i})).filter(o => o.q.difficulty === diff);
  let c; do { c = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && c.i === state.lastQ[diff]);
  state.lastQ[diff] = c.i; return c.q;
}
const aliveHeroes = () => HERO_ORDER.filter(k => state.heroes[k].hp > 0);

async function bossIntro(){
  const game = $('#game');
  if (state.hardNext) {
    showBanner('O BOSS ENFURECEU!', 'pergunta difícil a caminho');
    flashHit(); await wait(1500); hideBanner();
    state.rage = 0; state.hardNext = false; renderHud();
  }
  game.classList.add('boss-attack'); await wait(1000); game.classList.remove('boss-attack');
}

// ---- alvos, ultimates e marcas ----
async function pickAlly(k, sk){
  const list = HERO_ORDER.filter(h => h !== k).map(h => state.heroes[h].hp > 0
    ? {hero:h, desc:`Vida ${state.heroes[h].hp}/${HERO_MAX_HP}`} : {hero:h, desc:'Caído', block:'CAÍDO'});
  const first = list.find(x => !x.block).hero;
  const t = await chooseTarget(sk.name.toUpperCase(), sk.id === 'pass' ? 'Quem ganha o ataque extra?' : 'Quem será protegido?', list, first);
  return list.find(x => x.hero === t && !x.block) ? t : first;
}
const HERO_ICON = {mage:'orb', knight:'sword', tank:'hammer', assassin:'staff'};
async function chooseTarget(title, text, list, fallback){
  const r = await runVote({
    menu:true, title, text, seconds:ACTION_SECONDS,
    options: HERO_ORDER.map(h => { const it = list.find(x => x.hero === h); return it && !it.block
      ? {label:GROUPS[h], desc:it.desc, kind:'util', icon:HERO_ICON[h], chips:it.chips || ''}
      : {label:GROUPS[h], desc:it ? it.desc : '', kind:'util', icon:HERO_ICON[h], chips:it && it.block ? `<span class="tag block">${it.block}</span>` : '', disabled:true}; })
  });
  return r.idx === null ? fallback : HERO_ORDER[r.idx];
}
const healTargets = () => HERO_ORDER.map(h => { const hp = state.heroes[h].hp;
  return hp <= 0 ? {hero:h, desc:'Caído: reviver com 50% de vida', chips:'<span class="tag holy attr">REVIVER</span>'}
       : hp < HERO_MAX_HP ? {hero:h, desc:`Vida ${hp}/${HERO_MAX_HP}: curar +${HEAL_AMOUNT}`, chips:'<span class="tag attr">CURAR</span>'}
       : {hero:h, desc:'Vida cheia', block:'VIDA CHEIA'}; });
function ultUsable(k){ return k !== 'assassin' || healTargets().some(t => !t.block); }
async function activateUlt(k){
  state.ultReady[k] = false;
  const b = state.buff; let note = ULT_INFO[k];
  showBanner(`${GROUPS[k]}: ${ULT_NAME[k].toUpperCase()}!`, note);
  if (k === 'mage') b.bh = 1;
  else if (k === 'knight') { b.bers = 2; b.tired = 0; }
  else if (k === 'tank') b.taunt = 2;
  else {
    const list = healTargets(), valid = list.filter(t => !t.block);
    let t;
    if (k === activeGroup && state.heroes[k].hp > 0) { hideBanner(); t = await chooseTarget('LUZ SAGRADA', 'Quem recebe a luz?', list, valid[0].hero); await closePanel(); }
    else t = valid.slice().sort((x, y) => state.heroes[x.hero].hp - state.heroes[y.hero].hp)[0].hero;
    const h = state.heroes[t];
    if (h.hp <= 0) { h.hp = REVIVE_HP; floatText(HERO_X[t], 56, 'REVIVEU!', '#ffe08a'); }
    else { h.hp = Math.min(HERO_MAX_HP, h.hp + HEAL_AMOUNT); floatText(HERO_X[t], 56, `+${HEAL_AMOUNT}`, '#9fe3a8'); }
    showBanner(`Luz Sagrada: ${GROUPS[t]}`, h.hp === REVIVE_HP ? 'voltou à luta!' : 'vida restaurada'); 
  }
  renderHud(); await wait(1200); hideBanner();
}
function applyMark(el){
  const m = state.marks;
  if (m.includes(el)) return null;
  if (m.length) { const key = [m[0], el].sort().join('+'), r = REACTIONS[key]; state.marks = []; return r || null; }
  m.push(el); return null;
}
// Para onde vai o dano do boss: Provocação e Proteção redirecionam para o Tanque; Berserk/Exaustão mudam o dano do Guerreiro.
function routeHit(hero, dmg){
  const b = state.buff, tankUp = state.heroes.tank.hp > 0;
  let to = hero, d = dmg, note = '';
  if (tankUp && b.taunt > 0) { to = 'tank'; d = Math.round(d * 0.5); note = ' (provocado)'; }
  else if (tankUp && hero !== 'tank' && state.guardFor === hero) { to = 'tank'; d = Math.round(d * 0.6); note = ' (protegido)'; }
  if (to === 'knight') { if (b.bers > 0) { d = Math.round(d * 0.5); note += ' (berserk)'; } else if (b.tired > 0) { d = Math.round(d * 1.5); note += ' (exausto)'; } }
  return {to, dmg:d, note};
}

// Por que uma habilidade não pode ser usada agora (ou null).
function skillBlock(k, sk){
  if (sk.target && !aliveHeroes().some(h => h !== k)) return 'SEM ALIADOS';
  const c = state.cd[k][sk.id] || 0; if (c > 0) return `RECARGA ${c}`;
  if (state.heroes[k].mp < sk.mana) return 'SEM MANA';
  return null;
}
function skillChips(sk, block){
  let h = '';
  if (sk.tipo) h += `<span class="tag tipo">${sk.tipo}</span>`;
  if (sk.attr) h += `<span class="tag attr ${sk.attr === 'SAGRADO' ? 'holy' : ''}">${sk.attr}</span>`;
  if (sk.mana) h += `<span class="tag mana">${sk.mana} MANA</span>`;
  if (sk.cd) h += `<span class="tag cd">RECARGA ${sk.cd}</span>`;
  if (sk.mult && sk.mult !== 1) h += `<span class="tag mult">${String(sk.mult).replace('.', ',')}x</span>`;
  if (block) h += `<span class="tag block">${block}</span>`;
  return h;
}
// Menu de ações do herói: o grupo vota numa habilidade (e, se for elemental, depois no elemento).
async function chooseSkill(k){
  const at = state.curAttack, list = SKILLS[k];
  for (;;) {
    const ult = state.ultReady[k] && ultUsable(k);
    const opts = [];
    if (ult) opts.push({label:'ESPECIAL: ' + ULT_NAME[k], desc:ULT_INFO[k], kind:'ult', icon:ULT_ICON[k], chips:'<span class="tag attr holy">ESPECIAL</span><span class="tag cd">começa a contar ao usar</span>'});
    list.forEach(sk => { const b = skillBlock(k, sk); opts.push({label:sk.name, desc:sk.desc, kind:sk.kind, icon:sk.icon, chips:skillChips(sk, b), disabled:!!b}); });
    const r = await runVote({menu:true, title:`VEZ ${({assassin:'DA'})[k] || 'DO'} ${GROUPS[k]}`, text:'Escolham a habilidade', seconds:ACTION_SECONDS, attack:at, options:opts});
    if (r.idx === null) return null;
    if (ult && r.idx === 0) { await closePanel(); await activateUlt(k); continue; }   // ultimate ativado: o efeito começa a contar agora
    const sk = list[r.idx - (ult ? 1 : 0)]; let element = null;
    if (sk.elem) {
      const els = ['fire','water','air','earth'];
      const r2 = await runVote({
        menu:true, title:sk.name.toUpperCase(), text:'Escolham o elemento', seconds:8, attack:at,
        options: els.map(e => ({label:ELEMENTS[e].name, desc:'', kind:'elem', icon:{fire:'fire',water:'drop',air:'wind',earth:'rock'}[e], color:ELEMENTS[e].color, chips: BOSS.immune.includes(e) ? '<span class="tag block">BOSS IMUNE</span>' : '<span class="tag attr holy">EFETIVO</span>'}))
          .concat([{label:'VOLTAR', desc:'Escolher outra habilidade', kind:'back', icon:'back', chips:''}])
      });
      if (r2.idx === els.length) continue;           // voltou ao menu de habilidades
      element = els[r2.idx === null ? 0 : r2.idx];
    }
    return {skill:sk, element};
  }
}

async function playRound(){
  if (state.over) return;
  await bossIntro();
  state.sinceHard = (state.sinceHard || 0) + 1;
  if (state.sinceHard >= HARD_EVERY) state.forceHard = true;   // pergunta difícil garantida: mantém os ultimates aparecendo
  const q = pickQuestion(state.forceHard ? 3 : (Math.random() < 0.55 ? 1 : 2));
  if (q.difficulty === 3) state.sinceHard = 0;
  state.forceHard = false; state.curQ = q;
  const meta = DIFFICULTY[q.difficulty];
  state.curAttack = BOSS_ATTACK;

  // ---- 1) pergunta: o grupo vota na alternativa (contagem visível só para o próprio grupo)
  const res = await runVote({
    attack: state.curAttack, text: q.text, seconds: QUESTION_SECONDS,
    options: q.answers.map(label => ({label})),
    side: `<span class="side-reward">+<img src="icon_coin.png" alt=""><b>${meta.reward}</b></span><b class="diff d${q.difficulty}">${meta.label}</b>`
  });
  // grupos controlados por outros jogadores: simulados (sem backend não dá para ver o voto real deles)
  const correct = {};
  HERO_ORDER.forEach(k => correct[k] = k === activeGroup ? res.idx === q.correct : Math.random() < 0.6);
  showBanner('AGUARDANDO OS OUTROS GRUPOS', 'ninguém vê a escolha dos outros'); await wait(1400); hideBanner();
  // revela
  res.btns.forEach((b, i) => { b.classList.remove('chosen'); if (i === q.correct) b.classList.add('correct'); else if (i === res.idx) b.classList.add('wrong'); });
  if (correct[activeGroup]) { state.gold += meta.reward; persist(); renderGold(); toast(`Seu grupo acertou! +${meta.reward} moeda${meta.reward > 1 ? 's' : ''}.`); }
  else toast(res.idx === null ? 'Seu grupo não respondeu a tempo.' : 'Seu grupo errou.');
  if (q.difficulty === 3) HERO_ORDER.forEach(k => { if (correct[k]) state.ultReady[k] = true; });
  await wait(1500);
  renderHud();
  await closePanel();

  // ---- 2) ações dos heróis
  const actions = {};
  for (const k of HERO_ORDER) {
    if (state.heroes[k].hp <= 0) { actions[k] = null; continue; }
    // ultimate do grupo ativo: só entra em ação quando o grupo escolhe o card ESPECIAL (ou toca no ícone) no menu; os outros grupos são simulados
    if (k !== activeGroup && state.ultReady[k] && ultUsable(k) && Math.random() < 0.5) await activateUlt(k);
    const at = state.curAttack;
    if (k === activeGroup) {
      showRing(k); await wait(400);
      actions[k] = await chooseSkill(k);
      if (actions[k] && actions[k].skill.target) actions[k].target = await pickAlly(k, actions[k].skill);
      await closePanel(); hideRing();
    } else {
      const av = SKILLS[k].filter(sk => !skillBlock(k, sk));
      const sk = av[Math.floor(Math.random() * av.length)];
      actions[k] = {skill: sk, element: sk.elem ? ['fire','water','air','earth'][Math.floor(Math.random() * 4)] : null};
      if (sk.target) { const al = aliveHeroes().filter(h => h !== k); actions[k].target = al[Math.floor(Math.random() * al.length)]; }
    }
  }

  closePanel(); hideRing();
  // ---- 3) resolução, um herói por vez
  state.guardFor = (actions.tank && actions.tank !== 'ult' && actions.tank.skill.id === 'guard' && state.heroes.tank.hp > 0) ? actions.tank.target : null;
  const dmgBase = meta.damage;
  for (const k of HERO_ORDER) {
    if (state.over) break;
    if (state.heroes[k].hp <= 0) continue;
    const act = actions[k], ok = correct[k];
    showRing(k);
    const nm = GROUPS[k];
    const sk = act ? act.skill : null, el = act ? act.element : null;
    let sub = '', hurt = 0, dmg = 0, defended = false;
    if (!sk) {
      sub = ok ? 'não escolheu ação' : 'não escolheu ação e errou';
      if (!ok) hurt = dmgBase;
    } else {
      state.heroes[k].mp = Math.max(0, state.heroes[k].mp - sk.mana);
      if (sk.id === 'pass') {
        const t = act.target; sub = `passou a vez para ${GROUPS[t]}`;
        showBanner(`${nm}: ${sk.name}`, sub); await wait(1100);
        if (correct[t] && state.heroes[t].hp > 0) { showRing(t); await heroAttack(t, Math.round(ATTACK_DAMAGE * 1.5)); } else floatText(HERO_X[t], 56, 'ERROU!', '#ff6b81');
        renderHud(); await wait(700); hideBanner(); hideRing();
        if (state.bossHp <= 0) return endGame(true);
        continue;
      }
      if (sk.kind === 'atk') {
        const bers = k === 'knight' && state.buff.bers > 0;
        if (ok || bers) {
          dmg = Math.round(ATTACK_DAMAGE * sk.mult); sub = ok ? 'acertou e atacou!' : 'errou, mas o Berserk atacou!';
          if (sk.elem && el && BOSS.immune.includes(el)) { dmg = 0; sub = `${ELEMENTS[el].name}: o boss é IMUNE!`; }
          else if (sk.elem && el) { const r = applyMark(el); if (r) { dmg += r.dmg; sub += ` ${r.name}! +${r.dmg}`; if (r.rage) state.rage = Math.max(0, state.rage + r.rage); } else sub += ` Marca de ${ELEMENTS[el].name.toLowerCase()}.`; }
          if (bers) { dmg = Math.round(dmg * 1.5); sub += ' Berserk 1,5x!'; }
          if (dmg > 0 && k === 'mage' && state.buff.bh > 0) { dmg *= 2; sub += ' Buraco Negro x2!'; }
        } else sub = 'errou: o ataque falhou';
        if (!ok) hurt = dmgBase;
      } else if (sk.kind === 'util') {
        sub = `escudo sobre ${GROUPS[act.target]}`; if (!ok) { hurt = dmgBase; sub += ', mas errou'; }
      } else if (sk.kind === 'def') {
        defended = true;
        if (ok) { sub = 'acertou, mas defendeu à toa!'; state.rage = Math.min(RAGE_MAX, state.rage + RAGE_WASTED); }
        else {
          const red = (sk.holy || (sk.elem && BOSS.weak.includes(el))) && sk.bonus ? sk.bonus : sk.reduce;
          hurt = Math.round(dmgBase * (1 - red)); sub = `errou e cortou ${Math.round(red * 100)}% do dano${red > sk.reduce ? ' (bônus sagrado)' : sk.elem ? ' (elemento sem efeito no boss)' : ''}`; }
      } else if (sk.kind === 'dodge') {
        if (ok) { sub = 'acertou, mas esquivou à toa!'; state.rage = Math.min(RAGE_MAX, state.rage + RAGE_WASTED); }
        else { sub = 'errou e esquivou de tudo!'; state.rage = Math.min(RAGE_MAX, state.rage + RAGE_DODGE); }
      }
    }
    const col = el ? ELEMENTS[el].color : null;
    showBanner(`${nm}: ${sk ? sk.name : 'sem ação'}${el ? ' · ' + ELEMENTS[el].name : ''}`, sub); await wait(1100);
    if (dmg > 0) await heroAttack(k, dmg, col);
    else if (hurt > 0) await bossCounter(k, hurt, defended);
    else if (sk && sk.kind === 'dodge' && !ok) floatText(HERO_X[k], 58, 'ESQUIVOU!', '#9fe3a8');
    renderHud(); await wait(700);
    hideBanner(); hideRing();
    if (state.bossHp <= 0) return endGame(true);
    if (aliveHeroes().length === 0) return endGame(false);
  }

  // ---- 3b) onda sombria: o boss fere todos os heróis vivos a cada rodada (tira a vantagem de só jogar certo)
  { const aoe = meta.aoe;
    if (aoe && !state.over) {
      showBanner('ONDA SOMBRIA', `o Lorde das Trevas fere todos: -${aoe}`); flashHit();
      HERO_ORDER.forEach(k => { const h = state.heroes[k]; if (h.hp > 0) { const a = (state.buff.taunt > 0 && k !== 'tank' && state.heroes.tank.hp > 0) ? Math.round(aoe / 2) : aoe; h.hp = Math.max(0, h.hp - a); floatText(HERO_X[k], 56, `-${a}`, '#b36bff'); } });
      renderHud(); await wait(1100); hideBanner();
      if (aliveHeroes().length === 0) return endGame(false);
    } }

  // ---- 4) fim da rodada: recargas, mana, fúria e duração dos efeitos
  { const b = state.buff;
    b.bh = 0; state.guardFor = null;
    if (b.bers > 0) { b.bers--; if (b.bers === 0) b.tired = 1; } else if (b.tired > 0) b.tired--;
    if (b.taunt > 0) b.taunt = state.heroes.tank.hp > 0 ? b.taunt - 1 : 0; }
  HERO_ORDER.forEach(k => {
    Object.keys(state.cd[k]).forEach(id => { state.cd[k][id] = Math.max(0, state.cd[k][id] - 1); });
    const act = actions[k]; if (act && act.skill.cd > 0) state.cd[k][act.skill.id] = act.skill.cd;
    if (state.heroes[k].hp > 0) state.heroes[k].mp = Math.min(100, state.heroes[k].mp + MANA_REGEN);
  });
  renderHud();
  if (state.rage >= RAGE_MAX) { state.hardNext = true; state.forceHard = true; toast('Fúria no máximo! A próxima pergunta será difícil.'); }
  turnTimer = setTimeout(playRound, 900);
}
let turnTimer = null;

function shoot(fromX, fromY, toX, toY, color, ms){
  const p = document.createElement('div'); p.className = 'proj';
  p.style.background = `radial-gradient(circle,#fff 0,${color} 45%,transparent 72%)`; p.style.boxShadow = `0 0 14px 4px ${color}`;
  $('#fx').appendChild(p);
  return p.animate([
    {left:fromX+'%', top:fromY+'%', opacity:0, transform:'translate(-50%,-50%) scale(.4)'},
    {left:fromX+'%', top:(fromY-2)+'%', opacity:1, transform:'translate(-50%,-50%) scale(1)', offset:.18},
    {left:toX+'%', top:toY+'%', opacity:1, transform:'translate(-50%,-50%) scale(1.3)'}
  ], {duration:ms || 620, easing:'ease-in', fill:'forwards'}).finished.then(() => p.remove());
}
async function heroAttack(hero, dmg = ATTACK_DAMAGE, colOverride = null){
  const col = colOverride || HERO_COLOR[hero], game = $('#game');
  await shoot(HERO_X[hero], 61, 50, 24, col);
  const imp = $('#boss-impact'); imp.style.background = `radial-gradient(circle,#fff,${col} 35%,transparent 68%)`;
  imp.classList.remove('active'); void imp.offsetWidth; imp.classList.add('active');
  game.classList.remove('boss-hit'); void game.offsetWidth; game.classList.add('boss-hit');
  state.bossHp = Math.max(0, state.bossHp - dmg);
  floatText(50, 17, `-${dmg}`, col === '#d9e6ff' ? '#ffffff' : col);
  renderHud(); await wait(600); game.classList.remove('boss-hit');
}
async function bossCounter(hero, dmg, defended){
  const r = routeHit(hero, dmg), t = r.to;
  await shoot(50, 26, HERO_X[t], 60, '#ff2d4d', 560);
  flashHit();
  state.heroes[t].hp = Math.max(0, state.heroes[t].hp - r.dmg);
  floatText(HERO_X[t], 56, `-${r.dmg}${defended ? ' (defesa)' : ''}${r.note}`, '#ff6b81');
  renderHud(); await wait(500);
}

function endGame(win){
  state.over = true; clearTimeout(turnTimer);
  const o = $('#end-screen'); o.querySelector('h2').textContent = win ? 'VITÓRIA!' : 'DERROTA';
  o.querySelector('p').textContent = win ? 'O Lorde das Trevas foi derrotado.' : 'Todos os heróis caíram.';
  o.classList.toggle('win', win); o.hidden = false;
}
function restartRun(){
  Object.values(state.heroes).forEach(h => { h.hp = HERO_MAX_HP; h.mp = 100; });
  Object.assign(state, {sinceHard:0, bossHp:BOSS_MAX_HP, rage:0, hardNext:false, forceHard:false, over:false});
  HERO_ORDER.forEach(k => { state.cd[k] = {}; state.ultReady[k] = false; });
  state.marks = []; state.buff = {bh:0, bers:0, tired:0, taunt:0}; state.guardFor = null;
  $('#end-screen').hidden = true; renderHud(); turnTimer = setTimeout(playRound, 800);
}

function useInventory(index){
  const type=state.inventory[index];if(!type)return;
  const item=ITEMS[type], hero=state.heroes[activeGroup];
  const max = item.kind==='hp' ? HERO_MAX_HP : 100;
  if(hero.hp<=0 && item.kind==='hp'){toast('O herói caiu e não pode ser curado.');return}
  if(hero[item.kind]>=max){toast(item.kind==='hp'?'HP já está cheio.':'Mana já está cheia.');return}
  hero[item.kind]=Math.min(max,hero[item.kind]+item.amount);state.inventory.splice(index,1);persist();renderInventoryHits();renderHud();toast(`${item.name} usada.`);
}
function renderInventoryHits(){
  const root=$('#inventory-hits');root.innerHTML='';
  for(let i=0;i<6;i++){const b=document.createElement('button');b.className='inventory-hit';b.type='button';b.setAttribute('aria-label',state.inventory[i]?`Usar ${ITEMS[state.inventory[i]].name}`:'Slot vazio');if(state.inventory[i]){const img=document.createElement('img');img.className='inv-icon';img.src=ITEMS[state.inventory[i]].icon;img.alt='';b.appendChild(img);b.addEventListener('click',()=>useInventory(i))}root.appendChild(b)}
}

// Optional external realtime adapter. A future Netlify/Supabase layer can replace these functions
// without changing the visual/game code.
window.BancoDadosGame={
  state,QUESTIONS,ITEMS,GROUPS,DIFFICULTY,
  addQuestion:q=>QUESTIONS.push(q),removeQuestion:i=>QUESTIONS.splice(i,1),
  playRound, restartRun,
  setGroup:g=>{if(!GROUPS[g])return false;localStorage.setItem('bd1_group',g);location.search=`?grupo=${encodeURIComponent(g)}`;return true},
  getGroup:()=>activeGroup,getVotes:()=>({...votes}),
  addItem:(k,item)=>ITEMS[k]=item,
  addInventoryItem:k=>{if(state.inventory.length<6){state.inventory.push(k);persist();renderInventoryHits()}}
};

$('#back-lobby').addEventListener('click',()=>{LOBBY.leave();location.href='index.html'});
$('#hitmap').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const action=b.dataset.action;
  if(action==='buy')requestBuy(b.dataset.item);
});
$('.merchant-vote').addEventListener('click',e=>{const b=e.target.closest('.vote-choice');if(b)vote(b.dataset.vote)});

buildHud();renderHud();renderGold();renderInventoryHits();updateVoteUI();
$('#restart').addEventListener('click',restartRun);
turnTimer = setTimeout(playRound, 1500);   // começa com a tela limpa; o boss ataca em seguida
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
