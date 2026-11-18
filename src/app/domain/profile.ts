/** Dados do perfil do usuário logado (tabela profiles). */
export interface UserProfile {
  id: string;
  fullName: string;
  /** 'AAAA-MM-DD' ou '' quando não informado */
  birthDate: string;
  /** só dígitos (DDD + número) ou '' */
  phone: string;
  /** quando aceitou os termos (LGPD); null em contas antigas */
  lgpdConsentAt: string | null;
  /** administrador vê o painel de BI; definido só no banco, nunca pelo app */
  isAdmin: boolean;
}

/** O que o próprio usuário pode alterar (o banco só libera estas colunas). */
export type UpdateProfileInput = Pick<UserProfile, 'fullName' | 'birthDate' | 'phone'>;
