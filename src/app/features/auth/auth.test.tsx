import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './AuthContext';
import { Login } from '../../components/screens/Login';
import { Signup } from '../../components/screens/Signup';

// Sem .env, o app usa MockAuthRepository (ver repositories/index.ts)
beforeEach(() => {
  cleanup();
  localStorage.clear();
});

describe('Login', () => {
  it('entra e navega para a Home com e-mail e senha preenchidos', async () => {
    const navigate = vi.fn();
    render(
      <AuthProvider>
        <Login navigate={navigate} />
      </AuthProvider>,
    );
    await userEvent.type(screen.getByPlaceholderText('seu@email.com'), 'maria@email.com');
    await userEvent.type(screen.getByPlaceholderText('Sua senha'), 'senha1234');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('home'));
  });

  it('mostra erro quando os campos estão vazios', async () => {
    const navigate = vi.fn();
    render(
      <AuthProvider>
        <Login navigate={navigate} />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Informe e-mail e senha.');
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('Signup (LGPD)', () => {
  it('bloqueia o cadastro sem aceitar os termos', async () => {
    const navigate = vi.fn();
    const { container } = render(
      <AuthProvider>
        <Signup navigate={navigate} />
      </AuthProvider>,
    );
    const [nome, email, senha] = Array.from(container.querySelectorAll('input:not([type=checkbox])'));
    await userEvent.type(nome, 'Maria da Silva');
    await userEvent.type(email, 'maria@email.com');
    await userEvent.type(senha, 'senha12345');
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect((await screen.findByRole('alert')).textContent).toContain('aceitar os termos');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('cadastra quando os termos são aceitos', async () => {
    const navigate = vi.fn();
    const { container } = render(
      <AuthProvider>
        <Signup navigate={navigate} />
      </AuthProvider>,
    );
    const [nome, email, senha] = Array.from(container.querySelectorAll('input:not([type=checkbox])'));
    await userEvent.type(nome, 'Maria da Silva');
    await userEvent.type(email, 'maria@email.com');
    await userEvent.type(senha, 'senha12345');
    await userEvent.click(container.querySelector('input[type=checkbox]')!);
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('home'));
  });
});
