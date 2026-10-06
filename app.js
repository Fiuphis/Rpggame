/* Banco de Dados I — RPG
   Front-end mobile build. The supplied PNG remains the visual base.
   Moedas/itens salvos por grupo em localStorage. Votação multiplayer real entre celulares precisa de backend (próxima etapa).
*/
const ST = window.STAGE || {name:'Malgorath, Lorde das Trevas', aoe:'Onda Sombria', weak:['holy','fire'], immune:['water','air','earth'], burnEl:'fire', ice:false, gag:true, famName:'DEMONÍACO', famAdj:'demoníaco', elemTxt:'fogo causa 1,5x e queima por 2 perguntas; água, ar e terra não causam dano (só efeito)', elemDef:'fogo', holyAtk:'é', holyDef:'é', p2Title:'FASE 2', p2Txt:n => `Malgorath, Lorde das Trevas, despertou: Onda Sombria +${n} até o fim`, p2Wait:3000, win:'Malgorath, Lorde das Trevas, foi derrotado.', id:0};

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
  smokebomb:{name:'Bomba de Fumaça', ask:'Comprar Bomba de Fumaça?', price:11, kind:'fx', fx:'smoke', icon:'item_smokebomb.png', info:`Você escapa dos golpes diretos do boss por 2 rodadas (a ${ST.aoe} ainda acerta).`},
  // cura
  elixir:{name:'Elixir Completo', ask:'Comprar Elixir Completo?', price:16, kind:'fx', fx:'elixir', icon:'item_elixir.png', info:'Restaura 30 de HP e 30 de mana.'},
  herb:{name:'Erva Curativa', ask:'Comprar Erva Curativa?', price:9, kind:'fx', fx:'herb', icon:'item_herb.png', info:'Cura 8 de HP no fim de cada rodada, por 4 rodadas.'},
  // crítico e dano
  lens:{name:'Lente do Caçador', ask:'Comprar Lente do Caçador?', price:11, kind:'fx', fx:'lens', icon:'item_lens.png', info:'Seu próximo ataque que acertar é CRÍTICO (1,8x de dano).'},
  tonic:{name:'Tônico de Fúria', ask:'Comprar Tônico de Fúria?', price:12, kind:'fx', fx:'tonic', icon:'item_tonic.png', info:'Seus ataques causam +25% de dano por 3 rodadas.'},
  powder:{name:'Pólvora Negra', ask:'Comprar Pólvora Negra?', price:8, kind:'fx', fx:'powder', icon:'item_powder.png', info:'Seu próximo ataque causa +15 de dano.'},
  blade:{name:'Lâmina Afiada', ask:'Comprar Lâmina Afiada?', price:25, kind:'fx', fx:'blade', rare:true, icon:'item_blade.png', info:'RARO: permanente, todos os seus ataques causam +10 de dano até o fim da partida.'},
  lightbomb:{name:'Bomba de Luz', ask:'Comprar Bomba de Luz?', price:13, kind:'fx', fx:'lightbomb', icon:'item_lightbomb.png', info:'Explode no fim da rodada: 40 de dano direto no boss.'},
  // mana, especial e utilidade
  hourglass:{name:'Ampulheta do Tempo', ask:'Comprar Ampulheta do Tempo?', price:14, kind:'fx', fx:'hourglass', icon:'item_hourglass.png', info:'Zera a recarga de todas as suas habilidades e dá +20 de mana.'},
  luckycoin:{name:'Moeda da Sorte', ask:'Comprar Moeda da Sorte?', price:6, kind:'fx', fx:'lucky', icon:'item_luckycoin.png', info:'+3 moedas a cada acerto nas próximas 3 perguntas.'},
  // raros
  phoenix:{name:'Pena de Fênix', ask:'Comprar Pena de Fênix?', price:24, kind:'fx', fx:'phoenix', rare:true, icon:'item_phoenix.png', info:'RARO: revive seu herói caído com 100 de HP e cura 20 de HP dos aliados (só vale se algum aliado ainda estiver de pé).'},
  dice:{name:'Dado do Destino', ask:'Comprar Dado do Destino?', price:20, kind:'fx', fx:'dice', rare:true, icon:'item_dice.png', info:'RARO: seus próximos 4 ataques causam de 1x a 3x de dano, sorteado.'},
  watch_s:{name:'Relógio de Bolso', ask:'Comprar Relógio de Bolso?', price:30, kind:'fx', fx:'clock', secs:5, rare:true, legend:true, icon:'item_watch_s.png', info:'LENDÁRIO: só vale durante a pergunta: soma +5s ao tempo de resposta do seu grupo. Não pode ser dado a aliados.'},
  watch_l:{name:'Relógio Grande', ask:'Comprar Relógio Grande?', price:50, kind:'fx', fx:'clock', secs:10, rare:true, legend:true, icon:'item_watch_l.png', info:'LENDÁRIO: só vale durante a pergunta: soma +10s ao tempo de resposta do seu grupo. Não pode ser dado a aliados.'},
  scroll:{name:'Pergaminho Arcano', ask:'Comprar Pergaminho Arcano?', price:22, kind:'fx', fx:'scroll', rare:true, icon:'item_scroll.png', info:'RARO: carrega na hora o ULTIMATE do seu herói e recupera 60 de HP e 80 de mana, e dá +25% de dano por 3 rodadas.'}
};
const itemInfo = t => { const it = ITEMS[t]; return it.info || (it.kind === 'hp' ? `Restaura ${it.amount} de HP do seu herói (ou de um aliado).` : `Restaura ${it.amount} de mana do seu herói (ou de um aliado).`); };
const CAT_LABEL = {heal:'CURA', def:'DEFESA', atk:'ATAQUE', util:'UTILIDADE'};
const newStats = () => ({rank:{1:[0,0],2:[0,0],3:[0,0],4:[0,0],5:[0,0]}, gained:0, spent:0, used:0, leech:0});   // por rank: [acertos, erros]
const newBuffs = () => ({shield:0, amulet:0, helm:0, smoke:0, herb:0, lens:0, tonic:0, powder:0, blade:0, lucky:0, luckyAmt:3, dice:0, bomb:0});
// Afinidade: o herói indicado ganha +50% no efeito do item (duração, valor ou cargas).
// Afinidade (+50% no efeito) pelo papel de cada heroi: Maga = mana/magia e pouca defesa; Guerreiro = dano e furia; Tanque = defesa pesada e martelo; Clériga = cura, luz e fe.
const AFFINITY = {
  mage:['hourglass','scroll','elixir','amulet','smokebomb'],        // recarga/mana, ultimate arcano, mana do elixir, amuleto magico, fumaça (esquiva) p/ quem tem pouca defesa
  guerreiro:['lens','tonic','blade','dice','helm'],                    // critico, furia, espada, aposta de berserker, elmo de combate
  tank:['iron_shield','helm','amulet','powder'],                    // escudo, armadura, protecao, polvora no martelo
  cleriga:['herb','elixir','lightbomb','phoenix','luckycoin']      // erva, cura total, luz sagrada, ressurreicao, bencao da sorte (Clériga)
};
Object.entries(AFFINITY).forEach(([h, l]) => l.forEach(k => { (ITEMS[k].aff = ITEMS[k].aff || []).push(h); }));
const hasAff = (type, hero) => !!(ITEMS[type].aff && ITEMS[type].aff.includes(hero || activeGroup));
const allBuffs = () => ({mage:newBuffs(), guerreiro:newBuffs(), tank:newBuffs(), cleriga:newBuffs()});
// itens que podem ser dados a um aliado; os demais valem só para quem usa
const GIVE = new Set(['shield','amulet','helm','smoke','herb','elixir','phoenix']);

// ===== Configuração do combate (ajuste aqui) =====
const HERO_ORDER = ['mage','guerreiro','tank','cleriga'];
const HERO_COLOR = {mage:'#4d8dff', guerreiro:'#d9e6ff', tank:'#ff9d3d', cleriga:'#ff3d5c'};
const HERO_X = {mage:10.3, guerreiro:33.2, tank:63.5, cleriga:89.7};   // centro do herói (% da largura)
const BOSS_MAX_HP = ST.ice ? 600 : 650, HERO_MAX_HP = 100;
// Dano base por herói: Clériga baixo, Maga/Tanque médio, Guerreiro alto. Fraqueza certa (fogo da Maga) = alto; Buraco Negro = extremamente alto.
const HERO_BASE = {mage:14, guerreiro:21, tank:14, cleriga:10};
const ATTACK_DAMAGE = 14;          // dano do ataque básico (quando acertou a pergunta)
const DEFEND_REDUCTION = 0.5;      // defesa reduz o dano pela metade
const RAGE_MAX = 5, RAGE_DODGE = 1, RAGE_WASTED = 5;   // fúria: esquivar após errar +1; defender/esquivar após ACERTAR +5 (enche)
const QUESTION_SECONDS = {1:25, 2:30, 3:35, 4:40, 5:45}, ACTION_SECONDS = 25;   // tempo para responder: C 25s, B 30s, A 35s, S 40s, SS 45s
const ULT_NAME = {mage:'Buraco Negro', guerreiro:'Berserk', tank:'Provocação', cleriga:'Luz Sagrada'};
const ULT_ICON = {mage:'orb', guerreiro:'sword2', tank:'hammer2', cleriga:'cross'};
const ULT_INFO = {mage:'dano direto de 4x o dano base no boss; recarga: não volta na próxima pergunta rank S/SS, só na seguinte (se acertarem)', guerreiro:'ataca mesmo errando, com 1,5x de dano, e leva menos dano por 2 perguntas', tank:'todo o dano do boss vai nele (inclusive metade da '+ST.aoe+' dos aliados), com defesa dobrada, por 2 perguntas', cleriga:'revive ou cura um herói'};
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
  none:{name:'NORMAL', color:'#9a95b8'},
  fire:{name:'FOGO', color:'#ff7a2e'}, water:{name:'ÁGUA', color:'#3db4ff'},
  air:{name:'AR', color:'#9fe8d0'}, earth:{name:'TERRA', color:'#c19a52'},
  demon:{name:ST.famName, color:ST.ice ? '#7fd0ff' : '#b36bff'}, ice:{name:'GELO', color:'#7fd0ff'}, blood:{name:'SANGUE', color:'#ff5a6a'}, holy:{name:'SAGRADO', color:'#ffe08a'}
};
// Boss: fraco a FOGO e a SAGRADO (1,5x). Água, ar e terra: imune (a Maga faz o ataque só pelo efeito, dano 0). Sem marcas/reações; escudos só ganham bônus contra o que o fere.
const BOSS = {weak:ST.weak, immune:ST.immune};
const BURN_TURNS = 2, BURN_MULT = .25;   // fogo marca o boss: dano contínuo de 0,25x do dano normal por 2 perguntas
const BOSS_WEAK_HOLY = 2, BOSS_WEAK_HOLY_DEF = .8;   // fraqueza a SAGRADO: o Ataque Sagrado causa 2x e a Defesa Sagrada corta 80%. Só vale se o boss for fraco a sagrado (BOSS.weak); contra quem não é, as habilidades sagradas são só normais
const BOSS_WEAK_MULT = 1.5;   // fogo e sagrado ferem o boss em dobro-ish (1,5x); água, ar e terra: só o efeito visual, dano 0
const BOSS_FAMILY = ST.famName;   // o boss é demônio/vampiro: todo dano dele é demoníaco
// Ataques do boss (sorteados a cada pergunta; o tipo e o atributo aparecem no cartão da pergunta).
//  FÍSICO normal: sem atributo. FÍSICO demoníaco: um pouco mais forte, com vampirismo. ELEMENTAL: sempre demoníaco, o mais forte e o que mais suga vida.
const ATTACKS = {
  phys:  {id:'phys',  tipo:'FÍSICO',    attr:'none',  mult:.65,  leech:0},
  demon: {id:'demon', tipo:'FÍSICO',    attr:'demon', mult:.9,   leech:.08},
  elem:  {id:'elem',  tipo:'ELEMENTAL', attr:'demon', mult:1.15, leech:.15}
};
const ATTACK_ODDS = {1:[1,0,0], 2:[.7,.3,0], 3:[.4,.5,.1], 4:[.2,.45,.35], 5:[.05,.4,.55]};   // chance [normal, demoníaco, elemental] por rank da pergunta
const AOE_LEECH = .1;   // a Onda Sombria suga 10% do que os golpes diretos sugam
const LEECH_MISS = .02, LEECH_RAGE = .01, LEECH_P2 = .02, RAGE_DMG = .01;   // vampirismo +2% por herói que errou, +1% por ponto de fúria, +2% na fase 2; dano demoníaco +1% por ponto de fúria
const BOSS_ATTACK = ATTACKS.phys;
// ---- Hrimgar (ST.ice): muitos golpes pequenos por herói; o Frio congela, o sangue sangra ----
const ICE_ATK = {cut:{id:'cut', tipo:'FÍSICO', attr:'none', mult:1, leech:0}, ice:{id:'ice', tipo:'FÍSICO', attr:'ice', mult:1, leech:0}, blood:{id:'blood', tipo:'FÍSICO', attr:'blood', mult:1, leech:0}};
const ICE_DMG = [0, 3, 6, 7, 10, 12];                         // dano por golpe (calibrado por simulação em v265: vários golpes por herói somam muito)
const ICE_ODDS = {1:[1,0,0], 2:[.65,.25,.1], 3:[.4,.3,.3], 4:[.2,.4,.4], 5:[.1,.45,.45]};   // [corte, gélido, sangrento] por rank
const ICE_CRIT = [.12, .20], FRENZY_CRIT = .15, CRIT_MULT = 1.5;   // chance de crítico: fase 1 / fase 2 (+15% no Frenesi)
const ICE_BLEED = 5, ICE_BLEED_MAX = 3, ICE_BLEED_TURNS = 3;       // sangramento: 5 por acúmulo por rodada, ignora defesa
const ICE_FREEZE_AT = 4, FROZEN_MULT = 1.25, ICE_ARMOR = .15;      // 4 de Frio congelam; congelado leva +25%; Armadura de Gelo (fase 1): -15%
const STEP_MISS = [.6, .7], STEP_CHANCE = [.2, .28];                // Passo Gélido: chance de errar do físico / de ser avisado, por fase
const iceRoll = r => { const o = ICE_ODDS[r] || ICE_ODDS[1], x = Math.random(); return x < o[0] ? 'cut' : x < o[0] + o[1] ? 'ice' : 'blood'; };
function rollAttack(q, forceElem){
  if (ST.ice) return ICE_ATK[iceRoll(q.difficulty)];
  if (forceElem) return ATTACKS.elem;
  const o = ATTACK_ODDS[q.difficulty] || ATTACK_ODDS[1]; let r = Math.random();
  return r < o[0] ? ATTACKS.phys : r < o[0] + o[1] ? ATTACKS.demon : ATTACKS.elem;
}
function leechRate(){
  const at = state.curAttack; if (!at || !at.leech) return 0;
  return Math.min(.9, at.leech + LEECH_MISS * (state.missN || 0) + LEECH_RAGE * state.rage + (state.phase2 ? LEECH_P2 : 0));
}
// vampirismo: o boss recupera parte da vida que os heróis realmente perderam (defesa, esquiva e itens reduzem o ganho)
function bossLeech(lost){
  const r = leechRate(); if (r <= 0 || lost <= 0 || state.bossHp <= 0) return 0;
  const h = Math.min(Math.round(lost * r), BOSS_MAX_HP - state.bossHp); if (h <= 0) return 0;
  state.bossHp += h; state.stats.leech = (state.stats.leech || 0) + h;
  floatText(50, 17, `+${h} VAMPIRISMO`, '#b36bff'); renderHud(); return h;
}

// ===== Habilidades por classe =====
// kind: atk | def | dodge | util. mult: multiplicador do dano base. reduce: fração do dano do boss que a defesa corta.
// cd: perguntas de recarga. mana: custo. elem:true = pede o elemento depois. soon:true = efeito chega na etapa 2.
const SKILLS = {
  mage:[
    {id:'mana_atk', kind:'atk', name:'Ataque de Mana', desc:'Raio de mana. Dano normal.', mana:10, cd:0, mult:1},
    {id:'elem_atk', kind:'atk', name:'Ataque Elemental', desc:'Fogo, água, ar ou terra. Cada inimigo tem fraquezas próprias. Contra ' + ST.name + ': ' + ST.elemTxt + '.', mana:20, cd:1, mult:1.3, elem:true},
    {id:'mana_def', kind:'def', name:'Escudo de Mana', desc:'Barreira de mana. Corta 35% do dano.', mana:10, cd:0, reduce:.35},
    {id:'elem_def', kind:'def', name:'Escudo Elemental', desc:'Escudo de um elemento: corta 35%; corta 55% se for o elemento fraco do inimigo (contra ' + ST.name + ': ' + ST.elemDef + ').', mana:20, cd:1, reduce:.35, bonus:.55, elem:true},
    {id:'dodge', kind:'dodge', name:'Esquiva', desc:'Foge do ataque.', mana:0, cd:1}
  ],
  guerreiro:[
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
  cleriga:[
    {id:'atk', kind:'atk', name:'Ataque Normal', desc:'Golpe de cajado. Dano normal.', mana:0, cd:0, mult:1},
    {id:'holy_atk', kind:'atk', name:'Ataque Sagrado', desc:'Sagrado: 2x de dano em quem é fraco a ele (' + ST.name + ' ' + ST.holyAtk + ').', mana:20, cd:1, mult:1, holy:true},
    {id:'def', kind:'def', name:'Defesa Normal', desc:'Ergue as mãos. Corta 50% do dano.', mana:0, cd:0, reduce:.5},
    {id:'holy_def', kind:'def', name:'Defesa Sagrada', desc:'Sagrado: corta 80% do dano se o inimigo for fraco a ele (' + ST.name + ' ' + ST.holyDef + ').', mana:20, cd:1, reduce:.5, bonus:BOSS_WEAK_HOLY_DEF, holy:true},
    {id:'dodge', kind:'dodge', name:'Esquiva', desc:'Foge do ataque.', mana:0, cd:1}
  ]
};
// Tipo/atributo e ícone de cada habilidade (Guerreiro e Tanque: só físico; Maga: mágico + mana/elemento; Clériga: físico, sagrado nas especiais)
const SKILL_META = {
  mage:{mana_atk:['MÁGICO','MANA','orb'], elem_atk:['MÁGICO','ELEMENTAL','fire'], mana_def:['MÁGICO','MANA','shield'], elem_def:['MÁGICO','ELEMENTAL','drop'], dodge:[null,null,'dodge']},
  guerreiro:{atk:['FÍSICO',null,'sword'], heavy:['FÍSICO',null,'sword2'], pass:[null,null,'pass'], def:['FÍSICO',null,'shield'], dodge:[null,null,'dodge']},
  tank:{atk:['FÍSICO',null,'hammer'], super:['FÍSICO',null,'hammer2'], guard:[null,null,'guard'], def:['FÍSICO',null,'shield'], dodge:[null,null,'dodge']},
  cleriga:{atk:['FÍSICO',null,'staff'], holy_atk:['FÍSICO','SAGRADO','cross'], def:['FÍSICO',null,'shield'], holy_def:['FÍSICO','SAGRADO','cross'], dodge:[null,null,'dodge']}
};
Object.keys(SKILLS).forEach(k => SKILLS[k].forEach(s => { const m = SKILL_META[k][s.id] || []; s.tipo = m[0]; s.attr = m[1]; s.icon = m[2]; }));
// mana NÃO regenera: só sobe com Poção de Mana
const KIND_LABEL = {atk:'ATAQUE', def:'DEFESA', dodge:'ESQUIVA', util:'TÁTICA'};

const GROUPS = {mage:'MAGA', guerreiro:'GUERREIRO', tank:'TANQUE', cleriga:'CLÉRIGA'};
const PARAMS = new URLSearchParams(location.search);
// O grupo vem do lobby (página inicial). ?grupo=... só vale junto com ?teste=1.
const TEST_MODE = LOBBY.testMode; // simula os outros 6 jogadores votando
// Modo teste automatico (botao na tela inicial, chave bd1_auto): os outros herois acertam tudo, jogam perfeito e usam itens; as respostas certas aparecem marcadas.
const AUTO = (() => { try { return localStorage.getItem('bd1_auto') === '1'; } catch { return false; } })();
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
  inventory:[], pendingAction:null, myVote:null, voteLocked:false,
  // todos começam com vida e mana cheias
  heroes:Object.fromEntries(['mage','guerreiro','tank','cleriga'].map(k => [k, {hp:100, mp:100}])),
  bossHp:BOSS_MAX_HP, rage:0, hardNext:false, over:false, ice:newIce(), lastEl:null, curActions:null,
  cd:{mage:{},guerreiro:{},tank:{},cleriga:{}}, marks:[], burn:0, buff:{bh:0, bers:0, tired:0, taunt:0}, guardFor:null,         // recarga das habilidades (perguntas restantes)
  curAttack:BOSS_ATTACK,
  ultCd:{mage:0,guerreiro:0,tank:0,cleriga:0},
  ultReady:{mage:false,guerreiro:false,tank:false,cleriga:false},   // carrega ao acertar pergunta rank S/SS
  curQ:null, lastQ:{1:-1,2:-1,3:-1,4:-1,5:-1},
  round:0, dazedNext:false, thrustCd:0, teleCd:0, prepNext:false, stun:false, enraged:false
};
function persist(){ localStorage.setItem(SAVE_KEY, JSON.stringify({v:2, gold:state.gold, inventory:state.inventory})); }
persist();   // toda partida contra o boss começa sem itens (o que sobrou da anterior é descartado)

const $ = s => document.querySelector(s);
let __readUntil=0;
const readMs=s=>Math.min(6000,900+50*String(s).length);
const wait = ms => new Promise(r=>setTimeout(r,Math.max(ms,__readUntil-Date.now())));
const sleep = ms => new Promise(r=>setTimeout(r,ms));   // espera fixa, sincronizada com a animação (wait() estica até o fim da leitura do aviso)
const __seen={};
function fresh(key,ms){const n=Date.now();if(__seen[key]&&n-__seen[key]<ms)return false;__seen[key]=n;return true}
function scWrite(el, text, cls){ if (window.Paper) Paper.burst(10); el.className = el.className.split(' ')[0] + (cls ? ' ' + cls : ''); el.textContent = ''; const per = Math.max(10, Math.min(24, 1500 / Math.max(1, String(text).length)));
  [...String(text)].forEach((ch, i) => { const s = document.createElement('span'); s.textContent = ch; s.style.animationDelay = (i * per) + 'ms'; el.appendChild(s); }); }
function paperOn(){ return document.documentElement.classList.contains('paper'); }
// Conteúdo interativo no papiro (relatório, escolha de alvo...). Retorna o elemento, ou null se a faixa do papiro não existe.
// Ajusta o conteudo ao tamanho do papiro: se nao couber, primeiro modo compacto (.tight), depois reduz proporcionalmente (zoom). Papiro alto o bastante nao muda nada.
function fitPaperUI(u){
  const w = u.firstElementChild; if (!w || !w.classList.contains('ui-fit')) return;
  w.style.transform = ''; w.style.width = ''; u.classList.remove('tight');
  const room = () => u.clientHeight - parseFloat(getComputedStyle(u).paddingTop || 0) - parseFloat(getComputedStyle(u).paddingBottom || 0);
  if (w.offsetHeight <= room() + 1) return;
  u.classList.add('tight');
  const h = w.offsetHeight; if (h <= room() + 1) return;
  const k = Math.max(.5, room() * .92 / h); w.style.transform = 'scale(' + k.toFixed(3) + ')'; w.style.width = (100 / k).toFixed(1) + '%'; w.style.flex = 'none';
}
function paperUI(html){ if (!paperOn()) return null; const u = $('#sc-ui'); if (!u) return null; u.innerHTML = '<div class="ui-fit">' + html + '</div>'; $('#scroll').classList.add('ui'); fitPaperUI(u); if (window.Paper) Paper.burst(14); return u; }
addEventListener('resize', () => { const u = $('#sc-ui'); if (u && $('#scroll').classList.contains('ui')) fitPaperUI(u); });
const PP_MENU = () => false;   // menu de habilidades NUNCA no papiro: so na interface propria (arte)
function paperUIClose(){ const sc = $('#scroll'); if (sc) sc.classList.remove('ui'); const u = $('#sc-ui'); if (u) u.innerHTML = ''; }
function fitScroll(){ const g = $('#game').getBoundingClientRect(), band = Math.max(0, Math.round(innerHeight - g.bottom)), on = band >= 56, bh = on ? band + Math.round(g.height * .11) : band; document.documentElement.style.setProperty('--bh', bh + 'px'); document.documentElement.style.setProperty('--gw', Math.round(g.width) + 'px'); document.documentElement.style.setProperty('--gl', Math.round(g.left) + 'px'); document.documentElement.classList.toggle('paper', on); }
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
    state.chestVote = state.myVote; showMerchantText(msg); await wait(1000); const done = state.chestDone; closeMerchantVote();
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
const RARE_POOL = Object.keys(ITEMS).filter(k => ITEMS[k].rare && !ITEMS[k].legend), RARE_CHANCE = 0.12;
const LEGEND_POOL = Object.keys(ITEMS).filter(k => ITEMS[k].legend), LEGEND_CHANCE = 0.025;   // lendários (relógios): bem mais raros que os raros
let qExtend = null;   // enquanto a pergunta está aberta: soma segundos ao relógio dela            // ids de ITEMS que podem aparecer na prateleira (novos itens: adicione em ITEMS e aqui)
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
const itemCat = t => { const it = ITEMS[t]; if (it.kind === 'hp' || it.kind === 'mp' || it.fx === 'elixir' || it.fx === 'herb' || it.fx === 'phoenix') return 'heal'; if (['shield','amulet','helm','smoke'].includes(it.fx)) return 'def'; if (['hourglass','scroll','lucky','clock'].includes(it.fx)) return 'util'; return 'atk'; };
const DISCOUNT_AFTER = 3, DISCOUNT = .85;   // bom cliente: a partir da 3a compra (desde a última vez que ele fechou a loja) tudo sai 15% mais barato
const priceOf = t => { const p = ITEMS[t].price; return state.shop && state.shop.buys >= DISCOUNT_AFTER ? Math.max(1, Math.round(p * DISCOUNT)) : p; };
const msayLast = {};
function msay(kind){ const l = MSAY[kind]; let t; do { t = l[Math.floor(Math.random() * l.length)]; } while (l.length > 1 && t === msayLast[kind]); msayLast[kind] = t; return t; }
function shuffled(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function newShop(){ const slots = shuffled(SHOP_POOL).slice(0, SHOP_SLOTS); if (Math.random() < RARE_CHANCE) slots[Math.floor(Math.random() * SHOP_SLOTS)] = RARE_POOL[Math.floor(Math.random() * RARE_POOL.length)]; if (Math.random() < LEGEND_CHANCE) slots[Math.floor(Math.random() * SHOP_SLOTS)] = LEGEND_POOL[Math.floor(Math.random() * LEGEND_POOL.length)]; return {slots, opens:0, closed:0, buys:0, hist:[]}; }   // prateleira sorteada a cada partida
function pickNew(sold){   // item novo no lugar do vendido: nunca o mesmo, de preferência um que ainda não está na prateleira
  const onShelf = state.shop.slots.filter(Boolean);
  if (Math.random() < LEGEND_CHANCE) { const r = LEGEND_POOL.filter(t => !onShelf.includes(t)); if (r.length) return r[Math.floor(Math.random() * r.length)]; }
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
    b.insertAdjacentHTML('beforeend', `<img class="s-icon${opt.arrive && opt.arrive.includes(i) ? ' arrive' : ''}" src="${it.icon}" alt=""><i class="s-pill"></i><img class="s-coin" src="icon_coin.png" alt=""><b class="s-price">${priceOf(type)}</b>`);
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
const HUD_W = 220, HUD_GAP = 34;   // HUD_GAP: faixa entre a barra e a cabeça (ícone de ult + chips de item)
const HEAD_TOP = {mage:725, guerreiro:692, tank:684, cleriga:792};   // topo da pose mais alta de cada herói (medido, px do grid)
const hudY = k => Math.round(HEAD_TOP[k] - HUD_GAP - HUD_W * HUD_IMG[k].h / HUD_IMG[k].w);   // barra pequena: largura (px do grid 1024) e posição vertical
const HUD_IMG = {"mage": {"w": 1419, "h": 259, "hp": [0.2276, 0.7498, 0.3745, 0.1544], "mp": [0.2276, 0.7498, 0.6873, 0.1583]}, "guerreiro": {"w": 1420, "h": 246, "hp": [0.2275, 0.7493, 0.3211, 0.1626], "mp": [0.2275, 0.7493, 0.6585, 0.1585]}, "tank": {"w": 1420, "h": 246, "hp": [0.2275, 0.7493, 0.313, 0.1585], "mp": [0.2275, 0.7493, 0.6463, 0.1585]}, "cleriga": {"w": 1421, "h": 241, "hp": [0.2273, 0.7488, 0.2822, 0.1618], "mp": [0.2273, 0.7488, 0.6224, 0.1618]}};   // proporção e interior das barras (frações) de hud_<herói>.png
const HUD = {
  boss:{x:251, y:70, w:525, h:19},
  rage:{x:400, y:99, w:324, h:24},
  icons:{}, heroes:{}
};
['mage', 'guerreiro', 'tank', 'cleriga'].forEach(k => { const m = HUD_IMG[k], x = Math.round(clampHud(HERO_X[k] / 100 * 1024 - HUD_W / 2)); HUD.icons[k] = x; HUD.heroes[k] = [x, hudY(k), HUD_W, Math.round(HUD_W * m.h / m.w)]; });
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
    const iy = HUD.heroes[k][1] + HUD.heroes[k][3] + 3, IS = 30, ox = {mage:80, guerreiro:318, tank:562, cleriga:804}[k];
    d.style.cssText = `left:${pctX(ix)};top:${pctY(iy)};width:${pctX(IS)};height:${pctY(IS)};background-size:2327% auto;background-position:${ox / 980 * 100}% ${757 / 1492 * 100}%`;
    d.onclick = () => { if (k !== activeGroup || !state.ultReady[k]) return; const c = document.querySelector('#am-list .act-card.ult:not(:disabled)'); if (c) c.click(); else toast('O especial é ativado na vez do seu herói, no menu de habilidades.'); };
    $('#game').appendChild(d); bars['ult_' + k] = d;
  });
  HERO_ORDER.forEach(k => {
    const s = document.createElement('div'); s.className = 'hero-status'; s.hidden = true;
    s.style.cssText = `left:${pctX(HUD.icons[k] + 34)};top:${pctY(HUD.heroes[k][1] - 17)};width:${pctX(150)}`; $('#game').appendChild(s); bars['st_' + k] = s;
  });
  HERO_ORDER.forEach(k => {   // ícones pequenos dos efeitos de item ativos (com a duração)
    const c = document.createElement('div'); c.className = 'hero-chips';
    c.style.cssText = `left:${pctX(HUD.icons[k] + 34)};top:${pctY(HUD.heroes[k][1] + HUD.heroes[k][3] + 3)};width:${pctX(186)}`; $('#game').appendChild(c); bars['ch_' + k] = c;
  });
  { const p2 = document.createElement('div'); p2.className = 'p2-badge'; p2.hidden = true; p2.textContent = 'FASE 2'; p2.style.cssText = `left:${pctX(HUD.rage.x + HUD.rage.w)};top:${pctY(HUD.rage.y + HUD.rage.h + 5)}`; $('#game').appendChild(p2); bars.p2 = p2; }
  const mk = document.createElement('div'); mk.className = 'boss-marks'; mk.style.cssText = `left:${pctX(HUD.rage.x)};top:${pctY(HUD.rage.y + HUD.rage.h + 5)}`; $('#game').appendChild(mk); bars.marks = mk;
  const r = document.createElement('div'); r.className = 'rage';
  r.style.cssText = `left:${pctX(HUD.rage.x)};top:${pctY(HUD.rage.y)};width:${pctX(HUD.rage.w)};height:${pctY(HUD.rage.h)}`;
  r.innerHTML = '<span class="rage-label">FÚRIA</span><div class="rage-seg">' + '<b></b>'.repeat(RAGE_MAX) + '</div>';
  $('#game').appendChild(r); bars.rage = r;
}
const CHIP_DEF = [['shield','item_iron_shield.png','escudo'],['amulet','item_amulet.png','amuleto'],['helm','item_helm.png','elmo'],['smoke','item_smokebomb.png','fumaça'],['herb','item_herb.png','erva'],['tonic','item_tonic.png','tônico'],['lens','item_lens.png','lente'],['powder','item_powder.png','pólvora'],['dice','item_dice.png','dado'],['bomb','item_lightbomb.png','bomba'],['lucky','item_luckycoin.png','sorte'],['blade','item_blade.png','lâmina']];
function renderChips(){
  HERO_ORDER.forEach(k => {
    const el = bars['ch_' + k]; if (!el) return; const b = state.ib[k], dead = state.heroes[k].hp <= 0;
    const html = dead ? '' : CHIP_DEF.filter(([f]) => b[f] > 0).map(([f, ic, nm]) => `<span class="bf" title="${nm}"><img src="${ic}" alt="${nm}"><i>${f === 'blade' ? '+' + b[f] : f === 'bomb' ? '!' : b[f] > 1 || ['herb','amulet','helm','smoke','tonic','lucky'].includes(f) ? b[f] : ''}</i></span>`).join('');
    if (el.dataset.h !== html) { el.dataset.h = html; el.innerHTML = html; }
  });
  if (bars.p2) bars.p2.hidden = !state.phase2;
}
function renderHud(){
  renderChips();
  const b = state.buff, st = {mage: b.bh > 0 ? 'BURACO NEGRO x3' : '', guerreiro: b.bers > 0 ? `BERSERK ${b.bers}` : b.tired > 0 ? 'EXAUSTO' : '', tank: b.taunt > 0 ? `PROVOCAÇÃO ${b.taunt}` : '', cleriga: ''};
  HERO_ORDER.forEach(k => { const el = bars['st_' + k]; if (!el) return; let t = st[k];
    if (ST.ice && state.heroes[k].hp > 0) { const I = state.ice, x = []; if (I.frozen[k] > 0) x.push('CONGELADO'); else if (I.cold[k] > 0) x.push(`FRIO ${I.cold[k]}`); if (I.bleed[k]) x.push(`SANGRA x${I.bleed[k].stacks}`); if (I.mark === k) x.push('MARCADO'); if (x.length) t = t ? t + ' · ' + x.join(' · ') : x.join(' · '); }
    el.textContent = t; el.hidden = !t; el.classList.toggle('bad', (k === 'guerreiro' && b.tired > 0) || (ST.ice && (state.ice.frozen[k] > 0 || !!state.ice.bleed[k])));
    const cv = document.querySelector('canvas.hero.' + k); if (cv) cv.classList.toggle('frozen', !!(ST.ice && state.ice.frozen[k] > 0 && state.heroes[k].hp > 0)); });
  if (window.PXFX) PXFX.burn('boss', state.burn > 0, {w:170, h:150, i:.75});   // fogo pixel art no boss enquanto queima
  A.setAura('boss', state.burn > 0 ? 'orange' : state.prepNext ? 'charge' : (state.rage >= RAGE_MAX || state.hardNext) ? 'rage' : null);
  const mk = bars.marks; if (mk && state.burn > 0) mk.innerHTML = `<img src="${pixIcon('fire')}" alt="Queimando" title="Queimando ${state.burn}">`; else if (mk) mk.innerHTML = state.marks.length ? state.marks.map(e => `<img src="${pixIcon({fire:'fire',water:'drop',air:'wind',earth:'rock'}[e])}" alt="${ELEMENTS[e].name}">`).join('') : '';
  bars.boss.style.width = Math.max(0, state.bossHp / BOSS_MAX_HP * 100) + '%';
  HERO_ORDER.forEach(k => {
    bars[k].hp.style.width = Math.max(0, state.heroes[k].hp / HERO_MAX_HP * 100) + '%';
    bars[k].mp.style.width = Math.max(0, state.heroes[k].mp / 100 * 100) + '%';
  });
  HERO_ORDER.forEach(k => A.setDead(k, state.heroes[k].hp <= 0));
  HERO_ORDER.forEach(k => A.low(k, state.heroes[k].hp > 0 && state.heroes[k].hp / HERO_MAX_HP <= .3));   // pouca vida: pose cansada e pulso vermelho
  A.setAura('mage', b.bh > 0 ? 'blue' : null); A.setAura('guerreiro', b.bers > 0 ? 'red' : b.tired > 0 ? 'tired' : null); A.setAura('tank', b.taunt > 0 ? 'orange' : null);
  HERO_ORDER.forEach(k => bars['ult_' + k].classList.toggle('ready', !!state.ultReady[k]));
  bars.rage.querySelectorAll('.rage-seg b').forEach((el, i) => el.classList.toggle('on', i < state.rage));
  bars.rage.classList.toggle('full', state.rage >= RAGE_MAX);
}

// ===== Painel (pergunta / ação) =====
function openPanel(){ $('#action-menu').hidden = true; $('#dynamic-question').classList.remove('exiting'); $('#dynamic-ui').hidden = false; $('#dynamic-question').hidden = false; }
function openSkillMenu(){ $('#dynamic-question').hidden = true; $('#action-menu').hidden = true; const m = $('#skill-menu'); m.classList.remove('exiting'); m.hidden = false; $('#dynamic-ui').hidden = false; }
const pc = (b, g = 0, side = 0) => `left:${b[0] - (side > 0 ? 0 : g)}%;top:${b[1] - g * .6}%;width:${b[2] + (side ? g : g * 2)}%;height:${b[3] + g * 1.2}%`;   // side: -1 cresce so p/ esquerda, 1 so p/ direita
const timerHtml = (s, cls) => `<i class="hg"></i><span id="vote-timer" class="${cls}">${s}s</span>`;
const attrKind = at => at.attr === 'demon' ? 'demon' : at.attr === 'none' ? 'none' : 'elem';
const ATTR_ICON = {demon:'icon_chip_demon.png', none:'icon_chip_normal.png', elem:'icon_chip_elem.png'};
function buildSkillFrame(panel, title, text, at, seconds, note){
  const M = MENU_META[panel], fr = $('#skm-frame'), L = $('#skm-layer');
  fr.src = `menu_${panel}${panel === 'elem' && window.__elemDef ? 'def' : ''}.png`; L.innerHTML = '';
  const add = (cls, box, html) => { const d = document.createElement('div'); d.className = cls; d.style.cssText = pc(box, /^sk-timer/.test(cls) ? .7 : 0); d.innerHTML = html; L.appendChild(d); return d; };
  if (M.title) add('sk-title' + (panel === 'target' ? ' t2' : ''), M.title, `<b>${title}</b><span>${text}</span>`);
  const AT = M.attr, vy = AT ? [AT[1] - .4, AT[3] + .8] : null;   // os dois chips ficam na mesma altura (a arte tinha tamanhos diferentes)
  if (M.tipo) { const T = M.tipo; add('sk-tipo', AT ? [T[0] - .7, vy[0], T[2] + .7, vy[1]] : T, `<img src="icon_chip_sword.png" alt=""><div><small>TIPO</small><b>${at ? at.tipo : 'FÍSICO'}</b></div>`); }
  if (AT && at) { const e = ELEMENTS[at.attr], k = attrKind(at), d = add('sk-attr ' + k, [AT[0], vy[0], Math.min(AT[2] + .7, M.tbox[0] - .6 - AT[0]), vy[1]], `<img src="${ATTR_ICON[k]}" alt=""><div><small>ATRIBUTO</small><b>${e.name}</b></div>`); d.style.setProperty('--ec', e.color); }   // chip em pixel art cobre o da arte
  add('sk-timer', M.tbox, timerHtml(seconds, 'sk-time'));
  fr.className = 'skm-frame' + (panel === 'target' ? ' tgt' : '');
  return M;
}
function buildQuestionPanel(text, at, seconds, side){
  const Q = MENU_META.question, L = $('#dq-layer'); L.innerHTML = '';
  const add = (id, cls, box, html) => { const d = document.createElement('div'); if (id) d.id = id; d.className = cls; d.style.cssText = pc(box, /sk-timer|qchip/.test(cls) ? .3 : 0); d.innerHTML = html; L.appendChild(d); return d; };
  const e = at ? ELEMENTS[at.attr] : null;
  if (at) {
    add('', 'qchip tp', Q.ctipo, `<img src="icon_chip_sword.png" alt=""><div><small>TIPO</small><b>${at.tipo}</b></div>`);
    const ak = attrKind(at), ad = add('', 'qchip ' + ak, Q.cattr, `<img src="${ATTR_ICON[ak]}" alt=""><div><small>ATRIBUTO</small><b>${e.name}</b></div>`); ad.style.setProperty('--ec', e.color);
  }
  add('dq-text', '', side ? [Q.title[0], Q.title[1], Q.title[2] - 7.8, Q.title[3]] : Q.title, `<span></span>`).firstChild.textContent = text;
  add('', 'dq-coin', Q.coin, side ? side.reward : '0');
  if (side) add('', 'dq-diff d' + side.d, [74.4, Q.title[1] + 2.2, 5.6, 7], `<small>RANK</small><b>${side.rank}</b>`);
  add('', 'sk-timer', Q.tbox, timerHtml(seconds, 'dq-side-timer'));
  return L;
}
function fitText(){
  const fit = (box, inner, minPx) => { if (!box || !inner) return; let fs = parseFloat(getComputedStyle(box).fontSize); box.style.fontSize = fs + 'px';
    while (inner.offsetHeight > box.clientHeight + 1 && fs > minPx) box.style.fontSize = (fs -= 1) + 'px'; };
  const t = $('#dq-text'); if (t && !$('#dynamic-question').hidden) fit(t, t.firstChild, 7);
  document.querySelectorAll('.dq-answer .label').forEach(l => fit(l, l.firstChild, 9));
}
function openMenu(){ $('#dynamic-question').hidden = true; const m = $('#action-menu'); m.classList.remove('exiting'); m.hidden = false; $('#dynamic-ui').hidden = false; }
function attackChips(at){
  if (!at) return '';
  const e = ELEMENTS[at.attr];
  const k = at.attr === 'demon' ? 'demon' : at.attr === 'none' ? 'none' : 'elem';
  return `<span class="chip tp"><small>TIPO</small><b><img src="icon_chip_sword.png" alt="">${at.tipo}</b></span>` +
         `<span class="chip ${k}" style="--ec:${e.color}"><small>ATRIBUTO</small><b><img src="${ATTR_ICON[k]}" alt="">${e.name}</b></span>`;
}
async function closePanel(){
  const m = $('#action-menu'), q = $('#dynamic-question'), ui = $('#dynamic-ui');
  const sm = $('#skill-menu');
  if ($('#sc-ui') && $('#sc-ui').dataset.kind === 'menu') { paperUIClose(); $('#sc-ui').dataset.kind = ''; }
  const dq = !sm.hidden ? sm : !m.hidden ? m : q; dq.classList.add('exiting'); await wait(250);
  // some por completo (nada fica na tela durante a resolução)
  m.hidden = true; q.hidden = true; sm.hidden = true; ui.hidden = true; m.classList.remove('exiting'); q.classList.remove('exiting'); sm.classList.remove('exiting');
}
// ===== Pixel art gerado em código (sprites 11x11 em string -> imagem sem suavização) =====
const PAL = {k:'#0b0814',W:'#f4f1ff',S:'#9aa3c2',Y:'#ffc54e',y:'#ffe9a0',B:'#7a4a22',R:'#e0392d',O:'#ff8a2a',b:'#2f6fe0',l:'#6fb4ff',c:'#8fe8d4',t:'#a8864a',T:'#7a5e30',D:'#4d3a1c',G:'#c9d4ff',P:'#b36bff',g:'#5ee08a'};
const SPR = {
  back:['...........','...WW......','..WW.......','.WWWWWWWWW.','WWWWWWWWWWW','.WWWWWWWWW.','..WW.......','...WW......','...........','...........','...........'],
  fire:['.....R.....','....RR.....','...RRRR....','...RROR.R..','..RRROORR..','.RRROOOORR.','.RROOYYORR.','.RROYYYYOR.','.RROYYYYOR.','..RROYYOR..','...RRRRR...'],
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
function bannerKind(t){t=String(t).toUpperCase();if(/ULTIMATE/.test(t))return 'ult';if(/LUZ SAGRADA|ESQUIVOU|DESNORTEADO/.test(t))return 'good';if(/BOSS|ONDA|ESTOCADA|TELEPORTE|PASSO G|GOLPE|PREPARANDO|TEMPESTADE|VOLEIO|CORTE CONG|MARCA|CONTRA-ATAQUE|FRENESI/.test(t))return 'bad';return ''}
function showBanner(t, sub){ const b=$('#turn-banner'); const key=t+'|'+(sub||''); if(b.dataset.k===key)return; b.dataset.k=key; __readUntil=Date.now()+readMs((t+' '+(sub||'')).replace(/<[^>]*>/g,''));
  if (paperOn()) { const k = bannerKind(t); $('.sc-in').classList.remove('fade'); scWrite($('#sc-t'), String(t).replace(/<[^>]*>/g, ''), k); scWrite($('#sc-s'), sub || ''); b.classList.remove('show'); return; }
  b.className='turn-banner show '+bannerKind(t); b.innerHTML=`${t}${sub?`<small>${sub}</small>`:''}`; }
function hideBanner(){ __readUntil=0; const b=$('#turn-banner'); b.classList.remove('show'); b.dataset.k=''; const si=$('.sc-in'); if(si){si.classList.add('fade'); setTimeout(()=>{ if(si.classList.contains('fade')){ $('#sc-t').textContent=''; $('#sc-s').textContent=''; } },520);} }
function floatText(xPct, yPct, text, color){
  const d = document.createElement('div'); d.className = 'dmg-float'; d.textContent = text;
  const len = String(text).length, fs = len > 22 ? 3.4 : len > 14 ? 4.2 : len > 9 ? 5.2 : 6.5, half = len * fs * .3;   // largura estimada (% da tela): nunca passa da borda
  if (fs < 6.5) d.style.fontSize = fs + 'cqw';
  d.style.left = Math.max(half + 1.5, Math.min(98.5 - half, xPct)) + '%'; d.style.top = yPct + '%'; d.style.color = color || '#ffd24d';
  $('#game').appendChild(d); setTimeout(() => d.remove(), 1000);
}
function flashHit(){
  const fl = $('#damage-flash'); fl.classList.remove('active'); void fl.offsetWidth; fl.classList.add('active');
  const g = $('#game'); g.classList.remove('hit-shake'); void g.offsetWidth; g.classList.add('hit-shake');
}

// Votação genérica dentro do grupo: mostra contagem ao vivo (o grupo vê entre si), decide por maioria.
// Empate entre as mais votadas = sorteio; ninguém votou = null. O painel continua aberto ao terminar.
function runVote({type, text, options, seconds, side, menu, title, attack, panel, endsAt:fixedEnd, note}){
  return new Promise(resolve => {
    let endsAt = fixedEnd || Date.now() + seconds * 1000; seconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));   // prazo único: pode ser compartilhado entre menus (habilidade → elemento → voltar)
    const voters = groupMembers(), need = majorityOf(voters);
    const sv = options.map(() => 0); let my = null, locked = false, timer = null, bots = [];
    let list, M = null, P = null;
    if (menu && PP_MENU()) {   // menus de habilidade/elemento no papiro (se a faixa for alta o bastante)
      P = paperUI(`<div class="pp-head"><b>${title || 'ESCOLHA O ELEMENTO'}</b><span>${text || ''}</span><em id="pp-timer" class="pp-timer">${seconds}s</em></div><div class="pp-grid${panel === 'elem' ? ' elem' : ''}"></div><div class="pp-desc" id="pp-desc">Segure um cartão para ler a descrição.</div>`);
      P.dataset.kind = 'menu'; P.onclick = null; list = P.querySelector('.pp-grid');
    }
    else if (menu && panel) { M = buildSkillFrame(panel, title, text, attack, seconds, note); list = $('#skm-layer'); }
    else if (menu) {
      $('#am-title').textContent = title; $('#am-text').textContent = text;
      $('#am-attack').innerHTML = attackChips(attack);
      $('#am-timer').innerHTML = timerHtml(seconds, 'dq-side-timer');
      list = $('#am-list'); list.innerHTML = '';
    } else { list = buildQuestionPanel(text, attack, seconds, side); }
    const enabled = options.map((o, i) => o.disabled ? -1 : i).filter(i => i >= 0);
    const btns = options.map((o, i) => {
      const b = document.createElement('button'); b.type = 'button';
      if (P) {
        b.className = `pp-card ${o.kind || ''}`;
        b.innerHTML = '<span class="pc-name"></span><span class="pc-chips"></span><b class="cnt">0</b>';
        b.querySelector('.pc-name').textContent = o.label.replace(/^ESPECIAL: /, 'ESP: '); b.querySelector('.pc-chips').innerHTML = o.chips || '';
        if (o.block) b.insertAdjacentHTML('beforeend', `<span class="pc-lock">${o.block}</span>`);
        let ht = null; const dsc = $('#pp-desc');
        const showD = () => { b.__held = true; if (dsc) dsc.textContent = o.label + ': ' + (o.desc || 'sem descrição'); };
        b.addEventListener('pointerdown', () => { b.__held = false; clearTimeout(ht); ht = setTimeout(showD, 380); });
        ['pointerup','pointerleave','pointercancel'].forEach(ev => b.addEventListener(ev, () => clearTimeout(ht)));
      } else if (M) {
        const [r, c] = o.slot || [0, 0], I = M.info, cd = o.back ? I : M.cards[r][c], cn = o.back ? [I[0] + I[2] * .84, I[1] + I[3] * .2, I[2] * .13, I[3] * .6] : M.cnt[r * 2 + c];
        b.className = `sk-card ${o.kind || ''}`; b.style.cssText = pc(cd);
        b.innerHTML = `<b class="cnt sk-cnt" style="left:${(cn[0] - cd[0]) / cd[2] * 100}%;top:${(cn[1] - cd[1]) / cd[3] * 100}%;width:${cn[2] / cd[2] * 100}%;height:${cn[3] / cd[3] * 100}%">0</b>`;
        b.setAttribute('aria-label', o.label);
        if (o.kind === 'elem' && o.label === ELEMENTS.fire.name) b.insertAdjacentHTML('beforeend', `<span class="el-cover"></span><span class="el-chip gold a"><b>BOSS FRACO</b></span><span class="el-chip gold b"><b>${window.__elemDef ? 'CORTA 55%' : '1,5x QUEIMA'}</b></span>`);   // o texto do Fogo tambem vira chip, igual aos outros
        if (o.kind === 'elem' && o.label !== ELEMENTS.fire.name) b.insertAdjacentHTML('beforeend', `<span class="el-chip"><b>${window.__elemDef ? 'SEM EFEITO' : 'BOSS IMUNE'}</b></span>`);   // cobre o chip pintado na arte
        if (o.back) b.insertAdjacentHTML('afterbegin', `<span class="bk-fill"></span><img class="bk-ico" src="${pixIcon('back')}" alt=""><span class="bk-txt">VOLTAR</span>`);
        if (o.face) b.insertAdjacentHTML('afterbegin', `<img class="tp-face" src="tp_${o.face}.png" alt=""><span class="tp-name"></span><span class="tp-desc"></span><span class="tp-chips">${o.chips || ''}</span>`), b.querySelector('.tp-name').textContent = o.label, b.querySelector('.tp-desc').textContent = o.desc || '';
        if (o.block) b.insertAdjacentHTML('beforeend', `<span class="lock">${o.block}</span>`);
      } else if (menu) {
        b.className = `act-card ${o.kind || ''}`;
        b.innerHTML = `<span class="ac-icon">${o.icon ? `<img src="${pixIcon(o.icon)}" alt="">` : ''}</span><span class="ac-name"></span><span class="ac-desc"></span><span class="ac-chips"></span><b class="cnt">0</b>`;
        b.querySelector('.ac-name').textContent = o.label; b.querySelector('.ac-desc').textContent = o.desc || '';
        b.querySelector('.ac-chips').innerHTML = o.chips || '';
        if (o.color) b.style.setProperty('--ec', o.color);
      } else {
        b.className = 'dq-answer'; b.style.cssText = pc(MENU_META.question.rows[i]);
        if (o.hint) b.classList.add('hint');
        b.innerHTML = `<span class="label"><span></span></span><b class="cnt">0</b>`;
        b.querySelector('.label span').textContent = o.label + (o.note ? `  ${o.note}` : '');
      }
      if (o.disabled) { b.disabled = true; b.classList.add('off'); b.querySelector('.cnt').textContent = ''; }
      else b.onclick = () => { if (b.__held) { b.__held = false; return; } pick(i); };
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
      qExtend = null; btns.forEach(b => b.disabled = true); paint(true);
      if (idx !== null) { btns[idx].classList.add('chosen'); if (tie) toast(`Empate! ${String.fromCharCode(97 + idx)}) sorteada.`); }
      resolve({idx, btns});
    }
    if (P) { $('#dynamic-question').hidden = true; $('#action-menu').hidden = true; $('#skill-menu').hidden = true; $('#dynamic-ui').hidden = false; } else panel ? openSkillMenu() : menu ? openMenu() : openPanel();
    fitText();
    const timerEl = () => P ? $('#pp-timer') : $(panel ? '#skm-layer' : menu ? '#am-timer' : '#dq-layer').querySelector('#vote-timer');   // cada painel tem o seu (o id repetido pegava o da pergunta, escondido)
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      const el = timerEl(); if (el) { el.textContent = left + 's'; el.classList.toggle('urgent', left <= 3); }
      if (left <= 0 && !locked) { clearInterval(timer); const {m, c} = top(); if (m === 0) finish(null, false); else finish(c[Math.floor(Math.random() * c.length)], c.length > 1); }
    };
    tick(); timer = setInterval(tick, 250);
    if (!menu && !panel) qExtend = secs => {   // item de tempo: so a pergunta; secs=0 so testa se ainda da
      if (locked) return false; if (!secs) return true;
      endsAt += secs * 1000; tick();
      const L = $('#dq-layer'), tb = MENU_META.question.tbox, t = L && L.querySelector('.sk-timer');
      if (t) { t.classList.remove('bonus'); void t.offsetWidth; t.classList.add('bonus'); }
      if (L) { const f = document.createElement('div'); f.className = 'tm-bonus'; f.style.cssText = pc(tb, .3); f.innerHTML = `<img src="${secs >= 10 ? 'item_watch_l.png' : 'item_watch_s.png'}" alt=""><b>+${secs}s</b>`; L.appendChild(f); setTimeout(() => f.remove(), 1300); }
      return true;
    };
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
// Tema visual da fase: 'ice' (botao e interface de gelo, so no boss Hrimgar); o boss 1 usa o padrao.
function setTheme(n){ $('#game').classList.toggle('theme-ice', n === 'ice'); }
window.setTheme = setTheme;
if (TEST_MODE && PARAMS.get('theme')) setTheme(PARAMS.get('theme'));
if (TEST_MODE || AUTO) window.__bd = {state, setTheme};
window.BD_RAGE = () => Math.max(state.rage / RAGE_MAX, state.phase2 ? .7 : 0);   // fase 2: olhos do boss ficam sempre acesos
const aliveHeroes = () => HERO_ORDER.filter(k => state.heroes[k].hp > 0);

// Fase 2: ao cair a 50% de HP, raios caem no fundo, o cenário pisca várias vezes e o boss fica mais forte (sem fala)
async function maybePhase2(){
  if (state.phase2 || state.over || state.bossHp <= 0 || state.bossHp > BOSS_MAX_HP * PHASE2_AT) return;
  state.phase2 = true;
  showBanner(ST.p2Title, ST.p2Txt(PHASE2_AOE));
  A.play('boss', ST.ice ? 'phase2' : 'enrage');
  const g = $('#game');
  if (ST.ice) {   // fase 2 do Hrimgar: a armadura racha e explode (a animacao 'phase2' do rig faz o resto); so um clarao gelado no estilhaço
    const fl = document.createElement('div'); fl.style.cssText = 'position:absolute;inset:0;z-index:39;pointer-events:none;opacity:0;background:radial-gradient(120% 90% at 50% 40%,#ffffff,#bfe4ff 45%,#3f7cff 100%);mix-blend-mode:screen'; g.appendChild(fl);
    setTimeout(() => fl.animate([{opacity:0},{opacity:.9,offset:.1},{opacity:.2,offset:.4},{opacity:0}], {duration:900, easing:'ease-out'}).finished.then(() => fl.remove()), 1150 / (window.__ts || 1));
    flashHit(); await wait(ST.p2Wait); hideBanner(); renderHud(); return;
  }
  const fl = document.createElement('div');
  fl.style.cssText = 'position:absolute;inset:0;z-index:39;pointer-events:none;opacity:0;background:radial-gradient(120% 90% at 50% 18%,#ffffff,#b9ccff 45%,#5a3cff 100%);mix-blend-mode:screen';
  g.appendChild(fl);
  fl.animate([{opacity:0},{opacity:.85,offset:.06},{opacity:0,offset:.14},{opacity:.55,offset:.22},{opacity:0,offset:.3},{opacity:.95,offset:.42},{opacity:0,offset:.5},{opacity:.4,offset:.6},{opacity:0,offset:.68},{opacity:1,offset:.8},{opacity:0}], {duration:2600, easing:'linear'}).finished.then(() => fl.remove());
  [0, 260, 620, 980, 1400, 1850].forEach(t => setTimeout(() => { if (window.AMB) AMB.bolt(); }, t));
  g.animate([{transform:'translate(0,0)'},{transform:'translate(-5px,3px)'},{transform:'translate(5px,-3px)'},{transform:'translate(-3px,-2px)'},{transform:'translate(0,0)'}], {duration:240, iterations:10});
  flashHit(); await wait(3000); hideBanner(); renderHud();
}
// Evento: Arca do Tesouro. O grupo vota abrir ou ignorar; pode dar moedas, uma poção ou ser armadilha.
const CHEST_CHANCE = .22, CHEST_FROM = 3, CHEST_GAP = 4, CHEST_TRAP = 18;
const CHEST_FRAMES = [0, 1, 2, 3].map(i => `chest_f${i}.png`);
CHEST_FRAMES.forEach(f => { const i = new Image(); i.src = f; });
async function chestPlay(img, order, ms = 120){ for (const f of order) { img.src = CHEST_FRAMES[f]; await wait(ms); } }
// Tempo parado: a cena escurece e fica cinza, os personagens congelam (relógio das animações em ~0) e só a arca brilha no chão.
function rampTS(to, ms){
  const from = window.__ts == null ? 1 : window.__ts, t0 = performance.now();
  (function f(){ const u = Math.min(1, (performance.now() - t0) / ms); window.__ts = Math.max(.001, from + (to - from) * u); if (u < 1) requestAnimationFrame(f); })();
  clearTimeout(window.__tsFix); window.__tsFix = setTimeout(() => { window.__ts = Math.max(.001, to); }, ms + 80);
}
function timeStop(img){
  const g = $('#game'); if (state.tsOv) return;
  const ov = document.createElement('div'); ov.className = 'ts-dim';
  ov.innerHTML = '<i class="ts-beam"></i><i class="ts-floor"></i>';
  g.appendChild(ov); state.tsOv = ov; g.classList.add('timestop');
  requestAnimationFrame(() => ov.classList.add('on'));
  rampTS(.001, 520);
  const ring = (dl, rev) => { const r = document.createElement('i'); r.className = 'ts-ring' + (rev ? ' rev' : ''); r.style.animationDelay = dl + 'ms'; ov.appendChild(r); };
  [0, 380, 760].forEach(d => ring(d));
  for (let i = 0; i < 22; i++) {   // poeira dourada suspensa no ar, parada
    const p = document.createElement('i'); p.className = 'ts-mote'; p.style.left = (22 + Math.random() * 56) + '%'; p.style.top = (34 + Math.random() * 30) + '%';
    p.style.animationDelay = (Math.random() * 2400) + 'ms'; p.style.width = p.style.height = (3 + Math.floor(Math.random() * 3)) + 'px'; ov.appendChild(p);
  }
}
async function timeResume(){
  const g = $('#game'), ov = state.tsOv; if (!ov) return; state.tsOv = null;
  const r = document.createElement('i'); r.className = 'ts-ring rev'; ov.appendChild(r);   // anel que fecha: o tempo volta
  ov.classList.add('off'); rampTS(1, 700);
  setTimeout(() => { ov.remove(); g.classList.remove('timestop'); }, 900);
}
function chestDust(img, n = 18){   // poeira de pixels que sobe e some
  const g = $('#game'), gr = g.getBoundingClientRect(), r = img.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const d = document.createElement('i'); d.className = 'chest-dust';
    const x = (r.left - gr.left + r.width * (.1 + Math.random() * .8)) / gr.width * 100, y = (r.top - gr.top + r.height * (.2 + Math.random() * .7)) / gr.height * 100;
    d.style.left = x + '%'; d.style.top = y + '%'; d.style.background = ['#ffd966','#e8b83a','#fff2a8','#ffe28a','#c8902c'][i % 5]; const sz = 5 + Math.floor(Math.random() * 7); d.style.width = d.style.height = sz + 'px'; d.style.boxShadow = '0 0 6px 1px rgba(255,210,90,.8)';
    g.appendChild(d);
    d.animate([{transform:'translate(0,0) scale(1)', opacity:1}, {transform:`translate(${(Math.random() - .5) * 130}px,${-50 - Math.random() * 120}px) scale(.35)`, opacity:0}], {duration:1000 + Math.random() * 700, easing:'ease-out', delay:Math.random() * 220}).finished.then(() => d.remove());
  }
}
async function chestVanish(img){   // some: treme, pisca, vira poeira
  await img.animate([{transform:'translate(-50%,0)'},{transform:'translate(-52%,0)'},{transform:'translate(-48%,0)'},{transform:'translate(-52%,0)'},{transform:'translate(-50%,0)'}], {duration:300}).finished;
  await img.animate([{filter:'brightness(1)'},{filter:'brightness(3)'},{filter:'brightness(1)'},{filter:'brightness(3)'}], {duration:360, easing:'steps(4)'}).finished;
  img.animate([{filter:'brightness(3) drop-shadow(0 0 3cqw #ffd34d)', opacity:1}, {filter:'brightness(5) drop-shadow(0 0 6cqw #fff2a8)', opacity:.9}], {duration:260, fill:'forwards'});
  chestDust(img, 46); setTimeout(() => chestDust(img, 30), 160);
  await img.animate([{opacity:.9, transform:'translate(-50%,0)'}, {opacity:0, transform:'translate(-50%,-6%) scale(.92)'}], {duration:520, easing:'ease-in', fill:'forwards'}).finished;
  img.style.visibility = 'hidden'; await sleep(650); timeResume(); await sleep(900); img.remove();
}
// Rodada de baú: ocupa a rodada inteira (sem pergunta). O grupo vota abrir ou ignorar; quem votou em abrir leva um item da loja ou uma armadilha.
const CHEST_ITEM_P = .7, CHEST_RARE_P = .1, CHEST_LEGEND_P = .02;
function chestEligible(){
  return !state.over && state.round >= CHEST_FROM && state.round - state.chestAt >= CHEST_GAP && Math.random() < CHEST_CHANCE && !(TEST_MODE && window.__force === 'nochest');
}
// item da arca voando para a mochila: surge da arca num clarao, flutua brilhando, faz um arco ate o botao da mochila e estoura em faiscas
function flyItemToBag(type, fromEl){
  return new Promise(done => {
    const it = ITEMS[type], tg = $('#bag-toggle'), legend = !!it.legend, rare = !!it.rare;
    const slotEls = () => { const st = inventoryStacks(), i = st.findIndex(x => x.idx === state.inventory.length - 1), h = $('#inventory-hits').children[i]; return h ? h.querySelectorAll('.inv-icon,.inv-count') : []; };
    const hide = on => slotEls().forEach(e => e.style.visibility = on ? 'hidden' : '');
    hide(true);
    let fin = false;
    const finish = () => { if (fin) return; fin = true; hide(false); layer.remove(); done(); };
    const layer = document.createElement('div'); layer.style.cssText = 'position:fixed;inset:0;z-index:300;pointer-events:none;overflow:hidden';
    document.body.appendChild(layer);
    const fr = (fromEl && fromEl.getBoundingClientRect().width ? fromEl : $('#game')).getBoundingClientRect(), tr = tg.getBoundingClientRect();
    const hasT = tr.width > 0, vw = innerWidth, vh = innerHeight;
    const sz = Math.max(44, Math.min(84, vw * .17)), W = sz * 46 / 68;
    const sx = fr.left + fr.width / 2, sy = fr.top + fr.height * .35;
    const ex = hasT ? tr.left + tr.width / 2 : vw / 2, ey = hasT ? tr.top + tr.height / 2 : vh * .9;
    const lift = Math.min(vh * .16, Math.max(sz * 1.3, fr.height * .5)), hx = sx, hy = Math.max(sz, sy - lift);
    const cols = legend ? ['#7dffd8','#ffe08a','#ffffff','#c8a8ff'] : rare ? ['#ffe08a','#ffb02e','#fff6c8'] : ['#ffe08a','#fff6c8','#c8a8ff'];
    const img = document.createElement('img'); img.src = it.icon; img.alt = '';
    img.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${sz}px;image-rendering:pixelated;will-change:transform,opacity;filter:drop-shadow(0 0 6px ${cols[0]}) drop-shadow(0 0 14px ${cols[2] || cols[0]})`;
    layer.appendChild(img);
    const spark = (x, y, spread, life, big) => {
      const d = document.createElement('i'), c = cols[Math.floor(Math.random() * cols.length)], z = (big ? 5 : 3) + Math.floor(Math.random() * 4);
      d.style.cssText = `position:absolute;left:${x - z / 2}px;top:${y - z / 2}px;width:${z}px;height:${z}px;background:${c};box-shadow:0 0 ${z * 2}px ${c}`;
      layer.appendChild(d);
      const a = Math.random() * 6.283, r = spread * (.4 + Math.random() * .8);
      d.animate([{transform:'translate(0,0) scale(1) rotate(0deg)', opacity:1}, {transform:`translate(${Math.cos(a) * r}px,${Math.sin(a) * r - spread * .4}px) scale(.1) rotate(${Math.random() * 360}deg)`, opacity:0}], {duration:life, easing:'ease-out'}).onfinish = () => d.remove();
    };
    const ring = (x, y, size, dur) => { const r = document.createElement('i'); r.style.cssText = `position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;border:3px solid ${cols[0]};box-shadow:0 0 14px ${cols[0]},inset 0 0 12px ${cols[0]}`; layer.appendChild(r); r.animate([{transform:'scale(.2)', opacity:.95}, {transform:'scale(1.5)', opacity:0}], {duration:dur, easing:'ease-out'}).onfinish = () => r.remove(); };
    const T1 = 520, T2 = 1000, T3 = 1850, easeOut = t => 1 - Math.pow(1 - t, 3), back = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    ring(sx, sy, sz * 1.6, 700); for (let i = 0; i < 14; i++) spark(sx, sy, sz * 1.8, 800, true);
    let t0 = performance.now(), lastSp = 0, bursted = false;
    const frame = now => {
      if (fin) return;
      const t = now - t0; let x, y, sc, rot = 0, op = 1;
      if (t < T1) { const k = t / T1; x = sx; y = sy + (hy - sy) * easeOut(k); sc = back(k) * 1.15; }
      else if (t < T2) { const k = (t - T1) / (T2 - T1); x = hx + Math.sin(k * 6.283 * 2) * 3; y = hy + Math.sin(k * 6.283) * -4; sc = 1.15 + Math.sin(k * 6.283 * 3) * .05; rot = Math.sin(k * 6.283 * 2) * 9; }
      else if (t < T3) { const k = (t - T2) / (T3 - T2), e = k * k * (3 - 2 * k), cx = (hx + ex) / 2 + (ex >= hx ? -1 : 1) * vw * .22, cy = Math.min(hy, ey) - vh * .12;
        x = (1 - e) * (1 - e) * hx + 2 * (1 - e) * e * cx + e * e * ex; y = (1 - e) * (1 - e) * hy + 2 * (1 - e) * e * cy + e * e * ey; sc = 1.15 - .85 * e; rot = e * 540; op = k > .9 ? (1 - k) * 10 : 1; }
      else { if (!bursted) { bursted = true; tg.classList.remove('bag-pop'); void tg.offsetWidth; tg.classList.add('bag-pop'); setTimeout(() => tg.classList.remove('bag-pop'), 900); ring(ex, ey, sz, 600); for (let i = 0; i < 12; i++) spark(ex, ey, sz * 1.2, 650, false); hide(false); } if (now - t0 > T3 + 300) return finish(); img.style.opacity = 0; requestAnimationFrame(frame); return; }
      img.style.transform = `translate(${x - W / 2}px,${y - sz / 2}px) rotate(${rot}deg) scale(${sc})`; img.style.opacity = op;
      if (now - lastSp > (t < T2 ? 45 : 22)) { lastSp = now; spark(x + (Math.random() - .5) * W, y + (Math.random() - .5) * sz, sz * .8, 650, false); }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(now => { t0 = now; frame(now); });
    setTimeout(finish, 4000);   // trava de seguranca
  });
}
async function runChestRound(){
  state.chestAt = state.round;
  const g = $('#game'), img = document.createElement('img');
  img.className = 'chest'; img.src = CHEST_FRAMES[0]; img.alt = ''; g.appendChild(img);
  timeStop(img);
  showBanner('ARCA DO TESOURO', 'uma arca misteriosa apareceu. Abrir ou ignorar? (sem pergunta nesta rodada)');
  while (state.pendingAction || state.voteLocked) await wait(300);
  state.chestVote = null;
  const open = await new Promise(res => { state.chestDone = res; openMerchantVote('Abrir a arca?', {type:'chest'}); });
  const mine = state.chestVote === 'yes';
  hideBanner();
  if (!open) { showBanner('ARCA IGNORADA', 'ela se desfaz em poeira'); await chestVanish(img); hideBanner(); return; }
  await chestPlay(img, [1, 2, 3]); chestDust(img, 10); await wait(250);
  if (!mine) { showBanner('A ARCA ABRIU', 'você votou em ignorar: nada para você'); await wait(1900); hideBanner(); }
  else if (Math.random() < CHEST_ITEM_P) {   // item aleatório da loja (raro com pouca chance)
    const t = Math.random() < CHEST_LEGEND_P ? LEGEND_POOL[Math.floor(Math.random() * LEGEND_POOL.length)] : Math.random() < CHEST_RARE_P ? RARE_POOL[Math.floor(Math.random() * RARE_POOL.length)] : SHOP_POOL[Math.floor(Math.random() * SHOP_POOL.length)];
    if (canAdd(t)) { state.inventory.push(t); persist(); renderInventoryHits(); await flyItemToBag(t, img); }   // sem aviso no papiro: o item voa para a mochila (segure o item para ler os detalhes)
    else { const n = ITEMS[t].price; state.gold += n; state.stats.gained += n; persist(); goldGain(n); showBanner('MOCHILA CHEIA', `${ITEMS[t].name} virou ${n} moedas`); await wait(2300); hideBanner(); }
  } else {                                   // armadilha: só para quem abriu
    const k = activeGroup, h = state.heroes[k];
    showBanner('ARMADILHA!', `a arca explode em quem abriu: -${CHEST_TRAP} de HP`); flashHit();
    if (h.hp > 0) { const m = itemMit(k, CHEST_TRAP, false); h.hp = Math.max(0, h.hp - m.d); window.__ts = 1; A.play(k, 'hurt', {light:true}); setTimeout(() => { if (state.tsOv) window.__ts = .001; }, 900); floatText(HERO_X[k], 56, `-${m.d}${m.note}`, '#ff6b81'); }
    renderHud(); await wait(2100); hideBanner();
  }
  await chestPlay(img, [2, 1, 0], 130); await wait(250); await chestVanish(img);   // fecha e some
}
async function bossIntro(ev = {}){
  const game = $('#game');
  if (state.hardNext) {
    showBanner('O BOSS ENFURECEU!', `pergunta rank S/SS a caminho · ${ST.aoe} +${ENRAGE_AOE}`);
    flashHit(); A.play('boss', 'enrage'); A.sayRandom('boss', 'enrage', 1); state.enraged = true; await wait(2300); hideBanner();
    state.rage = 0; state.hardNext = false; renderHud(); return;
  }
  if (ev.prep) {
    state.prepNext = true; renderHud();
    showBanner('PREPARANDO HABILIDADE', `só a ${ST.aoe} agora… o PRÓXIMO golpe será 50% mais forte: DEFENDAM!`);
    flashHit(); A.play('boss', 'prep'); A.sayRandom('boss', 'enrage', .6); await wait(2400); hideBanner(); return;
  }
  if (ev.tele) {
    const t = ev.tele; showBanner(ST.tele.toUpperCase() + '!', `o boss sumiu… vai surgir atrás de ${GROUPS[t]}! Use ESQUIVA!`);
    A.play('boss', 'tpOut'); A.fx('boss', 'mark', {x:HERO_WX(t), y:1085}); A.sayRandom('boss', 'laugh', .5); await wait(1900); hideBanner(); return;
  }
  if (ev.dazed) { showBanner('BOSS DESNORTEADO!', 'o Super Pesado do Tanque o atordoou: +25% de dano nele e sem habilidades especiais'); A.play('boss', 'hurt'); floatText(50, 17, 'DESNORTEADO!', '#ffd34d'); await wait(1600); hideBanner(); return; }
  if (ev.empowered) { showBanner('GOLPE REFORÇADO!', 'dano +50% nesta rodada — defender corta pela metade'); flashHit(); await wait(900); hideBanner(); }
  game.classList.add('boss-attack'); A.play('boss', 'attack'); A.sayRandom('boss', 'intro', .5); await wait(1000); game.classList.remove('boss-attack');
}

// ---- alvos, ultimates e marcas ----
async function pickAlly(k, sk, sh){
  const list = HERO_ORDER.filter(h => h !== k).map(h => state.heroes[h].hp > 0
    ? {hero:h, desc:`Vida ${state.heroes[h].hp}/${HERO_MAX_HP}`, chips:sk.id === 'pass' ? '<span class="tag mult">1,5x</span>' : ''} : {hero:h, desc:'Caído', block:'CAÍDO'});
  const first = list.find(x => !x.block).hero;
  const t = await chooseTarget(sk.name.toUpperCase(), sk.id === 'pass' ? 'Quem ganha o ataque extra?' : 'Quem será protegido?', list, first,
    {text:sk.id === 'pass' ? 'O aliado escolhido ganha um ataque extra (1,5x) se acertar. Sem voto no tempo: o primeiro aliado de pé.' : 'O aliado escolhido recebe a proteção nesta rodada. Sem voto no tempo: o primeiro aliado de pé.'}, sh && sh.endsAt);
  if (t === 'BACK') return 'BACK';
  return list.find(x => x.hero === t && !x.block) ? t : first;
}
async function chooseTarget(title, text, list, fallback, note, endsAt){
  if (note && note.text) showBanner(title, note.text);   // avisos ficam no papiro
  const r = await runVote({
    menu:true, panel:'target', title, text, seconds:ACTION_SECONDS, endsAt,
    options: HERO_ORDER.map((h, n) => { const it = list.find(x => x.hero === h), ok = it && !it.block;
      return {label:GROUPS[h], desc:it ? it.desc : '', kind:'util hero-' + h, face:h, slot:[n >> 1, n & 1],
        chips: ok ? (it.chips || '') : it && it.block ? `<span class="tag block">${it.block}</span>` : !it && h === activeGroup ? '<span class="tag">VOCÊ</span>' : '', disabled:!ok}; })
      .concat([{label:'VOLTAR', desc:'Escolher outra habilidade', kind:'back', back:true}])
  });
  hideBanner();
  return r.idx === null ? fallback : r.idx === HERO_ORDER.length ? 'BACK' : HERO_ORDER[r.idx];
}
const healTargets = () => HERO_ORDER.map(h => { const hp = state.heroes[h].hp;
  return hp <= 0 ? {hero:h, desc:'Caído', chips:`<span class="tag holy attr">REVIVER ${REVIVE_HP}</span>`}
       : hp < HERO_MAX_HP ? {hero:h, desc:`Vida ${hp}/${HERO_MAX_HP}`, chips:`<span class="tag attr">CURAR +${HEAL_AMOUNT}</span>`}
       : {hero:h, desc:'Vida cheia', block:'VIDA CHEIA'}; });
function ultUsable(k){ return k !== 'cleriga' || healTargets().some(t => !t.block); }
async function activateUlt(k, sh){
  const b = state.buff; let note = ULT_INFO[k], cleTarget = null;
  if (k === 'cleriga') {   // Luz Sagrada: primeiro escolhe quem recebe; sem escolha no tempo = não usa (continua disponível)
    const list = healTargets(), valid = list.filter(t => !t.block);
    if (k === activeGroup && state.heroes[k].hp > 0) {
      let r = await chooseTarget('LUZ SAGRADA', 'Quem recebe a luz?', list, null, {text:'Cura +' + HEAL_AMOUNT + ' de vida ou revive com ' + REVIVE_HP + '. Sem voto no tempo: a Luz Sagrada não é usada.'}, sh && sh.endsAt); await closePanel();
      if (r === 'BACK') return 'BACK';
      if (!r || !valid.some(v => v.hero === r)) { toast('Tempo esgotado: a Luz Sagrada não foi usada e continua disponível.'); return false; }
      cleTarget = r;
    } else cleTarget = valid.slice().sort((x, y) => state.heroes[x.hero].hp - state.heroes[y.hero].hp)[0].hero;
  }
  state.ultReady[k] = false;
  showBanner(`${GROUPS[k]}: ${ULT_NAME[k].toUpperCase()}!`, note);
  const ft = cleTarget && A.feet ? A.feet(cleTarget) : null;
  const tx = cleTarget ? (ft ? ft.x : HERO_X[cleTarget] / 100 * 1024) : null;
  const ultPl = A.play(k, 'ult', cleTarget ? {tx, ty:ft ? ft.y : 1098, tget:A.body ? () => A.body(cleTarget) : null} : {}); A.sayRandom(k, 'ult', 1);
  if (k === 'mage') {   // cada dano entra junto do seu estouro do buraco negro (1,5x no 1º, 2,5x no 2º = 4x)
    const onHit = () => Promise.race([A.hit('mage'), sleep(6500)]);
    await onHit(); await heroAttack(k, Math.round(HERO_BASE.mage * BH_PARTS[0]), '#b36bff', true, true);
    await onHit(); await heroAttack(k, Math.round(HERO_BASE.mage * BH_PARTS[1]), '#d9a8ff', true, true);
    state.ultCd.mage = 1;
  }
  else if (k === 'guerreiro') { b.bers = 2; b.tired = 0; }
  else if (k === 'tank') b.taunt = 2;
  else {
    const t = cleTarget; await sleep(2500);   // a luz desce sobre o alvo e só então a vida muda
    const h = state.heroes[t];
    if (h.hp <= 0) { h.hp = REVIVE_HP; floatText(HERO_X[t], 56, 'REVIVEU!', '#ffe08a'); }
    else { h.hp = Math.min(HERO_MAX_HP, h.hp + HEAL_AMOUNT); floatText(HERO_X[t], 56, `+${HEAL_AMOUNT}`, '#9fe3a8'); A.extra(t, 'heal'); A.react(t, 'right'); }
    if (ST.ice) iceCure(t, {thaw:true, bleed:true});
    showBanner(`Luz Sagrada: ${GROUPS[t]}`, h.hp === REVIVE_HP ? 'voltou à luta!' : ST.ice ? 'vida restaurada, descongelado e sem sangramento' : 'vida restaurada');
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
  if (to === 'guerreiro') { if (b.bers > 0) { d = Math.round(d * 0.5); note += ' (berserk)'; } else if (b.tired > 0) { d = Math.round(d * 1.5); note += ' (exausto)'; } }
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
const ARTICLE = {mage:'DA', guerreiro:'DO', tank:'DO', cleriga:'DA'};
const SLOT = {   // posição [linha, coluna] de cada habilidade no quadro do herói
  cleriga:{ult:[0,0], holy_atk:[1,0], holy_def:[2,0], atk:[0,1], def:[1,1], dodge:[2,1]},
  mage:{ult:[0,0], elem_atk:[1,0], elem_def:[2,0], mana_atk:[0,1], mana_def:[1,1], dodge:[2,1]},
  guerreiro:{ult:[0,0], heavy:[1,0], def:[2,0], atk:[0,1], pass:[1,1], dodge:[2,1]},
  tank:{ult:[0,0], super:[1,0], def:[2,0], atk:[0,1], guard:[1,1], dodge:[2,1]}
};
async function chooseSkill(k, sh = {}){
  const at = state.curAttack, list = SKILLS[k];
  let endsAt = sh.endsAt || null;   // o relógio da vez é um só: continua descendo ao escolher o elemento e ao voltar
  for (;;) {
    if (!endsAt) endsAt = Date.now() + ACTION_SECONDS * 1000;
    sh.endsAt = endsAt;
    const ult = state.ultReady[k] && ultUsable(k);
    const opts = [];
    // o especial aparece sempre; só dá para escolher depois de acertar uma pergunta rank S/SS
    opts.push({label:'ESPECIAL: ' + ULT_NAME[k], kind:'ult', slot:SLOT[k].ult, desc:ULT_INFO[k], chips:'<span class="tag">SÓ RANK S/SS</span>', disabled:!ult, block:ult ? null : (state.ultReady[k] ? 'SEM ALVO' : (state.ultCd[k] || 0) > 0 ? 'RECARGA 1 S/SS' : 'ACERTE RANK S/SS')});
    list.forEach(sk => { const b = skillBlock(k, sk); opts.push({label:sk.name, kind:sk.kind, slot:SLOT[k][sk.id], desc:sk.desc, chips:skillChips(sk, null), disabled:!!b, block:b}); });
    const r = await runVote({menu:true, panel:k, title:`VEZ ${ARTICLE[k]} ${GROUPS[k]}`, text:'Escolham a habilidade', seconds:ACTION_SECONDS, endsAt, attack:at, options:opts});
    if (r.idx === null) return null;
    if (r.idx === 0) { await closePanel(); if (await activateUlt(k, sh) === 'BACK') continue; endsAt = null; continue; }   // ultimate ativado: o efeito começa a contar agora
    const sk = list[r.idx - 1]; let element = null;
    if (sk.elem) {
      const els = ['fire','water','air','earth'];
      window.__elemDef = sk.kind === 'def';   // o seletor de elementos tem uma arte para ataque e outra para escudo
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
  const al = HERO_ORDER.map(k => { const d = document.createElement('div'); d.className = 'gag-alert'; d.style.left = HERO_X[k] + '%'; d.innerHTML = '<b>!</b><i>HITKILL</i>'; g.appendChild(d); return d; });
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
  showBanner('DESINVOCANDO...', 'Malgorath, Lorde das Trevas, manda o goblin de volta');
  const dis = A.play('boss', 'gagDismiss');
  await wait(750);
  A.fx('boss', 'puff', {x:sp.x, y:sp.y - 30, n:14, r:70});
  gb.classList.add('gone'); setTimeout(() => gb.remove(), 500);
  await dis;
  showBanner('DRAGÃO CANCELADO', 'o boss desistiu da invocação... por enquanto');
  await wait(1900); hideBanner();
}
function maybeGag(where){
  if (!ST.gag || state.gag || state.over || state.bossHp <= 0 || aliveHeroes().length === 0) return Promise.resolve();
  const force = TEST_MODE && window.__force === 'gag';
  const p = where === 'start' ? .16 : .1;
  if (!force && !(state.round >= 2 && (Math.random() < p || state.round >= 6))) return Promise.resolve();
  return gagDragon();
}


function newIce(){ return {cold:{}, frozen:{}, imm:{}, bleed:{}, iced:{}, jf:{}, mark:null, markNext:null, counter:false, step:false, tempestWarn:false, tempestCd:2, frenzy:false}; }
const ICE_COL = {cut:'#ff6b81', ice:'#7fd0ff', blood:'#ff3040'};
const actOf = k => { const a = state.curActions && state.curActions[k]; return a && a !== 'ult' && a.skill ? a : null; };
function iceCure(k, {thaw = false, bleed = false} = {}){
  const I = state.ice; let n = [];
  if (thaw && I.frozen[k] > 0) { I.frozen[k] = 0; I.imm[k] = 1; n.push('descongelou'); }
  if (bleed && I.bleed[k]) { I.bleed[k] = null; n.push('sangramento limpo'); }
  if (n.length) floatText(HERO_X[k], 52, n.join(' · ').toUpperCase(), '#bfe8ff');
}
function iceThawAll(){   // fogo da Maga: descongela todos e tira 1 de Frio de quem tiver
  const I = state.ice; HERO_ORDER.forEach(k => { if (state.heroes[k].hp <= 0) return; if (I.frozen[k] > 0) iceCure(k, {thaw:true}); else if (I.cold[k] > 0) { I.cold[k]--; floatText(HERO_X[k], 52, 'FRIO -1', '#ffb066'); } });
}
function addCold(k, n){
  const I = state.ice; if (n <= 0 || I.frozen[k] > 0) return; if (I.imm[k] > 0) { floatText(HERO_X[k], 50, 'SEM FRIO', '#bfe8ff'); return; }
  I.cold[k] = (I.cold[k] || 0) + n; I.iced[k] = true;
  if (I.cold[k] >= ICE_FREEZE_AT) { I.cold[k] = 0; I.frozen[k] = state.phase2 ? 2 : 1; I.jf[k] = true; floatText(HERO_X[k], 46, 'CONGELADO!', '#9fe8ff'); }
  else floatText(HERO_X[k], 50, `FRIO ${I.cold[k]}/${ICE_FREEZE_AT}`, '#9fe8ff');
}
function addBleed(k){
  const I = state.ice, b = I.bleed[k] || {stacks:0, turns:0}; b.stacks = Math.min(ICE_BLEED_MAX, b.stacks + 1); b.turns = ICE_BLEED_TURNS; I.bleed[k] = b; floatText(HERO_X[k], 50, `SANGRA x${b.stacks}`, '#ff5a6a');
}
// Um golpe do Hrimgar em `to0`: Provocação/Proteção redirecionam; esquiva anula; defesa corta por golpe; congelado leva +25%.
async function iceStrike(to0, o = {}){
  const I = state.ice, rank = o.rank || (state.curQ ? state.curQ.difficulty : 1), type = o.type || 'cut';
  const base = o.dmg != null ? o.dmg : ICE_DMG[rank], crit = !!o.crit;
  const rt = routeHit(to0, Math.round(base * (crit ? CRIT_MULT : 1))), t = rt.to; if (state.heroes[t].hp <= 0) return 0;
  const a = actOf(t), sk = a ? a.skill : null, el = a ? a.element : null;
  if (!o.noAnim) { const an = o.anim || 'jab'; if (A.has('boss', an)) { A.play('boss', an, {tx:HERO_WX(t), ty:1010}); await Promise.race([A.hit('boss'), wait(2200)]); } else await shoot(50, 26, HERO_X[t], 60, ICE_COL[type], 420); }
  if (sk && sk.kind === 'dodge') { A.play(t, 'dodge'); floatText(HERO_X[t], 56, 'ESQUIVOU!', '#9fe3a8'); if (o.tempest) state.stun = true; return 0; }
  if (o.fireNegates && sk && sk.id === 'elem_def' && el === 'fire') { A.play(t, 'guard', {color:ELEMENTS.fire.color}); floatText(HERO_X[t], 56, 'ESCUDO DE FOGO!', '#ff9d3d'); return 0; }
  let d = rt.dmg, note = rt.note;
  if (sk && sk.kind === 'def') { const red = (sk.holy ? BOSS.weak.includes('holy') : sk.elem && BOSS.weak.includes(el)) && sk.bonus ? sk.bonus : sk.reduce; d = Math.round(d * (1 - red)); note += ' (defesa)'; if (sk.id === 'holy_def') iceCure(t, {bleed:true}); }
  if (I.frozen[t] > 0) { d = Math.round(d * FROZEN_MULT); note += ' (congelado)'; }
  const m = itemMit(t, d, true); d = m.d; note += m.note;
  flashHit(); A.play(t, 'hurt', {light:!!o.quick}); if (!o.quick) A.sayRandom(t, 'hurt', .3);
  state.heroes[t].hp = Math.max(0, state.heroes[t].hp - d);
  floatText(HERO_X[t], 56, `${crit ? 'CRÍTICO ' : ''}-${d}${note}`, crit ? '#ffd34d' : ICE_COL[type]);
  if (d > 0 && state.heroes[t].hp > 0) { if (type === 'ice') addCold(t, o.cold || 1); else if (o.cold) addCold(t, o.cold); if (type === 'blood') addBleed(t); }
  renderHud(); await wait(o.quick ? 260 : 520); return d;
}
async function iceVolley(n, {tempest = false} = {}){
  const I = state.ice, rank = state.curQ ? state.curQ.difficulty : 1, cc = ICE_CRIT[state.phase2 ? 1 : 0] + (I.frenzy ? FRENZY_CRIT : 0);
  for (let i = 0; i < n; i++) for (const k of HERO_ORDER) {
    if (state.over) return; if (state.heroes[k].hp <= 0) continue;
    let to = k; if (I.mark && state.heroes[I.mark].hp > 0 && Math.random() < .8) to = I.mark;
    const type = i === 0 && state.curAttack && ICE_ATK[state.curAttack.id] ? state.curAttack.id : iceRoll(rank);
    await iceStrike(to, {type, crit:Math.random() < cc, rank, quick:n >= 4, anim:n >= 4 ? 'jabq' : (Math.random() < .5 ? 'jab' : 'jabV'), tempest});
    if (aliveHeroes().length === 0) return;
  }
}
async function iceIntro(ev){
  const I = state.ice, game = $('#game');
  I.mark = I.markNext; I.markNext = null;
  if (I.mark && state.heroes[I.mark].hp > 0) { showBanner('MARCA DO DUELISTA', `quase todos os golpes vão em ${GROUPS[I.mark]} nesta rodada (Provocação, Proteção ou Esquiva)`); showRing(I.mark); A.fx('boss', 'mark', {x:HERO_WX(I.mark), y:1085}); await wait(1900); A.fx('boss', 'unmark'); hideBanner(); hideRing(); }
  else I.mark = null;
  if (state.hardNext) { showBanner('FRENESI!', `o Ímpeto encheu: +1 golpe em cada herói e +15% de crítico nesta rodada · pergunta rank S/SS a caminho`); flashHit(); A.play('boss', 'enrage'); A.sayRandom('boss', 'enrage', 1); I.frenzy = true; state.enraged = true; await wait(2400); hideBanner(); state.rage = 0; state.hardNext = false; renderHud(); return; }
  if (ev === 'tempest') { showBanner('TEMPESTADE DE QUATRO LÂMINAS!', 'quatro golpes em cada herói · ESQUIVA anula e atordoa, Defesa do Tanque corta 75%, Provocação divide'); flashHit(); A.play('boss', 'enrage'); await wait(2400); hideBanner(); return; }
  if (ev === 'tempestWarn') { showBanner('TEMPESTADE DE QUATRO LÂMINAS', 'o Rei Gelado prepara o golpe final: ele vem na PRÓXIMA rodada. Preparem-se!'); flashHit(); A.play('boss', 'prep'); await wait(2400); hideBanner(); return; }
  if (ev === 'step') { showBanner('PASSO GÉLIDO', 'o Rei Gelado desliza: Guerreiro e Tanque erram muito. Ataques mágicos e cajados sempre acertam.'); A.play('boss', 'laugh'); await wait(2200); hideBanner(); return; }
  if (ev === 'mark') { showBanner('MARCA DO DUELISTA', 'um herói foi marcado: na próxima rodada quase todos os golpes vão nele'); A.play('boss', 'prep'); await wait(1900); hideBanner(); return; }
  if (ev === 'counter') { showBanner('CONTRA-ATAQUE', 'postura defensiva: quem atacar com físico leva um golpe de volta. Use magia ou defenda.'); A.play('boss', 'prep'); await wait(2200); hideBanner(); return; }
  if (ev === 'cut') { showBanner('CORTE CONGELANTE', 'onda de gelo em 2 heróis: +2 de Frio. O Escudo de Fogo da Maga ou a Esquiva anulam.'); A.play('boss', 'prep'); await wait(2200); hideBanner(); return; }
  game.classList.add('boss-attack'); A.play('boss', 'attack'); await wait(900); game.classList.remove('boss-attack');
}
function iceRoundEnd(){
  const I = state.ice;
  HERO_ORDER.forEach(k => {
    if (state.heroes[k].hp <= 0) { I.cold[k] = 0; I.frozen[k] = 0; I.bleed[k] = null; return; }
    if (I.frozen[k] > 0) { if (I.jf[k]) { /* congelou nesta rodada: conta a partir da próxima */ } else { I.frozen[k]--; if (I.frozen[k] === 0) { I.imm[k] = 1; floatText(HERO_X[k], 52, 'DESCONGELOU', '#bfe8ff'); } } }
    else { if (I.imm[k] > 0) I.imm[k]--; if (!I.iced[k] && I.cold[k] > 0) I.cold[k]--; }
  });
  I.iced = {}; I.jf = {}; I.step = false; I.counter = false; I.frenzy = false; I.mark = null;
}
async function iceBleedTick(){
  const I = state.ice; let any = false;
  HERO_ORDER.forEach(k => { const b = I.bleed[k], h = state.heroes[k]; if (!b || h.hp <= 0) return; const d = ICE_BLEED * b.stacks; h.hp = Math.max(0, h.hp - d); floatText(HERO_X[k], 58, `-${d} SANGRAMENTO`, '#ff3040'); any = true; if (--b.turns <= 0) I.bleed[k] = null; });
  if (any) { flashHit(); renderHud(); await wait(900); }
}
// ===== Modo teste automatico: os heróis que o jogador não escolheu jogam perfeito =====
// Acertam 100% das perguntas, escolhem a melhor habilidade para cada situação e usam itens de uma bolsa sem fim,
// neles mesmos ou nos aliados (inclusive no herói do jogador), sempre pelas mesmas regras de itens do jogo.
const AUTO_WANT_MP = {mage:30, guerreiro:15, tank:20, cleriga:20};   // mana mínima para a melhor habilidade de cada um
const AUTO_SHORT = {hp_s:'POÇÃO HP', hp:'POÇÃO HP', hp_l:'POÇÃO HP', mana_s:'POÇÃO MANA', mana:'POÇÃO MANA', mana_l:'POÇÃO MANA', iron_shield:'ESCUDO', amulet:'AMULETO', helm:'ELMO', smokebomb:'FUMAÇA', elixir:'ELIXIR', herb:'ERVA', lens:'LENTE', tonic:'TÔNICO', powder:'PÓLVORA', blade:'LÂMINA', lightbomb:'BOMBA', hourglass:'AMPULHETA', phoenix:'FÊNIX', dice:'DADO', scroll:'PERGAMINHO'};
const autoAlive = () => HERO_ORDER.filter(k => state.heroes[k].hp > 0);
const autoBot = k => k !== activeGroup && state.heroes[k].hp > 0;
// Economia realista dos heróis simulados: cada um começa com 0 moedas, ganha ao acertar, tem a própria prateleira
// de mercador (itens sorteados) e só usa o que comprou.
function autoEco(){
  if (!state.eco) { state.eco = {}; HERO_ORDER.forEach(k => { if (k !== activeGroup) state.eco[k] = {gold:0, inv:[], slots:newShop().slots}; }); }
  return state.eco;
}
const botStacks = inv => { const c = {}; inv.forEach(t => { c[t] = (c[t] || 0) + 1; }); return Object.values(c).reduce((a, n) => a + Math.ceil(n / STACK_MAX), 0); };
const botCanAdd = (inv, t) => botStacks(inv.concat(t)) <= BAG_SLOTS;
function autoEarn(meta){   // quem acertou ganha as moedas do rank (e a Moeda da Sorte, se tiver)
  const E = autoEco();
  HERO_ORDER.forEach(k => { if (k === activeGroup) return; let g = meta.reward; const lb = state.ib[k]; if (lb.lucky > 0) { g += lb.luckyAmt; lb.lucky--; } E[k].gold += g; });
}
function autoShelfPick(slots, sold){
  const on = slots.filter(Boolean);
  if (Math.random() < LEGEND_CHANCE) { const r = LEGEND_POOL.filter(t => !on.includes(t)); if (r.length) return r[Math.floor(Math.random() * r.length)]; }
  if (Math.random() < RARE_CHANCE) { const r = RARE_POOL.filter(t => !on.includes(t)); if (r.length) return r[Math.floor(Math.random() * r.length)]; }
  let c = SHOP_POOL.filter(t => t !== sold && !on.includes(t)); if (!c.length) c = SHOP_POOL.filter(t => t !== sold);
  return c[Math.floor(Math.random() * c.length)];
}
const AUTO_NOBUY = new Set(['clock', 'lucky']);   // relógios e moeda da sorte: sem utilidade para a lógica deles
function autoShop(){   // nem toda rodada eles passam no mercador; compram o que precisam e podem pagar
  const E = autoEco();
  HERO_ORDER.forEach(k => {
    if (k === activeGroup || state.heroes[k].hp <= 0) return;
    const e = E[k]; if (Math.random() < .4) return;
    e.slots = e.slots.map(t => t || autoShelfPick(e.slots));
    for (let n = 0; n < 2; n++) {
      const h = state.heroes[k], cand = e.slots.map((t, i) => ({t, i})).filter(o => !AUTO_NOBUY.has(ITEMS[o.t].fx) && ITEMS[o.t].price <= e.gold && botCanAdd(e.inv, o.t));
      if (!cand.length) break;
      const w = o => { const it = ITEMS[o.t]; let x = 2;
        if (it.kind === 'hp') x = h.hp < 70 ? 5 : 1; else if (it.kind === 'mp') x = h.mp < AUTO_WANT_MP[k] + 25 ? 5 : 1;
        else if (['tonic', 'powder', 'lens', 'blade', 'dice', 'lightbomb'].includes(it.fx)) x = 3; else if (it.fx === 'phoenix' || it.fx === 'scroll') x = 3; else if (it.fx === 'hourglass') x = k === 'mage' ? 2 : 0.5;
        return x; };
      const tot = cand.reduce((a, o) => a + w(o), 0); let r = Math.random() * tot, pick = cand[0];
      for (const o of cand) { r -= w(o); if (r <= 0) { pick = o; break; } }
      e.gold -= ITEMS[pick.t].price; e.inv.push(pick.t); e.slots[pick.i] = autoShelfPick(e.slots, pick.t);
      if (Math.random() < .5) break;
    }
  });
}
function autoOwner(type, tgt){   // quem tem o item e pode usá-lo em tgt (ele mesmo, ou um aliado se o item puder ser dado)
  const E = autoEco();
  if (autoBot(tgt) && E[tgt].inv.includes(type)) return tgt;
  if (giveable(type)) return ['cleriga', 'tank', 'guerreiro', 'mage'].find(h => h !== tgt && autoBot(h) && E[h].inv.includes(type)) || null;
  return null;
}
async function autoUse(type, tgt){
  const it = ITEMS[type], h = state.heroes[tgt], by = it && h ? autoOwner(type, tgt) : null; if (!by) return false;
  if (it.kind === 'fx') {
    if (it.fx === 'phoenix') { if (h.hp > 0 || !aliveHeroes().length) return false; } else if (h.hp <= 0) return false;
    if (it.fx === 'elixir' && h.hp >= HERO_MAX_HP && h.mp >= 100) return false;
    if (it.fx === 'scroll' && state.ultReady[tgt]) return false;
    FX[it.fx](state.ib[tgt], h, hasAff(type, tgt), tgt, it);
  } else {
    const max = it.kind === 'hp' ? HERO_MAX_HP : 100;
    if ((it.kind === 'hp' && h.hp <= 0) || h[it.kind] >= max) return false;
    h[it.kind] = Math.min(max, h[it.kind] + it.amount);
  }
  const inv = autoEco()[by].inv; inv.splice(inv.indexOf(type), 1);
  floatText(HERO_X[tgt], 44, AUTO_SHORT[type] || it.name.toUpperCase(), '#ffe08a');
  A.extra(tgt, it.kind === 'hp' || it.fx === 'elixir' || it.fx === 'herb' || it.fx === 'phoenix' ? 'heal' : 'guard');
  toast(`${GROUPS[by]} usou ${it.name}${by !== tgt ? ' em ' + GROUPS[tgt] : ''}.`);
  renderHud(); await wait(520); return true;
}
// antes das ações: reviver, curar, mana e proteção (só com o que eles compraram)
async function autoSupport({tele, iceEv}){
  if (state.over) return;
  const I = state.ice; let n = 0;
  const use = async (type, tgt) => { if (n >= 7) return false; const ok = await autoUse(type, tgt); if (ok) n++; return ok; };
  const any = async (types, tgt) => { for (const t of types) if (await use(t, tgt)) return true; return false; };
  for (const k of HERO_ORDER) if (state.heroes[k].hp <= 0 && autoAlive().length) await use('phoenix', k);
  for (const k of autoAlive()) {
    const h = state.heroes[k];
    if (ST.ice && I.bleed[k] && !state.ib[k].herb) await use('herb', k);
    for (let i = 0; i < 2 && h.hp < 60; i++) { const miss = HERO_MAX_HP - h.hp; if (!await any(miss >= 55 ? ['hp_l', 'hp', 'hp_s', 'elixir'] : miss >= 28 ? ['hp', 'hp_s', 'hp_l', 'elixir'] : ['hp_s', 'hp', 'hp_l'], k)) break; }
  }
  for (const k of autoAlive()) {
    if (!autoBot(k)) continue;
    const h = state.heroes[k];
    if (h.mp < AUTO_WANT_MP[k]) await any(h.mp <= 25 ? ['mana_l', 'mana', 'mana_s', 'elixir'] : ['mana', 'mana_s', 'mana_l', 'elixir'], k);
    if ((k === 'mage' && (state.cd.mage.elem_atk || 0) > 0) || (k === 'guerreiro' && (state.cd.guerreiro.heavy || 0) > 0)) await use('hourglass', k);
    if (!state.ultReady[k]) await use('scroll', k);
  }
  for (const k of autoAlive()) {   // proteção
    const b = state.ib[k];
    if (ST.ice) {
      if (!b.helm) await use('helm', k);
      if ((iceEv === 'tempest' || I.mark === k || (I.cold[k] || 0) >= 2) && !b.smoke) await use('smokebomb', k);
      if (I.mark === k && !b.shield) await use('iron_shield', k);
    } else {
      if (!b.amulet && (k === activeGroup || state.heroes[k].hp < 80)) await use('amulet', k);
      if (k === activeGroup && !b.shield) await use('iron_shield', k);
      if (tele === k && !b.shield) await use('iron_shield', k);
    }
  }
}
// depois de escolhidas as ações: itens de dano que o herói tem na mochila
async function autoOffense(actions){
  if (state.over) return;
  for (const k of HERO_ORDER) {
    if (!autoBot(k)) continue;
    const a = actions[k]; if (!a || a === 'ult' || !a.skill || a.skill.kind !== 'atk') continue;
    const b = state.ib[k], list = [];
    if (b.blade < 30) list.push('blade'); if (!b.tonic) list.push('tonic'); if (!b.dice) list.push('dice');
    if (!b.powder) list.push('powder'); if (!b.lens) list.push('lens'); list.push('lightbomb');
    let n = 0; for (const t of list) { if (n >= 2) break; if (await autoUse(t, k)) n++; }
  }
}
function autoWantUlt(k){
  if (k !== 'cleriga') return true;
  const I = state.ice;
  return HERO_ORDER.some(h => state.heroes[h].hp <= 0 || state.heroes[h].hp <= 55 || (ST.ice && (I.frozen[h] > 0 || (I.bleed[h] && I.bleed[h].stacks >= 2))));
}
function autoPick(k, {iceEv}){
  const av = SKILLS[k].filter(sk => !skillBlock(k, sk)), get = id => av.find(s => s.id === id);
  const I = state.ice, hard = ST.ice && (I.step || I.counter);   // Passo Gélido / Contra-ataque: físico não compensa
  const allies = HERO_ORDER.filter(h => h !== k && state.heroes[h].hp > 0);
  const el = ST.weak.find(e => e !== 'holy') || 'fire';
  let sk = null, element = null, target = null;
  if (k === 'mage') { sk = get('elem_atk') || get('mana_atk'); if (sk && sk.elem) element = el; }
  else if (k === 'guerreiro') {
    const p = get('pass'), t = ['mage', 'tank', 'cleriga'].find(h => allies.includes(h));
    if (hard && p && t) { sk = p; target = t; } else sk = get('heavy') || get('atk');
  }
  else if (k === 'tank') {
    const g = get('guard');
    if (hard && g && allies.length) { sk = g; target = (I.mark && allies.includes(I.mark) ? I.mark : allies.slice().sort((a, b) => state.heroes[a].hp - state.heroes[b].hp)[0]); }
    else sk = get('super') || get('atk');
  }
  else sk = (BOSS.weak.includes('holy') && get('holy_atk')) || get('atk');
  return sk ? {skill:sk, element, target} : null;
}

async function playRound(){ if (TEST_MODE && PARAMS.get('pause')) return;
  if (state.over) return;
  await QREADY;
  state.round++;
  if (chestEligible()) {   // rodada de baú: sem pergunta; a próxima rodada volta ao normal
    state.round--; state.chestAt = state.round;
    await runChestRound();
    if (state.over) return;
    if (aliveHeroes().length === 0) return endGame(false);
    turnTimer = setTimeout(playRound, 900); return;
  }
  const enragedNow = state.hardNext, empowered = state.prepNext && !enragedNow;
  const dazed = state.dazedNext; state.dazedNext = false; if (dazed) state.stun = true;
  let prepWarn = false, tele = null;
  if (!dazed && !empowered && !enragedNow && state.round >= 2 && Math.random() < PREP_CHANCE) prepWarn = true;
  if (!dazed && !empowered && !prepWarn && !enragedNow && state.round > TELE_FROM && state.teleCd <= 0 && Math.random() < TELE_CHANCE) { const al = aliveHeroes().sort((a, b) => state.heroes[a].hp - state.heroes[b].hp); tele = al[0] || null; if (tele) state.teleCd = TELE_CD; }
  const FORCE = TEST_MODE ? window.__force : null;   // só em ?teste=1: força um evento do boss (verificação)
  if (FORCE === 'prep' && !empowered && !enragedNow) { prepWarn = true; tele = null; }
  if (FORCE === 'tele' && !empowered && !enragedNow) { prepWarn = false; tele = aliveHeroes().sort((a, b) => state.heroes[a].hp - state.heroes[b].hp)[0] || null; }
  let iceEv = null;
  if (ST.ice) {
    prepWarn = false; tele = null; const I = state.ice; state.curActions = null;
    if (I.tempestWarn) { iceEv = 'tempest'; I.tempestWarn = false; I.tempestCd = 4; }
    else if (!dazed && !enragedNow && state.round >= 2) {
      const ph = state.phase2 ? 1 : 0, y = Math.random(); I.tempestCd = Math.max(0, I.tempestCd - 1);
      if (state.phase2 && I.tempestCd <= 0 && Math.random() < .3) { iceEv = 'tempestWarn'; I.tempestWarn = true; }
      else if (y < STEP_CHANCE[ph]) iceEv = 'step';
      else if (y < STEP_CHANCE[ph] + .12 && !I.markNext) iceEv = 'mark';
      else if (y < STEP_CHANCE[ph] + .22) iceEv = 'counter';
      else if (y < STEP_CHANCE[ph] + .34) iceEv = 'cut';
    }
    if (TEST_MODE && window.__iceEv) { iceEv = window.__iceEv; if (iceEv === 'tempest') I.tempestWarn = false; if (iceEv === 'tempestWarn') I.tempestWarn = true; }
    if (iceEv === 'step') I.step = true; if (iceEv === 'counter') I.counter = true;
    if (TEST_MODE) (window.__evlog = window.__evlog || []).push(String(iceEv));
    await iceIntro(iceEv);
    if (iceEv === 'mark') { const al = aliveHeroes(); I.markNext = al[Math.floor(Math.random() * al.length)] || null; if (I.markNext) { showRing(I.markNext); floatText(HERO_X[I.markNext], 52, 'MARCADO', '#ffd34d'); await wait(900); hideRing(); } }
  } else {
  await bossIntro({prep:prepWarn, tele, empowered, dazed});
  if (!prepWarn && !tele && !dazed && !empowered && !enragedNow) await maybeGag('start'); }
  state.sinceHard = (state.sinceHard || 0) + 1;
  if (state.sinceHard >= HARD_EVERY) state.forceHard = true;   // pergunta S/SS garantida: mantém os ultimates aparecendo
  const q = pickQuestion(state.forceHard ? (Math.random() < .7 ? 4 : 5) : rollDiff());
  if (isHardQ(q)) state.sinceHard = 0;
  state.forceHard = false; state.curQ = q;
  const meta = DIFFICULTY[q.difficulty];
  state.curAttack = rollAttack(q, enragedNow);   // fúria cheia: ataque sempre elemental

  // ---- 1) pergunta: o grupo vota na alternativa (contagem visível só para o próprio grupo)
  const res = await runVote({
    attack: state.curAttack, text: q.text, seconds: QUESTION_SECONDS[q.difficulty],
    options: q.answers.map((label, i) => ({label, hint:AUTO && i === q.correct})),
    side: {reward:meta.reward, label:meta.label, rank:meta.rank, d:q.difficulty}
  });
  // grupos controlados por outros jogadores: simulados (sem backend não dá para ver o voto real deles)
  const correct = {};
  HERO_ORDER.forEach(k => correct[k] = k === activeGroup ? res.idx === q.correct : (AUTO || Math.random() < 0.6));
  showBanner('AGUARDANDO OS OUTROS GRUPOS', 'ninguém vê a escolha dos outros'); await wait(1400); hideBanner();
  // revela
  res.btns.forEach((b, i) => { b.classList.remove('chosen'); if (i === q.correct) b.classList.add('correct'); else if (i === res.idx) b.classList.add('wrong'); });
  A.sfx(correct[activeGroup] ? 'right' : 'wrong');
  state.streak = state.streak || {}; HERO_ORDER.forEach(k => { state.streak[k] = correct[k] ? (state.streak[k] || 0) + 1 : 0; if (state.heroes[k].hp > 0) A.react(k, correct[k] ? 'right' : 'wrong'); });   // reação de cada herói à resposta do seu grupo + sequência de acertos
  state.stats.rank[q.difficulty][correct[activeGroup] ? 0 : 1]++;
  if (correct[activeGroup]) { let g = meta.reward; const lb = state.ib[activeGroup]; if (lb.lucky > 0) { g += lb.luckyAmt; lb.lucky--; } state.gold += g; state.stats.gained += g; persist(); goldGain(g); }
  else toast(res.idx === null ? 'Seu grupo não respondeu a tempo.' : 'Seu grupo errou.');
  if (AUTO) { autoEarn(meta); autoShop(); }
  state.missN = HERO_ORDER.filter(k => state.heroes[k].hp > 0 && !correct[k]).length;   // quem errou alimenta o vampirismo
  if (state.curAttack.leech && state.missN > 0) toast(`Ataque ${state.curAttack.tipo.toLowerCase()} ${ST.famAdj}: o boss suga ${Math.round(leechRate() * 100)}% da vida que tirar.`);
  if (isHardQ(q)) { const miss = HERO_ORDER.filter(k => state.heroes[k].hp > 0 && !correct[k]).length; if (miss) { state.rage = Math.min(RAGE_MAX, state.rage + miss); toast(ST.ice ? `Erro no rank ${meta.rank}: Ímpeto +${miss}.` : `Erro no rank ${meta.rank}: fúria +${miss} e ${ST.aoe} mais forte.`); } }
  if (isHardQ(q)) HERO_ORDER.forEach(k => { if ((state.ultCd[k] || 0) > 0) { state.ultCd[k]--; return; } if (correct[k]) state.ultReady[k] = true; });   // recarga do Buraco Negro: pula uma pergunta S/SS inteira
  await wait(1500);
  renderHud();
  await closePanel();

  // ---- 2) ações dos heróis
  const actions = {};
  if (AUTO) await autoSupport({tele, iceEv});
  for (const k of HERO_ORDER) {
    if (state.heroes[k].hp <= 0) { actions[k] = null; continue; }
    if (ST.ice && state.ice.frozen[k] > 0) { actions[k] = null; if (k === activeGroup) toast('Seu herói está CONGELADO: não age nesta rodada, mas sua resposta conta.'); continue; }
    // ultimate do grupo ativo: só entra em ação quando o grupo escolhe o card ESPECIAL (ou toca no ícone) no menu; os outros grupos são simulados
    if (k !== activeGroup && state.ultReady[k] && ultUsable(k) && (AUTO ? autoWantUlt(k) : Math.random() < 0.5)) await activateUlt(k);
    const at = state.curAttack;
    if (k === activeGroup) {
      showRing(k); await wait(400);
      const sh = {};   // um unico relogio por vez: habilidade -> alvo -> voltar
      for (;;) {
        actions[k] = await chooseSkill(k, sh);
        if (actions[k] && actions[k].skill.target) { actions[k].target = await pickAlly(k, actions[k].skill, sh); if (actions[k].target === 'BACK') continue; }
        break;
      }
      await closePanel(); hideRing();
    } else if (AUTO) {
      actions[k] = autoPick(k, {tele, iceEv});
    } else {
      const av = SKILLS[k].filter(sk => !skillBlock(k, sk));
      const sk = av.length ? av[Math.floor(Math.random() * av.length)] : null;   // sem mana e esquiva em recarga: não age (antes travava a partida)
      if (!sk) actions[k] = null;
      else {
        actions[k] = {skill: sk, element: sk.elem ? ['fire','water','air','earth'][Math.floor(Math.random() * 4)] : null};
        if (sk.target) { const al = aliveHeroes().filter(h => h !== k); actions[k].target = al[Math.floor(Math.random() * al.length)]; }
      }
    }
  }

  closePanel(); hideRing();
  state.curActions = actions;
  if (AUTO) await autoOffense(actions);
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
        state.stun = true; floatText(50, 17, 'ATORDOADO! +25% de dano', '#ffd34d'); showBanner('ESQUIVOU DO ' + ST.tele.toUpperCase() + '!', 'o boss ficou atordoado: +25% de dano nele nesta rodada');
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
  let volleyDone = false;
  if (ST.ice && iceEv === 'tempest' && !state.over) { await iceVolley(4 + (state.ice.frenzy ? 1 : 0), {tempest:true}); volleyDone = true; if (state.stun) { floatText(50, 17, 'ATORDOADO! +25% de dano', '#ffd34d'); showBanner('ESQUIVOU DA TEMPESTADE!', 'o boss ficou atordoado: +25% de dano nele nesta rodada'); await wait(1400); hideBanner(); } if (aliveHeroes().length === 0) return endGame(false); }
  const atkMult = state.curAttack.mult * (state.curAttack.leech ? 1 + RAGE_DMG * state.rage : 1);   // ataque demoníaco: mais forte e cresce com a fúria
  const dmgBase = prepWarn ? 0 : Math.round(meta.damage * (empowered ? PREP_MULT : 1) * atkMult);
  for (const k of HERO_ORDER) {
    if (state.over) break;
    if (state.heroes[k].hp <= 0) continue;
    const act = actions[k], ok = correct[k];
    showRing(k);
    const nm = GROUPS[k];
    const sk = act ? act.skill : null, el = act ? act.element : null;
    let sub = '', hurt = 0, dmg = 0, defended = false;
    if (!sk) {
      sub = ST.ice && state.ice.frozen[k] > 0 ? 'CONGELADO: não age' + (ok ? ' (a resposta conta)' : '') : ok ? 'não escolheu ação' : 'não escolheu ação e errou';
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
        const bers = k === 'guerreiro' && state.buff.bers > 0;
        if (ok || bers) {
          dmg = Math.round(HERO_BASE[k] * sk.mult); sub = ok ? 'acertou e atacou!' : 'errou, mas o Berserk atacou!';
          if (sk.elem && el && BOSS.immune.includes(el)) { dmg = 0; sub = `${ELEMENTS[el].name}: o boss é IMUNE!`; }
          else if (sk.elem && el && BOSS.weak.includes(el)) { dmg = Math.round(dmg * BOSS_WEAK_MULT); const bn = el === ST.burnEl; if (bn) state.burn = BURN_TURNS; sub += ` ${ELEMENTS[el].name}: o boss é FRACO! ${String(BOSS_WEAK_MULT).replace('.', ',')}x${bn ? ' e fica QUEIMANDO por ' + BURN_TURNS + ' perguntas' : ''}.`; }
          else if (sk.elem && el && !ST.ice) { const r = applyMark(el); if (r) { dmg += r.dmg; sub += ` ${r.name}! +${r.dmg}`; if (r.rage) state.rage = Math.max(0, state.rage + r.rage); } else sub += ` Marca de ${ELEMENTS[el].name.toLowerCase()}.`; }
          if (sk.holy && BOSS.weak.includes('holy')) { dmg = Math.round(dmg * BOSS_WEAK_HOLY); sub += ` SAGRADO: o boss é FRACO! ${BOSS_WEAK_HOLY}x.`; }
          if (ST.ice && sk.elem && el && !BOSS.immune.includes(el) && !BOSS.weak.includes(el)) sub += ` ${ELEMENTS[el].name}: dano normal.`;
          if (ST.ice && state.ice.step && (k === 'guerreiro' || k === 'tank') && dmg > 0 && Math.random() < STEP_MISS[state.phase2 ? 1 : 0]) { dmg = -1; sub = 'PASSO GÉLIDO: o boss esquivou do golpe físico!'; }
          if (bers && dmg > 0) { dmg = Math.round(dmg * 1.5); sub += ' Berserk 1,5x!'; }
          if (dmg > 0 && k === 'tank' && sk.id === 'super') state.dazedNext = true;
          if (dmg > 0 && k === 'mage' && state.buff.bh > 0) { dmg *= 3; sub += ' Buraco Negro x3!'; }
        } else sub = 'errou: o ataque falhou';
        if (!ok) hurt = dmgBase;
      } else if (sk.kind === 'util') {
        sub = `escudo sobre ${GROUPS[act.target]}`; if (!ok) { hurt = dmgBase; sub += ', mas errou'; }
      } else if (sk.kind === 'def') {
        defended = true;
        if (ok) { sub = ST.ice ? 'acertou e defendeu: o Ímpeto do boss sobe!' : 'acertou, mas defendeu à toa!'; state.rage = Math.min(RAGE_MAX, state.rage + RAGE_WASTED); }
        else {
          const red = (sk.holy ? BOSS.weak.includes('holy') : sk.elem && BOSS.weak.includes(el)) && sk.bonus ? sk.bonus : sk.reduce;
          hurt = Math.round(dmgBase * (1 - red)); sub = ST.ice ? `errou e defendeu: corta ${Math.round(red * 100)}% de cada golpe` : `errou e cortou ${Math.round(red * 100)}% do dano${red > sk.reduce ? (sk.holy ? ' (bônus sagrado)' : ` (bônus de ${ELEMENTS[el].name.toLowerCase()})`) : sk.elem ? ' (elemento sem efeito no boss)' : ''}`; }
      } else if (sk.kind === 'dodge') {
        if (ok) { sub = 'acertou, mas esquivou à toa!'; state.rage = Math.min(RAGE_MAX, state.rage + RAGE_WASTED); }
        else { sub = 'errou e esquivou de tudo!'; state.rage = Math.min(RAGE_MAX, state.rage + RAGE_DODGE); }
      }
    }
    if (ST.ice) hurt = 0;   // Hrimgar: o dano vem dos golpes depois das ações
    const col = el ? ELEMENTS[el].color : null;
    showBanner(`${nm}: ${sk ? sk.name : 'sem ação'}${el ? ' · ' + ELEMENTS[el].name : ''}`, sub); await wait(1100);
    if (sk && sk.id === 'guard') { A.play(k, 'guard', {color:'#ff9d3d'}); A.sayRandom(k, 'guard', .6); }
    if (dmg !== 0 || (sk && sk.kind === 'atk' && sk.elem && el && BOSS.immune.includes(el) && (ok || (k === 'guerreiro' && state.buff.bers > 0)))) {
      state.lastEl = el; await doAttack(k, skAnim(k, sk), col, dmg, skSay(k, sk)); state.lastEl = null;
      if (ST.ice && dmg > 0 && state.heroes[k].hp > 0) {
        if (k === 'mage' && el === 'fire') { iceThawAll(); showBanner('FOGO DA MAGA', 'os aliados descongelam e perdem 1 de Frio'); await wait(900); }
        if (state.ice.counter && (k === 'guerreiro' || k === 'tank') && sk.kind === 'atk') { showBanner('CONTRA-ATAQUE!', `${GROUPS[k]} atacou com físico e leva um golpe de volta`); await iceStrike(k, {type:'cut', rank:q.difficulty, anim:'jab'}); hideBanner(); }
      } }   // elemental no boss imune: faz o ataque (efeito visível), dano 0
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
  // ---- 3a) Hrimgar: voleio de golpes em cada herói (1 na fase 1, 2 na fase 2, +1 no Frenesi) e Corte Congelante
  if (ST.ice && !state.over) {
    const I = state.ice;
    if (!volleyDone) {
      const n = (state.phase2 ? 2 : 1) + (I.frenzy ? 1 : 0);
      showBanner('VOLEIO DE LÂMINAS', `${n} golpe${n > 1 ? 's' : ''} em cada herói${I.frenzy ? ' (Frenesi)' : ''}`); await wait(900); hideBanner();
      await iceVolley(n); if (aliveHeroes().length === 0) return endGame(false);
    }
    if (iceEv === 'cut') {
      const al = aliveHeroes().sort(() => Math.random() - .5).slice(0, 2); showBanner('CORTE CONGELANTE', 'a onda de gelo acerta ' + al.map(h => GROUPS[h]).join(' e ')); flashHit(); await wait(900); hideBanner();
      for (const h of al) { await iceStrike(h, {type:'ice', cold:2, rank:q.difficulty, anim:'slashH', fireNegates:true}); if (state.over) break; }
      if (aliveHeroes().length === 0) return endGame(false);
    }
  }
  // ---- 3b) estocada: só quando o Tanque está com Provocação/Proteção; atravessa a guarda e fere um aliado
  { const tankUp = state.heroes.tank.hp > 0; let tt = null, why = '';
    if (ST.ice || state.thrustCd > 0 || dazed) { /* Hrimgar não usa estocada; em recarga ou desnorteado */ }
    else if (!state.over && tankUp && state.buff.taunt > 0) { const al = aliveHeroes().filter(h => h !== 'tank'); tt = al[Math.floor(Math.random() * al.length)] || null; why = 'ignora a Provocação'; }
    else if (!state.over && tankUp && state.guardFor && state.heroes[state.guardFor].hp > 0) { tt = state.guardFor; why = 'ignora a Proteção'; }
    if (tt) {
      state.thrustCd = THRUST_CD;
      const sk = kindOf(tt), dodged = !!sk && sk.kind === 'dodge', red = sk && sk.kind === 'def' ? sk.reduce : 0; let d = Math.round(THRUST_DMG * (1 - red));
      showBanner(ST.thrust.toUpperCase() + '!', `${why}: vai em ${GROUPS[tt]} (ESQUIVA anula, defesa reduz)`); showRing(tt); await wait(700);
      A.play('boss', 'thrust', {tx:HERO_WX(tt), ty:1010}); await Promise.race([A.hit('boss'), wait(3000)]);
      if (dodged) { A.play(tt, 'dodge'); floatText(HERO_X[tt], 56, 'ESQUIVOU!', '#9fe3a8'); }
      else { const m = itemMit(tt, d, true); d = m.d; flashHit(); A.play(tt, 'hurt'); A.sayRandom(tt, 'hurt', .4); state.heroes[tt].hp = Math.max(0, state.heroes[tt].hp - d); floatText(HERO_X[tt], 56, `-${d}${red ? ' (defesa)' : ''}${m.note}`, '#ff6b81'); }
      renderHud(); await wait(900); hideBanner(); hideRing();
      if (aliveHeroes().length === 0) return endGame(false);
    } }
  // ---- 3c) onda sombria: o boss fere todos os heróis vivos a cada rodada (tira a vantagem de só jogar certo)
  { const hardMiss = isHardQ(q) ? HERO_ORDER.filter(k => state.heroes[k].hp > 0 && !correct[k]).length : 0;   // erro em rank S/SS: Onda Sombria +50%
    const aoe = Math.round((meta.aoe + (state.enraged ? ENRAGE_AOE : 0) + (state.phase2 ? PHASE2_AOE : 0)) * (hardMiss ? HARD_MISS_AOE : 1));
    if (aoe && !state.over && !ST.ice) {
      showBanner(ST.aoe.toUpperCase(), `${ST.name}, fere todos: -${aoe}${state.enraged ? ' (enfurecido +' + ENRAGE_AOE + ')' : ''}${state.phase2 ? ' (fase 2 +' + PHASE2_AOE + ')' : ''}${hardMiss ? ' (erro no rank ' + meta.rank + ': +50%)' : ''}`); flashHit(); A.play('boss', 'aoe'); A.sayRandom('boss', 'aoe', .7);
      await Promise.race([A.hit('boss'), wait(2500)]);
      let lostAoe = 0;
      HERO_ORDER.forEach(k => { const h = state.heroes[k]; if (h.hp > 0) { A.play(k, 'hurt', {light:true}); let a = (state.buff.taunt > 0 && k !== 'tank' && state.heroes.tank.hp > 0) ? Math.round(aoe / 2) : aoe; const m = itemMit(k, a, false); a = m.d; lostAoe += Math.min(a, h.hp); h.hp = Math.max(0, h.hp - a); floatText(HERO_X[k], 56, `-${a}${m.note}`, '#b36bff'); } });
      bossLeech(Math.round(lostAoe * AOE_LEECH)); renderHud(); await wait(1100); hideBanner();
      if (aliveHeroes().length === 0) return endGame(false);
    } }

  // ---- 4) fim da rodada: recargas, mana, fúria e duração dos efeitos
  shopTick();
  await itemRoundEnd();
  if (ST.ice) { await iceBleedTick(); iceRoundEnd(); renderHud(); if (aliveHeroes().length === 0) return endGame(false); }
  if (state.bossHp <= 0) return endGame(true);
  if (state.burn > 0) {   // fogo: dano contínuo no boss (0,25x do ataque normal) por 2 perguntas
    const bd = Math.max(1, Math.round(ATTACK_DAMAGE * BURN_MULT)); state.burn--;
    state.bossHp = Math.max(0, state.bossHp - bd); floatText(50, 17, `-${bd}`, '#ff7a2e'); A.play('boss', 'hurt', {light:true}); renderHud(); await wait(900);
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
const RIG_HERO = k => k === 'mage' || k === 'cleriga' || k === 'tank' || k === 'guerreiro';   // têm animação própria com projétil/efeito: o dano só entra no impacto
async function doAttack(k, an, col, dmg, say){
  const cmb = (state.streak && state.streak[k]) || 0; if (cmb >= 3) floatText(HERO_X[k], 50, `COMBO x${cmb}`, '#ffd34d');
  const pl = A.play(k, an, {color:col, combo:cmb}); if (say) A.sayRandom(k, say, .5);
  if (!RIG_HERO(k)) { await wait(an === 'heavy' ? 480 : 300); return heroAttack(k, dmg, col); }
  await Promise.race([A.hit(k), wait(4500)]);
  await heroAttack(k, dmg, col, true);
  await Promise.race([pl, wait(3500)]);
}
async function heroAttack(hero, dmg = ATTACK_DAMAGE, colOverride = null, landed = false, quick = false){
  const hold = quick ? sleep : wait;
  const col = colOverride || HERO_COLOR[hero], game = $('#game');
  if (!landed) {
    await shoot(HERO_X[hero], 61, 50, 24, col);
    const imp = $('#boss-impact'); imp.style.background = `radial-gradient(circle,#fff,${col} 35%,transparent 68%)`;
    imp.classList.remove('active'); void imp.offsetWidth; imp.classList.add('active');
  }
  game.classList.remove('boss-hit'); void game.offsetWidth; game.classList.add('boss-hit');
  if (dmg < 0) { floatText(50, 17, 'ESQUIVOU!', '#b8d8ff'); game.classList.remove('boss-hit'); renderHud(); await hold(600); return; }
  if (dmg <= 0) { floatText(50, 17, 'IMUNE!', '#b8c4d9'); renderHud(); await hold(600); game.classList.remove('boss-hit'); return; }
  if (state.stun) dmg = Math.round(dmg * STUN_MULT);
  if (ST.ice && !state.phase2 && state.lastEl !== 'fire') { dmg = Math.round(dmg * (1 - ICE_ARMOR)); floatText(50, 21, 'ARMADURA -15%', '#9fb8ff'); }
  { const o = itemOff(hero, dmg); dmg = o.d; if (o.note) floatText(HERO_X[hero], 50, o.note, '#ffd34d'); }
  state.bossHp = Math.max(0, state.bossHp - dmg); A.play('boss', 'hurt'); A.sayRandom('boss', 'hurt', .3);
  floatText(50, 17, `-${dmg}`, col === '#d9e6ff' ? '#ffffff' : col);
  renderHud(); await hold(600); game.classList.remove('boss-hit');
}
async function bossCounter(hero, dmg, defended){
  const r = routeHit(hero, dmg), t = r.to;
  if (t !== hero && t === 'tank' && state.heroes.tank.hp > 0) { A.play('tank', 'cover'); A.extra(hero, 'guard'); }   // o Tanque cobre o aliado
  const anim = {1:'slashH', 2:'slashV', 3:'slashH', 4:'summon', 5:'summon'}[state.curQ ? state.curQ.difficulty : 1] || 'slashH';
  if (A.has('boss', anim)) { A.play('boss', anim, {tx:HERO_WX(t), ty:1010}); await Promise.race([A.hit('boss'), wait(3500)]); }
  else await shoot(50, 26, HERO_X[t], 60, '#ff2d4d', 560);
  const m = itemMit(t, r.dmg, true); r.dmg = m.d; r.note += m.note;
  flashHit();
  const lost = Math.min(r.dmg, state.heroes[t].hp);
  state.heroes[t].hp = Math.max(0, state.heroes[t].hp - r.dmg); if (!(defended && t === hero)) A.play(t, 'hurt'); A.sayRandom(t, 'hurt', .35);
  floatText(HERO_X[t], 56, `-${r.dmg}${defended ? ' (defesa)' : ''}${r.note}`, '#ff6b81'); bossLeech(lost);
  renderHud(); await wait(500);
}

const pickAlive = () => { const l = HERO_ORDER.filter(k => state.heroes[k].hp > 0); return l[Math.floor(Math.random() * l.length)] || 'guerreiro'; };
function endGame(win){
  state.over = true; if (state.tsOv) timeResume(); clearTimeout(turnTimer); A.sfx(win ? 'win' : 'lose');
  if (win) { A.play('boss', 'die'); A.sayRandom('boss', 'die', 1); HERO_ORDER.forEach(k => { A.play(k, 'victory'); }); A.sayRandom(pickAlive(), 'win', 1); }
  else { A.play('boss', 'laugh'); A.sayRandom('boss', 'win', 1); }
  const o = $('#end-screen'); o.querySelector('h2').textContent = win ? 'VITÓRIA!' : 'DERROTA';
  o.querySelector('p').textContent = win ? ST.win : 'Todos os heróis caíram.';
  if (win) { try { const d = JSON.parse(localStorage.getItem('bd1_progress')) || {done:[]}; if (!d.done.includes(ST.id)) d.done.push(ST.id); localStorage.setItem('bd1_progress', JSON.stringify(d)); sessionStorage.setItem('bd1_justwon', String(ST.id)); } catch {} }
  $('#to-map').textContent = win ? 'VOLTAR AO MAPA' : 'MAPA';
  { const st = state.stats, R = ['C','B','A','S','SS'], tot = Object.values(st.rank).reduce((a, [r, w]) => [a[0] + r, a[1] + w], [0, 0]), n = tot[0] + tot[1], pct = n ? Math.round(tot[0] / n * 100) : 0, bossPct = Math.max(0, Math.round(state.bossHp / BOSS_MAX_HP * 100));
    $('#end-stats').innerHTML = `<div class="es-row"><span>Rodadas</span><b>${state.round}</b></div><div class="es-row"><span>Seu acerto</span><b>${tot[0]}/${n} (${pct}%)</b></div>` +
      `<div class="es-ranks">${R.map((r, i) => `<div class="es-r d${i + 1}"><em>${r}</em><span>${st.rank[i + 1][0]} / ${st.rank[i + 1][1]}</span></div>`).join('')}</div>` +
      `<div class="es-cap">certas / erradas por rank</div><div class="es-row"><span>Moedas ganhas / gastas</span><b>${st.gained} / ${st.spent}</b></div><div class="es-row"><span>Itens usados</span><b>${st.used}</b></div>` + (win ? '' : `<div class="es-row"><span>Vida restante do boss</span><b>${bossPct}%</b></div>`); }
  o.classList.toggle('win', win);
  const st2 = state.stats, RK = ['C','B','A','S','SS'], t2 = Object.values(st2.rank).reduce((a, [r, w]) => [a[0] + r, a[1] + w], [0, 0]), n2 = t2[0] + t2[1], pc = n2 ? Math.round(t2[0] / n2 * 100) : 0, bp = Math.max(0, Math.round(state.bossHp / BOSS_MAX_HP * 100));
  const pu = paperUI(`<div class="ui-t ${win ? 'win' : 'lose'}">${win ? 'VITÓRIA!' : 'DERROTA'}</div><div class="ui-s">${win ? ST.win : 'Todos caíram. Boss com ' + bp + '% de vida.'}</div>` +
    `<div class="ui-stats"><span>Rodadas <b>${state.round}</b></span><span>Acerto <b>${t2[0]}/${n2} (${pc}%)</b></span><span>Moedas <b>+${st2.gained} / -${st2.spent}</b></span><span>Itens usados <b>${st2.used}</b></span></div>` +
    `<div class="ui-ranks">${RK.map((r, i) => `<div class="r d${i + 1}"><em>${r}</em><span>${st2.rank[i + 1][0]}/${st2.rank[i + 1][1]}</span></div>`).join('')}</div><div class="ui-cap">certas / erradas por rank</div>` +
    `<div class="ui-btns"><button type="button" class="sc-btn" data-act="restart">JOGAR DE NOVO</button><button type="button" class="sc-btn alt" data-act="map">${win ? 'VOLTAR AO MAPA' : 'MAPA'}</button></div>`);
  if (pu) { pu.dataset.kind = 'end'; pu.onclick = e => { const b = e.target.closest('button'); if (b) $(b.dataset.act === 'restart' ? '#restart' : '#to-map').click(); }; o.hidden = true; return; }
  o.hidden = false;
}
// Abertura da batalha (intro.js). Em ?teste=1 fica desligada, a menos que ?intro=1; ?intro=0 sempre desliga.
const INTRO_ON = (new URLSearchParams(location.search).get('intro') || (TEST_MODE ? '0' : '1')) === '1';
const bossCanvas = () => document.querySelector('canvas.hero.boss');
function beginBattle(delay){
  clearTimeout(turnTimer); HERO_ORDER.forEach(k => A.enterPrep(k));   // heróis entram em cena quando a batalha começa
  const go = () => { HERO_ORDER.forEach((k, i) => A.enter(k, i * 200)); turnTimer = setTimeout(playRound, delay + 900); };
  const intro = document.getElementById('intro');
  if (!INTRO_ON || !window.Intro) { if (intro) intro.hidden = true; return go(); }
  const bc = bossCanvas(); if (bc) bc.style.opacity = 0;   // o boss só aparece na fumaça
  const n = groupMembers();
  const IP = ST.ice && window.IntroIce ? window.IntroIce : (window.IntroMalg || Intro), NEW = IP !== Intro;   // abertura cinematográfica do Malgorath (v253); intro.js fica como reserva
  IP.play({voters:n, need:majorityOf(n), bots:TEST_MODE, onReveal:() => { if (window.Cine && NEW) { window.__cinep = Cine.play(); return; } const c = bossCanvas(); if (c) c.style.opacity = ''; A.play('boss', 'tpBack'); }}).then(() => (window.__cinep || Promise.resolve()).then(() => setTimeout(go, 400)));
  if (NEW && intro) intro.hidden = true;   // a nova cria a própria camada preta (já está no DOM)
}
function restartRun(){
  A.reset(); closeTargetPick(); paperUIClose();
  Object.values(state.heroes).forEach(h => { h.hp = HERO_MAX_HP; h.mp = 100; });
  state.stats = newStats(); Object.assign(state, {phase2:false, chestAt:-9, sinceHard:0, bossHp:BOSS_MAX_HP, rage:0, hardNext:false, forceHard:false, over:false, round:0, dazedNext:false, thrustCd:0, teleCd:0, prepNext:false, stun:false, enraged:false, ice:newIce(), curActions:null, lastEl:null});
  HERO_ORDER.forEach(k => { state.cd[k] = {}; state.ultReady[k] = false; state.ultCd[k] = 0; }); state.eco = null;
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
  if (b.dice > 0) { b.dice--; const L = b.diceAff ? [1.5, 2, 3, 4] : [1, 1.5, 2, 3], m = L[Math.floor(Math.random() * L.length)]; d = Math.round(d * m); n.push('DADO ' + String(m).replace('.', ',') + 'x'); }
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
  herb:(b, h, f, t) => { if (ST.ice) state.ice.bleed[t] = null; b.herb = f ? 6 : 4; return `Erva ativa: +8 de HP por rodada, ${b.herb} rodadas.`; },
  lens:(b, h, f, t) => { b.lens = f ? 2 : 1; return `Lente pronta: próximo ataque será crítico (${f ? '2,2' : '1,8'}x).`; },
  tonic:(b, h, f, t) => { b.tonic = f ? 5 : 3; return `Fúria: +25% de dano por ${b.tonic} rodadas.`; },
  powder:(b, h, f, t) => { b.powder = f ? 2 : 1; return `Pólvora pronta: próximo ataque +${f ? 22 : 15}.`; },
  blade:(b, h, f, t) => { b.blade += f ? 15 : 10; return `Lâmina afiada: +${b.blade} de dano permanente.`; },
  lightbomb:(b, h, f, t) => { b.bomb += f ? 60 : 40; return `Bomba armada: explode no fim da rodada (${b.bomb} de dano).`; },
  lucky:(b, h, f, t) => { b.lucky = f ? 5 : 3; b.luckyAmt = f ? 5 : 3; return `Moeda da Sorte: +${b.luckyAmt} moedas por acerto, ${b.lucky} perguntas.`; },
  hourglass:(b, h, f, t) => { state.cd[t] = {}; h.mp = Math.min(100, h.mp + (f ? 40 : 20)); return `Ampulheta: recargas zeradas e +${f ? 40 : 20} de mana.`; },
  elixir:(b, h, f, t) => { if (ST.ice) state.ice.bleed[t] = null; const n = f ? 45 : 30; h.hp = Math.min(HERO_MAX_HP, h.hp + n); h.mp = Math.min(100, h.mp + n); return `Elixir: +${n} de HP e +${n} de mana.`; },
  scroll:(b, h, f, t) => { state.ultReady[t] = true; state.ultCd[t] = 0; const hp = f ? 90 : 60, mp = f ? 100 : 80; h.hp = Math.min(HERO_MAX_HP, h.hp + hp); h.mp = Math.min(100, h.mp + mp); b.tonic = f ? 5 : 3; return `Pergaminho: ULTIMATE carregado, +${hp} de HP, +${mp} de mana e +25% de dano por ${b.tonic} rodadas!`; },
  dice:(b, h, f, t) => { b.dice = f ? 5 : 4; b.diceAff = !!f; return `Dado lançado: próximos ${b.dice} ataques com dano sorteado${f ? ' (de 1,5x a 4x)' : ''}.`; },
  clock:(b, h, f, t, it) => { qExtend(it.secs); return `Relógio: +${it.secs}s para responder a pergunta!`; },
  phoenix:(b, h, f, t) => { h.hp = 100; HERO_ORDER.forEach(k => { if (k !== t && state.heroes[k].hp > 0) state.heroes[k].hp = Math.min(HERO_MAX_HP, state.heroes[k].hp + (f ? 30 : 20)); }); return `Pena de Fênix: seu herói voltou com 100 de HP e os aliados recuperam +${f ? 30 : 20}!`; }
};
function applyItem(index, tgt){
  const type=state.inventory[index];if(!type)return;
  const item=ITEMS[type], hero=state.heroes[tgt], who=tgt===activeGroup?'':` em ${GROUPS[tgt]}`;
  if(item.kind==='fx'){
    if(item.fx==='phoenix'){ if(hero.hp>0){toast(tgt===activeGroup?'A Pena de Fênix só serve para herói caído.':`${GROUPS[tgt]} não está caído.`);return} if(aliveHeroes().length===0){toast('Sem aliados de pé, a Fênix não responde.');return} }
    else if(hero.hp<=0){toast(tgt===activeGroup?'O herói caiu e não pode usar itens.':`${GROUPS[tgt]} caiu e não pode receber itens.`);return}
    if(item.fx==='clock'&&(tgt!==activeGroup||!qExtend||!qExtend(0))){toast('O relógio só vale durante a pergunta, no seu próprio grupo.');return}
    if(item.fx==='elixir'&&hero.hp>=HERO_MAX_HP&&hero.mp>=100){toast('HP e mana já estão cheios.');return}
    if(item.fx==='scroll'&&state.ultReady[tgt]){toast('O Ultimate já está carregado.');return}
    const f=hasAff(type,tgt), msg=FX[item.fx](state.ib[tgt],hero,f,tgt,item)+(f?' (AFINIDADE)':'');state.stats.used++;state.inventory.splice(index,1);persist();renderInventoryHits();renderHud();if(item.fx!=='clock')toast(tgt===activeGroup?msg:`${GROUPS[tgt]} recebeu: ${msg}`);return;
  }
  const max = item.kind==='hp' ? HERO_MAX_HP : 100;
  if(hero.hp<=0 && item.kind==='hp'){toast(tgt===activeGroup?'O herói caiu e não pode ser curado.':`${GROUPS[tgt]} caiu e não pode ser curado.`);return}
  if(hero[item.kind]>=max){toast(item.kind==='hp'?'HP já está cheio.':'Mana já está cheia.');return}
  hero[item.kind]=Math.min(max,hero[item.kind]+item.amount);state.stats.used++;state.inventory.splice(index,1);persist();renderInventoryHits();renderHud();toast(`${item.name} usada${who}.`);
}
function giveable(type){ const it = ITEMS[type]; return it.kind === 'hp' || it.kind === 'mp' || GIVE.has(it.fx); }
function closeTargetPick(){ const p = $('#tgt-pick'); if (p) p.remove(); if ($('#scroll') && $('#scroll').classList.contains('ui') && $('#sc-ui').dataset.kind === 'pick') { paperUIClose(); $('#sc-ui').dataset.kind = ''; } }
function useInventory(index){
  const type=state.inventory[index];if(!type)return;
  const others = HERO_ORDER.filter(k => k !== activeGroup && (type === 'phoenix' ? state.heroes[k].hp <= 0 : state.heroes[k].hp > 0));
  if(!giveable(type) || !others.length){ applyItem(index, activeGroup); return; }
  closeTargetPick();
  const okList = (type === 'phoenix' && state.heroes[activeGroup].hp > 0 ? others : [activeGroup, ...others]);
  const cands = [activeGroup, ...HERO_ORDER.filter(k => k !== activeGroup)];   // todos aparecem; quem nao pode receber fica apagado com o motivo
  const card = k => { const h = state.heroes[k], me = k === activeGroup;
    const no = !okList.includes(k);
    return `<button type="button" class="pk-card${me ? ' me' : ''}${no ? ' off' : ''}"${no ? ' disabled' : ''} data-k="${k}"><span class="pk-n">${me ? 'VOCÊ' : GROUPS[k]}</span><i class="pk-bar"><s style="width:${Math.max(0, h.hp)}%"></s></i><i class="pk-bar m"><s style="width:${Math.max(0, h.mp)}%"></s></i><small>${no ? (h.hp <= 0 ? 'CAÍDO' : 'VIVO') : h.hp <= 0 ? 'CAÍDO' : hasAff(type, k) ? 'AFINIDADE' : 'HP ' + h.hp}</small></button>`; };
  const pu = paperUI(`<div class="ui-t sm">USAR EM QUEM?</div><div class="ui-s"><b>${ITEMS[type].name}</b>: ${ITEMS[type].info || ''}</div><div class="pk">${cands.map(card).join('')}</div><div class="ui-btns"><button type="button" class="sc-btn alt mini" data-x="1">CANCELAR</button></div>`);
  if (pu) { pu.dataset.kind = 'pick'; pu.onclick = e => { const b = e.target.closest('button'); if (!b || b.disabled) return; if (b.dataset.x) { closeTargetPick(); return; } const k = b.dataset.k; closeTargetPick(); applyItem(index, k); }; return; }
  // sem faixa de papiro (tela muito baixa): escolhe automaticamente o próprio herói
  applyItem(index, activeGroup);
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
      let ht = null, held = false;
      b.addEventListener('pointerdown', () => { held = false; clearTimeout(ht); ht = setTimeout(() => { held = true; showInvTip(s.type, b, s.count); }, 380); });
      ['pointerup','pointerleave','pointercancel'].forEach(ev => b.addEventListener(ev, () => clearTimeout(ht)));
      b.addEventListener('contextmenu', e => e.preventDefault());
      b.addEventListener('click', e => { if (held) { held = false; e.stopPropagation(); return; } useInventory(s.idx); })}
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
function setBag(on){ if (!on) { const t = $('#item-tip'); if (t) t.remove(); } $('#bag-panel').hidden = !on; $('#bag-back').hidden = !on; $('#bag-toggle').setAttribute('aria-expanded', on); }
$('#bag-toggle').addEventListener('click', () => { const op = $('#bag-panel').hidden; setBag(op); if (op) merchantOpened(); else mBubble(''); });
$('#bag-back').addEventListener('click', () => { setBag(false); mBubble(''); });
// Loja: tocar no ícone do item mostra a descrição; tocar nas moedas (parte de baixo) tenta comprar.
function closeItemTip(){ const t = $('#item-tip'); if (t) t.remove(); }
function showItemTip(slot){
  const type = state.shop.slots[slot]; if (!type) return;
  const bp = $('#bag-panel'), btn = bp.querySelector('.shop.s' + slot);
  buildItemTip(type, btn, `<span>PREÇO</span><img src="icon_coin.png" alt=""><b>${priceOf(type)}</b><small>toque nas moedas para comprar</small>`);
}
function showInvTip(type, btn, count){   // segurar o item da mochila: mesma ficha do Mercador
  buildItemTip(type, btn, `<span>QTD</span><b>x${count}</b><small>toque rápido para usar</small>`);
}
function buildItemTip(type, btn, foot){
  closeItemTip();
  const it = ITEMS[type], bp = $('#bag-panel'), pr = bp.getBoundingClientRect(), br = btn.getBoundingClientRect();
  const cat = CAT_LABEL[itemCat(type)], aff = (it.aff || []).map(h => GROUPS[h]).join(', ');
  const el = document.createElement('div'); el.id = 'item-tip'; el.className = 'it-tip' + (it.rare ? ' rare' : '');
  el.innerHTML = `<div class="it-top"><div class="it-ico"><img src="${it.icon}" alt=""></div><div class="it-head"><b class="it-name">${it.name}</b><span class="it-tags"><em class="t-${itemCat(type)}">${cat}</em>${it.legend ? '<em class="t-rare">LENDÁRIO</em>' : it.rare ? '<em class="t-rare">RARO</em>' : ''}</span></div></div>` +
    `<p class="it-desc">${itemInfo(type).replace(/^(RARO|LENDÁRIO): /, '').replace(/^./, c => c.toUpperCase())}</p>` + (aff ? `<div class="it-aff">AFINIDADE <b>${aff}</b> +50%</div>` : '') +
    `<div class="it-foot">${foot}</div>`;
  bp.appendChild(el);
  const w = 62, cx = ((br.left + br.width / 2) - pr.left) / pr.width * 100, left = Math.max(2, Math.min(100 - w - 2, cx - w / 2));
  el.style.left = left + 'cqw'; el.style.setProperty('--tx', (cx - left) + 'cqw');
  el.onclick = closeItemTip;
}
$('#bag-panel').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.dataset.action !== 'buy') { if (!e.target.closest('#item-tip')) closeItemTip(); return; }
  const slot = +b.dataset.slot, r = b.getBoundingClientRect(), buyZone = (e.clientY - r.top) / r.height >= .66;
  if (buyZone) { closeItemTip(); requestBuy(slot); } else showItemTip(slot);
});
$('.merchant-vote').addEventListener('click',e=>{const b=e.target.closest('.vote-choice');if(b)vote(b.dataset.vote)});

state.shop = newShop(); renderShop();
buildHud();renderHud();renderGold();renderInventoryHits();updateVoteUI();
$('#restart').addEventListener('click',restartRun);
$('#to-map').addEventListener('click',()=>{LOBBY.leave&&0;location.href='map.html'+location.search});
beginBattle(1500);   // abertura (votável) → boss se materializa → primeira pergunta
// v132: o aviso de nova versão saiu do jogo; a atualização manual fica no menu de seleção de grupo (botão ↻ ATUALIZAR)
if('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'}));

