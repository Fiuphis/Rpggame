-- Etapa 3b-2 (v330): adm mexe no chefe pela mesma via dos presentes: boss_hp (poe a vida do chefe em N% da vida maxima; 50% ou menos dispara a fase 2),
-- rage_full (enche a furia) e rage_zero (zera a furia). Entram no comeco da proxima rodada, iguais em todos os aparelhos.

alter table public.admin_gifts drop constraint admin_gifts_kind_check;
alter table public.admin_gifts add constraint admin_gifts_kind_check check (kind in ('gold', 'item', 'heal', 'revive', 'mana', 'boss_hp', 'rage_full', 'rage_zero'));

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
    if t is null or t not in ('gold', 'item', 'heal', 'revive', 'mana', 'boss_hp', 'rage_full', 'rage_zero') then raise exception 'presente_invalido'; end if;
    if t = 'item' and char_length(coalesce(p_arg->>'item', '')) not between 1 and 24 then raise exception 'presente_invalido'; end if;
    secs := least(1000, greatest(1, coalesce((p_arg->>'amount')::int, 50)));
    if t = 'boss_hp' then secs := least(100, secs); end if;
    insert into public.admin_gifts (room_id, match_id, rnd, kind, grp, amount, item) values (p_room, m.id, rd.n + 1, t, g, secs, case when t = 'item' then p_arg->>'item' end);
    msg := case when t in ('boss_hp', 'rage_full', 'rage_zero') then 'A administração interveio contra o chefe.' else 'A administração enviou ajuda a um jogador.' end;
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
  revoke all on function public.admin_act(uuid, text, jsonb) from public, anon;
  grant execute on function public.admin_act(uuid, text, jsonb) to authenticated;
end $$;
