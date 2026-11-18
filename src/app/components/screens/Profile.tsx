import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Mail, Phone, Calendar, Bell, Lock, HelpCircle, LogOut, ChevronRight, Pencil, X, ShieldCheck, BarChart3 } from 'lucide-react';
import type { Screen, AppState } from '../../App';
import type { UserProfile } from '../../domain/profile';
import { useAuth } from '../../features/auth/AuthContext';
import { appointmentRepository, profileRepository, reminderRepository } from '../../repositories';
import { formatDateBR, formatPhone, validateProfile, type ProfileErrors } from '../../features/profile/profileUtils';
import { isoDateSP } from '../../features/scheduling/dateUtils';
import { Header } from '../shared/Header';
import { BottomNav } from '../shared/BottomNav';

interface ProfileProps {
  navigate: (screen: Screen, data?: Partial<AppState>) => void;
}

type InfoPanel = 'privacy' | 'help' | null;

const inputClass =
  'mt-1 w-full rounded-xl border border-[#D9E6F7] bg-white px-4 py-3 text-[#1A2B48] outline-none focus:border-[#0A73FF] focus:ring-2 focus:ring-[#0A73FF]/10';

export function Profile({ navigate }: ProfileProps) {
  const { user, signOut, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', birthDate: '', phone: '' });
  const [fieldErrors, setFieldErrors] = useState<ProfileErrors>({});
  const [appointmentCount, setAppointmentCount] = useState<number | null>(null);
  const [reminderCount, setReminderCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [panel, setPanel] = useState<InfoPanel>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    profileRepository
      .getMine()
      .then((p) => active && setProfile(p))
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : 'Não foi possível carregar seus dados.'))
      .finally(() => active && setLoading(false));
    // contadores reais (falha neles não impede de ver o perfil)
    appointmentRepository.listMine()
      .then((l) => active && setAppointmentCount(l.filter((a) => a.status === 'agendada' && new Date(a.startsAt) > new Date()).length))
      .catch(() => {});
    reminderRepository.list()
      .then((l) => active && setReminderCount(l.filter((r) => r.active).length))
      .catch(() => {});
    return () => { active = false; };
  }, [user?.id]);

  const beginEditing = () => {
    setForm({ fullName: profile?.fullName || user?.fullName || '', birthDate: profile?.birthDate || '', phone: formatPhone(profile?.phone || '') });
    setFieldErrors({});
    setError('');
    setSuccess('');
    setEditing(true);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = validateProfile(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setError('');
    setSaving(true);
    try {
      const updated = await profileRepository.updateMine(form);
      setProfile(updated);
      setEditing(false);
      setSuccess('Seus dados foram atualizados.');
      await refreshUser();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar os dados.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.fullName || user?.fullName || 'Usuário';
  const set = (field: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Perfil" showNotification={false} />

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-28">
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-[#0A73FF] to-[#005BEA] p-6 text-white">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-semibold" aria-hidden="true">
              {displayName.trim().charAt(0).toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="mb-1 break-words text-lg">{displayName}</h2>
              <p className="break-all text-sm text-white/80">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="mb-1 text-xs text-white/70">Próximas consultas</p>
              <p className="text-xl" data-testid="count-appointments">{appointmentCount ?? '—'}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="mb-1 text-xs text-white/70">Lembretes ativos</p>
              <p className="text-xl" data-testid="count-reminders">{reminderCount ?? '—'}</p>
            </div>
          </div>
        </div>

        {error && !editing && <p role="alert" className="mb-4 rounded-xl bg-[#FF4D5E]/10 p-3 text-sm text-[#C6283A]">{error}</p>}
        {success && <p role="status" className="mb-4 rounded-xl bg-[#27C183]/10 p-3 text-sm text-[#16784B]">{success}</p>}

        <section className="mb-4 rounded-2xl border border-[#E8F1FF] bg-white p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-[#1A2B48]">Informações Pessoais</h3>
            {!editing && !loading && profile && (
              <button onClick={beginEditing} className="flex items-center gap-1 text-sm text-[#0A73FF]" aria-label="Editar informações pessoais">
                <Pencil className="h-4 w-4" /> Editar
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={save} noValidate className="space-y-4">
              <Field label="Nome completo" error={fieldErrors.fullName}>
                <input className={inputClass} value={form.fullName} onChange={(e) => set('fullName')(e.target.value)} autoComplete="name" maxLength={120} />
              </Field>
              <Field label="Telefone (com DDD)" error={fieldErrors.phone}>
                <input className={inputClass} type="tel" inputMode="numeric" value={form.phone} onChange={(e) => set('phone')(formatPhone(e.target.value))} autoComplete="tel" placeholder="(19) 99999-9999" />
              </Field>
              <Field label="Data de nascimento" error={fieldErrors.birthDate}>
                <input className={inputClass} type="date" value={form.birthDate} onChange={(e) => set('birthDate')(e.target.value)} min="1900-01-01" max={isoDateSP(new Date())} />
              </Field>
              <p className="text-xs text-[#64748B]">O e-mail de acesso não pode ser alterado aqui.</p>
              {error && <p role="alert" className="text-sm text-[#C6283A]">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setEditing(false); setError(''); }} className="flex-1 rounded-xl border border-[#D9E6F7] px-4 py-3 text-[#64748B]" disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="flex-1 rounded-xl bg-[#0A73FF] px-4 py-3 text-white disabled:opacity-60" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {loading && <p className="text-sm text-[#64748B]">Carregando dados...</p>}
              <InfoRow icon={<Mail className="mt-0.5 h-5 w-5" />} label="E-mail" value={user?.email || 'Não informado'} />
              <InfoRow icon={<Phone className="mt-0.5 h-5 w-5" />} label="Telefone" value={profile?.phone ? formatPhone(profile.phone) : 'Não informado'} />
              <InfoRow icon={<Calendar className="mt-0.5 h-5 w-5" />} label="Data de nascimento" value={formatDateBR(profile?.birthDate) || 'Não informada'} />
              <InfoRow
                icon={<ShieldCheck className="mt-0.5 h-5 w-5" />}
                label="Termos e privacidade (LGPD)"
                value={profile?.lgpdConsentAt ? `Aceitos em ${formatDateBR(isoDateSP(new Date(profile.lgpdConsentAt)))}` : 'Sem registro de aceite'}
              />
            </div>
          )}
        </section>

        {profile?.isAdmin && (
          <section className="mb-4 overflow-hidden rounded-2xl border border-[#E8F1FF] bg-white">
            <MenuButton icon={<BarChart3 />} label="Painel de BI" hint="Somente administrador" color="#0A73FF" onClick={() => navigate('dashboard')} last />
          </section>
        )}

        <section className="mb-4 overflow-hidden rounded-2xl border border-[#E8F1FF] bg-white">
          <MenuButton icon={<Bell />} label="Notificações" color="#FFCC48" onClick={() => navigate('notifications')} />
          <MenuButton icon={<Lock />} label="Privacidade e Segurança" color="#FF4D5E" onClick={() => setPanel('privacy')} />
          <MenuButton icon={<HelpCircle />} label="Ajuda e Suporte" color="#27C183" onClick={() => setPanel('help')} last />
        </section>

        <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#E8F1FF] bg-white p-4">
          <span className="text-sm text-[#64748B]">Versão do app</span>
          <span className="text-sm text-[#1A2B48]">1.0.0</span>
        </div>

        <button
          onClick={async () => { await signOut(); navigate('login'); }}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#FF4D5E]/10 text-[#FF4D5E] transition-colors hover:bg-[#FF4D5E]/20"
        >
          <LogOut className="h-5 w-5" /> Sair da Conta
        </button>
      </div>

      {panel && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center" role="presentation" onClick={() => setPanel(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="profile-panel-title" className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 id="profile-panel-title" className="text-[#1A2B48]">{panel === 'privacy' ? 'Privacidade e Segurança' : 'Ajuda e Suporte'}</h2>
              <button aria-label="Fechar" onClick={() => setPanel(null)} className="rounded-full p-2 hover:bg-[#F7FAFF]"><X className="h-5 w-5" /></button>
            </div>
            {panel === 'privacy' ? (
              <div className="space-y-3 text-sm leading-6 text-[#64748B]">
                <p>Seus dados pessoais (perfil, consultas, lembretes e notificações) ficam no Supabase e só a sua conta consegue lê-los, por regras de segurança no próprio banco (RLS).</p>
                <p>A triagem e o assistente analisam o texto no seu aparelho; o que você digita não é guardado.</p>
                <p>O painel de indicadores usa somente números agregados, sem identificar pessoas.</p>
                <p>Exclusão da conta e exportação dos dados ainda não estão disponíveis nesta versão.</p>
              </div>
            ) : (
              <div className="space-y-3 text-sm leading-6 text-[#64748B]">
                <p>Use o menu inferior para acessar início, medicamentos, postos, lembretes e perfil. O assistente (botão de conversa) responde dúvidas sobre o app.</p>
                <p>O InfoMed é informativo e não substitui avaliação de um profissional de saúde. Em emergência, ligue 192 (SAMU).</p>
              </div>
            )}
            <button onClick={() => setPanel(null)} className="mt-5 w-full rounded-xl bg-[#0A73FF] px-4 py-3 text-white">Entendi</button>
          </section>
        </div>
      )}
      <BottomNav active="profile" onNavigate={navigate} />
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-[#64748B]">
      {label}
      {children}
      {error && <span role="alert" className="mt-1 block text-xs text-[#C6283A]">{error}</span>}
    </label>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-[#64748B]">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-sm">{label}</p>
        <p className="break-words text-[#1A2B48]">{value}</p>
      </div>
    </div>
  );
}

function MenuButton({ icon, label, hint, color, onClick, last = false }: { icon: ReactNode; label: string; hint?: string; color: string; onClick: () => void; last?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#F7FAFF] ${last ? '' : 'border-b border-[#E8F1FF]'}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15`, color }}>{icon}</span>
      <span className="flex-1">
        <span className="block text-[#1A2B48]">{label}</span>
        {hint && <span className="block text-xs text-[#64748B]">{hint}</span>}
      </span>
      <ChevronRight className="h-5 w-5 text-[#CED6E0]" />
    </button>
  );
}
