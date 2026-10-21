import { useNavigate } from 'react-router';
import { useAppData } from './AppData';
import { pathFor } from './routes';
import type { AppState, Screen } from './types';

/**
 * Mantém o mesmo formato que as telas já usam: navigate('postos', { ...dados }).
 * Por baixo, guarda os dados e troca a URL (o botão voltar do celular passa a funcionar).
 */
export function useAppNavigate() {
  const nav = useNavigate();
  const { update } = useAppData();

  return (screen: Screen, data?: Partial<AppState>) => {
    if (data) {
      const { currentScreen: _ignored, ...rest } = data;
      update(rest);
    }
    // Ao entrar no app (login/cadastro), substitui a página para o "voltar" não cair no login de novo
    nav(pathFor(screen, data), { replace: screen === 'home' });
  };
}
