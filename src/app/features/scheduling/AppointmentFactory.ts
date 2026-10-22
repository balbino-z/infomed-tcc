import type { AppointmentDraft, AppointmentKind, Doctor } from '../../domain/appointment';
import { AppointmentError } from '../../repositories/AppointmentRepository';
import { partsInSP } from './dateUtils';

/**
 * PADRÃO FACTORY: centraliza a criação do pedido de agendamento.
 * Cada tipo (consulta, retorno, exame) tem suas próprias regras; quem usa a fábrica
 * não precisa conhecê-las e nunca monta um pedido inválido.
 */
export interface KindRules {
  kind: AppointmentKind;
  label: string;
  description: string;
  minLeadMinutes: number; // antecedência mínima
  maxDaysAhead: number;   // até quantos dias à frente
}

const RULES: Record<AppointmentKind, KindRules> = {
  consulta: { kind: 'consulta', label: 'Consulta', description: 'Primeira avaliação com o médico', minLeadMinutes: 120, maxDaysAhead: 30 },
  retorno: { kind: 'retorno', label: 'Retorno', description: 'Voltar para mostrar resultados', minLeadMinutes: 60, maxDaysAhead: 30 },
  exame: { kind: 'exame', label: 'Exame', description: 'Coleta ou realização de exame', minLeadMinutes: 24 * 60, maxDaysAhead: 60 },
};

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const AppointmentFactory = {
  kinds(): KindRules[] {
    return Object.values(RULES);
  },

  rulesFor(kind: AppointmentKind): KindRules {
    return RULES[kind];
  },

  /** Antecedência mínima: primeiro instante em que se pode agendar este tipo */
  earliestStart(kind: AppointmentKind, now = new Date()): Date {
    return new Date(now.getTime() + RULES[kind].minLeadMinutes * 60_000);
  },

  create(kind: AppointmentKind, doctor: Doctor, startsAt: string, now = new Date()): AppointmentDraft {
    const rules = RULES[kind];
    const when = new Date(startsAt);
    if (Number.isNaN(when.getTime())) throw new AppointmentError('Horário inválido.');

    if (when.getTime() < AppointmentFactory.earliestStart(kind, now).getTime()) {
      const h = rules.minLeadMinutes >= 60 ? `${rules.minLeadMinutes / 60}h` : `${rules.minLeadMinutes} min`;
      throw new AppointmentError(`${rules.label}: agende com pelo menos ${h} de antecedência.`);
    }
    if (when.getTime() > now.getTime() + rules.maxDaysAhead * 24 * 3600 * 1000) {
      throw new AppointmentError(`${rules.label}: só é possível agendar em até ${rules.maxDaysAhead} dias.`);
    }
    const p = partsInSP(when);
    if (p.weekday === 0 || p.weekday === 6) throw new AppointmentError('A unidade atende de segunda a sexta.');
    const min = p.hour * 60 + p.minute;
    if (p.minute % 30 !== 0 || min < toMin(doctor.opensAt) || min + 30 > toMin(doctor.closesAt)) {
      throw new AppointmentError('Horário fora do atendimento da unidade.');
    }
    return { kind, doctorId: doctor.id, startsAt };
  },
};
