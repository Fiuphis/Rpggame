-- Chat da sala (v328): texto livre ate 140 letras, historico por sala (as ultimas 100 aparecem), 1 mensagem a cada 2 s.
-- Nao funciona durante a luta com o chefe (partida em andamento), exceto para adm. Criador e adm apagam mensagens (fica marcada como apagada, nada e removido da tabela).
-- Mensagens de adm levam o selo ADM. Avisos de acao (room_notices) nao entram no chat.

create table public.room_chat (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null,
  name text not null,
  body text not null check (char_length(body) between 1 and 140),
  adm boolean not null default false,
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);
create index room_chat_room_idx on public.room_chat (room_id, id desc);
alter table public.room_chat enable row level security;
revoke all on public.room_chat from public, anon, authenticated;

create or replace function public.chat_list(p_room uuid, p_after bigint default 0) returns jsonb language plpgsql stable security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); adm boolean := public.is_admin(); r public.rooms; lastid bigint; playing boolean;
begin
  if uid is null then raise exception 'nao_autenticado'; end if;
  select * into r from public.rooms where id = p_room;
  if not found then raise exception 'sala_nao_encontrada'; end if;
  if not adm and not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  playing := exists (select 1 from public.matches where room_id = p_room and status = 'playing');
  select coalesce(max(id), 0) into lastid from public.room_chat where room_id = p_room;
  return jsonb_build_object(
    'last', lastid,
    'can_send', adm or not playing,
    'can_del', adm or r.created_by = uid,
    'msgs', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'text', c.body, 'adm', c.adm, 'mine', c.user_id = uid, 't', (extract(epoch from c.created_at) * 1000)::bigint) order by c.id)
      from (select * from public.room_chat where room_id = p_room and not deleted and id > p_after order by id desc limit 100) c), '[]'::jsonb),
    'dels', coalesce((select jsonb_agg(c.id) from (select id from public.room_chat where room_id = p_room and deleted order by id desc limit 100) c), '[]'::jsonb));
end $$;

create or replace function public.chat_send(p_room uuid, p_text text) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid()); adm boolean := public.is_admin(); t text := btrim(coalesce(p_text, '')); nm text; nid bigint;
begin
  if uid is null then raise exception 'nao_autenticado'; end if;
  if not exists (select 1 from public.rooms where id = p_room and status <> 'ended') then raise exception 'sala_nao_encontrada'; end if;
  if not adm and not public.is_member(p_room) then raise exception 'fora_da_sala'; end if;
  if char_length(t) < 1 or char_length(t) > 140 then raise exception 'mensagem_invalida'; end if;
  if not adm and exists (select 1 from public.matches where room_id = p_room and status = 'playing') then raise exception 'chat_na_batalha'; end if;
  if exists (select 1 from public.room_chat where room_id = p_room and user_id = uid and created_at > now() - interval '2 seconds') then raise exception 'devagar'; end if;
  select username into nm from public.profiles where user_id = uid;
  insert into public.room_chat (room_id, user_id, name, body, adm) values (p_room, uid, coalesce(nm, 'jogador'), t, adm) returning id into nid;
  return jsonb_build_object('ok', true, 'id', nid);
end $$;

create or replace function public.chat_delete(p_room uuid, p_id bigint) returns jsonb language plpgsql security definer set search_path = '' as
$$
declare uid uuid := (select auth.uid());
begin
  if not (public.is_admin() or exists (select 1 from public.rooms where id = p_room and created_by = uid)) then raise exception 'sem_permissao'; end if;
  update public.room_chat set deleted = true where id = p_id and room_id = p_room;
  return jsonb_build_object('ok', true);
end $$;

do $$ begin
  revoke all on function public.chat_list(uuid, bigint) from public, anon;
  grant execute on function public.chat_list(uuid, bigint) to authenticated;
  revoke all on function public.chat_send(uuid, text) from public, anon;
  grant execute on function public.chat_send(uuid, text) to authenticated;
  revoke all on function public.chat_delete(uuid, bigint) from public, anon;
  grant execute on function public.chat_delete(uuid, bigint) to authenticated;
end $$;
