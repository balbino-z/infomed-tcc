import type { SupabaseClient } from '@supabase/supabase-js';
import type { UpdateProfileInput, UserProfile } from '../../domain/profile';
import { ProfileError, type ProfileRepository } from '../ProfileRepository';
import { normalizeProfile } from '../../features/profile/profileUtils';

interface Row {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  phone: string | null;
  lgpd_consent_at: string | null;
  is_admin?: boolean | null; // coluna criada em db/08_bi.sql
}

const toDomain = (r: Row): UserProfile => ({
  id: r.id,
  fullName: r.full_name ?? '',
  birthDate: r.birth_date ?? '',
  phone: r.phone ?? '',
  lgpdConsentAt: r.lgpd_consent_at,
  isAdmin: r.is_admin === true,
});

function friendly(message: string): ProfileError {
  if (message.includes('profiles_phone_valid')) return new ProfileError('Telefone com DDD: 10 ou 11 dígitos.');
  if (message.includes('profiles_birth_date_valid')) return new ProfileError('Data de nascimento inválida.');
  if (message.includes('profiles_full_name_len')) return new ProfileError('O nome pode ter até 120 caracteres.');
  return new ProfileError('Não foi possível salvar seus dados. Tente novamente.');
}

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly db: SupabaseClient) {}

  private async userId(): Promise<string> {
    const { data } = await this.db.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new ProfileError('Sessão expirada. Entre novamente.');
    return id;
  }

  async getMine(): Promise<UserProfile> {
    const id = await this.userId();
    // select('*'): funciona antes e depois do db/08 (is_admin pode ainda não existir)
    const { data, error } = await this.db.from('profiles').select('*').eq('id', id).single();
    if (error || !data) throw new ProfileError('Não foi possível carregar seus dados.');
    return toDomain(data as Row);
  }

  async updateMine(input: UpdateProfileInput): Promise<UserProfile> {
    const id = await this.userId();
    const clean = normalizeProfile(input);
    // O banco só permite alterar estas três colunas (db/08_bi.sql) e só no próprio perfil (RLS)
    const { data, error } = await this.db
      .from('profiles')
      .update({ full_name: clean.fullName, birth_date: clean.birthDate || null, phone: clean.phone || null })
      .eq('id', id)
      .select('*')
      .single();
    if (error || !data) throw friendly(error?.message ?? '');
    // Mantém o nome mostrado no app (vem da sessão) igual ao do perfil
    await this.db.auth.updateUser({ data: { full_name: clean.fullName } });
    return toDomain(data as Row);
  }
}
