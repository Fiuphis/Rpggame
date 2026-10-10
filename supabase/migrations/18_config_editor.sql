-- Etapa 5 e 6: tempo das perguntas por sala e editor de perguntas protegido por senha.
alter table public.rooms add column time_mode text not null default 'normal' check (time_mode in ('fast','normal','long'));
alter table public.questions add column active boolean not null default true;

-- configuracao da sala (so o criador, so antes da partida)
create function public.set_room_config(p_room uuid, p_time text) returns void language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid());
begin
  if p_time not in ('fast','normal','long') then raise exception 'config_invalida'; end if;
  if not exists (select 1 from public.rooms where id = p_room and created_by = uid) then raise exception 'so_o_criador'; end if;
  if exists (select 1 from public.matches where room_id = p_room and status = 'playing') then raise exception 'partida_em_andamento'; end if;
  update public.rooms set time_mode = p_time where id = p_room;
end $$;

-- tempo da pergunta por rank (C 25 s ... SS 45 s) x modo da sala (rapido 0,7 / normal 1 / longo 1,5) + 4 s para a abertura
create or replace function public._new_round(p_room uuid, p_match uuid, p_rank int, p_kind text) returns public.rounds language plpgsql security definer set search_path = '' as
$$
declare rk int; q uuid; n int; rd public.rounds; g text; secs int; mult numeric;
begin
  select case time_mode when 'fast' then 0.7 when 'long' then 1.5 else 1 end into mult from public.rooms where id = p_room;
  if p_kind = 'chest' then
    q := null; rk := null; secs := round(25 * coalesce(mult, 1));
  else
    rk := coalesce(p_rank, public._roll_rank());
    if rk not between 1 and 5 then raise exception 'rank_invalido'; end if;
    secs := round((20 + 5 * rk) * coalesce(mult, 1));
    select id into q from public.questions
      where active and rank = rk and id not in (select question_id from public.rounds where room_id = p_room and question_id is not null) order by random() limit 1;
    if q is null then select id into q from public.questions where active and rank = rk order by random() limit 1; end if;
    if q is null then select id into q from public.questions where active order by random() limit 1; end if;
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

-- editor de perguntas: senha unica guardada como hash; 5 erros bloqueiam por 15 min
create table public.editor_admin (id int primary key default 1 check (id = 1), hash text, tries int not null default 0, locked_until timestamptz);
alter table public.editor_admin enable row level security;
insert into public.editor_admin (id) values (1);

create function public._admin_ok(p_pass text) returns boolean language plpgsql security definer set search_path = '' as
$$
declare a public.editor_admin; h text;
begin
  select * into a from public.editor_admin where id = 1 for update;
  if a.hash is null then return false; end if;
  if a.locked_until is not null and a.locked_until > now() then return false; end if;
  h := encode(sha256(convert_to('bd1-editor:' || coalesce(p_pass, ''), 'utf8')), 'hex');
  if h = a.hash then update public.editor_admin set tries = 0, locked_until = null where id = 1; return true; end if;
  update public.editor_admin set locked_until = case when tries + 1 >= 5 then now() + interval '15 minutes' else locked_until end,
    tries = case when tries + 1 >= 5 then 0 else tries + 1 end where id = 1;
  return false;
end $$;

create function public.admin_questions(p_pass text) returns jsonb language plpgsql security definer set search_path = '' as
$$
begin
  if not public._admin_ok(p_pass) then return jsonb_build_object('ok', false, 'error', 'senha'); end if;
  return jsonb_build_object('ok', true, 'list', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'rank', q.rank, 'theme', q.theme, 'text', q.text, 'options', q.options, 'correct', k.correct) order by q.rank, q.created_at)
    from public.questions q join public.question_keys k on k.question_id = q.id where q.active), '[]'::jsonb));
end $$;

create function public.admin_save_questions(p_pass text, p_list jsonb) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare e jsonb; qid uuid; keep uuid[] := '{}'; rk int; cnt int := 0; ranks int[] := '{}';
begin
  if not public._admin_ok(p_pass) then return jsonb_build_object('ok', false, 'error', 'senha'); end if;
  if jsonb_typeof(p_list) <> 'array' or jsonb_array_length(p_list) > 500 then return jsonb_build_object('ok', false, 'error', 'lista_invalida'); end if;
  for e in select * from jsonb_array_elements(p_list) loop
    rk := (e->>'rank')::int;
    if rk not between 1 and 5 or coalesce(btrim(e->>'text'), '') = '' or length(e->>'text') > 600
       or jsonb_typeof(e->'options') <> 'array' or jsonb_array_length(e->'options') <> 4
       or exists (select 1 from jsonb_array_elements_text(e->'options') o where btrim(o) = '' or length(o) > 240)
       or (e->>'correct')::int not between 0 and 3 then
      return jsonb_build_object('ok', false, 'error', 'pergunta_invalida', 'n', cnt + 1);
    end if;
    qid := null;
    if e ? 'id' and (e->>'id') ~ '^[0-9a-f-]{36}$' then qid := (e->>'id')::uuid; end if;
    if qid is not null and exists (select 1 from public.questions where id = qid) then
      update public.questions set rank = rk, theme = left(coalesce(nullif(btrim(e->>'theme'), ''), 'Banco de Dados'), 60), text = btrim(e->>'text'), options = e->'options', active = true where id = qid;
      update public.question_keys set correct = (e->>'correct')::int where question_id = qid;
    else
      insert into public.questions (rank, theme, text, options) values (rk, left(coalesce(nullif(btrim(e->>'theme'), ''), 'Banco de Dados'), 60), btrim(e->>'text'), e->'options') returning id into qid;
      insert into public.question_keys (question_id, correct) values (qid, (e->>'correct')::int);
    end if;
    keep := keep || qid; ranks := ranks || rk; cnt := cnt + 1;
  end loop;
  if not (ranks @> array[1,2,3,4,5]) then raise exception 'faltam_ranks'; end if;
  update public.questions set active = false where id <> all (keep);
  return jsonb_build_object('ok', true, 'count', cnt);
end $$;

create function public.admin_set_password(p_old text, p_new text) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare a public.editor_admin;
begin
  if length(coalesce(p_new, '')) < 8 then return jsonb_build_object('ok', false, 'error', 'senha_curta'); end if;
  select * into a from public.editor_admin where id = 1;
  if a.hash is not null and not public._admin_ok(p_old) then return jsonb_build_object('ok', false, 'error', 'senha'); end if;
  update public.editor_admin set hash = encode(sha256(convert_to('bd1-editor:' || p_new, 'utf8')), 'hex'), tries = 0, locked_until = null where id = 1;
  return jsonb_build_object('ok', true);
end $$;

do $$ begin
  revoke all on function public.set_room_config(uuid, text) from public, anon;
  grant execute on function public.set_room_config(uuid, text) to authenticated;
  revoke all on function public._admin_ok(text) from public, anon, authenticated;
  revoke all on function public.admin_questions(text) from public, anon;
  grant execute on function public.admin_questions(text) to authenticated;
  revoke all on function public.admin_save_questions(text, jsonb) from public, anon;
  grant execute on function public.admin_save_questions(text, jsonb) to authenticated;
  revoke all on function public.admin_set_password(text, text) from public, anon;
  grant execute on function public.admin_set_password(text, text) to authenticated;
end $$;
