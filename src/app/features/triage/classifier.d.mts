// Tipos do classificador escrito em JavaScript puro (classifier.mjs).

export interface LabeledText {
  text: string;
  label: string;
}

export interface NaiveBayesModel {
  version: number;
  alpha: number;
  classes: string[];
  docCount: Record<string, number>;
  tokenTotal: Record<string, number>;
  vocabSize: number;
  counts: Record<string, Record<string, number>>;
}

export interface Prediction {
  label: string;
  probability: number;
  /** Quantas palavras do texto o modelo conhecia (0 = não entendeu nada). */
  knownTokens: number;
}

export function normalize(text: string): string;
export function stem(word: string): string;
export function tokenize(text: string): string[];
export function train(docs: LabeledText[], alpha?: number): NaiveBayesModel;
export function predict(model: NaiveBayesModel, text: string, allowed?: string[]): Prediction[];
export function parseCsv(content: string): LabeledText[];
