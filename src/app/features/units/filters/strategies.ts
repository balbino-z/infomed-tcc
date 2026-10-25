import type { HealthUnit } from '../../../domain/health-unit';
import { distanceKm, isOpenNow } from '../unitUtils';
import type { FilterContext, UnitFilterStrategy, UnitSortStrategy } from './types';

// ---------------- Estratégias de FILTRO ----------------

export class OpenNowFilter implements UnitFilterStrategy {
  readonly id = 'open-now';
  matches(unit: HealthUnit, ctx: FilterContext) {
    return isOpenNow(unit, ctx.now);
  }
}

export class ServicesFilter implements UnitFilterStrategy {
  readonly id = 'services';
  constructor(private readonly services: string[]) {}
  matches(unit: HealthUnit, _ctx?: FilterContext) {
    return this.services.every((s) => unit.services.includes(s));
  }
}

export class MaxDistanceFilter implements UnitFilterStrategy {
  readonly id = 'max-distance';
  constructor(private readonly km: number) {}
  matches(unit: HealthUnit, ctx: FilterContext) {
    if (!ctx.userLocation) return true; // sem localização não dá para medir: não exclui ninguém
    return distanceKm(ctx.userLocation, unit) <= this.km;
  }
}

export class MedicationAvailableFilter implements UnitFilterStrategy {
  readonly id = 'medication-available';
  constructor(private readonly medicationId: string) {}
  matches(unit: HealthUnit, ctx: FilterContext) {
    if (!ctx.unitIdsWithMedication) return true; // ainda carregando
    return ctx.unitIdsWithMedication.has(unit.id);
  }
}

// ---------------- Estratégias de ORDENAÇÃO ----------------

export class NameSort implements UnitSortStrategy {
  readonly id = 'name';
  compare(a: HealthUnit, b: HealthUnit) {
    return a.name.localeCompare(b.name, 'pt-BR');
  }
}

export class DistanceSort implements UnitSortStrategy {
  readonly id = 'distance';
  private readonly fallback = new NameSort();
  compare(a: HealthUnit, b: HealthUnit, ctx: FilterContext) {
    if (!ctx.userLocation) return this.fallback.compare(a, b); // sem localização, ordena por nome
    return distanceKm(ctx.userLocation, a) - distanceKm(ctx.userLocation, b);
  }
}
