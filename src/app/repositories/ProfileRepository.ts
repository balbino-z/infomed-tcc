import type { UpdateProfileInput, UserProfile } from '../domain/profile';

export interface ProfileRepository {
  /** Perfil do usuário logado. */
  getMine(): Promise<UserProfile>;
  /** Altera nome, nascimento e telefone do usuário logado. */
  updateMine(input: UpdateProfileInput): Promise<UserProfile>;
}

/** Erro de validação com mensagem pronta para o usuário. */
export class ProfileError extends Error {}
