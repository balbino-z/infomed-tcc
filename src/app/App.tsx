import { BrowserRouter } from 'react-router';
import { AuthProvider } from './features/auth/AuthContext';
import { AppDataProvider } from './features/navigation/AppData';
import { AppRoutes } from './features/navigation/AppRoutes';
import IPhoneBezel from './imports/IPhoneBezel';

// Os tipos agora moram em features/navigation/types.ts (as telas continuam importando daqui)
export type { Screen, AppState } from './features/navigation/types';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          {/* Celular: o app ocupa a tela toda. Computador (md+): mostra a moldura de iPhone. */}
          <div className="h-[100dvh] w-full bg-white md:h-auto md:min-h-screen md:bg-[#2c2f33] md:flex md:items-center md:justify-center md:p-4">
            <div className="relative h-full w-full md:w-[393px] md:h-[852px]">
              <div className="hidden md:block absolute inset-0 pointer-events-none z-50">
                <IPhoneBezel />
              </div>
              <div className="absolute inset-0 overflow-hidden md:rounded-[55px]">
                <div className="h-full w-full bg-white">
                  <AppRoutes />
                </div>
              </div>
            </div>
          </div>
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
