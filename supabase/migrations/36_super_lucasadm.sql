-- Segunda conta principal: "lucasadm" passa a ter o mesmo poder da "fiuphis".
-- (1) _super_names(): lista fixa das contas principais (fiuphis, lucasadm).
-- (2) _is_super, _is_editor e is_admin valem para as duas: editor de perguntas, lista de adms e todos os poderes de adm.
-- (3) admin_list marca as duas como principais; admin_set: so as principais alteram a lista,
--     e nenhuma das duas pode ser tirada (nem por si mesma, nem pela outra). Tirar ou trocar uma principal exige nova migracao.
-- (4) nomes reservados: qualquer nome que contenha "lucasadm" (tambem com numeros no lugar de letras) fica bloqueado
--     no cadastro, como "fiuphis". A conta lucasadm que ja existe nao muda; o bloqueio impede que outra pessoa
--     pegue o nome se essa conta um dia for apagada.

create or replace function public._super_names() returns text[] language sql immutable set search_path = '' as
$$ select array['fiuphis', 'lucasadm']::text[] $$;

create or replace function public._is_super() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.username = any (public._super_names())) $$;

create or replace function public._is_editor() returns boolean language sql stable security definer set search_path = '' as
$$ select public._is_super() $$;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.admins a where a.user_id = (select auth.uid())) or public._is_super() $$;

create or replace function public.admin_list() returns table(username text, is_super boolean) language plpgsql stable security definer set search_path = '' as
$$
begin
  if not public._is_super() then raise exception 'sem_permissao'; end if;
  return query select p.username, p.username = any (public._super_names()) from public.profiles p
    where p.username = any (public._super_names()) or exists (select 1 from public.admins a where a.user_id = p.user_id) order by 2 desc, 1;
end $$;

create or replace function public.admin_set(p_username text, p_on boolean) returns void language plpgsql security definer set search_path = '' as
$$
declare un text := lower(btrim(coalesce(p_username, ''))); t uuid;
begin
  if not public._is_super() then raise exception 'sem_permissao'; end if;
  select user_id into t from public.profiles where username = un;
  if t is null then raise exception 'usuario_nao_encontrado'; end if;
  if un = any (public._super_names()) then raise exception 'conta_principal'; end if;
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
    if v like '%fiuphis%' or v like '%lucasadm%' then return true; end if;
    if v ~ ('^' || w || '[0-9]*$') or v ~ ('^[0-9]*' || w || '$') then return true; end if;
  end loop;
  return false;
end $$;

do $$ begin
  revoke all on function public._super_names() from public, anon, authenticated;
  revoke all on function public._is_super() from public, anon, authenticated;
  revoke all on function public._is_editor() from public, anon, authenticated;
  revoke all on function public.is_admin() from public, anon;
  grant execute on function public.is_admin() to authenticated;
  revoke all on function public.admin_list() from public, anon;
  grant execute on function public.admin_list() to authenticated;
  revoke all on function public.admin_set(text, boolean) from public, anon;
  grant execute on function public.admin_set(text, boolean) to authenticated;
  revoke all on function public._name_reserved(text) from public, anon, authenticated;
end $$;
