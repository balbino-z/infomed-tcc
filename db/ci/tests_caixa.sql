-- =====================================================================
-- Testes automáticos da caixa de remédios (db/10_caixa.sql e db/11_caixa_demo.sql).
-- Executar DEPOIS de todos os scripts 01..11:
--   psql -v ON_ERROR_STOP=1 -f db/ci/tests_caixa.sql
-- =====================================================================
\set ON_ERROR_STOP on
\pset pager off
begin;

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
  raise notice 'OK (erro esperado): %', pattern;
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
  ('cccccccc-0000-0000-0000-000000000001', '{"full_name":"Ana"}'),
  ('dddddddd-0000-0000-0000-000000000002', '{"full_name":"Beto"}');

-- tabelas temporárias para passar valores entre os papéis
create temp table cod (c text);
create temp table box (j jsonb);
create temp table ids (name text primary key, id uuid);
grant all on cod, box, ids to anon, authenticated;

-- Ana: lembrete todos os dias às 08:00 e 20:00, criado há 10 dias
select set_config('request.jwt.claim.sub', 'cccccccc-0000-0000-0000-000000000001', true);
set local role authenticated;
insert into public.reminders (label, times, days_of_week) values ('Losartana 50mg', '{08:00,20:00}', '{0,1,2,3,4,5,6}');
reset role;
update public.reminders set created_at = now() - interval '10 days' where label = 'Losartana 50mg';
insert into ids select 'lembrete', id from public.reminders where label = 'Losartana 50mg';

-- ---------- 1. a caixa (anon) não acessa tabelas nem funções internas ----------
set local role anon;
select pg_temp.expect_error($$ select * from public.devices $$, 'permission denied');
select pg_temp.expect_error($$ select * from public.dose_events $$, 'permission denied');
select pg_temp.expect_error($$ select * from public.pairing_codes $$, 'permission denied');
select pg_temp.expect_error($$ select public.iniciar_pareamento() $$, 'permission denied');
select pg_temp.expect_error($$ select public._caixa_dono(gen_random_uuid(), 'x') $$, 'permission denied');
select pg_temp.expect_error($$ insert into public.dose_events (user_id, reminder_id, scheduled_at, status, taken_at, source)
                              values ('cccccccc-0000-0000-0000-000000000001', gen_random_uuid(), now(), 'tomada', now(), 'caixa') $$, 'permission denied');
reset role;

-- ---------- 2. pareamento ----------
set local role authenticated;
insert into cod select public.iniciar_pareamento()->>'code';
select pg_temp.expect_count($$ select 1 from cod where c ~ '^[0-9]{6}$' $$, 1, 'código de 6 dígitos gerado');
select pg_temp.expect_error($$ select code_hash from public.pairing_codes $$, 'permission denied');
reset role;
select pg_temp.expect_count($$ select 1 from public.pairing_codes p, cod where p.code_hash = public._sha256(cod.c) $$, 1, 'banco guarda só o hash do código');
select pg_temp.expect_count($$ select 1 from public.pairing_codes p, cod where p.code_hash = cod.c $$, 0, 'código não fica em texto puro');

set local role anon;
select pg_temp.expect_count($$ select 1 from (select public.parear_caixa(lpad(((c::int + 1) % 1000000)::text, 6, '0')) j from cod) x
                               where not (j->>'ok')::boolean $$, 1, 'código errado é recusado');
select pg_temp.expect_count($$ select 1 from (select public.parear_caixa('abc') j) x where not (j->>'ok')::boolean $$, 1, 'código em formato inválido é recusado');
insert into box select public.parear_caixa((select c from cod), 'Caixa teste', '1.0.0');
select pg_temp.expect_count($$ select 1 from box where (j->>'ok')::boolean and j->>'token' ~ '^[0-9a-f]{64}$' $$, 1, 'código certo devolve token de 32 bytes');
select pg_temp.expect_count($$ select 1 from (select public.parear_caixa((select c from cod)) j) x where not (j->>'ok')::boolean $$, 1, 'código é de uso único');
reset role;

select pg_temp.expect_count($$ select 1 from public.pairing_failures $$, 3, 'tentativas erradas registradas');
select pg_temp.expect_count($$ select 1 from public.devices d, box where d.id = (box.j->>'deviceId')::uuid
                               and d.token_hash = public._sha256(box.j->>'token') and d.token_hash <> box.j->>'token'
                               and d.user_id = 'cccccccc-0000-0000-0000-000000000001' $$, 1, 'aparelho criado para a Ana, com hash do token');

-- código expirado
set local role authenticated;
delete from cod;
insert into cod select public.iniciar_pareamento()->>'code';
reset role;
update public.pairing_codes set expires_at = now() - interval '1 second' where used_at is null;
set local role anon;
select pg_temp.expect_count($$ select 1 from (select public.parear_caixa((select c from cod)) j) x
                               where j->>'erro' ~* 'expirado' $$, 1, 'código expirado é recusado');
reset role;

-- limite de tentativas
insert into public.pairing_failures select from generate_series(1, 10);
set local role authenticated;
delete from cod;
insert into cod select public.iniciar_pareamento()->>'code';
set local role anon;
select pg_temp.expect_count($$ select 1 from (select public.parear_caixa((select c from cod)) j) x
                               where j->>'erro' ~* 'Muitas tentativas' $$, 1, 'excesso de erros bloqueia por 1 minuto');
reset role;
delete from public.pairing_failures;

-- ---------- 3. agenda e token ----------
set local role anon;
select pg_temp.expect_error($$ select public.caixa_agenda((select (j->>'deviceId')::uuid from box), 'token-errado') $$, 'não autorizada');
select pg_temp.expect_error($$ select public.caixa_agenda(gen_random_uuid(), (select j->>'token' from box)) $$, 'não autorizada');
select pg_temp.expect_count($$ select 1 from (select public.caixa_agenda((select (j->>'deviceId')::uuid from box), (select j->>'token' from box)) a) x
                               where jsonb_array_length(a->'lembretes') = 1
                                 and a->'lembretes'->0->>'nome' = 'Losartana 50mg'
                                 and a->'lembretes'->0->'horarios' = '["08:00","20:00"]'::jsonb
                                 and (a->>'agora')::bigint > 1700000000 $$, 1, 'caixa recebe a agenda do dono e a hora do servidor');
reset role;

-- ---------- 4. doses (ontem 08:00 e 20:00) ----------
create temp table ontem as
select (((now() at time zone 'America/Sao_Paulo')::date - 1) + time '08:00') at time zone 'America/Sao_Paulo' as manha,
       (((now() at time zone 'America/Sao_Paulo')::date - 1) + time '20:00') at time zone 'America/Sao_Paulo' as noite;
create temp view dose_args as select (select (j->>'deviceId')::uuid from box) as dev, (select j->>'token' from box) as tok,
                                     (select id from ids where name = 'lembrete') as rem;
grant select on ontem, dose_args to anon, authenticated;

set local role anon;
select pg_temp.expect_count($$ select 1 from (select public.caixa_registrar_dose(a.dev, a.tok, a.rem,
                                 extract(epoch from o.manha)::bigint, extract(epoch from o.manha + interval '4 minutes')::bigint) j
                                 from dose_args a, ontem o) x where j->>'status' = 'tomada' and not (j->>'repetida')::boolean $$,
                            1, 'dose 4 min depois = tomada');
select pg_temp.expect_count($$ select 1 from (select public.caixa_registrar_dose(a.dev, a.tok, a.rem,
                                 extract(epoch from o.manha)::bigint, extract(epoch from o.manha + interval '5 minutes')::bigint) j
                                 from dose_args a, ontem o) x where (j->>'ok')::boolean and (j->>'repetida')::boolean $$,
                            1, 'reenvio da mesma dose (fila offline) é ignorado');
select pg_temp.expect_count($$ select 1 from (select public.caixa_registrar_dose(a.dev, a.tok, a.rem,
                                 extract(epoch from o.noite)::bigint, extract(epoch from o.noite + interval '70 minutes')::bigint) j
                                 from dose_args a, ontem o) x where j->>'status' = 'atrasada' $$,
                            1, 'dose 70 min depois = atrasada');
select pg_temp.expect_count($$ select 1 from (select public.caixa_registrar_dose(a.dev, a.tok, a.rem,
                                 extract(epoch from o.manha - interval '1 day')::bigint, extract(epoch from o.manha - interval '1 day' + interval '3 hours')::bigint) j
                                 from dose_args a, ontem o) x where not (j->>'ok')::boolean $$,
                            1, 'dose 3 h depois é recusada (esquecida)');
select pg_temp.expect_count($$ select 1 from (select public.caixa_registrar_dose(a.dev, a.tok, a.rem,
                                 extract(epoch from o.manha + interval '15 minutes')::bigint, extract(epoch from o.manha + interval '15 minutes')::bigint) j
                                 from dose_args a, ontem o) x where j->>'erro' ~* 'não pertence' $$,
                            1, 'horário que não é do lembrete é recusado');
reset role;
select pg_temp.expect_count($$ select 1 from public.dose_events where source = 'caixa' $$, 2, 'duas doses gravadas, sem duplicar');

-- ---------- 5. RLS: Beto não vê nada da Ana ----------
select set_config('request.jwt.claim.sub', 'dddddddd-0000-0000-0000-000000000002', true);
set local role authenticated;
select pg_temp.expect_count($$ select 1 from public.dose_events $$, 0, 'Beto NÃO vê as doses da Ana');
select pg_temp.expect_count($$ select 1 from public.devices $$, 0, 'Beto NÃO vê a caixa da Ana');
select pg_temp.expect_error($$ select public.desparear_caixa((select (j->>'deviceId')::uuid from box)) $$, 'não encontrada');
select pg_temp.expect_count($$ select 1 from (select public.minha_adesao(30) j) x where (j->>'expected')::int = 0 $$, 1, 'adesão do Beto não inclui a Ana');
reset role;

-- ---------- 6. adesão da Ana ----------
select set_config('request.jwt.claim.sub', 'cccccccc-0000-0000-0000-000000000001', true);
set local role authenticated;
select pg_temp.expect_count($$ select 1 from public.dose_events $$, 2, 'Ana vê as próprias doses');
select pg_temp.expect_error($$ select token_hash from public.devices $$, 'permission denied');
select pg_temp.expect_count($$ select 1 from (select public.minha_adesao(3) j) x
                               where (j->>'taken')::int = 2 and (j->>'onTime')::int = 1 and (j->>'late')::int = 1
                                 and (j->>'expected')::int >= 4
                                 and (j->>'missed')::int = (j->>'expected')::int - 2
                                 and jsonb_array_length(j->'byPeriod') >= 2 $$, 1, 'adesão: previstas × tomadas, esquecidas sem a caixa');
select pg_temp.expect_error($$ select public.minha_adesao(0) $$, 'Período');

-- botão "Tomei" no app (lembrete criado agora, para o minuto atual)
insert into public.reminders (label, times, days_of_week)
values ('Vitamina D', array[to_char(now() at time zone 'America/Sao_Paulo', 'HH24:MI')], '{0,1,2,3,4,5,6}');
select pg_temp.expect_count($$ select 1 from (select public.registrar_dose_app(r.id,
                                 date_trunc('minute', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') j
                                 from public.reminders r where r.label = 'Vitamina D') x
                               where j->>'status' = 'tomada' $$, 1, 'botão Tomei registra a dose com source = app');
select pg_temp.expect_count($$ select 1 from public.dose_events where source = 'app' $$, 1, 'dose do app gravada');
reset role;

-- ---------- 7. sensor ----------
set local role anon;
select pg_temp.expect_count($$ select 1 from (select public.caixa_leitura(a.dev, a.tok, 32.5, 60, '1.0.0') j from dose_args a) x
                               where (j->>'alerta')::boolean $$, 1, 'temperatura de 32,5 °C gera alerta');
select public.caixa_leitura(a.dev, a.tok, 33, 60) from dose_args a;
select pg_temp.expect_count($$ select 1 from (select public.caixa_leitura(a.dev, a.tok, 24, 50) j from dose_args a) x
                               where not (j->>'alerta')::boolean $$, 1, 'temperatura normal não gera alerta');
reset role;
select pg_temp.expect_count($$ select 1 from public.notifications where title = 'Caixa de remédios fora da faixa' $$, 1, 'alerta vira UMA notificação (sem repetir)');
select pg_temp.expect_count($$ select 1 from public.device_readings $$, 3, 'histórico do sensor gravado');
select pg_temp.expect_count($$ select 1 from public.devices where temp = 24 and humidity = 50 and last_seen_at > now() - interval '1 minute' $$, 1, 'caixa atualiza temperatura e visto por último');

-- ---------- 8. BI agregado ----------
set local role authenticated;
select pg_temp.expect_error($$ select public.bi_adesao(30) $$, 'restrito');
reset role;
update public.profiles set is_admin = true where id = 'cccccccc-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.expect_count($$ select 1 from (select public.bi_adesao(30) j) x
                               where j->'rate' = 'null'::jsonb and (j->>'patients')::int < 5 $$, 1, 'BI esconde a taxa com menos de 5 pacientes');
select pg_temp.expect_count($$ select 1 from (select public.bi_adesao(30)::text t) x
                               where t !~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}' and t !~* 'ana|losartana' $$, 1, 'BI não devolve ids, nomes nem remédios');
select pg_temp.expect_count($$ select 1 from (select public.bi_adesao(30) j) x where (j->'devices'->>'active')::int = 1 $$, 1, 'BI conta caixas ativas');

-- ---------- 8b. modo demonstração, sensor e toques (db/11_caixa_demo.sql) ----------
reset role;
set local role anon;
select pg_temp.expect_error($$ select * from public.device_touches $$, 'permission denied');
select pg_temp.expect_error($$ select public.definir_modo_demo(a.dev, true) from dose_args a $$, 'permission denied');
select pg_temp.expect_count($$ select 1 from (select public.caixa_agenda(a.dev, a.tok) j from dose_args a) x
                               where (j->>'demo')::boolean = false $$, 1, 'modo demo começa desligado');
reset role;
select set_config('request.jwt.claim.sub', 'dddddddd-0000-0000-0000-000000000002', true);
set local role authenticated;
select pg_temp.expect_error($$ select public.definir_modo_demo(a.dev, true) from dose_args a $$, 'não encontrada');
reset role;
select set_config('request.jwt.claim.sub', 'cccccccc-0000-0000-0000-000000000001', true);
set local role authenticated;
select public.definir_modo_demo(a.dev, true) from dose_args a;
reset role;
set local role anon;
select pg_temp.expect_count($$ select 1 from (select public.caixa_agenda(a.dev, a.tok) j from dose_args a) x
                               where (j->>'demo')::boolean $$, 1, 'a caixa recebe o modo demo ligado pelo app');
select pg_temp.expect_count($$ select 1 from (select public.caixa_toque(a.dev, a.tok, 0, 0, false, true) j from dose_args a) x
                               where (j->>'ok')::boolean $$, 1, 'toque no compartimento registrado');
select pg_temp.expect_count($$ select 1 from (select public.caixa_toque(a.dev, a.tok, 5) j from dose_args a) x
                               where not (j->>'ok')::boolean $$, 1, 'compartimento inválido recusado');
select pg_temp.expect_count($$ select 1 from (select public.caixa_leitura(a.dev, a.tok, null, null) j from dose_args a) x
                               where not (j->>'sensorOk')::boolean $$, 1, 'leitura vazia = sensor sem sinal');
reset role;
select pg_temp.expect_count($$ select 1 from public.devices where sensor_ok = false and temp is null and humidity is null $$, 1, 'sensor sem sinal apaga a última leitura da caixa');
select pg_temp.expect_count($$ select 1 from public.notifications where title = 'Sensor da caixa sem sinal' $$, 1, 'sensor sem sinal vira notificação');
set local role anon;
select pg_temp.expect_count($$ select 1 from (select public.caixa_leitura(a.dev, a.tok, 10, 50) j from dose_args a) x
                               where (j->>'alerta')::boolean $$, 1, 'temperatura baixa (10 °C) gera alerta');
select pg_temp.expect_count($$ select 1 from (select public.caixa_leitura(a.dev, a.tok, 24, 20) j from dose_args a) x
                               where (j->>'alerta')::boolean $$, 1, 'umidade baixa (20%) gera alerta');
reset role;
set local role authenticated;
select pg_temp.expect_count($$ select 1 from public.device_touches where compartment = 0 and demo $$, 1, 'a dona vê o toque');
select pg_temp.expect_count($$ select 1 from public.devices where demo_mode and sensor_ok $$, 1, 'a dona vê o modo demo e o sensor ok');
reset role;
select set_config('request.jwt.claim.sub', 'dddddddd-0000-0000-0000-000000000002', true);
set local role authenticated;
select pg_temp.expect_count($$ select 1 from public.device_touches $$, 0, 'outro usuário não vê os toques');
reset role;
select set_config('request.jwt.claim.sub', 'cccccccc-0000-0000-0000-000000000001', true);
set local role authenticated;

-- ---------- 9. desparear ----------
select public.desparear_caixa((select (j->>'deviceId')::uuid from box));
reset role;
set local role anon;
select pg_temp.expect_error($$ select public.caixa_agenda(a.dev, a.tok) from dose_args a $$, 'não autorizada');
reset role;

rollback;  -- não deixa dados de teste
\echo '=== TODOS OS TESTES DA CAIXA PASSARAM ==='
