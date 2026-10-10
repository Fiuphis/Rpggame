-- O editor de perguntas passa a ser so da conta "fiuphis" (nome de usuario do perfil), sem senha propria.
create function public._is_editor() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.username = 'fiuphis') $$;

create function public.admin_get_questions() returns jsonb language plpgsql security definer set search_path = '' as
$$
begin
  if not public._is_editor() then return jsonb_build_object('ok', false, 'error', 'sem_permissao'); end if;
  return jsonb_build_object('ok', true, 'list', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'rank', q.rank, 'theme', q.theme, 'text', q.text, 'options', q.options, 'correct', k.correct) order by q.rank, q.created_at)
    from public.questions q join public.question_keys k on k.question_id = q.id where q.active), '[]'::jsonb));
end $$;

create function public.admin_put_questions(p_list jsonb) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare e jsonb; qid uuid; keep uuid[] := '{}'; rk int; cnt int := 0; ranks int[] := '{}';
begin
  if not public._is_editor() then return jsonb_build_object('ok', false, 'error', 'sem_permissao'); end if;
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

-- desativa o caminho antigo por senha
update public.editor_admin set hash = null, tries = 0, locked_until = null where id = 1;
do $$ begin
  revoke all on function public._is_editor() from public, anon, authenticated;
  revoke all on function public.admin_get_questions() from public, anon;
  grant execute on function public.admin_get_questions() to authenticated;
  revoke all on function public.admin_put_questions(jsonb) from public, anon;
  grant execute on function public.admin_put_questions(jsonb) to authenticated;
  revoke all on function public.admin_questions(text) from public, anon, authenticated;
  revoke all on function public.admin_save_questions(text, jsonb) from public, anon, authenticated;
  revoke all on function public.admin_set_password(text, text) from public, anon, authenticated;
end $$;
