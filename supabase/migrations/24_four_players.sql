-- Um jogador por classe: sala de ate 4 pessoas (antes 28, varias por classe) e no maximo 10 salas ativas no servidor.
-- (1) Encerra todas as salas e partidas abertas (estrutura antiga: grupos de ate 7 por classe).
-- (2) pick_group: a classe e exclusiva; quem ja e membro com aquela classe a segura mesmo ausente (a vaga fica reservada).
-- (3) join_room: teto de 4 membros (na espera, quem esta sem sinal ha mais de 45 s sai antes da conta); volta ao ponto como antes.
-- (4) create_room: salas vazias ha mais de 10 min sao encerradas e o total de salas ativas nao passa de 10.
-- As rodadas continuam por classe (round_groups): com no maximo 1 pessoa por classe, o "voto" do grupo e a resposta do jogador;
-- classe sem jogador ativo continua simulada pelo servidor.

update public.matches set status = 'aborted', ended_at = now() where status = 'playing';
update public.rooms set status = 'ended' where status <> 'ended';

create or replace function public.pick_group(p_room uuid, p_grp text) returns void language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); cur text;
begin
  perform 1 from public.rooms where id = p_room for update;
  if not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  select grp into cur from public.room_players where room_id = p_room and user_id = uid;
  if exists (select 1 from public.matches where room_id = p_room and status = 'playing') and cur is not null and p_grp is distinct from cur
    then raise exception 'partida_em_andamento'; end if;
  if p_grp is not null then
    if p_grp not in ('mage','guerreiro','tank','cleriga') then raise exception 'grupo_invalido'; end if;
    if exists (select 1 from public.room_players rp where rp.room_id = p_room and rp.grp = p_grp and rp.user_id <> uid)
    then raise exception 'grupo_cheio'; end if;
  end if;
  update public.room_players set grp = p_grp where room_id = p_room and user_id = uid;
  update public.player_presence set last_seen = now() where room_id = p_room and user_id = uid;
end $$;

create or replace function public.join_room(p_room uuid default null, p_code text default null) returns public.rooms language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; was boolean; g text;
begin
  if uid is null then raise exception 'nao_autenticado'; end if;
  if p_code is not null and length(trim(p_code)) > 0 then
    if (select count(*) from public.join_fails where user_id = uid and at > now() - interval '10 minutes') >= 10 then raise exception 'muitas_tentativas'; end if;
    select * into r from public.rooms where code = upper(trim(p_code)) and status <> 'ended';
    if not found then
      insert into public.join_fails (user_id) values (uid);
      return null;
    end if;
  else
    select * into r from public.rooms where id = p_room and status <> 'ended' and (is_public or public.is_member(id));
    if not found then raise exception 'sala_nao_encontrada'; end if;
  end if;
  was := public.is_member(r.id);
  if r.stage <> 'gather' and not was then raise exception 'sala_fechada'; end if;
  perform 1 from public.rooms where id = r.id for update;
  if not was then
    -- na espera ninguem tem classe ainda: quem sumiu (sem sinal ha mais de 45 s) libera a vaga
    delete from public.room_players rp where rp.room_id = r.id and rp.user_id <> uid
      and not exists (select 1 from public.player_presence pp where pp.room_id = rp.room_id and pp.user_id = rp.user_id and pp.last_seen > now() - interval '45 seconds');
    if (select count(*) from public.room_players rp where rp.room_id = r.id) >= 4 then raise exception 'sala_cheia'; end if;
  end if;
  insert into public.room_players (room_id, user_id) values (r.id, uid) on conflict do nothing;
  if was then
    -- a classe de quem volta fica reservada; so se por algum motivo duas pessoas tiverem a mesma, a que volta escolhe de novo
    select grp into g from public.room_players where room_id = r.id and user_id = uid;
    if g is not null and exists (select 1 from public.room_players rp where rp.room_id = r.id and rp.grp = g and rp.user_id <> uid)
    then update public.room_players set grp = null where room_id = r.id and user_id = uid; end if;
  end if;
  insert into public.player_presence (room_id, user_id) values (r.id, uid)
    on conflict (room_id, user_id) do update set last_seen = now();
  return r;
end $$;

create or replace function public.create_room(p_public boolean default true, p_name text default null) returns public.rooms language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; c text; tries int := 0;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if uid is null then raise exception 'nao_autenticado'; end if;
  -- sala sem ninguem ativo ha mais de 10 min deixa de contar (e some da lista)
  update public.matches m set status = 'aborted', ended_at = now()
    where m.status = 'playing' and not exists (select 1 from public.player_presence pp where pp.room_id = m.room_id and pp.last_seen > now() - interval '10 minutes');
  update public.rooms rr set status = 'ended'
    where rr.status <> 'ended' and coalesce(rr.last_active_at, rr.created_at) < now() - interval '10 minutes'
      and not exists (select 1 from public.player_presence pp where pp.room_id = rr.id and pp.last_seen > now() - interval '10 minutes');
  if (select count(*) from public.rooms where created_by = uid and status <> 'ended') >= 3 then raise exception 'limite_de_salas'; end if;
  perform pg_advisory_xact_lock(24);
  if (select count(*) from public.rooms where status <> 'ended') >= 10 then raise exception 'limite_global_de_salas'; end if;
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
end $$;

do $$ begin
  revoke all on function public.pick_group(uuid, text) from public, anon;
  grant execute on function public.pick_group(uuid, text) to authenticated;
  revoke all on function public.join_room(uuid, text) from public, anon;
  grant execute on function public.join_room(uuid, text) to authenticated;
  revoke all on function public.create_room(boolean, text) from public, anon;
  grant execute on function public.create_room(boolean, text) to authenticated;
end $$;
