-- Etapa 2 do painel de adm: espectar. So leitura, sem entrar na sala (o adm nao ocupa vaga, nao aparece na lista e nao registra presenca).
-- admin_rooms(): salas nao encerradas (inclusive privadas) com seus jogadores. spectate_state(sala, classe): o mesmo estado que o jogador dessa classe
-- recebe em match_state, mais o gabarito (round.key, sempre preenchido; round.correct continua so depois da revelacao). Nao avanca rodada, nao grava presenca.

create or replace function public.admin_rooms() returns jsonb language plpgsql stable security definer set search_path = '' as
$$
begin
  if not public.is_admin() then raise exception 'sem_permissao'; end if;
  return coalesce((select jsonb_agg(x order by x->>'created_at' desc) from (
    select jsonb_build_object('id', r.id, 'code', r.code, 'name', r.name, 'status', r.status, 'public', r.is_public, 'boss_idx', r.boss_idx, 'created_at', r.created_at,
      'playing', exists (select 1 from public.matches m where m.room_id = r.id and m.status = 'playing'),
      'players', coalesce((select jsonb_agg(jsonb_build_object('grp', rp.grp, 'name', (select p.username from public.profiles p where p.user_id = rp.user_id),
          'active', coalesce(pp.last_seen > now() - interval '45 seconds', false)) order by rp.joined_at)
        from public.room_players rp left join public.player_presence pp on pp.room_id = rp.room_id and pp.user_id = rp.user_id where rp.room_id = r.id), '[]'::jsonb)) x
    from public.rooms r where r.status <> 'ended' order by r.created_at desc limit 50) t), '[]'::jsonb);
end $$;

create or replace function public.spectate_state(p_room uuid, p_grp text, p_snapshot boolean default false) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid; r public.rooms; m public.matches; rd public.rounds; me text; res jsonb := '{}'::jsonb;
  members_ jsonb; counts_ jsonb; round_ jsonb; vis boolean; groups_ jsonb; q jsonb; my_vote jsonb; my_act jsonb; tally jsonb; acts jsonb; items_ jsonb; acks_ int; prev_ jsonb;
begin
  if not public.is_admin() then raise exception 'sem_permissao'; end if;
  if p_grp not in ('mage','guerreiro','tank','cleriga') then raise exception 'grupo_invalido'; end if;
  select * into r from public.rooms where id = p_room;
  me := p_grp;
  select rp.user_id into uid from public.room_players rp where rp.room_id = p_room and rp.grp = p_grp limit 1;
  select * into m from public.matches where room_id = p_room order by started_at desc limit 1;

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
        'key', (select k.correct from public.question_keys k where k.question_id = rd.question_id),
        'groups', groups_, 'my_vote', my_vote, 'my_act', my_act, 'tally', tally, 'acts', acts, 'items', items_, 'acks', acks_);
      res := res || jsonb_build_object('round', round_);
    end if;
  end if;
  return res;
end $$;

do $$ begin
  revoke all on function public.admin_rooms() from public, anon;
  grant execute on function public.admin_rooms() to authenticated;
  revoke all on function public.spectate_state(uuid, text, boolean) from public, anon;
  grant execute on function public.spectate_state(uuid, text, boolean) to authenticated;
end $$;
