import { useState } from 'react';
import { Screen } from '../../App';
import { Header } from '../shared/Header';
import { useAuth } from '../../features/auth/AuthContext';

interface SignupProps {
  navigate: (screen: Screen, data?: any) => void;
}

export function Signup({ navigate }: SignupProps) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lgpd, setLgpd] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setInfo('');
    if (fullName.trim().length < 3) return setError('Informe seu nome completo.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Informe um e-mail válido.');
    if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.');
    if (!lgpd) return setError('É necessário aceitar os termos para continuar.');

    setBusy(true);
    try {
      const result = await signUp({ fullName, email, password, lgpdConsent: lgpd });
      if (result.needsEmailConfirmation) {
        setInfo('Cadastro realizado! Enviamos um link de confirmação para o seu e-mail.');
      } else {
        navigate('home');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'mt-1 w-full h-[52px] px-4 bg-white border border-[#E8F1FF] rounded-2xl outline-none focus:border-[#0A73FF]';

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Criar conta" onBack={() => navigate('login')} showNotification={false} />

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        <label className="block">
          <span className="text-[#1A2B48] text-sm">Nome completo</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} autoComplete="name" />
        </label>
        <label className="block">
          <span className="text-[#1A2B48] text-sm">E-mail</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
        </label>
        <label className="block">
          <span className="text-[#1A2B48] text-sm">Senha (mínimo 8 caracteres)</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
        </label>

        <label className="flex items-start gap-3 text-sm text-[#64748B]">
          <input type="checkbox" checked={lgpd} onChange={(e) => setLgpd(e.target.checked)} className="mt-1 w-5 h-5" />
          <span>
            Li e aceito o tratamento dos meus dados pessoais e de saúde, conforme a Lei Geral de Proteção de Dados
            (LGPD), para uso das funcionalidades do InfoMed.
          </span>
        </label>

        {error && (
          <p role="alert" className="text-[#FF4D5E] text-sm">
            {error}
          </p>
        )}
        {info && <p className="text-[#27C183] text-sm">{info}</p>}

        <button
          onClick={handleSubmit}
          disabled={busy}
          className="w-full h-[52px] bg-[#0A73FF] text-white rounded-2xl hover:bg-[#005BEA] transition-colors disabled:opacity-60"
        >
          {busy ? 'Criando...' : 'Criar conta'}
        </button>
      </div>
    </div>
  );
}
