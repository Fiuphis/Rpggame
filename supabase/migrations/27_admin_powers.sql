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

  select coalesce(jsonb_agg(jsonb_build_object('grp', rp.grp, 'me', rp.user_id = uid, 'owner', rp.user_id = r.created_by,
      'name', (select p.username from public.profiles p where p.user_id = rp.user_id),
      'active', coalesce(pp.last_seen > now() - interval '45 seconds', false)) order by rp.joined_at), '[]'::jsonb)
    into members_ from public.room_players rp left join public.player_presence pp on pp.room_id = rp.room_id and pp.user_id = rp.user_id where rp.room_id = p_room;

  res := jsonb_build_object('now', floor(extract(epoch from clock_timestamp()) * 1000)::bigint,
    'room', jsonb_build_object('id', r.id, 'code', r.code, 'name', r.name, 'status', r.status, 'boss_idx', r.boss_idx, 'progress', r.progress, 'owner', r.created_by = uid),
    'me', me, 'members', members_,
    'notice', (select jsonb_build_object('id', nt.id, 'kind', nt.kind, 'text', nt.text) from public.room_notices nt where nt.room_id = p_room and nt.at > now() - interval '2 minutes' order by nt.id desc limit 1));

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
  if p_action not in ('msg', 'time', 'close', 'chest', 'kick', 'end', 'delete') then raise exception 'acao_invalida'; end if;
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
    g := p_arg->>'grp';
    select user_id into tu from public.room_players where room_id = p_room and grp = g limit 1;
    if tu is null then raise exception 'jogador_nao_encontrado'; end if;
    delete from public.room_players where room_id = p_room and user_id = tu;
    delete from public.player_presence where room_id = p_room and user_id = tu;
    msg := 'A administração removeu um jogador da sala.';
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
