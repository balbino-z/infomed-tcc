-- =====================================================================
-- InfoMed - 09_perfil.sql
-- Validações dos dados do perfil (o app espelha estas regras para dar mensagem clara).
-- Execute no SQL Editor DEPOIS do 08. Pode rodar mais de uma vez.
-- =====================================================================

-- Telefone: só dígitos, 10 (fixo) ou 11 (celular) com DDD. Guardado sem máscara.
alter table public.profiles drop constraint if exists profiles_phone_valid;
alter table public.profiles add constraint profiles_phone_valid
  check (phone is null or phone = '' or phone ~ '^[0-9]{10,11}$') not valid;

-- Data de nascimento: de 1900 até hoje.
alter table public.profiles drop constraint if exists profiles_birth_date_valid;
alter table public.profiles add constraint profiles_birth_date_valid
  check (birth_date is null or (birth_date >= date '1900-01-01' and birth_date <= current_date)) not valid;

-- Nome: até 120 caracteres.
alter table public.profiles drop constraint if exists profiles_full_name_len;
alter table public.profiles add constraint profiles_full_name_len
  check (full_name is null or length(full_name) <= 120) not valid;

-- "not valid" acima: não falha por causa de perfis antigos fora do padrão,
-- mas vale para tudo que for gravado daqui em diante. Para conferir os antigos:
--   select id, phone, birth_date from public.profiles
--    where not (phone is null or phone = '' or phone ~ '^[0-9]{10,11}$');
