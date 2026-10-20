import type { AuthUser, SignUpInput, SignUpResult } from '../../domain/user';
import type { AuthRepository } from '../AuthRepository';

// Login de mentira, só para rodar o app sem .env (testes, CI, primeiros passos).
// NÃO é seguro: nunca usar em produção.
const KEY = 'infomed.mock.session';

export class MockAuthRepository implements AuthRepository {
  private listeners = new Set<(u: AuthUser | null) => void>();

  private read(): AuthUser | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  private write(u: AuthUser | null) {
    try {
      if (u) localStorage.setItem(KEY, JSON.stringify(u));
      else localStorage.removeItem(KEY);
    } catch {
      /* ignora */
    }
    this.listeners.forEach((l) => l(u));
  }

  async getCurrentUser() {
    return this.read();
  }

  async signUp(input: SignUpInput): Promise<SignUpResult> {
    if (!input.lgpdConsent) throw new Error('É necessário aceitar os termos e a política de privacidade.');
    const user = { id: 'mock-user', email: input.email, fullName: input.fullName };
    this.write(user);
    return { user, needsEmailConfirmation: false };
  }

  async signIn(email: string): Promise<AuthUser> {
    const user = { id: 'mock-user', email, fullName: email.split('@')[0] };
    this.write(user);
    return user;
  }

  async signOut() {
    this.write(null);
  }

  onAuthChange(callback: (u: AuthUser | null) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}
