-- Etapa 1b: rodada de arca, ultimate na acao, semente da partida e leitura unica do estado (match_state).

alter table public.matches add column seed bigint not null default (floor(random() * 2147483647))::bigint;
alter table public.rounds add column kind text not null default 'q' check (kind in ('q','chest'));
alter table public.rounds alter column question_id drop not null;
alter table public.act_votes add column ult boolean not null default false,
  add column ult_target text check (ult_target in ('mage','guerreiro','tank','cleriga'));

-- (as versoes antigas cast_action de 4 argumentos, _new_round de 3 e advance_round de 2 ficam sem permissao no fim deste arquivo; podem ser apagadas depois no SQL Editor)

create or replace function public._pick_action(p_round uuid, p_grp text) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare nconf int; res jsonb;
begin
  select count(*) into nconf from public.act_votes where round_id = p_round and grp = p_grp and confirmed and skill <> 'none';
  with t as (
    select skill, element, target, ult, ult_target, count(*) n from public.act_votes
    where round_id = p_round and grp = p_grp and skill <> 'none' and (nconf = 0 or confirmed)
    group by 1, 2, 3, 4, 5),
  m as (select max(n) mx from t)
  select jsonb_build_object('skill', t.skill, 'element', t.element, 'target', t.target, 'ult', t.ult, 'ult_target', t.ult_target) into res
  from t, m where t.n = m.mx order by random() limit 1;
  return res;
end $$;

create function public._new_round(p_room uuid, p_match uuid, p_rank int, p_kind text) returns public.rounds language plpgsql security definer set search_path = '' as
$$
declare rk int; q uuid; n int; rd public.rounds; g text;
begin
  if p_kind = 'chest' then
    q := null; rk := null;
  else
    rk := coalesce(p_rank, public._roll_rank());
    if rk not between 1 and 5 then raise exception 'rank_invalido'; end if;
    select id into q from public.questions
      where rank = rk and id not in (select question_id from public.rounds where room_id = p_room and question_id is not null) order by random() limit 1;
    if q is null then select id into q from public.questions where rank = rk order by random() limit 1; end if;
    if q is null then select id into q from public.questions order by random() limit 1; end if;
    if q is null then raise exception 'sem_perguntas'; end if;
  end if;
  select coalesce(max(r.n), 0) + 1 into n from public.rounds r where r.room_id = p_room;
  insert into public.rounds (room_id, match_id, n, question_id, kind, ends_at)
    values (p_room, p_match, n, q, case when p_kind = 'chest' then 'chest' else 'q' end, now() + interval '25 seconds') returning * into rd;
  foreach g in array array['mage','guerreiro','tank','cleriga'] loop
    if public._active_in_group(p_room, g) > 0 then
      insert into public.round_groups (round_id, grp) values (rd.id, g);
    else
      insert into public.round_groups (round_id, grp, locked, sim) values (rd.id, g, true, true);
    end if;
  end loop;
  update public.rooms set status = 'battle', last_active_at = now() where id = p_room;
  return rd;
end $$;

create or replace function public._try_close(p_round uuid) returns void language plpgsql security definer set search_path = '' as
$$
declare rd public.rounds; g record; due boolean; n_active int; n_conf int; k smallint;
begin
  select * into rd from public.rounds where id = p_round for update;
  if not found then return; end if;

  if rd.status = 'open' then
    for g in select * from public.round_groups where round_id = p_round and not locked loop
      n_active := public._active_in_group(rd.room_id, g.grp);
      select count(*) into n_conf from public.round_votes rv join public.player_presence pp on pp.room_id = rd.room_id and pp.user_id = rv.user_id
        where rv.round_id = p_round and rv.grp = g.grp and rv.confirmed and pp.last_seen > now() - interval '45 seconds';
      due := now() >= rd.ends_at + g.extra_secs * interval '1 second';
      if n_active = 0 then
        update public.round_groups set locked = true, sim = true where round_id = p_round and grp = g.grp;
      elsif due or n_conf >= n_active then
        update public.round_groups set locked = true, chosen = public._pick_option(p_round, g.grp) where round_id = p_round and grp = g.grp;
      end if;
    end loop;
    if not exists (select 1 from public.round_groups where round_id = p_round and not locked) then
      if rd.kind = 'chest' then
        -- arca: 0 = abrir, 1 = ignorar (grupo sem voto ou simulado ignora); sem fase de acao
        update public.round_groups set correct = null, chosen = case when sim then 1 else coalesce(chosen, 1) end, act_locked = true, act_sim = true where round_id = p_round;
        update public.rounds set status = 'played', played_at = now() where id = p_round;
        return;
      end if;
      select correct into k from public.question_keys where question_id = rd.question_id;
      update public.round_groups set correct = case when sim then random() < .6 else (chosen is not null and chosen = k) end,
        act_locked = sim, act_sim = sim
        where round_id = p_round;
      update public.rounds set status = 'revealed', correct_option = k, reveal_until = now() + interval '4 seconds' where id = p_round;
      select * into rd from public.rounds where id = p_round;
    end if;
  end if;

  if rd.status = 'revealed' and now() >= rd.reveal_until then
    update public.rounds set status = 'acting', act_ends_at = now() + interval '25 seconds' where id = p_round;
    select * into rd from public.rounds where id = p_round;
  end if;

  if rd.status = 'acting' then
    for g in select * from public.round_groups where round_id = p_round and not act_locked loop
      n_active := public._active_in_group(rd.room_id, g.grp);
      select count(*) into n_conf from public.act_votes av join public.player_presence pp on pp.room_id = rd.room_id and pp.user_id = av.user_id
        where av.round_id = p_round and av.grp = g.grp and av.confirmed and pp.last_seen > now() - interval '45 seconds';
      due := now() >= rd.act_ends_at;
      if n_active = 0 then
        update public.round_groups set act_locked = true, act_sim = true where round_id = p_round and grp = g.grp;
      elsif due or n_conf >= n_active then
        update public.round_groups set act_locked = true, act = public._pick_action(p_round, g.grp) where round_id = p_round and grp = g.grp;
      end if;
    end loop;
    if not exists (select 1 from public.round_groups where round_id = p_round and not act_locked) then
      update public.rounds set status = 'played', played_at = now() where id = p_round;
    end if;
  end if;
end $$;

create or replace function public.cast_vote(p_round uuid, p_option integer) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); rd public.rounds; g text; nopt int; v public.round_votes; locked_ boolean;
begin
  select * into rd from public.rounds where id = p_round for update;
  if not found or not public.is_member(rd.room_id) then raise exception 'fora_da_sala'; end if;
  g := public.my_group(rd.room_id);
  if g is null then raise exception 'sem_grupo'; end if;
  if rd.status <> 'open' or now() >= rd.ends_at + coalesce((select extra_secs from public.round_groups where round_id = p_round and grp = g), 0) * interval '1 second'
    then raise exception 'rodada_encerrada'; end if;
  select locked into locked_ from public.round_groups where round_id = p_round and grp = g;
  if locked_ is null then raise exception 'grupo_fora_da_rodada'; end if;
  if locked_ then raise exception 'grupo_travado'; end if;
  if rd.kind = 'chest' then nopt := 2; else select jsonb_array_length(options) into nopt from public.questions where id = rd.question_id; end if;
  if p_option is null or p_option < 0 or p_option >= nopt then raise exception 'alternativa_invalida'; end if;
  select * into v from public.round_votes where round_id = p_round and user_id = uid;
  if not found then
    insert into public.round_votes (round_id, user_id, grp, option) values (p_round, uid, g, p_option);
  elsif v.confirmed then
    null;
  elsif v.option = p_option then
    update public.round_votes set confirmed = true, updated_at = now() where round_id = p_round and user_id = uid;
  else
    update public.round_votes set option = p_option, updated_at = now() where round_id = p_round and user_id = uid;
  end if;
  update public.player_presence set last_seen = now() where room_id = rd.room_id and user_id = uid;
  perform public._try_close(p_round);
  select * into v from public.round_votes where round_id = p_round and user_id = uid;
  return jsonb_build_object('option', v.option, 'confirmed', v.confirmed);
end $$;

create function public.cast_action(p_round uuid, p_skill text, p_element text default null, p_target text default null, p_ult boolean default false, p_ult_target text default null) returns jsonb
language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); rd public.rounds; g text; rg public.round_groups; v public.act_votes; ult_ boolean := coalesce(p_ult, false);
begin
  select * into rd from public.rounds where id = p_round for update;
  if not found or not public.is_member(rd.room_id) then raise exception 'fora_da_sala'; end if;
  g := public.my_group(rd.room_id);
  if g is null then raise exception 'sem_grupo'; end if;
  perform public._try_close(p_round);
  select * into rd from public.rounds where id = p_round;
  if rd.status <> 'acting' or now() >= rd.act_ends_at then raise exception 'fase_encerrada'; end if;
  select * into rg from public.round_groups where round_id = p_round and grp = g;
  if not found then raise exception 'grupo_fora_da_rodada'; end if;
  if rg.act_locked then raise exception 'grupo_travado'; end if;
  if p_skill is null or p_skill !~ '^[a-z0-9_]{1,24}$' then raise exception 'acao_invalida'; end if;
  if p_element is not null and p_element not in ('fire','water','air','earth') then raise exception 'elemento_invalido'; end if;
  if p_target is not null and p_target not in ('mage','guerreiro','tank','cleriga') then raise exception 'alvo_invalido'; end if;
  if p_ult_target is not null and p_ult_target not in ('mage','guerreiro','tank','cleriga') then raise exception 'alvo_invalido'; end if;
  if not ult_ then p_ult_target := null; end if;
  select * into v from public.act_votes where round_id = p_round and user_id = uid;
  if p_skill = 'none' then
    insert into public.act_votes (round_id, user_id, grp, skill, confirmed) values (p_round, uid, g, 'none', true)
      on conflict (round_id, user_id) do update set skill = 'none', element = null, target = null, ult = false, ult_target = null, confirmed = true, updated_at = now();
  elsif not found then
    insert into public.act_votes (round_id, user_id, grp, skill, element, target, ult, ult_target) values (p_round, uid, g, p_skill, p_element, p_target, ult_, p_ult_target);
  elsif v.confirmed then
    null;
  elsif v.skill = p_skill and v.element is not distinct from p_element and v.target is not distinct from p_target and v.ult = ult_ and v.ult_target is not distinct from p_ult_target then
    update public.act_votes set confirmed = true, updated_at = now() where round_id = p_round and user_id = uid;
  else
    update public.act_votes set skill = p_skill, element = p_element, target = p_target, ult = ult_, ult_target = p_ult_target, updated_at = now() where round_id = p_round and user_id = uid;
  end if;
  update public.player_presence set last_seen = now() where room_id = rd.room_id and user_id = uid;
  perform public._try_close(p_round);
  select * into v from public.act_votes where round_id = p_round and user_id = uid;
  return jsonb_build_object('skill', v.skill, 'element', v.element, 'target', v.target, 'ult', v.ult, 'ult_target', v.ult_target, 'confirmed', v.confirmed);
end $$;

create or replace function public.start_match(p_room uuid, p_boss int default 0) returns public.matches language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); m public.matches;
begin
  perform 1 from public.rooms where id = p_room for update;
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  if not exists (select 1 from public.rooms where id = p_room and created_by = uid) then raise exception 'so_o_criador_inicia'; end if;
  select * into m from public.matches where room_id = p_room and status = 'playing';
  if found then return m; end if;
  if p_boss is null or p_boss < 0 or p_boss > 9 then raise exception 'boss_invalido'; end if;
  if (select count(*) from public.room_players rp join public.player_presence pp using (room_id, user_id)
      where rp.room_id = p_room and rp.grp is not null and pp.last_seen > now() - interval '45 seconds') = 0
    then raise exception 'sem_jogadores'; end if;
  update public.player_presence set last_seen = now() where room_id = p_room and user_id = uid;
  insert into public.matches (room_id, boss, started_by) values (p_room, p_boss, uid) returning * into m;
  perform public._new_round(p_room, m.id, null, 'q');
  update public.rooms set boss_idx = p_boss where id = p_room;
  return m;
end $$;

create function public.advance_round(p_room uuid, p_rank int default null, p_kind text default 'q') returns jsonb language plpgsql security definer set search_path = '' as
$$
declare m public.matches; rd public.rounds; a int; k int; nr public.rounds;
begin
  perform 1 from public.rooms where id = p_room for update;
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  select * into m from public.matches where room_id = p_room and status = 'playing';
  if not found then raise exception 'sem_partida'; end if;
  select * into rd from public.rounds where match_id = m.id order by n desc limit 1;
  perform public._try_close(rd.id);
  select * into rd from public.rounds where id = rd.id;
  if rd.status = 'played' then
    select count(*) into a from public.room_players rp join public.player_presence pp using (room_id, user_id)
      where rp.room_id = p_room and rp.grp is not null and pp.last_seen > now() - interval '45 seconds';
    select count(*) into k from public.round_acks ak join public.room_players rp on rp.room_id = p_room and rp.user_id = ak.user_id
      join public.player_presence pp on pp.room_id = p_room and pp.user_id = ak.user_id
      where ak.round_id = rd.id and rp.grp is not null and pp.last_seen > now() - interval '45 seconds';
    if k >= a or now() >= rd.played_at + interval '60 seconds' then
      nr := public._new_round(p_room, m.id, p_rank, p_kind);
      return jsonb_build_object('ok', true, 'round', to_jsonb(nr));
    end if;
    return jsonb_build_object('ok', false, 'wait', true, 'acks', k, 'need', a);
  end if;
  return jsonb_build_object('ok', true, 'round', to_jsonb(rd));
end $$;

-- Leitura unica do estado da sala/partida/rodada para o cliente (respeita o que cada grupo pode ver).
create function public.match_state(p_room uuid, p_snapshot boolean default false) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; m public.matches; rd public.rounds; me text; res jsonb := '{}'::jsonb;
  members_ jsonb; counts_ jsonb; round_ jsonb; vis boolean; groups_ jsonb; q jsonb; my_vote jsonb; my_act jsonb; tally jsonb; acts jsonb; items_ jsonb; acks_ int; prev_ jsonb;
begin
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  select * into r from public.rooms where id = p_room;
  me := public.my_group(p_room);
  update public.player_presence set last_seen = now() where room_id = p_room and user_id = uid;
  select * into m from public.matches where room_id = p_room order by started_at desc limit 1;
  if found and m.status = 'playing' then
    select * into rd from public.rounds where match_id = m.id order by n desc limit 1;
    if found then perform public._try_close(rd.id); end if;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('grp', rp.grp, 'me', rp.user_id = uid, 'owner', rp.user_id = r.created_by,
      'name', (select p.username from public.profiles p where p.user_id = rp.user_id),
      'active', coalesce(pp.last_seen > now() - interval '45 seconds', false)) order by rp.joined_at), '[]'::jsonb)
    into members_ from public.room_players rp left join public.player_presence pp on pp.room_id = rp.room_id and pp.user_id = rp.user_id where rp.room_id = p_room;

  res := jsonb_build_object('now', floor(extract(epoch from clock_timestamp()) * 1000)::bigint,
    'room', jsonb_build_object('id', r.id, 'code', r.code, 'name', r.name, 'status', r.status, 'boss_idx', r.boss_idx, 'progress', r.progress, 'owner', r.created_by = uid),
    'me', me, 'members', members_);

  if m.id is not null then
    res := res || jsonb_build_object('match', jsonb_build_object('id', m.id, 'status', m.status, 'boss', m.boss, 'seed', m.seed, 'started_at', m.started_at, 'ended_at', m.ended_at, 'snapshot_round', m.snapshot_round));
    if p_snapshot then res := res || jsonb_build_object('snapshot', m.snapshot); end if;
    select * into rd from public.rounds where match_id = m.id order by n desc limit 1;
    if found then
      vis := rd.status <> 'open';
      select coalesce(jsonb_object_agg(rg.grp, jsonb_build_object('sim', rg.sim, 'locked', rg.locked, 'act_locked', rg.act_locked, 'act_sim', rg.act_sim, 'extra', rg.extra_secs)
          || case when rg.grp = me or vis then jsonb_build_object('correct', rg.correct, 'chosen', case when rg.grp = me or rd.kind = 'chest' then rg.chosen else null end, 'act', rg.act) else '{}'::jsonb end), '{}'::jsonb)
        into groups_ from public.round_groups rg where rg.round_id = rd.id;
      if rd.question_id is not null then
        select jsonb_build_object('id', qq.id, 'text', qq.text, 'options', qq.options, 'rank', qq.rank) into q from public.questions qq where qq.id = rd.question_id;
      end if;
      select jsonb_build_object('option', v.option, 'confirmed', v.confirmed) into my_vote from public.round_votes v where v.round_id = rd.id and v.user_id = uid;
      select jsonb_build_object('skill', v.skill, 'element', v.element, 'target', v.target, 'ult', v.ult, 'ult_target', v.ult_target, 'confirmed', v.confirmed) into my_act from public.act_votes v where v.round_id = rd.id and v.user_id = uid;
      select coalesce(jsonb_object_agg(o::text, n), '{}'::jsonb) into tally from (select v.option o, count(*) n from public.round_votes v where v.round_id = rd.id and v.grp = me group by 1) t;
      select coalesce(jsonb_agg(jsonb_build_object('skill', skill, 'element', element, 'target', target, 'ult', ult, 'ult_target', ult_target, 'n', n)), '[]'::jsonb)
        into acts from (select skill, element, target, ult, ult_target, count(*) n from public.act_votes v where v.round_id = rd.id and v.grp = me and skill <> 'none' group by 1, 2, 3, 4, 5) t;
      select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'grp', i.grp, 'item', i.item) order by i.id), '[]'::jsonb) into items_
        from public.round_items i where i.round_id = rd.id and (rd.status = 'played' or i.grp = me);
      select count(*) into acks_ from public.round_acks where round_id = rd.id;
      round_ := jsonb_build_object('id', rd.id, 'n', rd.n, 'kind', rd.kind, 'status', rd.status, 'question', q,
        'ends_at', floor(extract(epoch from rd.ends_at) * 1000)::bigint,
        'reveal_until', floor(extract(epoch from rd.reveal_until) * 1000)::bigint,
        'act_ends_at', floor(extract(epoch from rd.act_ends_at) * 1000)::bigint,
        'correct', case when vis then rd.correct_option else null end,
        'groups', groups_, 'my_vote', my_vote, 'my_act', my_act, 'tally', tally, 'acts', acts, 'items', items_, 'acks', acks_);
      res := res || jsonb_build_object('round', round_);
    end if;
  end if;
  return res;
end $$;

do $$ declare f text; begin
  foreach f in array array['cast_action(uuid,text,text,text,boolean,text)','advance_round(uuid,int,text)','match_state(uuid,boolean)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  revoke all on function public._new_round(uuid, uuid, int, text) from public, anon, authenticated;
  revoke all on function public.cast_action(uuid, text, text, text) from public, anon, authenticated;
  revoke all on function public._new_round(uuid, uuid, int) from public, anon, authenticated;
  revoke all on function public.advance_round(uuid, int) from public, anon, authenticated;
end $$;
