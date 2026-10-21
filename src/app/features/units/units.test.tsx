import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostosList } from '../../components/screens/PostosList';
import { distanceKm, formatDistance, formatTime, hoursLabel, isOpenNow } from './unitUtils';
import { MockHealthUnitRepository } from '../../repositories/mock/MockHealthUnitRepository';

const unit = { opensAt: '07:00', closesAt: '16:30' };
// 21/10/2026 é quarta-feira. São Paulo = UTC-3.
const quartaMeioDia = new Date('2026-10-21T15:00:00Z'); // 12:00
const quartaCedo = new Date('2026-10-21T08:00:00Z');    // 05:00
const quartaNoite = new Date('2026-10-21T22:00:00Z');   // 19:00
const sextaNoite = new Date('2026-10-23T22:00:00Z');
const sabado = new Date('2026-10-24T15:00:00Z');

describe('horário de funcionamento', () => {
  it('formata horas', () => {
    expect(formatTime('07:00')).toBe('7h');
    expect(formatTime('16:30')).toBe('16h30');
  });
  it('aberto em dia útil dentro do horário', () => {
    expect(isOpenNow(unit, quartaMeioDia)).toBe(true);
    expect(hoursLabel(unit, quartaMeioDia)).toBe('Fecha às 16h30');
  });
  it('fechado antes, depois e no fim de semana', () => {
    expect(isOpenNow(unit, quartaCedo)).toBe(false);
    expect(hoursLabel(unit, quartaCedo)).toBe('Abre às 7h');
    expect(hoursLabel(unit, quartaNoite)).toBe('Abre amanhã às 7h');
    expect(hoursLabel(unit, sextaNoite)).toBe('Abre segunda às 7h');
    expect(isOpenNow(unit, sabado)).toBe(false);
  });
});

describe('distância', () => {
  it('calcula Haversine com boa aproximação', () => {
    // ~1,1 km entre dois pontos separados por 0,01° de latitude
    const km = distanceKm({ lat: -22.75, lng: -47.41 }, { lat: -22.76, lng: -47.41 });
    expect(km).toBeGreaterThan(1.0);
    expect(km).toBeLessThan(1.2);
  });
  it('formata metros e quilômetros', () => {
    expect(formatDistance(0.45)).toBe('450 m');
    expect(formatDistance(2.34)).toBe('2,3 km');
  });
});

describe('MockHealthUnitRepository', () => {
  it('lista e busca por id', async () => {
    const repo = new MockHealthUnitRepository();
    expect((await repo.list()).length).toBeGreaterThan(0);
    expect((await repo.getById('u1'))?.name).toContain('Centro');
    expect(await repo.getById('nao-existe')).toBeNull();
  });
});

describe('PostosList', () => {
  beforeEach(() => cleanup());

  it('mostra os postos e filtra pela busca', async () => {
    render(<PostosList navigate={() => {}} />);
    expect(await screen.findByText('UBS Exemplo Centro')).toBeTruthy();
    expect(screen.getByText('UBS Exemplo Norte')).toBeTruthy();

    await userEvent.type(screen.getByPlaceholderText('Buscar posto de saúde...'), 'norte');
    await waitFor(() => expect(screen.queryByText('UBS Exemplo Centro')).toBeNull());
    expect(screen.getByText('UBS Exemplo Norte')).toBeTruthy();
  });
});
