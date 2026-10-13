-- Etapa 1 do painel de adm: tabela de admins, nomes de usuario reservados e consulta de disponibilidade do nome.
-- (1) public.admins: contas de adm; so a conta "fiuphis" (super) adiciona/remove, por admin_set. Sem politicas: so por funcoes.
-- (2) _name_status / username_status: 'invalido' | 'reservado' | 'em_uso' | 'disponivel'.
--     Reservados: nomes de adm (admin, adm, moderador, ...) com numeros antes/depois, letras trocadas por numeros (adm1n, f1uphis) e qualquer nome que contenha "fiuphis".
-- (3) register_profile passa a recusar nomes reservados ('nome_reservado').

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_by uuid,
  created_at timestamp with time zone not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from public, anon, authenticated;
insert into public.admins (user_id) select p.user_id from public.profiles p where p.username = 'fiuphis' on conflict do nothing;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.admins a where a.user_id = (select auth.uid())) or exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.username = 'fiuphis') $$;

create or replace function public._is_super() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.username = 'fiuphis') $$;

create or replace function public.admin_list() returns table(username text, is_super boolean) language plpgsql stable security definer set search_path = '' as
$$
begin
  if not public._is_super() then raise exception 'sem_permissao'; end if;
  return query select p.username, p.username = 'fiuphis' from public.profiles p where p.username = 'fiuphis' or exists (select 1 from public.admins a where a.user_id = p.user_id) order by 2 desc, 1;
end $$;

create or replace function public.admin_set(p_username text, p_on boolean) returns void language plpgsql security definer set search_path = '' as
$$
declare un text := lower(btrim(coalesce(p_username, ''))); t uuid;
begin
  if not public._is_super() then raise exception 'sem_permissao'; end if;
  select user_id into t from public.profiles where username = un;
  if t is null then raise exception 'usuario_nao_encontrado'; end if;
  if un = 'fiuphis' then raise exception 'conta_principal'; end if;
  if coalesce(p_on, false) then insert into public.admins (user_id, added_by) values (t, (select auth.uid())) on conflict do nothing;
  else delete from public.admins where user_id = t; end if;
end $$;

create or replace function public._name_reserved(p text) returns boolean language plpgsql immutable set search_path = '' as
$$
declare
  raw text := replace(lower(coalesce(p, '')), '_', '');
  n1 text := translate(raw, '013457', 'oieast');             -- numeros no lugar de letras (1 vira i)
  n2 text := translate(raw, '013457', 'oleast');             -- (1 vira l)
  w constant text := '(admin|adm|administrador|administrator|mod|moderador|suporte|staff|sistema|system|oficial|root|gm)';
  v text;
begin
  foreach v in array array[raw, n1, n2] loop
    if v like '%fiuphis%' then return true; end if;
    if v ~ ('^' || w || '[0-9]*$') or v ~ ('^[0-9]*' || w || '$') then return true; end if;
  end loop;
  return false;
end $$;

create or replace function public._name_status(p text) returns text language plpgsql stable security definer set search_path = '' as
$$
declare un text := lower(btrim(coalesce(p, '')));
begin
  if un !~ '^[a-z0-9_]{3,16}$' then return 'invalido'; end if;
  if public._name_reserved(un) then return 'reservado'; end if;
  if exists (select 1 from public.profiles where username = un)
     or exists (select 1 from auth.users u where lower(u.email) = un || '@cronicas-do-saber.app') then return 'em_uso'; end if;
  return 'disponivel';
end $$;

create or replace function public.username_status(p_username text) returns text language plpgsql stable security definer set search_path = '' as
$$
begin
  if (select auth.uid()) is null then raise exception 'nao_autenticado'; end if;
  return public._name_status(p_username);
end $$;

create or replace function public.register_profile(p_username text) returns text language plpgsql security definer set search_path = '' as
$$
declare u uuid; un text := lower(coalesce(p_username,'')); code text; mail text := lower(coalesce(auth.jwt()->>'email',''));
begin
  if un !~ '^[a-z0-9_]{3,16}$' then raise exception 'usuario_invalido'; end if;
  if public._name_reserved(un) then raise exception 'nome_reservado'; end if;
  u := public._uid_account();
  if mail <> un || '@cronicas-do-saber.app' then raise exception 'usuario_invalido'; end if;
  if exists (select 1 from public.profiles where user_id = u) then raise exception 'perfil_existe'; end if;
  code := public._new_recovery_code();
  begin
    insert into public.profiles(user_id, username, recovery_hash) values (u, un, extensions.crypt(replace(code,'-',''), extensions.gen_salt('bf')));
  exception when unique_violation then raise exception 'usuario_existe';
  end;
  return code;
end $$;

do $$ begin
  revoke all on function public.is_admin() from public, anon;
  grant execute on function public.is_admin() to authenticated;
  revoke all on function public._is_super() from public, anon, authenticated;
  revoke all on function public.admin_list() from public, anon;
  grant execute on function public.admin_list() to authenticated;
  revoke all on function public.admin_set(text, boolean) from public, anon;
  grant execute on function public.admin_set(text, boolean) to authenticated;
  revoke all on function public._name_reserved(text) from public, anon, authenticated;
  revoke all on function public._name_status(text) from public, anon, authenticated;
  revoke all on function public.username_status(text) from public, anon;
  grant execute on function public.username_status(text) to authenticated;
  revoke all on function public.register_profile(text) from public, anon;
  grant execute on function public.register_profile(text) to authenticated;
end $$;
