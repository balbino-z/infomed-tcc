import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { AuthProvider } from '../auth/AuthContext';
import { AppDataProvider } from '../navigation/AppData';
import { AppRoutes } from '../navigation/AppRoutes';
import { AssistantFab } from '../../components/shared/AssistantFab';
import { answer } from './assistant';
import { MockMedicationRepository } from '../../repositories/mock/MockMedicationRepository';
import { MockHealthUnitRepository } from '../../repositories/mock/MockHealthUnitRepository';
import type { AssistantContext, AssistantHandler } from './types';

vi.mock('../units/UnitsMap', () => ({ default: () => <div /> }));

// Quarta-feira 18/11/2026, 10:00 em São Paulo (UBS de exemplo abertas: Centro e Norte)
const WEDNESDAY_10H = new Date('2026-11-18T13:00:00Z');
const SUNDAY = new Date('2026-11-22T13:00:00Z');
const ctx = (now = WEDNESDAY_10H): AssistantContext => ({
  medications: new MockMedicationRepository(),
  units: new MockHealthUnitRepository(),
  now: () => now,
});

describe('corrente de responsabilidade', () => {
  it.each([
    ['estou com dor no peito e falta de ar', 'alert'],
    ['quero me matar', 'alert'],
    ['Onde tem Losartana?', 'intent'],
    ['Qual UBS está aberta agora?', 'intent'],
    ['Como cancelo uma consulta?', 'intent'],
    ['quero agendar uma consulta', 'intent'],
    ['como crio um lembrete', 'intent'],
    ['estou com dor de dente', 'intent'],
    ['Os lembretes tocam com o app fechado?', 'faq'],
    ['Preciso de receita para retirar remédio?', 'faq'],
    ['quais documentos levar na consulta', 'faq'],
    ['onde tomar vacina da gripe', 'faq'],
    ['como faço o cartão sus', 'faq'],
    ['a disponibilidade dos remédios é real?', 'faq'],
    ['qual a capital da França', 'fallback'],
    ['asdfgh', 'fallback'],
  ])('"%s" -> %s', async (msg, source) => {
    expect((await answer(msg, ctx())).source).toBe(source);
  });

  it('emergência vem antes de tudo e oferece ligação, não agendamento', async () => {
    const r = await answer('meu filho desmaiou, onde tem posto aberto?', ctx());
    expect(r.tone).toBe('alert');
    expect(r.actions?.[0].href).toBe('tel:192');
    expect(r.actions?.some((a) => a.screen === 'schedule-specialty')).toBe(false);
  });

  it('risco à vida mostra o CVV 188', async () => {
    const r = await answer('não quero mais viver', ctx());
    expect(r.text).toContain('188');
    expect(r.actions?.[0].href).toBe('tel:188');
  });

  it('remédio: conta os postos e leva à lista já filtrada', async () => {
    const r = await answer('onde tem losartana?', ctx());
    expect(r.text).toMatch(/Losartana Potássica 50mg .* 3 postos/);
    expect(r.actions?.[0]).toMatchObject({ screen: 'postos', data: { unitFilters: { medicationId: '1' } } });
  });

  it('remédio não identificado pede o nome', async () => {
    const r = await answer('onde tem remédio para dor?', ctx());
    expect(r.actions?.[0].screen).toBe('medications');
  });

  it('postos abertos dependem do horário de São Paulo', async () => {
    expect((await answer('tem posto aberto agora?', ctx())).text).toMatch(/2 postos abertos/);
    expect((await answer('tem posto aberto agora?', ctx(SUNDAY))).text).toMatch(/Nenhum posto está aberto/);
  });

  it('sintoma usa a triagem e nunca mostra percentual', async () => {
    const r = await answer('estou com dor de dente e gengiva inchada', ctx());
    expect(r.text).toContain('Odontologia');
    expect(r.text).not.toMatch(/%/);
    expect(r.text).toContain('não é diagnóstico');
  });

  it('um elo com erro não derruba o assistente', async () => {
    const broken: AssistantHandler = { name: 'quebrado', handle: async () => { throw new Error('sem internet'); } };
    const r = await answer('qual a capital da França', ctx(), [broken]);
    expect(r.source).toBe('fallback');
  });
});

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>;
}
const renderAt = (path: string) => {
  localStorage.setItem('infomed.mock.session', JSON.stringify({ id: 'mock-user', email: 'maria@email.com', fullName: 'Maria' }));
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppDataProvider>
          <Where />
          <AppRoutes />
          <AssistantFab />
        </AppDataProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe('tela do assistente', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('botão flutuante abre o assistente e some dentro dele', async () => {
    const user = userEvent.setup();
    renderAt('/inicio');
    await user.click(await screen.findByRole('button', { name: 'Abrir assistente' }));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/assistente'));
    expect(screen.queryByRole('button', { name: 'Abrir assistente' })).toBeNull();
    expect(screen.getByText(/Não substitui um profissional de saúde/)).toBeTruthy();
  });

  it('responde, mostra ação e navega pelo botão', async () => {
    const user = userEvent.setup();
    renderAt('/assistente');
    await user.click(await screen.findByRole('button', { name: 'Como cancelo uma consulta?' }));
    expect(await screen.findByText(/abra o Histórico/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Abrir histórico' }));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/historico'));
  });

  it('não grava a conversa no navegador', async () => {
    const user = userEvent.setup();
    renderAt('/assistente');
    await user.type(await screen.findByLabelText('Mensagem'), 'texto secreto de saúde');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    await screen.findByText('texto secreto de saúde');
    const stored = Object.keys(localStorage).map((k) => localStorage.getItem(k)).join(' ');
    expect(stored).not.toContain('texto secreto');
  });
});
