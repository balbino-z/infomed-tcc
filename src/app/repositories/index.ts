import { hasSupabase, supabase } from '../lib/supabase';
import type { AuthRepository } from './AuthRepository';
import type { MedicationRepository } from './MedicationRepository';
import { MockAuthRepository } from './mock/MockAuthRepository';
import { MockMedicationRepository } from './mock/MockMedicationRepository';
import { SupabaseAuthRepository } from './supabase/SupabaseAuthRepository';
import { SupabaseMedicationRepository } from './supabase/SupabaseMedicationRepository';

// ÚNICO lugar onde se escolhe a implementação:
// com .env preenchido usa o Supabase; sem .env usa o Mock (útil em testes e no CI).
export const medicationRepository: MedicationRepository = hasSupabase
  ? new SupabaseMedicationRepository(supabase!)
  : new MockMedicationRepository();

export const authRepository: AuthRepository = hasSupabase
  ? new SupabaseAuthRepository(supabase!)
  : new MockAuthRepository();
