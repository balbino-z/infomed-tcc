import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AuthUser, SignUpInput, SignUpResult } from '../../domain/user';
import type { AuthRepository } from '../AuthRepository';

const toAuthUser = (u: User): AuthUser => ({
  id: u.id,
  email: u.email ?? '',
  fullName: (u.user_metadata?.full_name as string | undefined) ?? '',
});

// Traduz mensagens técnicas do Supabase para o usuário final
function friendly(message: string): Error {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return new Error('E-mail ou senha incorretos.');
  if (m.includes('already registered')) return new Error('Este e-mail já está cadastrado.');
  if (m.includes('email not confirmed')) return new Error('Confirme seu e-mail antes de entrar.');
  if (m.includes('password')) return new Error('A senha não atende aos requisitos de segurança.');
  if (m.includes('rate limit')) return new Error('Muitas tentativas. Aguarde um pouco e tente de novo.');
  return new Error('Não foi possível concluir. Tente novamente.');
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly db: SupabaseClient) {}

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await this.db.auth.getSession();
    return data.session ? toAuthUser(data.session.user) : null;
  }

  async signUp(input: SignUpInput): Promise<SignUpResult> {
    if (!input.lgpdConsent) throw new Error('É necessário aceitar os termos e a política de privacidade.');
    const { data, error } = await this.db.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        // o gatilho do banco copia estes dados para a tabela profiles
        data: { full_name: input.fullName.trim(), lgpd_consent_at: new Date().toISOString() },
      },
    });
    if (error) throw friendly(error.message);
    return {
      user: data.session && data.user ? toAuthUser(data.user) : null,
      needsEmailConfirmation: !data.session,
    };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.db.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) throw friendly(error?.message ?? '');
    return toAuthUser(data.user);
  }

  async signOut(): Promise<void> {
    await this.db.auth.signOut();
  }

  onAuthChange(callback: (user: AuthUser | null) => void): () => void {
    const { data } = this.db.auth.onAuthStateChange((_event, session) => {
      callback(session ? toAuthUser(session.user) : null);
    });
    return () => data.subscription.unsubscribe();
  }
}
