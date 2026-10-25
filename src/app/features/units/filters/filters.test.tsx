import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { HealthUnit } from '../../../domain/health-unit';
import { DEFAULT_FILTERS, type FilterContext, type UnitFilters } from './types';
import { buildFilterStrategies, countActiveFilters, filterUnits } from './applyFilters';
import { DistanceSort, MaxDistanceFilter, MedicationAvailableFilter, NameSort, OpenNowFilter, ServicesFilter } from './strategies';
import { MapFilters } from '../../../components/screens/MapFilters';
import { PostosList } from '../../../components/screens/PostosList';
import { MockHealthUnitRepository } from '../../../repositories/mock/MockHealthUnitRepository';

const unit = (id: string, name: string, lat: number, lng: number, opensAt: string, closesAt: string, services: string[]): HealthUnit => ({
  id, name, address: `Rua ${name}`, lat, lng, opensAt, closesAt, services, phone: null, notes: null, verified: false,
});
const A = unit('a', 'Alfa', -22.7500, -47.4100, '07:00', '16:30', ['Clínico Geral', 'Pediatria']);
const B = unit('b', 'Beta', -22.7600, -47.4100, '07:00', '19:00', ['Clínico Geral', 'Ginecologia']);   // ~1,1 km de A
const C = unit('c', 'Gama', -22.7700, -47.4100, '14:00', '19:00', ['Clínico Geral']);                 // ~2,2 km de A, abre só à tarde
const ALL = [C, A, B]; // fora de ordem de propósito

// Quarta-feira 21/10/2026, 12:00 em São Paulo
const ctx = (over: Partial<FilterContext> = {}): FilterContext => ({
  now: new Date('2026-10-21T15:00:00Z'), userLocation: { lat: -22.75, lng: -47.41 }, unitIdsWithMedication: null, ...over,
});
const names = (list: HealthUnit[]) => list.map((u) => u.name);

describe('estratégias de filtro (padrão Strategy)', () => {
  it('OpenNowFilter: só as abertas agora', () => {
    expect(names(ALL.filter((u) => new OpenNowFilter().matches(u, ctx())))).toEqual(['Alfa', 'Beta']); // Gama abre às 14h
  });
  it('ServicesFilter: exige todos os serviços marcados', () => {
    expect(names(ALL.filter((u) => new ServicesFilter(['Ginecologia']).matches(u, ctx())))).toEqual(['Beta']);
    expect(names(ALL.filter((u) => new ServicesFilter(['Clínico Geral', 'Pediatria']).matches(u, ctx())))).toEqual(['Alfa']);
    expect(ALL.filter((u) => new ServicesFilter(['Cardiologia']).matches(u, ctx()))).toHaveLength(0);
  });
  it('MaxDistanceFilter: respeita o raio e não exclui ninguém sem localização', () => {
    const f = new MaxDistanceFilter(1.5);
    expect(names(ALL.filter((u) => f.matches(u, ctx())))).toEqual(['Alfa', 'Beta']);
    expect(ALL.filter((u) => f.matches(u, ctx({ userLocation: null })))).toHaveLength(3);
  });
  it('MedicationAvailableFilter: usa as unidades com o item e espera o carregamento', () => {
    const f = new MedicationAvailableFilter('m1');
    expect(names(ALL.filter((u) => f.matches(u, ctx({ unitIdsWithMedication: new Set(['b']) }))))).toEqual(['Beta']);
    expect(ALL.filter((u) => f.matches(u, ctx({ unitIdsWithMedication: null })))).toHaveLength(3);
  });
});

describe('estratégias de ordenação', () => {
  it('por nome', () => {
    expect(names([...ALL].sort((a, b) => new NameSort().compare(a, b)))).toEqual(['Alfa', 'Beta', 'Gama']);
  });
  it('por distância, com fallback para nome sem localização', () => {
    const s = new DistanceSort();
    expect(names([...ALL].sort((a, b) => s.compare(a, b, ctx())))).toEqual(['Alfa', 'Beta', 'Gama']);
    const fromGama = ctx({ userLocation: { lat: C.lat, lng: C.lng } });
    expect(names([...ALL].sort((a, b) => s.compare(a, b, fromGama)))).toEqual(['Gama', 'Beta', 'Alfa']);
    expect(names([...ALL].sort((a, b) => s.compare(a, b, ctx({ userLocation: null }))))).toEqual(['Alfa', 'Beta', 'Gama']);
  });
});

describe('filterUnits (combina as estratégias)', () => {
  it('sem filtros, devolve todas ordenadas por nome', () => {
    expect(names(filterUnits(ALL, DEFAULT_FILTERS, ctx()))).toEqual(['Alfa', 'Beta', 'Gama']);
  });
  it('combina filtros com E lógico', () => {
    const f: UnitFilters = { ...DEFAULT_FILTERS, openNow: true, services: ['Clínico Geral'], maxDistanceKm: 1.5, sort: 'distance' };
    expect(names(filterUnits(ALL, f, ctx()))).toEqual(['Alfa', 'Beta']);
    expect(names(filterUnits(ALL, { ...f, services: ['Pediatria'] }, ctx()))).toEqual(['Alfa']);
  });
  it('conta apenas filtros ativos (ordenação não conta)', () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...DEFAULT_FILTERS, sort: 'distance' })).toBe(0);
    expect(countActiveFilters({ ...DEFAULT_FILTERS, openNow: true, services: ['X'], medicationId: 'm1', maxDistanceKm: 3 })).toBe(4);
    expect(buildFilterStrategies({ ...DEFAULT_FILTERS, openNow: true }).map((s) => s.id)).toEqual(['open-now']);
  });
});

describe('MockHealthUnitRepository.unitIdsWithMedication', () => {
  it('devolve as unidades com o item', async () => {
    const repo = new MockHealthUnitRepository();
    expect(await repo.unitIdsWithMedication('m1')).toEqual(['u1', 'u2']);
    expect(await repo.unitIdsWithMedication('m3')).toEqual([]);
  });
});

describe('telas', () => {
  beforeEach(() => cleanup());
  const wrap = (el: JSX.Element) => render(<MemoryRouter>{el}</MemoryRouter>);

  it('MapFilters: monta os filtros e envia ao aplicar; limpar zera', async () => {
    const nav = vi.fn();
    wrap(<MapFilters navigate={nav} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Aberto agora' }));
    await userEvent.click(screen.getByRole('button', { name: 'Até 3 km' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Ginecologia' })); // serviço vem das unidades
    await userEvent.click(screen.getByRole('radio', { name: 'Distância' }));
    await userEvent.click(screen.getByRole('button', { name: /Aplicar Filtros \(3\)/ }));

    expect(nav).toHaveBeenCalledWith('postos', {
      unitFilters: { openNow: true, maxDistanceKm: 3, services: ['Ginecologia'], medicationId: null, sort: 'distance' },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar Filtros' }));
    expect(nav).toHaveBeenLastCalledWith('postos', { unitFilters: DEFAULT_FILTERS });
  });

  it('PostosList: aplica o filtro de serviço recebido', async () => {
    wrap(<PostosList navigate={() => {}} filters={{ ...DEFAULT_FILTERS, services: ['Ginecologia'] }} />);
    expect(await screen.findByText('UBS Exemplo Norte')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('UBS Exemplo Centro')).toBeNull());
    expect(screen.getByText(/1 posto com os filtros escolhidos/)).toBeTruthy();
  });

  it('PostosList: filtro de medicamento mostra só quem tem o item', async () => {
    wrap(<PostosList navigate={() => {}} filters={{ ...DEFAULT_FILTERS, medicationId: 'm1' }} />);
    expect(await screen.findByText('UBS Exemplo Centro')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('UBS Exemplo Sem Farmácia')).toBeNull());
    expect(screen.getByText('UBS Exemplo Norte')).toBeTruthy();
  });
});
