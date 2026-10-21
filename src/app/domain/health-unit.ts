import type { StockStatus } from './medication';

export interface HealthUnit {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  opensAt: string;   // 'HH:MM'
  closesAt: string;  // 'HH:MM'
  services: string[];
  phone: string | null;
  notes: string | null;
  verified: boolean;
}

// Medicamento em uma unidade específica (estoque SIMULADO)
export interface UnitMedication {
  medicationId: string;
  name: string;
  dosage: string;
  form: string;
  status: StockStatus;
}
