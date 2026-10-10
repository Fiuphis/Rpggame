-- Etapa 1c: itens com alvo e fase (aplicados nos pontos de sincronia), tempo da pergunta por rank.

alter table public.round_items add column ph text not null default 'open' check (ph in ('open','revealed','acting')),
  add column target text check (target in ('mage','guerreiro','tank','cleriga'));

create function public.round_use_item(p_round uuid, p_item text, p_target text default null, p_extra int default 0) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); rd public.rounds; g text; rg public.round_groups; n int; ex int := 0;
begin
  select * into rd from public.rounds where id = p_round for update;
  if not found or not public.is_member(rd.room_id) then raise exception 'fora_da_sala'; end if;
  g := public.my_group(rd.room_id);
  if g is null then raise exception 'sem_grupo'; end if;
  if p_item is null or p_item !~ '^[a-z0-9_]{1,24}$' then raise exception 'item_invalido'; end if;
  if p_target is not null and p_target not in ('mage','guerreiro','tank','cleriga') then raise exception 'alvo_invalido'; end if;
  perform public._try_close(p_round);
  select * into rd from public.rounds where id = p_round;
  if rd.status not in ('open','revealed','acting') then raise exception 'fase_encerrada'; end if;
  select * into rg from public.round_groups where round_id = p_round and grp = g;
  if not found then raise exception 'grupo_fora_da_rodada'; end if;
  select count(*) into n from public.round_items where round_id = p_round and user_id = uid;
  if n >= 8 then raise exception 'limite_de_itens'; end if;
  if coalesce(p_extra, 0) > 0 then
    if rd.status <> 'open' or rg.locked then raise exception 'tempo_encerrado'; end if;
    ex := least(p_extra, 15, 45 - rg.extra_secs);
    if ex > 0 then update public.round_groups set extra_secs = extra_secs + ex where round_id = p_round and grp = g; end if;
  end if;
  insert into public.round_items (round_id, user_id, grp, item, ph, target) values (p_round, uid, g, p_item, rd.status, coalesce(p_target, g));
  return jsonb_build_object('extra', ex, 'extra_total', rg.extra_secs + ex, 'ph', rd.status);
end $$;

-- tempo da pergunta por rank (C 25 s ... SS 45 s) + 4 s para a abertura da rodada; arca 25 s + 4 s
create or replace function public._new_round(p_room uuid, p_match uuid, p_rank int, p_kind text) returns public.rounds language plpgsql security definer set search_path = '' as
$$
declare rk int; q uuid; n int; rd public.rounds; g text; secs int;
begin
  if p_kind = 'chest' then
    q := null; rk := null; secs := 25;
  else
    rk := coalesce(p_rank, public._roll_rank());
    if rk not between 1 and 5 then raise exception 'rank_invalido'; end if;
    secs := 20 + 5 * rk;
    select id into q from public.questions
      where rank = rk and id not in (select question_id from public.rounds where room_id = p_room and question_id is not null) order by random() limit 1;
    if q is null then select id into q from public.questions where rank = rk order by random() limit 1; end if;
    if q is null then select id into q from public.questions order by random() limit 1; end if;
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
  revoke all on function public.round_use_item(uuid, text, text, int) from public, anon;
  grant execute on function public.round_use_item(uuid, text, text, int) to authenticated;
  revoke all on function public.use_item(uuid, text, int) from public, anon, authenticated;
end $$;
