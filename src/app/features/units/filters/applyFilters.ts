import type { HealthUnit } from '../../../domain/health-unit';
import {
  DistanceSort, MaxDistanceFilter, MedicationAvailableFilter, NameSort, OpenNowFilter, ServicesFilter,
} from './strategies';
import type { FilterContext, UnitFilterStrategy, UnitFilters, UnitSortStrategy } from './types';

/** Traduz as escolhas da tela em uma lista de estratégias de filtro */
export function buildFilterStrategies(f: UnitFilters): UnitFilterStrategy[] {
  const list: UnitFilterStrategy[] = [];
  if (f.openNow) list.push(new OpenNowFilter());
  if (f.services.length > 0) list.push(new ServicesFilter(f.services));
  if (f.maxDistanceKm !== null) list.push(new MaxDistanceFilter(f.maxDistanceKm));
  if (f.medicationId) list.push(new MedicationAvailableFilter(f.medicationId));
  return list;
}

export function buildSortStrategy(sort: UnitFilters['sort']): UnitSortStrategy {
  return sort === 'distance' ? new DistanceSort() : new NameSort();
}

/** Aplica todos os filtros (E lógico) e depois a ordenação escolhida */
export function filterUnits(units: HealthUnit[], filters: UnitFilters, ctx: FilterContext): HealthUnit[] {
  const strategies = buildFilterStrategies(filters);
  const sorter = buildSortStrategy(filters.sort);
  return units
    .filter((u) => strategies.every((s) => s.matches(u, ctx)))
    .sort((a, b) => sorter.compare(a, b, ctx));
}

/** Quantos filtros estão ativos (a ordenação não conta) */
export function countActiveFilters(f: UnitFilters): number {
  return buildFilterStrategies(f).length;
}
