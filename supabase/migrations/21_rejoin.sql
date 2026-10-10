-- Voltar para a sala no mesmo ponto.
-- Antes: sair da sala apagava a pessoa (room_players); depois que a sala passava da fase de espera ('gather'),
-- so quem ainda era membro entrava, entao quem saiu (ate o criador) nao conseguia mais voltar.
-- Agora: na fase de espera sair continua apagando a pessoa; depois disso so zera o sinal de presenca
-- (a pessoa segue membro, com a mesma classe) e a sala continua aparecendo na lista dela.

create or replace function public.leave_room(p_room uuid) returns void language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); st text;
begin
  select stage into st from public.rooms where id = p_room;
  if st is null or st = 'gather' then
    delete from public.room_players where room_id = p_room and user_id = uid;
  else
    update public.player_presence set last_seen = now() - interval '1 hour' where room_id = p_room and user_id = uid;
  end if;
end $$;

-- quem volta recupera a classe; se a vaga foi tomada enquanto estava fora (7 ativos na classe), fica sem classe e escolhe de novo
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
  was := public.is_member(r.id);
  if r.stage <> 'gather' and not was then raise exception 'sala_fechada'; end if;
  perform 1 from public.rooms where id = r.id for update;
  if not was and (select count(*) from public.room_players rp join public.player_presence pp using (room_id, user_id)
       where rp.room_id = r.id and pp.last_seen > now() - interval '45 seconds') >= 28 then raise exception 'sala_cheia'; end if;
  insert into public.room_players (room_id, user_id) values (r.id, uid) on conflict do nothing;
  if was then
    select grp into g from public.room_players where room_id = r.id and user_id = uid;
    if g is not null and (select count(*) from public.room_players rp join public.player_presence pp using (room_id, user_id)
         where rp.room_id = r.id and rp.grp = g and rp.user_id <> uid and pp.last_seen > now() - interval '45 seconds') >= 7
    then update public.room_players set grp = null where room_id = r.id and user_id = uid; end if;
  end if;
  insert into public.player_presence (room_id, user_id) values (r.id, uid)
    on conflict (room_id, user_id) do update set last_seen = now();
  return r;
end $$;

-- a lista mostra tambem as salas em que a pessoa ainda e membro (para voltar a elas), mesmo vazias ou privadas
create or replace function public.list_public_rooms() returns table(id uuid, name text, status text, boss_idx smallint, players integer, counts jsonb, created_at timestamp with time zone)
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
    r.created_at
  from public.rooms r
  where r.status <> 'ended'
    and (r.is_public or public.is_member(r.id))
    and (exists (select 1 from act where act.room_id = r.id) or r.created_at > now() - interval '10 minutes' or public.is_member(r.id))
  order by 5 desc, r.created_at desc
  limit 50;
$$;
