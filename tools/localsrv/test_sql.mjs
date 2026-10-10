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
for (const [u, g] of [[u2, 'guerreiro'], [u3, 'tank'], [u4, 'tank']]) { await call(u, 'join_room', { p_room: room.id, p_code: room.code }); await call(u, 'pick_group', { p_room: room.id, p_grp: g }); }

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

st = await call(u1, 'match_state', { p_room: room.id });
let rd = st.round; assert.equal(rd.n, 1); assert.equal(rd.status, 'open'); assert.equal(rd.correct, null);
assert.equal(rd.groups.cleriga.sim, true); assert.equal(rd.groups.mage.sim, false);
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
assert.equal(st.round.acts.length, 1); assert.equal(st.round.acts[0].skill, 'guard'); ok('tally de acoes so do proprio grupo');
await call(u4, 'cast_action', { p_round: rd.id, p_skill: 'guard', p_target: 'mage' }); await call(u4, 'cast_action', { p_round: rd.id, p_skill: 'guard', p_target: 'mage' });
st = await call(u1, 'match_state', { p_room: room.id }); assert.equal(st.round.status, 'played');
assert.equal(st.round.groups.mage.act.ult, true); assert.equal(st.round.groups.tank.act.target, 'mage'); assert.equal(st.round.groups.guerreiro.act, null); assert.equal(st.round.groups.cleriga.act_sim, true); ok('rodada jogada, acoes de todos visiveis');

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
  assert.equal(row.s, Math.round((20 + 5 * rank) * 1.5) + 4); ok('tempo longo (x1,5) por sala');
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
console.log('TODOS OS TESTES SQL PASSARAM');

// teto de 28 por sala
{ const [own, ...ps] = U(31); const r = await call(own, 'create_room', { p_public: true, p_name: 'CAP' });
  for (let i = 0; i < 27; i++) await call(ps[i], 'join_room', { p_room: r.id, p_code: r.code });
  await fails(call(ps[27], 'join_room', { p_room: r.id, p_code: r.code }), 'sala_cheia');
  await call(ps[0], 'join_room', { p_room: r.id, p_code: r.code });   // quem ja esta volta
  await call(ps[0], 'leave_room', { p_room: r.id }).catch(() => {});
  ok('sala limitada a 28 jogadores; membro existente volta'); }
