-- Abertura (cutscene) do boss para todos da sala, com votacao de pular contada na SALA INTEIRA (nao so no grupo).
-- O relogio da rodada 1 fica parado ate a abertura acabar: start_match empurra o fim da rodada 1 em 75 s (limite maximo)
-- e a abertura e liberada antes disso quando (a) a maioria dos membros ativos da sala vota em pular ou (b) todos terminaram de assistir.
-- Na liberacao o fim da rodada 1 volta para "agora + tempo normal da rodada".
alter table public.matches add column intro_until timestamptz;

create table public.intro_votes (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null,
  kind text not null check (kind in ('skip', 'done')),
  primary key (match_id, user_id, kind)
);
alter table public.intro_votes enable row level security;

-- libera a abertura se a regra foi cumprida
create function public._intro_release(p_match uuid) returns void language plpgsql security definer set search_path = '' as
$$
declare m public.matches; cnt int; sk int; dn int; delta interval;
begin
  select * into m from public.matches where id = p_match for update;
  if not found or m.status <> 'playing' or m.intro_until is null or m.intro_until <= now() + interval '1 second' then return; end if;
  select count(*) into cnt from public.room_players rp join public.player_presence pp using (room_id, user_id)
    where rp.room_id = m.room_id and pp.last_seen > now() - interval '45 seconds';
  select count(*) into sk from public.intro_votes v where v.match_id = p_match and v.kind = 'skip';
  select count(*) into dn from public.intro_votes v where v.match_id = p_match and v.kind = 'done';
  if cnt < 1 then cnt := 1; end if;
  if sk >= cnt / 2 + 1 or dn >= cnt then
    delta := m.intro_until - (now() + interval '600 milliseconds');
    update public.rounds set ends_at = ends_at - delta where match_id = p_match and n = 1 and status = 'open';
    update public.matches set intro_until = now() + interval '600 milliseconds' where id = p_match;
  end if;
end $$;
revoke all on function public._intro_release(uuid) from public, anon, authenticated;

create function public._intro_json(p_room uuid) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); m public.matches; cnt int; sk int; dn int; mine boolean;
begin
  select * into m from public.matches where room_id = p_room and status = 'playing';
  if not found or m.intro_until is null then return jsonb_build_object('on', false); end if;
  select count(*) into cnt from public.room_players rp join public.player_presence pp using (room_id, user_id)
    where rp.room_id = p_room and pp.last_seen > now() - interval '45 seconds';
  if cnt < 1 then cnt := 1; end if;
  select count(*) into sk from public.intro_votes v where v.match_id = m.id and v.kind = 'skip';
  select count(*) into dn from public.intro_votes v where v.match_id = m.id and v.kind = 'done';
  mine := exists (select 1 from public.intro_votes v where v.match_id = m.id and v.user_id = uid and v.kind = 'skip');
  return jsonb_build_object('on', m.intro_until > now() + interval '1 second', 'until', floor(extract(epoch from m.intro_until) * 1000)::bigint,
    'now', floor(extract(epoch from clock_timestamp()) * 1000)::bigint, 'voters', cnt, 'need', cnt / 2 + 1, 'skip', sk, 'done', dn, 'mine', mine);
end $$;
revoke all on function public._intro_json(uuid) from public, anon, authenticated;

create function public.intro_state(p_room uuid) returns jsonb language plpgsql security definer set search_path = '' as
$$
begin
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  update public.player_presence set last_seen = now() where room_id = p_room and user_id = (select auth.uid());
  perform public._intro_release(id) from public.matches where room_id = p_room and status = 'playing';
  return public._intro_json(p_room);
end $$;

-- p_yes = true marca o voto de pular, false desmarca; so vale enquanto a abertura esta no ar
create function public.intro_vote(p_room uuid, p_yes boolean) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); m public.matches;
begin
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  select * into m from public.matches where room_id = p_room and status = 'playing';
  if found and m.intro_until is not null and m.intro_until > now() + interval '1 second' then
    update public.player_presence set last_seen = now() where room_id = p_room and user_id = uid;
    if p_yes then insert into public.intro_votes (match_id, user_id, kind) values (m.id, uid, 'skip') on conflict do nothing;
    else delete from public.intro_votes where match_id = m.id and user_id = uid and kind = 'skip'; end if;
    perform public._intro_release(m.id);
  end if;
  return public._intro_json(p_room);
end $$;

-- terminei de assistir (ou nao quis assistir)
create function public.intro_done(p_room uuid) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); m public.matches;
begin
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  select * into m from public.matches where room_id = p_room and status = 'playing';
  if found then
    insert into public.intro_votes (match_id, user_id, kind) values (m.id, uid, 'done') on conflict do nothing;
    perform public._intro_release(m.id);
  end if;
  return public._intro_json(p_room);
end $$;

-- start_match: igual a versao de 14_expire_match.sql, mais a janela da abertura
create or replace function public.start_match(p_room uuid, p_boss int default 0) returns public.matches language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); m public.matches;
begin
  perform public._expire_match(p_room);
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
  insert into public.matches (room_id, boss, started_by, intro_until) values (p_room, p_boss, uid, now() + interval '75 seconds') returning * into m;
  perform public._new_round(p_room, m.id, null, 'q');
  update public.rounds set ends_at = ends_at + interval '75 seconds' where match_id = m.id and n = 1;
  update public.rooms set boss_idx = p_boss where id = p_room;
  return m;
end $$;

do $$ begin
  revoke all on function public.intro_state(uuid) from public, anon;
  grant execute on function public.intro_state(uuid) to authenticated;
  revoke all on function public.intro_vote(uuid, boolean) from public, anon;
  grant execute on function public.intro_vote(uuid, boolean) to authenticated;
  revoke all on function public.intro_done(uuid) from public, anon;
  grant execute on function public.intro_done(uuid) to authenticated;
  revoke all on function public.start_match(uuid, int) from public, anon;
  grant execute on function public.start_match(uuid, int) to authenticated;
end $$;
