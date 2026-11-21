-- =====================================================================
-- InfoMed - 10_caixa.sql
-- Caixa de remédios inteligente (ESP32): pareamento, doses tomadas,
-- leituras do sensor, adesão do paciente e adesão agregada no BI.
-- Execute no SQL Editor DEPOIS do 09. Pode rodar mais de uma vez.
-- Depois deste, rode o 11_caixa_demo.sql (ele substitui caixa_agenda e caixa_leitura).
--
-- Segurança (ver docs/hardware/caixa-de-remedios.md):
--  * A caixa usa só a chave publishable (papel anon) e NÃO tem acesso a
--    nenhuma tabela: só executa as funções caixa_* e parear_caixa.
--  * Cada caixa tem um token aleatório; o banco guarda só o hash (SHA-256).
--  * Código de pareamento: 6 dígitos, 10 minutos, uso único; o banco guarda
--    só o hash; erros em excesso bloqueiam novas tentativas por 1 minuto.
--  * Adesão é dado de saúde (LGPD): RLS no que é do paciente e, no BI,
--    só números agregados, escondendo grupos com menos de 5 pacientes.
-- =====================================================================

-- ---------- TABELAS ----------
create table if not exists public.devices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null default 'Caixa de remédios' check (length(trim(name)) between 1 and 40),
  token_hash   text not null,
  paired_at    timestamptz not null default now(),
  last_seen_at timestamptz,
  firmware     text check (firmware is null or length(firmware) <= 20),
  temp         numeric(4,1),
  humidity     numeric(4,1),
  revoked_at   timestamptz
);
create index if not exists devices_user_idx on public.devices (user_id);

create table if not exists public.pairing_codes (
  id         uuid primary key default gen_random_uuid(),
  code_hash  text not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at    timestamptz,
  device_id  uuid references public.devices(id) on delete set null
);
create index if not exists pairing_codes_hash_idx on public.pairing_codes (code_hash);

-- Tentativas erradas de pareamento (para limitar força bruta no código de 6 dígitos)
create table if not exists public.pairing_failures (
  id bigint generated always as identity primary key,
  at timestamptz not null default now()
);

create table if not exists public.dose_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  reminder_id  uuid not null references public.reminders(id) on delete cascade,
  scheduled_at timestamptz not null,
  status       text not null check (status in ('tomada', 'atrasada')),
  taken_at     timestamptz not null,
  device_id    uuid references public.devices(id) on delete set null,
  source       text not null check (source in ('caixa', 'app')),
  created_at   timestamptz not null default now(),
  -- a mesma dose nunca é contada duas vezes (reenvio da fila offline não duplica)
  constraint dose_events_unica unique (reminder_id, scheduled_at)
);
create index if not exists dose_events_user_idx on public.dose_events (user_id, scheduled_at desc);

create table if not exists public.device_readings (
  id          bigint generated always as identity primary key,
  device_id   uuid not null references public.devices(id) on delete cascade,
  measured_at timestamptz not null default now(),
  temp        numeric(4,1),
  humidity    numeric(4,1)
);
create index if not exists device_readings_idx on public.device_readings (device_id, measured_at desc);

-- ---------- RLS + GRANT (os dois são necessários) ----------
alter table public.devices          enable row level security;
alter table public.pairing_codes    enable row level security;
alter table public.pairing_failures enable row level security;
alter table public.dose_events      enable row level security;
alter table public.device_readings  enable row level security;

drop policy if exists "devices_select_proprio" on public.devices;
create policy "devices_select_proprio" on public.devices
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "dose_events_select_proprio" on public.dose_events;
create policy "dose_events_select_proprio" on public.dose_events
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "device_readings_select_proprio" on public.device_readings;
create policy "device_readings_select_proprio" on public.device_readings
  for select to authenticated
  using (exists (select 1 from public.devices d where d.id = device_id and d.user_id = auth.uid()));

-- Ninguém escreve direto nas tabelas: só pelas funções abaixo (que validam tudo).
revoke all on public.devices, public.pairing_codes, public.pairing_failures,
              public.dose_events, public.device_readings from anon, authenticated;
-- token_hash fica de fora: nem o dono lê o hash do token.
grant select (id, user_id, name, paired_at, last_seen_at, firmware, temp, humidity, revoked_at)
  on public.devices to authenticated;
grant select on public.dose_events, public.device_readings to authenticated;

-- ---------- REGRAS (funções puras) ----------
-- Compartimento: antes de 12h = manhã; de 12h às 18h = tarde; depois = noite.
create or replace function public.caixa_periodo(p_time text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p_time < '12:00' then 'manha' when p_time < '18:00' then 'tarde' else 'noite' end
$$;

-- Janela da dose: de 30 min antes até 30 min depois = tomada (no horário);
-- até 2 h depois = atrasada; fora disso = não aceita (null).
create or replace function public.dose_status(p_scheduled timestamptz, p_taken timestamptz)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_taken <  p_scheduled - interval '30 minutes' then null
    when p_taken <= p_scheduled + interval '30 minutes' then 'tomada'
    when p_taken <= p_scheduled + interval '2 hours'    then 'atrasada'
    else null
  end
$$;

grant execute on function public.caixa_periodo(text) to anon, authenticated;
grant execute on function public.dose_status(timestamptz, timestamptz) to anon, authenticated;

create or replace function public._sha256(p text)
returns text
language sql
immutable
set search_path = ''
as $$ select encode(sha256(convert_to(coalesce(p, ''), 'UTF8')), 'hex') $$;

-- ---------- FUNÇÕES INTERNAS (ninguém de fora executa) ----------
-- Confere o token da caixa e devolve o dono. Atualiza "visto por último".
create or replace function public._caixa_dono(p_device uuid, p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  select d.user_id into v_user
    from public.devices d
   where d.id = p_device
     and d.revoked_at is null
     and d.token_hash = public._sha256(p_token);
  if v_user is null then
    raise exception 'Caixa não autorizada' using errcode = '28000';
  end if;
  update public.devices set last_seen_at = now() where id = p_device;
  return v_user;
end;
$$;

-- Grava uma dose (da caixa ou do app). Erro de regra volta como {ok:false},
-- e não como exceção, para a caixa descartar o item da fila em vez de repetir.
create or replace function public._gravar_dose(p_user uuid, p_reminder uuid, p_scheduled timestamptz,
                                               p_taken timestamptz, p_device uuid, p_source text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r        public.reminders;
  v_local  timestamp;
  v_status text;
  v_id     uuid;
begin
  select * into r from public.reminders where id = p_reminder and user_id = p_user;
  if not found then
    return jsonb_build_object('ok', false, 'erro', 'Lembrete não encontrado');
  end if;

  v_local := p_scheduled at time zone 'America/Sao_Paulo';
  if date_trunc('minute', v_local) <> v_local
     or not (to_char(v_local, 'HH24:MI') = any (r.times))
     or not (extract(dow from v_local)::int = any (r.days_of_week)) then
    return jsonb_build_object('ok', false, 'erro', 'Horário não pertence ao lembrete');
  end if;
  if p_scheduled < now() - interval '7 days' then
    return jsonb_build_object('ok', false, 'erro', 'Dose antiga demais');
  end if;
  if p_taken > now() + interval '5 minutes' then
    return jsonb_build_object('ok', false, 'erro', 'Horário da dose está no futuro');
  end if;

  v_status := public.dose_status(p_scheduled, p_taken);
  if v_status is null then
    return jsonb_build_object('ok', false, 'erro', 'Fora da janela da dose (de 30 min antes até 2 h depois)');
  end if;

  insert into public.dose_events (user_id, reminder_id, scheduled_at, status, taken_at, device_id, source)
  values (p_user, p_reminder, p_scheduled, v_status, p_taken, p_device, p_source)
  on conflict (reminder_id, scheduled_at) do nothing
  returning id into v_id;

  if v_id is null then
    select status into v_status from public.dose_events where reminder_id = p_reminder and scheduled_at = p_scheduled;
  end if;
  return jsonb_build_object('ok', true, 'status', v_status, 'repetida', v_id is null);
end;
$$;

-- Doses PREVISTAS a partir dos lembretes (dias × horários), cruzadas com as tomadas.
-- Não depende da caixa estar ligada: sem registro e passado o prazo = esquecida.
-- p_user nulo = todos os usuários (uso exclusivo do BI agregado).
create or replace function public._doses_previstas(p_user uuid, p_days int)
returns table (user_id uuid, reminder_id uuid, dia date, horario text, periodo text,
               scheduled_at timestamptz, situacao text)
language sql
stable
security definer
set search_path = ''
as $$
  with dias as (
    select g::date as dia
      from generate_series((now() at time zone 'America/Sao_Paulo')::date - (p_days - 1),
                           (now() at time zone 'America/Sao_Paulo')::date, interval '1 day') g
  ), previstas as (
    select r.user_id, r.id as reminder_id, d.dia, t.horario,
           ((d.dia + t.horario::time) at time zone 'America/Sao_Paulo') as scheduled_at,
           r.created_at
      from public.reminders r
      cross join dias d
      cross join lateral unnest(r.times) as t(horario)
     where r.active
       and (p_user is null or r.user_id = p_user)
       and extract(dow from d.dia)::int = any (r.days_of_week)
  )
  select p.user_id, p.reminder_id, p.dia, p.horario, public.caixa_periodo(p.horario), p.scheduled_at,
         case
           when e.status is not null then e.status
           when p.scheduled_at + interval '2 hours' < now() then 'esquecida'
           else 'pendente'
         end
    from previstas p
    left join public.dose_events e on e.reminder_id = p.reminder_id and e.scheduled_at = p.scheduled_at
   where p.scheduled_at >= date_trunc('minute', p.created_at) - interval '30 minutes'  -- não cobra dose de antes do lembrete existir
      or e.status is not null
$$;

revoke all on function public._sha256(text) from public, anon, authenticated;
revoke all on function public._caixa_dono(uuid, text) from public, anon, authenticated;
revoke all on function public._gravar_dose(uuid, uuid, timestamptz, timestamptz, uuid, text) from public, anon, authenticated;
revoke all on function public._doses_previstas(uuid, int) from public, anon, authenticated;

-- ---------- APP (usuário logado) ----------
-- Gera o código de 6 dígitos (guarda só o hash), válido por 10 minutos.
create or replace function public.iniciar_pareamento()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_code text;
  v_hash text;
  v_b    bytea;
  v_exp  timestamptz := now() + interval '10 minutes';
  i      int := 0;
begin
  if v_user is null then
    raise exception 'Faça login para parear a caixa' using errcode = '42501';
  end if;
  if (select count(*) from public.pairing_codes where user_id = v_user and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'Muitos códigos gerados. Aguarde alguns minutos.';
  end if;

  -- só o código mais novo vale
  update public.pairing_codes set expires_at = now()
   where user_id = v_user and used_at is null and expires_at > now();

  loop
    v_b := uuid_send(gen_random_uuid());  -- bytes aleatórios do gerador seguro do PostgreSQL
    v_code := lpad((((get_byte(v_b, 0)::bigint << 24) + (get_byte(v_b, 1) << 16)
                     + (get_byte(v_b, 2) << 8) + get_byte(v_b, 3)) % 1000000)::text, 6, '0');
    v_hash := public._sha256(v_code);
    exit when not exists (select 1 from public.pairing_codes
                           where code_hash = v_hash and used_at is null and expires_at > now());
    i := i + 1;
    if i > 20 then raise exception 'Não foi possível gerar o código. Tente de novo.'; end if;
  end loop;

  insert into public.pairing_codes (code_hash, user_id, expires_at) values (v_hash, v_user, v_exp);
  return jsonb_build_object('code', v_code, 'expiresAt', v_exp);
end;
$$;

-- Dose confirmada pelo botão "Tomei" (quem não tem caixa). source = app.
create or replace function public.registrar_dose_app(p_reminder uuid, p_scheduled timestamptz)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Faça login' using errcode = '42501';
  end if;
  return public._gravar_dose(auth.uid(), p_reminder, p_scheduled, now(), null, 'app');
end;
$$;

create or replace function public.desparear_caixa(p_device uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update public.devices set revoked_at = now()
   where id = p_device and user_id = auth.uid() and revoked_at is null;
  if not found then
    raise exception 'Caixa não encontrada';
  end if;
end;
$$;

-- Adesão do próprio paciente: previstas (já encerradas) × tomadas.
create or replace function public.minha_adesao(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  result jsonb;
begin
  if v_user is null then
    raise exception 'Faça login' using errcode = '42501';
  end if;
  if p_days is null or p_days < 1 or p_days > 365 then
    raise exception 'Período deve ser de 1 a 365 dias';
  end if;

  with d as (
    select * from public._doses_previstas(v_user, p_days) where situacao <> 'pendente'
  )
  select jsonb_build_object(
    'days',     p_days,
    'expected', (select count(*) from d),
    'taken',    (select count(*) from d where situacao in ('tomada', 'atrasada')),
    'onTime',   (select count(*) from d where situacao = 'tomada'),
    'late',     (select count(*) from d where situacao = 'atrasada'),
    'missed',   (select count(*) from d where situacao = 'esquecida'),
    'byDay', coalesce((
      select jsonb_agg(jsonb_build_object('day', dia, 'expected', exp, 'taken', tk) order by dia)
        from (select dia, count(*) as exp, count(*) filter (where situacao in ('tomada', 'atrasada')) as tk
                from d group by dia) x), '[]'::jsonb),
    'byPeriod', coalesce((
      select jsonb_agg(jsonb_build_object('period', periodo, 'expected', exp, 'taken', tk)
                       order by array_position(array['manha', 'tarde', 'noite'], periodo))
        from (select periodo, count(*) as exp, count(*) filter (where situacao in ('tomada', 'atrasada')) as tk
                from d group by periodo) x), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.iniciar_pareamento() from public, anon;
revoke all on function public.registrar_dose_app(uuid, timestamptz) from public, anon;
revoke all on function public.desparear_caixa(uuid) from public, anon;
revoke all on function public.minha_adesao(int) from public, anon;
grant execute on function public.iniciar_pareamento() to authenticated;
grant execute on function public.registrar_dose_app(uuid, timestamptz) to authenticated;
grant execute on function public.desparear_caixa(uuid) to authenticated;
grant execute on function public.minha_adesao(int) to authenticated;

-- ---------- CAIXA (chave publishable, papel anon) ----------
-- Valida o código e devolve o token UMA única vez. Erros voltam como {ok:false}
-- (e não exceção) para que a tentativa errada fique registrada.
create or replace function public.parear_caixa(p_code text, p_name text default null, p_firmware text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c        public.pairing_codes;
  v_token  text;
  v_device uuid;
begin
  delete from public.pairing_failures where at < now() - interval '1 hour';
  if (select count(*) from public.pairing_failures where at > now() - interval '1 minute') >= 10 then
    return jsonb_build_object('ok', false, 'erro', 'Muitas tentativas. Aguarde 1 minuto.');
  end if;

  select * into c from public.pairing_codes
   where code_hash = public._sha256(trim(coalesce(p_code, '')))
     and used_at is null and expires_at > now()
   order by created_at desc
   limit 1
   for update;
  if not found or coalesce(p_code, '') !~ '^\s*[0-9]{6}\s*$' then
    insert into public.pairing_failures default values;
    return jsonb_build_object('ok', false, 'erro', 'Código inválido ou expirado');
  end if;

  -- 32 bytes de dois UUID v4 (244 bits aleatórios), em hexadecimal
  v_token := encode(uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid()), 'hex');

  insert into public.devices (user_id, name, token_hash, firmware, last_seen_at)
  values (c.user_id,
          coalesce(nullif(left(trim(p_name), 40), ''), 'Caixa de remédios'),
          public._sha256(v_token),
          left(p_firmware, 20),
          now())
  returning id into v_device;

  update public.pairing_codes set used_at = now(), device_id = v_device where id = c.id;
  return jsonb_build_object('ok', true, 'deviceId', v_device, 'token', v_token);
end;
$$;

-- Agenda do dono: só horários, dias e o nome do lembrete. Inclui a hora do
-- servidor (para acertar o relógio se o NTP falhar) e as doses já tomadas.
create or replace function public.caixa_agenda(p_device uuid, p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := public._caixa_dono(p_device, p_token);
begin
  return jsonb_build_object(
    'agora', extract(epoch from now())::bigint,
    'lembretes', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', r.id,
               'nome', left(coalesce(nullif(trim(r.label), ''), m.name, 'Remédio'), 40),
               'horarios', to_jsonb(r.times),
               'dias', to_jsonb(r.days_of_week)) order by r.created_at)
        from public.reminders r
        left join public.medications m on m.id = r.medication_id
       where r.user_id = v_user and r.active), '[]'::jsonb),
    'tomadas', coalesce((
      select jsonb_agg(jsonb_build_object('lembrete', e.reminder_id,
                                          'agendada', extract(epoch from e.scheduled_at)::bigint))
        from public.dose_events e
       where e.user_id = v_user and e.scheduled_at > now() - interval '26 hours'), '[]'::jsonb)
  );
end;
$$;

create or replace function public.caixa_registrar_dose(p_device uuid, p_token text, p_reminder uuid,
                                                       p_scheduled bigint, p_taken bigint)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user uuid := public._caixa_dono(p_device, p_token);
begin
  return public._gravar_dose(v_user, p_reminder, to_timestamp(p_scheduled), to_timestamp(p_taken), p_device, 'caixa');
end;
$$;

-- Leitura do sensor. Fora da faixa (acima de 30 °C ou 75% de umidade) gera
-- uma notificação para o dono, no máximo uma a cada 6 horas.
create or replace function public.caixa_leitura(p_device uuid, p_token text, p_temp numeric,
                                                p_umid numeric, p_firmware text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user   uuid := public._caixa_dono(p_device, p_token);
  v_alerta boolean;
begin
  if p_temp is not null and (p_temp < -20 or p_temp > 80) then p_temp := null; end if;
  if p_umid is not null and (p_umid < 0 or p_umid > 100) then p_umid := null; end if;

  insert into public.device_readings (device_id, temp, humidity) values (p_device, p_temp, p_umid);
  delete from public.device_readings where device_id = p_device and measured_at < now() - interval '30 days';
  update public.devices
     set temp = coalesce(p_temp, temp), humidity = coalesce(p_umid, humidity),
         firmware = coalesce(left(p_firmware, 20), firmware)
   where id = p_device;

  v_alerta := coalesce(p_temp > 30, false) or coalesce(p_umid > 75, false);
  if v_alerta and not exists (
      select 1 from public.notifications n
       where n.user_id = v_user and n.type = 'system' and n.title = 'Caixa de remédios fora da faixa'
         and n.created_at > now() - interval '6 hours') then
    insert into public.notifications (user_id, type, title, body)
    values (v_user, 'system', 'Caixa de remédios fora da faixa',
            'Sua caixa está a ' || coalesce(p_temp::text || ' °C', '?') || ' e '
            || coalesce(p_umid::text || '% de umidade', '?')
            || '. Guarde os remédios em local fresco e seco (até 30 °C).');
  end if;
  return jsonb_build_object('ok', true, 'alerta', v_alerta);
end;
$$;

revoke all on function public.parear_caixa(text, text, text) from public;
revoke all on function public.caixa_agenda(uuid, text) from public;
revoke all on function public.caixa_registrar_dose(uuid, text, uuid, bigint, bigint) from public;
revoke all on function public.caixa_leitura(uuid, text, numeric, numeric, text) from public;
grant execute on function public.parear_caixa(text, text, text) to anon, authenticated;
grant execute on function public.caixa_agenda(uuid, text) to anon, authenticated;
grant execute on function public.caixa_registrar_dose(uuid, text, uuid, bigint, bigint) to anon, authenticated;
grant execute on function public.caixa_leitura(uuid, text, numeric, numeric, text) to anon, authenticated;

-- ---------- BI (só administrador, só agregado) ----------
-- Grupos com menos de 5 pacientes têm a taxa escondida (rate = null),
-- para ninguém ser identificado pela adesão.
create or replace function public.bi_adesao(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  k constant int := 5;
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao administrador' using errcode = '42501';
  end if;
  if p_days is null or p_days < 1 or p_days > 365 then
    raise exception 'Período deve ser de 1 a 365 dias';
  end if;

  with d as (
    select * from public._doses_previstas(null, p_days) where situacao <> 'pendente'
  ), tot as (
    select count(distinct user_id) as pac, count(*) as exp,
           count(*) filter (where situacao in ('tomada', 'atrasada')) as tk
      from d
  )
  select jsonb_build_object(
    'days', p_days,
    'minGroup', k,
    'patients', (select pac from tot),
    'expected', (select case when pac >= k then exp end from tot),
    'taken',    (select case when pac >= k then tk end from tot),
    'rate',     (select case when pac >= k and exp > 0 then round(100.0 * tk / exp) end from tot),
    'byPeriod', coalesce((
      select jsonb_agg(jsonb_build_object('period', periodo, 'patients', pac,
                         'rate', case when pac >= k and exp > 0 then round(100.0 * tk / exp) end)
                       order by array_position(array['manha', 'tarde', 'noite'], periodo))
        from (select periodo, count(distinct user_id) as pac, count(*) as exp,
                     count(*) filter (where situacao in ('tomada', 'atrasada')) as tk
                from d group by periodo) x), '[]'::jsonb),
    'byWeek', coalesce((
      select jsonb_agg(jsonb_build_object('week', week, 'patients', pac,
                         'rate', case when pac >= k and exp > 0 then round(100.0 * tk / exp) end) order by week)
        from (select to_char(date_trunc('week', dia), 'YYYY-MM-DD') as week, count(distinct user_id) as pac,
                     count(*) as exp, count(*) filter (where situacao in ('tomada', 'atrasada')) as tk
                from d group by 1) x), '[]'::jsonb),
    'devices', jsonb_build_object(
      'active',     (select count(*) from public.devices where revoked_at is null),
      'online',     (select count(*) from public.devices where revoked_at is null and last_seen_at > now() - interval '10 minutes'),
      'tempAlerts', (select count(distinct r.device_id) from public.device_readings r
                      where r.measured_at > now() - make_interval(days => p_days)
                        and (r.temp > 30 or r.humidity > 75)))
  ) into result;
  return result;
end;
$$;

revoke all on function public.bi_adesao(int) from public, anon;
grant execute on function public.bi_adesao(int) to authenticated;
