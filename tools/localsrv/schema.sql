create sequence public.join_fails_id_seq;
create sequence public.round_items_id_seq;
create table public.question_keys (question_id uuid not null, correct smallint not null);
create table public.questions (id uuid not null default gen_random_uuid(), rank smallint not null, theme text not null default 'Banco de Dados'::text, text text not null, options jsonb not null, created_at timestamp with time zone not null default now());
create table public.rooms (id uuid not null default gen_random_uuid(), code text not null, is_public boolean not null default true, name text, status text not null default 'lobby'::text, boss_idx smallint not null default 0, progress jsonb not null default '{"done": []}'::jsonb, battle jsonb not null default '{}'::jsonb, created_by uuid not null, created_at timestamp with time zone not null default now(), last_active_at timestamp with time zone not null default now());
create table public.room_players (room_id uuid not null, user_id uuid not null, grp text, joined_at timestamp with time zone not null default now(), last_seen timestamp with time zone not null default now());
create table public.room_groups (room_id uuid not null, grp text not null, gold integer not null default 0, inventory jsonb not null default '[]'::jsonb, hero jsonb not null default '{"cd": {}, "hp": 100, "mp": 100, "buffs": {}, "ult_cd": 0, "ult_ready": false}'::jsonb);
create table public.round_votes (round_id uuid not null, user_id uuid not null, grp text not null, option smallint not null, confirmed boolean not null default false, updated_at timestamp with time zone not null default now());
create table public.rounds (id uuid not null default gen_random_uuid(), room_id uuid not null, n integer not null, question_id uuid not null, status text not null default 'open'::text, started_at timestamp with time zone not null default now(), ends_at timestamp with time zone not null, correct_option smallint, match_id uuid, seed bigint not null default (floor((random() * (2147483647)::double precision)))::bigint, reveal_until timestamp with time zone, act_ends_at timestamp with time zone, played_at timestamp with time zone);
create table public.saves (id uuid not null default gen_random_uuid(), owner uuid not null, class text not null, slot smallint not null, name text not null, data jsonb not null default '{}'::jsonb, rev integer not null default 0, created_at timestamp with time zone not null default now(), updated_at timestamp with time zone not null default now());
create table public.merchant_proposals (id uuid not null default gen_random_uuid(), room_id uuid not null, grp text not null, kind text not null default 'buy'::text, item text, ask text, status text not null default 'open'::text, ends_at timestamp with time zone not null, created_at timestamp with time zone not null default now());
create table public.merchant_votes (proposal_id uuid not null, user_id uuid not null, vote boolean not null);
create table public.player_presence (room_id uuid not null, user_id uuid not null, last_seen timestamp with time zone not null default now());
create table public.join_fails (id bigint not null, user_id uuid not null, at timestamp with time zone not null default now());
create table public.profiles (user_id uuid not null, username text not null, recovery_hash text not null, created_at timestamp with time zone not null default now());
create table public.recovery_attempts (username text not null, tries integer not null default 0, locked_until timestamp with time zone);
create table public.round_groups (round_id uuid not null, grp text not null, locked boolean not null default false, chosen smallint, correct boolean, sim boolean not null default false, act_locked boolean not null default false, act_sim boolean not null default false, act jsonb, extra_secs integer not null default 0);
create table public.matches (id uuid not null default gen_random_uuid(), room_id uuid not null, boss smallint not null default 0, status text not null default 'playing'::text, started_by uuid not null, started_at timestamp with time zone not null default now(), ended_at timestamp with time zone, snapshot jsonb, snapshot_round integer);
create table public.act_votes (round_id uuid not null, user_id uuid not null, grp text not null, skill text not null, element text, target text, confirmed boolean not null default false, updated_at timestamp with time zone not null default now());
create table public.round_items (id bigint not null default nextval('round_items_id_seq'::regclass), round_id uuid not null, user_id uuid not null, grp text not null, item text not null, at timestamp with time zone not null default now());
create table public.round_acks (round_id uuid not null, user_id uuid not null, at timestamp with time zone not null default now());
create table public.match_stats (match_id uuid not null, user_id uuid not null, grp text, stats jsonb not null default '{}'::jsonb, updated_at timestamp with time zone not null default now());
alter table act_votes add constraint act_votes_element_check CHECK ((element = ANY (ARRAY['fire'::text, 'water'::text, 'air'::text, 'earth'::text])));
alter table act_votes add constraint act_votes_grp_check CHECK ((grp = ANY (ARRAY['mage'::text, 'guerreiro'::text, 'tank'::text, 'cleriga'::text])));
alter table act_votes add constraint act_votes_pkey PRIMARY KEY (round_id, user_id);
alter table act_votes add constraint act_votes_skill_check CHECK ((skill ~ '^[a-z0-9_]{1,24}$'::text));
alter table act_votes add constraint act_votes_target_check CHECK ((target = ANY (ARRAY['mage'::text, 'guerreiro'::text, 'tank'::text, 'cleriga'::text])));
alter table join_fails add constraint join_fails_pkey PRIMARY KEY (id);
alter table match_stats add constraint match_stats_pkey PRIMARY KEY (match_id, user_id);
alter table matches add constraint matches_pkey PRIMARY KEY (id);
alter table matches add constraint matches_status_check CHECK ((status = ANY (ARRAY['playing'::text, 'won'::text, 'lost'::text, 'aborted'::text])));
alter table merchant_proposals add constraint merchant_proposals_grp_check CHECK ((grp = ANY (ARRAY['mage'::text, 'guerreiro'::text, 'tank'::text, 'cleriga'::text])));
alter table merchant_proposals add constraint merchant_proposals_kind_check CHECK ((kind = ANY (ARRAY['buy'::text, 'ultimate'::text])));
alter table merchant_proposals add constraint merchant_proposals_pkey PRIMARY KEY (id);
alter table merchant_proposals add constraint merchant_proposals_status_check CHECK ((status = ANY (ARRAY['open'::text, 'yes'::text, 'no'::text, 'tie'::text])));
alter table merchant_votes add constraint merchant_votes_pkey PRIMARY KEY (proposal_id, user_id);
alter table player_presence add constraint player_presence_pkey PRIMARY KEY (room_id, user_id);
alter table profiles add constraint profiles_pkey PRIMARY KEY (user_id);
alter table profiles add constraint profiles_username_check CHECK ((username ~ '^[a-z0-9_]{3,16}$'::text));
alter table profiles add constraint profiles_username_key UNIQUE (username);
alter table question_keys add constraint question_keys_correct_check CHECK ((correct >= 0));
alter table question_keys add constraint question_keys_pkey PRIMARY KEY (question_id);
alter table questions add constraint questions_options_check CHECK (((jsonb_typeof(options) = 'array'::text) AND ((jsonb_array_length(options) >= 2) AND (jsonb_array_length(options) <= 6))));
alter table questions add constraint questions_pkey PRIMARY KEY (id);
alter table questions add constraint questions_rank_check CHECK (((rank >= 1) AND (rank <= 5)));
alter table recovery_attempts add constraint recovery_attempts_pkey PRIMARY KEY (username);
alter table room_groups add constraint room_groups_gold_check CHECK ((gold >= 0));
alter table room_groups add constraint room_groups_grp_check CHECK ((grp = ANY (ARRAY['mage'::text, 'guerreiro'::text, 'tank'::text, 'cleriga'::text])));
alter table room_groups add constraint room_groups_pkey PRIMARY KEY (room_id, grp);
alter table room_players add constraint room_players_grp_check CHECK ((grp = ANY (ARRAY['mage'::text, 'guerreiro'::text, 'tank'::text, 'cleriga'::text])));
alter table room_players add constraint room_players_pkey PRIMARY KEY (room_id, user_id);
alter table rooms add constraint rooms_code_key UNIQUE (code);
alter table rooms add constraint rooms_pkey PRIMARY KEY (id);
alter table rooms add constraint rooms_status_check CHECK ((status = ANY (ARRAY['lobby'::text, 'battle'::text, 'ended'::text])));
alter table round_acks add constraint round_acks_pkey PRIMARY KEY (round_id, user_id);
alter table round_groups add constraint round_groups_grp_check CHECK ((grp = ANY (ARRAY['mage'::text, 'guerreiro'::text, 'tank'::text, 'cleriga'::text])));
alter table round_groups add constraint round_groups_pkey PRIMARY KEY (round_id, grp);
alter table round_items add constraint round_items_grp_check CHECK ((grp = ANY (ARRAY['mage'::text, 'guerreiro'::text, 'tank'::text, 'cleriga'::text])));
alter table round_items add constraint round_items_item_check CHECK ((item ~ '^[a-z0-9_]{1,24}$'::text));
alter table round_items add constraint round_items_pkey PRIMARY KEY (id);
alter table round_votes add constraint round_votes_grp_check CHECK ((grp = ANY (ARRAY['mage'::text, 'guerreiro'::text, 'tank'::text, 'cleriga'::text])));
alter table round_votes add constraint round_votes_option_check CHECK ((option >= 0));
alter table round_votes add constraint round_votes_pkey PRIMARY KEY (round_id, user_id);
alter table rounds add constraint rounds_pkey PRIMARY KEY (id);
alter table rounds add constraint rounds_room_id_n_key UNIQUE (room_id, n);
alter table rounds add constraint rounds_status_check CHECK ((status = ANY (ARRAY['open'::text, 'revealed'::text, 'acting'::text, 'played'::text])));
alter table saves add constraint saves_class_check CHECK ((class = ANY (ARRAY['mage'::text, 'guerreiro'::text, 'tank'::text, 'cleriga'::text])));
alter table saves add constraint saves_data_check CHECK ((octet_length((data)::text) <= 200000));
alter table saves add constraint saves_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 20)));
alter table saves add constraint saves_owner_class_slot_key UNIQUE (owner, class, slot);
alter table saves add constraint saves_pkey PRIMARY KEY (id);
alter table saves add constraint saves_slot_check CHECK (((slot >= 1) AND (slot <= 4)));
alter table act_votes add constraint act_votes_round_id_fkey FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE;
alter table match_stats add constraint match_stats_match_id_fkey FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
alter table matches add constraint matches_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
alter table merchant_proposals add constraint merchant_proposals_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
alter table merchant_votes add constraint merchant_votes_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES merchant_proposals(id) ON DELETE CASCADE;
alter table player_presence add constraint player_presence_room_id_user_id_fkey FOREIGN KEY (room_id, user_id) REFERENCES room_players(room_id, user_id) ON DELETE CASCADE;
alter table profiles add constraint profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table question_keys add constraint question_keys_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
alter table room_groups add constraint room_groups_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
alter table room_players add constraint room_players_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
alter table round_acks add constraint round_acks_round_id_fkey FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE;
alter table round_groups add constraint round_groups_round_id_fkey FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE;
alter table round_items add constraint round_items_round_id_fkey FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE;
alter table round_votes add constraint round_votes_round_id_fkey FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE;
alter table rounds add constraint rounds_match_id_fkey FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
alter table rounds add constraint rounds_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id);
alter table rounds add constraint rounds_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
alter table saves add constraint saves_owner_fkey FOREIGN KEY (owner) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX room_players_room_id_grp_idx ON public.room_players USING btree (room_id, grp);
CREATE INDEX round_votes_round_id_grp_idx ON public.round_votes USING btree (round_id, grp);
CREATE INDEX merchant_proposals_room_id_grp_status_idx ON public.merchant_proposals USING btree (room_id, grp, status);
CREATE INDEX saves_owner_idx ON public.saves USING btree (owner);
CREATE INDEX rounds_question_id_idx ON public.rounds USING btree (question_id);
CREATE INDEX join_fails_user_id_at_idx ON public.join_fails USING btree (user_id, at);
CREATE UNIQUE INDEX matches_one_playing ON public.matches USING btree (room_id) WHERE (status = 'playing'::text);
CREATE INDEX matches_room ON public.matches USING btree (room_id, started_at DESC);
CREATE INDEX round_items_round ON public.round_items USING btree (round_id, id);
alter table public.question_keys enable row level security;
alter table public.questions enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.room_groups enable row level security;
alter table public.round_votes enable row level security;
alter table public.rounds enable row level security;
alter table public.saves enable row level security;
alter table public.merchant_proposals enable row level security;
alter table public.merchant_votes enable row level security;
alter table public.player_presence enable row level security;
alter table public.join_fails enable row level security;
alter table public.profiles enable row level security;
alter table public.recovery_attempts enable row level security;
alter table public.round_groups enable row level security;
alter table public.matches enable row level security;
alter table public.act_votes enable row level security;
alter table public.round_items enable row level security;
alter table public.round_acks enable row level security;
alter table public.match_stats enable row level security;
CREATE OR REPLACE FUNCTION public._active_in_group(p_room uuid, p_grp text)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select count(*)::int from public.room_players rp join public.player_presence pp using (room_id, user_id)
   where rp.room_id = p_room and rp.grp = p_grp and pp.last_seen > now() - interval '45 seconds' $function$
;
CREATE OR REPLACE FUNCTION public._new_recovery_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare al text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea := extensions.gen_random_bytes(12); s text := ''; i int;
begin
  for i in 0..11 loop
    s := s || substr(al, (get_byte(b,i) % 32) + 1, 1);
    if i in (3,7) then s := s || '-'; end if;
  end loop;
  return s;
end $function$
;
CREATE OR REPLACE FUNCTION public._new_round(p_room uuid, p_match uuid, p_rank integer)
 RETURNS rounds
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare rk int; q uuid; n int; rd public.rounds; g text;
begin
  rk := coalesce(p_rank, public._roll_rank());
  if rk not between 1 and 5 then raise exception 'rank_invalido'; end if;
  select id into q from public.questions
    where rank = rk and id not in (select question_id from public.rounds where room_id = p_room) order by random() limit 1;
  if q is null then select id into q from public.questions where rank = rk order by random() limit 1; end if;
  if q is null then select id into q from public.questions order by random() limit 1; end if;
  if q is null then raise exception 'sem_perguntas'; end if;
  select coalesce(max(r.n), 0) + 1 into n from public.rounds r where r.room_id = p_room;
  insert into public.rounds (room_id, match_id, n, question_id, ends_at)
    values (p_room, p_match, n, q, now() + interval '25 seconds') returning * into rd;
  foreach g in array array['mage','guerreiro','tank','cleriga'] loop
    if public._active_in_group(p_room, g) > 0 then
      insert into public.round_groups (round_id, grp) values (rd.id, g);
    else
      insert into public.round_groups (round_id, grp, locked, sim) values (rd.id, g, true, true);
    end if;
  end loop;
  update public.rooms set status = 'battle', last_active_at = now() where id = p_room;
  return rd;
end $function$
;
CREATE OR REPLACE FUNCTION public._pick_action(p_round uuid, p_grp text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare nconf int; res jsonb;
begin
  select count(*) into nconf from public.act_votes where round_id = p_round and grp = p_grp and confirmed and skill <> 'none';
  with t as (
    select skill, element, target, count(*) n from public.act_votes
    where round_id = p_round and grp = p_grp and skill <> 'none' and (nconf = 0 or confirmed)
    group by 1, 2, 3),
  m as (select max(n) mx from t)
  select jsonb_build_object('skill', t.skill, 'element', t.element, 'target', t.target) into res
  from t, m where t.n = m.mx order by random() limit 1;
  return res;
end $function$
;
CREATE OR REPLACE FUNCTION public._pick_option(p_round uuid, p_grp text)
 RETURNS smallint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare nconf int; res smallint;
begin
  select count(*) into nconf from public.round_votes where round_id = p_round and grp = p_grp and confirmed;
  with t as (
    select option, count(*) n from public.round_votes
    where round_id = p_round and grp = p_grp and (nconf = 0 or confirmed) group by option),
  m as (select max(n) mx from t)
  select t.option into res from t, m where t.n = m.mx order by random() limit 1;
  return res;
end $function$
;
CREATE OR REPLACE FUNCTION public._resolve_proposal(p_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p public.merchant_proposals; act int; need int; y int; n int; res text;
begin
  select * into p from public.merchant_proposals where id = p_id for update;
  if not found then return null; end if;
  if p.status <> 'open' then return p.status; end if;
  select greatest(1, count(*)) into act from public.room_players rp join public.player_presence pp using (room_id, user_id)
    where rp.room_id = p.room_id and rp.grp = p.grp and pp.last_seen > now() - interval '45 seconds';
  need := act / 2 + 1;
  select count(*) filter (where vote), count(*) filter (where not vote) into y, n from public.merchant_votes where proposal_id = p_id;
  if y >= need then res := 'yes';
  elsif n >= need then res := 'no';
  elsif now() >= p.ends_at or y + n >= act then
    res := case when y > n then 'yes' when n > y then 'no' else 'tie' end;
  end if;
  if res is not null then update public.merchant_proposals set status = res where id = p_id; return res; end if;
  return 'open';
end $function$
;
CREATE OR REPLACE FUNCTION public._roll_rank()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ declare r double precision := random(); begin
  return case when r < .30 then 1 when r < .60 then 2 when r < .85 then 3 when r < .95 then 4 else 5 end;
end $function$
;
CREATE OR REPLACE FUNCTION public._try_close(p_round uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare rd public.rounds; g record; due boolean; n_active int; n_conf int; k smallint;
begin
  select * into rd from public.rounds where id = p_round for update;
  if not found then return; end if;

  if rd.status = 'open' then
    for g in select * from public.round_groups where round_id = p_round and not locked loop
      n_active := public._active_in_group(rd.room_id, g.grp);
      select count(*) into n_conf from public.round_votes rv join public.player_presence pp on pp.room_id = rd.room_id and pp.user_id = rv.user_id
        where rv.round_id = p_round and rv.grp = g.grp and rv.confirmed and pp.last_seen > now() - interval '45 seconds';
      due := now() >= rd.ends_at + g.extra_secs * interval '1 second';
      if n_active = 0 then
        update public.round_groups set locked = true, sim = true where round_id = p_round and grp = g.grp;
      elsif due or n_conf >= n_active then
        update public.round_groups set locked = true, chosen = public._pick_option(p_round, g.grp) where round_id = p_round and grp = g.grp;
      end if;
    end loop;
    if not exists (select 1 from public.round_groups where round_id = p_round and not locked) then
      select correct into k from public.question_keys where question_id = rd.question_id;
      update public.round_groups set correct = case when sim then random() < .6 else (chosen is not null and chosen = k) end,
        act_locked = sim, act_sim = sim
        where round_id = p_round;
      update public.rounds set status = 'revealed', correct_option = k, reveal_until = now() + interval '4 seconds' where id = p_round;
      select * into rd from public.rounds where id = p_round;
    end if;
  end if;

  if rd.status = 'revealed' and now() >= rd.reveal_until then
    update public.rounds set status = 'acting', act_ends_at = now() + interval '25 seconds' where id = p_round;
    select * into rd from public.rounds where id = p_round;
  end if;

  if rd.status = 'acting' then
    for g in select * from public.round_groups where round_id = p_round and not act_locked loop
      n_active := public._active_in_group(rd.room_id, g.grp);
      select count(*) into n_conf from public.act_votes av join public.player_presence pp on pp.room_id = rd.room_id and pp.user_id = av.user_id
        where av.round_id = p_round and av.grp = g.grp and av.confirmed and pp.last_seen > now() - interval '45 seconds';
      due := now() >= rd.act_ends_at;
      if n_active = 0 then
        update public.round_groups set act_locked = true, act_sim = true where round_id = p_round and grp = g.grp;
      elsif due or n_conf >= n_active then
        update public.round_groups set act_locked = true, act = public._pick_action(p_round, g.grp) where round_id = p_round and grp = g.grp;
      end if;
    end loop;
    if not exists (select 1 from public.round_groups where round_id = p_round and not act_locked) then
      update public.rounds set status = 'played', played_at = now() where id = p_round;
    end if;
  end if;
end $function$
;
CREATE OR REPLACE FUNCTION public._uid_account()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'nao_autenticado'; end if;
  if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then raise exception 'precisa_de_conta'; end if;
  return u;
end $function$
;
CREATE OR REPLACE FUNCTION public.ack_round(p_round uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); rd public.rounds;
begin
  select * into rd from public.rounds where id = p_round;
  if not found or not public.is_member(rd.room_id) then raise exception 'fora_da_sala'; end if;
  insert into public.round_acks (round_id, user_id) values (p_round, uid) on conflict do nothing;
  update public.player_presence set last_seen = now() where room_id = rd.room_id and user_id = uid;
end $function$
;
CREATE OR REPLACE FUNCTION public.advance_round(p_room uuid, p_rank integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m public.matches; rd public.rounds; a int; k int; nr public.rounds;
begin
  perform 1 from public.rooms where id = p_room for update;
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  select * into m from public.matches where room_id = p_room and status = 'playing';
  if not found then raise exception 'sem_partida'; end if;
  select * into rd from public.rounds where match_id = m.id order by n desc limit 1;
  perform public._try_close(rd.id);
  select * into rd from public.rounds where id = rd.id;
  if rd.status = 'played' then
    select count(*) into a from public.room_players rp join public.player_presence pp using (room_id, user_id)
      where rp.room_id = p_room and rp.grp is not null and pp.last_seen > now() - interval '45 seconds';
    select count(*) into k from public.round_acks ak join public.room_players rp on rp.room_id = p_room and rp.user_id = ak.user_id
      join public.player_presence pp on pp.room_id = p_room and pp.user_id = ak.user_id
      where ak.round_id = rd.id and rp.grp is not null and pp.last_seen > now() - interval '45 seconds';
    if k >= a or now() >= rd.played_at + interval '60 seconds' then
      nr := public._new_round(p_room, m.id, p_rank);
      return jsonb_build_object('ok', true, 'round', to_jsonb(nr));
    end if;
    return jsonb_build_object('ok', false, 'wait', true, 'acks', k, 'need', a);
  end if;
  return jsonb_build_object('ok', true, 'round', to_jsonb(rd));
end $function$
;
CREATE OR REPLACE FUNCTION public.cast_action(p_round uuid, p_skill text, p_element text DEFAULT NULL::text, p_target text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); rd public.rounds; g text; rg public.round_groups; v public.act_votes;
begin
  select * into rd from public.rounds where id = p_round for update;
  if not found or not public.is_member(rd.room_id) then raise exception 'fora_da_sala'; end if;
  g := public.my_group(rd.room_id);
  if g is null then raise exception 'sem_grupo'; end if;
  perform public._try_close(p_round);
  select * into rd from public.rounds where id = p_round;
  if rd.status <> 'acting' or now() >= rd.act_ends_at then raise exception 'fase_encerrada'; end if;
  select * into rg from public.round_groups where round_id = p_round and grp = g;
  if not found then raise exception 'grupo_fora_da_rodada'; end if;
  if rg.act_locked then raise exception 'grupo_travado'; end if;
  if p_skill is null or p_skill !~ '^[a-z0-9_]{1,24}$' then raise exception 'acao_invalida'; end if;
  if p_element is not null and p_element not in ('fire','water','air','earth') then raise exception 'elemento_invalido'; end if;
  if p_target is not null and p_target not in ('mage','guerreiro','tank','cleriga') then raise exception 'alvo_invalido'; end if;
  select * into v from public.act_votes where round_id = p_round and user_id = uid;
  if p_skill = 'none' then
    insert into public.act_votes (round_id, user_id, grp, skill, confirmed) values (p_round, uid, g, 'none', true)
      on conflict (round_id, user_id) do update set skill = 'none', element = null, target = null, confirmed = true, updated_at = now();
  elsif not found then
    insert into public.act_votes (round_id, user_id, grp, skill, element, target) values (p_round, uid, g, p_skill, p_element, p_target);
  elsif v.confirmed then
    null;
  elsif v.skill = p_skill and v.element is not distinct from p_element and v.target is not distinct from p_target then
    update public.act_votes set confirmed = true, updated_at = now() where round_id = p_round and user_id = uid;
  else
    update public.act_votes set skill = p_skill, element = p_element, target = p_target, updated_at = now() where round_id = p_round and user_id = uid;
  end if;
  update public.player_presence set last_seen = now() where room_id = rd.room_id and user_id = uid;
  perform public._try_close(p_round);
  select * into v from public.act_votes where round_id = p_round and user_id = uid;
  return jsonb_build_object('skill', v.skill, 'element', v.element, 'target', v.target, 'confirmed', v.confirmed);
end $function$
;
CREATE OR REPLACE FUNCTION public.cast_vote(p_round uuid, p_option integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); rd public.rounds; g text; nopt int; v public.round_votes; locked_ boolean;
begin
  select * into rd from public.rounds where id = p_round for update;
  if not found or not public.is_member(rd.room_id) then raise exception 'fora_da_sala'; end if;
  g := public.my_group(rd.room_id);
  if g is null then raise exception 'sem_grupo'; end if;
  if rd.status <> 'open' or now() >= rd.ends_at then raise exception 'rodada_encerrada'; end if;
  select locked into locked_ from public.round_groups where round_id = p_round and grp = g;
  if locked_ is null then raise exception 'grupo_fora_da_rodada'; end if;
  if locked_ then raise exception 'grupo_travado'; end if;
  select jsonb_array_length(options) into nopt from public.questions where id = rd.question_id;
  if p_option is null or p_option < 0 or p_option >= nopt then raise exception 'alternativa_invalida'; end if;
  select * into v from public.round_votes where round_id = p_round and user_id = uid;
  if not found then
    insert into public.round_votes (round_id, user_id, grp, option) values (p_round, uid, g, p_option);
  elsif v.confirmed then
    null;
  elsif v.option = p_option then
    update public.round_votes set confirmed = true, updated_at = now() where round_id = p_round and user_id = uid;
  else
    update public.round_votes set option = p_option, updated_at = now() where round_id = p_round and user_id = uid;
  end if;
  update public.player_presence set last_seen = now() where room_id = rd.room_id and user_id = uid;
  perform public._try_close(p_round);
  select * into v from public.round_votes where round_id = p_round and user_id = uid;
  return jsonb_build_object('option', v.option, 'confirmed', v.confirmed);
end $function$
;
CREATE OR REPLACE FUNCTION public.close_if_due(p_round uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare s text;
begin
  if not public.is_member(public.round_room(p_round)) then raise exception 'fora_da_sala'; end if;
  perform public._try_close(p_round);
  select status into s from public.rounds where id = p_round;
  return s;
end $function$
;
CREATE OR REPLACE FUNCTION public.close_proposal_if_due(p_proposal uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare i record;
begin
  select * into i from public.proposal_info(p_proposal);
  if not found or not public.is_member(i.room_id) or i.grp is distinct from public.my_group(i.room_id) then raise exception 'fora_do_grupo'; end if;
  return public._resolve_proposal(p_proposal);
end $function$
;
CREATE OR REPLACE FUNCTION public.create_room(p_public boolean DEFAULT true, p_name text DEFAULT NULL::text)
 RETURNS rooms
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); r public.rooms; c text; tries int := 0;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if uid is null then raise exception 'nao_autenticado'; end if;
  if (select count(*) from public.rooms where created_by = uid and status <> 'ended') >= 3 then raise exception 'limite_de_salas'; end if;
  loop
    c := '';
    for i in 1..6 loop c := c || substr(alphabet, 1 + (get_byte(uuid_send(gen_random_uuid()), 0) % 32), 1); end loop;
    begin
      insert into public.rooms (code, is_public, name, created_by)
      values (c, coalesce(p_public, true), left(nullif(trim(p_name), ''), 24), uid) returning * into r;
      exit;
    exception when unique_violation then
      tries := tries + 1; if tries > 10 then raise; end if;
    end;
  end loop;
  insert into public.room_groups (room_id, grp) select r.id, g from unnest(array['mage','guerreiro','tank','cleriga']) g;
  insert into public.room_players (room_id, user_id) values (r.id, uid);
  insert into public.player_presence (room_id, user_id) values (r.id, uid);
  return r;
end $function$
;
CREATE OR REPLACE FUNCTION public.create_save(p_class text, p_name text)
 RETURNS saves
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid := public._uid_account(); s smallint; r public.saves; nm text := btrim(coalesce(p_name,''));
begin
  if p_class not in ('mage','guerreiro','tank','cleriga') then raise exception 'classe_invalida'; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text || p_class, 0));
  select min(g) into s from generate_series(1,4) g where not exists (select 1 from public.saves x where x.owner = u and x.class = p_class and x.slot = g);
  if s is null then raise exception 'limite_de_saves'; end if;
  if nm = '' then nm := 'SAVE ' || s; end if;
  insert into public.saves(owner, class, slot, name) values (u, p_class, s, left(nm,20)) returning * into r;
  return r;
end $function$
;
CREATE OR REPLACE FUNCTION public.delete_save(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid := public._uid_account();
begin
  delete from public.saves where id = p_id and owner = u;
  if not found then raise exception 'save_nao_encontrado'; end if;
end $function$
;
CREATE OR REPLACE FUNCTION public.end_match(p_match uuid, p_result text)
 RETURNS matches
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m public.matches;
begin
  select * into m from public.matches where id = p_match for update;
  if not found or not public.is_member(m.room_id) then raise exception 'fora_da_sala'; end if;
  if p_result not in ('won','lost') then raise exception 'resultado_invalido'; end if;
  if m.status <> 'playing' then return m; end if;
  update public.matches set status = p_result, ended_at = now() where id = p_match returning * into m;
  update public.rooms set status = 'lobby', last_active_at = now(),
    progress = case when p_result = 'won' and not (progress->'done') @> to_jsonb(m.boss) then
      jsonb_set(progress, '{done}', coalesce(progress->'done', '[]'::jsonb) || to_jsonb(m.boss)) else progress end
    where id = m.room_id;
  return m;
end $function$
;
CREATE OR REPLACE FUNCTION public.heartbeat(p_room uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid());
begin
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  update public.player_presence set last_seen = now() where room_id = p_room and user_id = uid;
  update public.rooms set last_active_at = now() where id = p_room and last_active_at < now() - interval '5 minutes';
end $function$
;
CREATE OR REPLACE FUNCTION public.is_member(p_room uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (select 1 from public.room_players where room_id = p_room and user_id = (select auth.uid()));
$function$
;
CREATE OR REPLACE FUNCTION public.join_room(p_room uuid DEFAULT NULL::uuid, p_code text DEFAULT NULL::text)
 RETURNS rooms
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); r public.rooms;
begin
  if uid is null then raise exception 'nao_autenticado'; end if;
  if p_code is not null and length(trim(p_code)) > 0 then
    if (select count(*) from public.join_fails where user_id = uid and at > now() - interval '10 minutes') >= 10 then raise exception 'muitas_tentativas'; end if;
    select * into r from public.rooms where code = upper(trim(p_code)) and status <> 'ended';
    if not found then
      -- registra a tentativa e devolve vazio (levantar erro aqui desfaria o registro e o limite nunca valeria)
      insert into public.join_fails (user_id) values (uid);
      return null;
    end if;
  else
    select * into r from public.rooms where id = p_room and status <> 'ended' and (is_public or public.is_member(id));
    if not found then raise exception 'sala_nao_encontrada'; end if;
  end if;
  insert into public.room_players (room_id, user_id) values (r.id, uid) on conflict do nothing;
  insert into public.player_presence (room_id, user_id) values (r.id, uid)
    on conflict (room_id, user_id) do update set last_seen = now();
  return r;
end $function$
;
CREATE OR REPLACE FUNCTION public.leave_room(p_room uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  delete from public.room_players where room_id = p_room and user_id = (select auth.uid());
$function$
;
CREATE OR REPLACE FUNCTION public.list_public_rooms()
 RETURNS TABLE(id uuid, name text, status text, boss_idx smallint, players integer, counts jsonb, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  where r.is_public and r.status <> 'ended'
    and (exists (select 1 from act where act.room_id = r.id) or r.created_at > now() - interval '10 minutes')
  order by 5 desc, r.created_at desc
  limit 50;
$function$
;
CREATE OR REPLACE FUNCTION public.match_report(p_match uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m public.matches; rounds_ jsonb; stats_ jsonb;
begin
  select * into m from public.matches where id = p_match;
  if not found or not public.is_member(m.room_id) then raise exception 'fora_da_sala'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'n', r.n, 'rank', q.rank, 'text', q.text, 'options', q.options, 'correct', r.correct_option,
      'groups', (select coalesce(jsonb_object_agg(rg.grp, jsonb_build_object('correct', rg.correct, 'chosen', rg.chosen, 'sim', rg.sim)), '{}'::jsonb)
                 from public.round_groups rg where rg.round_id = r.id)) order by r.n), '[]'::jsonb)
    into rounds_
    from public.rounds r join public.questions q on q.id = r.question_id
    where r.match_id = p_match and r.status in ('revealed','acting','played');
  select coalesce(jsonb_agg(jsonb_build_object('user', s.user_id, 'grp', s.grp, 'stats', s.stats)), '[]'::jsonb)
    into stats_ from public.match_stats s where s.match_id = p_match;
  return jsonb_build_object('match', to_jsonb(m) - 'snapshot', 'rounds', rounds_, 'players', stats_);
end $function$
;
CREATE OR REPLACE FUNCTION public.match_room(p_match uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select room_id from public.matches where id = p_match $function$
;
CREATE OR REPLACE FUNCTION public.my_group(p_room uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select grp from public.room_players where room_id = p_room and user_id = (select auth.uid());
$function$
;
CREATE OR REPLACE FUNCTION public.pick_group(p_room uuid, p_grp text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); cur text;
begin
  perform 1 from public.rooms where id = p_room for update;
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  select grp into cur from public.room_players where room_id = p_room and user_id = uid;
  if exists (select 1 from public.matches where room_id = p_room and status = 'playing') and cur is not null and p_grp is distinct from cur
    then raise exception 'partida_em_andamento'; end if;
  if p_grp is not null then
    if p_grp not in ('mage','guerreiro','tank','cleriga') then raise exception 'grupo_invalido'; end if;
    if (select count(*) from public.room_players rp join public.player_presence pp using (room_id, user_id)
        where rp.room_id = p_room and rp.grp = p_grp and rp.user_id <> uid and pp.last_seen > now() - interval '45 seconds') >= 7
    then raise exception 'grupo_cheio'; end if;
  end if;
  update public.room_players set grp = p_grp where room_id = p_room and user_id = uid;
  update public.player_presence set last_seen = now() where room_id = p_room and user_id = uid;
end $function$
;
CREATE OR REPLACE FUNCTION public.proposal_info(p_proposal uuid)
 RETURNS TABLE(room_id uuid, grp text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select room_id, grp from public.merchant_proposals where id = p_proposal;
$function$
;
CREATE OR REPLACE FUNCTION public.propose_merchant(p_room uuid, p_kind text, p_item text, p_ask text)
 RETURNS merchant_proposals
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare g text; cur public.merchant_proposals; p public.merchant_proposals;
begin
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  g := public.my_group(p_room);
  if g is null then raise exception 'sem_grupo'; end if;
  if p_kind not in ('buy','ultimate') then raise exception 'tipo_invalido'; end if;
  select * into cur from public.merchant_proposals where room_id = p_room and grp = g and status = 'open' order by created_at desc limit 1;
  if found then
    if public._resolve_proposal(cur.id) = 'open' then raise exception 'votacao_aberta'; end if;
  end if;
  insert into public.merchant_proposals (room_id, grp, kind, item, ask, ends_at)
    values (p_room, g, p_kind, left(p_item, 40), left(p_ask, 80), now() + interval '25 seconds') returning * into p;
  return p;
end $function$
;
CREATE OR REPLACE FUNCTION public.prune_rooms()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  delete from public.rooms r
  where r.created_at < now() - interval '30 minutes'
    and not exists (select 1 from public.player_presence pp where pp.room_id = r.id and pp.last_seen > now() - interval '30 minutes');
$function$
;
CREATE OR REPLACE FUNCTION public.put_snapshot(p_match uuid, p_round integer, p_state jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m public.matches;
begin
  select * into m from public.matches where id = p_match for update;
  if not found or not public.is_member(m.room_id) then raise exception 'fora_da_sala'; end if;
  if pg_column_size(p_state) > 40000 then raise exception 'snapshot_grande'; end if;
  if m.snapshot_round is not null and m.snapshot_round >= p_round then return false; end if;
  update public.matches set snapshot = p_state, snapshot_round = p_round where id = p_match;
  return true;
end $function$
;
CREATE OR REPLACE FUNCTION public.register_profile(p_username text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid := public._uid_account(); un text := lower(coalesce(p_username,'')); code text; mail text := lower(coalesce(auth.jwt()->>'email',''));
begin
  if un !~ '^[a-z0-9_]{3,16}$' then raise exception 'usuario_invalido'; end if;
  if mail <> un || '@cronicas-do-saber.app' then raise exception 'usuario_invalido'; end if;
  if exists (select 1 from public.profiles where user_id = u) then raise exception 'perfil_existe'; end if;
  code := public._new_recovery_code();
  begin
    insert into public.profiles(user_id, username, recovery_hash) values (u, un, extensions.crypt(replace(code,'-',''), extensions.gen_salt('bf')));
  exception when unique_violation then raise exception 'usuario_existe';
  end;
  return code;
end $function$
;
CREATE OR REPLACE FUNCTION public.rename_save(p_id uuid, p_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid := public._uid_account(); nm text := btrim(coalesce(p_name,''));
begin
  if char_length(nm) not between 1 and 20 then raise exception 'nome_invalido'; end if;
  update public.saves set name = nm, updated_at = now() where id = p_id and owner = u;
  if not found then raise exception 'save_nao_encontrado'; end if;
end $function$
;
CREATE OR REPLACE FUNCTION public.report_stats(p_match uuid, p_stats jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); m public.matches;
begin
  select * into m from public.matches where id = p_match;
  if not found or not public.is_member(m.room_id) then raise exception 'fora_da_sala'; end if;
  if pg_column_size(p_stats) > 6000 then raise exception 'relatorio_grande'; end if;
  insert into public.match_stats (match_id, user_id, grp, stats) values (p_match, uid, public.my_group(m.room_id), p_stats)
    on conflict (match_id, user_id) do update set stats = excluded.stats, grp = coalesce(excluded.grp, public.match_stats.grp), updated_at = now();
end $function$
;
CREATE OR REPLACE FUNCTION public.room_counts(p_room uuid)
 RETURNS TABLE(grp text, n integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  return query
    select g.grp, coalesce(c.n, 0)::int
    from (values ('mage'), ('guerreiro'), ('tank'), ('cleriga')) g(grp)
    left join (select rp.grp, count(*) n from public.room_players rp join public.player_presence pp using (room_id, user_id)
               where rp.room_id = p_room and rp.grp is not null and pp.last_seen > now() - interval '45 seconds' group by rp.grp) c on c.grp = g.grp;
end $function$
;
CREATE OR REPLACE FUNCTION public.rotate_recovery(p_user uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare code text := public._new_recovery_code();
begin
  update public.profiles set recovery_hash = extensions.crypt(replace(code,'-',''), extensions.gen_salt('bf')) where user_id = p_user;
  return code;
end $function$
;
CREATE OR REPLACE FUNCTION public.round_is_revealed(p_round uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select coalesce((select status <> 'open' from public.rounds where id = p_round), false); $function$
;
CREATE OR REPLACE FUNCTION public.round_room(p_round uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select room_id from public.rounds where id = p_round;
$function$
;
CREATE OR REPLACE FUNCTION public.start_match(p_room uuid, p_boss integer DEFAULT 0)
 RETURNS matches
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); m public.matches;
begin
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
  perform public._new_round(p_room, m.id, null);
  update public.rooms set boss_idx = p_boss where id = p_room;
  return m;
end $function$
;
CREATE OR REPLACE FUNCTION public.start_round(p_room uuid, p_rank integer DEFAULT NULL::integer)
 RETURNS rounds
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare rk int; q uuid; n int; rd public.rounds;
begin
  perform 1 from public.rooms where id = p_room for update;
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  if exists (select 1 from public.rounds where room_id = p_room and status = 'open') then raise exception 'rodada_aberta'; end if;
  if p_rank is not null and p_rank not between 1 and 5 then raise exception 'rank_invalido'; end if;
  rk := coalesce(p_rank, 1 + (get_byte(uuid_send(gen_random_uuid()), 0) % 5));
  select id into q from public.questions
    where rank = rk and id not in (select question_id from public.rounds where room_id = p_room) order by random() limit 1;
  if q is null then select id into q from public.questions where rank = rk order by random() limit 1; end if;
  if q is null then select id into q from public.questions order by random() limit 1; end if;
  if q is null then raise exception 'sem_perguntas'; end if;
  select coalesce(max(r.n), 0) + 1 into n from public.rounds r where r.room_id = p_room;
  insert into public.rounds (room_id, n, question_id, ends_at) values (p_room, n, q, now() + interval '25 seconds') returning * into rd;
  insert into public.round_groups (round_id, grp)
    select distinct rd.id, rp.grp from public.room_players rp join public.player_presence pp using (room_id, user_id)
    where rp.room_id = p_room and rp.grp is not null and pp.last_seen > now() - interval '45 seconds';
  update public.rooms set status = 'battle', last_active_at = now() where id = p_room;
  return rd;
end $function$
;
CREATE OR REPLACE FUNCTION public.use_item(p_round uuid, p_item text, p_extra integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); rd public.rounds; g text; rg public.round_groups; n int; ex int := 0;
begin
  select * into rd from public.rounds where id = p_round for update;
  if not found or not public.is_member(rd.room_id) then raise exception 'fora_da_sala'; end if;
  g := public.my_group(rd.room_id);
  if g is null then raise exception 'sem_grupo'; end if;
  if p_item is null or p_item !~ '^[a-z0-9_]{1,24}$' then raise exception 'item_invalido'; end if;
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
  insert into public.round_items (round_id, user_id, grp, item) values (p_round, uid, g, p_item);
  return jsonb_build_object('extra', ex, 'extra_total', rg.extra_secs + ex);
end $function$
;
CREATE OR REPLACE FUNCTION public.verify_recovery(p_username text, p_code text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare un text := lower(coalesce(p_username,'')); pr public.profiles; ra public.recovery_attempts;
begin
  select * into ra from public.recovery_attempts where username = un;
  if found and ra.locked_until is not null and ra.locked_until > now() then raise exception 'muitas_tentativas'; end if;
  select * into pr from public.profiles where username = un;
  if not found or pr.recovery_hash <> extensions.crypt(replace(upper(coalesce(p_code,'')),'-',''), pr.recovery_hash) then
    insert into public.recovery_attempts(username, tries) values (un, 1)
      on conflict (username) do update set tries = public.recovery_attempts.tries + 1,
        locked_until = case when public.recovery_attempts.tries + 1 >= 5 then now() + interval '15 minutes' else public.recovery_attempts.locked_until end;
    raise exception 'codigo_invalido';
  end if;
  update public.recovery_attempts set tries = 0, locked_until = null where username = un;
  return pr.user_id;
end $function$
;
CREATE OR REPLACE FUNCTION public.vote_merchant(p_proposal uuid, p_vote boolean)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid()); i record; st text;
begin
  select * into i from public.proposal_info(p_proposal);
  if not found or not public.is_member(i.room_id) or i.grp is distinct from public.my_group(i.room_id) then raise exception 'fora_do_grupo'; end if;
  st := public._resolve_proposal(p_proposal);
  if st <> 'open' then return st; end if;
  insert into public.merchant_votes (proposal_id, user_id, vote) values (p_proposal, uid, p_vote)
    on conflict (proposal_id, user_id) do update set vote = excluded.vote;
  return public._resolve_proposal(p_proposal);
end $function$
;
CREATE OR REPLACE FUNCTION public.write_save(p_id uuid, p_data jsonb, p_rev integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid := public._uid_account(); n int;
begin
  update public.saves set data = coalesce(p_data,'{}'::jsonb), rev = rev + 1, updated_at = now()
   where id = p_id and owner = u and rev = p_rev returning rev into n;
  if n is null then raise exception 'save_desatualizado'; end if;
  return n;
end $function$
;
create policy q_read on public.questions for SELECT using (true);
create policy rooms_read on public.rooms for SELECT using (is_member(id));
create policy players_read on public.room_players for SELECT using (is_member(room_id));
create policy groups_read on public.room_groups for SELECT using (is_member(room_id));
create policy rv_read on public.round_votes for SELECT using ((is_member(round_room(round_id)) AND (grp = my_group(round_room(round_id)))));
create policy rounds_read on public.rounds for SELECT using (is_member(room_id));
create policy saves_own_read on public.saves for SELECT using ((owner = ( SELECT auth.uid() AS uid)));
create policy mp_read on public.merchant_proposals for SELECT using ((is_member(room_id) AND (grp = my_group(room_id))));
create policy mv_read on public.merchant_votes for SELECT using ((EXISTS ( SELECT 1
   FROM proposal_info(merchant_votes.proposal_id) i(room_id, grp)
  WHERE (is_member(i.room_id) AND (i.grp = my_group(i.room_id))))));
create policy profiles_own_read on public.profiles for SELECT using ((user_id = ( SELECT auth.uid() AS uid)));
create policy rg_read on public.round_groups for SELECT using ((is_member(round_room(round_id)) AND ((grp = my_group(round_room(round_id))) OR round_is_revealed(round_id))));
create policy matches_read on public.matches for SELECT using (is_member(room_id));
create policy av_read on public.act_votes for SELECT using ((is_member(round_room(round_id)) AND (grp = my_group(round_room(round_id)))));
create policy ri_read on public.round_items for SELECT using ((is_member(round_room(round_id)) AND (grp = my_group(round_room(round_id)))));
create policy ms_read on public.match_stats for SELECT using (is_member(match_room(match_id)));