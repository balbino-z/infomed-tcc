import type { SupabaseClient } from '@supabase/supabase-js';
import type { Medication, StockStatus } from '../../domain/medication';
import type { MedicationRepository } from '../MedicationRepository';

// Linha da view public.medications_with_status
interface MedicationRow {
  id: string;
  name: string;
  dosage: string;
  form: string;
  description: string;
  status: StockStatus;
}

const toDomain = (r: MedicationRow): Medication => ({
  id: r.id,
  name: r.name,
  dosage: r.dosage,
  type: r.form,
  status: r.status,
  description: r.description,
});

export class SupabaseMedicationRepository implements MedicationRepository {
  constructor(private readonly db: SupabaseClient) {}

  async list(query = ''): Promise<Medication[]> {
    // escapa % e _ para a busca ser literal
    const q = query.trim().replace(/[%_]/g, (c) => `\\${c}`);
    const { data, error } = await this.db
      .from('medications_with_status')
      .select('*')
      .ilike('name', `%${q}%`)
      .order('name');
    if (error) throw error;
    return (data as MedicationRow[]).map(toDomain);
  }

  async getById(id: string): Promise<Medication | null> {
    const { data, error } = await this.db
      .from('medications_with_status')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toDomain(data as MedicationRow) : null;
  }
}
