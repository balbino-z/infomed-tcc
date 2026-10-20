import { hasSupabase, supabase } from '../lib/supabase';
import type { MedicationRepository } from './MedicationRepository';
import { MockMedicationRepository } from './mock/MockMedicationRepository';
import { SupabaseMedicationRepository } from './supabase/SupabaseMedicationRepository';

// ÚNICO lugar onde se escolhe a implementação:
// com .env preenchido usa o Supabase; sem .env usa o Mock (útil em testes e no CI).
export const medicationRepository: MedicationRepository = hasSupabase
  ? new SupabaseMedicationRepository(supabase!)
  : new MockMedicationRepository();
