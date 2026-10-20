import type { Medication } from '../domain/medication';

// Contrato: as telas só conhecem esta interface.
// Hoje quem implementa é o Mock; depois será o Supabase.
export interface MedicationRepository {
  list(query?: string): Promise<Medication[]>;
  getById(id: string): Promise<Medication | null>;
}
