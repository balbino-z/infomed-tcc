-- =====================================================================
-- InfoMed - db/demo/demo_data.sql
-- *** DADOS DE DEMONSTRAÇÃO (FICTÍCIOS) ***
-- Cria 40 usuários de mentira (demoN@infomed.invalid, sem senha: ninguém consegue entrar
-- com eles), algumas centenas de consultas e lembretes, só para o painel de BI ter
-- o que mostrar na apresentação. NÃO são dados reais de pacientes.
--
-- Execute no SQL Editor DEPOIS do 08 e do 09. Para apagar tudo: db/demo/remove_demo_data.sql
-- Se rodar duas vezes, primeiro apaga os dados de demonstração anteriores.
-- =====================================================================
begin;

-- limpa uma carga anterior (apaga em cascata perfis, consultas, lembretes e notificações)
delete from auth.users where email like 'demo%@infomed.invalid';

-- ---------- 40 usuários fictícios ----------
insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
select gen_random_uuid(), 'authenticated', 'authenticated',
       'demo' || n || '@infomed.invalid',
       jsonb_build_object(
         'full_name', 'Demo ' || n || ' (DADOS DE DEMONSTRAÇÃO)',
         -- cerca de 90% aceitaram os termos (o restante simula contas antigas)
         'lgpd_consent_at', case when n % 10 <> 0 then (now() - (n * 2 || ' days')::interval)::text end
       ),
       now() - (n * 2 || ' days')::interval,
       now()
  from generate_series(1, 40) n;

-- o gatilho criou os perfis com a data de hoje; espalha o cadastro nos últimos 80 dias
update public.profiles p
   set created_at = u.created_at
  from auth.users u
 where u.id = p.id and u.email like 'demo%@infomed.invalid';

-- ---------- consultas ----------
-- As regras do gatilho (horário no futuro, antecedência etc.) valem para o app; aqui
-- precisamos de consultas PASSADAS, então os gatilhos de usuário ficam desligados só
-- durante esta carga (isso também evita criar notificações falsas).
alter table public.appointments disable trigger user;

with demo_users as (
  select id, row_number() over (order by email) - 1 as idx
    from auth.users where email like 'demo%@infomed.invalid'
),
-- Todos os horários possíveis (dias úteis, de 30 em 30 min) dos últimos 70 dias aos próximos 20.
-- MATERIALIZED: sem isso o PostgreSQL pode calcular random() antes do filtro e a
-- distribuição por hora fica errada.
slots as materialized (
  select d.id as doctor_id,
         ((day::date + h.opens_at + k * interval '30 minutes')::timestamp at time zone 'America/Sao_Paulo') as starts_at,
         extract(hour from h.opens_at + k * interval '30 minutes')::int as hour
    from public.doctors d
    join public.health_units h on h.id = d.unit_id
   cross join generate_series(current_date - 70, current_date + 20, interval '1 day') day
   cross join lateral generate_series(0, (extract(epoch from (h.closes_at - h.opens_at)) / 1800)::int - 1) k
   where extract(dow from day) between 1 and 5
),
-- Amostra ponderada: mais procura de manhã (7h-10h) e menos no fim da tarde
picked as materialized (
  select s.*, row_number() over () as rn
    from (
      select * from slots
       order by -ln(1 - random()) / case when hour between 7 and 9 then 3.0
                                         when hour between 10 and 11 then 2.0
                                         when hour between 12 and 13 then 0.7
                                         else 1.0 end
       limit 420
    ) s
)
insert into public.appointments (user_id, doctor_id, starts_at, kind, status, cancel_reason, created_at)
select u.id, p.doctor_id, p.starts_at,
       case when r.k < 0.7 then 'consulta' when r.k < 0.9 then 'retorno' else 'exame' end,
       case when r.c < 0.13 then 'cancelada' else 'agendada' end,
       case when r.c < 0.13 then 'Dados de demonstração' end,
       least(now(), p.starts_at - (1 + floor(r.d * 14)) * interval '1 day')
  from picked p
  join demo_users u on u.idx = p.rn % 40
 cross join lateral (select random() as k, random() as c, random() as d, p.rn as dep) r
on conflict do nothing;

alter table public.appointments enable trigger user;

-- ---------- lembretes (metade dos usuários) ----------
insert into public.reminders (user_id, label, times, days_of_week, active)
select u.id, 'Lembrete de demonstração', '{08:00,20:00}', '{0,1,2,3,4,5,6}', (row_number() over (order by u.email)) % 5 <> 0
  from auth.users u
 where u.email like 'demo%@infomed.invalid'
   and right(split_part(u.email, '@', 1), 1) in ('1', '3', '5', '7', '9');

commit;

-- conferência
select (select count(*) from auth.users where email like 'demo%@infomed.invalid') as usuarios_demo,
       (select count(*) from public.appointments a join auth.users u on u.id = a.user_id
         where u.email like 'demo%@infomed.invalid') as consultas_demo;
