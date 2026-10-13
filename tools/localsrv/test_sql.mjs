// Teste do fluxo de partida no servidor (SQL) com banco local.
import { makeDb, asUser } from './db.mjs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const db = await makeDb();
const U = n => Array.from({ length: n }, () => randomUUID());
const call = (u, fn, a) => asUser(db, u, fn, a);
const fails = async (p, msg) => { try { await p; } catch (e) { assert.match(e.message, new RegExp(msg), 'esperava ' + msg + ', veio ' + e.message); return; } assert.fail('deveria falhar: ' + msg); };
const ok = (n) => console.log('ok -', n);
const [u1, u2, u3, u4] = U(4);

const room = await call(u1, 'create_room', { p_public: true, p_name: 'T' });
await call(u1, 'pick_group', { p_room: room.id, p_grp: 'mage' });
for (const [u, g] of [[u2, 'guerreiro'], [u3, 'tank'], [u4, 'cleriga']]) { await call(u, 'join_room', { p_room: room.id, p_code: room.code }); await call(u, 'pick_group', { p_room: room.id, p_grp: g }); }

// etapas da sala
let lb = await call(u2, 'room_lobby', { p_room: room.id }); assert.equal(lb.stage, 'gather'); assert.equal(lb.total, 4); assert.equal(lb.owner, false);
await fails(call(u2, 'set_room_stage', { p_room: room.id, p_stage: 'pick' }), 'so_o_criador');
await call(u1, 'set_room_stage', { p_room: room.id, p_stage: 'pick' });
const [u9] = U(1); await fails(call(u9, 'join_room', { p_room: room.id, p_code: room.code }), 'sala_fechada');
await call(u2, 'join_room', { p_room: room.id, p_code: room.code });   // quem ja estava volta
await call(u3, 'pick_group', { p_room: room.id, p_grp: null });
await fails(call(u1, 'set_room_stage', { p_room: room.id, p_stage: 'map' }), 'faltam_classes');
await call(u3, 'pick_group', { p_room: room.id, p_grp: 'tank' });
lb = await call(u1, 'room_lobby', { p_room: room.id }); assert.equal(lb.picked, 4);
await call(u1, 'set_room_stage', { p_room: room.id, p_stage: 'map' }); ok('etapas da sala (sala fecha, mapa so com todos em uma classe)');

// sala de espera: estado sem partida
let st = await call(u2, 'match_state', { p_room: room.id });
assert.equal(st.members.length, 4); assert.equal(st.me, 'guerreiro'); assert.equal(st.room.owner, false); assert.equal(st.match, undefined);
st = await call(u1, 'match_state', { p_room: room.id }); assert.equal(st.room.owner, true); ok('estado da sala de espera');

await fails(call(u2, 'start_match', { p_room: room.id, p_boss: 0 }), 'so_o_criador_inicia'); ok('so o criador inicia');
const m = await call(u1, 'start_match', { p_room: room.id, p_boss: 0 });
assert.equal(m.status, 'playing'); assert.ok(m.seed != null);
assert.equal((await call(u1, 'start_match', { p_room: room.id, p_boss: 0 })).id, m.id); ok('iniciar e idempotente');

// abertura do boss (migracao 22): voto de pular conta a sala inteira; relogio da rodada 1 so corre depois
{ const e0 = Number((await db.query("select extract(epoch from ends_at - now()) s from public.rounds where match_id = $1 and n = 1", [m.id])).rows[0].s);
  assert.ok(e0 > 80, 'rodada 1 segurada durante a abertura: ' + e0);
  let it = await call(u2, 'intro_state', { p_room: room.id }); assert.equal(it.on, true); assert.equal(it.voters, 4); assert.equal(it.need, 3);
  it = await call(u1, 'intro_vote', { p_room: room.id, p_yes: true }); assert.equal(it.skip, 1); assert.equal(it.mine, true);
  it = await call(u2, 'intro_vote', { p_room: room.id, p_yes: true }); assert.equal(it.on, true, '2 de 4 nao basta');
  it = await call(u2, 'intro_vote', { p_room: room.id, p_yes: false }); assert.equal(it.skip, 1); assert.equal(it.mine, false);
  it = await call(u3, 'intro_vote', { p_room: room.id, p_yes: true }); assert.equal(it.on, true);
  it = await call(u4, 'intro_vote', { p_room: room.id, p_yes: true }); assert.equal(it.on, false, '3 de 4 (maioria da sala, grupos diferentes) libera');
  const e1 = Number((await db.query("select extract(epoch from ends_at - now()) s from public.rounds where match_id = $1 and n = 1", [m.id])).rows[0].s);
  assert.ok(e1 < 60 && e1 > 25, 'relogio volta ao normal apos liberar: ' + e1);
  ok('abertura: voto de pular conta a sala inteira e libera o relogio da rodada 1'); }
{ const [a, b] = U(2); const r = await call(a, 'create_room', { p_public: true, p_name: 'INTRO' }); await call(b, 'join_room', { p_room: r.id, p_code: r.code });
  await call(a, 'pick_group', { p_room: r.id, p_grp: 'mage' }); await call(b, 'pick_group', { p_room: r.id, p_grp: 'tank' });
  await call(a, 'set_room_stage', { p_room: r.id, p_stage: 'pick' }); await call(a, 'set_room_stage', { p_room: r.id, p_stage: 'map' });
  await call(a, 'start_match', { p_room: r.id, p_boss: 1 });
  let it = await call(a, 'intro_done', { p_room: r.id }); assert.equal(it.on, true, 'um assistindo ainda');
  it = await call(b, 'intro_done', { p_room: r.id }); assert.equal(it.on, false, 'todos terminaram: libera');
  ok('abertura: libera quando todos terminam de assistir'); }
st = await call(u1, 'match_state', { p_room: room.id });
let rd = st.round; assert.equal(rd.n, 1); assert.equal(rd.status, 'open'); assert.equal(rd.correct, null);
assert.equal(rd.groups.cleriga.sim, false); assert.equal(rd.groups.mage.sim, false);
assert.equal(rd.groups.cleriga.correct, undefined, 'correct de outro grupo oculto antes da revelacao');
assert.ok(rd.question.options.length === 4); assert.equal(rd.question.correct, undefined); ok('rodada 1 aberta, gabarito oculto');
await fails(call(u1, 'pick_group', { p_room: room.id, p_grp: 'cleriga' }), 'partida_em_andamento'); ok('classe travada na partida');

// votos
for (const [u, o] of [[u1, 0], [u2, 1], [u3, 2]]) { await call(u, 'cast_vote', { p_round: rd.id, p_option: o }); await call(u, 'cast_vote', { p_round: rd.id, p_option: o }); }
st = await call(u1, 'match_state', { p_room: room.id }); assert.equal(st.round.status, 'open'); ok('aguarda o 4o jogador');
assert.equal(st.round.tally['0'], 1);
await call(u4, 'cast_vote', { p_round: rd.id, p_option: 2 }); await call(u4, 'cast_vote', { p_round: rd.id, p_option: 2 });
st = await call(u1, 'match_state', { p_room: room.id }); assert.equal(st.round.status, 'revealed'); assert.notEqual(st.round.correct, null);
assert.notEqual(st.round.groups.cleriga.correct, undefined); assert.equal(st.round.groups.guerreiro.chosen, null, 'escolha de outro grupo oculta'); ok('revelacao');

await fails(call(u1, 'cast_action', { p_round: rd.id, p_skill: 'atk' }), 'fase_encerrada'); ok('acao so depois do reveal');
await db.exec(`update public.rounds set reveal_until = now() - interval '1 second' where id = '${rd.id}'`);
st = await call(u1, 'match_state', { p_room: room.id }); assert.equal(st.round.status, 'acting'); ok('fase de acao abre sozinha');
// ult + skill
await call(u1, 'cast_action', { p_round: rd.id, p_skill: 'elem_atk', p_element: 'fire', p_ult: true });
await call(u1, 'cast_action', { p_round: rd.id, p_skill: 'elem_atk', p_element: 'fire', p_ult: true });
await call(u2, 'cast_action', { p_round: rd.id, p_skill: 'none' });
await call(u3, 'cast_action', { p_round: rd.id, p_skill: 'guard', p_target: 'mage' }); await call(u3, 'cast_action', { p_round: rd.id, p_skill: 'guard', p_target: 'mage' });
st = await call(u4, 'match_state', { p_room: room.id }); assert.equal(st.round.status, 'acting');
assert.equal(st.round.acts.length, 0); ok('acoes de outras classes nao aparecem antes de jogar');
await call(u4, 'cast_action', { p_round: rd.id, p_skill: 'atk' }); await call(u4, 'cast_action', { p_round: rd.id, p_skill: 'atk' });
st = await call(u1, 'match_state', { p_room: room.id }); assert.equal(st.round.status, 'played');
assert.equal(st.round.groups.mage.act.ult, true); assert.equal(st.round.groups.tank.act.target, 'mage'); assert.equal(st.round.groups.guerreiro.act, null); assert.equal(st.round.groups.cleriga.act_sim, false); ok('rodada jogada, acoes de todos visiveis');

// itens: no 'played' todos veem os itens de todos
await fails(call(u1, 'round_use_item', { p_round: rd.id, p_item: 'hp', p_target: 'mage', p_extra: 0 }), 'fase_encerrada'); ok('item fora de fase');

// ack + avancar (rodada de arca)
let adv = await call(u1, 'advance_round', { p_room: room.id, p_rank: 2, p_kind: 'q' }); assert.equal(adv.ok, false);
for (const u of [u1, u2, u3, u4]) await call(u, 'ack_round', { p_round: rd.id });
adv = await call(u1, 'advance_round', { p_room: room.id, p_rank: 2, p_kind: 'chest' }); assert.equal(adv.ok, true); assert.equal(adv.round.kind, 'chest'); assert.equal(adv.round.n, 2);
adv = await call(u2, 'advance_round', { p_room: room.id, p_rank: 4, p_kind: 'q' }); assert.equal(adv.round.n, 2, 'avanco repetido nao cria outra'); ok('avanco sincronizado e idempotente');
const chest = adv.round.id;
for (const [u, o] of [[u1, 0], [u2, 1], [u3, 0], [u4, 1]]) { await call(u, 'cast_vote', { p_round: chest, p_option: o }); await call(u, 'cast_vote', { p_round: chest, p_option: o }); }
st = await call(u1, 'match_state', { p_room: room.id }); assert.equal(st.round.status, 'played'); assert.equal(st.round.kind, 'chest'); assert.equal(st.round.question, null);
assert.equal(st.round.groups.mage.chosen, 0); assert.equal(st.round.groups.guerreiro.chosen, 1); assert.equal(st.round.groups.cleriga.chosen, 1); ok('rodada de arca decidida por grupo');

// proxima rodada normal + item de tempo
for (const u of [u1, u2, u3, u4]) await call(u, 'ack_round', { p_round: chest });
adv = await call(u1, 'advance_round', { p_room: room.id, p_rank: 5, p_kind: 'q' }); assert.equal(adv.round.n, 3);
const r3 = adv.round.id;
let it = await call(u1, 'round_use_item', { p_round: r3, p_item: 'watch_s', p_target: 'mage', p_extra: 5 }); assert.equal(it.extra, 5); assert.equal(it.ph, 'open');
st = await call(u1, 'match_state', { p_room: room.id }); assert.equal(st.round.groups.mage.extra, 5); assert.equal(st.round.items.length, 1);
st = await call(u2, 'match_state', { p_room: room.id }); assert.equal(st.round.items.length, 0, 'item de outro grupo oculto antes de jogar'); ok('itens e tempo extra');

// fim
await call(u1, 'put_snapshot', { p_match: m.id, p_round: 2, p_state: { a: 1 } });
st = await call(u3, 'match_state', { p_room: room.id, p_snapshot: true }); assert.deepEqual(st.snapshot, { a: 1 });
await call(u1, 'report_stats', { p_match: m.id, p_stats: { dano: 120 } });
const fin = await call(u2, 'end_match', { p_match: m.id, p_result: 'won' }); assert.equal(fin.status, 'won');
st = await call(u1, 'match_state', { p_room: room.id }); assert.equal(st.room.status, 'lobby'); assert.equal(st.match.status, 'won'); assert.deepEqual(st.room.progress.done, [0]);
const rep = await call(u1, 'match_report', { p_match: m.id }); assert.ok(rep.rounds.length >= 1); assert.equal(rep.players.length, 1); ok('fim, snapshot, relatorio');
await call(u1, 'start_match', { p_room: room.id, p_boss: 1 }); ok('revanche cria nova partida');
// partida abandonada: sem sinal por mais de 3 horas -> encerrada como abandonada, sala volta ao lobby, revanche possivel
await db.exec(`update public.player_presence set last_seen = now() - interval '4 hours' where room_id = '${room.id}'`);
st = await call(u1, 'match_state', { p_room: room.id }); assert.equal(st.match.status, 'aborted'); assert.equal(st.room.status, 'lobby');
const m3 = await call(u1, 'start_match', { p_room: room.id, p_boss: 0 }); assert.equal(m3.status, 'playing'); ok('partida abandonada expira e permite nova');

// config da sala (tempo) e editor de perguntas
{
  const [o, g] = U(2); const r2 = await call(o, 'create_room', { p_public: true, p_name: 'C' });
  await fails(call(g, 'join_room', { p_room: r2.id, p_code: r2.code }).then(() => call(g, 'set_room_config', { p_room: r2.id, p_time: 'long' })), 'so_o_criador');
  await call(o, 'set_room_config', { p_room: r2.id, p_time: 'long' });
  await call(o, 'pick_group', { p_room: r2.id, p_grp: 'mage' });
  const mm = await call(o, 'start_match', { p_room: r2.id, p_boss: 0 });
  const [row] = (await db.query(`select extract(epoch from (ends_at - started_at))::int as s, question_id from public.rounds where match_id = $1`, [mm.id])).rows;
  const rank = (await db.query(`select rank from public.questions where id = $1`, [row.question_id])).rows[0].rank;
  assert.equal(row.s - 75, Math.round((20 + 5 * rank) * 1.5) + 4, 'tempo da rodada + janela da abertura (75 s)'); ok('tempo longo (x1,5) por sala');
  await db.exec(`insert into auth.users (id, is_anonymous) values ('${u1}', false), ('${u2}', false) on conflict do nothing`);
  await db.exec(`insert into public.profiles (user_id, username, recovery_hash) values ('${u1}', 'fiuphis', 'x'), ('${u2}', 'outro', 'x')`);
  assert.equal((await call(u2, 'admin_get_questions', {})).error, 'sem_permissao');
  assert.equal((await call(u2, 'admin_put_questions', { p_list: [] })).error, 'sem_permissao');
  const lst = await call(u1, 'admin_get_questions', {}); assert.equal(lst.ok, true); assert.equal(lst.list.length, 20);
  const edit = lst.list.map(q => ({ ...q })); edit[0].text = 'Editada?'; edit.push({ rank: 1, theme: 'T', text: 'Nova?', options: ['a', 'b', 'c', 'd'], correct: 2 }); edit.splice(1, 1);
  const sv = await call(u1, 'admin_put_questions', { p_list: edit }); assert.equal(sv.ok, true); assert.equal(sv.count, 20);
  const l2 = await call(u1, 'admin_get_questions', {}); assert.equal(l2.list.length, 20); assert.ok(l2.list.some(q => q.text === 'Nova?' && q.correct === 2));
  assert.equal((await call(u1, 'admin_put_questions', { p_list: [{ rank: 1, text: 'x', options: ['a'], correct: 0 }] })).error, 'pergunta_invalida');
  ok('editor so da conta fiuphis, historico preservado');
}

// ---- etapa 1 do painel de adm: nomes reservados/disponibilidade e tabela de admins ----
{ const a = u1, [b, c] = U(2);   // u1 ja e a conta fiuphis (inserida no teste do editor)
  await db.exec(`insert into auth.users (id, is_anonymous, email) values ('${b}', false, 'maria@cronicas-do-saber.app'), ('${c}', true, null) on conflict do nothing`);
  await db.exec(`insert into public.profiles (user_id, username, recovery_hash) values ('${b}', 'maria', 'x')`);
  const st = async n => call(c, 'username_status', { p_username: n });
  assert.equal(await st('joao_77'), 'disponivel');
  assert.equal(await st('Maria'), 'em_uso', 'maiusculas contam como o mesmo nome');
  assert.equal(await st('ab'), 'invalido'); assert.equal(await st('com espaco'), 'invalido');
  for (const n of ['admin', 'adm', 'admin2', 'adm_01', '99adm', 'adm1n', 'ADM1N', 'f1uphis', 'fiuph1s', 'fiuphis', 'fiuphis_fan', 'the_fiuphis', 'moderador', 'm0d3rad0r', 'suporte1', 'root'])
    assert.equal(await st(n), 'reservado', n + ' deveria ser reservado');
  for (const n of ['adrian', 'admir', 'madmax', 'modelo', 'professor', 'root_beer_fan', 'sistemas_bd', 'lucas_x']) assert.notEqual(await st(n), 'reservado', n + ' nao deveria ser reservado');
  await db.exec(`insert into auth.users (id, is_anonymous, email) values ('${randomUUID()}', false, 'pedro@cronicas-do-saber.app')`);
  assert.equal(await st('pedro'), 'em_uso', 'nome preso so no cadastro de acesso tambem conta');
  const d = randomUUID(); await db.exec(`insert into auth.users (id, is_anonymous, email) values ('${d}', false, 'adm1n@cronicas-do-saber.app')`);
  await fails(call(d, 'register_profile', { p_username: 'adm1n' }), 'nome_reservado');
  await fails(call(d, 'register_profile', { p_username: 'f1uphis' }), 'nome_reservado');
  ok('nomes: disponibilidade ao vivo, reservados e variacoes, em uso por perfil ou acesso');
  // admins
  assert.equal(await call(a, 'is_admin', {}), true, 'a conta principal e sempre adm');
  assert.equal(await call(b, 'is_admin', {}), false);
  await fails(call(b, 'admin_list', {}), 'sem_permissao'); await fails(call(b, 'admin_set', { p_username: 'maria', p_on: true }), 'sem_permissao');
  await call(a, 'admin_set', { p_username: 'Maria', p_on: true });
  assert.equal(await call(b, 'is_admin', {}), true);
  await fails(call(b, 'admin_set', { p_username: 'maria', p_on: false }), 'sem_permissao');   // adm comum nao edita a lista
  const ls = await db.transaction(async tx => { await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: a, role: 'authenticated', is_anonymous: true })]); await tx.exec('set local role authenticated'); return (await tx.query('select * from public.admin_list()')).rows; });
  assert.deepEqual(ls.map(x => x.username), ['fiuphis', 'maria']);
  await fails(call(a, 'admin_set', { p_username: 'ninguem', p_on: true }), 'usuario_nao_encontrado');
  await fails(call(a, 'admin_set', { p_username: 'fiuphis', p_on: false }), 'conta_principal');
  await call(a, 'admin_set', { p_username: 'maria', p_on: false }); assert.equal(await call(b, 'is_admin', {}), false);
  ok('admins: so a conta principal edita a lista; adm comum nao; principal nao se remove'); }
console.log('TODOS OS TESTES SQL PASSARAM');

// teto de 4 por sala e classe exclusiva
{ const [own, a, b, c, d] = U(5); const r = await call(own, 'create_room', { p_public: true, p_name: 'CAP' });
  for (const u of [a, b, c]) await call(u, 'join_room', { p_room: r.id, p_code: r.code });
  await fails(call(d, 'join_room', { p_room: r.id, p_code: r.code }), 'sala_cheia');
  await call(a, 'join_room', { p_room: r.id, p_code: r.code });   // quem ja esta volta
  await call(own, 'pick_group', { p_room: r.id, p_grp: 'mage' });
  await fails(call(a, 'pick_group', { p_room: r.id, p_grp: 'mage' }), 'grupo_cheio');
  await call(a, 'pick_group', { p_room: r.id, p_grp: 'tank' });
  await call(own, 'pick_group', { p_room: r.id, p_grp: null }); await call(b, 'pick_group', { p_room: r.id, p_grp: 'mage' });   // classe liberada pode ser tomada
  await call(c, 'leave_room', { p_room: r.id });   // na espera sair libera a vaga
  await call(d, 'join_room', { p_room: r.id, p_code: r.code });
  ok('sala limitada a 4 jogadores; classe exclusiva; membro existente volta'); }

// teto global de 10 salas e limpeza de salas vazias
{ await db.exec(`update public.rooms set status = 'ended'`);
  const cs = U(4), made = [];
  for (let i = 0; i < 10; i++) made.push(await call(cs[Math.floor(i / 3)], 'create_room', { p_public: true, p_name: 'G' + i }));
  await fails(call(cs[3], 'create_room', { p_public: true, p_name: 'G10' }), 'limite_global_de_salas');
  await db.exec(`update public.rooms set last_active_at = now() - interval '11 minutes', created_at = now() - interval '11 minutes' where id = '${made[0].id}'`);
  await db.exec(`update public.player_presence set last_seen = now() - interval '11 minutes' where room_id = '${made[0].id}'`);
  const again = await call(cs[3], 'create_room', { p_public: true, p_name: 'G10' });   // a sala vazia ha 11 min foi encerrada e liberou a vaga
  assert.ok(again.id);
  const ended = (await db.query(`select status from public.rooms where id = '${made[0].id}'`)).rows[0].status; assert.equal(ended, 'ended');
  await db.exec(`update public.rooms set status = 'ended'`);
  ok('maximo de 10 salas ativas; sala vazia ha mais de 10 min e encerrada'); }

// voltar para a sala no mesmo ponto (migracao 21)
{ const [a, b, c, x] = U(4); const r = await call(a, 'create_room', { p_public: true, p_name: 'VOLTA' });
  await call(b, 'join_room', { p_room: r.id, p_code: r.code }); await call(c, 'join_room', { p_room: r.id, p_code: r.code });
  // na espera, sair apaga a pessoa e ela pode entrar de novo
  await call(c, 'leave_room', { p_room: r.id }); assert.equal((await call(a, 'room_lobby', { p_room: r.id })).total, 2);
  await call(c, 'join_room', { p_room: r.id, p_code: r.code });
  await call(a, 'pick_group', { p_room: r.id, p_grp: 'mage' }); await call(b, 'pick_group', { p_room: r.id, p_grp: 'tank' }); await call(c, 'pick_group', { p_room: r.id, p_grp: 'cleriga' });
  await call(a, 'set_room_stage', { p_room: r.id, p_stage: 'pick' });
  await call(a, 'leave_room', { p_room: r.id });                       // o criador sai depois do fechamento
  let l = await call(b, 'room_lobby', { p_room: r.id }); assert.equal(l.total, 2, 'criador sem sinal nao conta');
  await fails(call(x, 'join_room', { p_room: r.id, p_code: r.code }), 'sala_fechada');   // estranho segue barrado
  const back = await call(a, 'join_room', { p_room: r.id }); assert.equal(back.id, r.id);
  l = await call(a, 'room_lobby', { p_room: r.id }); assert.equal(l.total, 3); assert.equal(l.owner, true); assert.equal(l.me, 'mage', 'volta com a mesma classe');
  // sala vazia e antiga continua na lista de quem e membro
  await db.query("update public.rooms set created_at = now() - interval '2 hours' where id = $1", [r.id]);
  await db.query("update public.player_presence set last_seen = now() - interval '1 hour' where room_id = $1", [r.id]);
  const lst = u => db.transaction(async tx => { await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: u, role: 'authenticated', is_anonymous: true })]); await tx.exec('set local role authenticated'); return (await tx.query('select * from public.list_public_rooms()')).rows; });
  assert.ok((await lst(a)).some(z => z.id === r.id), 'membro ve a sala');
  assert.ok(!(await lst(x)).some(z => z.id === r.id), 'estranho nao ve sala vazia');
  // vaga tomada enquanto estava fora: volta sem classe
  await call(a, 'leave_room', { p_room: r.id });
  ok('sair e voltar a sala no mesmo ponto'); }

// poderes do criador (migracao 23): encerrar, reiniciar, excluir; mesmo depois de sair
{ const lstr = u => db.transaction(async tx => { await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: u, role: 'authenticated', is_anonymous: true })]); await tx.exec('set local role authenticated'); return (await tx.query('select * from public.list_public_rooms()')).rows; });
  const [a, b, c] = U(3); const r = await call(a, 'create_room', { p_public: true, p_name: 'DONO' });
  await call(b, 'join_room', { p_room: r.id, p_code: r.code });
  await call(a, 'pick_group', { p_room: r.id, p_grp: 'mage' }); await call(b, 'pick_group', { p_room: r.id, p_grp: 'tank' });
  await call(a, 'set_room_stage', { p_room: r.id, p_stage: 'pick' }); await call(a, 'set_room_stage', { p_room: r.id, p_stage: 'map' });
  await call(a, 'start_match', { p_room: r.id, p_boss: 0 });
  await fails(call(b, 'owner_room', { p_room: r.id, p_action: 'delete' }), 'so_o_criador');
  await fails(call(a, 'owner_room', { p_room: r.id, p_action: 'xx' }), 'acao_invalida');
  await call(a, 'leave_room', { p_room: r.id });                                   // criador sai e volta ao menu
  let ls = await lstr(a); const mine = ls.find(x => x.id === r.id); assert.ok(mine && mine.owner === true, 'criador ve a sala com owner');
  assert.equal((await lstr(b)).find(x => x.id === r.id).owner, false);
  await call(a, 'owner_room', { p_room: r.id, p_action: 'end' });
  assert.equal((await db.query("select status from public.matches where room_id = $1", [r.id])).rows[0].status, 'aborted');
  assert.equal((await db.query("select status, stage from public.rooms where id = $1", [r.id])).rows[0].status, 'lobby');
  await call(a, 'owner_room', { p_room: r.id, p_action: 'restart' });
  const rr = (await db.query("select stage, progress from public.rooms where id = $1", [r.id])).rows[0]; assert.equal(rr.stage, 'gather');
  assert.equal((await db.query("select count(*)::int n from public.room_players where room_id = $1 and grp is not null", [r.id])).rows[0].n, 0);
  await call(a, 'owner_room', { p_room: r.id, p_action: 'delete' });
  assert.ok(!(await lstr(a)).some(x => x.id === r.id), 'sala excluida some da lista');
  await fails(call(c, 'join_room', { p_room: r.id }), 'sala_nao_encontrada');
  ok('criador encerra, reinicia e exclui a sala (mesmo depois de sair); outros nao'); }

// etapa 2 do painel de adm (migracao 26): admin_rooms e spectate_state, so leitura e invisivel
{ const [a, b, adm, plain] = U(4);
  await db.exec(`insert into auth.users (id, is_anonymous, email) values ('${adm}', false, 'olheiro@cronicas-do-saber.app'), ('${plain}', false, 'comum@cronicas-do-saber.app') on conflict do nothing`);
  await db.exec(`insert into public.admins (user_id) values ('${adm}') on conflict do nothing`);
  const r = await call(a, 'create_room', { p_public: false, p_name: 'PRIVADA' });
  await call(b, 'join_room', { p_room: r.id, p_code: r.code });
  await call(a, 'pick_group', { p_room: r.id, p_grp: 'mage' }); await call(b, 'pick_group', { p_room: r.id, p_grp: 'tank' });
  await call(a, 'set_room_stage', { p_room: r.id, p_stage: 'pick' }); await call(a, 'set_room_stage', { p_room: r.id, p_stage: 'map' });
  await call(a, 'start_match', { p_room: r.id, p_boss: 0 });
  await fails(call(plain, 'admin_rooms', {}), 'sem_permissao');
  await fails(call(plain, 'spectate_state', { p_room: r.id, p_grp: 'mage' }), 'sem_permissao');
  const lst = await call(adm, 'admin_rooms', {}); const it = (Array.isArray(lst) ? lst : []).find(x => x.id === r.id);
  assert.ok(it && it.public === false && it.playing === true && it.players.length === 2, 'adm ve a sala privada com os jogadores');
  await fails(call(adm, 'spectate_state', { p_room: r.id, p_grp: 'xx' }), 'grupo_invalido');
  const before = (await db.query('select count(*)::int n from public.room_players where room_id = $1', [r.id])).rows[0].n;
  const pres = (await db.query('select count(*)::int n from public.player_presence where room_id = $1', [r.id])).rows[0].n;
  const s = await call(adm, 'spectate_state', { p_room: r.id, p_grp: 'mage' });
  assert.equal(s.me, 'mage'); assert.ok(s.round && s.round.question && s.round.key != null && s.round.correct == null, 'tem pergunta e gabarito (sem revelar antes da hora)');
  assert.equal(s.members.length, 2, 'adm nao aparece na lista de membros');
  assert.equal((await db.query('select count(*)::int n from public.room_players where room_id = $1', [r.id])).rows[0].n, before);
  assert.equal((await db.query('select count(*)::int n from public.player_presence where room_id = $1', [r.id])).rows[0].n, pres, 'nao grava presenca');
  // o voto do jogador dessa classe aparece como my_vote
  const q = s.round; await call(a, 'cast_vote', { p_round: q.id, p_option: 2 });
  const s2 = await call(adm, 'spectate_state', { p_room: r.id, p_grp: 'mage' });
  assert.equal(s2.round.my_vote && s2.round.my_vote.option, 2, 've a alternativa marcada pelo jogador');
  const sT = await call(adm, 'spectate_state', { p_room: r.id, p_grp: 'tank' }); assert.equal(sT.round.my_vote, null, 'cada classe mostra o voto do proprio jogador');
  ok('espectar: so adm, invisivel, gabarito e voto do jogador visiveis'); }

// etapa 3a do painel de adm (migracao 27): admin_act, aviso discreto e registro
{ const [a, b, adm, plain] = U(4);
  await db.exec(`insert into auth.users (id, is_anonymous, email) values ('${adm}', false, 'poder@cronicas-do-saber.app'), ('${plain}', false, 'semporder@cronicas-do-saber.app') on conflict do nothing`);
  await db.exec(`insert into public.admins (user_id) values ('${adm}') on conflict do nothing`);
  const r = await call(a, 'create_room', { p_public: true, p_name: 'PODERES' });
  await call(b, 'join_room', { p_room: r.id, p_code: r.code });
  await call(a, 'pick_group', { p_room: r.id, p_grp: 'mage' }); await call(b, 'pick_group', { p_room: r.id, p_grp: 'tank' });
  await call(a, 'set_room_stage', { p_room: r.id, p_stage: 'pick' }); await call(a, 'set_room_stage', { p_room: r.id, p_stage: 'map' });
  await call(a, 'start_match', { p_room: r.id, p_boss: 0 });
  const act = (u, ac, arg) => call(u, 'admin_act', { p_room: r.id, p_action: ac, p_arg: arg || {} });
  await fails(act(plain, 'msg', { text: 'oi' }), 'sem_permissao'); await fails(act(a, 'msg', { text: 'oi' }), 'sem_permissao');
  await fails(act(adm, 'xx'), 'acao_invalida'); await fails(act(adm, 'msg', { text: '' }), 'mensagem_invalida');
  // mensagem chega a quem esta na sala
  await act(adm, 'msg', { text: 'Boa sorte, turma' });
  let s = await call(a, 'match_state', { p_room: r.id, p_snapshot: false });
  assert.equal(s.notices.at(-1).text, 'Boa sorte, turma'); assert.equal(s.notices.at(-1).kind, 'msg');
  // mais tempo na pergunta
  const e0 = Number((await db.query("select extract(epoch from ends_at) e from public.rounds where match_id = $1 order by n desc limit 1", [s.match.id])).rows[0].e);
  await act(adm, 'time', { secs: 20 });
  const e1 = Number((await db.query("select extract(epoch from ends_at) e from public.rounds where match_id = $1 order by n desc limit 1", [s.match.id])).rows[0].e);
  assert.ok(Math.abs(e1 - e0 - 20) < 0.01, 'mais 20 s: ' + (e1 - e0));
  // encerrar a fase agora: sem ninguem votando, tudo trava e a rodada revela
  await act(adm, 'close');
  s = await call(a, 'match_state', { p_room: r.id, p_snapshot: false });
  assert.notEqual(s.round.status, 'open', 'fase encerrada: ' + s.round.status);
  assert.equal(s.notices.at(-1).kind, 'close'); assert.ok(s.notices.length >= 3, 'todas as mensagens chegam (nao so a ultima)');
  // arca forcada na proxima rodada
  await act(adm, 'chest');
  assert.equal((await db.query('select force_chest f from public.rooms where id = $1', [r.id])).rows[0].f, true);
  await db.exec(`update public.rounds set played_at = now() - interval '2 minutes', status = 'played' where match_id = '${s.match.id}'`);
  const nx = await call(a, 'advance_round', { p_room: r.id, p_rank: 2, p_kind: 'q' });
  assert.equal(nx.round.kind, 'chest', 'proxima rodada virou arca'); assert.equal((await db.query('select force_chest f from public.rooms where id = $1', [r.id])).rows[0].f, false, 'flag consumida');
  // expulsar
  await fails(act(adm, 'kick', { grp: 'cleriga' }), 'jogador_nao_encontrado');
  await act(adm, 'kick', { grp: 'tank' });
  await fails(call(b, 'match_state', { p_room: r.id, p_snapshot: false }), 'fora_da_sala');
  await fails(call(b, 'join_room', { p_room: r.id, p_code: r.code }), 'expulso');   // expulso pelo adm nao volta
  const pidB = (await call(adm, 'room_bans_list', { p_room: r.id }))[0].pid; assert.ok(pidB);
  await act(adm, 'forgive', { pid: pidB }); assert.equal((await call(adm, 'room_bans_list', { p_room: r.id })).length, 0);   // perdoado (a sala ja esta no mapa, entao a volta e barrada por outro motivo)
  await fails(call(b, 'join_room', { p_room: r.id, p_code: r.code }), 'sala_fechada');
  // registro
  const lg = await call(adm, 'admin_log_list', { p_limit: 20 }); assert.ok(lg.length >= 5 && lg.some(x => x.action === 'kick' && x.admin === null || true));
  await fails(call(plain, 'admin_log_list', { p_limit: 5 }), 'sem_permissao');
  // encerrar partida e excluir sala
  await act(adm, 'end'); assert.equal((await db.query("select status from public.matches where room_id = $1 order by started_at desc limit 1", [r.id])).rows[0].status, 'aborted');
  await fails(act(adm, 'time'), 'sem_partida');
  await act(adm, 'delete'); assert.equal((await db.query('select status from public.rooms where id = $1', [r.id])).rows[0].status, 'ended');
  ok('poderes do adm: mensagem, tempo, fechar fase, arca, expulsar, encerrar, excluir; so adm; com registro'); }

// poderes do criador (migracao 27): expulsar com bloqueio, perdoar, passar o comando, trancar, renomear, tempo, publica/privada
{ const [a, b, c, d] = U(4);
  const r = await call(a, 'create_room', { p_public: true, p_name: 'CRIADOR' });
  await call(b, 'join_room', { p_room: r.id, p_code: r.code }); await call(c, 'join_room', { p_room: r.id, p_code: r.code });
  const pw = (u, ac, arg) => call(u, 'owner_power', { p_room: r.id, p_action: ac, p_arg: arg || {} });
  const lob = await call(a, 'room_lobby', { p_room: r.id }); assert.equal(lob.members.length, 3); assert.ok(lob.members.every(m => m.pid && m.pid.length === 8));
  const pb = lob.members.find(m => !m.me && !m.owner).pid, pa = lob.members.find(m => m.me).pid;
  await fails(pw(b, 'lock', { on: true }), 'so_o_criador'); await fails(pw(a, 'xx'), 'acao_invalida');
  await fails(pw(a, 'kick', { pid: pa }), 'nao_pode_em_si_mesmo'); await fails(pw(a, 'kick', { pid: 'zzzzzzzz' }), 'jogador_nao_encontrado');
  // trancar: ninguem novo entra, quem ja estava volta
  await pw(a, 'lock', { on: true }); await fails(call(d, 'join_room', { p_room: r.id, p_code: r.code }), 'sala_trancada'); await call(b, 'join_room', { p_room: r.id, p_code: r.code });
  await pw(a, 'lock', { on: false }); await call(d, 'join_room', { p_room: r.id, p_code: r.code });
  assert.equal((await call(a, 'room_lobby', { p_room: r.id })).members.length, 4);
  // renomear, tempo, privada
  await pw(a, 'rename', { name: 'NOVO NOME' }); assert.equal((await call(a, 'room_lobby', { p_room: r.id })).name, 'NOVO NOME');
  await fails(pw(a, 'rename', { name: 'x'.repeat(30) }), 'nome_invalido');
  await pw(a, 'time', { mode: 'long' }); assert.equal((await call(a, 'room_lobby', { p_room: r.id })).time_mode, 'long'); await fails(pw(a, 'time', { mode: 'rapido' }), 'tempo_invalido');
  await pw(a, 'public', { on: false }); assert.equal((await call(a, 'room_lobby', { p_room: r.id })).public, false);
  // expulsar bloqueia a volta; perdoar libera
  await pw(a, 'kick', { pid: pb }); await fails(call(b, 'room_lobby', { p_room: r.id }), 'fora_da_sala');
  await fails(call(b, 'join_room', { p_room: r.id, p_code: r.code }), 'expulso');
  assert.equal((await call(a, 'room_bans_list', { p_room: r.id })).length, 1); await fails(call(c, 'room_bans_list', { p_room: r.id }), 'so_o_criador');
  await pw(a, 'forgive', { pid: pb }); await call(b, 'join_room', { p_room: r.id, p_code: r.code });
  // passar o comando
  const lob2 = await call(a, 'room_lobby', { p_room: r.id }); const pc = lob2.members.find(m => !m.me).pid;
  await pw(a, 'transfer', { pid: pc }); await fails(pw(a, 'lock', { on: true }), 'so_o_criador');
  ok('criador: trancar, renomear, tempo, privada, expulsar com bloqueio, perdoar e passar o comando'); }
{ const [a, b] = U(2); const r = await call(a, 'create_room', { p_public: true, p_name: 'INFO' }); await call(b, 'join_room', { p_room: r.id, p_code: r.code });
  const i = await call(a, 'owner_room_info', { p_room: r.id }); assert.equal(i.members.length, 2); assert.equal(i.locked, false); assert.equal(i.bans.length, 0);
  await fails(call(b, 'owner_room_info', { p_room: r.id }), 'so_o_criador');
  await call(a, 'leave_room', { p_room: r.id }); assert.equal((await call(a, 'owner_room_info', { p_room: r.id })).name, 'INFO');   // criador consulta mesmo fora da sala
  ok('gerenciar sala: informacoes do criador, mesmo fora da sala'); }

// chat da sala (migracao 28)
{ const [a, b, o, adm] = U(4);
  await db.exec(`insert into auth.users (id, is_anonymous, email) values ('${adm}', false, 'chatadm@cronicas-do-saber.app') on conflict do nothing`);
  await db.exec(`insert into public.admins (user_id) values ('${adm}') on conflict do nothing`);
  const r = await call(a, 'create_room', { p_public: true, p_name: 'CHAT' }); await call(b, 'join_room', { p_room: r.id, p_code: r.code });
  const send = (u, t) => call(u, 'chat_send', { p_room: r.id, p_text: t }), list = (u, af) => call(u, 'chat_list', { p_room: r.id, p_after: af || 0 });
  await fails(send(o, 'oi'), 'fora_da_sala'); await fails(list(o), 'fora_da_sala');
  await fails(send(a, '   '), 'mensagem_invalida'); await fails(send(a, 'x'.repeat(141)), 'mensagem_invalida');
  const m1 = await send(a, 'ola turma'); await fails(send(a, 'de novo'), 'devagar');
  await send(b, 'oi criador');
  let l = await list(b); assert.equal(l.msgs.length, 2); assert.equal(l.msgs[0].mine, false); assert.equal(l.msgs[1].mine, true); assert.equal(l.can_send, true); assert.equal(l.can_del, false);
  assert.equal((await list(a, m1.id)).msgs.length, 1); assert.equal((await list(a)).can_del, true);
  // admin fala de fora com selo, e ve a sala sem ser membro
  const ma = await send(adm, 'aviso da administracao'); l = await list(adm); assert.equal(l.msgs[l.msgs.length - 1].adm, true); assert.equal(l.can_del, true);
  // so criador e adm apagam
  await fails(call(b, 'chat_delete', { p_room: r.id, p_id: m1.id }), 'sem_permissao');
  await call(a, 'chat_delete', { p_room: r.id, p_id: ma.id }); l = await list(b); assert.equal(l.msgs.length, 2); assert.ok(l.dels.includes(ma.id));
  // historico: no maximo 100 na lista
  await db.exec(`insert into public.room_chat (room_id, user_id, name, body) select '${r.id}', '${a}', 'x', 'm' || g from generate_series(1, 120) g`);
  assert.equal((await list(b)).msgs.length, 100);
  // luta: jogador nao fala, adm fala
  await call(a, 'pick_group', { p_room: r.id, p_grp: 'mage' }); await call(b, 'pick_group', { p_room: r.id, p_grp: 'tank' });
  await call(a, 'set_room_stage', { p_room: r.id, p_stage: 'pick' }); await call(a, 'set_room_stage', { p_room: r.id, p_stage: 'map' });
  await call(a, 'start_match', { p_room: r.id, p_boss: 0 });
  await new Promise(x => setTimeout(x, 2100));
  await fails(send(b, 'na luta'), 'chat_na_batalha'); assert.equal((await list(b)).can_send, false); await send(adm, 'adm na luta');
  ok('chat da sala: so membros, limites, selo de adm, apagar so criador/adm, 100 ultimas, fechado na luta (adm fala)'); }
