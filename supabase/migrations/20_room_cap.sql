-- Teto de 28 jogadores por sala (4 classes x 7). Quem ja esta na sala volta sempre; so a entrada de gente nova e recusada.
-- Sem isso, jogadores a mais ficavam sem vaga de classe e bloqueavam o criador (todos precisam ter classe para ir ao mapa).
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
  perform 1 from public.rooms where id = r.id for update;
  if not public.is_member(r.id) and (select count(*) from public.room_players rp join public.player_presence pp using (room_id, user_id)
       where rp.room_id = r.id and pp.last_seen > now() - interval '45 seconds') >= 28 then raise exception 'sala_cheia'; end if;
  insert into public.room_players (room_id, user_id) values (r.id, uid) on conflict do nothing;
  insert into public.player_presence (room_id, user_id) values (r.id, uid)
    on conflict (room_id, user_id) do update set last_seen = now();
  return r;
end $$;
