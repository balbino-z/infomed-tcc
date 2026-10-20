import { useState } from 'react';
import { Pill } from 'lucide-react';
import { Screen } from '../../App';
import { useAuth } from '../../features/auth/AuthContext';

interface LoginProps {
  navigate: (screen: Screen, data?: any) => void;
}

export function Login({ navigate }: LoginProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      navigate('home');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col px-8 pt-20 pb-10 overflow-y-auto">
      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 bg-[#0A73FF] rounded-3xl flex items-center justify-center mb-5">
          <Pill className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-[#1A2B48] mb-2">Entrar</h2>
        <p className="text-[#64748B] text-center">Acesse sua conta InfoMed</p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-[#1A2B48] text-sm">E-mail</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full h-[52px] px-4 bg-white border border-[#E8F1FF] rounded-2xl outline-none focus:border-[#0A73FF]"
            placeholder="seu@email.com"
          />
        </label>
        <label className="block">
          <span className="text-[#1A2B48] text-sm">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="mt-1 w-full h-[52px] px-4 bg-white border border-[#E8F1FF] rounded-2xl outline-none focus:border-[#0A73FF]"
            placeholder="Sua senha"
          />
        </label>

        {error && (
          <p role="alert" className="text-[#FF4D5E] text-sm">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={busy}
          className="w-full h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors disabled:opacity-60"
        >
          {busy ? 'Entrando...' : 'Entrar'}
        </button>
      </div>

      <p className="text-center text-[#64748B] mt-8">
        Ainda não tem conta?{' '}
        <button onClick={() => navigate('signup')} className="text-[#0A73FF]">
          Cadastre-se
        </button>
      </p>
    </div>
  );
}
