import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { AuthProvider } from '../auth/AuthContext';
import { AppDataProvider } from '../navigation/AppData';
import { AppRoutes } from '../navigation/AppRoutes';
import { parseCsv, predict, tokenize, train } from './classifier.mjs';
import { allowedClasses, mentionsChild } from './rules.mjs';
import { detectAlert } from './emergency';
import { analyzeSymptoms, compatibilityOf } from './triage';
import modelJson from './model.json';
import treinoCsv from '../../../../data/triagem/treino.csv?raw';
import testeCsv from '../../../../data/triagem/teste.csv?raw';

vi.mock('../units/UnitsMap', () => ({ default: () => <div /> }));

describe('classificador (Naive Bayes)', () => {
  it('normaliza, remove stopwords e cria bigramas', () => {
    const t = tokenize('Estou com DOR de Dente');
    expect(t).toContain('dor');
    expect(t).toContain('dente');
    expect(t).toContain('dor_dente');
    expect(t).not.toContain('com');
  });

  it('model.json está em dia com data/triagem/treino.csv (rode node scripts/treinar-triagem.mjs)', () => {
    const fresh = train(parseCsv(treinoCsv), modelJson.alpha);
    expect(fresh).toEqual(modelJson);
  });

  it('acerta pelo menos 90% do conjunto de teste separado', () => {
    const test = parseCsv(testeCsv);
    const hits = test.filter((d) => predict(modelJson, d.text, allowedClasses(modelJson.classes, d.text))[0].label === d.label).length;
    expect(hits / test.length).toBeGreaterThanOrEqual(0.9);
  });
});

describe('regras de domínio', () => {
  it('só considera Pediatria quando a frase fala de criança', () => {
    expect(mentionsChild('meu filho está com febre')).toBe(true);
    expect(mentionsChild('o bebê chora muito')).toBe(true);
    expect(mentionsChild('estou com febre')).toBe(false);
    const adulto = analyzeSymptoms('estou com febre e tosse há dois dias');
    const crianca = analyzeSymptoms('meu filho está com febre e tosse há dois dias');
    expect(adulto.kind === 'suggestion' && adulto.specialty).toBe('Clínico Geral');
    expect(crianca.kind === 'suggestion' && crianca.specialty).toBe('Pediatria');
  });

  it('dor de dente de criança vai para Odontologia', () => {
    const r = analyzeSymptoms('minha filha está com dor de dente e cárie');
    expect(r.kind === 'suggestion' && r.specialty).toBe('Odontologia');
  });

  it('confiança baixa recomenda Clínico Geral por precaução', () => {
    const r = analyzeSymptoms('não sei explicar direito o que é');
    expect(r).toMatchObject({ kind: 'suggestion', specialty: 'Clínico Geral', precaution: true, compatibility: 'baixa' });
  });

  it('traduz probabilidade em compatibilidade, nunca em percentual', () => {
    expect(compatibilityOf(0.95)).toBe('alta');
    expect(compatibilityOf(0.7)).toBe('média');
    expect(compatibilityOf(0.3)).toBe('baixa');
  });

  it('texto curto demais pede mais detalhes', () => {
    expect(analyzeSymptoms('dor').kind).toBe('too-short');
  });
});

describe('sinais de alerta (antes do modelo)', () => {
  it.each([
    'estou com dor no peito e suando frio',
    'meu pai está com falta de ar',
    'minha mãe desmaiou agora',
    'criança tendo convulsão',
    'boca torta e fala enrolada',
    'hemorragia que não para',
  ])('"%s" é emergência', (frase) => {
    expect(detectAlert(frase)?.level).toBe('emergency');
    expect(analyzeSymptoms(frase).kind).toBe('alert');
  });

  it('risco à vida tem prioridade e mostra o CVV', () => {
    expect(detectAlert('não quero mais viver e estou com falta de ar')?.level).toBe('life-risk');
  });

  it('sintomas comuns não disparam alerta', () => {
    expect(detectAlert('dor de dente e gengiva inchada')).toBeNull();
    expect(detectAlert('menstruação atrasada')).toBeNull();
  });
});

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>;
}
function renderAt(path: string) {
  localStorage.setItem('infomed.mock.session', JSON.stringify({ id: 'mock-user', email: 'maria@email.com', fullName: 'Maria' }));
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

describe('tela de triagem', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('sugere a especialidade e leva ao agendamento dela', async () => {
    const user = userEvent.setup();
    renderAt('/triagem');
    await user.type(await screen.findByLabelText('O que você está sentindo?'), 'meu filho está com febre e tosse');
    await user.click(screen.getByRole('button', { name: /Analisar/ }));
    expect(await screen.findByRole('heading', { name: 'Pediatria' })).toBeTruthy();
    expect(screen.getByText(/Compatibilidade/)).toBeTruthy();
    expect(screen.queryByText(/%/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Agendar com Pediatria' }));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/agendar/medico'));
  });

  it('em emergência mostra os telefones e não oferece agendamento', async () => {
    const user = userEvent.setup();
    renderAt('/triagem');
    await user.type(await screen.findByLabelText('O que você está sentindo?'), 'dor forte no peito');
    await user.click(screen.getByRole('button', { name: /Analisar/ }));
    expect((await screen.findByRole('alert')).textContent).toContain('192');
    expect(screen.getByRole('link', { name: /Ligar 192/ }).getAttribute('href')).toBe('tel:192');
    expect(screen.queryByRole('button', { name: /Agendar com/ })).toBeNull();
  });
});
