import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { AuthProvider } from '../auth/AuthContext';
import { AppDataProvider } from './AppData';
import { AppRoutes } from './AppRoutes';
import { pathFor, screenFromPath } from './routes';

// O mapa (Leaflet) não é necessário nestes testes
vi.mock('../units/UnitsMap', () => ({ default: () => <div data-testid="mapa" /> }));

const SESSION_KEY = 'infomed.mock.session';
const logar = () =>
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: 'mock-user', email: 'maria@email.com', fullName: 'Maria da Silva' }));

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

const onde = () => screen.getByTestId('where').textContent;

beforeEach(() => {
  cleanup();
  localStorage.clear();
});

describe('mapa de rotas', () => {
  it('monta URLs com o id do item escolhido', () => {
    expect(pathFor('postos')).toBe('/postos');
    expect(pathFor('posto-detail', { selectedPosto: { id: 'abc' } as any })).toBe('/postos/abc');
    expect(pathFor('posto-detail')).toBe('/postos'); // sem item, volta para a lista
    expect(pathFor('medication-detail', { selectedMedication: { id: 7 } })).toBe('/medicamentos/7');
  });
  it('descobre a tela pela URL (rota fixa vence a dinâmica)', () => {
    expect(screenFromPath('/postos')).toBe('postos');
    expect(screenFromPath('/postos/filtros')).toBe('map-filters');
    expect(screenFromPath('/postos/u1')).toBe('posto-detail');
    expect(screenFromPath('/qualquer-coisa')).toBe('welcome');
  });
});

describe('proteção de telas', () => {
  it('sem login, tela interna manda para /entrar', async () => {
    renderApp('/postos');
    await waitFor(() => expect(onde()).toBe('/entrar'));
  });

  it('com login, a tela de boas-vindas manda para /inicio', async () => {
    logar();
    renderApp('/');
    await waitFor(() => expect(onde()).toBe('/inicio'));
  });

  it('endereço inexistente volta para o começo', async () => {
    renderApp('/nao-existe');
    await waitFor(() => expect(onde()).toBe('/'));
  });
});

describe('navegação e botão voltar', () => {
  it('abre o posto pelo link direto (/postos/u2)', async () => {
    logar();
    renderApp('/postos/u2');
    expect(await screen.findByText('UBS Exemplo Norte')).toBeTruthy();
    expect(onde()).toBe('/postos/u2');
  });

  it('posto inexistente mostra aviso', async () => {
    logar();
    renderApp('/postos/nao-existe');
    expect(await screen.findByText('Posto não encontrado')).toBeTruthy();
  });

  it('lista → detalhe → voltar', async () => {
    logar();
    renderApp('/postos');
    await userEvent.click(await screen.findByText('UBS Exemplo Centro'));
    await waitFor(() => expect(onde()).toBe('/postos/u1'));
    expect(await screen.findByText('Detalhes do Posto')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    await waitFor(() => expect(onde()).toBe('/postos'));
  });
});
