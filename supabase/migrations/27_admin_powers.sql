-- Etapa 3a do painel de adm: poderes sobre a sala. Tudo passa por admin_act (so adm), com registro em admin_log e aviso discreto aos jogadores (room_notices, lido junto de match_state).
-- Acoes: msg (mensagem para a sala), time (mais tempo na fase atual), close (encerra a fase atual agora), chest (a proxima rodada vira arca),
--        kick (remove o jogador de uma classe), end (encerra a partida), delete (exclui a sala).

create table public.admin_log (
  id bigserial primary key, at timestamptz not null default now(), admin_id uuid not null, admin_name text,
  room_id uuid, action text not null, detail jsonb not null default '{}'::jsonb
);
alter table public.admin_log enable row level security;
revoke all on public.admin_log from public, anon, authenticated;
create index admin_log_at on public.admin_log(at desc);

create table public.room_notices (
  id bigserial primary key, room_id uuid not null references public.rooms(id) on delete cascade,
  at timestamptz not null default now(), kind text not null default 'adm', text text not null
);
alter table public.room_notices enable row level security;
revoke all on public.room_notices from public, anon, authenticated;
create index room_notices_room on public.room_notices(room_id, id desc);

alter table public.rooms add column force_chest boolean not null default false;
alter table public.rooms add column locked boolean not null default false;

-- expulsos de uma sala (valem so para aquela sala; o criador ou um adm pode perdoar)
create table public.room_bans (
  room_id uuid not null references public.rooms(id) on delete cascade, user_id uuid not null,
  by_user uuid, at timestamptz not null default now(), primary key (room_id, user_id)
);
alter table public.room_bans enable row level security;
revoke all on public.room_bans from public, anon, authenticated;

-- identificador curto e estavel de um jogador dentro de uma sala (nao revela o id da conta)
create or replace function public._pid(p_room uuid, p_user uuid) returns text language sql immutable set search_path = '' as
$$ select left(md5(p_room::text || ':' || p_user::text), 8) $$;
revoke all on function public._pid(uuid, uuid) from public, anon, authenticated;

create or replace function public._new_round(p_room uuid, p_match uuid, p_rank int, p_kind text) returns public.rounds language plpgsql security definer set search_path = '' as
$$
declare rk int; q uuid; n int; rd public.rounds; g text; secs int; mult numeric;
begin
  if p_kind <> 'chest' and exists (select 1 from public.rooms where id = p_room and force_chest) then
    p_kind := 'chest'; update public.rooms set force_chest = false where id = p_room;
  end if;
  select case time_mode when 'fast' then 0.7 when 'long' then 1.5 else 1 end into mult from public.rooms where id = p_room;
  if p_kind = 'chest' then
    q := null; rk := null; secs := round(25 * coalesce(mult, 1));
  else
    rk := coalesce(p_rank, public._roll_rank());
    if rk not between 1 and 5 then raise exception 'rank_invalido'; end if;
    secs := round((20 + 5 * rk) * coalesce(mult, 1));
    select id into q from public.questions
      where active and rank = rk and id not in (select question_id from public.rounds where room_id = p_room and question_id is not null) order by random() limit 1;
    if q is null then select id into q from public.questions where active and rank = rk order by random() limit 1; end if;
    if q is null then select id into q from public.questions where active order by random() limit 1; end if;
    if q is null then raise exception 'sem_perguntas'; end if;
  end if;
  select coalesce(max(r.n), 0) + 1 into n from public.rounds r where r.room_id = p_room;
  insert into public.rounds (room_id, match_id, n, question_id, kind, ends_at)
    values (p_room, p_match, n, q, case when p_kind = 'chest' then 'chest' else 'q' end, now() + (secs + 4) * interval '1 second') returning * into rd;
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


create or replace function public.match_state(p_room uuid, p_snapshot boolean default false) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; m public.matches; rd public.rounds; me text; res jsonb := '{}'::jsonb;
  members_ jsonb; counts_ jsonb; round_ jsonb; vis boolean; groups_ jsonb; q jsonb; my_vote jsonb; my_act jsonb; tally jsonb; acts jsonb; items_ jsonb; acks_ int; prev_ jsonb;
begin
  perform public._expire_match(p_room);
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  select * into r from public.rooms where id = p_room;
  me := public.my_group(p_room);
  update public.player_presence set last_seen = now() where room_id = p_room and user_id = uid;
  select * into m from public.matches where room_id = p_room order by started_at desc limit 1;
  if found and m.status = 'playing' then
    select * into rd from public.rounds where match_id = m.id order by n desc limit 1;
    if found then perform public._try_close(rd.id); end if;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('pid', public._pid(rp.room_id, rp.user_id), 'grp', rp.grp, 'me', rp.user_id = uid, 'owner', rp.user_id = r.created_by,
      'name', (select p.username from public.profiles p where p.user_id = rp.user_id),
      'active', coalesce(pp.last_seen > now() - interval '45 seconds', false)) order by rp.joined_at), '[]'::jsonb)
    into members_ from public.room_players rp left join public.player_presence pp on pp.room_id = rp.room_id and pp.user_id = rp.user_id where rp.room_id = p_room;

  res := jsonb_build_object('now', floor(extract(epoch from clock_timestamp()) * 1000)::bigint,
    'room', jsonb_build_object('id', r.id, 'code', r.code, 'name', r.name, 'status', r.status, 'boss_idx', r.boss_idx, 'progress', r.progress, 'owner', r.created_by = uid),
    'me', me, 'members', members_,
    'notices', coalesce((select jsonb_agg(jsonb_build_object('id', z.id, 'kind', z.kind, 'text', z.text) order by z.id)
      from (select * from public.room_notices nt where nt.room_id = p_room and nt.at > now() - interval '2 minutes' order by nt.id desc limit 10) z), '[]'::jsonb));

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
      select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'grp', i.grp, 'item', i.item, 'ph', i.ph, 'target', i.target) order by i.id), '[]'::jsonb) into items_
        from public.round_items i where i.round_id = rd.id and (i.grp = me or rd.status = 'played'
          or (i.ph = 'open' and rd.status <> 'open') or (i.ph = 'revealed' and rd.status in ('acting','played')));
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


create or replace function public.admin_act(p_room uuid, p_action text, p_arg jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; m public.matches; rd public.rounds; nm text; secs int; t text; g text; tu uuid; msg text;
begin
  if not public.is_admin() then raise exception 'sem_permissao'; end if;
  if p_action not in ('msg', 'time', 'close', 'chest', 'kick', 'forgive', 'end', 'delete') then raise exception 'acao_invalida'; end if;
  perform 1 from public.rooms where id = p_room for update;
  select * into r from public.rooms where id = p_room;
  if not found or r.status = 'ended' then raise exception 'sala_nao_encontrada'; end if;
  select username into nm from public.profiles where user_id = uid;
  select * into m from public.matches where room_id = p_room and status = 'playing';
  if p_action in ('time', 'close', 'chest') and m.id is null then raise exception 'sem_partida'; end if;
  if m.id is not null then select * into rd from public.rounds where match_id = m.id order by n desc limit 1; end if;

  if p_action = 'msg' then
    t := btrim(coalesce(p_arg->>'text', ''));
    if char_length(t) < 1 or char_length(t) > 120 then raise exception 'mensagem_invalida'; end if;
    msg := t;
  elsif p_action = 'time' then
    secs := least(60, greatest(5, coalesce((p_arg->>'secs')::int, 15)));
    if rd.status = 'open' then update public.rounds set ends_at = ends_at + secs * interval '1 second' where id = rd.id;
    elsif rd.status = 'acting' then update public.rounds set act_ends_at = act_ends_at + secs * interval '1 second' where id = rd.id;
    else raise exception 'rodada_sem_tempo'; end if;
    msg := 'A administração concedeu mais tempo.';
  elsif p_action = 'close' then
    if rd.status = 'open' then
      update public.round_groups set extra_secs = 0 where round_id = rd.id;
      update public.rounds set ends_at = now() where id = rd.id;
    elsif rd.status = 'acting' then update public.rounds set act_ends_at = now() where id = rd.id;
    else raise exception 'rodada_sem_tempo'; end if;
    perform public._try_close(rd.id);
    msg := 'A administração encerrou esta fase.';
  elsif p_action = 'chest' then
    update public.rooms set force_chest = true where id = p_room;
    msg := 'A administração preparou uma arca para a próxima rodada.';
  elsif p_action = 'kick' then
    if p_arg ? 'pid' then select user_id into tu from public.room_players where room_id = p_room and public._pid(room_id, user_id) = p_arg->>'pid';
    else g := p_arg->>'grp'; select user_id into tu from public.room_players where room_id = p_room and grp = g limit 1; end if;
    if tu is null then raise exception 'jogador_nao_encontrado'; end if;
    delete from public.room_players where room_id = p_room and user_id = tu;
    delete from public.player_presence where room_id = p_room and user_id = tu;
    insert into public.room_bans (room_id, user_id, by_user) values (p_room, tu, uid) on conflict do nothing;
    msg := 'A administração removeu um jogador da sala.';
  elsif p_action = 'forgive' then
    delete from public.room_bans where room_id = p_room and public._pid(room_id, user_id) = p_arg->>'pid';
    if not found then raise exception 'jogador_nao_encontrado'; end if;
    msg := 'A administração perdoou um jogador expulso.';
  elsif p_action = 'end' then
    update public.matches set status = 'aborted', ended_at = now() where room_id = p_room and status = 'playing';
    update public.rooms set status = 'lobby', last_active_at = now() where id = p_room;
    msg := 'A administração encerrou a partida.';
  else
    update public.matches set status = 'aborted', ended_at = now() where room_id = p_room and status = 'playing';
    update public.rooms set status = 'ended', last_active_at = now() where id = p_room;
    msg := 'A administração encerrou a sala.';
  end if;
  insert into public.room_notices (room_id, kind, text) values (p_room, p_action, msg);
  insert into public.admin_log (admin_id, admin_name, room_id, action, detail) values (uid, nm, p_room, p_action, coalesce(p_arg, '{}'::jsonb));
  return jsonb_build_object('ok', true, 'action', p_action);
end $$;

create or replace function public.admin_log_list(p_limit int default 50) returns jsonb language plpgsql stable security definer set search_path = '' as
$$
begin
  if not public.is_admin() then raise exception 'sem_permissao'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'at', x.at, 'admin', x.admin_name, 'room', x.room_id, 'action', x.action, 'detail', x.detail) order by x.id desc)
    from (select * from public.admin_log order by id desc limit least(greatest(coalesce(p_limit, 50), 1), 200)) x), '[]'::jsonb);
end $$;

do $$ begin
  revoke all on function public.admin_act(uuid, text, jsonb) from public, anon;
  grant execute on function public.admin_act(uuid, text, jsonb) to authenticated;
  revoke all on function public.admin_log_list(int) from public, anon;
  grant execute on function public.admin_log_list(int) to authenticated;
end $$;


-- criador: lista de expulsos (criador ou adm)
create or replace function public.room_bans_list(p_room uuid) returns jsonb language plpgsql stable security definer set search_path = '' as
$$
begin
  if not (public.is_admin() or exists (select 1 from public.rooms where id = p_room and created_by = (select auth.uid()))) then raise exception 'so_o_criador'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('pid', public._pid(b.room_id, b.user_id), 'name', (select p.username from public.profiles p where p.user_id = b.user_id)) order by b.at)
    from public.room_bans b where b.room_id = p_room), '[]'::jsonb);
end $$;

-- entrar: expulso nao volta (ate ser perdoado); sala trancada nao aceita gente nova (quem ja estava volta)
create or replace function public.join_room(p_room uuid default null, p_code text default null) returns public.rooms language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; was boolean; g text;
begin
  if uid is null then raise exception 'nao_autenticado'; end if;
  if p_code is not null and length(trim(p_code)) > 0 then
    if (select count(*) from public.join_fails where user_id = uid and at > now() - interval '10 minutes') >= 10 then raise exception 'muitas_tentativas'; end if;
    select * into r from public.rooms where code = upper(trim(p_code)) and status <> 'ended';
    if not found then
      insert into public.join_fails (user_id) values (uid);
      return null;
    end if;
  else
    select * into r from public.rooms where id = p_room and status <> 'ended' and (is_public or public.is_member(id));
    if not found then raise exception 'sala_nao_encontrada'; end if;
  end if;
  if exists (select 1 from public.room_bans where room_id = r.id and user_id = uid) then raise exception 'expulso'; end if;
  was := public.is_member(r.id);
  if r.stage <> 'gather' and not was then raise exception 'sala_fechada'; end if;
  if r.locked and not was then raise exception 'sala_trancada'; end if;
  perform 1 from public.rooms where id = r.id for update;
  if not was then
    delete from public.room_players rp where rp.room_id = r.id and rp.user_id <> uid
      and not exists (select 1 from public.player_presence pp where pp.room_id = rp.room_id and pp.user_id = rp.user_id and pp.last_seen > now() - interval '45 seconds');
    if (select count(*) from public.room_players rp where rp.room_id = r.id) >= 4 then raise exception 'sala_cheia'; end if;
  end if;
  insert into public.room_players (room_id, user_id) values (r.id, uid) on conflict do nothing;
  if was then
    select grp into g from public.room_players where room_id = r.id and user_id = uid;
    if g is not null and exists (select 1 from public.room_players rp where rp.room_id = r.id and rp.grp = g and rp.user_id <> uid)
    then update public.room_players set grp = null where room_id = r.id and user_id = uid; end if;
  end if;
  insert into public.player_presence (room_id, user_id) values (r.id, uid)
    on conflict (room_id, user_id) do update set last_seen = now();
  return r;
end $$;

-- espera: a lista de pessoas passa a trazer o identificador (pid) e a sala traz trancada/publica/tempo
create or replace function public.room_lobby(p_room uuid) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; tot int; got int; mem jsonb;
begin
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  select * into r from public.rooms where id = p_room;
  update public.player_presence set last_seen = now() where room_id = p_room and user_id = uid;
  select count(*), count(rp.grp) into tot, got from public.room_players rp join public.player_presence pp using (room_id, user_id)
    where rp.room_id = p_room and pp.last_seen > now() - interval '45 seconds';
  select coalesce(jsonb_agg(jsonb_build_object('pid', public._pid(rp.room_id, rp.user_id), 'name', (select p.username from public.profiles p where p.user_id = rp.user_id),
      'owner', rp.user_id = r.created_by, 'me', rp.user_id = uid) order by rp.joined_at), '[]'::jsonb) into mem
    from public.room_players rp join public.player_presence pp using (room_id, user_id)
    where rp.room_id = p_room and pp.last_seen > now() - interval '45 seconds';
  return jsonb_build_object('stage', r.stage, 'code', r.code, 'name', r.name, 'owner', r.created_by = uid, 'total', tot, 'picked', got, 'members', mem,
    'me', (select grp from public.room_players where room_id = p_room and user_id = uid), 'status', r.status,
    'locked', r.locked, 'public', r.is_public, 'time_mode', r.time_mode);
end $$;

-- criador: expulsar (com bloqueio), perdoar, passar o comando, trancar, renomear, tempo de resposta, publica/privada
create or replace function public.owner_power(p_room uuid, p_action text, p_arg jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; tu uuid; v text;
begin
  if p_action not in ('kick', 'forgive', 'transfer', 'lock', 'rename', 'time', 'public') then raise exception 'acao_invalida'; end if;
  perform 1 from public.rooms where id = p_room for update;
  select * into r from public.rooms where id = p_room;
  if not found or r.status = 'ended' then raise exception 'sala_nao_encontrada'; end if;
  if r.created_by <> uid then raise exception 'so_o_criador'; end if;
  if p_action in ('kick', 'transfer') then
    select user_id into tu from public.room_players where room_id = p_room and public._pid(room_id, user_id) = p_arg->>'pid';
    if tu is null then raise exception 'jogador_nao_encontrado'; end if;
    if tu = uid then raise exception 'nao_pode_em_si_mesmo'; end if;
  end if;
  if p_action = 'kick' then
    delete from public.room_players where room_id = p_room and user_id = tu;
    delete from public.player_presence where room_id = p_room and user_id = tu;
    insert into public.room_bans (room_id, user_id, by_user) values (p_room, tu, uid) on conflict do nothing;
  elsif p_action = 'forgive' then
    delete from public.room_bans where room_id = p_room and public._pid(room_id, user_id) = p_arg->>'pid';
    if not found then raise exception 'jogador_nao_encontrado'; end if;
  elsif p_action = 'transfer' then
    update public.rooms set created_by = tu where id = p_room;
  elsif p_action = 'lock' then
    update public.rooms set locked = coalesce((p_arg->>'on')::boolean, true) where id = p_room;
  elsif p_action = 'rename' then
    v := btrim(coalesce(p_arg->>'name', ''));
    if char_length(v) > 24 then raise exception 'nome_invalido'; end if;
    update public.rooms set name = nullif(v, '') where id = p_room;
  elsif p_action = 'time' then
    v := p_arg->>'mode';
    if v not in ('fast', 'normal', 'long') then raise exception 'tempo_invalido'; end if;
    if exists (select 1 from public.matches where room_id = p_room and status = 'playing') then raise exception 'partida_em_andamento'; end if;
    update public.rooms set time_mode = v where id = p_room;
  else
    update public.rooms set is_public = coalesce((p_arg->>'on')::boolean, true) where id = p_room;
  end if;
  return jsonb_build_object('ok', true, 'action', p_action);
end $$;

do $$ begin
  revoke all on function public.room_bans_list(uuid) from public, anon;
  grant execute on function public.room_bans_list(uuid) to authenticated;
  revoke all on function public.join_room(uuid, text) from public, anon;
  grant execute on function public.join_room(uuid, text) to authenticated;
  revoke all on function public.room_lobby(uuid) from public, anon;
  grant execute on function public.room_lobby(uuid) to authenticated;
  revoke all on function public.owner_power(uuid, text, jsonb) from public, anon;
  grant execute on function public.owner_power(uuid, text, jsonb) to authenticated;
end $$;

-- painel "gerenciar sala" do criador (funciona mesmo depois de sair da sala) e dos adm
create or replace function public.owner_room_info(p_room uuid) returns jsonb language plpgsql stable security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms;
begin
  select * into r from public.rooms where id = p_room and status <> 'ended';
  if not found then raise exception 'sala_nao_encontrada'; end if;
  if r.created_by <> uid and not public.is_admin() then raise exception 'so_o_criador'; end if;
  return jsonb_build_object('owner', r.created_by = uid, 'name', r.name, 'locked', r.locked, 'public', r.is_public, 'time_mode', r.time_mode, 'stage', r.stage,
    'playing', exists (select 1 from public.matches m where m.room_id = r.id and m.status = 'playing'),
    'members', coalesce((select jsonb_agg(jsonb_build_object('pid', public._pid(rp.room_id, rp.user_id), 'name', (select p.username from public.profiles p where p.user_id = rp.user_id),
        'grp', rp.grp, 'owner', rp.user_id = r.created_by, 'me', rp.user_id = uid,
        'active', coalesce(pp.last_seen > now() - interval '45 seconds', false)) order by rp.joined_at)
      from public.room_players rp left join public.player_presence pp on pp.room_id = rp.room_id and pp.user_id = rp.user_id where rp.room_id = r.id), '[]'::jsonb),
    'bans', coalesce((select jsonb_agg(jsonb_build_object('pid', public._pid(b.room_id, b.user_id), 'name', (select p.username from public.profiles p where p.user_id = b.user_id)) order by b.at)
      from public.room_bans b where b.room_id = r.id), '[]'::jsonb));
end $$;
do $$ begin
  revoke all on function public.owner_room_info(uuid) from public, anon;
  grant execute on function public.owner_room_info(uuid) to authenticated;
end $$;
