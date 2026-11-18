-- =====================================================================
-- InfoMed - 08_bi.sql
-- Painel de BI: papel de administrador e UMA função que devolve indicadores
-- AGREGADOS (sem ids, nomes ou e-mails de pacientes).
-- Execute no SQL Editor DEPOIS do 07. Pode rodar mais de uma vez.
-- =====================================================================

-- ---------- ADMINISTRADOR ----------
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- SEGURANÇA CRÍTICA: até aqui o usuário podia dar UPDATE em qualquer coluna do próprio perfil.
-- Sem esta troca, qualquer pessoa se promoveria a administrador (is_admin = true)
-- ou apagaria o registro do aceite da LGPD (lgpd_consent_at).
revoke update on public.profiles from authenticated;
grant update (full_name, birth_date, phone) on public.profiles to authenticated;

-- O administrador é promovido MANUALMENTE no SQL Editor (nunca pelo app):
--   update public.profiles set is_admin = true where id = '<uuid do usuário>';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------- PAINEL ----------
-- security definer: precisa ler as consultas de todos para agregar, por isso
-- (1) recusa quem não é administrador e (2) só devolve contagens.
create or replace function public.bi_dashboard(p_days int default 90)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_from timestamptz;
  v_to   timestamptz;
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao administrador' using errcode = '42501';
  end if;
  if p_days is null or p_days < 1 or p_days > 365 then
    raise exception 'Período deve ser de 1 a 365 dias';
  end if;

  v_to   := now();
  v_from := now() - make_interval(days => p_days);

  with appts as (
    select a.id, a.kind, a.status, a.starts_at, a.created_at,
           s.name as specialty, u.name as unit_name,
           (a.starts_at at time zone 'America/Sao_Paulo') as local_ts
      from public.appointments a
      join public.doctors d      on d.id = a.doctor_id
      join public.specialties s  on s.id = d.specialty_id
      join public.health_units u on u.id = d.unit_id
     where a.created_at >= v_from   -- consultas MARCADAS no período
  )
  select jsonb_build_object(
    'period', jsonb_build_object('days', p_days, 'from', v_from, 'to', v_to),
    'kpis', jsonb_build_object(
      'appointments',          (select count(*) from appts),
      'cancelled',             (select count(*) from appts where status = 'cancelada'),
      'upcoming',              (select count(*) from public.appointments where status = 'agendada' and starts_at > now()),
      'users',                 (select count(*) from public.profiles),
      'usersWithConsent',      (select count(*) from public.profiles where lgpd_consent_at is not null),
      'newUsers',              (select count(*) from public.profiles where created_at >= v_from),
      'activeReminders',       (select count(*) from public.reminders where active),
      'usersWithReminders',    (select count(distinct user_id) from public.reminders where active)
    ),
    'bySpecialty', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'total', total, 'cancelled', cancelled) order by total desc, name)
        from (select specialty as name, count(*) as total, count(*) filter (where status = 'cancelada') as cancelled
                from appts group by specialty) x), '[]'::jsonb),
    'byUnit', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'total', total) order by total desc, name)
        from (select unit_name as name, count(*) as total from appts group by unit_name) x), '[]'::jsonb),
    'byWeek', coalesce((
      select jsonb_agg(jsonb_build_object('week', week, 'total', total, 'cancelled', cancelled) order by week)
        from (select to_char(date_trunc('week', created_at at time zone 'America/Sao_Paulo'), 'YYYY-MM-DD') as week,
                     count(*) as total, count(*) filter (where status = 'cancelada') as cancelled
                from appts group by 1) x), '[]'::jsonb),
    'byHour', coalesce((
      select jsonb_agg(jsonb_build_object('hour', hour, 'total', total) order by hour)
        from (select extract(hour from local_ts)::int as hour, count(*) as total
                from appts group by 1) x), '[]'::jsonb),
    'byKind', coalesce((
      select jsonb_agg(jsonb_build_object('kind', kind, 'total', total) order by total desc)
        from (select kind, count(*) as total from appts group by kind) x), '[]'::jsonb),
    'stockByUnit', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'disponivel', disp, 'atencao', aten, 'indisponivel', indi) order by name)
        from (select u.name,
                     count(*) filter (where um.status = 'disponivel')   as disp,
                     count(*) filter (where um.status = 'atencao')      as aten,
                     count(*) filter (where um.status = 'indisponivel') as indi
                from public.health_units u
                join public.unit_medications um on um.unit_id = u.id
               group by u.name) x), '[]'::jsonb),
    'topUnavailable', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'units', units) order by units desc, name)
        from (select m.name || ' ' || m.dosage as name, count(*) as units
                from public.unit_medications um
                join public.medications m on m.id = um.medication_id
               where um.status = 'indisponivel'
               group by m.name, m.dosage
               order by count(*) desc, m.name
               limit 5) x), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.bi_dashboard(int) from public;
grant execute on function public.bi_dashboard(int) to authenticated;
