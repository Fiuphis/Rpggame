-- Etapa 3f (v337): o sorteio de rank acima do teto da dificuldade agora e refeito (em vez de cortado para o teto).
-- Antes, no medio os SS sorteados viravam S (S ~27%, mais que no dificil); agora a proporcao C/B/A/S se mantem. Mesma ideia no facil (A deixa de absorver S e SS).
-- Rank forcado pelo adm continua sem limite; rank passado explicitamente continua limitado ao teto.

create or replace function public._new_round(p_room uuid, p_match uuid, p_rank int, p_kind text) returns public.rounds language plpgsql security definer set search_path = '' as
$$
declare rk int; q uuid; n int; rd public.rounds; g text; secs int; mult numeric; fr int; fm text; dif text; cap int; tries int := 0;
begin
  if p_kind <> 'chest' and exists (select 1 from public.rooms where id = p_room and force_chest) then
    p_kind := 'chest'; update public.rooms set force_chest = false where id = p_room;
  end if;
  select difficulty into dif from public.rooms where id = p_room;
  fm := null;
  if p_kind = 'chest' then select force_mode into fm from public.rooms where id = p_room; update public.rooms set force_mode = null where id = p_room; end if;
  select case time_mode when 'fast' then 0.7 when 'long' then 1.5 else 1 end into mult from public.rooms where id = p_room;
  if p_kind = 'chest' then
    q := null; rk := null; secs := round(25 * coalesce(mult, 1));
  else
    select force_rank into fr from public.rooms where id = p_room;
    if fr is not null then update public.rooms set force_rank = null where id = p_room; end if;
    cap := case dif when 'easy' then 3 when 'medium' then 4 else 5 end;
    if fr is not null then rk := fr;
    elsif p_rank is not null then rk := least(p_rank, cap);
    else   -- sorteia de novo ate cair dentro do teto (assim o rank acima do teto nao vira o rank do teto)
      rk := public._roll_rank();
      while rk > cap and tries < 40 loop rk := public._roll_rank(); tries := tries + 1; end loop;
      rk := least(rk, cap);
    end if;
    if rk not between 1 and 5 then raise exception 'rank_invalido'; end if;
    secs := round((20 + 5 * rk) * coalesce(mult, 1));
    select id into q from public.questions
      where active and rank = rk and id not in (select question_id from public.rounds where room_id = p_room and question_id is not null) order by random() limit 1;
    if q is null then select id into q from public.questions where active and rank = rk order by random() limit 1; end if;
    if q is null then select id into q from public.questions where active order by random() limit 1; end if;
    if q is null then raise exception 'sem_perguntas'; end if;
  end if;
  select coalesce(max(r.n), 0) + 1 into n from public.rounds r where r.room_id = p_room;
  insert into public.rounds (room_id, match_id, n, question_id, kind, ends_at, force, dif)
    values (p_room, p_match, n, q, case when p_kind = 'chest' then 'chest' else 'q' end, now() + (secs + 4) * interval '1 second', fm, dif) returning * into rd;
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
