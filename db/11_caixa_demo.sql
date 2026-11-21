  -- =====================================================================
  -- InfoMed - 11_caixa_demo.sql
  -- Caixa de remédios: modo demonstração (ligado/desligado pelo app),
  -- status do sensor, faixa de temperatura/umidade (alta E baixa) e
  -- registro dos toques nos compartimentos.
  -- Execute no SQL Editor DEPOIS do 10. Pode rodar mais de uma vez.
  -- Se rodar o 10 de novo, rode este de novo em seguida (ele substitui
  -- caixa_agenda e caixa_leitura).
  -- =====================================================================
  
  -- ---------- COLUNAS NOVAS NA CAIXA ----------
  alter table public.devices add column if not exists demo_mode boolean not null default false;
  -- null = ainda não mandou leitura · true = sensor ok · false = sensor sem sinal
  alter table public.devices add column if not exists sensor_ok boolean;
  
  -- O GRANT do 10 é por coluna: as colunas novas precisam entrar também.
  -- (token_hash continua de fora: nem o dono lê o hash do token.)
  grant select (id, user_id, name, paired_at, last_seen_at, firmware, temp, humidity, revoked_at, demo_mode, sensor_ok)
    on public.devices to authenticated;
  
  -- ---------- TOQUES NOS COMPARTIMENTOS ----------
  -- Cada vez que o paciente encosta no alumínio. dose = o toque registrou uma dose de lembrete.
  create table if not exists public.device_touches (
    id          bigint generated always as identity primary key,
    device_id   uuid not null references public.devices(id) on delete cascade,
    compartment smallint not null check (compartment between 0 and 2),  -- 0 manhã, 1 tarde, 2 noite
    touched_at  timestamptz not null default now(),
    dose        boolean not null default false,
    demo        boolean not null default false
  );
  create index if not exists device_touches_idx on public.device_touches (device_id, touched_at desc);
  
  alter table public.device_touches enable row level security;
  drop policy if exists "device_touches_select_proprio" on public.device_touches;
  create policy "device_touches_select_proprio" on public.device_touches
    for select to authenticated
    using (exists (select 1 from public.devices d where d.id = device_id and d.user_id = auth.uid()));
  revoke all on public.device_touches from anon, authenticated;
  grant select on public.device_touches to authenticated;
  
  -- ---------- APP: liga/desliga o modo demonstração ----------
  -- Só o dono, e só de caixa não revogada. A caixa recebe a mudança na próxima
  -- busca da agenda (a cada 15 s).
  create or replace function public.definir_modo_demo(p_device uuid, p_on boolean)
  returns boolean
  language plpgsql
  volatile
  security definer
  set search_path = ''
  as $$
  begin
    if auth.uid() is null then
      raise exception 'Entre na sua conta' using errcode = '28000';
    end if;
    update public.devices
       set demo_mode = coalesce(p_on, false)
     where id = p_device and user_id = auth.uid() and revoked_at is null;
    if not found then
      raise exception 'Caixa não encontrada' using errcode = 'P0002';
    end if;
    return coalesce(p_on, false);
  end;
  $$;
  revoke all on function public.definir_modo_demo(uuid, boolean) from public;
  grant execute on function public.definir_modo_demo(uuid, boolean) to authenticated;
  
  -- ---------- CAIXA: agenda (agora com o modo demonstração) ----------
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
      'demo', (select d.demo_mode from public.devices d where d.id = p_device),
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
  
  -- ---------- CAIXA: leitura do sensor ----------
  -- Temperatura E umidade nulas = sensor sem sinal (a caixa manda assim quando falha).
  -- Faixa boa: 15 a 30 °C e 30 a 75% de umidade. Fora da faixa ou sensor com falha
  -- geram notificação para o dono, no máximo uma de cada tipo a cada 6 horas.
  create or replace function public.caixa_leitura(p_device uuid, p_token text, p_temp numeric,
                                                  p_umid numeric, p_firmware text default null)
  returns jsonb
  language plpgsql
  volatile
  security definer
  set search_path = ''
  as $$
  declare
    v_user      uuid := public._caixa_dono(p_device, p_token);
    v_sensor_ok boolean;
    v_alerta    boolean;
    v_titulo    text;
    v_corpo     text;
  begin
    if p_temp is not null and (p_temp < -20 or p_temp > 80) then p_temp := null; end if;
    if p_umid is not null and (p_umid < 0 or p_umid > 100) then p_umid := null; end if;
    v_sensor_ok := p_temp is not null or p_umid is not null;
  
    insert into public.device_readings (device_id, temp, humidity) values (p_device, p_temp, p_umid);
    delete from public.device_readings where device_id = p_device and measured_at < now() - interval '30 days';
    update public.devices
       set temp      = case when v_sensor_ok then coalesce(p_temp, temp) end,
           humidity  = case when v_sensor_ok then coalesce(p_umid, humidity) end,
           sensor_ok = v_sensor_ok,
           firmware  = coalesce(left(p_firmware, 20), firmware)
     where id = p_device;
  
    v_alerta := coalesce(p_temp > 30 or p_temp < 15, false) or coalesce(p_umid > 75 or p_umid < 30, false);
  
    if not v_sensor_ok then
      v_titulo := 'Sensor da caixa sem sinal';
      v_corpo  := 'A caixa de remédios não está conseguindo medir a temperatura e a umidade. Confira o sensor.';
    elsif v_alerta then
      v_titulo := 'Caixa de remédios fora da faixa';
      v_corpo  := 'Sua caixa está a ' || coalesce(p_temp::text || ' °C', '?') || ' e '
                  || coalesce(p_umid::text || '% de umidade', '?')
                  || '. Guarde os remédios entre 15 e 30 °C, em local seco (umidade entre 30% e 75%).';
    end if;
  
    if v_titulo is not null and not exists (
        select 1 from public.notifications n
         where n.user_id = v_user and n.type = 'system' and n.title = v_titulo
           and n.created_at > now() - interval '6 hours') then
      insert into public.notifications (user_id, type, title, body) values (v_user, 'system', v_titulo, v_corpo);
    end if;
    return jsonb_build_object('ok', true, 'alerta', v_alerta, 'sensorOk', v_sensor_ok);
  end;
  $$;
  
  -- ---------- CAIXA: toque num compartimento ----------
  -- p_tocado = quando tocou (epoch, segundos); 0 = a caixa não sabe a hora (usa a do servidor).
  create or replace function public.caixa_toque(p_device uuid, p_token text, p_compartimento int,
                                                p_tocado bigint default 0, p_dose boolean default false,
                                                p_demo boolean default false)
  returns jsonb
  language plpgsql
  volatile
  security definer
  set search_path = ''
  as $$
  declare
    v_user uuid := public._caixa_dono(p_device, p_token);
    v_quando timestamptz := now();
  begin
    if p_compartimento is null or p_compartimento not between 0 and 2 then
      return jsonb_build_object('ok', false, 'erro', 'Compartimento inválido');
    end if;
    -- aceita a hora da caixa só se for plausível (até 1 dia atrás, nunca no futuro)
    if coalesce(p_tocado, 0) > 0 and to_timestamp(p_tocado) between now() - interval '1 day' and now() + interval '1 minute' then
      v_quando := to_timestamp(p_tocado);
    end if;
    insert into public.device_touches (device_id, compartment, touched_at, dose, demo)
    values (p_device, p_compartimento, v_quando, coalesce(p_dose, false), coalesce(p_demo, false));
    delete from public.device_touches where device_id = p_device and touched_at < now() - interval '7 days';
    return jsonb_build_object('ok', true);
  end;
  $$;
  
  revoke all on function public.caixa_agenda(uuid, text) from public;
  revoke all on function public.caixa_leitura(uuid, text, numeric, numeric, text) from public;
  revoke all on function public.caixa_toque(uuid, text, int, bigint, boolean, boolean) from public;
  grant execute on function public.caixa_agenda(uuid, text) to anon, authenticated;
  grant execute on function public.caixa_leitura(uuid, text, numeric, numeric, text) to anon, authenticated;
  grant execute on function public.caixa_toque(uuid, text, int, bigint, boolean, boolean) to anon, authenticated;
