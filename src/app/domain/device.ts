import { PERIODS, type Period } from './adherence';

/** Caixa de remédios (ESP32) pareada com a conta. O token da caixa nunca chega ao app. */
export interface Device {
  id: string;
  name: string;
  pairedAt: string;
  lastSeenAt: string | null;
  firmware: string | null;
  temp: number | null;     // °C (null = sem leitura ou sensor sem sinal)
  humidity: number | null; // %
  /** Modo demonstração: LEDs de HORA em ciclo de 5 s (db/11). */
  demoMode: boolean;
  /** null = ainda não mandou leitura · true = sensor ok · false = sensor sem sinal */
  sensorOk: boolean | null;
}

export interface PairingCode {
  code: string;      // 6 dígitos
  expiresAt: string; // ISO (10 minutos)
}

export interface DeviceReading {
  measuredAt: string;
  temp: number | null;
  humidity: number | null;
}

/** Toque no alumínio de um compartimento. dose = o toque registrou uma dose de lembrete. */
export interface DeviceTouch {
  compartment: Period;
  touchedAt: string;
  dose: boolean;
  demo: boolean;
}

// Faixa boa para guardar remédios (igual ao firmware e ao banco: db/11_caixa_demo.sql)
export const TEMP_MIN = 15;
export const TEMP_MAX = 30;
export const HUMIDITY_MIN = 30;
export const HUMIDITY_MAX = 75;

export type RangeStatus = 'baixa' | 'ok' | 'alta';

export const rangeStatus = (value: number | null, min: number, max: number): RangeStatus | null =>
  value === null ? null : value < min ? 'baixa' : value > max ? 'alta' : 'ok';

export const tempStatus = (d: Pick<Device, 'temp'>) => rangeStatus(d.temp, TEMP_MIN, TEMP_MAX);
export const humidityStatus = (d: Pick<Device, 'humidity'>) => rangeStatus(d.humidity, HUMIDITY_MIN, HUMIDITY_MAX);

/** Compartimento enviado pela caixa (0, 1, 2) -> período */
export const compartmentOf = (i: number): Period => PERIODS[Math.min(2, Math.max(0, i))];

/** A caixa fala com o servidor a cada 15 segundos; 3 minutos sem notícia = offline. */
export const isOnline = (d: Device, now = new Date()) =>
  !!d.lastSeenAt && now.getTime() - new Date(d.lastSeenAt).getTime() < 3 * 60_000;

export const isOutOfRange = (d: Pick<Device, 'temp' | 'humidity'>) =>
  [tempStatus(d), humidityStatus(d)].some((s) => s === 'alta' || s === 'baixa');
