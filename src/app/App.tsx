import { useEffect, useState } from 'react';
import { Welcome } from './components/screens/Welcome';
import { Onboarding1 } from './components/screens/Onboarding1';
import { Onboarding2 } from './components/screens/Onboarding2';
import { Onboarding3 } from './components/screens/Onboarding3';
import { Home } from './components/screens/Home';
import { MedicationList } from './components/screens/MedicationList';
import { MedicationDetail } from './components/screens/MedicationDetail';
import { PostosList } from './components/screens/PostosList';
import { PostoDetail } from './components/screens/PostoDetail';
import { ScheduleSpecialty } from './components/screens/ScheduleSpecialty';
import { ScheduleDoctor } from './components/screens/ScheduleDoctor';
import { ScheduleDateTime } from './components/screens/ScheduleDateTime';
import { AppointmentConfirmed } from './components/screens/AppointmentConfirmed';
import { CancelAppointment } from './components/screens/CancelAppointment';
import { Notifications } from './components/screens/Notifications';
import { History } from './components/screens/History';
import { RemindersList } from './components/screens/RemindersList';
import { CreateReminder } from './components/screens/CreateReminder';
import { MapFilters } from './components/screens/MapFilters';
import { Profile } from './components/screens/Profile';
import { Login } from './components/screens/Login';
import { Signup } from './components/screens/Signup';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import IPhoneBezel from './imports/IPhoneBezel';

export type Screen = 
  | 'welcome' 
  | 'onboarding1' 
  | 'onboarding2' 
  | 'onboarding3'
  | 'login'
  | 'signup'
  | 'home'
  | 'medications'
  | 'medication-detail'
  | 'postos'
  | 'posto-detail'
  | 'schedule-specialty'
  | 'schedule-doctor'
  | 'schedule-datetime'
  | 'appointment-confirmed'
  | 'cancel-appointment'
  | 'notifications'
  | 'history'
  | 'reminders'
  | 'create-reminder'
  | 'map-filters'
  | 'profile';

export interface AppState {
  currentScreen: Screen;
  selectedMedication?: any;
  selectedPosto?: any;
  selectedSpecialty?: string;
  selectedDoctor?: any;
  selectedDate?: string;
  selectedTime?: string;
  selectedAppointment?: any;
  reminders?: any[];
}

const PUBLIC_SCREENS: Screen[] = ['welcome', 'onboarding1', 'onboarding2', 'onboarding3', 'login', 'signup'];

function AppContent() {
  const { user, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'welcome',
    reminders: []
  });

  // Sessão já existente (usuário voltou ao app): pula a tela de boas-vindas
  useEffect(() => {
    if (!loading && user && appState.currentScreen === 'welcome') {
      setAppState((prev) => ({ ...prev, currentScreen: 'home' }));
    }
  }, [loading, user]);

  const navigate = (screen: Screen, data?: Partial<AppState>) => {
    setAppState(prev => ({
      ...prev,
      currentScreen: screen,
      ...data
    }));
  };

  const renderScreen = () => {
    if (loading) {
      return <div className="h-full flex items-center justify-center text-[#64748B]">Carregando...</div>;
    }
    // Quem não está logado só acessa as telas públicas
    if (!user && !PUBLIC_SCREENS.includes(appState.currentScreen)) {
      return <Login navigate={navigate} />;
    }
    switch (appState.currentScreen) {
      case 'welcome':
        return <Welcome navigate={navigate} />;
      case 'onboarding1':
        return <Onboarding1 navigate={navigate} />;
      case 'onboarding2':
        return <Onboarding2 navigate={navigate} />;
      case 'onboarding3':
        return <Onboarding3 navigate={navigate} />;
      case 'login':
        return <Login navigate={navigate} />;
      case 'signup':
        return <Signup navigate={navigate} />;
      case 'home':
        return <Home navigate={navigate} appState={appState} />;
      case 'medications':
        return <MedicationList navigate={navigate} />;
      case 'medication-detail':
        return <MedicationDetail navigate={navigate} medication={appState.selectedMedication} />;
      case 'postos':
        return <PostosList navigate={navigate} />;
      case 'posto-detail':
        return <PostoDetail navigate={navigate} posto={appState.selectedPosto} />;
      case 'schedule-specialty':
        return <ScheduleSpecialty navigate={navigate} />;
      case 'schedule-doctor':
        return <ScheduleDoctor navigate={navigate} specialty={appState.selectedSpecialty} />;
      case 'schedule-datetime':
        return <ScheduleDateTime navigate={navigate} doctor={appState.selectedDoctor} />;
      case 'appointment-confirmed':
        return <AppointmentConfirmed navigate={navigate} appointment={appState} />;
      case 'cancel-appointment':
        return <CancelAppointment navigate={navigate} appointment={appState.selectedAppointment} />;
      case 'notifications':
        return <Notifications navigate={navigate} />;
      case 'history':
        return <History navigate={navigate} />;
      case 'reminders':
        return <RemindersList navigate={navigate} reminders={appState.reminders || []} />;
      case 'create-reminder':
        return <CreateReminder navigate={navigate} medication={appState.selectedMedication} appState={appState} />;
      case 'map-filters':
        return <MapFilters navigate={navigate} />;
      case 'profile':
        return <Profile navigate={navigate} />;
      default:
        return <Welcome navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#2c2f33] flex items-center justify-center p-4">
      <div className="relative w-[393px] h-[852px]">
        {/* iPhone Bezel Frame */}
        <div className="absolute inset-0 pointer-events-none z-50">
          <IPhoneBezel />
        </div>
        
        {/* App Content */}
        <div className="absolute inset-0 overflow-hidden rounded-[55px]">
          <div className="h-full w-full bg-white">
            {renderScreen()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
