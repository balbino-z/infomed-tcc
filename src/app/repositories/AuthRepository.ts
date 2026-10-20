import type { AuthUser, SignUpInput, SignUpResult } from '../domain/user';

export interface AuthRepository {
  getCurrentUser(): Promise<AuthUser | null>;
  signUp(input: SignUpInput): Promise<SignUpResult>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  /** Avisa quando o usuário loga ou desloga. Retorna a função para cancelar. */
  onAuthChange(callback: (user: AuthUser | null) => void): () => void;
}
