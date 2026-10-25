-- Simula, em um PostgreSQL comum, as partes do Supabase de que os scripts dependem
-- (papéis anon/authenticated e o esquema auth). Usado SOMENTE no CI e em testes locais.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  raw_user_meta_data jsonb default '{}'::jsonb
);

-- No Supabase, auth.uid() lê o usuário do token (JWT). Aqui lemos de uma configuração da sessão.
create or replace function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant usage on schema auth   to anon, authenticated;
grant usage on schema public to anon, authenticated;
