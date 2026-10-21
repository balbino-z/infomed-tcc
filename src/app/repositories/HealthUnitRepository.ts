import type { HealthUnit, UnitMedication } from '../domain/health-unit';

export interface HealthUnitRepository {
  list(): Promise<HealthUnit[]>;
  getById(id: string): Promise<HealthUnit | null>;
  listMedications(unitId: string): Promise<UnitMedication[]>;
}
