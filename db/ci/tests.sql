-- =====================================================================
-- Testes automáticos do banco (segurança por usuário e regras de negócio).
-- Cada verificação lança erro se o resultado não for o esperado; o CI falha.
-- Executar com: psql -v ON_ERROR_STOP=1 -f db/ci/tests.sql
-- =====================================================================
\set ON_ERROR_STOP on
\pset pager off
begin;

-- ---------- utilitários ----------
create function pg_temp.expect_error(stmt text, pattern text) returns void language plpgsql as $$
declare ok boolean := false;
begin
  begin
    execute stmt;
    ok := true;
  exception when others then
    if sqlerrm !~* pattern then
      raise exception 'Erro diferente do esperado. Esperado: %  Obtido: %  SQL: %', pattern, sqlerrm, stmt;
    end if;
  end;
  if ok then
    raise exception 'ESPERAVA ERRO (%) mas executou sem erro: %', pattern, stmt;
  end if;
end $$;

create function pg_temp.expect_count(stmt text, expected bigint, label text) returns void language plpgsql as $$
declare got bigint;
begin
  execute 'select count(*) from (' || stmt || ') q' into got;
  if got <> expected then
    raise exception 'FALHOU: % (esperado %, obtido %)', label, expected, got;
  end if;
  raise notice 'OK: %', label;
end $$;

-- ---------- cenário ----------
insert into auth.users (id, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '{"full_name":"Maria","lgpd_consent_at":"2026-10-20T10:00:00Z"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '{"full_name":"Joao"}');

select pg_temp.expect_count('select 1 from public.profiles', 2, 'gatilho criou os 2 perfis');
select pg_temp.expect_count('select 1 from public.profiles where lgpd_consent_at is not null', 1, 'aceite da LGPD gravado no perfil');

create temp table ctx as
select
  (select d.id from public.doctors d join public.health_units h on h.id = d.unit_id
    where h.opens_at = '07:00' and h.closes_at >= '16:30' order by d.id limit 1) as doc,
  (select (h.closes_at - interval '30 minutes')::time from public.doctors d join public.health_units h on h.id = d.unit_id
    where h.opens_at = '07:00' and h.closes_at >= '16:30' order by d.id limit 1) as last_slot,
  (select (h.closes_at)::time from public.doctors d join public.health_units h on h.id = d.unit_id
    where h.opens_at = '07:00' and h.closes_at >= '16:30' order by d.id limit 1) as closing,
  (select g::date from generate_series((now() at time zone 'America/Sao_Paulo')::date + 2,
                                       (now() at time zone 'America/Sao_Paulo')::date + 9, '1 day') g
    where extract(dow from g) between 1 and 5 order by g limit 1) as weekday,
  (select g::date from generate_series((now() at time zone 'America/Sao_Paulo')::date + 2,
                                       (now() at time zone 'America/Sao_Paulo')::date + 9, '1 day') g
    where extract(dow from g) = 6 order by g limit 1) as saturday;
grant select on ctx to authenticated, anon;

create function pg_temp.at(d date, h text) returns timestamptz language sql as
$$ select (d::text || ' ' || h)::timestamp at time zone 'America/Sao_Paulo' $$;

-- ---------- CATÁLOGO: leitura pública, escrita proibida ----------
set local role anon;
select pg_temp.expect_count('select 1 from public.health_units', (select count(*) from public.health_units), 'visitante lê as unidades');
select pg_temp.expect_error($$ insert into public.medications (name, dosage, form, description) values ('X','1mg','Comprimido','teste') $$, 'permission denied|row-level security');
select pg_temp.expect_error($$ select * from public.appointments $$, 'permission denied');
select pg_temp.expect_error($$ select * from public.reminders $$, 'permission denied');
reset role;

-- ---------- AGENDAMENTO: Maria ----------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);

insert into public.appointments (doctor_id, starts_at)
  select doc, pg_temp.at(weekday, '10:00') from ctx;
select pg_temp.expect_count('select 1 from public.appointments', 1, 'Maria agendou e vê 1 consulta');

-- ---------- AGENDAMENTO: João tenta de tudo ----------
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', true);

select pg_temp.expect_count('select 1 from public.appointments', 0, 'João NÃO vê a consulta da Maria');
select pg_temp.expect_count('select 1 from public.my_appointments', 0, 'João NÃO vê a consulta da Maria na view');
select pg_temp.expect_count($$ select 1 from public.booked_slots((select doc from ctx), pg_temp.at((select weekday from ctx), '00:00'), pg_temp.at((select weekday from ctx), '23:59')) $$, 1, 'João vê o horário ocupado (sem saber de quem)');

select pg_temp.expect_error($$ insert into public.appointments (doctor_id, starts_at) select doc, pg_temp.at(weekday, '10:00') from ctx $$, 'duplicate key');
select pg_temp.expect_error($$ insert into public.appointments (doctor_id, starts_at) select doc, pg_temp.at(weekday, '10:15') from ctx $$, '30 em 30');
select pg_temp.expect_error($$ insert into public.appointments (doctor_id, starts_at) select doc, pg_temp.at(weekday, '06:30') from ctx $$, 'fora do atendimento');
select pg_temp.expect_error($$ insert into public.appointments (doctor_id, starts_at) select doc, pg_temp.at(weekday, closing::text) from ctx $$, 'fora do atendimento');
select pg_temp.expect_error($$ insert into public.appointments (doctor_id, starts_at) select doc, now() - interval '1 day' from ctx $$, 'futuro');
select pg_temp.expect_error($$ insert into public.appointments (doctor_id, starts_at) select doc, pg_temp.at(saturday, '10:00') from ctx $$, 'segunda a sexta');
select pg_temp.expect_error($$ insert into public.appointments (doctor_id, starts_at) select doc, now() + interval '90 days' from ctx $$, '60 dias|segunda a sexta|30 em 30|fora do atendimento');
select pg_temp.expect_error($$ insert into public.appointments (user_id, doctor_id, starts_at) select 'aaaaaaaa-0000-0000-0000-000000000001', doc, pg_temp.at(weekday, '11:00') from ctx $$, 'row-level security');

-- último horário válido
insert into public.appointments (doctor_id, starts_at) select doc, pg_temp.at(weekday, last_slot::text) from ctx;
select pg_temp.expect_count('select 1 from public.appointments', 1, 'João agendou o último horário do expediente');

select pg_temp.expect_error($$ update public.appointments set status = 'concluida' where user_id = auth.uid() $$, 'status não permitida');
select pg_temp.expect_error($$ update public.appointments set starts_at = starts_at + interval '30 minutes' where user_id = auth.uid() $$, 'cancelar');
select pg_temp.expect_error($$ update public.appointments set user_id = 'aaaaaaaa-0000-0000-0000-000000000001' where user_id = auth.uid() $$, 'cancelar|row-level security');
select pg_temp.expect_count($$ select 1 from public.notifications where title = 'Consulta agendada' $$, 1, 'João recebeu a notificação de agendamento (criada pelo servidor)');
select pg_temp.expect_error($$ insert into public.notifications (type, title, body) values ('system', 'Falsa', 'x') $$, 'permission denied|row-level security');

update public.appointments set status = 'cancelada', cancel_reason = 'teste' where user_id = auth.uid();
select pg_temp.expect_count($$ select 1 from public.my_appointments where status = 'cancelada' $$, 1, 'João cancelou a própria consulta');
select pg_temp.expect_count($$ select 1 from public.notifications where title = 'Consulta cancelada' $$, 1, 'notificação de cancelamento criada');
select pg_temp.expect_count($$ select 1 from public.booked_slots((select doc from ctx), pg_temp.at((select weekday from ctx), '00:00'), pg_temp.at((select weekday from ctx), '23:59')) $$, 1, 'horário cancelado voltou a ficar livre (só o da Maria continua ocupado)');

-- ---------- LEMBRETES ----------
insert into public.reminders (label, times, days_of_week, note) values ('Losartana 50mg', '{08:00,20:00}', '{1,2,3,4,5}', 'antes do café');
select pg_temp.expect_count('select 1 from public.reminders', 1, 'lembrete válido criado');
select pg_temp.expect_error($$ insert into public.reminders (label, times) values ('X', '{25:99}') $$, 'reminders_times_valid');
select pg_temp.expect_error($$ insert into public.reminders (label, times) values ('  ', '{08:00}') $$, 'reminders_label_or_med');
select pg_temp.expect_error($$ insert into public.reminders (label, times, days_of_week) values ('X', '{08:00}', '{9}') $$, 'reminders_days_valid');
select pg_temp.expect_error($$ insert into public.reminders (label, times) values ('X', '{}') $$, 'reminders_times_valid');

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true);
select pg_temp.expect_count('select 1 from public.reminders', 0, 'Maria NÃO vê o lembrete do João');
select pg_temp.expect_count('select 1 from public.my_appointments', 1, 'Maria vê só a própria consulta');
select pg_temp.expect_count('select 1 from public.profiles', 1, 'Maria vê só o próprio perfil');

reset role;
rollback;  -- não deixa dados de teste
\echo '=== TODOS OS TESTES DO BANCO PASSARAM ==='
