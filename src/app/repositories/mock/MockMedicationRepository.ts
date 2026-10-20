import type { Medication } from '../../domain/medication';
import type { MedicationRepository } from '../MedicationRepository';

const DATA: Medication[] = [
  { id: '1', name: 'Losartana Potássica', dosage: '50mg', type: 'Comprimido', status: 'disponivel', description: 'Anti-hipertensivo' },
  { id: '2', name: 'Metformina', dosage: '500mg', type: 'Comprimido', status: 'disponivel', description: 'Antidiabético' },
  { id: '3', name: 'Omeprazol', dosage: '20mg', type: 'Cápsula', status: 'disponivel', description: 'Antiácido' },
  { id: '4', name: 'Sinvastatina', dosage: '20mg', type: 'Comprimido', status: 'atencao', description: 'Hipolipemiante' },
  { id: '5', name: 'Paracetamol', dosage: '750mg', type: 'Comprimido', status: 'disponivel', description: 'Analgésico' },
  { id: '6', name: 'Amoxicilina', dosage: '500mg', type: 'Cápsula', status: 'indisponivel', description: 'Antibiótico' },
];

export class MockMedicationRepository implements MedicationRepository {
  async list(query = ''): Promise<Medication[]> {
    const q = query.trim().toLowerCase();
    return DATA.filter((m) => m.name.toLowerCase().includes(q));
  }

  async getById(id: string): Promise<Medication | null> {
    return DATA.find((m) => m.id === id) ?? null;
  }
}
