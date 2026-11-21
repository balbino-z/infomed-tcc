import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { AuthProvider } from '../auth/AuthContext';
import { AppDataProvider } from '../navigation/AppData';
import { AppRoutes } from '../navigation/AppRoutes';
import { formatDateBR, formatPhone, normalizeProfile, validateProfile } from './profileUtils';
import { dashboardToCsv } from '../analytics/dashboardCsv';
import { MockAnalyticsRepository } from '../../repositories/mock/MockAnalyticsRepository';
import { AnalyticsAccessError } from '../../repositories/AnalyticsRepository';

vi.mock('../units/UnitsMap', () => ({ default: () => <div /> }));
// Recharts precisa de medidas reais de tela; nos testes basta saber que o painel montou
vi.mock('recharts', async (orig) => {
  const mod = await orig<typeof import('recharts')>();
  return { ...mod, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div style={{ width: 300, height: 200 }}>{children}</div> };
});

const NOW = new Date('2026-11-18T15:00:00Z');
const login = (email: string, fullName = 'Maria da Silva') =>
  localStorage.setItem('infomed.mock.session', JSON.stringify({ id: 'mock-user', email, fullName }));

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>;
}
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppDataProvider>
          <Where />
          <AppRoutes />
        </AppDataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  cleanup();
  localStorage.clear();
});

describe('profileUtils', () => {
  it('formata telefone fixo, celular e digitação parcial', () => {
    expect(formatPhone('19999998888')).toBe('(19) 0000-0000');
    expect(formatPhone('1934567890')).toBe('(19) 3456-7890');
    expect(formatPhone('199')).toBe('(19) 9');
    expect(formatPhone('')).toBe('');
  });
  it('formata data no padrão brasileiro', () => {
    expect(formatDateBR('2006-07-24')).toBe('24/07/2006');
    expect(formatDateBR('')).toBe('');
  });
  it('valida com as mesmas regras do banco (db/09)', () => {
    const ok = { fullName: 'Maria', phone: '(19) 99999-8888', birthDate: '1990-05-10' };
    expect(validateProfile(ok, NOW)).toEqual({});
    expect(validateProfile({ ...ok, phone: '' }, NOW)).toEqual({});
    expect(validateProfile({ ...ok, phone: '1234' }, NOW).phone).toBeTruthy();
    expect(validateProfile({ ...ok, fullName: 'Al' }, NOW).fullName).toBeTruthy();
    expect(validateProfile({ ...ok, fullName: 'x'.repeat(121) }, NOW).fullName).toBeTruthy();
    expect(validateProfile({ ...ok, birthDate: '1899-12-31' }, NOW).birthDate).toBeTruthy();
    expect(validateProfile({ ...ok, birthDate: '2026-11-19' }, NOW).birthDate).toBeTruthy();
    expect(validateProfile({ ...ok, birthDate: '2026-11-18' }, NOW)).toEqual({});
  });
  it('grava telefone só com dígitos e nome sem espaços extras', () => {
    expect(normalizeProfile({ fullName: '  Maria   Souza ', phone: '(19) 99999-8888', birthDate: '' })).toEqual({ fullName: 'Maria Souza', phone: '19999998888', birthDate: '' });
  });
});

describe('tela de Perfil', () => {
  it('não mostra mais os dados fixos do protótipo e edita os dados reais', async () => {
    const user = userEvent.setup();
    login('maria@email.com');
    renderAt('/perfil');
    expect(await screen.findByRole('heading', { name: 'Maria da Silva' })).toBeTruthy();
    expect(screen.queryByText(/98765-4321|Maria Silva$|Rua das Flores/)).toBeNull();
    expect(await screen.findByText(/Aceitos em 20\/10\/2026/)).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('count-reminders').textContent).not.toBe('—'));

    await user.click(screen.getByRole('button', { name: 'Editar informações pessoais' }));
    const phone = screen.getByLabelText('Telefone (com DDD)');
    await user.type(phone, '123');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/10 ou 11 dígitos/);

    await user.clear(phone);
    await user.type(phone, '19999998888');
    expect((phone as HTMLInputElement).value).toBe('(19) 99999-8888');
    const name = screen.getByLabelText('Nome completo');
    await user.clear(name);
    await user.type(name, 'Maria Souza');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Maria Souza' })).toBeTruthy();
    expect(screen.getByText('(19) 99999-8888')).toBeTruthy();
  });

  it('usuário comum não vê o Painel de BI', async () => {
    login('maria@email.com');
    renderAt('/perfil');
    await screen.findByText(/Aceitos em/);
    expect(screen.queryByText('Painel de BI')).toBeNull();
  });

  it('administrador vê o item e abre o painel', { timeout: 20000 }, async () => {
    const user = userEvent.setup();
    login('admin@infomed.dev', 'Admin');
    renderAt('/perfil');
    await user.click(await screen.findByText('Painel de BI'));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/painel'));
    expect(await screen.findByText('Consultas por especialidade', {}, { timeout: 15000 })).toBeTruthy();
    expect(screen.getByText(/estoque simulado/i)).toBeTruthy();
  });
});

describe('painel de BI', () => {
  it('usuário comum que abre /painel pelo link recebe acesso negado', { timeout: 20000 }, async () => {
    login('maria@email.com');
    renderAt('/painel');
    expect((await screen.findByRole('alert', {}, { timeout: 15000 })).textContent).toMatch(/restrito/);
  });

  it('repositório recusa não administrador', async () => {
    login('maria@email.com');
    await expect(new MockAnalyticsRepository().getDashboard(30)).rejects.toBeInstanceOf(AnalyticsAccessError);
  });

  it('exporta CSV com ";", BOM e sem dados pessoais', async () => {
    login('admin@infomed.dev', 'Admin');
    const csv = dashboardToCsv(await new MockAnalyticsRepository().getDashboard(90));
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('Especialidade;Consultas;Canceladas');
    expect(csv).toContain('Clínico Geral;113;15');
    expect(csv).not.toMatch(/@|mock-user/);
  });
});
