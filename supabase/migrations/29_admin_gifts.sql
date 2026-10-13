-- Etapa 3b-1 (v329): adm ajuda um jogador durante a luta (admin_act acao 'gift').
-- O presente entra no servidor com o numero da PROXIMA rodada e todos os aparelhos o aplicam no comeco dela (igual para todos):
--   heal (cura), revive (levanta heroi caido), mana: afetam a luta da sala inteira; gold (moedas) e item: so o aparelho do jogador alvo.
-- admin_act trava a linha da sala, como advance_round: o presente ou entra antes da rodada seguinte existir ou fica para a depois dela.

create table public.admin_gifts (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  rnd int not null,
  kind text not null check (kind in ('gold', 'item', 'heal', 'revive', 'mana')),
  grp text not null check (grp in ('mage', 'guerreiro', 'tank', 'cleriga')),
  amount int not null default 50,
  item text,
  at timestamptz not null default now()
);
create index admin_gifts_match_idx on public.admin_gifts (match_id, id desc);
alter table public.admin_gifts enable row level security;
revoke all on public.admin_gifts from public, anon, authenticated;

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

  select coalesce(jsonb_agg(jsonb_build_object('pid', public._pid(rp.room_id, rp.user_id), 'grp', rp.grp, 'me', rp.user_id = uid, 'owner', rp.user_id = r.created_by,
      'name', (select p.username from public.profiles p where p.user_id = rp.user_id),
      'active', coalesce(pp.last_seen > now() - interval '45 seconds', false)) order by rp.joined_at), '[]'::jsonb)
    into members_ from public.room_players rp left join public.player_presence pp on pp.room_id = rp.room_id and pp.user_id = rp.user_id where rp.room_id = p_room;

  res := jsonb_build_object('now', floor(extract(epoch from clock_timestamp()) * 1000)::bigint,
    'room', jsonb_build_object('id', r.id, 'code', r.code, 'name', r.name, 'status', r.status, 'boss_idx', r.boss_idx, 'progress', r.progress, 'owner', r.created_by = uid),
    'me', me, 'members', members_,
    'notices', coalesce((select jsonb_agg(jsonb_build_object('id', z.id, 'kind', z.kind, 'text', z.text) order by z.id)
      from (select * from public.room_notices nt where nt.room_id = p_room and nt.at > now() - interval '2 minutes' order by nt.id desc limit 10) z), '[]'::jsonb));

  if m.id is not null then
    res := res || jsonb_build_object('match', jsonb_build_object('id', m.id, 'status', m.status, 'boss', m.boss, 'seed', m.seed, 'started_at', m.started_at, 'ended_at', m.ended_at, 'snapshot_round', m.snapshot_round));
    res := res || jsonb_build_object('gifts', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'rnd', g.rnd, 'kind', g.kind, 'grp', g.grp, 'amount', g.amount, 'item', g.item) order by g.id) from (select * from public.admin_gifts where match_id = m.id order by id desc limit 60) g), '[]'::jsonb));
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
    res := res || jsonb_build_object('gifts', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'rnd', g.rnd, 'kind', g.kind, 'grp', g.grp, 'amount', g.amount, 'item', g.item) order by g.id) from (select * from public.admin_gifts where match_id = m.id order by id desc limit 60) g), '[]'::jsonb));
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

create or replace function public.admin_act(p_room uuid, p_action text, p_arg jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; m public.matches; rd public.rounds; nm text; secs int; t text; g text; tu uuid; msg text;
begin
  if not public.is_admin() then raise exception 'sem_permissao'; end if;
  if p_action not in ('msg', 'time', 'close', 'chest', 'kick', 'forgive', 'end', 'delete', 'gift') then raise exception 'acao_invalida'; end if;
  perform 1 from public.rooms where id = p_room for update;
  select * into r from public.rooms where id = p_room;
  if not found or r.status = 'ended' then raise exception 'sala_nao_encontrada'; end if;
  select username into nm from public.profiles where user_id = uid;
  select * into m from public.matches where room_id = p_room and status = 'playing';
  if p_action in ('time', 'close', 'chest', 'gift') and m.id is null then raise exception 'sem_partida'; end if;
  if m.id is not null then select * into rd from public.rounds where match_id = m.id order by n desc limit 1; end if;

  if p_action = 'msg' then
    t := btrim(coalesce(p_arg->>'text', ''));
    if char_length(t) < 1 or char_length(t) > 120 then raise exception 'mensagem_invalida'; end if;
    msg := t;
  elsif p_action = 'time' then
    secs := least(60, greatest(5, coalesce((p_arg->>'secs')::int, 15)));
    if rd.status = 'open' then update public.rounds set ends_at = ends_at + secs * interval '1 second' where id = rd.id;
    elsif rd.status = 'acting' then update public.rounds set act_ends_at = act_ends_at + secs * interval '1 second' where id = rd.id;
    else raise exception 'rodada_sem_tempo'; end if;
    msg := 'A administração concedeu mais tempo.';
  elsif p_action = 'close' then
    if rd.status = 'open' then
      update public.round_groups set extra_secs = 0 where round_id = rd.id;
      update public.rounds set ends_at = now() where id = rd.id;
    elsif rd.status = 'acting' then update public.rounds set act_ends_at = now() where id = rd.id;
    else raise exception 'rodada_sem_tempo'; end if;
    perform public._try_close(rd.id);
    msg := 'A administração encerrou esta fase.';
  elsif p_action = 'chest' then
    update public.rooms set force_chest = true where id = p_room;
    msg := 'A administração preparou uma arca para a próxima rodada.';
  elsif p_action = 'kick' then
    if p_arg ? 'pid' then select user_id into tu from public.room_players where room_id = p_room and public._pid(room_id, user_id) = p_arg->>'pid';
    else g := p_arg->>'grp'; select user_id into tu from public.room_players where room_id = p_room and grp = g limit 1; end if;
    if tu is null then raise exception 'jogador_nao_encontrado'; end if;
    perform public._ban_user(p_room, tu, uid);
    msg := 'A administração removeu um jogador da sala.';
  elsif p_action = 'forgive' then
    if not public._unban(p_room, p_arg->>'pid') then raise exception 'jogador_nao_encontrado'; end if;
    msg := 'A administração perdoou um jogador expulso.';
  elsif p_action = 'gift' then
    g := p_arg->>'grp'; t := p_arg->>'kind';
    if g is null or g not in ('mage', 'guerreiro', 'tank', 'cleriga') then raise exception 'grupo_invalido'; end if;
    if t is null or t not in ('gold', 'item', 'heal', 'revive', 'mana') then raise exception 'presente_invalido'; end if;
    if t = 'item' and char_length(coalesce(p_arg->>'item', '')) not between 1 and 24 then raise exception 'presente_invalido'; end if;
    secs := least(1000, greatest(1, coalesce((p_arg->>'amount')::int, 50)));
    insert into public.admin_gifts (room_id, match_id, rnd, kind, grp, amount, item) values (p_room, m.id, rd.n + 1, t, g, secs, case when t = 'item' then p_arg->>'item' end);
    msg := 'A administração enviou ajuda a um jogador.';
  elsif p_action = 'end' then
    update public.matches set status = 'aborted', ended_at = now() where room_id = p_room and status = 'playing';
    update public.rooms set status = 'lobby', last_active_at = now() where id = p_room;
    msg := 'A administração encerrou a partida.';
  else
    update public.matches set status = 'aborted', ended_at = now() where room_id = p_room and status = 'playing';
    update public.rooms set status = 'ended', last_active_at = now() where id = p_room;
    msg := 'A administração encerrou a sala.';
  end if;
  insert into public.room_notices (room_id, kind, text) values (p_room, p_action, msg);
  insert into public.admin_log (admin_id, admin_name, room_id, action, detail) values (uid, nm, p_room, p_action, coalesce(p_arg, '{}'::jsonb));
  return jsonb_build_object('ok', true, 'action', p_action);
end $$;

do $$ begin
  revoke all on function public.match_state(uuid, boolean) from public, anon;
  grant execute on function public.match_state(uuid, boolean) to authenticated;
  revoke all on function public.spectate_state(uuid, text, boolean) from public, anon;
  grant execute on function public.spectate_state(uuid, text, boolean) to authenticated;
  revoke all on function public.admin_act(uuid, text, jsonb) from public, anon;
  grant execute on function public.admin_act(uuid, text, jsonb) to authenticated;
end $$;
