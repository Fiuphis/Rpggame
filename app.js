/* Banco de Dados I — RPG
   Front-end mobile build. The supplied PNG remains the visual base.
   Moedas/itens salvos por grupo em localStorage. Votação multiplayer real entre celulares precisa de backend (próxima etapa).
*/

// difficulty = rank: 1 C, 2 B, 3 A, 4 S, 5 SS. Dano do contra-ataque e tipo do ataque vêm de DIFFICULTY.
const DIFFICULTY = {   // ranks: 1=C (mais fácil) … 5=SS (mais difícil)
  1:{label:'RANK C',  rank:'C',  type:'ATAQUE FÍSICO',  damage:18, reward:1, aoe:3},
  2:{label:'RANK B',  rank:'B',  type:'ATAQUE FÍSICO',  damage:28, reward:2, aoe:5},
  3:{label:'RANK A',  rank:'A',  type:'ATAQUE SOMBRIO', damage:38, reward:3, aoe:6},
  4:{label:'RANK S',  rank:'S',  type:'ATAQUE MÍSTICO', damage:50, reward:5, aoe:8},
  5:{label:'RANK SS', rank:'SS', type:'ATAQUE MÍSTICO', damage:64, reward:8, aoe:11}
};
const HARD_MIN = 4;   // rank S e SS contam como "difíceis" (carregam o especial, fúria etc.)
const isHardQ = q => q && q.difficulty >= HARD_MIN;
const RANK_W = [0, .30, .30, .25, .10, .05];   // sorteio normal por rank (índice = dificuldade)
function rollDiff(){ let r = Math.random(), d = 1; for (; d < 5; d++) { r -= RANK_W[d]; if (r < 0) break; } return d; }
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
  {difficulty:3, text:'Qual nível de isolamento evita leituras sujas, mas permite leituras não repetíveis?', answers:['READ UNCOMMITTED','READ COMMITTED','REPEATABLE READ','SERIALIZABLE'], correct:1},
  {difficulty:4, text:'Qual anomalia ocorre quando uma transação relê um conjunto de linhas e aparecem novas linhas inseridas por outra transação?', answers:['Leitura suja','Leitura não repetível','Leitura fantasma','Atualização perdida'], correct:2},
  {difficulty:4, text:'Em um índice B-Tree, qual é a complexidade típica da busca por uma chave?', answers:['O(1)','O(log n)','O(n)','O(n log n)'], correct:1},
  {difficulty:4, text:'Qual forma normal exige que todo determinante seja uma chave candidata?', answers:['2FN','3FN','FNBC','4FN'], correct:2},
  {difficulty:4, text:'O que o comando EXPLAIN normalmente mostra em um SGBD?', answers:['O plano de execução da consulta','O esquema completo do banco','O histórico de transações','Os usuários conectados'], correct:0},
  {difficulty:5, text:'Qual protocolo garante serializabilidade separando uma fase de aquisição e uma de liberação de bloqueios?', answers:['Two-Phase Locking (2PL)','Write-Ahead Logging','Two-Phase Commit','Ordenação por timestamp simples'], correct:0},
  {difficulty:5, text:'A dependência multivalorada é eliminada ao atingir qual forma normal?', answers:['3FN','FNBC','4FN','2FN'], correct:2},
  {difficulty:5, text:'Qual técnica de recuperação exige gravar a alteração no log ANTES de gravá-la nos dados em disco?', answers:['Shadow Paging','Write-Ahead Logging','Checkpoint fuzzy','Bloqueio otimista'], correct:1},
  {difficulty:5, text:'Pelo teorema CAP, havendo partição de rede, um sistema distribuído deve escolher entre quais propriedades?', answers:['Atomicidade e Durabilidade','Isolamento e Consistência','Consistência e Disponibilidade','Disponibilidade e Escalabilidade'], correct:2}
];
// Banco de perguntas editável: prioridade = salvo neste aparelho (editor.html) > perguntas.json > as perguntas embutidas acima.
const QUESTIONS_DEFAULT = QUESTIONS.slice();
function validQuestions(list){
  if (!Array.isArray(list)) return null;
  const ok = list.filter(q => q && Number.isInteger(q.difficulty) && q.difficulty >= 1 && q.difficulty <= 5 && typeof q.text === 'string' && q.text.trim() && Array.isArray(q.answers) && q.answers.length === 4 && q.answers.every(a => typeof a === 'string' && a.trim()) && Number.isInteger(q.correct) && q.correct >= 0 && q.correct <= 3);
  return ok.length && [1,2,3,4,5].every(d => ok.some(q => q.difficulty === d)) ? ok : null;   // precisa ter pelo menos 1 pergunta de cada rank
}
const QREADY = (async () => {
  try {
    let list = null;
    try { list = validQuestions(JSON.parse(localStorage.getItem('bd1_questions'))); } catch {}
    if (!list) { const r = await fetch('perguntas.json', {cache:'no-cache'}); if (r.ok) list = validQuestions(await r.json()); }
    if (list) QUESTIONS.splice(0, QUESTIONS.length, ...list);
  } catch {}
})();


// Banco de ações do Mercador: cada item vira uma pergunta de votação. Para criar ações novas, adicione aqui.
const ITEMS = {
  hp_s:{name:'Poção Pequena de HP', ask:'Poção pequena de HP?', price:5, kind:'hp', amount:20, icon:'potion_hp_s.png'},
  hp:{name:'Poção de HP', ask:'Comprar poção de HP?', price:10, kind:'hp', amount:35, icon:'potion_hp.png'},
  hp_l:{name:'Poção Grande de HP', ask:'Poção grande de HP?', price:18, kind:'hp', amount:70, icon:'potion_hp_l.png'},
  mana_s:{name:'Poção Pequena de Mana', ask:'Poção pequena de mana?', price:4, kind:'mp', amount:20, icon:'potion_mana_s.png'},
  mana:{name:'Poção de Mana', ask:'Comprar poção de mana?', price:6, kind:'mp', amount:35, icon:'potion_mana.png'},
  mana_l:{name:'Poção Grande de Mana', ask:'Poção grande de mana?', price:10, kind:'mp', amount:70, icon:'potion_mana_l.png'},
  // defesa
  iron_shield:{name:'Escudo de Ferro', ask:'Comprar Escudo de Ferro?', price:12, kind:'fx', fx:'shield', icon:'item_iron_shield.png', info:'Bloqueia por completo o próximo golpe que você receber.'},
  amulet:{name:'Amuleto Protetor', ask:'Comprar Amuleto Protetor?', price:14, kind:'fx', fx:'amulet', icon:'item_amulet.png', info:'Reduz em 30% o dano que você recebe por 3 rodadas.'},
  helm:{name:'Elmo Reforçado', ask:'Comprar Elmo Reforçado?', price:10, kind:'fx', fx:'helm', icon:'item_helm.png', info:'Corta 8 de dano de cada golpe que você recebe por 3 rodadas.'},
  smokebomb:{name:'Bomba de Fumaça', ask:'Comprar Bomba de Fumaça?', price:11, kind:'fx', fx:'smoke', icon:'item_smokebomb.png', info:'Você escapa dos golpes diretos do boss por 2 rodadas (a Onda Sombria ainda acerta).'},
  // cura
  elixir:{name:'Elixir Completo', ask:'Comprar Elixir Completo?', price:16, kind:'fx', fx:'elixir', icon:'item_elixir.png', info:'Restaura 50 de HP e 50 de mana.'},
  herb:{name:'Erva Curativa', ask:'Comprar Erva Curativa?', price:9, kind:'fx', fx:'herb', icon:'item_herb.png', info:'Cura 8 de HP no fim de cada rodada, por 4 rodadas.'},
  // crítico e dano
  lens:{name:'Lente do Caçador', ask:'Comprar Lente do Caçador?', price:11, kind:'fx', fx:'lens', icon:'item_lens.png', info:'Seu próximo ataque que acertar é CRÍTICO (1,8x de dano).'},
  tonic:{name:'Tônico de Fúria', ask:'Comprar Tônico de Fúria?', price:12, kind:'fx', fx:'tonic', icon:'item_tonic.png', info:'Seus ataques causam +25% de dano por 3 rodadas.'},
  powder:{name:'Pólvora Negra', ask:'Comprar Pólvora Negra?', price:8, kind:'fx', fx:'powder', icon:'item_powder.png', info:'Seu próximo ataque causa +15 de dano.'},
  blade:{name:'Lâmina Afiada', ask:'Comprar Lâmina Afiada?', price:25, kind:'fx', fx:'blade', icon:'item_blade.png', info:'Permanente: todos os seus ataques causam +4 de dano até o fim da partida.'},
  lightbomb:{name:'Bomba de Luz', ask:'Comprar Bomba de Luz?', price:13, kind:'fx', fx:'lightbomb', icon:'item_lightbomb.png', info:'Explode no fim da rodada: 40 de dano direto no boss.'},
  // mana, especial e utilidade
  hourglass:{name:'Ampulheta do Tempo', ask:'Comprar Ampulheta do Tempo?', price:14, kind:'fx', fx:'hourglass', icon:'item_hourglass.png', info:'Zera a recarga de todas as suas habilidades e dá +20 de mana.'},
  luckycoin:{name:'Moeda da Sorte', ask:'Comprar Moeda da Sorte?', price:6, kind:'fx', fx:'lucky', icon:'item_luckycoin.png', info:'+3 moedas a cada acerto nas próximas 3 perguntas.'},
  // raros
  phoenix:{name:'Pena de Fênix', ask:'Comprar Pena de Fênix?', price:24, kind:'fx', fx:'phoenix', rare:true, icon:'item_phoenix.png', info:'RARO: revive seu herói caído com 60 de HP (só vale se algum aliado ainda estiver de pé).'},
  dice:{name:'Dado do Destino', ask:'Comprar Dado do Destino?', price:20, kind:'fx', fx:'dice', rare:true, icon:'item_dice.png', info:'RARO: seus próximos 3 ataques causam de 0,5x a 3x de dano, sorteado.'},
  scroll:{name:'Pergaminho Arcano', ask:'Comprar Pergaminho Arcano?', price:22, kind:'fx', fx:'scroll', rare:true, icon:'item_scroll.png', info:'RARO: carrega na hora o ULTIMATE do seu herói.'}
};
const newStats = () => ({rank:{1:[0,0],2:[0,0],3:[0,0],4:[0,0],5:[0,0]}, gained:0, spent:0, used:0});   // por rank: [acertos, erros]
const newBuffs = () => ({shield:0, amulet:0, helm:0, smoke:0, herb:0, lens:0, tonic:0, powder:0, blade:0, lucky:0, luckyAmt:3, dice:0, bomb:0});
// Afinidade: o herói indicado ganha +50% no efeito do item (duração, valor ou cargas).
const AFFINITY = {mage:['hourglass','scroll','elixir','luckycoin'], knight:['blade','tonic','lightbomb','herb'], tank:['iron_shield','helm','amulet'], assassin:['lens','dice','powder','smokebomb']};
Object.entries(AFFINITY).forEach(([h, l]) => l.forEach(k => { (ITEMS[k].aff = ITEMS[k].aff || []).push(h); }));
const hasAff = (type, hero) => !!(ITEMS[type].aff && ITEMS[type].aff.includes(hero || activeGroup));
const allBuffs = () => ({mage:newBuffs(), knight:newBuffs(), tank:newBuffs(), assassin:newBuffs()});
// itens que podem ser dados a um aliado; os demais valem só para quem usa
const GIVE = new Set(['shield','amulet','helm','smoke','herb','elixir','phoenix']);

// ===== Configuração do combate (ajuste aqui) =====
const HERO_ORDER = ['mage','knight','tank','assassin'];
const HERO_COLOR = {mage:'#4d8dff', knight:'#d9e6ff', tank:'#ff9d3d', assassin:'#ff3d5c'};
const HERO_X = {mage:10.3, knight:33.2, tank:63.5, assassin:89.7};   // centro do herói (% da largura)
const BOSS_MAX_HP = 650, HERO_MAX_HP = 100;
// Dano base por herói: Cleriga baixo, Maga/Tanque médio, Guerreiro alto. Fraqueza certa (fogo da Maga) = alto; Buraco Negro = extremamente alto.
const HERO_BASE = {mage:14, knight:21, tank:14, assassin:10};
const ATTACK_DAMAGE = 14;          // dano do ataque básico (quando acertou a pergunta)
const DEFEND_REDUCTION = 0.5;      // defesa reduz o dano pela metade
const RAGE_MAX = 5, RAGE_DODGE = 1, RAGE_WASTED = 5;   // fúria: esquivar após errar +1; defender/esquivar após ACERTAR +5 (enche)
const QUESTION_SECONDS = {1:25, 2:30, 3:35, 4:40, 5:45}, ACTION_SECONDS = 25;   // tempo para responder: C 25s, B 30s, A 35s, S 40s, SS 45s
const ULT_NAME = {mage:'Buraco Negro', knight:'Berserk', tank:'Provocação', assassin:'Luz Sagrada'};
const ULT_ICON = {mage:'orb', knight:'sword2', tank:'hammer2', assassin:'cross'};
const ULT_INFO = {mage:'dano direto de 4x o dano base no boss; recarga: não volta na próxima pergunta rank S/SS, só na seguinte (se acertarem)', knight:'ataca mesmo errando, com 1,5x de dano, e leva menos dano por 2 perguntas', tank:'todo o dano do boss vai nele (inclusive metade da Onda Sombria dos aliados), com defesa dobrada, por 2 perguntas', assassin:'revive ou cura um herói'};
// ===== Habilidades especiais do boss (cada uma tem aviso na tela e uma resposta dos heróis) =====
const PREP_CHANCE = .2, PREP_MULT = 1.5;                // Preparando Habilidade: sorteada (1 em 5 rodadas); a rodada seguinte tem golpes +50% (defender corta pela metade)
const TELE_CHANCE = 1 / 6, TELE_FROM = 4, TELE_DMG = 20, STUN_MULT = 1.25;   // Teleporte: depois da rodada 4; ESQUIVA anula e atordoa o boss (+25% de dano nele na rodada)
const BH_PARTS = [1.5, 2.5];   // Buraco Negro: dois estouros na animação (1,5x + 2,5x = 4x o dano base da Maga = 56)
const BH_MULT = 4;   // Buraco Negro: dano próprio de 4x o dano base da Maga (56)
const THRUST_CD = 3, TELE_CD = 2;   // recarga em perguntas (contando a do uso): Estocada fica 2 perguntas sem sair, Teleporte 1
const PHASE2_AT = .5, PHASE2_AOE = 2;   // fase 2: com 50% de HP o boss muda (cena de raios) e a Onda Sombria fica +2
const THRUST_DMG = 24, ENRAGE_AOE = 2;                  // Estocada (ignora Provocação/Proteção); Enfurecer: Onda Sombria +2
const HERO_WX = k => HERO_X[k] * 10.24;                 // x do herói no mundo 1024x1536
const HARD_MISS_AOE = 1.5;   // errou pergunta S/SS: a Onda Sombria bate 50% mais forte e a fúria enche mais
const HARD_EVERY = 5;   // a cada 5 perguntas sem rank S/SS, a próxima é S ou SS
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
// Boss: fraco a FOGO e a SAGRADO (1,5x). Água, ar e terra: imune (a Maga faz o ataque só pelo efeito, dano 0). Sem marcas/reações; escudos só ganham bônus contra o que o fere.
const BOSS = {weak:['holy','fire'], immune:['water','air','earth']};
const BURN_TURNS = 2, BURN_MULT = .25;   // fogo marca o boss: dano contínuo de 0,25x do dano normal por 2 perguntas
const BOSS_WEAK_MULT = 1.5;   // fogo e sagrado ferem o boss em dobro-ish (1,5x); água, ar e terra: só o efeito visual, dano 0
const BOSS_FAMILY = 'DEMONÍACO';   // o boss é demônio/vampiro: todo dano dele é demoníaco
const BOSS_ATTACK = {tipo:'FÍSICO', attr:'demon'};   // o boss ataca fisicamente, com atributo demoníaco/vampírico

// ===== Habilidades por classe =====
// kind: atk | def | dodge | util. mult: multiplicador do dano base. reduce: fração do dano do boss que a defesa corta.
// cd: perguntas de recarga. mana: custo. elem:true = pede o elemento depois. soon:true = efeito chega na etapa 2.
const SKILLS = {
  mage:[
    {id:'mana_atk', kind:'atk', name:'Ataque de Mana', desc:'Raio de mana. Dano normal.', mana:10, cd:0, mult:1},
    {id:'elem_atk', kind:'atk', name:'Ataque Elemental', desc:'Fogo, água, ar ou terra. O boss é fraco a FOGO (1,5x e queima por 2 perguntas); água, ar e terra ele ignora (só efeito).', mana:20, cd:1, mult:1.3, elem:true},
    {id:'mana_def', kind:'def', name:'Escudo de Mana', desc:'Barreira de mana. Corta 35% do dano.', mana:10, cd:0, reduce:.35},
    {id:'elem_def', kind:'def', name:'Escudo Elemental', desc:'Escudo de um elemento. Só ganha bônus contra o elemento certo.', mana:20, cd:1, reduce:.35, bonus:.55, elem:true},
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
    {id:'super', kind:'atk', name:'Ataque Super Pesado', desc:'2x o dano normal e deixa o boss desnorteado na pergunta seguinte (+25% de dano nele, sem habilidades especiais).', mana:20, cd:3, mult:2},
    {id:'guard', kind:'util', name:'Proteção Específica', desc:'Escudo sobre 1 herói: o dano dele vai para o Tanque, com 40% a menos.', mana:20, cd:2, target:true},
    {id:'def', kind:'def', name:'Defesa', desc:'Ergue o escudo. Corta 75% do dano.', mana:0, cd:0, reduce:.75},
    {id:'dodge', kind:'dodge', name:'Esquiva', desc:'Foge do ataque.', mana:0, cd:1}
  ],
  assassin:[
    {id:'atk', kind:'atk', name:'Ataque Normal', desc:'Golpe de cajado. Dano normal.', mana:0, cd:0, mult:1},
    {id:'holy_atk', kind:'atk', name:'Ataque Sagrado', desc:'1,5x de dano em demônios, como o boss.', mana:20, cd:1, mult:1.5},
    {id:'def', kind:'def', name:'Defesa Normal', desc:'Ergue as mãos. Corta 50% do dano.', mana:0, cd:0, reduce:.5},
    {id:'holy_def', kind:'def', name:'Defesa Sagrada', desc:'1,5x de defesa contra demônios.', mana:20, cd:1, reduce:.5, bonus:.65, holy:true},
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
// mana NÃO regenera: só sobe com Poção de Mana
const KIND_LABEL = {atk:'ATAQUE', def:'DEFESA', dodge:'ESQUIVA', util:'TÁTICA'};

const GROUPS = {mage:'MAGA', knight:'GUERREIRO', tank:'TANQUE', assassin:'CLÉRIGA'};
const PARAMS = new URLSearchParams(location.search);
// O grupo vem do lobby (página inicial). ?grupo=... só vale junto com ?teste=1.
const TEST_MODE = LOBBY.testMode; // simula os outros 6 jogadores votando
const GROUP_KEY = (TEST_MODE && GROUPS[PARAMS.get('grupo')]) ? PARAMS.get('grupo') : LOBBY.myGroup();
if (!GROUP_KEY) { location.replace('index.html'); }
const activeGroup = GROUP_KEY || 'mage';

// Moedas e itens são independentes por grupo (uma chave de save por classe).
if (PARAMS.get('reset')) Object.keys(GROUPS).forEach(g => localStorage.removeItem(`bd1_save_${g}`));
const SAVE_KEY = `bd1_save_${activeGroup}`;
// v:2 — saves antigos (que começavam com moedas) são descartados; todo grupo começa com 0
function loadSave(){
  try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d && d.v === 2 && typeof d.gold === 'number' && Array.isArray(d.inventory)) return d; } catch {}
  return {gold:0, inventory:[]};
}
const saved = loadSave();
// animações/falas/sons (anim.js); sem ele o jogo funciona igual
const A = window.Anim || new Proxy({}, {get:() => () => Promise.resolve()});
const skAnim = (k, sk) => ({atk:'melee', heavy:'heavy', super:'heavy', mana_atk:'cast', elem_atk:'cast', holy_atk:'holy'}[sk.id] || 'melee');
const skSay = (k, sk) => ({heavy:'heavy', super:'heavy', holy_atk:'holy', mana_atk:'attack', elem_atk:'attack'}[sk.id] || 'attack');
const guardColor = (sk, el) => sk.holy ? '#ffe08a' : sk.id === 'mana_def' ? '#7a6cff' : sk.elem && el ? ELEMENTS[el].color : '#4da3ff';

const state = {
  shop:null, ib:allBuffs(), phase2:false, chestAt:-9, stats:newStats(),
  gold:0, question:0, answered:false,
  inventory:saved.inventory, pendingAction:null, myVote:null, voteLocked:false,
  // todos começam com vida e mana cheias
  heroes:Object.fromEntries(['mage','knight','tank','assassin'].map(k => [k, {hp:100, mp:100}])),
  bossHp:BOSS_MAX_HP, rage:0, hardNext:false, over:false,
  cd:{mage:{},knight:{},tank:{},assassin:{}}, marks:[], burn:0, buff:{bh:0, bers:0, tired:0, taunt:0}, guardFor:null,         // recarga das habilidades (perguntas restantes)
  curAttack:BOSS_ATTACK,
  ultCd:{mage:0,knight:0,tank:0,assassin:0},
  ultReady:{mage:false,knight:false,tank:false,assassin:false},   // carrega ao acertar pergunta rank S/SS
  curQ:null, lastQ:{1:-1,2:-1,3:-1,4:-1,5:-1},
  round:0, dazedNext:false, thrustCd:0, teleCd:0, prepNext:false, stun:false, enraged:false
};
function persist(){ localStorage.setItem(SAVE_KEY, JSON.stringify({v:2, gold:state.gold, inventory:state.inventory})); }

const $ = s => document.querySelector(s);
let __readUntil=0;
const readMs=s=>Math.min(6000,900+50*String(s).length);
const wait = ms => new Promise(r=>setTimeout(r,Math.max(ms,__readUntil-Date.now())));
const __seen={};
function fresh(key,ms){const n=Date.now();if(__seen[key]&&n-__seen[key]<ms)return false;__seen[key]=n;return true}
function scWrite(el, text, cls){ if (window.Paper) Paper.burst(10); el.className = el.className.split(' ')[0] + (cls ? ' ' + cls : ''); el.textContent = ''; const per = Math.max(10, Math.min(24, 1500 / Math.max(1, String(text).length)));
  [...String(text)].forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch; s.style.animationDelay = (i * per) + 'ms'; el.appendChild(s); }); }
function paperOn(){ return document.documentElement.classList.contains('paper'); }
function fitScroll(){ const g = $('#game').getBoundingClientRect(), band = Math.max(0, Math.round(innerHeight - g.bottom)), on = band >= 56, bh = on ? band + Math.round(g.height * .11) : band; document.documentElement.style.setProperty('--bh', bh + 'px'); document.documentElement.classList.toggle('paper', on); }
addEventListener('resize', fitScroll); addEventListener('orientationchange', () => setTimeout(fitScroll, 300)); addEventListener('load', fitScroll); setTimeout(fitScroll, 0);
function toast(msg){if(!fresh('t:'+msg,4000))return;if(paperOn()){const n=$('#sc-n');scWrite(n,msg);clearTimeout(window.__toast);window.__toast=setTimeout(()=>{n.textContent=''},readMs(msg)+600);return}const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),readMs(msg)+400)}
let votes = {yes:0, no:0};
let botTimers = [], voteTimer = null, voteEndsAt = 0;
const VOTE_SECONDS = 25;

function renderGold(){ $('#gold-hud').textContent = state.gold; }
function goldGain(n){ const g = $('#game'), p = document.createElement('div'); p.className = 'gold-plus'; p.textContent = '+' + n; g.appendChild(p);
  setTimeout(() => { renderGold(); const h = $('#gold-hud'); h.classList.remove('bump'); void h.offsetWidth; h.classList.add('bump'); }, 650);
  setTimeout(() => { p.remove(); $('#gold-hud').classList.remove('bump'); }, 1400); }

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
function showMerchantText(text){ const q = $('#merchant-question'); q.textContent = text; q.style.fontSize = ''; if (text && !$('#bag-panel').hidden) fitBox(q, 1.15, .7, true); }

function openMerchantVote(text, action){
  votes = {yes:0, no:0};
  state.pendingAction = action; state.myVote = null; state.voteLocked = false;
  state.voters = groupMembers(); state.need = majorityOf(state.voters);
  showMerchantText(text);
  $('#merchant-vote').classList.add('open'); setBag(true); showMerchantText(text);
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
  if (action.type === 'chest') {
    msg = result === 'yes' ? 'Abrir a arca!' : result === 'no' ? 'Ignorada.' : result === 'tie' ? 'Empate. A arca fica.' : 'Tempo esgotado.';
    showMerchantText(msg); await wait(1000); const done = state.chestDone; closeMerchantVote();
    if (done) { state.chestDone = null; done(result === 'yes'); }
    return;
  }
  if (action.type === 'ult') {
    msg = result === 'yes' ? 'Ultimate liberado!' : result === 'no' ? 'Recusado.' : result === 'tie' ? 'Empate. Guardado.' : 'Tempo esgotado.';
    showMerchantText(msg); await wait(1200); const done = state.ultDone; closeMerchantVote();
    if (done) { state.ultDone = null; done(result === 'yes'); }
    return;
  }
  if (result === 'yes') msg = executeBuy(action.item, action.slot) ? 'Comprada!' : 'Não foi possível.';
  else { msg = result === 'no' ? 'Recusado.' : result === 'tie' ? 'Empate. Nada comprado.' : 'Tempo esgotado.'; mBubble(msay('no')); }
  showMerchantText(msg);
  await wait(1200);
  closeMerchantVote();
}

// Pergunta ao grupo (via Mercador) se vai usar o ultimate; resolve true/false.
async function askUlt(hero){
  while (state.pendingAction || state.voteLocked) await wait(300);
  return new Promise(res => { state.ultDone = res; showBanner(`ULTIMATE PRONTO: ${GROUPS[hero]}`, ULT_NAME[hero]); openMerchantVote('Usar ULTIMATE?', {type:'ult', hero}); }).then(r => { hideBanner(); return r; });
}

// ===== Mercador vivo: humor, falas, loja que fecha, prateleira que repõe itens =====
const SHOP_POOL = Object.keys(ITEMS).filter(k => !ITEMS[k].rare);
const RARE_POOL = Object.keys(ITEMS).filter(k => ITEMS[k].rare), RARE_CHANCE = 0.12;            // ids de ITEMS que podem aparecer na prateleira (novos itens: adicione em ITEMS e aqui)
const SHOP_SLOTS = 4, SHOP_CLOSE_AT = 12, SHOP_CLOSED_Q = 3;   // 12 aberturas sem comprar → fecha por 3 perguntas
const MSAY = {
  hi:['O que deseja?','Bem-vindo, viajante!','Olhe à vontade...','Em que posso ajudar?','Tenho o que você precisa.','Mercadoria de primeira!'],
  meh:['Vai comprar alguma coisa?','Já olhou o bastante?','Hm... decidiu algo?','Sem pressa... quase.'],
  bad:['Não vai comprar nada, não?','Só vem olhar, é?','Meu tempo vale ouro, sabia?','De novo você...'],
  mad:['Você está me fazendo perder o meu tempo!','Compra ou sai da frente!','Isto aqui não é museu!'],
  close:['CHEGA! Estou fechando a loja!','Já deu! Loja FECHADA!'],
  back:['Voltei! O que vai ser?','Reabri. Vai comprar agora?'],
  sold:['Negócio fechado!','Boa escolha!','Volte sempre!'],
  no:['Hmpf... indecisos.','Pensem rápido, tenho pressa.'],
  rare:['Mercadoria RARA! Só hoje!','Olhe isto... é raro!'],
  stock:['Chegou mercadoria nova!','Acabei de repor a prateleira.'],
  shut:['Fechado! Voltem depois.','A loja está fechada!','Sem mercador, sem compra.']
};
MSAY.deal = ['Cliente fiel! 15% de desconto!','Para você, desconto de 15%!'];
const MCOMMENT = {   // comentários sobre o que o jogador já comprou
  def:['Gostou do escudo, hein?','Bateu na parede de novo?','Defesa nunca é demais.'],
  heal:['Ainda de pé? Boa poção.','Levaram uma surra, né?','Saúde antes de tudo.'],
  atk:['Pegando pesado no boss!','Isso dói de verdade!','Quebre ele por mim!'],
  util:['Esperto, esse aí.','Truque de mercador.']
};
const itemCat = t => { const it = ITEMS[t]; if (it.kind === 'hp' || it.kind === 'mp' || it.fx === 'elixir' || it.fx === 'herb' || it.fx === 'phoenix') return 'heal'; if (['shield','amulet','helm','smoke'].includes(it.fx)) return 'def'; if (['hourglass','scroll','lucky'].includes(it.fx)) return 'util'; return 'atk'; };
const DISCOUNT_AFTER = 3, DISCOUNT = .85;   // bom cliente: a partir da 3a compra (desde a última vez que ele fechou a loja) tudo sai 15% mais barato
const priceOf = t => { const p = ITEMS[t].price; return state.shop && state.shop.buys >= DISCOUNT_AFTER ? Math.max(1, Math.round(p * DISCOUNT)) : p; };
const msayLast = {};
function msay(kind){ const l = MSAY[kind]; let t; do { t = l[Math.floor(Math.random() * l.length)]; } while (l.length > 1 && t === msayLast[kind]); msayLast[kind] = t; return t; }
function shuffled(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function newShop(){ const slots = shuffled(SHOP_POOL).slice(0, SHOP_SLOTS); if (Math.random() < RARE_CHANCE) slots[Math.floor(Math.random() * SHOP_SLOTS)] = RARE_POOL[Math.floor(Math.random() * RARE_POOL.length)]; return {slots, opens:0, closed:0, buys:0, hist:[]}; }   // prateleira sorteada a cada partida
function pickNew(sold){   // item novo no lugar do vendido: nunca o mesmo, de preferência um que ainda não está na prateleira
  const onShelf = state.shop.slots.filter(Boolean);
  if (Math.random() < RARE_CHANCE) { const r = RARE_POOL.filter(t => !onShelf.includes(t)); if (r.length) return r[Math.floor(Math.random() * r.length)]; }
  let c = SHOP_POOL.filter(t => t !== sold && !onShelf.includes(t));
  if (!c.length) c = SHOP_POOL.filter(t => t !== sold);
  return c[Math.floor(Math.random() * c.length)];
}
let bubbleT = null;
function fitBox(el, max, min, byWidth){      // reduz a fonte (em cqw) até o texto caber inteiro na caixa
  const inner = el.firstElementChild || el;
  let f = max; el.style.fontSize = f + 'cqw';
  const over = () => byWidth ? el.scrollWidth > el.clientWidth + 1 : (inner.offsetHeight > el.clientHeight + 1 || inner.scrollWidth > el.clientWidth + 1);
  while (f > min && over()) { f = Math.round((f - .1) * 10) / 10; el.style.fontSize = f + 'cqw'; }
}
function mBubble(text, mad){          // fala do mercador: no cantinho dele (mesma caixa da confirmação de compra)
  const b = $('#m-say'); if (!b) return; clearTimeout(bubbleT);
  b.classList.toggle('mad', !!mad); b.innerHTML = '<span></span>'; b.firstChild.textContent = text; fitBox(b, 2, 1.1, false); b.classList.remove('say-in'); void b.offsetWidth; b.classList.add('say-in');
  bubbleT = setTimeout(() => { b.textContent = ''; }, 3200 + text.length * 55);
}
function mPuff(){ const p = $('#m-puffs'); if (!p) return; for (let i = 0; i < 6; i++) { const d = document.createElement('i'); d.className = 'm-puff'; d.style.left = (Math.random() * 60) + '%'; d.style.top = (Math.random() * 20) + '%'; d.style.animationDelay = (i * 70) + 'ms'; p.appendChild(d); setTimeout(() => d.remove(), 1500); } }
function renderShop(opt = {}){
  const bp = $('#bag-panel'); bp.classList.toggle('shut', state.shop.closed > 0);
  state.shop.slots.forEach((type, i) => {
    const b = bp.querySelector('.shop.s' + i); if (!b) return; b.innerHTML = '';
    b.disabled = !type; b.classList.toggle('rare', !!(type && ITEMS[type].rare));
    if (opt.sold === i && opt.soldType) b.insertAdjacentHTML('beforeend', `<img class="s-ghost" src="${ITEMS[opt.soldType].icon}" alt="">`);
    if (!type) return;
    const it = ITEMS[type];
    b.insertAdjacentHTML('beforeend', `<img class="s-icon${opt.arrive && opt.arrive.includes(i) ? ' arrive' : ''}" src="${it.icon}" alt=""><img class="s-coin" src="icon_coin.png" alt=""><b class="s-price">${priceOf(type)}</b>`);
    b.setAttribute('aria-label', 'Comprar ' + it.name);
  });
}
function mMood(n){ const st = $('#m-stage'); if (!st) return; st.classList.toggle('mad', n >= 8); st.style.setProperty('--mrage', n >= 11 ? .85 : n >= 10 ? .6 : .3); }
function merchantOpened(){        // jogador abriu a mochila/loja
  const sh = state.shop;
  if (sh.closed > 0) { mBubble(msay('shut')); return; }
  sh.opens++; const n = sh.opens;
  mMood(n);
  if (n >= SHOP_CLOSE_AT) { mBubble(msay('close'), true); setTimeout(shopClose, 1900); return; }
  if (n <= 7 && sh.hist.length && Math.random() < .35) { const c = sh.hist[Math.floor(Math.random() * sh.hist.length)], l = MCOMMENT[c]; mBubble(l[Math.floor(Math.random() * l.length)]); return; }
  mBubble(msay(n <= 4 ? 'hi' : n <= 7 ? 'meh' : n <= 9 ? 'bad' : 'mad'), n >= 10);
}
function shopClose(){
  const sh = state.shop; if (sh.closed > 0) return;
  sh.closed = SHOP_CLOSED_Q; sh.opens = 0; sh.buys = 0;
  mPuff(); setTimeout(() => { $('#m-stage').classList.add('shut'); $('#m-stage').classList.remove('mad'); renderShop(); }, 380);
  toast(`O Mercador fechou a loja por ${SHOP_CLOSED_Q} perguntas.`);
}
function shopTick(){               // fim de cada pergunta: conta o tempo da loja fechada
  const sh = state.shop;
  if (sh.closed > 0) {
    sh.closed--;
    if (sh.closed === 0) { mPuff(); $('#m-stage').classList.remove('shut'); mMood(0); renderShop(); toast('O Mercador reabriu a loja.'); if (!$('#bag-panel').hidden) mBubble(msay('back')); }
    return;
  }
}
function requestBuy(slot){
  if (state.shop.closed > 0) { toast('A loja está fechada.'); mBubble(msay('shut')); return; }
  const type = state.shop.slots[slot]; if (!type) { toast('Prateleira vazia.'); return; }
  const item = ITEMS[type];
  if (state.pendingAction || state.voteLocked) { toast('Já existe uma votação aberta.'); return; }
  if (state.gold < priceOf(type)) { toast('Moedas insuficientes.'); return; }
  if (!canAdd(type)) { toast('Mochila cheia.'); return; }
  if (item.info) toast(item.name + ': ' + item.info + (hasAff(type) ? ' AFINIDADE: +50% de efeito para o seu herói.' : ''));
  openMerchantVote(item.ask, {type:'buy', item:type, slot});
}
function executeBuy(type, slot){
  const item = ITEMS[type];
  if (state.shop.closed > 0 || state.shop.slots[slot] !== type) { toast('Item indisponível.'); return false; }
  if (state.gold < priceOf(type)) { toast('Moedas insuficientes.'); return false; }
  if (!canAdd(type)) { toast('Mochila cheia.'); return false; }
  state.stats.spent += priceOf(type); state.gold -= priceOf(type); state.inventory.push(type);
  const sh = state.shop; sh.buys++; sh.hist.push(itemCat(type)); if (sh.hist.length > 6) sh.hist.shift();
  state.shop.slots[slot] = null; state.shop.opens = 0; mMood(0); renderShop({sold:slot, soldType:type}); mBubble(msay(sh.buys === DISCOUNT_AFTER ? 'deal' : 'sold')); if (sh.buys === DISCOUNT_AFTER) setTimeout(() => renderShop(), 1150);
  setTimeout(() => { if (state.shop.slots[slot] || state.shop.closed > 0) return; state.shop.slots[slot] = pickNew(type); renderShop({arrive:[slot]}); if (ITEMS[state.shop.slots[slot]].rare) mBubble(msay('rare')); }, 1100);
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
const HUD_W = 220, HUD_Y = 722;   // barra pequena: largura (px do grid 1024) e posição vertical
const HUD_IMG = {"mage": {"w": 1419, "h": 259, "hp": [0.2276, 0.7498, 0.3745, 0.1544], "mp": [0.2276, 0.7498, 0.6873, 0.1583]}, "knight": {"w": 1420, "h": 246, "hp": [0.2275, 0.7493, 0.3211, 0.1626], "mp": [0.2275, 0.7493, 0.6585, 0.1585]}, "tank": {"w": 1420, "h": 246, "hp": [0.2275, 0.7493, 0.313, 0.1585], "mp": [0.2275, 0.7493, 0.6463, 0.1585]}, "assassin": {"w": 1421, "h": 241, "hp": [0.2273, 0.7488, 0.2822, 0.1618], "mp": [0.2273, 0.7488, 0.6224, 0.1618]}};   // proporção e interior das barras (frações) de hud_<herói>.png
const HUD = {
  boss:{x:251, y:70, w:525, h:19},
  rage:{x:300, y:100, w:424, h:17},
  icons:{}, heroes:{}
};
['mage', 'knight', 'tank', 'assassin'].forEach(k => { const m = HUD_IMG[k], x = Math.round(clampHud(HERO_X[k] / 100 * 1024 - HUD_W / 2)); HUD.icons[k] = x; HUD.heroes[k] = [x, HUD_Y, HUD_W, Math.round(HUD_W * m.h / m.w)]; });
function clampHud(x){ return Math.max(6, Math.min(1024 - HUD_W - 6, x)); }
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
    const [x, y, w, h] = HUD.heroes[k], m = HUD_IMG[k], wrap = document.createElement('div'); wrap.className = 'hud-hero'; wrap.dataset.hero = k;
    wrap.style.cssText = `left:${pctX(x)};top:${pctY(y)};width:${pctX(w)};height:${pctY(h)};background-image:url(hud_${k}.png)`;
    const fill = (cls, f) => { const d = document.createElement('div'); d.className = 'hud-bar ' + cls; d.style.cssText = `left:${(f[0] + .004) * 100}%;top:${(f[2] + f[3] * .1) * 100}%;width:${(f[1] - .012) * 100}%;height:${f[3] * .8 * 100}%`; d.innerHTML = '<i></i>'; wrap.appendChild(d); return d.querySelector('i'); };
    $('#game').appendChild(wrap); bars[k] = {hp: fill('hp', m.hp), mp: fill('mp', m.mp)};
  });
  HERO_ORDER.forEach(k => {
    const d = document.createElement('div'); d.className = 'ult-icon'; d.dataset.hero = k;
    const ix = HUD.icons[k];
    const iy = HUD_Y + HUD.heroes[k][3] + 3, IS = 30, ox = {mage:80, knight:318, tank:562, assassin:804}[k];
    d.style.cssText = `left:${pctX(ix)};top:${pctY(iy)};width:${pctX(IS)};height:${pctY(IS)};background-size:2327% auto;background-position:${ox / 980 * 100}% ${757 / 1492 * 100}%`;
    d.onclick = () => { if (k !== activeGroup || !state.ultReady[k]) return; const c = document.querySelector('#am-list .act-card.ult:not(:disabled)'); if (c) c.click(); else toast('O especial é ativado na vez do seu herói, no menu de habilidades.'); };
    $('#game').appendChild(d); bars['ult_' + k] = d;
  });
  HERO_ORDER.forEach(k => {
    const s = document.createElement('div'); s.className = 'hero-status'; s.hidden = true;
    s.style.cssText = `left:${pctX(HUD.icons[k] + 34)};top:${pctY(HUD_Y + HUD.heroes[k][3] + 8)};width:${pctX(150)}`; $('#game').appendChild(s); bars['st_' + k] = s;
  });
  const mk = document.createElement('div'); mk.className = 'boss-marks'; mk.style.cssText = `left:${pctX(HUD.rage.x)};top:${pctY(122)}`; $('#game').appendChild(mk); bars.marks = mk;
  const r = document.createElement('div'); r.className = 'rage';
  r.style.cssText = `left:${pctX(HUD.rage.x - 62)};top:${pctY(HUD.rage.y)};width:${pctX(HUD.rage.w + 62)};height:${pctY(HUD.rage.h)}`;
  r.innerHTML = '<span class="rage-label">FÚRIA</span><div class="rage-seg">' + '<b></b>'.repeat(RAGE_MAX) + '</div>';
  $('#game').appendChild(r); bars.rage = r;
}
function renderHud(){
  const b = state.buff, st = {mage: b.bh > 0 ? 'BURACO NEGRO x3' : '', knight: b.bers > 0 ? `BERSERK ${b.bers}` : b.tired > 0 ? 'EXAUSTO' : '', tank: b.taunt > 0 ? `PROVOCAÇÃO ${b.taunt}` : '', assassin: ''};
  HERO_ORDER.forEach(k => { const el = bars['st_' + k]; if (!el) return; el.textContent = st[k]; el.hidden = !st[k]; el.classList.toggle('bad', k === 'knight' && b.tired > 0); });
  A.setAura('boss', state.burn > 0 ? 'orange' : state.prepNext ? 'charge' : (state.rage >= RAGE_MAX || state.hardNext) ? 'rage' : null);
  const mk = bars.marks; if (mk && state.burn > 0) mk.innerHTML = `<span>QUEIMANDO ${state.burn}</span><img src="${pixIcon('fire')}" alt="Fogo">`; else if (mk) mk.innerHTML = state.marks.length ? '<span>MARCAS</span>' + state.marks.map(e => `<img src="${pixIcon({fire:'fire',water:'drop',air:'wind',earth:'rock'}[e])}" alt="${ELEMENTS[e].name}">`).join('') : '';
  bars.boss.style.width = Math.max(0, state.bossHp / BOSS_MAX_HP * 100) + '%';
  HERO_ORDER.forEach(k => {
    bars[k].hp.style.width = Math.max(0, state.heroes[k].hp / HERO_MAX_HP * 100) + '%';
    bars[k].mp.style.width = Math.max(0, state.heroes[k].mp / 100 * 100) + '%';
  });
  HERO_ORDER.forEach(k => A.setDead(k, state.heroes[k].hp <= 0));
  A.setAura('mage', b.bh > 0 ? 'blue' : null); A.setAura('knight', b.bers > 0 ? 'red' : b.tired > 0 ? 'tired' : null); A.setAura('tank', b.taunt > 0 ? 'orange' : null);
  HERO_ORDER.forEach(k => bars['ult_' + k].classList.toggle('ready', !!state.ultReady[k]));
  bars.rage.querySelectorAll('.rage-seg b').forEach((el, i) => el.classList.toggle('on', i < state.rage));
  bars.rage.classList.toggle('full', state.rage >= RAGE_MAX);
}

// ===== Painel (pergunta / ação) =====
function openPanel(){ $('#action-menu').hidden = true; $('#dynamic-question').classList.remove('exiting'); $('#dynamic-ui').hidden = false; $('#dynamic-question').hidden = false; }
function openSkillMenu(){ $('#dynamic-question').hidden = true; $('#action-menu').hidden = true; const m = $('#skill-menu'); m.classList.remove('exiting'); m.hidden = false; $('#dynamic-ui').hidden = false; }
const pc = b => `left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%`;
function buildSkillFrame(panel, title, text, at, seconds){
  const M = MENU_META[panel], fr = $('#skm-frame'), L = $('#skm-layer');
  fr.src = `menu_${panel}.png`; L.innerHTML = '';
  const add = (cls, box, html) => { const d = document.createElement('div'); d.className = cls; d.style.cssText = pc(box); d.innerHTML = html; L.appendChild(d); return d; };
  if (M.title) add('sk-title', M.title, `<b>${title}</b><span>${text}</span>`);
  add('sk-tipo', M.tipo, `<img src="icon_tipo_sword.png" alt=""><div><small>TIPO</small><b>${at ? at.tipo : 'FÍSICO'}</b></div>`);
  add('sk-time', M.time, `<span id="vote-timer" class="sk-time">${seconds}s</span>`);
  return M;
}
function buildQuestionPanel(text, at, seconds, side){
  const Q = MENU_META.question, L = $('#dq-layer'); L.innerHTML = '';
  const add = (id, cls, box, html) => { const d = document.createElement('div'); if (id) d.id = id; d.className = cls; d.style.cssText = pc(box); d.innerHTML = html; L.appendChild(d); return d; };
  const e = at ? ELEMENTS[at.attr] : null;
  add('', 'dq-val', Q.tipo, at ? at.tipo : '');
  const ad = add('', 'dq-val sm', Q.attr, at ? `<i class="dq-dot"></i>${e.name}` : ''); if (e) { ad.style.setProperty('--ec', e.color); ad.style.color = e.color; }
  add('dq-text', '', Q.title, `<span></span>`).firstChild.textContent = text;
  add('', 'dq-coin', Q.coin, side ? side.reward : '0');
  if (side) add('', 'dq-diff d' + side.d, [Q.title[0] + Q.title[2] - 9.6, Q.title[1] + 2.2, 11, 7], `<small>RANK</small><b>${side.rank}</b>`);
  add('', 'dq-side-timer', Q.time, `<span id="vote-timer" class="dq-side-timer">${seconds}s</span>`);
  return L;
}
function fitText(){
  const fit = (box, inner, minPx) => { if (!box || !inner) return; let fs = parseFloat(getComputedStyle(box).fontSize); box.style.fontSize = fs + 'px';
    while (inner.offsetHeight > box.clientHeight + 1 && fs > minPx) box.style.fontSize = (fs -= 1) + 'px'; };
  const t = $('#dq-text'); if (t && !$('#dynamic-question').hidden) fit(t, t.firstChild, 9);
  document.querySelectorAll('.dq-answer .label').forEach(l => fit(l, l.firstChild, 9));
}
function openMenu(){ $('#dynamic-question').hidden = true; const m = $('#action-menu'); m.classList.remove('exiting'); m.hidden = false; $('#dynamic-ui').hidden = false; }
function attackChips(at){
  if (!at) return '';
  const e = ELEMENTS[at.attr];
  return `<span class="chip"><small>TIPO</small><b>${at.tipo}</b></span>` +
         `<span class="chip" style="--ec:${e.color}"><small>ATRIBUTO</small><b><i class="dot"></i>${e.name}</b></span>`;
}
async function closePanel(){
  const m = $('#action-menu'), q = $('#dynamic-question'), ui = $('#dynamic-ui');
  const sm = $('#skill-menu');
  const dq = !sm.hidden ? sm : !m.hidden ? m : q; dq.classList.add('exiting'); await wait(250);
  // some por completo (nada fica na tela durante a resolução)
  m.hidden = true; q.hidden = true; sm.hidden = true; ui.hidden = true; m.classList.remove('exiting'); q.classList.remove('exiting'); sm.classList.remove('exiting');
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
  const hx = HUD.heroes[hero], fx = hx[0] - 4, fw = hx[2] + 8;
  m.style.setProperty('--col', col);
  m.innerHTML =
    `<div class="tm-beam" style="left:${x}%"></div>` +
    `<img class="tm-arrow" style="left:${x}%" src="${pixIcon('arrow')}" alt="">`;
  $('#game').appendChild(m);
}
function hideRing(){ const m = $('#turn-marker'); if (m) m.remove(); }
function bannerKind(t){t=String(t).toUpperCase();if(/ULTIMATE/.test(t))return 'ult';if(/LUZ SAGRADA|ESQUIVOU|DESNORTEADO/.test(t))return 'good';if(/BOSS|ONDA|ESTOCADA|TELEPORTE|GOLPE|PREPARANDO/.test(t))return 'bad';return ''}
function showBanner(t, sub){ const b=$('#turn-banner'); const key=t+'|'+(sub||''); if(b.dataset.k===key)return; b.dataset.k=key; __readUntil=Date.now()+readMs((t+' '+(sub||'')).replace(/<[^>]*>/g,''));
  if (paperOn()) { const k = bannerKind(t); $('.sc-in').classList.remove('fade'); scWrite($('#sc-t'), String(t).replace(/<[^>]*>/g, ''), k); scWrite($('#sc-s'), sub || ''); b.classList.remove('show'); return; }
  b.className='turn-banner show '+bannerKind(t); b.innerHTML=`${t}${sub?`<small>${sub}</small>`:''}`; }
function hideBanner(){ __readUntil=0; const b=$('#turn-banner'); b.classList.remove('show'); b.dataset.k=''; const si=$('.sc-in'); if(si){si.classList.add('fade'); setTimeout(()=>{ if(si.classList.contains('fade')){ $('#sc-t').textContent=''; $('#sc-s').textContent=''; } },520);} }
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
function runVote({type, text, options, seconds, side, menu, title, attack, panel, endsAt:fixedEnd}){
  return new Promise(resolve => {
    const endsAt = fixedEnd || Date.now() + seconds * 1000; seconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));   // prazo único: pode ser compartilhado entre menus (habilidade → elemento → voltar)
    const voters = groupMembers(), need = majorityOf(voters);
    const sv = options.map(() => 0); let my = null, locked = false, timer = null, bots = [];
    let list, M = null;
    if (menu && panel) { M = buildSkillFrame(panel, title, text, attack, seconds); list = $('#skm-layer'); }
    else if (menu) {
      $('#am-title').textContent = title; $('#am-text').textContent = text;
      $('#am-attack').innerHTML = attackChips(attack);
      $('#am-timer').innerHTML = `<span id="vote-timer" class="dq-side-timer">${seconds}s</span>`;
      list = $('#am-list'); list.innerHTML = '';
    } else { list = buildQuestionPanel(text, attack, seconds, side); }
    const enabled = options.map((o, i) => o.disabled ? -1 : i).filter(i => i >= 0);
    const btns = options.map((o, i) => {
      const b = document.createElement('button'); b.type = 'button';
      if (M) {
        const [r, c] = o.slot, cd = M.cards[r][c], cn = M.cnt[r * 2 + c];
        b.className = `sk-card ${o.kind || ''}`; b.style.cssText = pc(cd);
        b.innerHTML = `<b class="cnt sk-cnt" style="left:${(cn[0] - cd[0]) / cd[2] * 100}%;top:${(cn[1] - cd[1]) / cd[3] * 100}%;width:${cn[2] / cd[2] * 100}%;height:${cn[3] / cd[3] * 100}%">0</b>`;
        b.setAttribute('aria-label', o.label);
        if (o.block) b.insertAdjacentHTML('beforeend', `<span class="lock">${o.block}</span>`);
      } else if (menu) {
        b.className = `act-card ${o.kind || ''}`;
        b.innerHTML = `<span class="ac-icon">${o.icon ? `<img src="${pixIcon(o.icon)}" alt="">` : ''}</span><span class="ac-name"></span><span class="ac-desc"></span><span class="ac-chips"></span><b class="cnt">0</b>`;
        b.querySelector('.ac-name').textContent = o.label; b.querySelector('.ac-desc').textContent = o.desc || '';
        b.querySelector('.ac-chips').innerHTML = o.chips || '';
        if (o.color) b.style.setProperty('--ec', o.color);
      } else {
        b.className = 'dq-answer'; b.style.cssText = pc(MENU_META.question.rows[i]);
        b.innerHTML = `<span class="label"><span></span></span><b class="cnt">0</b>`;
        b.querySelector('.label span').textContent = o.label + (o.note ? `  ${o.note}` : '');
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
    panel ? openSkillMenu() : menu ? openMenu() : openPanel();
    fitText();
    const timerEl = () => $(panel ? '#skm-layer' : menu ? '#am-timer' : '#dq-layer').querySelector('#vote-timer');   // cada painel tem o seu (o id repetido pegava o da pergunta, escondido)
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      const el = timerEl(); if (el) { el.textContent = left + 's'; el.classList.toggle('urgent', left <= 3); }
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
  let pool = QUESTIONS.map((q, i) => ({q, i})).filter(o => o.q.difficulty === diff);
  for (let k = 1; !pool.length && k < 5; k++) pool = QUESTIONS.map((q, i) => ({q, i})).filter(o => Math.abs(o.q.difficulty - diff) === k);
  let c; do { c = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && c.i === state.lastQ[diff]);
  state.lastQ[diff] = c.i; return c.q;
}
if (TEST_MODE) window.__bd = {state};
window.BD_RAGE = () => Math.max(state.rage / RAGE_MAX, state.phase2 ? .7 : 0);   // fase 2: olhos do boss ficam sempre acesos
const aliveHeroes = () => HERO_ORDER.filter(k => state.heroes[k].hp > 0);

// Fase 2: ao cair a 50% de HP, raios caem no fundo, o cenário pisca várias vezes e o boss fica mais forte (sem fala)
async function maybePhase2(){
  if (state.phase2 || state.over || state.bossHp <= 0 || state.bossHp > BOSS_MAX_HP * PHASE2_AT) return;
  state.phase2 = true;
  showBanner('FASE 2', `o Lorde das Trevas despertou: Onda Sombria +${PHASE2_AOE} até o fim`);
  A.play('boss', 'enrage');
  const g = $('#game'), fl = document.createElement('div');
  fl.style.cssText = 'position:absolute;inset:0;z-index:39;pointer-events:none;opacity:0;background:radial-gradient(120% 90% at 50% 18%,#ffffff,#b9ccff 45%,#5a3cff 100%);mix-blend-mode:screen';
  g.appendChild(fl);
  fl.animate([{opacity:0},{opacity:.85,offset:.06},{opacity:0,offset:.14},{opacity:.55,offset:.22},{opacity:0,offset:.3},{opacity:.95,offset:.42},{opacity:0,offset:.5},{opacity:.4,offset:.6},{opacity:0,offset:.68},{opacity:1,offset:.8},{opacity:0}], {duration:2600, easing:'linear'}).finished.then(() => fl.remove());
  [0, 260, 620, 980, 1400, 1850].forEach(t => setTimeout(() => { if (window.AMB) AMB.bolt(); }, t));
  g.animate([{transform:'translate(0,0)'},{transform:'translate(-5px,3px)'},{transform:'translate(5px,-3px)'},{transform:'translate(-3px,-2px)'},{transform:'translate(0,0)'}], {duration:240, iterations:10});
  flashHit(); await wait(3000); hideBanner(); renderHud();
}
// Evento: Arca do Tesouro. O grupo vota abrir ou ignorar; pode dar moedas, uma poção ou ser armadilha.
const CHEST_CHANCE = .22, CHEST_FROM = 3, CHEST_GAP = 4, CHEST_TRAP = 12;
async function maybeChest(){
  if (state.over || state.round < CHEST_FROM || state.round - state.chestAt < CHEST_GAP || Math.random() >= CHEST_CHANCE || (TEST_MODE && window.__force === 'nochest')) return;
  state.chestAt = state.round;
  const g = $('#game'), img = document.createElement('img');
  img.className = 'chest'; img.src = 'chest_closed.png'; img.alt = ''; g.appendChild(img);
  showBanner('ARCA DO TESOURO', 'uma arca misteriosa apareceu: abrir ou ignorar?'); A.sfx && A.sfx('right');
  while (state.pendingAction || state.voteLocked) await wait(300);
  const open = await new Promise(res => { state.chestDone = res; openMerchantVote('Abrir a arca?', {type:'chest'}); });
  hideBanner();
  if (!open) { img.classList.add('out'); setTimeout(() => img.remove(), 500); return; }
  img.src = 'chest_open.png'; img.classList.add('opened'); await wait(500);
  const r = Math.random();
  if (r < .15) {          // armadilha
    showBanner('ARMADILHA!', `a arca explode: todos perdem ${CHEST_TRAP} de HP`); flashHit();
    HERO_ORDER.forEach(k => { const h = state.heroes[k]; if (h.hp <= 0) return; const m = itemMit(k, CHEST_TRAP, false); h.hp = Math.max(0, h.hp - m.d); A.play(k, 'hurt', {light:true}); floatText(HERO_X[k], 56, `-${m.d}${m.note}`, '#ff6b81'); });
    renderHud(); await wait(1800); hideBanner();
  } else if (r < .45 && (() => { const p = ['hp_s','hp','mana_s','mana']; state.chestPotion = p[Math.floor(Math.random() * p.length)]; return canAdd(state.chestPotion); })()) {   // poção
    const t = state.chestPotion; state.inventory.push(t); persist(); renderInventoryHits();
    showBanner('A ARCA TINHA UMA POÇÃO', ITEMS[t].name); await wait(1800); hideBanner();
  } else {                // moedas
    const n = 4 + Math.floor(Math.random() * 5); state.gold += n; state.stats.gained += n; persist(); goldGain(n);
    showBanner('A ARCA TINHA MOEDAS', `+${n} moedas`); await wait(1800); hideBanner();
  }
  img.classList.add('out'); setTimeout(() => img.remove(), 500);
}
async function bossIntro(ev = {}){
  const game = $('#game');
  if (state.hardNext) {
    showBanner('O BOSS ENFURECEU!', `pergunta rank S/SS a caminho · Onda Sombria +${ENRAGE_AOE}`);
    flashHit(); A.play('boss', 'enrage'); A.sayRandom('boss', 'enrage', 1); state.enraged = true; await wait(2300); hideBanner();
    state.rage = 0; state.hardNext = false; renderHud(); return;
  }
  if (ev.prep) {
    state.prepNext = true; renderHud();
    showBanner('PREPARANDO HABILIDADE', 'só a Onda Sombria agora… o PRÓXIMO golpe será 50% mais forte: DEFENDAM!');
    flashHit(); A.play('boss', 'prep'); A.sayRandom('boss', 'enrage', .6); await wait(2400); hideBanner(); return;
  }
  if (ev.tele) {
    const t = ev.tele; showBanner('TELEPORTE!', `o boss sumiu… vai surgir atrás de ${GROUPS[t]}! Use ESQUIVA!`);
    A.play('boss', 'tpOut'); A.fx('boss', 'mark', {x:HERO_WX(t), y:1085}); A.sayRandom('boss', 'laugh', .5); await wait(1900); hideBanner(); return;
  }
  if (ev.dazed) { showBanner('BOSS DESNORTEADO!', 'o Super Pesado do Tanque o atordoou: +25% de dano nele e sem habilidades especiais'); A.play('boss', 'hurt'); floatText(50, 17, 'DESNORTEADO!', '#ffd34d'); await wait(1600); hideBanner(); return; }
  if (ev.empowered) { showBanner('GOLPE REFORÇADO!', 'dano +50% nesta rodada — defender corta pela metade'); flashHit(); await wait(900); hideBanner(); }
  game.classList.add('boss-attack'); A.play('boss', 'attack'); A.sayRandom('boss', 'intro', .5); await wait(1000); game.classList.remove('boss-attack');
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
  const b = state.buff; let note = ULT_INFO[k], cleTarget = null;
  if (k === 'assassin') {   // Luz Sagrada: primeiro escolhe quem recebe; sem escolha no tempo = não usa (continua disponível)
    const list = healTargets(), valid = list.filter(t => !t.block);
    if (k === activeGroup && state.heroes[k].hp > 0) {
      const r = await chooseTarget('LUZ SAGRADA', 'Quem recebe a luz?', list, null); await closePanel();
      if (!r || !valid.some(v => v.hero === r)) { toast('Tempo esgotado: a Luz Sagrada não foi usada e continua disponível.'); return false; }
      cleTarget = r;
    } else cleTarget = valid.slice().sort((x, y) => state.heroes[x.hero].hp - state.heroes[y.hero].hp)[0].hero;
  }
  state.ultReady[k] = false;
  showBanner(`${GROUPS[k]}: ${ULT_NAME[k].toUpperCase()}!`, note);
  const tx = cleTarget ? HERO_X[cleTarget] / 100 * 1024 : null;
  const ultPl = A.play(k, 'ult', cleTarget ? {tx, ty:1098} : {}); A.sayRandom(k, 'ult', 1);
  if (k === 'mage') { await wait(3000); await heroAttack(k, Math.round(HERO_BASE.mage * BH_PARTS[0]), '#b36bff', true); await wait(550); await heroAttack(k, Math.round(HERO_BASE.mage * BH_PARTS[1]), '#d9a8ff', true); state.ultCd.mage = 1; }   // 1º estouro 1,5x + 2º estouro 2,5x = 4x
  else if (k === 'knight') { b.bers = 2; b.tired = 0; }
  else if (k === 'tank') b.taunt = 2;
  else {
    const t = cleTarget; await wait(2500);   // a luz desce sobre o alvo e só então a vida muda
    const h = state.heroes[t];
    if (h.hp <= 0) { h.hp = REVIVE_HP; floatText(HERO_X[t], 56, 'REVIVEU!', '#ffe08a'); }
    else { h.hp = Math.min(HERO_MAX_HP, h.hp + HEAL_AMOUNT); floatText(HERO_X[t], 56, `+${HEAL_AMOUNT}`, '#9fe3a8'); }
    showBanner(`Luz Sagrada: ${GROUPS[t]}`, h.hp === REVIVE_HP ? 'voltou à luta!' : 'vida restaurada');
  }
  renderHud(); await Promise.all([wait(1200), ultPl]); hideBanner(); return true;
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
const ARTICLE = {mage:'DA', knight:'DO', tank:'DO', assassin:'DA'};
const SLOT = {   // posição [linha, coluna] de cada habilidade no quadro do herói
  assassin:{ult:[0,0], holy_atk:[1,0], holy_def:[2,0], atk:[0,1], def:[1,1], dodge:[2,1]},
  mage:{ult:[0,0], elem_atk:[1,0], elem_def:[2,0], mana_atk:[0,1], mana_def:[1,1], dodge:[2,1]},
  knight:{ult:[0,0], heavy:[1,0], def:[2,0], atk:[0,1], pass:[1,1], dodge:[2,1]},
  tank:{ult:[0,0], super:[1,0], def:[2,0], atk:[0,1], guard:[1,1], dodge:[2,1]}
};
async function chooseSkill(k){
  const at = state.curAttack, list = SKILLS[k];
  let endsAt = null;   // o relógio da vez é um só: continua descendo ao escolher o elemento e ao voltar
  for (;;) {
    if (!endsAt) endsAt = Date.now() + ACTION_SECONDS * 1000;
    const ult = state.ultReady[k] && ultUsable(k);
    const opts = [];
    // o especial aparece sempre; só dá para escolher depois de acertar uma pergunta rank S/SS
    opts.push({label:'ESPECIAL: ' + ULT_NAME[k], kind:'ult', slot:SLOT[k].ult, disabled:!ult, block:ult ? null : (state.ultReady[k] ? 'SEM ALVO' : (state.ultCd[k] || 0) > 0 ? 'RECARGA 1 S/SS' : 'ACERTE RANK S/SS')});
    list.forEach(sk => { const b = skillBlock(k, sk); opts.push({label:sk.name, kind:sk.kind, slot:SLOT[k][sk.id], disabled:!!b, block:b}); });
    const r = await runVote({menu:true, panel:k, title:`VEZ ${ARTICLE[k]} ${GROUPS[k]}`, text:'Escolham a habilidade', seconds:ACTION_SECONDS, endsAt, attack:at, options:opts});
    if (r.idx === null) return null;
    if (r.idx === 0) { await closePanel(); await activateUlt(k); endsAt = null; continue; }   // ultimate ativado: o efeito começa a contar agora
    const sk = list[r.idx - 1]; let element = null;
    if (sk.elem) {
      const els = ['fire','water','air','earth'];
      const r2 = await runVote({
        menu:true, panel:'elem', title:'', text:'', seconds:ACTION_SECONDS, endsAt, attack:at,
        options: els.map((e, n) => ({label:ELEMENTS[e].name, kind:'elem', slot:[n >> 1, n & 1]})).concat([{label:'VOLTAR', kind:'back', slot:[2, 0]}])
      });
      if (r2.idx === els.length) continue;           // voltou ao menu de habilidades
      if (r2.idx === null) return null;              // tempo acabou sem decisão no menu de elementos = como não escolher nada
      element = els[r2.idx];
    }
    return {skill:sk, element};
  }
}


// ---- Gag cômico (1x por partida): o boss tenta invocar um Dragão Esqueleto (HITKILL), mas só vem um goblin.
const GAG_SPOT = {x:50.5, y:49.5};   // % do #game (pés do goblin)
async function gagDragon(){
  state.gag = true;
  const g = $('#game'), wp = (xp, yp) => ({x:xp * 10.24, y:yp * 15.36});
  const sp = wp(GAG_SPOT.x, GAG_SPOT.y);
  showBanner('BOSS INVOCANDO!', 'ele tenta invocar um DRAGÃO ESQUELETO');
  const cast = A.play('boss', 'gagCast'); A.sayRandom('boss', 'enrage', .8);
  await wait(1700);
  showBanner('ALERTA: HITKILL!', 'se der certo, mata TODOS os heróis de uma vez');
  flashHit();
  const al = HERO_ORDER.map(k => { const d = document.createElement('div'); d.className = 'gag-alert'; d.style.left = HERO_X[k] + '%'; d.innerHTML = '<b>☠</b><i>HITKILL</i>'; g.appendChild(d); return d; });
  await Promise.all([cast, wait(2400)]);
  // puf: surge o goblin
  A.fx('boss', 'puff', {x:sp.x, y:sp.y - 30, n:18, r:80});
  al.forEach(d => d.classList.add('out')); setTimeout(() => al.forEach(d => d.remove()), 400);
  const gb = document.createElement('img'); gb.className = 'gag-goblin'; gb.src = 'boss/goblin.png'; gb.alt = '';
  gb.style.left = GAG_SPOT.x + '%'; gb.style.top = GAG_SPOT.y + '%'; g.appendChild(gb);
  await wait(450);
  showBanner('...UM GOBLIN?', 'pequeno e fraquinho. O boss não entendeu nada');
  const bub = document.createElement('div'); bub.className = 'gag-bubble'; bub.textContent = '?!'; g.appendChild(bub);
  await A.play('boss', 'gagLook'); bub.remove();
  showBanner('DESINVOCANDO...', 'o Lorde das Trevas manda o goblin de volta');
  const dis = A.play('boss', 'gagDismiss');
  await wait(750);
  A.fx('boss', 'puff', {x:sp.x, y:sp.y - 30, n:14, r:70});
  gb.classList.add('gone'); setTimeout(() => gb.remove(), 500);
  await dis;
  showBanner('DRAGÃO CANCELADO', 'o boss desistiu da invocação... por enquanto');
  await wait(1900); hideBanner();
}
function maybeGag(where){
  if (state.gag || state.over || state.bossHp <= 0 || aliveHeroes().length === 0) return Promise.resolve();
  const force = TEST_MODE && window.__force === 'gag';
  const p = where === 'start' ? .16 : .1;
  if (!force && !(state.round >= 2 && (Math.random() < p || state.round >= 6))) return Promise.resolve();
  return gagDragon();
}

async function playRound(){
  if (state.over) return;
  await QREADY;
  state.round++;
  const enragedNow = state.hardNext, empowered = state.prepNext && !enragedNow;
  const dazed = state.dazedNext; state.dazedNext = false; if (dazed) state.stun = true;
  let prepWarn = false, tele = null;
  if (!dazed && !empowered && !enragedNow && state.round >= 2 && Math.random() < PREP_CHANCE) prepWarn = true;
  if (!dazed && !empowered && !prepWarn && !enragedNow && state.round > TELE_FROM && state.teleCd <= 0 && Math.random() < TELE_CHANCE) { const al = aliveHeroes().sort((a, b) => state.heroes[a].hp - state.heroes[b].hp); tele = al[0] || null; if (tele) state.teleCd = TELE_CD; }
  const FORCE = TEST_MODE ? window.__force : null;   // só em ?teste=1: força um evento do boss (verificação)
  if (FORCE === 'prep' && !empowered && !enragedNow) { prepWarn = true; tele = null; }
  if (FORCE === 'tele' && !empowered && !enragedNow) { prepWarn = false; tele = aliveHeroes().sort((a, b) => state.heroes[a].hp - state.heroes[b].hp)[0] || null; }
  await bossIntro({prep:prepWarn, tele, empowered, dazed});
  if (!prepWarn && !tele && !dazed && !empowered && !enragedNow) { await maybeGag('start'); await maybeChest(); if (aliveHeroes().length === 0) return endGame(false); }
  state.sinceHard = (state.sinceHard || 0) + 1;
  if (state.sinceHard >= HARD_EVERY) state.forceHard = true;   // pergunta S/SS garantida: mantém os ultimates aparecendo
  const q = pickQuestion(state.forceHard ? (Math.random() < .7 ? 4 : 5) : rollDiff());
  if (isHardQ(q)) state.sinceHard = 0;
  state.forceHard = false; state.curQ = q;
  const meta = DIFFICULTY[q.difficulty];
  state.curAttack = BOSS_ATTACK;

  // ---- 1) pergunta: o grupo vota na alternativa (contagem visível só para o próprio grupo)
  const res = await runVote({
    attack: state.curAttack, text: q.text, seconds: QUESTION_SECONDS[q.difficulty],
    options: q.answers.map(label => ({label})),
    side: {reward:meta.reward, label:meta.label, rank:meta.rank, d:q.difficulty}
  });
  // grupos controlados por outros jogadores: simulados (sem backend não dá para ver o voto real deles)
  const correct = {};
  HERO_ORDER.forEach(k => correct[k] = k === activeGroup ? res.idx === q.correct : Math.random() < 0.6);
  showBanner('AGUARDANDO OS OUTROS GRUPOS', 'ninguém vê a escolha dos outros'); await wait(1400); hideBanner();
  // revela
  res.btns.forEach((b, i) => { b.classList.remove('chosen'); if (i === q.correct) b.classList.add('correct'); else if (i === res.idx) b.classList.add('wrong'); });
  A.sfx(correct[activeGroup] ? 'right' : 'wrong');
  state.stats.rank[q.difficulty][correct[activeGroup] ? 0 : 1]++;
  if (correct[activeGroup]) { let g = meta.reward; const lb = state.ib[activeGroup]; if (lb.lucky > 0) { g += lb.luckyAmt; lb.lucky--; } state.gold += g; state.stats.gained += g; persist(); goldGain(g); }
  else toast(res.idx === null ? 'Seu grupo não respondeu a tempo.' : 'Seu grupo errou.');
  if (isHardQ(q)) { const miss = HERO_ORDER.filter(k => state.heroes[k].hp > 0 && !correct[k]).length; if (miss) { state.rage = Math.min(RAGE_MAX, state.rage + miss); toast(`Erro no rank ${meta.rank}: fúria +${miss} e Onda Sombria mais forte.`); } }
  if (isHardQ(q)) HERO_ORDER.forEach(k => { if ((state.ultCd[k] || 0) > 0) { state.ultCd[k]--; return; } if (correct[k]) state.ultReady[k] = true; });   // recarga do Buraco Negro: pula uma pergunta S/SS inteira
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
  const kindOf = k => { const a = actions[k]; return a && a !== 'ult' && a.skill ? a.skill : null; };
  // ---- 2b) teleporte: o boss surge atrás do herói mais fraco; ESQUIVA anula e atordoa o boss
  if (tele && !state.over) {
    const t = state.heroes[tele].hp > 0 ? tele : (aliveHeroes()[0] || null);
    if (t) {
      showRing(t); const sk = kindOf(t), dodged = !!sk && sk.kind === 'dodge';
      showBanner('O BOSS SURGIU!', `atacando ${GROUPS[t]} por trás`); await wait(500);
      A.play('boss', 'tpIn', {tx:HERO_WX(t), ty:1000}); await Promise.race([A.hit('boss'), wait(3000)]);
      A.fx('boss', 'unmark');
      if (dodged) {
        A.play(t, 'dodge'); A.sayRandom(t, 'dodge', .6); floatText(HERO_X[t], 56, 'ESQUIVOU!', '#9fe3a8');
        state.stun = true; floatText(50, 17, 'ATORDOADO! +25% de dano', '#ffd34d'); showBanner('ESQUIVOU DO TELEPORTE!', 'o boss ficou atordoado: +25% de dano nele nesta rodada');
      } else {
        const red = sk && sk.kind === 'def' ? sk.reduce : 0; let d = Math.round(TELE_DMG * (1 - red));
        const m = itemMit(t, d, true); d = m.d;
        flashHit(); A.play(t, 'hurt'); A.sayRandom(t, 'hurt', .4); state.heroes[t].hp = Math.max(0, state.heroes[t].hp - d);
        floatText(HERO_X[t], 56, `-${d}${red ? ' (defesa)' : ''}${m.note}`, '#ff6b81');
      }
      renderHud(); await wait(900); A.play('boss', 'tpBack'); await wait(1000); hideBanner(); hideRing();
      if (aliveHeroes().length === 0) return endGame(false);
    }
  }
  const dmgBase = prepWarn ? 0 : Math.round(meta.damage * (empowered ? PREP_MULT : 1));
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
        A.play(k, 'pass'); A.sayRandom(k, 'pass', .6);
        if (correct[t] && state.heroes[t].hp > 0) { showRing(t); await doAttack(t, 'melee', null, Math.round(HERO_BASE[t] * 1.5)); } else floatText(HERO_X[t], 56, 'ERROU!', '#ff6b81');
        renderHud(); await wait(700); hideBanner(); hideRing();
        if (state.bossHp <= 0) return endGame(true);
        continue;
      }
      if (sk.kind === 'atk') {
        const bers = k === 'knight' && state.buff.bers > 0;
        if (ok || bers) {
          dmg = Math.round(HERO_BASE[k] * sk.mult); sub = ok ? 'acertou e atacou!' : 'errou, mas o Berserk atacou!';
          if (sk.elem && el && BOSS.immune.includes(el)) { dmg = 0; sub = `${ELEMENTS[el].name}: o boss é IMUNE!`; }
          else if (sk.elem && el && BOSS.weak.includes(el)) { dmg = Math.round(dmg * BOSS_WEAK_MULT); state.burn = BURN_TURNS; sub += ` ${ELEMENTS[el].name}: o boss é FRACO! ${String(BOSS_WEAK_MULT).replace('.', ',')}x e fica QUEIMANDO por ${BURN_TURNS} perguntas.`; }
          else if (sk.elem && el) { const r = applyMark(el); if (r) { dmg += r.dmg; sub += ` ${r.name}! +${r.dmg}`; if (r.rage) state.rage = Math.max(0, state.rage + r.rage); } else sub += ` Marca de ${ELEMENTS[el].name.toLowerCase()}.`; }
          if (bers) { dmg = Math.round(dmg * 1.5); sub += ' Berserk 1,5x!'; }
          if (dmg > 0 && k === 'tank' && sk.id === 'super') state.dazedNext = true;
          if (dmg > 0 && k === 'mage' && state.buff.bh > 0) { dmg *= 3; sub += ' Buraco Negro x3!'; }
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
    if (sk && sk.id === 'guard') { A.play(k, 'guard', {color:'#ff9d3d'}); A.sayRandom(k, 'guard', .6); }
    if (dmg > 0 || (sk && sk.kind === 'atk' && sk.elem && el && BOSS.immune.includes(el) && (ok || (k === 'knight' && state.buff.bers > 0)))) { await doAttack(k, skAnim(k, sk), col, dmg, skSay(k, sk)); }   // elemental no boss imune: faz o ataque (efeito visível), dano 0
    else if (hurt > 0) { if (defended) { A.play(k, 'guard', {color:guardColor(sk, el)}); A.sayRandom(k, 'defend', .5); await wait(250); } await bossCounter(k, hurt, defended); }
    else if (sk && sk.kind === 'dodge') { A.play(k, 'dodge'); A.sayRandom(k, 'dodge', .55); if (!ok) floatText(HERO_X[k], 58, 'ESQUIVOU!', '#9fe3a8'); }
    else if (sk && sk.kind === 'def') { A.play(k, 'guard', {color:guardColor(sk, el)}); A.sayRandom(k, 'defend', .4); }
    renderHud(); await wait(700);
    hideBanner(); hideRing();
    if (state.bossHp <= 0) return endGame(true);
    if (aliveHeroes().length === 0) return endGame(false);
    if (k !== HERO_ORDER[HERO_ORDER.length - 1] || Math.random() < .5) await maybeGag('hit');
  }

  await maybePhase2();
  // ---- 3b) estocada: só quando o Tanque está com Provocação/Proteção; atravessa a guarda e fere um aliado
  { const tankUp = state.heroes.tank.hp > 0; let tt = null, why = '';
    if (state.thrustCd > 0 || dazed) { /* em recarga ou desnorteado */ }
    else if (!state.over && tankUp && state.buff.taunt > 0) { const al = aliveHeroes().filter(h => h !== 'tank'); tt = al[Math.floor(Math.random() * al.length)] || null; why = 'ignora a Provocação'; }
    else if (!state.over && tankUp && state.guardFor && state.heroes[state.guardFor].hp > 0) { tt = state.guardFor; why = 'ignora a Proteção'; }
    if (tt) {
      state.thrustCd = THRUST_CD;
      const sk = kindOf(tt), dodged = !!sk && sk.kind === 'dodge', red = sk && sk.kind === 'def' ? sk.reduce : 0; let d = Math.round(THRUST_DMG * (1 - red));
      showBanner('ESTOCADA!', `${why}: vai em ${GROUPS[tt]} (ESQUIVA anula, defesa reduz)`); showRing(tt); await wait(700);
      A.play('boss', 'thrust', {tx:HERO_WX(tt), ty:1010}); await Promise.race([A.hit('boss'), wait(3000)]);
      if (dodged) { A.play(tt, 'dodge'); floatText(HERO_X[tt], 56, 'ESQUIVOU!', '#9fe3a8'); }
      else { const m = itemMit(tt, d, true); d = m.d; flashHit(); A.play(tt, 'hurt'); A.sayRandom(tt, 'hurt', .4); state.heroes[tt].hp = Math.max(0, state.heroes[tt].hp - d); floatText(HERO_X[tt], 56, `-${d}${red ? ' (defesa)' : ''}${m.note}`, '#ff6b81'); }
      renderHud(); await wait(900); hideBanner(); hideRing();
      if (aliveHeroes().length === 0) return endGame(false);
    } }
  // ---- 3c) onda sombria: o boss fere todos os heróis vivos a cada rodada (tira a vantagem de só jogar certo)
  { const hardMiss = isHardQ(q) ? HERO_ORDER.filter(k => state.heroes[k].hp > 0 && !correct[k]).length : 0;   // erro em rank S/SS: Onda Sombria +50%
    const aoe = Math.round((meta.aoe + (state.enraged ? ENRAGE_AOE : 0) + (state.phase2 ? PHASE2_AOE : 0)) * (hardMiss ? HARD_MISS_AOE : 1));
    if (aoe && !state.over) {
      showBanner('ONDA SOMBRIA', `o Lorde das Trevas fere todos: -${aoe}${state.enraged ? ' (enfurecido +' + ENRAGE_AOE + ')' : ''}${state.phase2 ? ' (fase 2 +' + PHASE2_AOE + ')' : ''}${hardMiss ? ' (erro no rank ' + meta.rank + ': +50%)' : ''}`); flashHit(); A.play('boss', 'aoe'); A.sayRandom('boss', 'aoe', .7);
      await Promise.race([A.hit('boss'), wait(2500)]);
      HERO_ORDER.forEach(k => { const h = state.heroes[k]; if (h.hp > 0) { A.play(k, 'hurt', {light:true}); let a = (state.buff.taunt > 0 && k !== 'tank' && state.heroes.tank.hp > 0) ? Math.round(aoe / 2) : aoe; const m = itemMit(k, a, false); a = m.d; h.hp = Math.max(0, h.hp - a); floatText(HERO_X[k], 56, `-${a}${m.note}`, '#b36bff'); } });
      renderHud(); await wait(1100); hideBanner();
      if (aliveHeroes().length === 0) return endGame(false);
    } }

  // ---- 4) fim da rodada: recargas, mana, fúria e duração dos efeitos
  shopTick();
  await itemRoundEnd();
  if (state.bossHp <= 0) return endGame(true);
  if (state.burn > 0) {   // fogo: dano contínuo no boss (0,25x do ataque normal) por 2 perguntas
    const bd = Math.max(1, Math.round(ATTACK_DAMAGE * BURN_MULT)); state.burn--;
    state.bossHp = Math.max(0, state.bossHp - bd); floatText(50, 17, `-${bd} 🔥`, '#ff7a2e'); A.play('boss', 'hurt', {light:true}); renderHud(); await wait(900);
    if (state.bossHp <= 0) return endGame(true);
  }
  await maybePhase2();
  { const b = state.buff;
    if (b.bh > 0) b.bh--; state.guardFor = null; state.thrustCd = Math.max(0, state.thrustCd - 1); state.teleCd = Math.max(0, state.teleCd - 1); state.stun = false; state.enraged = false; if (empowered) state.prepNext = false;
    if (b.bers > 0) { b.bers--; if (b.bers === 0) b.tired = 1; } else if (b.tired > 0) b.tired--;
    if (b.taunt > 0) b.taunt = state.heroes.tank.hp > 0 ? b.taunt - 1 : 0; }
  HERO_ORDER.forEach(k => {
    Object.keys(state.cd[k]).forEach(id => { state.cd[k][id] = Math.max(0, state.cd[k][id] - 1); });
    const act = actions[k]; if (act && act.skill.cd > 0) state.cd[k][act.skill.id] = act.skill.cd;
  });
  renderHud();
  if (state.rage >= RAGE_MAX) { state.hardNext = true; state.forceHard = true; }
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
const RIG_HERO = k => k === 'mage' || k === 'assassin' || k === 'tank' || k === 'knight';   // têm animação própria com projétil/efeito: o dano só entra no impacto
async function doAttack(k, an, col, dmg, say){
  const pl = A.play(k, an, {color:col}); if (say) A.sayRandom(k, say, .5);
  if (!RIG_HERO(k)) { await wait(an === 'heavy' ? 480 : 300); return heroAttack(k, dmg, col); }
  await Promise.race([A.hit(k), wait(4500)]);
  await heroAttack(k, dmg, col, true);
  await Promise.race([pl, wait(3500)]);
}
async function heroAttack(hero, dmg = ATTACK_DAMAGE, colOverride = null, landed = false){
  const col = colOverride || HERO_COLOR[hero], game = $('#game');
  if (!landed) {
    await shoot(HERO_X[hero], 61, 50, 24, col);
    const imp = $('#boss-impact'); imp.style.background = `radial-gradient(circle,#fff,${col} 35%,transparent 68%)`;
    imp.classList.remove('active'); void imp.offsetWidth; imp.classList.add('active');
  }
  game.classList.remove('boss-hit'); void game.offsetWidth; game.classList.add('boss-hit');
  if (dmg <= 0) { floatText(50, 17, 'IMUNE!', '#b8c4d9'); renderHud(); await wait(600); game.classList.remove('boss-hit'); return; }
  if (state.stun) dmg = Math.round(dmg * STUN_MULT);
  { const o = itemOff(hero, dmg); dmg = o.d; if (o.note) floatText(HERO_X[hero], 50, o.note, '#ffd34d'); }
  state.bossHp = Math.max(0, state.bossHp - dmg); A.play('boss', 'hurt'); A.sayRandom('boss', 'hurt', .3);
  floatText(50, 17, `-${dmg}`, col === '#d9e6ff' ? '#ffffff' : col);
  renderHud(); await wait(600); game.classList.remove('boss-hit');
}
async function bossCounter(hero, dmg, defended){
  const r = routeHit(hero, dmg), t = r.to;
  const anim = {1:'slashH', 2:'slashV', 3:'slashH', 4:'summon', 5:'summon'}[state.curQ ? state.curQ.difficulty : 1] || 'slashH';
  if (A.has('boss', anim)) { A.play('boss', anim, {tx:HERO_WX(t), ty:1010}); await Promise.race([A.hit('boss'), wait(3500)]); }
  else await shoot(50, 26, HERO_X[t], 60, '#ff2d4d', 560);
  const m = itemMit(t, r.dmg, true); r.dmg = m.d; r.note += m.note;
  flashHit();
  state.heroes[t].hp = Math.max(0, state.heroes[t].hp - r.dmg); if (!(defended && t === hero)) A.play(t, 'hurt'); A.sayRandom(t, 'hurt', .35);
  floatText(HERO_X[t], 56, `-${r.dmg}${defended ? ' (defesa)' : ''}${r.note}`, '#ff6b81');
  renderHud(); await wait(500);
}

const pickAlive = () => { const l = HERO_ORDER.filter(k => state.heroes[k].hp > 0); return l[Math.floor(Math.random() * l.length)] || 'knight'; };
function endGame(win){
  state.over = true; clearTimeout(turnTimer); A.sfx(win ? 'win' : 'lose');
  if (win) { A.play('boss', 'die'); A.sayRandom('boss', 'die', 1); HERO_ORDER.forEach(k => { A.play(k, 'victory'); }); A.sayRandom(pickAlive(), 'win', 1); }
  else { A.play('boss', 'laugh'); A.sayRandom('boss', 'win', 1); }
  const o = $('#end-screen'); o.querySelector('h2').textContent = win ? 'VITÓRIA!' : 'DERROTA';
  o.querySelector('p').textContent = win ? 'O Lorde das Trevas foi derrotado.' : 'Todos os heróis caíram.';
  if (win) { try { const d = JSON.parse(localStorage.getItem('bd1_progress')) || {done:[]}; if (!d.done.includes(0)) d.done.push(0); localStorage.setItem('bd1_progress', JSON.stringify(d)); sessionStorage.setItem('bd1_justwon', '0'); } catch {} }
  $('#to-map').textContent = win ? 'VOLTAR AO MAPA' : 'MAPA';
  { const st = state.stats, R = ['C','B','A','S','SS'], tot = Object.values(st.rank).reduce((a, [r, w]) => [a[0] + r, a[1] + w], [0, 0]), n = tot[0] + tot[1], pct = n ? Math.round(tot[0] / n * 100) : 0, bossPct = Math.max(0, Math.round(state.bossHp / BOSS_MAX_HP * 100));
    $('#end-stats').innerHTML = `<div class="es-row"><span>Rodadas</span><b>${state.round}</b></div><div class="es-row"><span>Seu acerto</span><b>${tot[0]}/${n} (${pct}%)</b></div>` +
      `<div class="es-ranks">${R.map((r, i) => `<div class="es-r d${i + 1}"><em>${r}</em><span>${st.rank[i + 1][0]} / ${st.rank[i + 1][1]}</span></div>`).join('')}</div>` +
      `<div class="es-cap">certas / erradas por rank</div><div class="es-row"><span>Moedas ganhas / gastas</span><b>${st.gained} / ${st.spent}</b></div><div class="es-row"><span>Itens usados</span><b>${st.used}</b></div>` + (win ? '' : `<div class="es-row"><span>Vida restante do boss</span><b>${bossPct}%</b></div>`); }
  o.classList.toggle('win', win); o.hidden = false;
}
// Abertura da batalha (intro.js). Em ?teste=1 fica desligada, a menos que ?intro=1; ?intro=0 sempre desliga.
const INTRO_ON = (new URLSearchParams(location.search).get('intro') || (TEST_MODE ? '0' : '1')) === '1';
const bossCanvas = () => document.querySelector('canvas.hero.boss');
function beginBattle(delay){
  clearTimeout(turnTimer);
  const go = () => { turnTimer = setTimeout(playRound, delay); };
  const intro = document.getElementById('intro');
  if (!INTRO_ON || !window.Intro) { if (intro) intro.hidden = true; return go(); }
  const bc = bossCanvas(); if (bc) bc.style.opacity = 0;   // o boss só aparece na fumaça
  const n = groupMembers();
  Intro.play({voters:n, need:majorityOf(n), bots:TEST_MODE, onReveal:() => { const c = bossCanvas(); if (c) c.style.opacity = ''; A.play('boss', 'tpBack'); }}).then(() => setTimeout(go, 500));
}
function restartRun(){
  A.reset(); closeTargetPick();
  Object.values(state.heroes).forEach(h => { h.hp = HERO_MAX_HP; h.mp = 100; });
  state.stats = newStats(); Object.assign(state, {phase2:false, chestAt:-9, sinceHard:0, bossHp:BOSS_MAX_HP, rage:0, hardNext:false, forceHard:false, over:false, round:0, dazedNext:false, thrustCd:0, teleCd:0, prepNext:false, stun:false, enraged:false});
  HERO_ORDER.forEach(k => { state.cd[k] = {}; state.ultReady[k] = false; state.ultCd[k] = 0; });
  state.shop = newShop(); { const st = $('#m-stage'); if (st) { st.classList.remove('shut','mad'); } } renderShop(); state.marks = []; state.burn = 0; state.buff = {bh:0, bers:0, tired:0, taunt:0}; state.guardFor = null; state.ib = allBuffs();
  $('#end-screen').hidden = true; renderHud(); beginBattle(800);
}

// ===== Efeitos dos itens do Mercador (valem para o herói deste jogador) =====
function itemMit(hero, d, direct){      // dano recebido: escudo, fumaça, amuleto, elmo
  const b = state.ib[hero]; if (!b || d <= 0) return {d, note:''};
  if (b.shield > 0) { b.shield--; return {d:0, note:' (escudo!)'}; }
  if (direct && b.smoke > 0) return {d:0, note:' (fumaça!)'};
  let note = '';
  if (b.amulet > 0) { d = Math.round(d * 0.7); note += ' (amuleto)'; }
  if (b.helm > 0) { d = Math.max(1, d - 8); note += ' (elmo)'; }
  return {d, note};
}
function itemOff(hero, d){               // dano causado: lâmina, pólvora, tônico, lente, dado
  const b = state.ib[hero]; if (!b || d <= 0) return {d, note:''};
  const n = [];
  if (b.blade > 0) d += b.blade;
  if (b.powder > 0) { const p = b.powder === 2 ? 22 : 15; b.powder = 0; d += p; n.push('POLVORA +' + p); }
  if (b.tonic > 0) { d = Math.round(d * 1.25); n.push('FURIA +25%'); }
  if (b.lens > 0) { const c = b.lens === 2 ? 2.2 : 1.8; b.lens = 0; d = Math.round(d * c); n.push('CRITICO ' + String(c).replace('.', ',') + 'x!'); }
  if (b.dice > 0) { b.dice--; const L = b.diceAff ? [1, 1.5, 2, 3] : [0.5, 1, 1.5, 2, 3], m = L[Math.floor(Math.random() * L.length)]; d = Math.round(d * m); n.push('DADO ' + String(m).replace('.', ',') + 'x'); }
  return {d, note:n.join(' ')};
}
async function itemRoundEnd(){          // fim da rodada: bomba de luz, erva, duração dos efeitos
  let bomb = 0;
  HERO_ORDER.forEach(k => {
    const b = state.ib[k], h = state.heroes[k];
    bomb += b.bomb; b.bomb = 0;
    if (b.herb > 0 && h.hp > 0) { h.hp = Math.min(HERO_MAX_HP, h.hp + 8); floatText(HERO_X[k], 56, '+8', '#9fe3a8'); }
    ['herb','amulet','helm','smoke','tonic'].forEach(f => { if (b[f] > 0) b[f]--; });
  });
  if (bomb > 0) { state.bossHp = Math.max(0, state.bossHp - bomb); floatText(50, 17, `-${bomb} BOMBA`, '#fff2a8'); A.play('boss', 'hurt', {light:true}); }
  renderHud(); if (bomb > 0) await wait(900);
}
const FX = {
  shield:(b, h, f, t) => { b.shield = f ? 2 : 1; return f ? 'Escudo de Ferro: os próximos 2 golpes serão bloqueados.' : 'Escudo de Ferro erguido: o próximo golpe será bloqueado.'; },
  amulet:(b, h, f, t) => { b.amulet = f ? 5 : 3; return `Amuleto ativo: -30% de dano por ${b.amulet} rodadas.`; },
  helm:(b, h, f, t) => { b.helm = f ? 5 : 3; return `Elmo ativo: -8 de dano por golpe, ${b.helm} rodadas.`; },
  smoke:(b, h, f, t) => { b.smoke = f ? 3 : 2; return `Fumaça! Golpes diretos erram por ${b.smoke} rodadas.`; },
  herb:(b, h, f, t) => { b.herb = f ? 6 : 4; return `Erva ativa: +8 de HP por rodada, ${b.herb} rodadas.`; },
  lens:(b, h, f, t) => { b.lens = f ? 2 : 1; return `Lente pronta: próximo ataque será crítico (${f ? '2,2' : '1,8'}x).`; },
  tonic:(b, h, f, t) => { b.tonic = f ? 5 : 3; return `Fúria: +25% de dano por ${b.tonic} rodadas.`; },
  powder:(b, h, f, t) => { b.powder = f ? 2 : 1; return `Pólvora pronta: próximo ataque +${f ? 22 : 15}.`; },
  blade:(b, h, f, t) => { b.blade += f ? 6 : 4; return `Lâmina afiada: +${b.blade} de dano permanente.`; },
  lightbomb:(b, h, f, t) => { b.bomb += f ? 60 : 40; return `Bomba armada: explode no fim da rodada (${b.bomb} de dano).`; },
  lucky:(b, h, f, t) => { b.lucky = f ? 5 : 3; b.luckyAmt = f ? 5 : 3; return `Moeda da Sorte: +${b.luckyAmt} moedas por acerto, ${b.lucky} perguntas.`; },
  hourglass:(b, h, f, t) => { state.cd[t] = {}; h.mp = Math.min(100, h.mp + (f ? 40 : 20)); return `Ampulheta: recargas zeradas e +${f ? 40 : 20} de mana.`; },
  elixir:(b, h, f, t) => { const n = f ? 75 : 50; h.hp = Math.min(HERO_MAX_HP, h.hp + n); h.mp = Math.min(100, h.mp + n); return `Elixir: +${n} de HP e +${n} de mana.`; },
  scroll:(b, h, f, t) => { state.ultReady[t] = true; state.ultCd[t] = 0; if (f) h.mp = Math.min(100, h.mp + 30); return 'Pergaminho: ULTIMATE carregado!' + (f ? ' +30 de mana.' : ''); },
  dice:(b, h, f, t) => { b.dice = f ? 4 : 3; b.diceAff = !!f; return `Dado lançado: próximos ${b.dice} ataques com dano sorteado${f ? ' (sem resultado ruim)' : ''}.`; },
  phoenix:(b, h, f, t) => { h.hp = 60; return 'Pena de Fênix: seu herói voltou com 60 de HP!'; }
};
function applyItem(index, tgt){
  const type=state.inventory[index];if(!type)return;
  const item=ITEMS[type], hero=state.heroes[tgt], who=tgt===activeGroup?'':` em ${GROUPS[tgt]}`;
  if(item.kind==='fx'){
    if(item.fx==='phoenix'){ if(hero.hp>0){toast(tgt===activeGroup?'A Pena de Fênix só serve para herói caído.':`${GROUPS[tgt]} não está caído.`);return} if(aliveHeroes().length===0){toast('Sem aliados de pé, a Fênix não responde.');return} }
    else if(hero.hp<=0){toast(tgt===activeGroup?'O herói caiu e não pode usar itens.':`${GROUPS[tgt]} caiu e não pode receber itens.`);return}
    if(item.fx==='elixir'&&hero.hp>=HERO_MAX_HP&&hero.mp>=100){toast('HP e mana já estão cheios.');return}
    if(item.fx==='scroll'&&state.ultReady[tgt]){toast('O Ultimate já está carregado.');return}
    const f=hasAff(type,tgt), msg=FX[item.fx](state.ib[tgt],hero,f,tgt)+(f?' (AFINIDADE)':'');state.stats.used++;state.inventory.splice(index,1);persist();renderInventoryHits();renderHud();toast(tgt===activeGroup?msg:`${GROUPS[tgt]} recebeu: ${msg}`);return;
  }
  const max = item.kind==='hp' ? HERO_MAX_HP : 100;
  if(hero.hp<=0 && item.kind==='hp'){toast(tgt===activeGroup?'O herói caiu e não pode ser curado.':`${GROUPS[tgt]} caiu e não pode ser curado.`);return}
  if(hero[item.kind]>=max){toast(item.kind==='hp'?'HP já está cheio.':'Mana já está cheia.');return}
  hero[item.kind]=Math.min(max,hero[item.kind]+item.amount);state.stats.used++;state.inventory.splice(index,1);persist();renderInventoryHits();renderHud();toast(`${item.name} usada${who}.`);
}
function giveable(type){ const it = ITEMS[type]; return it.kind === 'hp' || it.kind === 'mp' || GIVE.has(it.fx); }
function closeTargetPick(){ const p = $('#tgt-pick'); if (p) p.remove(); }
function useInventory(index){
  const type=state.inventory[index];if(!type)return;
  const others = HERO_ORDER.filter(k => k !== activeGroup && (type === 'phoenix' ? state.heroes[k].hp <= 0 : state.heroes[k].hp > 0));
  if(!giveable(type) || !others.length){ applyItem(index, activeGroup); return; }
  closeTargetPick();
  const box = document.createElement('div'); box.id = 'tgt-pick';
  box.innerHTML = `<div class="tp-back"></div><div class="tp-box"><b class="tp-title">${ITEMS[type].name}: usar em quem?</b><div class="tp-list"></div></div>`;
  const list = box.querySelector('.tp-list');
  (type === 'phoenix' && state.heroes[activeGroup].hp > 0 ? others : [activeGroup, ...others]).forEach(k => {
    const h = state.heroes[k], b = document.createElement('button'); b.type = 'button';
    b.innerHTML = `<span>${k === activeGroup ? 'VOCÊ' : GROUPS[k]}</span><small>HP ${h.hp} · MANA ${h.mp}${hasAff(type, k) ? ' · AFINIDADE' : ''}</small>`;
    b.addEventListener('click', () => { closeTargetPick(); applyItem(index, k); });
    list.appendChild(b);
  });
  box.querySelector('.tp-back').addEventListener('click', closeTargetPick);
  $('#game').appendChild(box);
}
// Mochila: 6 slots; itens iguais empilham até 3 por slot (o inventário salvo continua sendo uma lista de ids)
const BAG_SLOTS = 6, STACK_MAX = 3;
function inventoryStacks(){
  const st = [];
  state.inventory.forEach((type, i) => {
    let s = st.find(x => x.type === type && x.count < STACK_MAX);
    if (!s) { s = {type, count:0, idx:i}; st.push(s); }
    s.count++; s.idx = i;
  });
  return st;
}
function canAdd(type){ const st = inventoryStacks(); return st.length < BAG_SLOTS || st.some(x => x.type === type && x.count < STACK_MAX); }
function renderInventoryHits(){
  const root=$('#inventory-hits');root.innerHTML='';const st=inventoryStacks();
  for(let i=0;i<BAG_SLOTS;i++){const s=st[i],b=document.createElement('button');b.className='inventory-hit';b.type='button';b.setAttribute('aria-label',s?`Usar ${ITEMS[s.type].name}${s.count>1?' (x'+s.count+')':''}`:'Slot vazio');
    if(s){const img=document.createElement('img');img.className='inv-icon';img.src=ITEMS[s.type].icon;img.alt='';b.appendChild(img);
      if(s.count>1){const c=document.createElement('i');c.className='inv-count';c.textContent=s.count;b.appendChild(c)}
      b.addEventListener('click',()=>useInventory(s.idx))}
    root.appendChild(b)}
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
  addInventoryItem:k=>{if(canAdd(k)){state.inventory.push(k);persist();renderInventoryHits()}}
};

$('#back-lobby').addEventListener('click',()=>{LOBBY.leave();location.href='index.html'});
$('#hitmap').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const action=b.dataset.action;
});
function setBag(on){ $('#bag-panel').hidden = !on; $('#bag-back').hidden = !on; $('#bag-toggle').setAttribute('aria-expanded', on); }
$('#bag-toggle').addEventListener('click', () => { const op = $('#bag-panel').hidden; setBag(op); if (op) merchantOpened(); else mBubble(''); });
$('#bag-back').addEventListener('click', () => { setBag(false); mBubble(''); });
$('#bag-panel').addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.action === 'buy') requestBuy(+b.dataset.slot); });
$('.merchant-vote').addEventListener('click',e=>{const b=e.target.closest('.vote-choice');if(b)vote(b.dataset.vote)});

state.shop = newShop(); renderShop();
buildHud();renderHud();renderGold();renderInventoryHits();updateVoteUI();
$('#restart').addEventListener('click',restartRun);
$('#to-map').addEventListener('click',()=>{LOBBY.leave&&0;location.href='map.html'+location.search});
beginBattle(1500);   // abertura (votável) → boss se materializa → primeira pergunta
// v132: o aviso de nova versão saiu do jogo; a atualização manual fica no menu de seleção de grupo (botão ↻ ATUALIZAR)
if('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'}));

