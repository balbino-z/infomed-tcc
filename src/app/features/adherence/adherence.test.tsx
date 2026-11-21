import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { adherenceRate, classifyTaken, periodOf, type DoseEvent } from '../../domain/adherence';
import { compartmentOf, humidityStatus, isOutOfRange, isOnline, tempStatus, type Device } from '../../domain/device';
import type { Reminder } from '../../domain/reminder';
import { newlyTaken, summarize, todayDoses } from './doses';
import { followUpReminders, ReminderScheduler } from '../reminders/ReminderScheduler';
import { bus, type DueReminder } from '../notifications/NotificationBus';
import { MockAdherenceRepository } from '../../repositories/mock/MockAdherenceRepository';
import { MockDeviceRepository } from '../../repositories/mock/MockDeviceRepository';
import { reminderRepository } from '../../repositories';
import { MedicineBox } from '../../components/screens/MedicineBox';
import { RemindersList } from '../../components/screens/RemindersList';
import { formatTimeSP } from '../scheduling/dateUtils';

// Quarta-feira, 21/10/2026, em São Paulo (UTC-3)
const sp = (hhmm: string, day = '2026-10-21') => new Date(`${day}T${hhmm}:00-03:00`);
const rem = (over: Partial<Reminder> = {}): Reminder => ({
  id: 'r1', label: 'Losartana 50mg', medicationId: null, times: ['08:00'], daysOfWeek: [0, 1, 2, 3, 4, 5, 6], note: null, active: true,
  createdAt: '2026-10-01T12:00:00Z', ...over,
});
const ev = (reminderId: string, scheduled: Date, takenMin: number): DoseEvent => {
  const taken = new Date(scheduled.getTime() + takenMin * 60_000);
  return { reminderId, scheduledAt: scheduled.toISOString(), status: classifyTaken(scheduled, taken)!, takenAt: taken.toISOString(), source: 'caixa' };
};

describe('regras da dose (iguais ao banco)', () => {
  it('compartimento pelo horário: manhã < 12h, tarde até 18h, noite depois', () => {
    expect(periodOf('00:00')).toBe('manha');
    expect(periodOf('11:59')).toBe('manha');
    expect(periodOf('12:00')).toBe('tarde');
    expect(periodOf('17:59')).toBe('tarde');
    expect(periodOf('18:00')).toBe('noite');
  });

  it('janela: 30 min antes até 30 depois = tomada; até 2 h = atrasada; fora = recusada', () => {
    const s = sp('08:00');
    const at = (min: number) => classifyTaken(s, new Date(s.getTime() + min * 60_000));
    expect(at(-31)).toBeNull();
    expect(at(-30)).toBe('tomada');
    expect(at(30)).toBe('tomada');
    expect(at(31)).toBe('atrasada');
    expect(at(120)).toBe('atrasada');
    expect(at(121)).toBeNull();
  });

  it('taxa de adesão', () => {
    expect(adherenceRate(2, 5)).toBe(40);
    expect(adherenceRate(0, 0)).toBeNull();
  });
});

describe('doses de hoje (selos)', () => {
  it('tomada, esquecida, atrasada e pendente conforme a hora', () => {
    const reminders = [
      rem({ id: 'a', label: 'A', times: ['07:00', '08:00', '10:00', '10:30', '11:10', '12:00'] }),
    ];
    const events = [ev('a', sp('07:00'), 5)];
    const doses = todayDoses(reminders, events, sp('10:45'));
    const by = Object.fromEntries(doses.map((d) => [d.time, d]));
    expect(by['07:00']).toMatchObject({ status: 'tomada', takenLate: false, source: 'caixa', canConfirm: false });
    expect(by['08:00']).toMatchObject({ status: 'esquecida', canConfirm: false });
    expect(by['10:00']).toMatchObject({ status: 'atrasada', canConfirm: true });
    expect(by['10:30']).toMatchObject({ status: 'pendente', canConfirm: true });
    expect(by['11:10']).toMatchObject({ status: 'pendente', canConfirm: true }); // 25 min antes já pode
    expect(by['12:00']).toMatchObject({ status: 'pendente', canConfirm: false });
    expect(doses.map((d) => d.time)).toEqual(['07:00', '08:00', '10:00', '10:30', '11:10', '12:00']);
  });

  it('não cobra dose de antes do lembrete existir nem de outro dia da semana', () => {
    const created = sp('10:40').toISOString();
    const doses = todayDoses([rem({ times: ['08:00', '10:30', '20:00'], createdAt: created })], [], sp('10:45'));
    expect(doses.map((d) => d.time)).toEqual(['10:30', '20:00']);
    expect(todayDoses([rem({ daysOfWeek: [1] })], [], sp('10:45'))).toHaveLength(0); // quarta = 3
  });
});

describe('destaque da dose confirmada pela caixa', () => {
  it('detecta só a dose que acabou de virar "tomada"', () => {
    const r = rem({ id: 'a', times: ['08:00', '10:30'] });
    const before = todayDoses([r], [ev('a', sp('08:00'), 2)], sp('10:35'));
    const after = todayDoses([r], [ev('a', sp('08:00'), 2), ev('a', sp('10:30'), 6)], sp('10:37'));
    const got = newlyTaken(before, after);
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ time: '10:30', source: 'caixa', status: 'tomada' });
    expect(newlyTaken(after, after)).toHaveLength(0);
  });
});

describe('adesão do período', () => {
  it('previstas × tomadas, sem contar doses ainda abertas', () => {
    const r = rem({ times: ['08:00', '20:00'] });
    const events = [ev('r1', sp('08:00', '2026-10-20'), 4), ev('r1', sp('20:00', '2026-10-20'), 70)];
    const s = summarize([r], events, 3, sp('10:45'));
    // 19/10: 2 esquecidas · 20/10: 2 tomadas (1 atrasada) · 21/10: 08:00 esquecida, 20:00 ainda aberta
    expect(s).toMatchObject({ days: 3, expected: 5, taken: 2, onTime: 1, late: 1, missed: 3 });
    expect(s.byPeriod).toEqual([
      { period: 'manha', expected: 3, taken: 1 },
      { period: 'noite', expected: 2, taken: 1 },
    ]);
    expect(s.byDay.map((d) => d.day)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21']);
  });
});

describe('repositório Mock de adesão (botão "Tomei")', () => {
  beforeEach(() => MockAdherenceRepository.reset());

  it('registra dentro da janela, recusa fora e não duplica', async () => {
    let now = sp('08:10');
    const reminders = { list: async () => [rem()] } as unknown as typeof reminderRepository;
    const repo = new MockAdherenceRepository(reminders, () => now);
    const scheduled = sp('08:00').toISOString();
    await repo.confirmDose('r1', scheduled);
    await repo.confirmDose('r1', scheduled);
    const today = await repo.todayDoses();
    expect(today).toHaveLength(1);
    expect(today[0]).toMatchObject({ status: 'tomada', source: 'app' });

    now = sp('11:00');
    await expect(repo.confirmDose('r1', sp('08:00', '2026-10-20').toISOString())).rejects.toThrow(/janela/);
  });
});

describe('aviso "Você tomou?" (Observer)', () => {
  afterEach(() => vi.useRealTimers());

  it('aparece 30 min depois do horário', () => {
    expect(followUpReminders([rem()], sp('08:10'), new Set())).toHaveLength(0);
    const got = followUpReminders([rem()], sp('08:30'), new Set());
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ kind: 'check', time: '08:00', scheduledAt: sp('08:00').toISOString() });
  });

  it('só avisa se a dose NÃO foi registrada', async () => {
    vi.useFakeTimers();
    let current = sp('08:29');
    let taken = true;
    const scheduler = new ReminderScheduler(async () => [rem()], 20_000, () => current, async () => taken);
    const got: DueReminder[] = [];
    const off = bus.on('reminder-due', (d) => d.kind === 'check' && got.push(d));
    await scheduler.start();
    current = sp('08:30');
    await vi.advanceTimersByTimeAsync(20_000);
    expect(got).toHaveLength(0); // tomou pela caixa: sem aviso

    taken = false;
    current = sp('20:30');
    const s2 = new ReminderScheduler(async () => [rem({ times: ['20:00'] })], 20_000, () => current, async () => taken);
    await s2.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ label: 'Losartana 50mg', time: '20:00' });
    scheduler.stop();
    s2.stop();
    off();
  });
});

describe('caixa (domínio)', () => {
  const dev = (over: Partial<Device> = {}): Device => ({
    id: 'd', name: 'Caixa', pairedAt: '', lastSeenAt: new Date(Date.now() - 60_000).toISOString(), firmware: null, temp: 24, humidity: 50, demoMode: false, sensorOk: true, ...over,
  });
  it('online se falou com o servidor nos últimos 3 minutos', () => {
    expect(isOnline(dev())).toBe(true);
    expect(isOnline(dev({ lastSeenAt: new Date(Date.now() - 5 * 60_000).toISOString() }))).toBe(false);
    expect(isOnline(dev({ lastSeenAt: null }))).toBe(false);
  });
  it('alerta fora da faixa: 15 a 30 °C e 30% a 75% de umidade', () => {
    expect(isOutOfRange(dev())).toBe(false);
    expect(isOutOfRange(dev({ temp: 32 }))).toBe(true);
    expect(isOutOfRange(dev({ humidity: 80 }))).toBe(true);
    expect(isOutOfRange(dev({ temp: 12 }))).toBe(true);
    expect(isOutOfRange(dev({ humidity: 20 }))).toBe(true);
    expect(isOutOfRange(dev({ temp: null, humidity: null }))).toBe(false); // sem leitura não é alerta
    expect(tempStatus(dev({ temp: 12 }))).toBe('baixa');
    expect(humidityStatus(dev({ humidity: 80 }))).toBe('alta');
    expect(compartmentOf(2)).toBe('noite');
  });
});

describe('telas', () => {
  beforeEach(() => {
    cleanup();
    MockDeviceRepository.reset();
    MockAdherenceRepository.reset();
  });
  const wrap = (el: JSX.Element) => render(<MemoryRouter>{el}</MemoryRouter>);

  it('pareia a caixa com o código e depois despareia', { timeout: 15000 }, async () => {
    wrap(<MedicineBox navigate={() => {}} />);
    expect(await screen.findByText('Nenhuma caixa pareada')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Parear caixa' }));
    const code = (await screen.findByTestId('pairing-code')).textContent!;
    expect(code).toMatch(/^\d{6}$/);
    expect(screen.getByText(/Expira em \d+:\d{2}/)).toBeTruthy();

    expect(MockDeviceRepository.simulateBoxPairing('000000' === code ? '111111' : '000000')).toBe(false); // código errado
    expect(MockDeviceRepository.simulateBoxPairing(code)).toBe(true);
    expect(await screen.findByText('Caixa pareada ✅', {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByText(/Online/)).toBeTruthy();
    expect(screen.getByText('24,5 °C')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Desparear caixa' }));
    await userEvent.click(screen.getByRole('button', { name: 'Desparear' }));
    await waitFor(() => expect(screen.queryByText('Caixa InfoMed (simulada)')).toBeNull());
  });

  it('tela da caixa: botão do modo demo, sensor sem sinal e toques', { timeout: 15000 }, async () => {
    wrap(<MedicineBox navigate={() => {}} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Parear caixa' }));
    MockDeviceRepository.simulateBoxPairing((await screen.findByTestId('pairing-code')).textContent!);
    const sw = await screen.findByRole('switch', { name: 'Modo demonstração' }, { timeout: 5000 });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByTestId('sensor-status').textContent).toMatch(/Sensor funcionando/);

    await userEvent.click(sw);
    await waitFor(() => expect(sw.getAttribute('aria-checked')).toBe('true'));
    expect(screen.getByText(/ciclo: manhã, tarde e noite, 5 s cada/)).toBeTruthy();
    expect((await new MockDeviceRepository().listMine())[0].demoMode).toBe(true);

    MockDeviceRepository.simulateTouch(1);
    expect(await screen.findByText(/Tarde/, { selector: 'span' }, { timeout: 7000 })).toBeTruthy();
    expect(screen.getByTestId('touch').textContent).toMatch(/Tarde.*demonstração/);
  });

  it('tela da caixa avisa sensor sem sinal e temperatura baixa', { timeout: 15000 }, async () => {
    wrap(<MedicineBox navigate={() => {}} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Parear caixa' }));
    MockDeviceRepository.simulateBoxPairing((await screen.findByTestId('pairing-code')).textContent!);
    MockDeviceRepository.simulateReading(null, null);
    expect(await screen.findByText('Sensor sem sinal', {}, { timeout: 5000 })).toBeTruthy();
    expect(screen.getByText(/não está conseguindo medir/)).toBeTruthy();
    cleanup();
    MockDeviceRepository.simulateReading(12, 50);
    wrap(<MedicineBox navigate={() => {}} />);
    expect(await screen.findByText('baixa demais')).toBeTruthy();
    expect(screen.getByText(/Temperatura baixa/)).toBeTruthy();
  });

  it('lembretes mostram as doses de hoje e o botão "Tomei" registra', async () => {
    const now = new Date();
    await reminderRepository.create({ label: 'Metformina', medicationId: null, times: [formatTimeSP(now)], daysOfWeek: [0, 1, 2, 3, 4, 5, 6], note: null });
    wrap(<RemindersList navigate={() => {}} />);
    const btn = await screen.findByRole('button', { name: `Tomei Metformina das ${formatTimeSP(now)}` });
    expect(screen.getByText(/⏳ pendente/)).toBeTruthy();
    await userEvent.click(btn);
    expect(await screen.findByText(/✅ tomada às/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Tomei Metformina/ })).toBeNull();
  });
});
