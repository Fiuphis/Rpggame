-- Fluxo da sala: 'gather' (reunindo gente) -> 'pick' (escolhendo classe) -> 'map' (criador escolhe o boss).
-- Quem nao esta na sala quando ela passa de 'gather' nao entra mais (a sala fecha).
alter table public.rooms add column stage text not null default 'gather' check (stage in ('gather','pick','map'));

create function public.room_lobby(p_room uuid) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; tot int; got int;
begin
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  select * into r from public.rooms where id = p_room;
  update public.player_presence set last_seen = now() where room_id = p_room and user_id = uid;
  select count(*), count(rp.grp) into tot, got from public.room_players rp join public.player_presence pp using (room_id, user_id)
    where rp.room_id = p_room and pp.last_seen > now() - interval '45 seconds';
  return jsonb_build_object('stage', r.stage, 'code', r.code, 'name', r.name, 'owner', r.created_by = uid, 'total', tot, 'picked', got,
    'me', (select grp from public.room_players where room_id = p_room and user_id = uid), 'status', r.status);
end $$;

create function public.set_room_stage(p_room uuid, p_stage text) returns text language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; tot int; got int;
begin
  if p_stage not in ('gather','pick','map') then raise exception 'etapa_invalida'; end if;
  select * into r from public.rooms where id = p_room for update;
  if not found or not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  if r.created_by <> uid then raise exception 'so_o_criador'; end if;
  if p_stage = 'map' then
    select count(*), count(rp.grp) into tot, got from public.room_players rp join public.player_presence pp using (room_id, user_id)
      where rp.room_id = p_room and pp.last_seen > now() - interval '45 seconds';
    if tot = 0 or got < tot then raise exception 'faltam_classes'; end if;
  end if;
  update public.rooms set stage = p_stage, last_active_at = now() where id = p_room;
  return p_stage;
end $$;

create or replace function public.join_room(p_room uuid default null, p_code text default null) returns public.rooms language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms;
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
  if r.stage <> 'gather' and not public.is_member(r.id) then raise exception 'sala_fechada'; end if;
  insert into public.room_players (room_id, user_id) values (r.id, uid) on conflict do nothing;
  insert into public.player_presence (room_id, user_id) values (r.id, uid)
    on conflict (room_id, user_id) do update set last_seen = now();
  return r;
end $$;

create or replace function public.end_match(p_match uuid, p_result text) returns public.matches language plpgsql security definer set search_path = '' as
$$
declare m public.matches;
begin
  select * into m from public.matches where id = p_match for update;
  if not found or not public.is_member(m.room_id) then raise exception 'fora_da_sala'; end if;
  if p_result not in ('won','lost') then raise exception 'resultado_invalido'; end if;
  if m.status <> 'playing' then return m; end if;
  update public.matches set status = p_result, ended_at = now() where id = p_match returning * into m;
  update public.rooms set status = 'lobby', stage = 'map', last_active_at = now(),
    progress = case when p_result = 'won' and not (progress->'done') @> to_jsonb(m.boss) then
      jsonb_set(progress, '{done}', coalesce(progress->'done', '[]'::jsonb) || to_jsonb(m.boss)) else progress end
    where id = m.room_id;
  return m;
end $$;

do $$ begin
  revoke all on function public.room_lobby(uuid) from public, anon;
  grant execute on function public.room_lobby(uuid) to authenticated;
  revoke all on function public.set_room_stage(uuid, text) from public, anon;
  grant execute on function public.set_room_stage(uuid, text) to authenticated;
end $$;
