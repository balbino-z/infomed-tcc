import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AppState } from './types';

export type AppData = Omit<AppState, 'currentScreen'>;

interface AppDataContextValue {
  data: AppData;
  update: (partial: Partial<AppData>) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({});
  const update = (partial: Partial<AppData>) => setData((prev) => ({ ...prev, ...partial }));
  return <AppDataContext.Provider value={{ data, update }}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData deve ser usado dentro de <AppDataProvider>');
  return ctx;
}
