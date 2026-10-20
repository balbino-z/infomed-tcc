import { MapPin, Clock, Phone, Navigation, Calendar } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';

interface PostoDetailProps {
  navigate: (screen: Screen) => void;
  posto: any;
}

export function PostoDetail({ navigate, posto }: PostoDetailProps) {
  if (!posto) {
    return (
      <div className="h-full bg-[#F7FAFF] flex items-center justify-center">
        <p className="text-[#64748B]">Posto não encontrado</p>
      </div>
    );
  }

  const schedule = [
    { day: 'Segunda a Sexta', hours: '07:00 - 17:00' },
    { day: 'Sábado', hours: '08:00 - 12:00' },
    { day: 'Domingo', hours: 'Fechado' },
  ];

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Detalhes do Posto"
        onBack={() => navigate('postos')}
        onNotification={() => navigate('notifications')}
      />

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Map Preview */}
        <div className="h-48 bg-gradient-to-br from-[#E8F1FF] to-[#F7FAFF] relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-[#0A73FF]" />
          </div>
          <div className="absolute bottom-4 right-4">
            <button className="px-4 py-2 bg-white rounded-xl text-[#0A73FF] text-sm shadow-lg flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Como chegar
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-14 h-14 bg-[#27C183]/10 rounded-2xl flex items-center justify-center">
                <MapPin className="w-7 h-7 text-[#27C183]" />
              </div>
              <div className="flex-1">
                <h2 className="text-[#1A2B48] mb-1">{posto.name}</h2>
                <span className="inline-block px-3 py-1 bg-[#27C183]/10 text-[#27C183] text-xs rounded-lg">
                  Aberto agora
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#64748B] mt-0.5" />
                <div>
                  <p className="text-[#1A2B48]">{posto.address}</p>
                  <p className="text-[#0A73FF] text-sm mt-1">{posto.distance} de distância</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#64748B]" />
                <p className="text-[#1A2B48]">(11) 3456-7890</p>
              </div>
            </div>
          </div>

          {/* Horário de Funcionamento */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
            <h3 className="text-[#1A2B48] mb-4">Horário de Funcionamento</h3>
            <div className="space-y-3">
              {schedule.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-[#64748B]">{item.day}</span>
                  <span className="text-[#1A2B48]">{item.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Serviços Disponíveis */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
            <h3 className="text-[#1A2B48] mb-4">Serviços Disponíveis</h3>
            <div className="space-y-3">
              {posto.services.map((service: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-[#F7FAFF] rounded-xl"
                >
                  <div className="w-2 h-2 bg-[#27C183] rounded-full" />
                  <span className="text-[#1A2B48]">{service}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Medicamentos Disponíveis */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8F1FF]">
            <h3 className="text-[#1A2B48] mb-4">Medicamentos Disponíveis</h3>
            <div className="flex flex-wrap gap-2">
              {['Losartana', 'Metformina', 'Omeprazol', 'Paracetamol', 'Dipirona'].map((med, idx) => (
                <span
                  key={idx}
                  className="px-3 py-2 bg-[#0A73FF]/5 text-[#0A73FF] text-sm rounded-xl"
                >
                  {med}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate('medications')}
              className="w-full mt-4 text-[#0A73FF] text-center"
            >
              Ver lista completa
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Actions */}
      <div className="px-6 py-4 bg-white border-t border-[#E8F1FF]">
        <button
          onClick={() => navigate('schedule-specialty')}
          className="w-full h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          Agendar Consulta
        </button>
      </div>
    </div>
  );
}