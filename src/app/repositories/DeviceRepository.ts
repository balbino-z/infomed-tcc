import type { Device, DeviceReading, DeviceTouch, PairingCode } from '../domain/device';

/** Caixa de remédios do usuário logado (db/10_caixa.sql e db/11_caixa_demo.sql). */
export interface DeviceRepository {
  /** Caixas pareadas e não revogadas. */
  listMine(): Promise<Device[]>;
  /** Gera o código de 6 dígitos (10 minutos, uso único) para digitar na caixa. */
  startPairing(): Promise<PairingCode>;
  /** Revoga o token: a caixa deixa de conseguir falar com o servidor. */
  unpair(deviceId: string): Promise<void>;
  /** Histórico do sensor das últimas `hours` horas, do mais antigo ao mais novo. */
  readings(deviceId: string, hours?: number): Promise<DeviceReading[]>;
  /** Liga/desliga o modo demonstração. A caixa aplica em até 15 s. */
  setDemoMode(deviceId: string, on: boolean): Promise<void>;
  /** Últimos toques nos compartimentos, do mais novo ao mais antigo. */
  touches(deviceId: string, limit?: number): Promise<DeviceTouch[]>;
}
