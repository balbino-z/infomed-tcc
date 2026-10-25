import type { HealthUnit, UnitMedication } from '../../domain/health-unit';
import type { HealthUnitRepository } from '../HealthUnitRepository';

// Dados de EXEMPLO para rodar sem .env (testes e CI). Não são unidades reais.
const UNITS: HealthUnit[] = [
  { id: 'u1', name: 'UBS Exemplo Centro', address: 'Rua Exemplo, 100 - Centro', lat: -22.7539, lng: -47.4147, opensAt: '07:00', closesAt: '16:30', services: ['Clínico Geral', 'Pediatria', 'Vacinação'], phone: '(19) 0000-0001', notes: null, verified: false },
  { id: 'u2', name: 'UBS Exemplo Norte', address: 'Av. Exemplo, 200 - Norte', lat: -22.7440, lng: -47.4050, opensAt: '07:00', closesAt: '19:00', services: ['Clínico Geral', 'Ginecologia'], phone: null, notes: null, verified: false },
  { id: 'u3', name: 'UBS Exemplo Sem Farmácia', address: 'Rua Exemplo, 300 - Sul', lat: -22.7650, lng: -47.4200, opensAt: '14:00', closesAt: '19:00', services: ['Clínico Geral'], phone: null, notes: null, verified: false },
];

const MEDS: UnitMedication[] = [
  { medicationId: 'm1', name: 'Losartana Potássica', dosage: '50mg', form: 'Comprimido', status: 'disponivel' },
  { medicationId: 'm2', name: 'Metformina', dosage: '500mg', form: 'Comprimido', status: 'atencao' },
  { medicationId: 'm3', name: 'Amoxicilina', dosage: '500mg', form: 'Cápsula', status: 'indisponivel' },
];

export class MockHealthUnitRepository implements HealthUnitRepository {
  async list() {
    return UNITS;
  }
  async getById(id: string) {
    return UNITS.find((u) => u.id === id) ?? null;
  }
  async unitIdsWithMedication(medicationId: string) {
    if (medicationId === 'm1') return ['u1', 'u2'];
    if (medicationId === 'm3') return [];
    return UNITS.map((u) => u.id);
  }
  async listMedications(unitId: string) {
    return unitId === 'u3' ? [] : MEDS;
  }
}
