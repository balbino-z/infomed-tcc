import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { compartmentOf, type Device, type DeviceReading, type DeviceTouch, type PairingCode } from '../../domain/device';
import type { DeviceRepository } from '../DeviceRepository';

interface Row {
  id: string; name: string; paired_at: string; last_seen_at: string | null; firmware: string | null;
  temp: number | string | null; humidity: number | string | null;
  demo_mode?: boolean; sensor_ok?: boolean | null;
}
const num = (v: number | string | null) => (v === null || v === undefined ? null : Number(v));

// colunas explícitas: o token_hash não é liberado nem para o dono (db/10)
const COLS = 'id, name, paired_at, last_seen_at, firmware, temp, humidity';
const COLS_DEMO = `${COLS}, demo_mode, sensor_ok`;

/** O db/11_caixa_demo.sql ainda não foi executado no Supabase? (coluna, tabela ou função faltando) */
const missingDb11 = (e: PostgrestError | null) => !!e && ['42703', '42P01', 'PGRST202', 'PGRST204', 'PGRST205'].includes(e.code);
const DB11_MSG = 'Falta rodar o db/11_caixa_demo.sql no Supabase.';

export class SupabaseDeviceRepository implements DeviceRepository {
  constructor(private readonly db: SupabaseClient) {}

  async listMine(): Promise<Device[]> {
    const list = (cols: string) => this.db.from('devices').select(cols).is('revoked_at', null).order('paired_at');
    let res = await list(COLS_DEMO);
    // banco sem o db/11: mostra a caixa mesmo assim, sem modo demo e sem status do sensor
    if (missingDb11(res.error)) res = await list(COLS);
    if (res.error) throw new Error('Não foi possível carregar a caixa.');
    return (res.data as unknown as Row[]).map((r) => ({
      id: r.id, name: r.name, pairedAt: r.paired_at, lastSeenAt: r.last_seen_at, firmware: r.firmware,
      temp: num(r.temp), humidity: num(r.humidity),
      demoMode: r.demo_mode ?? false, sensorOk: r.sensor_ok ?? null,
    }));
  }

  async startPairing(): Promise<PairingCode> {
    const { data, error } = await this.db.rpc('iniciar_pareamento');
    if (error) throw new Error(error.message || 'Não foi possível gerar o código.');
    return data as PairingCode;
  }

  async unpair(deviceId: string) {
    const { error } = await this.db.rpc('desparear_caixa', { p_device: deviceId });
    if (error) throw new Error(error.message || 'Não foi possível desparear.');
  }

  async readings(deviceId: string, hours = 24): Promise<DeviceReading[]> {
    const since = new Date(Date.now() - hours * 3_600_000).toISOString();
    const { data, error } = await this.db
      .from('device_readings')
      .select('measured_at, temp, humidity')
      .eq('device_id', deviceId)
      .gte('measured_at', since)
      .order('measured_at');
    if (error) throw new Error('Não foi possível carregar o histórico do sensor.');
    return (data as { measured_at: string; temp: number | string | null; humidity: number | string | null }[]).map((r) => ({
      measuredAt: r.measured_at, temp: num(r.temp), humidity: num(r.humidity),
    }));
  }

  async setDemoMode(deviceId: string, on: boolean) {
    const { error } = await this.db.rpc('definir_modo_demo', { p_device: deviceId, p_on: on });
    if (missingDb11(error)) throw new Error(DB11_MSG);
    if (error) throw new Error(error.message || 'Não foi possível mudar o modo demonstração.');
  }

  async touches(deviceId: string, limit = 10): Promise<DeviceTouch[]> {
    const { data, error } = await this.db
      .from('device_touches')
      .select('compartment, touched_at, dose, demo')
      .eq('device_id', deviceId)
      .order('touched_at', { ascending: false })
      .limit(limit);
    if (missingDb11(error)) return [];
    if (error) throw new Error('Não foi possível carregar os toques da caixa.');
    return (data as { compartment: number; touched_at: string; dose: boolean; demo: boolean }[]).map((r) => ({
      compartment: compartmentOf(r.compartment), touchedAt: r.touched_at, dose: r.dose, demo: r.demo,
    }));
  }
}
