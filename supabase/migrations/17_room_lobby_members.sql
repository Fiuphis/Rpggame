-- room_lobby passa a listar as pessoas da sala (nome, criador, voce), sem classe
create or replace function public.room_lobby(p_room uuid) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; tot int; got int; mem jsonb;
begin
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  select * into r from public.rooms where id = p_room;
  update public.player_presence set last_seen = now() where room_id = p_room and user_id = uid;
  select count(*), count(rp.grp) into tot, got from public.room_players rp join public.player_presence pp using (room_id, user_id)
    where rp.room_id = p_room and pp.last_seen > now() - interval '45 seconds';
  select coalesce(jsonb_agg(jsonb_build_object('name', (select p.username from public.profiles p where p.user_id = rp.user_id),
      'owner', rp.user_id = r.created_by, 'me', rp.user_id = uid) order by rp.joined_at), '[]'::jsonb) into mem
    from public.room_players rp join public.player_presence pp using (room_id, user_id)
    where rp.room_id = p_room and pp.last_seen > now() - interval '45 seconds';
  return jsonb_build_object('stage', r.stage, 'code', r.code, 'name', r.name, 'owner', r.created_by = uid, 'total', tot, 'picked', got, 'members', mem,
    'me', (select grp from public.room_players where room_id = p_room and user_id = uid), 'status', r.status);
end $$;
