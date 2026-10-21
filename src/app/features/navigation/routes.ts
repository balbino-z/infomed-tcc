import { matchPath } from 'react-router';
import type { AppState, Screen } from './types';

// Endereço (URL) de cada tela. ":id" é preenchido com o item escolhido.
export const SCREEN_PATH: Record<Screen, string> = {
  welcome: '/',
  onboarding1: '/onboarding/1',
  onboarding2: '/onboarding/2',
  onboarding3: '/onboarding/3',
  login: '/entrar',
  signup: '/cadastro',
  home: '/inicio',
  medications: '/medicamentos',
  'medication-detail': '/medicamentos/:id',
  postos: '/postos',
  'posto-detail': '/postos/:id',
  'map-filters': '/postos/filtros',
  'schedule-specialty': '/agendar',
  'schedule-doctor': '/agendar/medico',
  'schedule-datetime': '/agendar/horario',
  'appointment-confirmed': '/agendar/confirmado',
  'cancel-appointment': '/consultas/cancelar',
  notifications: '/notificacoes',
  history: '/historico',
  reminders: '/lembretes',
  'create-reminder': '/lembretes/novo',
  profile: '/perfil',
};

/** Monta a URL de uma tela, usando o item escolhido quando a rota tem ":id". */
export function pathFor(screen: Screen, data?: Partial<AppState>): string {
  if (screen === 'posto-detail') {
    const id = data?.selectedPosto?.id;
    return id ? `/postos/${encodeURIComponent(id)}` : SCREEN_PATH.postos;
  }
  if (screen === 'medication-detail') {
    const id = data?.selectedMedication?.id;
    return id ? `/medicamentos/${encodeURIComponent(String(id))}` : SCREEN_PATH.medications;
  }
  return SCREEN_PATH[screen];
}

// Rotas fixas são testadas antes das que têm ":id" (ex.: /postos/filtros antes de /postos/:id)
const ORDERED = (Object.entries(SCREEN_PATH) as [Screen, string][]).sort(
  (a, b) => Number(a[1].includes(':')) - Number(b[1].includes(':')),
);

/** Descobre qual tela corresponde a uma URL (usado para destacar o item do menu de baixo). */
export function screenFromPath(pathname: string): Screen {
  for (const [screen, path] of ORDERED) {
    if (matchPath({ path, end: true }, pathname)) return screen;
  }
  return 'welcome';
}
