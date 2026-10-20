import { Pill, AlertCircle, Clock, MapPin } from 'lucide-react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';

interface MedicationDetailProps {
  navigate: (screen: Screen, data?: any) => void;
  medication: any;
}

export function MedicationDetail({ navigate, medication }: MedicationDetailProps) {
  if (!medication) {
    return (
      <div className="h-full bg-[#F7FAFF] flex items-center justify-center">
        <p className="text-[#64748B]">Medicamento não encontrado</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header
        title="Detalhes"
        onBack={() => navigate('medications')}
        onNotification={() => navigate('notifications')}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
        {/* Card Principal */}
        <div className="bg-white rounded-3xl p-6 mb-6 border border-[#E8F1FF]">
          <div className="w-16 h-16 bg-[#0A73FF]/10 rounded-2xl flex items-center justify-center mb-4">
            <Pill className="w-8 h-8 text-[#0A73FF]" />
          </div>
          
          <h2 className="text-[#1A2B48] mb-2">{medication.name}</h2>
          <p className="text-[rgb(52,60,71)] mb-4">{medication.description}</p>
          
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-[#F7FAFF] rounded-xl text-[#1A2B48] text-sm">
              {medication.dosage}
            </span>
            <span className="px-4 py-2 bg-[#F7FAFF] rounded-xl text-[#1A2B48] text-sm">
              {medication.type}
            </span>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-[#E8F1FF]">
          <h3 className="text-[#1A2B48] mb-4">Informações</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-[#64748B] text-sm mb-1">Princípio Ativo</p>
              <p className="text-[#1A2B48]">{medication.name}</p>
            </div>
            
            <div>
              <p className="text-[#64748B] text-sm mb-1">Forma Farmacêutica</p>
              <p className="text-[#1A2B48]">{medication.type}</p>
            </div>
            
            <div>
              <p className="text-[#64748B] text-sm mb-1">Concentração</p>
              <p className="text-[#1A2B48]">{medication.dosage}</p>
            </div>
          </div>
        </div>

        {/* Indicações */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-[#E8F1FF]">
          <h3 className="text-[#1A2B48] mb-4">Indicações de Uso</h3>
          <p className="text-[#64748B] leading-relaxed">
            Medicamento indicado para o tratamento conforme prescrição médica. Consulte sempre um profissional de saúde antes de iniciar o uso.
          </p>
        </div>

        {/* Alerta */}
        <div className="bg-[#FFCC48]/10 rounded-2xl p-4 mb-6 border border-[#FFCC48]/20 flex gap-3">
          <AlertCircle className="w-5 h-5 text-[#FFCC48] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#1A2B48] text-sm mb-1">Atenção</p>
            <p className="text-[#64748B] text-sm">
              Este medicamento requer receita médica para retirada nas UBS.
            </p>
          </div>
        </div>

        {/* Disponibilidade */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-[#E8F1FF]">
          <h3 className="text-[#1A2B48] mb-4">Disponibilidade</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#27C183]/5 rounded-xl">
              <MapPin className="w-5 h-5 text-[#27C183]" />
              <div className="flex-1">
                <p className="text-[#1A2B48] text-sm">UBS Central</p>
                <p className="text-[#64748B] text-xs">1.2 km de distância</p>
              </div>
              <span className="text-[#27C183] text-xs">Disponível</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-[#27C183]/5 rounded-xl">
              <MapPin className="w-5 h-5 text-[#27C183]" />
              <div className="flex-1">
                <p className="text-[#1A2B48] text-sm">UBS Vila Nova</p>
                <p className="text-[#64748B] text-xs">2.8 km de distância</p>
              </div>
              <span className="text-[#27C183] text-xs">Disponível</span>
            </div>
            
            {medication.status === 'indisponivel' && (
              <>
                <div className="flex items-center gap-3 p-3 bg-[#FF4D5E]/5 rounded-xl border border-[#FF4D5E]/20">
                  <MapPin className="w-5 h-5 text-[#FF4D5E]" />
                  <div className="flex-1">
                    <p className="text-[#1A2B48] text-sm">UBS Jardim América</p>
                    <p className="text-[#64748B] text-xs">3.5 km de distância</p>
                  </div>
                  <span className="text-[#FF4D5E] text-xs">Indisponível</span>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-[#FF4D5E]/5 rounded-xl border border-[#FF4D5E]/20">
                  <MapPin className="w-5 h-5 text-[#FF4D5E]" />
                  <div className="flex-1">
                    <p className="text-[#1A2B48] text-sm">UBS São João</p>
                    <p className="text-[#64748B] text-xs">4.2 km de distância</p>
                  </div>
                  <span className="text-[#FF4D5E] text-xs">Indisponível</span>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={() => navigate('postos')}
            className="w-full mt-4 text-[#0A73FF] text-center"
          >
            Ver todos os postos
          </button>
        </div>
      </div>

      {/* Ações Fixas */}
      <div className="px-6 pb-8 bg-white border-t border-[#E8F1FF]">
        <button
          onClick={() => navigate('create-reminder', { selectedMedication: medication })}
          className="w-full h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors mt-4"
        >
          Adicionar Lembrete
        </button>
      </div>
    </div>
  );
}