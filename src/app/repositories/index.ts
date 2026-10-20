import type { MedicationRepository } from './MedicationRepository';
import { MockMedicationRepository } from './mock/MockMedicationRepository';

// ÚNICO lugar para trocar Mock por Supabase no futuro.
export const medicationRepository: MedicationRepository = new MockMedicationRepository();
