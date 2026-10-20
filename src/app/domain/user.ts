export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  lgpdConsent: boolean; // obrigatório: o usuário precisa aceitar os termos
}

export interface SignUpResult {
  user: AuthUser | null;
  needsEmailConfirmation: boolean;
}
