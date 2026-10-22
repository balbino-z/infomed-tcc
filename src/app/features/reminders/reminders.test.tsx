import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { dueReminders, ReminderScheduler } from './ReminderScheduler';
import { bus, EventBus, type DueReminder } from '../notifications/NotificationBus';
import { describeDays, type Reminder } from '../../domain/reminder';
import { CreateReminder } from '../../components/screens/CreateReminder';
import { RemindersList } from '../../components/screens/RemindersList';
import { Notifications } from '../../components/screens/Notifications';
import { notificationRepository } from '../../repositories';

const rem = (over: Partial<Reminder> = {}): Reminder => ({
  id: 'r1', label: 'Losartana 50mg', medicationId: null, times: ['08:00', '20:00'], daysOfWeek: [0, 1, 2, 3, 4, 5, 6], note: null, active: true, ...over,
});
// Quarta 21/10/2026: 08:00 em São Paulo = 11:00 UTC
const at = (hhmmUTC: string) => new Date(`2026-10-21T${hhmmUTC}:00Z`);

describe('EventBus (padrão Observer)', () => {
  it('avisa todos os assinantes e permite cancelar a assinatura', () => {
    const b = new EventBus<{ ping: number }>();
    const a = vi.fn();
    const c = vi.fn();
    const offA = b.on('ping', a);
    b.on('ping', c);
    b.emit('ping', 1);
    offA();
    b.emit('ping', 2);
    expect(a).toHaveBeenCalledTimes(1);
    expect(c).toHaveBeenCalledTimes(2);
  });
});

describe('dueReminders', () => {
  it('dispara no horário, sem repetir', () => {
    const fired = new Set<string>();
    expect(dueReminders([rem()], at('11:00'), fired)).toHaveLength(1);
    expect(dueReminders([rem()], at('11:01'), fired)).toHaveLength(0); // já tocou
  });
  it('tolera até 2 minutos de atraso, mas não mais', () => {
    expect(dueReminders([rem()], at('11:02'), new Set())).toHaveLength(1);
    expect(dueReminders([rem()], at('11:03'), new Set())).toHaveLength(0);
    expect(dueReminders([rem()], at('10:59'), new Set())).toHaveLength(0);
  });
  it('ignora lembrete desligado ou de outro dia da semana', () => {
    expect(dueReminders([rem({ active: false })], at('11:00'), new Set())).toHaveLength(0);
    expect(dueReminders([rem({ daysOfWeek: [1] })], at('11:00'), new Set())).toHaveLength(0); // quarta = 3
    expect(dueReminders([rem({ daysOfWeek: [3] })], at('11:00'), new Set())).toHaveLength(1);
  });
  it('descreve os dias', () => {
    expect(describeDays([0, 1, 2, 3, 4, 5, 6])).toBe('Todos os dias');
    expect(describeDays([1, 2, 3, 4, 5])).toBe('Segunda a sexta');
    expect(describeDays([1, 3])).toBe('Seg, Qua');
  });
});

describe('ReminderScheduler publica no canal', () => {
  afterEach(() => vi.useRealTimers());
  it('emite reminder-due quando chega a hora', async () => {
    vi.useFakeTimers();
    let current = at('10:59');
    const scheduler = new ReminderScheduler(async () => [rem()], 20_000, () => current);
    const got: DueReminder[] = [];
    const off = bus.on('reminder-due', (d) => got.push(d));
    await scheduler.start();
    expect(got).toHaveLength(0);
    current = at('11:00');
    vi.advanceTimersByTime(20_000);
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ label: 'Losartana 50mg', time: '08:00' });
    scheduler.stop();
    off();
  });
});

describe('telas de lembretes e notificações', () => {
  beforeEach(() => cleanup());
  const wrap = (el: JSX.Element) => render(<MemoryRouter>{el}</MemoryRouter>);

  it('cria um lembrete e ele aparece na lista; liga/desliga e exclui', async () => {
    const nav = vi.fn();
    const { unmount } = wrap(<CreateReminder navigate={nav} />);
    await userEvent.type(screen.getByLabelText('Nome do Medicamento'), 'Vitamina D');
    await userEvent.click(screen.getByRole('button', { name: '08:00' }));
    await userEvent.click(screen.getByRole('button', { name: 'Seg a Sex' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Lembrete' }));
    await waitFor(() => expect(nav).toHaveBeenCalledWith('reminders'));
    unmount();

    wrap(<RemindersList navigate={() => {}} />);
    expect(await screen.findByText('Vitamina D')).toBeTruthy();
    expect(screen.getByText(/Segunda a sexta/)).toBeTruthy();

    const toggle = screen.getByRole('switch', { name: 'Lembrete Vitamina D' });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    await userEvent.click(toggle);
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Lembrete Vitamina D' }).getAttribute('aria-checked')).toBe('false'));

    await userEvent.click(screen.getByRole('button', { name: 'Excluir lembrete Vitamina D' }));
    await waitFor(() => expect(screen.queryByText('Vitamina D')).toBeNull());
  });

  it('exige nome e horário', async () => {
    const nav = vi.fn();
    wrap(<CreateReminder navigate={nav} />);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Lembrete' }));
    expect((await screen.findByRole('alert')).textContent).toContain('nome');
    await userEvent.type(screen.getByLabelText('Nome do Medicamento'), 'X');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar Lembrete' }));
    expect((await screen.findByRole('alert')).textContent).toContain('horário');
    expect(nav).not.toHaveBeenCalled();
  });

  it('notificações: marca como lida e o contador cai', async () => {
    wrap(<Notifications navigate={() => {}} />);
    expect(await screen.findByText(/1 não lida/)).toBeTruthy();
    await userEvent.click(screen.getByText('Consulta agendada'));
    await waitFor(() => expect(screen.getByText(/0 não lidas/)).toBeTruthy());
    expect(await notificationRepository.countUnread()).toBe(0);
  });
});
