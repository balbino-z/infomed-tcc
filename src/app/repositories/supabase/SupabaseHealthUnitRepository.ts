import type { SupabaseClient } from '@supabase/supabase-js';
import type { HealthUnit, UnitMedication } from '../../domain/health-unit';
import type { StockStatus } from '../../domain/medication';
import type { HealthUnitRepository } from '../HealthUnitRepository';

interface UnitRow {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  opens_at: string;   // 'HH:MM:SS'
  closes_at: string;
  services: string[] | null;
  phone: string | null;
  notes: string | null;
  verified: boolean;
}

interface StockRow {
  status: StockStatus;
  // dependendo da inferência do PostgREST, o relacionamento vem como objeto ou lista
  medications: { id: string; name: string; dosage: string; form: string } | { id: string; name: string; dosage: string; form: string }[] | null;
}

const hhmm = (t: string) => t.slice(0, 5);

const toDomain = (r: UnitRow): HealthUnit => ({
  id: r.id,
  name: r.name,
  address: r.address,
  lat: r.lat,
  lng: r.lng,
  opensAt: hhmm(r.opens_at),
  closesAt: hhmm(r.closes_at),
  services: r.services ?? [],
  phone: r.phone,
  notes: r.notes,
  verified: r.verified,
});

export class SupabaseHealthUnitRepository implements HealthUnitRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(): Promise<HealthUnit[]> {
    const { data, error } = await this.db.from('health_units').select('*').order('name');
    if (error) throw error;
    return (data as UnitRow[]).map(toDomain);
  }

  async getById(id: string): Promise<HealthUnit | null> {
    const { data, error } = await this.db.from('health_units').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as UnitRow) : null;
  }

  async listMedications(unitId: string): Promise<UnitMedication[]> {
    const { data, error } = await this.db
      .from('unit_medications')
      .select('status, medications(id, name, dosage, form)')
      .eq('unit_id', unitId);
    if (error) throw error;
    return (data as unknown as StockRow[])
      .map((row) => {
        const m = Array.isArray(row.medications) ? row.medications[0] : row.medications;
        return m ? { medicationId: m.id, name: m.name, dosage: m.dosage, form: m.form, status: row.status } : null;
      })
      .filter((x): x is UnitMedication => x !== null)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  async unitIdsWithMedication(medicationId: string): Promise<string[]> {
    const { data, error } = await this.db
      .from('unit_medications')
      .select('unit_id')
      .eq('medication_id', medicationId)
      .eq('status', 'disponivel');
    if (error) throw error;
    return (data as { unit_id: string }[]).map((r) => r.unit_id);
  }
}
