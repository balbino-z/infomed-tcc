import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { AuthProvider } from '../auth/AuthContext';
import { AppDataProvider } from '../navigation/AppData';
import { AppRoutes } from '../navigation/AppRoutes';
import { AppointmentFactory } from './AppointmentFactory';
import { generateDaySlots } from './slots';
import { nextBusinessDays, toStartsAt, timeAgo } from './dateUtils';
import { AppointmentError } from '../../repositories/AppointmentRepository';
import { MockAppointmentRepository } from '../../repositories/mock/MockAppointmentRepository';
import type { Doctor } from '../../domain/appointment';

vi.mock('../units/UnitsMap', () => ({ default: () => <div /> }));

const doctor: Doctor = { id: 'd1', name: 'Dra. Teste', crm: 'SIM-1', specialtyId: 's1', specialtyName: 'Clínico Geral', unitId: 'u1', unitName: 'UBS Teste', opensAt: '07:00', closesAt: '16:30' };
// Quarta-feira 21/10/2026, 12:00 em São Paulo
const NOW = new Date('2026-10-21T15:00:00Z');

describe('AppointmentFactory (padrão Factory)', () => {
  it('cria pedido válido', () => {
    const draft = AppointmentFactory.create('consulta', doctor, '2026-10-23T10:00:00-03:00', NOW);
    expect(draft).toEqual({ kind: 'consulta', doctorId: 'd1', startsAt: '2026-10-23T10:00:00-03:00' });
  });
  it('respeita a antecedência de cada tipo', () => {
    // 13:00 do mesmo dia: 1h de antecedência -> consulta (2h) recusa, retorno (1h) aceita
    expect(() => AppointmentFactory.create('consulta', doctor, '2026-10-21T13:00:00-03:00', NOW)).toThrow(AppointmentError);
    expect(AppointmentFactory.create('retorno', doctor, '2026-10-21T13:00:00-03:00', NOW).kind).toBe('retorno');
    // exame exige 24h
    expect(AppointmentFactory.create('exame', doctor, '2026-10-23T10:00:00-03:00', NOW).kind).toBe('exame');
    expect(() => AppointmentFactory.create('exame', doctor, '2026-10-22T10:00:00-03:00', NOW)).toThrow(/24h/); // só 22h depois
  });
  it('recusa fim de semana, horário quebrado, fora do expediente e muito distante', () => {
    expect(() => AppointmentFactory.create('consulta', doctor, '2026-10-24T10:00:00-03:00', NOW)).toThrow(/segunda a sexta/);
    expect(() => AppointmentFactory.create('consulta', doctor, '2026-10-23T10:15:00-03:00', NOW)).toThrow(/fora do atendimento/);
    expect(() => AppointmentFactory.create('consulta', doctor, '2026-10-23T06:30:00-03:00', NOW)).toThrow(/fora do atendimento/);
    expect(() => AppointmentFactory.create('consulta', doctor, '2026-10-23T16:30:00-03:00', NOW)).toThrow(/fora do atendimento/);
    expect(() => AppointmentFactory.create('consulta', doctor, '2026-12-30T10:00:00-03:00', NOW)).toThrow(/30 dias/);
  });
});

describe('horários', () => {
  it('gera slots de 30 em 30 min e marca ocupados e passados', () => {
    const booked = new Set([new Date(toStartsAt('2026-10-23', '10:00')).getTime()]);
    const slots = generateDaySlots('2026-10-23', doctor, booked, new Date(toStartsAt('2026-10-23', '09:00')));
    expect(slots[0].time).toBe('07:00');
    expect(slots[slots.length - 1].time).toBe('16:00'); // 16:30 não cabe
    expect(slots.find((s) => s.time === '08:00')!.available).toBe(false); // antes da antecedência mínima
    expect(slots.find((s) => s.time === '10:00')!.available).toBe(false); // ocupado
    expect(slots.find((s) => s.time === '10:30')!.available).toBe(true);
  });
  it('lista só dias úteis', () => {
    const days = nextBusinessDays(6, NOW);
    expect(days.map((d) => d.iso)).toEqual(['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-26', '2026-10-27', '2026-10-28']);
  });
  it('formata "há quanto tempo"', () => {
    expect(timeAgo('2026-10-21T14:58:00Z', NOW)).toBe('Há 2 min');
    expect(timeAgo('2026-10-21T12:00:00Z', NOW)).toBe('Há 3 h');
    expect(timeAgo('2026-10-20T14:00:00Z', NOW)).toBe('Ontem');
  });
});

describe('MockAppointmentRepository', () => {
  it('impede reservar duas vezes o mesmo horário e libera ao cancelar', async () => {
    const repo = new MockAppointmentRepository();
    const when = '2030-01-08T10:00:00-03:00';
    const a = await repo.create({ kind: 'consulta', doctorId: 'd1', startsAt: when });
    await expect(repo.create({ kind: 'consulta', doctorId: 'd1', startsAt: when })).rejects.toThrow(/ocupado/);
    expect(await repo.bookedSlots('d1', new Date('2030-01-08T00:00:00Z'), new Date('2030-01-09T00:00:00Z'))).toHaveLength(1);
    await repo.cancel(a.id, 'imprevisto');
    expect(await repo.bookedSlots('d1', new Date('2030-01-08T00:00:00Z'), new Date('2030-01-09T00:00:00Z'))).toHaveLength(0);
  });
});

// ---------- fluxo completo pela tela ----------
function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>;
}
function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppDataProvider>
          <Where />
          <AppRoutes />
        </AppDataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cleanup();
  localStorage.setItem('infomed.mock.session', JSON.stringify({ id: 'mock-user', email: 'm@e.com', fullName: 'Maria' }));
});

describe('fluxo de agendamento (telas)', () => {
  it('especialidade → médico → data e hora → confirmação → histórico → cancelar', async () => {
    renderApp('/agendar');

    await userEvent.click(await screen.findByText('Clínico Geral'));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/agendar/medico'));

    await userEvent.click(await screen.findByText('Dra. Fernanda Rocha'));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/agendar/horario'));

    // escolhe o último dia útil listado e o primeiro horário livre (sempre no futuro)
    const dayButtons = await screen.findAllByRole('button', { name: /^(SEG|TER|QUA|QUI|SEX)\s*\d{2}$/ });
    await userEvent.click(dayButtons[dayButtons.length - 1]);
    const slot = await screen.findByRole('button', { name: '10:00' });
    await userEvent.click(slot);
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar Agendamento' }));

    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/agendar/confirmado'));
    expect(await screen.findByText('Consulta Confirmada!')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Ver Minhas Consultas' }));
    const card = (await screen.findByText('Dra. Fernanda Rocha')).closest('div.bg-white') as HTMLElement;
    expect(within(card).getByText('Confirmada')).toBeTruthy();

    await userEvent.click(within(card).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/consultas/cancelar'));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar Cancelamento' }));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/historico'));
    await userEvent.click(screen.getByRole('button', { name: 'Anteriores' }));
    // o armazenamento do Mock é compartilhado entre os testes do arquivo, então pode haver mais de uma cancelada
    expect((await screen.findAllByText('Cancelada')).length).toBeGreaterThanOrEqual(1);
  });

  it('recarregar no meio do fluxo volta ao começo dele', async () => {
    renderApp('/agendar/horario');
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/agendar'));
  });
});
