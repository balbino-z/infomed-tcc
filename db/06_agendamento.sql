-- =====================================================================
-- InfoMed - 06_agendamento.sql
-- Regras de negócio do agendamento DENTRO do banco + notificações automáticas.
-- Execute no SQL Editor DEPOIS do 05. Pode rodar mais de uma vez.
-- =====================================================================

-- tipo do agendamento (usado pelo padrão Factory no app)
alter table public.appointments
  add column if not exists kind text not null default 'consulta';
alter table public.appointments drop constraint if exists appointments_kind_check;
alter table public.appointments
  add constraint appointments_kind_check check (kind in ('consulta','retorno','exame'));

-- uma pessoa não pode ter duas consultas ativas no mesmo horário
create unique index if not exists appointments_no_overlap_per_user
  on public.appointments (user_id, starts_at) where status = 'agendada';

-- ---------- REGRAS (validação no servidor: o app não consegue burlar) ----------
create or replace function public.validate_appointment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  u        record;
  local_ts timestamp;
  dow      int;
  active_count int;
begin
  if tg_op = 'INSERT' then
    select h.opens_at, h.closes_at into u
      from public.doctors d join public.health_units h on h.id = d.unit_id
     where d.id = new.doctor_id;
    if not found then
      raise exception 'Médico inválido';
    end if;

    local_ts := new.starts_at at time zone 'America/Sao_Paulo';
    dow := extract(dow from local_ts);

    if new.status <> 'agendada' then
      raise exception 'Novo agendamento deve começar como agendada';
    end if;
    if new.starts_at <= now() then
      raise exception 'O horário precisa estar no futuro';
    end if;
    if new.starts_at > now() + interval '60 days' then
      raise exception 'Agendamento permitido em até 60 dias';
    end if;
    if dow in (0, 6) then
      raise exception 'A unidade atende de segunda a sexta';
    end if;
    if extract(minute from local_ts) not in (0, 30) or extract(second from local_ts) <> 0 then
      raise exception 'Horários de 30 em 30 minutos';
    end if;
    if local_ts::time < u.opens_at or (local_ts::time + interval '30 minutes') > u.closes_at then
      raise exception 'Horário fora do atendimento da unidade';
    end if;

    select count(*) into active_count
      from public.appointments
     where user_id = new.user_id and status = 'agendada' and starts_at > now();
    if active_count >= 5 then
      raise exception 'Limite de 5 consultas ativas';
    end if;

  elsif tg_op = 'UPDATE' then
    if new.user_id <> old.user_id or new.doctor_id <> old.doctor_id
       or new.starts_at <> old.starts_at or new.kind <> old.kind then
      raise exception 'Só é permitido cancelar a consulta';
    end if;
    if new.status <> old.status then
      if not (old.status = 'agendada' and new.status = 'cancelada') then
        raise exception 'Mudança de status não permitida';
      end if;
      if old.starts_at <= now() then
        raise exception 'Consulta passada não pode ser cancelada';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_validate on public.appointments;
create trigger appointments_validate
  before insert or update on public.appointments
  for each row execute function public.validate_appointment();

-- ---------- NOTIFICAÇÕES AUTOMÁTICAS (quem cria é o servidor) ----------
create or replace function public.notify_appointment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  info record;
  local_ts timestamp;
begin
  select d.name as doctor, u.name as unit into info
    from public.doctors d join public.health_units u on u.id = d.unit_id
   where d.id = new.doctor_id;
  local_ts := new.starts_at at time zone 'America/Sao_Paulo';

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, title, body)
    values (new.user_id, 'appointment', 'Consulta agendada',
            info.doctor || ' em ' || to_char(local_ts, 'DD/MM/YYYY') || ' às ' ||
            to_char(local_ts, 'HH24:MI') || ' - ' || info.unit);
  elsif tg_op = 'UPDATE' and new.status = 'cancelada' and old.status <> 'cancelada' then
    insert into public.notifications (user_id, type, title, body)
    values (new.user_id, 'appointment', 'Consulta cancelada',
            info.doctor || ' em ' || to_char(local_ts, 'DD/MM/YYYY') || ' às ' ||
            to_char(local_ts, 'HH24:MI') || ' foi cancelada.');
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_notify on public.appointments;
create trigger appointments_notify
  after insert or update on public.appointments
  for each row execute function public.notify_appointment();

-- ---------- VIEW: minhas consultas já com médico, especialidade e unidade ----------
create or replace view public.my_appointments
with (security_invoker = true) as
select a.id, a.kind, a.starts_at, a.status, a.cancel_reason,
       d.name as doctor_name, d.crm, s.name as specialty,
       u.name as unit_name, u.address as unit_address
  from public.appointments a
  join public.doctors d       on d.id = a.doctor_id
  join public.specialties s   on s.id = d.specialty_id
  join public.health_units u  on u.id = d.unit_id;

grant select on public.my_appointments to authenticated;
