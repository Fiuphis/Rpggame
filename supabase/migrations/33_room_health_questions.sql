-- Etapa 3d (v333): saude das salas e painel de perguntas (so adm).
-- admin_rooms ganha: rodada atual, parada ha quantos segundos, jogadores ausentes, pausada, trancada, dificuldade, tempo e criador.
-- admin_question_list(rank, busca): contagem por rank (ativas/desativadas) e a lista (ate 150) com a resposta certa.
-- admin_question_set(id, ativa): liga/desliga uma pergunta; recusa deixar um rank com menos de 3 ativas.

create or replace function public.admin_rooms() returns jsonb language plpgsql stable security definer set search_path = '' as
$$
begin
  if not public.is_admin() then raise exception 'sem_permissao'; end if;
  return coalesce((select jsonb_agg(x order by x->>'created_at' desc) from (
    select jsonb_build_object('id', r.id, 'code', r.code, 'name', r.name, 'status', r.status, 'public', r.is_public, 'boss_idx', r.boss_idx, 'created_at', r.created_at,
      'playing', exists (select 1 from public.matches m where m.room_id = r.id and m.status = 'playing'),
      'round', (select max(rd.n) from public.rounds rd join public.matches m on m.id = rd.match_id where m.room_id = r.id and m.status = 'playing'),
      'idle', floor(extract(epoch from now() - coalesce(r.last_active_at, r.created_at)))::int,
      'paused', r.paused_at is not null, 'locked', r.locked, 'difficulty', r.difficulty, 'time_mode', r.time_mode,
      'owner', (select p.username from public.profiles p where p.user_id = r.created_by),
      'players', coalesce((select jsonb_agg(jsonb_build_object('grp', rp.grp, 'name', (select p.username from public.profiles p where p.user_id = rp.user_id),
          'active', coalesce(pp.last_seen > now() - interval '45 seconds', false)) order by rp.joined_at)
        from public.room_players rp left join public.player_presence pp on pp.room_id = rp.room_id and pp.user_id = rp.user_id where rp.room_id = r.id), '[]'::jsonb)) x
    from public.rooms r where r.status <> 'ended' order by r.created_at desc limit 50) t), '[]'::jsonb);
end $$;

create or replace function public.admin_question_list(p_rank int default null, p_q text default null) returns jsonb language plpgsql stable security definer set search_path = '' as
$$
declare s text := nullif(btrim(coalesce(p_q, '')), '');
begin
  if not public.is_admin() then raise exception 'sem_permissao'; end if;
  return jsonb_build_object(
    'counts', coalesce((select jsonb_object_agg(rank::text, jsonb_build_object('on', n_on, 'off', n_off))
      from (select q.rank, count(*) filter (where q.active) n_on, count(*) filter (where not q.active) n_off from public.questions q group by q.rank) c), '{}'::jsonb),
    'list', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'rank', t.rank, 'theme', t.theme, 'text', t.text, 'options', t.options, 'correct', t.correct, 'active', t.active) order by t.rank, t.created_at)
      from (select q.*, k.correct from public.questions q left join public.question_keys k on k.question_id = q.id
        where (p_rank is null or q.rank = p_rank) and (s is null or q.text ilike '%' || s || '%' or q.theme ilike '%' || s || '%')
        order by q.rank, q.created_at limit 150) t), '[]'::jsonb));
end $$;

create or replace function public.admin_question_set(p_id uuid, p_active boolean) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare q public.questions; n int;
begin
  if not public.is_admin() then raise exception 'sem_permissao'; end if;
  select * into q from public.questions where id = p_id for update;
  if not found then raise exception 'pergunta_nao_encontrada'; end if;
  if not p_active and q.active then
    select count(*) into n from public.questions where rank = q.rank and active;
    if n <= 3 then raise exception 'minimo_de_perguntas'; end if;
  end if;
  update public.questions set active = p_active where id = p_id;
  insert into public.admin_log (admin_id, admin_name, room_id, action, detail)
    values ((select auth.uid()), (select username from public.profiles where user_id = (select auth.uid())), null, case when p_active then 'question_on' else 'question_off' end, jsonb_build_object('question', p_id, 'rank', q.rank));
  return jsonb_build_object('ok', true, 'active', p_active);
end $$;

do $$ begin
  revoke all on function public.admin_question_list(int, text) from public, anon;
  grant execute on function public.admin_question_list(int, text) to authenticated;
  revoke all on function public.admin_question_set(uuid, boolean) from public, anon;
  grant execute on function public.admin_question_set(uuid, boolean) to authenticated;
end $$;
