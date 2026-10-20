import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser, SignUpInput, SignUpResult } from '../../domain/user';
import { authRepository } from '../../repositories';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean; // true enquanto verifica se já existe sessão
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authRepository.getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
    return authRepository.onAuthChange(setUser);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signIn: async (email, password) => {
      setUser(await authRepository.signIn(email, password));
    },
    signUp: async (input) => {
      const result = await authRepository.signUp(input);
      if (result.user) setUser(result.user);
      return result;
    },
    signOut: async () => {
      await authRepository.signOut();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
