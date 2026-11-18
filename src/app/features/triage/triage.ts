import { predict, type NaiveBayesModel } from './classifier.mjs';
import { allowedClasses, GENERAL } from './rules.mjs';
import { detectAlert, type AlertLevel } from './emergency';
import modelJson from './model.json';

const model = modelJson as NaiveBayesModel;

/** Abaixo disso o app recomenda Clínico Geral "por precaução". */
export const CONFIDENCE_THRESHOLD = 0.6;
/** Texto mínimo para tentar classificar. */
export const MIN_LENGTH = 8;

export type Compatibility = 'alta' | 'média' | 'baixa';

export type TriageResult =
  | { kind: 'alert'; level: AlertLevel; reasons: string[] }
  | { kind: 'too-short' }
  | {
      kind: 'suggestion';
      specialty: string;
      compatibility: Compatibility;
      /** true quando a confiança ficou baixa e o app trocou a sugestão por Clínico Geral. */
      precaution: boolean;
      /** O que o modelo achou mais provável (pode diferir de `specialty` quando há precaução). */
      predicted: string;
    };

export function compatibilityOf(probability: number): Compatibility {
  if (probability >= 0.85) return 'alta';
  if (probability >= CONFIDENCE_THRESHOLD) return 'média';
  return 'baixa';
}

/**
 * Triagem: sinais de alerta (regras) -> modelo (Naive Bayes) -> limiar de confiança.
 * Roda no aparelho; o texto não é enviado nem gravado.
 */
export function analyzeSymptoms(text: string): TriageResult {
  const alert = detectAlert(text);
  if (alert) return { kind: 'alert', level: alert.level, reasons: alert.reasons };

  if (text.trim().length < MIN_LENGTH) return { kind: 'too-short' };

  const [top] = predict(model, text, allowedClasses(model.classes, text));
  // Nenhuma palavra conhecida: o modelo só repetiria a classe mais comum
  const probability = top.knownTokens === 0 ? 0 : top.probability;
  const compatibility = compatibilityOf(probability);
  const precaution = probability < CONFIDENCE_THRESHOLD;
  return {
    kind: 'suggestion',
    specialty: precaution ? GENERAL : top.label,
    compatibility,
    precaution,
    predicted: top.label,
  };
}
