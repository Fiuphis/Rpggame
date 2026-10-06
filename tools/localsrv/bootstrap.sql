-- Base minima para rodar o schema do Supabase num Postgres local (PGlite): papeis, auth.* e extensions.* simplificados.
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth; create schema extensions;
create table auth.users (id uuid primary key, email text, is_anonymous boolean default false);
create or replace function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
create function extensions.gen_random_bytes(n int) returns bytea language sql as $$ select decode(substr(md5(random()::text || clock_timestamp()::text) || md5(random()::text), 1, n * 2), 'hex') $$;
create function extensions.gen_salt(t text) returns text language sql as $$ select 'salt' $$;
create function extensions.crypt(p text, s text) returns text language sql as $$ select 'h:' || md5(p) $$;
grant usage on schema auth, extensions to anon, authenticated, service_role;
grant execute on all functions in schema auth, extensions to anon, authenticated, service_role;
