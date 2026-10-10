-- Partidas abandonadas: se ninguem da sala deu sinal por 3 horas, a partida e encerrada como abandonada (sem vitoria) e a sala volta ao lobby.
create function public._expire_match(p_room uuid) returns void language plpgsql security definer set search_path = '' as
$$
begin
  update public.matches m set status = 'aborted', ended_at = now()
    where m.room_id = p_room and m.status = 'playing'
      and not exists (select 1 from public.player_presence pp where pp.room_id = p_room and pp.last_seen > now() - interval '3 hours');
  if found then update public.rooms set status = 'lobby', last_active_at = now() where id = p_room; end if;
end $$;
revoke all on function public._expire_match(uuid) from public, anon, authenticated;

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
  insert into public.matches (room_id, boss, started_by) values (p_room, p_boss, uid) returning * into m;
  perform public._new_round(p_room, m.id, null, 'q');
  update public.rooms set boss_idx = p_boss where id = p_room;
  return m;
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
    'me', me, 'members', members_);

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

do $$ begin
  revoke all on function public.start_match(uuid, int) from public, anon;
  grant execute on function public.start_match(uuid, int) to authenticated;
  revoke all on function public.match_state(uuid, boolean) from public, anon;
  grant execute on function public.match_state(uuid, boolean) to authenticated;
end $$;
