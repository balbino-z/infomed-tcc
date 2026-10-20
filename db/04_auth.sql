-- =====================================================================
-- InfoMed - 04_auth.sql
-- Faz o gatilho de cadastro gravar também o aceite da LGPD no perfil.
-- Execute no SQL Editor DEPOIS do 01 e do 02.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, lgpd_consent_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'lgpd_consent_at', '')::timestamptz
  );
  return new;
end;
$$;
