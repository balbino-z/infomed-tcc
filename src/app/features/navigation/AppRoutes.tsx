import { useEffect, useState, type ReactElement } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import { Welcome } from '../../components/screens/Welcome';
import { Onboarding1 } from '../../components/screens/Onboarding1';
import { Onboarding2 } from '../../components/screens/Onboarding2';
import { Onboarding3 } from '../../components/screens/Onboarding3';
import { Login } from '../../components/screens/Login';
import { Signup } from '../../components/screens/Signup';
import { Home } from '../../components/screens/Home';
import { MedicationList } from '../../components/screens/MedicationList';
import { MedicationDetail } from '../../components/screens/MedicationDetail';
import { PostosList } from '../../components/screens/PostosList';
import { PostoDetail } from '../../components/screens/PostoDetail';
import { MapFilters } from '../../components/screens/MapFilters';
import { ScheduleSpecialty } from '../../components/screens/ScheduleSpecialty';
import { ScheduleDoctor } from '../../components/screens/ScheduleDoctor';
import { ScheduleDateTime } from '../../components/screens/ScheduleDateTime';
import { AppointmentConfirmed } from '../../components/screens/AppointmentConfirmed';
import { CancelAppointment } from '../../components/screens/CancelAppointment';
import { Notifications } from '../../components/screens/Notifications';
import { History } from '../../components/screens/History';
import { RemindersList } from '../../components/screens/RemindersList';
import { CreateReminder } from '../../components/screens/CreateReminder';
import { Profile } from '../../components/screens/Profile';
import { useAuth } from '../auth/AuthContext';
import { healthUnitRepository, medicationRepository } from '../../repositories';
import { useAppData } from './AppData';
import { useAppNavigate } from './useAppNavigate';
import { screenFromPath } from './routes';
import type { AppState } from './types';

const Loading = () => (
  <div className="h-full flex items-center justify-center text-[#64748B]">Carregando...</div>
);

/** Carrega um item pela URL (/postos/abc) quando a pessoa chegou por link ou recarregou a página. */
function useItemById<T>(id: string | undefined, cached: T | undefined, load: (id: string) => Promise<T | null>) {
  const [item, setItem] = useState<T | undefined>(cached);
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing'>(cached ? 'ok' : 'loading');

  useEffect(() => {
    if (cached) {
      setItem(cached);
      setStatus('ok');
      return;
    }
    if (!id) {
      setStatus('missing');
      return;
    }
    setStatus('loading');
    load(id)
      .then((found) => {
        setItem(found ?? undefined);
        setStatus(found ? 'ok' : 'missing');
      })
      .catch(() => setStatus('missing'));
  }, [id]);

  return { item, status };
}

function PostoDetailRoute() {
  const { id } = useParams();
  const { data } = useAppData();
  const navigate = useAppNavigate();
  const cached = data.selectedPosto?.id === id ? data.selectedPosto : undefined;
  const { item, status } = useItemById(id, cached, (i) => healthUnitRepository.getById(i));
  if (status === 'loading') return <Loading />;
  return <PostoDetail navigate={navigate} posto={item} />;
}

function MedicationDetailRoute() {
  const { id } = useParams();
  const { data } = useAppData();
  const navigate = useAppNavigate();
  const cached = data.selectedMedication && String(data.selectedMedication.id) === id ? data.selectedMedication : undefined;
  const { item, status } = useItemById(id, cached, (i) => medicationRepository.getById(i));
  if (status === 'loading') return <Loading />;
  return <MedicationDetail navigate={navigate} medication={item} />;
}

export function AppRoutes() {
  const { user, loading } = useAuth();
  const { data } = useAppData();
  const navigate = useAppNavigate();
  const location = useLocation();

  const appState: AppState = { ...data, currentScreen: screenFromPath(location.pathname) };

  // Telas internas: exigem login
  const priv = (el: ReactElement) => (loading ? <Loading /> : user ? el : <Navigate to="/entrar" replace />);
  // Telas de entrada: quem já está logado vai direto para o início
  const pub = (el: ReactElement) => (loading ? <Loading /> : user ? <Navigate to="/inicio" replace /> : el);

  return (
    <Routes>
      <Route path="/" element={pub(<Welcome navigate={navigate} />)} />
      <Route path="/onboarding/1" element={<Onboarding1 navigate={navigate} />} />
      <Route path="/onboarding/2" element={<Onboarding2 navigate={navigate} />} />
      <Route path="/onboarding/3" element={<Onboarding3 navigate={navigate} />} />
      <Route path="/entrar" element={pub(<Login navigate={navigate} />)} />
      <Route path="/cadastro" element={pub(<Signup navigate={navigate} />)} />

      <Route path="/inicio" element={priv(<Home navigate={navigate} appState={appState} />)} />
      <Route path="/medicamentos" element={priv(<MedicationList navigate={navigate} />)} />
      <Route path="/medicamentos/:id" element={priv(<MedicationDetailRoute />)} />
      <Route path="/postos" element={priv(<PostosList navigate={navigate} />)} />
      <Route path="/postos/filtros" element={priv(<MapFilters navigate={navigate} />)} />
      <Route path="/postos/:id" element={priv(<PostoDetailRoute />)} />

      <Route path="/agendar" element={priv(<ScheduleSpecialty navigate={navigate} />)} />
      {/* Passos do agendamento: se a pessoa recarregar no meio do fluxo, volta ao início dele */}
      <Route path="/agendar/medico" element={priv(data.selectedSpecialty ? <ScheduleDoctor navigate={navigate} specialty={data.selectedSpecialty} /> : <Navigate to="/agendar" replace />)} />
      <Route path="/agendar/horario" element={priv(data.selectedDoctor ? <ScheduleDateTime navigate={navigate} doctor={data.selectedDoctor} kind={data.selectedKind} /> : <Navigate to="/agendar" replace />)} />
      <Route path="/agendar/confirmado" element={priv(data.lastBooked ? <AppointmentConfirmed navigate={navigate} appointment={data.lastBooked} /> : <Navigate to="/historico" replace />)} />
      <Route path="/consultas/cancelar" element={priv(data.selectedAppointment ? <CancelAppointment navigate={navigate} appointment={data.selectedAppointment} /> : <Navigate to="/historico" replace />)} />

      <Route path="/notificacoes" element={priv(<Notifications navigate={navigate} />)} />
      <Route path="/historico" element={priv(<History navigate={navigate} />)} />
      <Route path="/lembretes" element={priv(<RemindersList navigate={navigate} />)} />
      <Route path="/lembretes/novo" element={priv(<CreateReminder navigate={navigate} medication={data.selectedMedication} />)} />
      <Route path="/perfil" element={priv(<Profile navigate={navigate} />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
