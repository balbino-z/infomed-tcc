export type StockStatus = 'disponivel' | 'atencao' | 'indisponivel';

export interface Medication {
  id: string;
  name: string;
  dosage: string;      // ex.: "50mg"
  type: string;        // ex.: "Comprimido"
  status: StockStatus;
  description: string; // ex.: "Anti-hipertensivo"
}
