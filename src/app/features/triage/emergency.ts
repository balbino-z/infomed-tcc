import { normalize } from './classifier.mjs';

/**
 * Sinais de alerta verificados ANTES do modelo.
 * São regras simples e revisáveis (expressões regulares sobre o texto sem acentos).
 * Quando uma delas aparece, o app não sugere especialidade nem agendamento: manda ligar.
 */
export type AlertLevel = 'emergency' | 'life-risk';

export interface AlertRule {
  id: string;
  level: AlertLevel;
  label: string;
  pattern: RegExp;
}

export const ALERT_RULES: AlertRule[] = [
  // Risco à vida (sofrimento emocional grave): CVV e SAMU
  { id: 'suicidio', level: 'life-risk', label: 'pensamentos de se machucar ou tirar a vida', pattern: /\b(suicid\w*|me matar|tirar (a )?minha (propria )?vida|nao quero mais viver|vontade de morrer|quero morrer|me machucar de proposito|autolesao|me cortar)\b/ },

  // Emergências médicas: SAMU e Bombeiros
  { id: 'peito', level: 'emergency', label: 'dor ou aperto no peito', pattern: /\b(dor|aperto|pressao|queimacao|pontada)\w* (forte |muito forte )?(no|do|n[oa]) peito\b|\bpeito (doendo|apertado)\b|\binfarto\b|\binfartando\b/ },
  { id: 'ar', level: 'emergency', label: 'falta de ar', pattern: /\b(falta de ar|sem ar|nao consigo respirar|nao consegue respirar|dificuldade (para|pra|de) respirar|sufoca\w*|labios roxos|boca roxa)\b/ },
  { id: 'desmaio', level: 'emergency', label: 'desmaio ou perda de consciência', pattern: /\b(desmai\w*|perdeu (a )?(consciencia|os sentidos)|perdi (a )?(consciencia|os sentidos)|inconsciente|nao acorda|desacordad\w*)\b/ },
  { id: 'convulsao', level: 'emergency', label: 'convulsão', pattern: /\b(convuls\w*|ataque epileptico|crise epileptica|se debatendo)\b/ },
  { id: 'avc', level: 'emergency', label: 'sinais de AVC', pattern: /\b(avc|derrame|boca torta|rosto torto|lado do corpo (paralisado|dormente)|nao consigo (falar|mexer o braco)|fala enrolada)\b/ },
  { id: 'sangramento', level: 'emergency', label: 'sangramento intenso', pattern: /\b(hemorragia|sangramento (muito )?(forte|intenso|que nao para)|sangrando muito|vomit\w* sangue|tossindo sangue|perdendo muito sangue)\b/ },
  { id: 'acidente', level: 'emergency', label: 'acidente ou trauma grave', pattern: /\b(atropelad\w*|acidente (de carro|de moto|grave)|bateu a cabeca (forte|e desmaiou)|queimadura (grave|grande)|choque eletrico|afogamento|afogou)\b/ },
  { id: 'intoxicacao', level: 'emergency', label: 'envenenamento ou intoxicação', pattern: /\b(envenen\w*|intoxica\w*|tomou (muitos|varios) remedios|engoliu (produto|veneno|agua sanitaria))\b/ },
  { id: 'alergia-grave', level: 'emergency', label: 'reação alérgica grave', pattern: /\b(garganta fechando|inchaco na (garganta|lingua)|anafila\w*)\b/ },
];

export interface AlertMatch {
  level: AlertLevel;
  reasons: string[];
}

/** Procura sinais de alerta. Risco à vida tem prioridade sobre emergência. */
export function detectAlert(text: string): AlertMatch | null {
  const t = normalize(text);
  const hits = ALERT_RULES.filter((r) => r.pattern.test(t));
  if (hits.length === 0) return null;
  const level: AlertLevel = hits.some((h) => h.level === 'life-risk') ? 'life-risk' : 'emergency';
  return { level, reasons: hits.map((h) => h.label) };
}

export interface EmergencyContact {
  name: string;
  phone: string;
  description: string;
}

export const CONTACTS: Record<AlertLevel, EmergencyContact[]> = {
  emergency: [
    { name: 'SAMU', phone: '192', description: 'Urgências médicas, 24 horas' },
    { name: 'Bombeiros', phone: '193', description: 'Acidentes, resgates e incêndios' },
  ],
  'life-risk': [
    { name: 'CVV', phone: '188', description: 'Apoio emocional gratuito, 24 horas' },
    { name: 'SAMU', phone: '192', description: 'Se houver risco imediato' },
  ],
};
