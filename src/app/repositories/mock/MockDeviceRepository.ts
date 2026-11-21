import { compartmentOf, type Device, type DeviceReading, type DeviceTouch, type PairingCode } from '../../domain/device';
import type { DeviceRepository } from '../DeviceRepository';

// Caixa de mentira (sem .env). Ao gerar o código, a "caixa" se pareia sozinha
// depois de alguns segundos, para dar para ver o fluxo inteiro sem hardware.
// Nos testes o pareamento é feito chamando MockDeviceRepository.simulateBoxPairing().
const devices: Device[] = [];
const touchLog = new Map<string, DeviceTouch[]>();
let pending: { code: string; expiresAt: number } | null = null;
let seq = 0;
const AUTO_PAIR_MS = import.meta.env.MODE === 'test' ? 0 : 6000;

export class MockDeviceRepository implements DeviceRepository {
  async listMine() {
    // a caixa simulada "conversa" com o servidor sempre que a lista é lida
    const now = new Date().toISOString();
    devices.forEach((d) => (d.lastSeenAt = now));
    return devices.map((d) => ({ ...d }));
  }

  async startPairing(): Promise<PairingCode> {
    const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    const expiresAt = Date.now() + 10 * 60_000;
    pending = { code, expiresAt };
    if (AUTO_PAIR_MS) setTimeout(() => MockDeviceRepository.simulateBoxPairing(code), AUTO_PAIR_MS);
    return { code, expiresAt: new Date(expiresAt).toISOString() };
  }

  async unpair(deviceId: string) {
    const i = devices.findIndex((d) => d.id === deviceId);
    if (i < 0) throw new Error('Caixa não encontrada');
    devices.splice(i, 1);
    touchLog.delete(deviceId);
  }

  async readings(_deviceId: string, hours = 24): Promise<DeviceReading[]> {
    const now = Date.now();
    return Array.from({ length: hours * 4 }, (_, i) => {
      const t = now - (hours * 4 - i) * 15 * 60_000;
      return {
        measuredAt: new Date(t).toISOString(),
        temp: Math.round((24 + 2 * Math.sin(i / 12)) * 10) / 10,
        humidity: Math.round(55 + 5 * Math.cos(i / 10)),
      };
    });
  }

  async setDemoMode(deviceId: string, on: boolean) {
    const d = devices.find((x) => x.id === deviceId);
    if (!d) throw new Error('Caixa não encontrada');
    d.demoMode = on;
  }

  async touches(deviceId: string, limit = 10): Promise<DeviceTouch[]> {
    return (touchLog.get(deviceId) ?? []).slice(0, limit).map((t) => ({ ...t }));
  }

  /** Faz o papel da caixa: envia o código (como faria parear_caixa). */
  static simulateBoxPairing(code?: string): boolean {
    if (!pending || Date.now() > pending.expiresAt || (code && code !== pending.code)) return false;
    pending = null;
    const now = new Date().toISOString();
    devices.push({
      id: `dev${++seq}`, name: 'Caixa InfoMed (simulada)', pairedAt: now, lastSeenAt: now, firmware: '1.3.0',
      temp: 24.5, humidity: 55, demoMode: false, sensorOk: true,
    });
    return true;
  }

  /** Faz o papel da caixa: toque no compartimento 0 (manhã), 1 (tarde) ou 2 (noite). */
  static simulateTouch(compartment: number, dose = false) {
    const d = devices[devices.length - 1];
    if (!d) return;
    const list = touchLog.get(d.id) ?? [];
    list.unshift({ compartment: compartmentOf(compartment), touchedAt: new Date().toISOString(), dose, demo: d.demoMode });
    touchLog.set(d.id, list.slice(0, 50));
  }

  /** Faz o papel da caixa: nova leitura do sensor (temperatura e umidade nulas = sensor sem sinal). */
  static simulateReading(temp: number | null, humidity: number | null) {
    const d = devices[devices.length - 1];
    if (!d) return;
    const ok = temp !== null || humidity !== null;
    Object.assign(d, { temp: ok ? temp : null, humidity: ok ? humidity : null, sensorOk: ok });
  }

  /** Só para testes. */
  static reset() {
    devices.length = 0;
    touchLog.clear();
    pending = null;
  }
}
