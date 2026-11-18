import type { UpdateProfileInput, UserProfile } from '../../domain/profile';
import type { AuthUser } from '../../domain/user';
import { ProfileError, type ProfileRepository } from '../ProfileRepository';
import { normalizeProfile, validateProfile } from '../../features/profile/profileUtils';

// Perfil de mentira no navegador (testes, CI e uso sem .env).
// Para testar o painel de BI no modo Mock, entre com um e-mail que comece com "admin".
const SESSION_KEY = 'infomed.mock.session';
const keyFor = (id: string) => `infomed.mock.profile.${id}`;

function session(): AuthUser {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as AuthUser;
  } catch {
    /* ignora */
  }
  throw new ProfileError('Sessão expirada. Entre novamente.');
}

export class MockProfileRepository implements ProfileRepository {
  async getMine(): Promise<UserProfile> {
    const user = session();
    const base: UserProfile = {
      id: user.id,
      fullName: user.fullName,
      birthDate: '',
      phone: '',
      lgpdConsentAt: '2026-10-20T13:00:00Z',
      isAdmin: user.email.toLowerCase().startsWith('admin'),
    };
    try {
      const raw = localStorage.getItem(keyFor(user.id));
      if (raw) return { ...base, ...(JSON.parse(raw) as Partial<UserProfile>), isAdmin: base.isAdmin };
    } catch {
      /* ignora */
    }
    return base;
  }

  async updateMine(input: UpdateProfileInput): Promise<UserProfile> {
    // espelha as validações do banco (db/09_perfil.sql)
    const errors = validateProfile(input);
    const first = Object.values(errors)[0];
    if (first) throw new ProfileError(first);
    const user = session();
    const clean = normalizeProfile(input);
    localStorage.setItem(keyFor(user.id), JSON.stringify(clean));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...user, fullName: clean.fullName }));
    return { ...(await this.getMine()), ...clean };
  }
}
