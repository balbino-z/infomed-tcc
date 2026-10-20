-- =====================================================================
-- InfoMed - 01_schema.sql
-- Tabelas, segurança (RLS), função auxiliar e view de medicamentos.
-- Execute UMA vez no Supabase: SQL Editor > New query > colar > Run.
-- =====================================================================

-- ---------- TABELAS PÚBLICAS (catálogo: qualquer pessoa pode ler) ----------

create table public.medications (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  dosage      text not null,            -- ex.: '50mg'
  form        text not null,            -- ex.: 'Comprimido'
  description text not null,            -- ex.: 'Anti-hipertensivo'
  leaflet_url text,
  created_at  timestamptz not null default now()
);

create table public.health_units (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text not null,
  lat        double precision not null,
  lng        double precision not null,
  opens_at   time not null default '07:00',
  closes_at  time not null default '17:00',
  services   text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.unit_medications (
  unit_id       uuid not null references public.health_units(id) on delete cascade,
  medication_id uuid not null references public.medications(id)  on delete cascade,
  status        text not null check (status in ('disponivel','atencao','indisponivel')),
  updated_at    timestamptz not null default now(),
  primary key (unit_id, medication_id)
);

create table public.specialties (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  color text not null default '#0A73FF'
);

create table public.doctors (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  crm          text not null unique,
  specialty_id uuid not null references public.specialties(id),
  unit_id      uuid not null references public.health_units(id)
);

-- ---------- TABELAS PRIVADAS (dados pessoais: cada usuário só vê o seu) ----------

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  birth_date      date,
  phone           text,
  lgpd_consent_at timestamptz,          -- quando o usuário aceitou os termos (LGPD)
  created_at      timestamptz not null default now()
);

create table public.appointments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  doctor_id   uuid not null references public.doctors(id),
  starts_at   timestamptz not null,
  status      text not null default 'agendada'
              check (status in ('agendada','cancelada','concluida')),
  cancel_reason text,
  created_at  timestamptz not null default now()
);
-- impede dois agendamentos ativos no mesmo horário para o mesmo médico
create unique index appointments_no_double_booking
  on public.appointments (doctor_id, starts_at) where status = 'agendada';
create index appointments_user_idx on public.appointments (user_id, starts_at);

create table public.reminders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id),
  times         text[] not null,          -- ex.: {'08:00','20:00'}
  days_of_week  int[]  not null default '{0,1,2,3,4,5,6}',  -- 0=domingo
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index reminders_user_idx on public.reminders (user_id);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type       text not null check (type in ('appointment','medication','posto','system')),
  title      text not null,
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------- PERFIL CRIADO AUTOMATICAMENTE NO CADASTRO ----------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- HORÁRIOS JÁ OCUPADOS (sem expor consultas de outras pessoas) ----------

create function public.booked_slots(p_doctor uuid, p_from timestamptz, p_to timestamptz)
returns setof timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select starts_at
  from public.appointments
  where doctor_id = p_doctor
    and status = 'agendada'
    and starts_at >= p_from
    and starts_at <  p_to;
$$;

-- ---------- VIEW: status agregado do medicamento (usado pela tela) ----------

create view public.medications_with_status
with (security_invoker = true) as
select
  m.id, m.name, m.dosage, m.form, m.description, m.leaflet_url,
  case
    when bool_or(um.status = 'disponivel') then 'disponivel'
    when bool_or(um.status = 'atencao')    then 'atencao'
    else 'indisponivel'
  end as status
from public.medications m
left join public.unit_medications um on um.medication_id = m.id
group by m.id;

-- ---------- SEGURANÇA: RLS ----------

alter table public.medications      enable row level security;
alter table public.health_units     enable row level security;
alter table public.unit_medications enable row level security;
alter table public.specialties      enable row level security;
alter table public.doctors          enable row level security;
alter table public.profiles         enable row level security;
alter table public.appointments     enable row level security;
alter table public.reminders        enable row level security;
alter table public.notifications    enable row level security;

-- catálogo: leitura para todos, escrita só pelo painel/administrador
create policy "catalogo_leitura" on public.medications      for select to anon, authenticated using (true);
create policy "catalogo_leitura" on public.health_units     for select to anon, authenticated using (true);
create policy "catalogo_leitura" on public.unit_medications for select to anon, authenticated using (true);
create policy "catalogo_leitura" on public.specialties      for select to anon, authenticated using (true);
create policy "catalogo_leitura" on public.doctors          for select to anon, authenticated using (true);

-- profiles
create policy "profiles_select_proprio" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_proprio" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- appointments
create policy "appointments_select_proprio" on public.appointments
  for select to authenticated using (user_id = (select auth.uid()));
create policy "appointments_insert_proprio" on public.appointments
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "appointments_update_proprio" on public.appointments
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- reminders
create policy "reminders_select_proprio" on public.reminders
  for select to authenticated using (user_id = (select auth.uid()));
create policy "reminders_insert_proprio" on public.reminders
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "reminders_update_proprio" on public.reminders
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "reminders_delete_proprio" on public.reminders
  for delete to authenticated using (user_id = (select auth.uid()));

-- notifications (o usuário lê e marca como lida; quem cria é o servidor)
create policy "notifications_select_proprio" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications_update_proprio" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- PERMISSÕES (GRANT) ----------
-- O RLS filtra LINHAS; o GRANT libera a TABELA. Os dois são necessários.

grant select on public.medications, public.health_units, public.unit_medications,
                public.specialties, public.doctors, public.medications_with_status
  to anon, authenticated;

grant select, update on public.profiles      to authenticated;
grant select, insert, update on public.appointments to authenticated;
grant select, insert, update, delete on public.reminders to authenticated;
grant select, update on public.notifications to authenticated;

revoke execute on function public.booked_slots(uuid, timestamptz, timestamptz) from public, anon;
grant  execute on function public.booked_slots(uuid, timestamptz, timestamptz) to authenticated;
