-- Etapa 3e (v334): modo manutencao (so adm liga/desliga).
-- Ligado: ninguem (exceto adm) cria sala nova; as salas em andamento continuam e recebem um aviso (room_notices) com a mensagem do adm.
-- maintenance_status() qualquer conta logada le; admin_set_maintenance(ligar, mensagem) so adm, com registro em admin_log.

create table public.maintenance (id boolean primary key default true check (id), on_ boolean not null default false, msg text not null default '', since timestamptz);
insert into public.maintenance (id) values (true);
alter table public.maintenance enable row level security;
revoke all on public.maintenance from public, anon, authenticated;

create or replace function public.maintenance_status() returns jsonb language sql stable security definer set search_path = '' as
$$ select jsonb_build_object('on', m.on_, 'msg', m.msg, 'since', m.since) from public.maintenance m where m.id $$;

create or replace function public.admin_set_maintenance(p_on boolean, p_msg text default null) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); t text := left(btrim(coalesce(p_msg, '')), 120); n int := 0;
begin
  if not public.is_admin() then raise exception 'sem_permissao'; end if;
  if p_on is null then raise exception 'acao_invalida'; end if;
  if p_on and t = '' then t := 'O jogo entrará em manutenção em breve. Termine a partida e salve.'; end if;
  update public.maintenance set on_ = p_on, msg = case when p_on then t else '' end, since = case when p_on then now() else null end where id;
  if p_on then
    insert into public.room_notices (room_id, kind, text) select r.id, 'maint', t from public.rooms r where r.status <> 'ended';
    get diagnostics n = row_count;
  end if;
  insert into public.admin_log (admin_id, admin_name, room_id, action, detail)
    values (uid, (select username from public.profiles where user_id = uid), null, case when p_on then 'maintenance_on' else 'maintenance_off' end, jsonb_build_object('msg', t, 'rooms', n));
  return jsonb_build_object('ok', true, 'on', p_on, 'rooms', n);
end $$;

create or replace function public.create_room(p_public boolean default true, p_name text default null) returns public.rooms language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); r public.rooms; c text; tries int := 0;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if uid is null then raise exception 'nao_autenticado'; end if;
  if exists (select 1 from public.maintenance where id and on_) and not public.is_admin() then raise exception 'manutencao'; end if;
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
  revoke all on function public.maintenance_status() from public, anon;
  grant execute on function public.maintenance_status() to authenticated;
  revoke all on function public.admin_set_maintenance(boolean, text) from public, anon;
  grant execute on function public.admin_set_maintenance(boolean, text) to authenticated;
end $$;
