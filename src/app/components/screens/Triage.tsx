import { useState } from 'react';
import { AlertTriangle, Phone, Sparkles, Stethoscope, Info } from 'lucide-react';
import type { Screen, AppState } from '../../App';
import { Header } from '../shared/Header';
import { analyzeSymptoms, MIN_LENGTH, type TriageResult } from '../../features/triage/triage';
import { CONTACTS } from '../../features/triage/emergency';
import { appointmentRepository } from '../../repositories';

interface TriageProps {
  navigate: (screen: Screen, data?: Partial<AppState>) => void;
}

const COMPAT_STYLE = {
  alta: 'bg-[#27C183]/10 text-[#1E9E6A]',
  média: 'bg-[#FFCC48]/20 text-[#9A7400]',
  baixa: 'bg-[#E8F1FF] text-[#64748B]',
} as const;

const EXAMPLES = ['Dor de dente que piora à noite', 'Meu filho está com febre e tosse', 'Menstruação atrasada'];

export function Triage({ navigate }: TriageProps) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);

  const analyze = (value = text) => {
    setError('');
    setResult(analyzeSymptoms(value));
  };

  const schedule = async (specialtyName: string) => {
    setOpening(true);
    setError('');
    try {
      const list = await appointmentRepository.listSpecialties();
      const found = list.find((s) => s.name === specialtyName && s.doctorCount > 0);
      if (!found) {
        setError(`Não há médicos de ${specialtyName} disponíveis no momento. Escolha outra especialidade.`);
        navigate('schedule-specialty');
        return;
      }
      navigate('schedule-doctor', { selectedSpecialty: found, selectedKind: 'consulta' });
    } catch {
      setError('Não foi possível abrir o agendamento. Tente novamente.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Qual especialista?" onBack={() => navigate('home')} showNotification={false} />

      <div className="flex-1 overflow-y-auto px-6 py-4 pb-10">
        <div className="bg-[#E8F1FF] rounded-2xl p-4 mb-5 flex gap-3">
          <Info className="w-5 h-5 text-[#0A73FF] shrink-0 mt-0.5" />
          <p className="text-[#1A2B48] text-sm">
            Descreva o que está sentindo e o app sugere a especialidade mais indicada.
            <strong> Não é diagnóstico</strong> e não substitui a avaliação de um profissional de saúde.
            O texto é analisado no seu aparelho e não é enviado nem guardado.
          </p>
        </div>

        <label htmlFor="sintomas" className="block text-[#1A2B48] mb-2">O que você está sentindo?</label>
        <textarea
          id="sintomas"
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); }}
          rows={4}
          maxLength={500}
          placeholder="Ex.: estou com dor de dente e a gengiva inchada"
          className="w-full p-4 rounded-2xl border border-[#E8F1FF] bg-white text-[#1A2B48] focus:outline-none focus:border-[#0A73FF] resize-none"
        />

        <div className="flex flex-wrap gap-2 mt-3 mb-4">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => { setText(ex); analyze(ex); }}
              className="px-3 py-1.5 rounded-full bg-white border border-[#E8F1FF] text-xs text-[#64748B] hover:border-[#0A73FF]"
            >
              {ex}
            </button>
          ))}
        </div>

        <button
          onClick={() => analyze()}
          disabled={text.trim().length === 0}
          className="w-full h-12 bg-[#0A73FF] text-white rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5" /> Analisar
        </button>

        <div aria-live="polite" className="mt-6">
          {result?.kind === 'too-short' && (
            <p className="text-[#64748B] text-sm">Conte um pouco mais (pelo menos {MIN_LENGTH} letras) para a sugestão fazer sentido.</p>
          )}

          {result?.kind === 'alert' && (
            <div role="alert" className="bg-[#FF4D5E]/10 border border-[#FF4D5E] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-[#FF4D5E]" />
                <h3 className="text-[#FF4D5E]">
                  {result.level === 'life-risk' ? 'Você não está sozinho(a)' : 'Isso pode ser uma emergência'}
                </h3>
              </div>
              <p className="text-[#1A2B48] text-sm mb-1">Identificamos: {result.reasons.join(', ')}.</p>
              <p className="text-[#1A2B48] text-sm mb-4">
                {result.level === 'life-risk'
                  ? 'Converse agora com alguém. A ligação é gratuita e sigilosa.'
                  : 'Não espere por uma consulta agendada. Ligue agora ou procure o pronto-socorro mais próximo.'}
              </p>
              <div className="space-y-2">
                {CONTACTS[result.level].map((c) => (
                  <a key={c.phone} href={`tel:${c.phone}`} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#FF4D5E]/30">
                    <Phone className="w-5 h-5 text-[#FF4D5E]" />
                    <div className="flex-1">
                      <p className="text-[#1A2B48]">Ligar {c.phone} ({c.name})</p>
                      <p className="text-[#64748B] text-xs">{c.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {result?.kind === 'suggestion' && (
            <div className="bg-white border border-[#E8F1FF] rounded-2xl p-4">
              <p className="text-[#64748B] text-sm mb-1">Especialidade sugerida</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-[#0A73FF]/10 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-[#0A73FF]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#1A2B48]">{result.specialty}</h3>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${COMPAT_STYLE[result.compatibility]}`}>
                    Compatibilidade {result.compatibility}
                  </span>
                </div>
              </div>
              {result.precaution && (
                <p className="text-[#64748B] text-sm mb-3">
                  A descrição não deixou claro qual especialista procurar. Por precaução, comece pelo Clínico Geral,
                  que avalia e encaminha se for preciso.
                </p>
              )}
              <p className="text-[#64748B] text-xs mb-4">Se os sintomas piorarem ou surgirem sinais de alerta, ligue 192 (SAMU).</p>
              <button
                onClick={() => schedule(result.specialty)}
                disabled={opening}
                className="w-full h-12 bg-[#0A73FF] text-white rounded-2xl disabled:opacity-50"
              >
                {opening ? 'Abrindo...' : `Agendar com ${result.specialty}`}
              </button>
            </div>
          )}

          {error && <p role="alert" className="text-[#FF4D5E] text-sm mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
}
