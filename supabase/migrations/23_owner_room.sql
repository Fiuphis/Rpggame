-- Poderes do criador sobre a sala, mesmo depois de sair: encerrar a partida, reiniciar a sala e exclui-la.
-- A lista de salas passa a trazer a coluna "owner" e sempre mostra as salas do proprio criador (enquanto nao excluidas).
drop function public.list_public_rooms();
create function public.list_public_rooms() returns table(id uuid, name text, status text, boss_idx smallint, players integer, counts jsonb, created_at timestamp with time zone, owner boolean)
 language sql stable security definer set search_path = '' as
$$
  with act as (
    select rp.room_id, rp.grp from public.room_players rp join public.player_presence pp using (room_id, user_id)
    where pp.last_seen > now() - interval '45 seconds'
  )
  select r.id, r.name, r.status, r.boss_idx,
    (select count(*) from act where act.room_id = r.id)::int,
    jsonb_build_object(
      'mage', (select count(*) from act where act.room_id = r.id and act.grp = 'mage'),
      'guerreiro', (select count(*) from act where act.room_id = r.id and act.grp = 'guerreiro'),
      'tank', (select count(*) from act where act.room_id = r.id and act.grp = 'tank'),
      'cleriga', (select count(*) from act where act.room_id = r.id and act.grp = 'cleriga')),
    r.created_at,
    r.created_by = (select auth.uid())
  from public.rooms r
  where r.status <> 'ended'
    and (r.is_public or public.is_member(r.id) or r.created_by = (select auth.uid()))
    and (exists (select 1 from act where act.room_id = r.id) or r.created_at > now() - interval '10 minutes' or public.is_member(r.id) or r.created_by = (select auth.uid()))
  order by 5 desc, r.created_at desc
  limit 50;
$$;
revoke all on function public.list_public_rooms() from public, anon;
grant execute on function public.list_public_rooms() to authenticated;

-- p_action: 'end' (encerra a partida em andamento; a sala volta ao mapa), 'restart' (encerra a partida, zera o progresso e as classes e reabre a espera de jogadores), 'delete' (encerra tudo e tira a sala das listas)
create function public.owner_room(p_room uuid, p_action text) returns text language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid());
begin
  if p_action not in ('end', 'restart', 'delete') then raise exception 'acao_invalida'; end if;
  perform 1 from public.rooms where id = p_room for update;
  if not found then raise exception 'sala_nao_encontrada'; end if;
  if not exists (select 1 from public.rooms where id = p_room and created_by = uid) then raise exception 'so_o_criador'; end if;
  update public.matches set status = 'aborted', ended_at = now() where room_id = p_room and status = 'playing';
  if p_action = 'end' then
    update public.rooms set status = 'lobby', last_active_at = now() where id = p_room;
  elsif p_action = 'restart' then
    update public.room_players set grp = null where room_id = p_room;
    update public.rooms set status = 'lobby', stage = 'gather', boss_idx = 0, progress = '{"done": []}'::jsonb, last_active_at = now() where id = p_room;
  else
    update public.rooms set status = 'ended', last_active_at = now() where id = p_room;
  end if;
  return p_action;
end $$;
revoke all on function public.owner_room(uuid, text) from public, anon;
grant execute on function public.owner_room(uuid, text) to authenticated;
