-- Etapa 1: partida no servidor (modelo "lockstep": o servidor decide as ENTRADAS de cada rodada --
-- pergunta, acerto de cada grupo, acao de cada grupo, itens, semente do sorteio -- e todos os aparelhos
-- calculam o mesmo resultado com o mesmo codigo de combate).

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  boss smallint not null default 0,
  status text not null default 'playing' check (status in ('playing','won','lost','aborted')),
  started_by uuid not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  snapshot jsonb,
  snapshot_round int
);
create unique index matches_one_playing on public.matches(room_id) where status = 'playing';
create index matches_room on public.matches(room_id, started_at desc);

alter table public.rounds
  add column match_id uuid references public.matches(id) on delete cascade,
  add column seed bigint not null default (floor(random() * 2147483647))::bigint,
  add column reveal_until timestamptz,
  add column act_ends_at timestamptz,
  add column played_at timestamptz;
alter table public.rounds drop constraint rounds_status_check;
alter table public.rounds add constraint rounds_status_check check (status in ('open','revealed','acting','played'));

alter table public.round_groups
  add column sim boolean not null default false,
  add column act_locked boolean not null default false,
  add column act_sim boolean not null default false,
  add column act jsonb,
  add column extra_secs int not null default 0;

create table public.act_votes (
  round_id uuid not null references public.rounds(id) on delete cascade,
  user_id uuid not null,
  grp text not null check (grp in ('mage','guerreiro','tank','cleriga')),
  skill text not null check (skill ~ '^[a-z0-9_]{1,24}$'),
  element text check (element in ('fire','water','air','earth')),
  target text check (target in ('mage','guerreiro','tank','cleriga')),
  confirmed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (round_id, user_id)
);

create table public.round_items (
  id bigserial primary key,
  round_id uuid not null references public.rounds(id) on delete cascade,
  user_id uuid not null,
  grp text not null check (grp in ('mage','guerreiro','tank','cleriga')),
  item text not null check (item ~ '^[a-z0-9_]{1,24}$'),
  at timestamptz not null default now()
);
create index round_items_round on public.round_items(round_id, id);

create table public.round_acks (
  round_id uuid not null references public.rounds(id) on delete cascade,
  user_id uuid not null,
  at timestamptz not null default now(),
  primary key (round_id, user_id)
);

create table public.match_stats (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null,
  grp text,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

alter table public.matches enable row level security;
alter table public.act_votes enable row level security;
alter table public.round_items enable row level security;
alter table public.round_acks enable row level security;
alter table public.match_stats enable row level security;

create function public.match_room(p_match uuid) returns uuid language sql stable security definer set search_path = '' as
$$ select room_id from public.matches where id = p_match $$;

create policy matches_read on public.matches for select using (public.is_member(room_id));
create policy av_read on public.act_votes for select
  using (public.is_member(public.round_room(round_id)) and grp = public.my_group(public.round_room(round_id)));
create policy ri_read on public.round_items for select
  using (public.is_member(public.round_room(round_id)) and grp = public.my_group(public.round_room(round_id)));
create policy ms_read on public.match_stats for select using (public.is_member(public.match_room(match_id)));
-- round_acks: sem leitura direta

alter publication supabase_realtime add table public.matches, public.act_votes, public.round_items;

-- ---------------------------------------------------------------- utilitarios
-- pesos de app.js RANK_W: rank1 .30, rank2 .30, rank3 .25, rank4 .10, rank5 .05
create function public._roll_rank() returns int language plpgsql volatile set search_path = '' as
$$ declare r double precision := random(); begin
  return case when r < .30 then 1 when r < .60 then 2 when r < .85 then 3 when r < .95 then 4 else 5 end;
end $$;

create function public._active_in_group(p_room uuid, p_grp text) returns int language sql stable security definer set search_path = '' as
$$ select count(*)::int from public.room_players rp join public.player_presence pp using (room_id, user_id)
   where rp.room_id = p_room and rp.grp = p_grp and pp.last_seen > now() - interval '45 seconds' $$;

create function public._pick_action(p_round uuid, p_grp text) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare nconf int; res jsonb;
begin
  select count(*) into nconf from public.act_votes where round_id = p_round and grp = p_grp and confirmed and skill <> 'none';
  with t as (
    select skill, element, target, count(*) n from public.act_votes
    where round_id = p_round and grp = p_grp and skill <> 'none' and (nconf = 0 or confirmed)
    group by 1, 2, 3),
  m as (select max(n) mx from t)
  select jsonb_build_object('skill', t.skill, 'element', t.element, 'target', t.target) into res
  from t, m where t.n = m.mx order by random() limit 1;
  return res;
end $$;

-- ---------------------------------------------------------------- criacao de rodada
create function public._new_round(p_room uuid, p_match uuid, p_rank int) returns public.rounds language plpgsql security definer set search_path = '' as
$$
declare rk int; q uuid; n int; rd public.rounds; g text;
begin
  rk := coalesce(p_rank, public._roll_rank());
  if rk not between 1 and 5 then raise exception 'rank_invalido'; end if;
  select id into q from public.questions
    where rank = rk and id not in (select question_id from public.rounds where room_id = p_room) order by random() limit 1;
  if q is null then select id into q from public.questions where rank = rk order by random() limit 1; end if;
  if q is null then select id into q from public.questions order by random() limit 1; end if;
  if q is null then raise exception 'sem_perguntas'; end if;
  select coalesce(max(r.n), 0) + 1 into n from public.rounds r where r.room_id = p_room;
  insert into public.rounds (room_id, match_id, n, question_id, ends_at)
    values (p_room, p_match, n, q, now() + interval '25 seconds') returning * into rd;
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

-- ---------------------------------------------------------------- maquina de fases
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

-- ---------------------------------------------------------------- partida
create function public.start_match(p_room uuid, p_boss int default 0) returns public.matches language plpgsql security definer set search_path = '' as
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
  perform public._new_round(p_room, m.id, null);
  update public.rooms set boss_idx = p_boss where id = p_room;
  return m;
end $$;

create function public.cast_action(p_round uuid, p_skill text, p_element text default null, p_target text default null) returns jsonb
language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); rd public.rounds; g text; rg public.round_groups; v public.act_votes;
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
  select * into v from public.act_votes where round_id = p_round and user_id = uid;
  if p_skill = 'none' then
    insert into public.act_votes (round_id, user_id, grp, skill, confirmed) values (p_round, uid, g, 'none', true)
      on conflict (round_id, user_id) do update set skill = 'none', element = null, target = null, confirmed = true, updated_at = now();
  elsif not found then
    insert into public.act_votes (round_id, user_id, grp, skill, element, target) values (p_round, uid, g, p_skill, p_element, p_target);
  elsif v.confirmed then
    null;
  elsif v.skill = p_skill and v.element is not distinct from p_element and v.target is not distinct from p_target then
    update public.act_votes set confirmed = true, updated_at = now() where round_id = p_round and user_id = uid;
  else
    update public.act_votes set skill = p_skill, element = p_element, target = p_target, updated_at = now() where round_id = p_round and user_id = uid;
  end if;
  update public.player_presence set last_seen = now() where room_id = rd.room_id and user_id = uid;
  perform public._try_close(p_round);
  select * into v from public.act_votes where round_id = p_round and user_id = uid;
  return jsonb_build_object('skill', v.skill, 'element', v.element, 'target', v.target, 'confirmed', v.confirmed);
end $$;

create function public.use_item(p_round uuid, p_item text, p_extra int default 0) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); rd public.rounds; g text; rg public.round_groups; n int; ex int := 0;
begin
  select * into rd from public.rounds where id = p_round for update;
  if not found or not public.is_member(rd.room_id) then raise exception 'fora_da_sala'; end if;
  g := public.my_group(rd.room_id);
  if g is null then raise exception 'sem_grupo'; end if;
  if p_item is null or p_item !~ '^[a-z0-9_]{1,24}$' then raise exception 'item_invalido'; end if;
  if rd.status not in ('open','revealed','acting') then raise exception 'fase_encerrada'; end if;
  select * into rg from public.round_groups where round_id = p_round and grp = g;
  if not found then raise exception 'grupo_fora_da_rodada'; end if;
  select count(*) into n from public.round_items where round_id = p_round and user_id = uid;
  if n >= 8 then raise exception 'limite_de_itens'; end if;
  if coalesce(p_extra, 0) > 0 then
    if rd.status <> 'open' or rg.locked then raise exception 'tempo_encerrado'; end if;
    ex := least(p_extra, 15, 45 - rg.extra_secs);
    if ex > 0 then update public.round_groups set extra_secs = extra_secs + ex where round_id = p_round and grp = g; end if;
  end if;
  insert into public.round_items (round_id, user_id, grp, item) values (p_round, uid, g, p_item);
  return jsonb_build_object('extra', ex, 'extra_total', rg.extra_secs + ex);
end $$;

create function public.ack_round(p_round uuid) returns void language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); rd public.rounds;
begin
  select * into rd from public.rounds where id = p_round;
  if not found or not public.is_member(rd.room_id) then raise exception 'fora_da_sala'; end if;
  insert into public.round_acks (round_id, user_id) values (p_round, uid) on conflict do nothing;
  update public.player_presence set last_seen = now() where room_id = rd.room_id and user_id = uid;
end $$;

create function public.advance_round(p_room uuid, p_rank int default null) returns jsonb language plpgsql security definer set search_path = '' as
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
      nr := public._new_round(p_room, m.id, p_rank);
      return jsonb_build_object('ok', true, 'round', to_jsonb(nr));
    end if;
    return jsonb_build_object('ok', false, 'wait', true, 'acks', k, 'need', a);
  end if;
  return jsonb_build_object('ok', true, 'round', to_jsonb(rd));
end $$;

create function public.put_snapshot(p_match uuid, p_round int, p_state jsonb) returns boolean language plpgsql security definer set search_path = '' as
$$
declare m public.matches; ok boolean;
begin
  select * into m from public.matches where id = p_match for update;
  if not found or not public.is_member(m.room_id) then raise exception 'fora_da_sala'; end if;
  if pg_column_size(p_state) > 40000 then raise exception 'snapshot_grande'; end if;
  if m.snapshot_round is not null and m.snapshot_round >= p_round then return false; end if;
  update public.matches set snapshot = p_state, snapshot_round = p_round where id = p_match;
  return true;
end $$;

create function public.end_match(p_match uuid, p_result text) returns public.matches language plpgsql security definer set search_path = '' as
$$
declare m public.matches;
begin
  select * into m from public.matches where id = p_match for update;
  if not found or not public.is_member(m.room_id) then raise exception 'fora_da_sala'; end if;
  if p_result not in ('won','lost') then raise exception 'resultado_invalido'; end if;
  if m.status <> 'playing' then return m; end if;
  update public.matches set status = p_result, ended_at = now() where id = p_match returning * into m;
  update public.rooms set status = 'lobby', last_active_at = now(),
    progress = case when p_result = 'won' and not (progress->'done') @> to_jsonb(m.boss) then
      jsonb_set(progress, '{done}', coalesce(progress->'done', '[]'::jsonb) || to_jsonb(m.boss)) else progress end
    where id = m.room_id;
  return m;
end $$;

create function public.report_stats(p_match uuid, p_stats jsonb) returns void language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); m public.matches;
begin
  select * into m from public.matches where id = p_match;
  if not found or not public.is_member(m.room_id) then raise exception 'fora_da_sala'; end if;
  if pg_column_size(p_stats) > 6000 then raise exception 'relatorio_grande'; end if;
  insert into public.match_stats (match_id, user_id, grp, stats) values (p_match, uid, public.my_group(m.room_id), p_stats)
    on conflict (match_id, user_id) do update set stats = excluded.stats, grp = coalesce(excluded.grp, public.match_stats.grp), updated_at = now();
end $$;

-- visao coletiva do relatorio (so rodadas ja reveladas; gabarito so aparece depois de revelado)
create function public.match_report(p_match uuid) returns jsonb language plpgsql stable security definer set search_path = '' as
$$
declare m public.matches; rounds_ jsonb; stats_ jsonb;
begin
  select * into m from public.matches where id = p_match;
  if not found or not public.is_member(m.room_id) then raise exception 'fora_da_sala'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'n', r.n, 'rank', q.rank, 'text', q.text, 'options', q.options, 'correct', r.correct_option,
      'groups', (select coalesce(jsonb_object_agg(rg.grp, jsonb_build_object('correct', rg.correct, 'chosen', rg.chosen, 'sim', rg.sim)), '{}'::jsonb)
                 from public.round_groups rg where rg.round_id = r.id)) order by r.n), '[]'::jsonb)
    into rounds_
    from public.rounds r join public.questions q on q.id = r.question_id
    where r.match_id = p_match and r.status in ('revealed','acting','played');
  select coalesce(jsonb_agg(jsonb_build_object('user', s.user_id, 'grp', s.grp, 'stats', s.stats)), '[]'::jsonb)
    into stats_ from public.match_stats s where s.match_id = p_match;
  return jsonb_build_object('match', to_jsonb(m) - 'snapshot', 'rounds', rounds_, 'players', stats_);
end $$;

-- pick_group: durante a partida quem ja tem classe nao troca
create or replace function public.pick_group(p_room uuid, p_grp text) returns void language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); cur text;
begin
  perform 1 from public.rooms where id = p_room for update;
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  select grp into cur from public.room_players where room_id = p_room and user_id = uid;
  if exists (select 1 from public.matches where room_id = p_room and status = 'playing') and cur is not null and p_grp is distinct from cur
    then raise exception 'partida_em_andamento'; end if;
  if p_grp is not null then
    if p_grp not in ('mage','guerreiro','tank','cleriga') then raise exception 'grupo_invalido'; end if;
    if (select count(*) from public.room_players rp join public.player_presence pp using (room_id, user_id)
        where rp.room_id = p_room and rp.grp = p_grp and rp.user_id <> uid and pp.last_seen > now() - interval '45 seconds') >= 7
    then raise exception 'grupo_cheio'; end if;
  end if;
  update public.room_players set grp = p_grp where room_id = p_room and user_id = uid;
  update public.player_presence set last_seen = now() where room_id = p_room and user_id = uid;
end $$;

-- permissoes
do $$ declare f text; begin
  foreach f in array array[
    'start_match(uuid,int)','cast_action(uuid,text,text,text)','use_item(uuid,text,int)','ack_round(uuid)',
    'advance_round(uuid,int)','put_snapshot(uuid,int,jsonb)','end_match(uuid,text)','report_stats(uuid,jsonb)','match_report(uuid)']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  foreach f in array array[
    '_roll_rank()','_active_in_group(uuid,text)','_pick_action(uuid,text)','_new_round(uuid,uuid,int)']
  loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;

-- 11: depois da pergunta (acting/played) os outros grupos tambem ficam visiveis (necessario para o combate sincronizado)
create or replace function public.round_is_revealed(p_round uuid) returns boolean language sql stable security definer set search_path = '' as
$$ select coalesce((select status <> 'open' from public.rounds where id = p_round), false); $$;
