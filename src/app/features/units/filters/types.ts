import type { HealthUnit } from '../../../domain/health-unit';
import type { LatLng } from '../unitUtils';

/** Escolhas da pessoa na tela de filtros */
export interface UnitFilters {
  openNow: boolean;
  maxDistanceKm: number | null; // null = sem limite
  services: string[];           // a unidade precisa oferecer TODOS os marcados
  medicationId: string | null;  // só unidades com o medicamento disponível
  sort: 'name' | 'distance';
}

export const DEFAULT_FILTERS: UnitFilters = {
  openNow: false,
  maxDistanceKm: null,
  services: [],
  medicationId: null,
  sort: 'name',
};

/** Tudo que uma estratégia pode precisar saber além da própria unidade */
export interface FilterContext {
  now: Date;
  userLocation: LatLng | null;
  /** ids das unidades com o medicamento escolhido (null = não carregado/sem filtro) */
  unitIdsWithMedication: Set<string> | null;
}

/** PADRÃO STRATEGY (filtro): cada regra de filtragem é um objeto intercambiável. */
export interface UnitFilterStrategy {
  readonly id: string;
  matches(unit: HealthUnit, ctx: FilterContext): boolean;
}

/** PADRÃO STRATEGY (ordenação): cada critério de ordenação é um objeto intercambiável. */
export interface UnitSortStrategy {
  readonly id: string;
  compare(a: HealthUnit, b: HealthUnit, ctx: FilterContext): number;
}
