-- =====================================================================
-- InfoMed - 07_lembretes.sql
-- Lembretes com nome livre (remédio fora do catálogo) e validações no banco.
-- Execute no SQL Editor DEPOIS do 06. Pode rodar mais de uma vez.
-- =====================================================================

alter table public.reminders alter column medication_id drop not null;
alter table public.reminders add column if not exists label text;
alter table public.reminders add column if not exists note  text;

create or replace function public.valid_times(t text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(t) between 1 and 12
     and coalesce((select bool_and(x ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') from unnest(t) x), false);
$$;

alter table public.reminders drop constraint if exists reminders_label_or_med;
alter table public.reminders add constraint reminders_label_or_med
  check (medication_id is not null or (label is not null and length(trim(label)) between 1 and 80));

alter table public.reminders drop constraint if exists reminders_times_valid;
alter table public.reminders add constraint reminders_times_valid check (public.valid_times(times));

alter table public.reminders drop constraint if exists reminders_days_valid;
alter table public.reminders add constraint reminders_days_valid
  check (cardinality(days_of_week) between 1 and 7 and days_of_week <@ array[0,1,2,3,4,5,6]);

alter table public.reminders drop constraint if exists reminders_note_len;
alter table public.reminders add constraint reminders_note_len check (note is null or length(note) <= 200);
