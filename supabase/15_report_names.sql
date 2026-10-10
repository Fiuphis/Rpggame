-- Relatorio final: inclui o nome de cada jogador (perfil) e quem foi o criador.
create or replace function public.match_report(p_match uuid) returns jsonb language plpgsql stable security definer set search_path = '' as
$$
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
  select coalesce(jsonb_agg(jsonb_build_object('user', s.user_id, 'grp', s.grp, 'me', s.user_id = (select auth.uid()),
      'name', (select p.username from public.profiles p where p.user_id = s.user_id), 'stats', s.stats) order by s.updated_at), '[]'::jsonb)
    into stats_ from public.match_stats s where s.match_id = p_match;
  return jsonb_build_object('match', to_jsonb(m) - 'snapshot', 'rounds', rounds_, 'players', stats_);
end $$;
