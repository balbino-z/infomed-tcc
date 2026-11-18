import { MessageCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../features/auth/AuthContext';
import { SCREEN_PATH } from '../../features/navigation/routes';

// Telas em que o botão atrapalharia (fluxos com botão fixo embaixo, formulários e o próprio assistente)
const HIDDEN_ON = new Set([
  SCREEN_PATH.assistant, SCREEN_PATH.welcome, SCREEN_PATH.login, SCREEN_PATH.signup,
  SCREEN_PATH.onboarding1, SCREEN_PATH.onboarding2, SCREEN_PATH.onboarding3,
  SCREEN_PATH['schedule-datetime'], SCREEN_PATH['create-reminder'], SCREEN_PATH['cancel-appointment'],
  SCREEN_PATH['map-filters'], SCREEN_PATH.triage, SCREEN_PATH.dashboard,
]);

/** Botão flutuante que abre o assistente (só para quem está logado). */
export function AssistantFab() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const nav = useNavigate();
  if (!user || HIDDEN_ON.has(pathname)) return null;
  return (
    <button
      onClick={() => nav(SCREEN_PATH.assistant)}
      aria-label="Abrir assistente"
      className="absolute right-4 bottom-28 z-40 w-14 h-14 rounded-full bg-[#0A73FF] text-white shadow-lg shadow-[#0A73FF]/30 flex items-center justify-center hover:bg-[#005BEA] transition-colors"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}
