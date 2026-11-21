import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, CheckCircle2, Droplets, Hand, Package, Thermometer, Wifi, WifiOff } from 'lucide-react';
import type { Screen, AppState } from '../../App';
import {
  HUMIDITY_MAX, HUMIDITY_MIN, humidityStatus, isOnline, TEMP_MAX, TEMP_MIN, tempStatus,
  type Device, type DeviceReading, type DeviceTouch, type PairingCode, type RangeStatus,
} from '../../domain/device';
import { PERIOD_LABEL } from '../../domain/adherence';
import { deviceRepository } from '../../repositories';
import { formatTimeSP, timeAgo } from '../../features/scheduling/dateUtils';
import { Header } from '../shared/Header';

interface MedicineBoxProps {
  navigate: (screen: Screen, data?: Partial<AppState>) => void;
}

const fmt = (n: number | null, unit: string) => (n === null ? '—' : `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${unit}`);

/** Perfil → Minha caixa de remédios: parear, ver status e sensor, desparear. */
export function MedicineBox({ navigate }: MedicineBoxProps) {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [pairing, setPairing] = useState<PairingCode | null>(null);
  const [paired, setPaired] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const knownIds = useRef<Set<string>>(new Set());

  const load = async () => {
    try {
      const list = await deviceRepository.listMine();
      setDevices(list);
      return list;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar a caixa.');
      return null;
    }
  };

  useEffect(() => {
    void load();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Enquanto o código está na tela, confere a cada 3 s se a caixa já se pareou.
  useEffect(() => {
    if (!pairing) return;
    const t = setInterval(async () => {
      const list = await load();
      if (list?.some((d) => !knownIds.current.has(d.id))) {
        setPairing(null);
        setPaired(true);
      }
    }, 3000);
    return () => clearInterval(t);
  }, [pairing]);

  // Status, sensor e modo demo atualizam sozinhos (a caixa fala com o servidor a cada 15 s)
  useEffect(() => {
    if (pairing) return;
    const t = setInterval(() => void load(), 10_000);
    return () => clearInterval(t);
  }, [pairing]);

  const startPairing = async () => {
    setError('');
    setPaired(false);
    setBusy(true);
    try {
      knownIds.current = new Set((devices ?? []).map((d) => d.id));
      setPairing(await deviceRepository.startPairing());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível gerar o código.');
    } finally {
      setBusy(false);
    }
  };

  const unpair = async (id: string) => {
    setError('');
    try {
      await deviceRepository.unpair(id);
      setPaired(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível desparear.');
    }
  };

  const secondsLeft = pairing ? Math.max(0, Math.floor((new Date(pairing.expiresAt).getTime() - now.getTime()) / 1000)) : 0;
  const expired = pairing !== null && secondsLeft === 0;

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Minha caixa de remédios" onBack={() => navigate('profile')} showNotification={false} />

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-10">
        {error && <p role="alert" className="mb-4 rounded-xl bg-[#FF4D5E]/10 p-3 text-sm text-[#C6283A]">{error}</p>}
        {paired && (
          <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-[#27C183]/10 p-3 text-sm text-[#16784B]">
            <CheckCircle2 className="h-5 w-5" /> Caixa pareada ✅
          </p>
        )}
        {devices === null && !error && <p className="text-[#64748B]">Carregando...</p>}

        {devices?.map((d) => <DeviceCard key={d.id} device={d} now={now} onUnpair={() => unpair(d.id)} onChanged={() => void load()} />)}

        {pairing && !expired && (
          <section className="mb-4 rounded-2xl border border-[#E8F1FF] bg-white p-6" aria-label="Código de pareamento">
            <p className="text-sm text-[#64748B] mb-2">Código para digitar na caixa</p>
            <p className="text-4xl tracking-[0.3em] text-[#1A2B48] font-semibold mb-1" data-testid="pairing-code">{pairing.code}</p>
            <p className="text-xs text-[#64748B] mb-4">
              Expira em {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} · vale uma vez
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-[#1A2B48]">
              <li>Ligue a caixa. A luz azul da placa pisca rápido.</li>
              <li>No celular, entre na rede Wi-Fi <b>InfoMed-Caixa</b>.</li>
              <li>A página da caixa abre sozinha (se não abrir, acesse <b>192.168.4.1</b>).</li>
              <li>Escolha o Wi-Fi da sua casa, digite a senha dele e este código.</li>
              <li>Volte para cá: em até 1 minuto aparece “Caixa pareada ✅”.</li>
            </ol>
            <p className="mt-4 text-xs text-[#64748B]">A senha da sua conta InfoMed nunca passa pela caixa.</p>
            <button onClick={() => setPairing(null)} className="mt-4 w-full rounded-xl border border-[#D9E6F7] px-4 py-3 text-[#64748B]">Cancelar</button>
          </section>
        )}

        {expired && <p className="mb-4 rounded-xl bg-[#FFCC48]/20 p-3 text-sm text-[#1A2B48]">O código expirou. Gere outro.</p>}

        {(!pairing || expired) && (
          <button onClick={startPairing} disabled={busy} className="mb-4 w-full rounded-2xl bg-[#0A73FF] px-4 py-4 text-white disabled:opacity-60">
            {busy ? 'Gerando código...' : devices && devices.length > 0 ? 'Parear outra caixa' : 'Parear caixa'}
          </button>
        )}

        {devices && devices.length === 0 && !pairing && (
          <div className="rounded-2xl border border-[#E8F1FF] bg-white p-6 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-[#CED6E0]" />
            <p className="text-[#1A2B48] mb-1">Nenhuma caixa pareada</p>
            <p className="text-sm text-[#64748B]">
              Na hora do remédio, o compartimento certo acende. Tocou, a dose fica registrada aqui. Sem a caixa, use o botão “Tomei” nos lembretes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_TEXT: Record<RangeStatus, string> = { baixa: 'baixa', ok: 'ok', alta: 'alta' };

function DeviceCard({ device: d, now, onUnpair, onChanged }: { device: Device; now: Date; onUnpair: () => void; onChanged: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [readings, setReadings] = useState<DeviceReading[]>([]);
  const [touches, setTouches] = useState<DeviceTouch[]>([]);
  const [freshTouch, setFreshTouch] = useState<DeviceTouch | null>(null);
  const [demo, setDemo] = useState(d.demoMode);
  const [savingDemo, setSavingDemo] = useState(false);
  const [demoError, setDemoError] = useState('');
  const lastTouch = useRef<string | null>(null);
  const online = isOnline(d, now);
  const temp = tempStatus(d);
  const hum = humidityStatus(d);
  const sensorFailed = d.sensorOk === false;

  useEffect(() => {
    if (!savingDemo) setDemo(d.demoMode);
  }, [d.demoMode, savingDemo]);

  useEffect(() => {
    deviceRepository.readings(d.id, 24).then(setReadings).catch(() => setReadings([]));
  }, [d.id, d.lastSeenAt]);

  // Toques no alumínio: confere a cada 5 s e destaca o mais novo por 10 s
  useEffect(() => {
    let active = true;
    let clear: ReturnType<typeof setTimeout> | undefined;
    const load = () =>
      deviceRepository
        .touches(d.id, 6)
        .then((list) => {
          if (!active) return;
          setTouches(list);
          const newest = list[0];
          if (newest && lastTouch.current !== null && newest.touchedAt !== lastTouch.current) {
            setFreshTouch(newest);
            clearTimeout(clear);
            clear = setTimeout(() => setFreshTouch(null), 10_000);
          }
          lastTouch.current = newest?.touchedAt ?? '';
        })
        .catch(() => {});
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => { active = false; clearInterval(t); clearTimeout(clear); };
  }, [d.id]);

  const toggleDemo = async () => {
    const next = !demo;
    setDemo(next);
    setSavingDemo(true);
    setDemoError('');
    try {
      await deviceRepository.setDemoMode(d.id, next);
      onChanged();
    } catch (e) {
      setDemo(!next);
      setDemoError(e instanceof Error ? e.message : 'Não foi possível mudar o modo demonstração.');
    } finally {
      setSavingDemo(false);
    }
  };

  return (
    <section className="mb-4 rounded-2xl border border-[#E8F1FF] bg-white p-5" aria-label={d.name}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[#1A2B48] break-words">{d.name}</h3>
          <p className={`flex items-center gap-1 text-sm ${online ? 'text-[#16784B]' : 'text-[#64748B]'}`}>
            {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {online
              ? `Online · visto ${timeAgo(d.lastSeenAt!, now).toLowerCase()}`
              : d.lastSeenAt ? `Offline desde ${formatTimeSP(d.lastSeenAt)} (${timeAgo(d.lastSeenAt, now).toLowerCase()})` : 'Ainda não se conectou'}
          </p>
        </div>
        {d.firmware && <span className="shrink-0 text-xs text-[#64748B]">v{d.firmware}</span>}
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#F7FAFF] p-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#1A2B48]">Modo demonstração</p>
          <p className="text-xs text-[#64748B]">
            {demo
              ? 'Luzes de horário em ciclo: manhã, tarde e noite, 5 s cada. Tocar apaga a luz até o fim do ciclo.'
              : 'Luzes de horário acendem na hora dos lembretes.'}{' '}
            A caixa muda em até 15 s.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={demo}
          aria-label="Modo demonstração"
          disabled={savingDemo}
          onClick={toggleDemo}
          className={`h-7 w-12 shrink-0 rounded-full text-left transition-all disabled:opacity-60 ${demo ? 'bg-[#0A73FF]' : 'bg-[#CED6E0]'}`}
        >
          <div className={`h-5 w-5 rounded-full bg-white transition-all ${demo ? 'ml-6' : 'ml-1'}`} />
        </button>
      </div>
      {demoError && <p role="alert" className="mb-3 text-sm text-[#C6283A]">{demoError}</p>}

      <p className={`mb-3 flex items-center gap-1 text-sm ${sensorFailed ? 'text-[#C6283A]' : 'text-[#64748B]'}`} data-testid="sensor-status">
        <Activity className="h-4 w-4" />
        {sensorFailed ? 'Sensor sem sinal' : d.sensorOk ? 'Sensor funcionando' : 'Sensor: aguardando a primeira leitura'}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Tile icon={<Thermometer className="h-4 w-4" />} label="Temperatura" value={fmt(d.temp, ' °C')} status={temp} />
        <Tile icon={<Droplets className="h-4 w-4" />} label="Umidade" value={fmt(d.humidity, '%')} status={hum} />
      </div>
      {sensorFailed && (
        <p role="alert" className="mb-3 rounded-xl bg-[#FF4D5E]/10 p-3 text-sm text-[#C6283A]">
          🔴 A caixa não está conseguindo medir a temperatura e a umidade. Confira o sensor.
        </p>
      )}
      {!sensorFailed && (temp === 'alta' || temp === 'baixa' || hum === 'alta' || hum === 'baixa') && (
        <p role="alert" className="mb-3 rounded-xl bg-[#FF4D5E]/10 p-3 text-sm text-[#C6283A]">
          {temp !== 'ok' && temp !== null && `🌡️ Temperatura ${STATUS_TEXT[temp]} (${fmt(d.temp, ' °C')}). `}
          {hum !== 'ok' && hum !== null && `💧 Umidade ${STATUS_TEXT[hum]} (${fmt(d.humidity, '%')}). `}
          Guarde os remédios entre {TEMP_MIN} e {TEMP_MAX} °C, com umidade entre {HUMIDITY_MIN}% e {HUMIDITY_MAX}%.
        </p>
      )}
      {readings.length > 1 && <Sparkline readings={readings} />}

      <div className="mt-4" aria-label="Toques na caixa">
        <p className="mb-2 flex items-center gap-1 text-sm text-[#1A2B48]"><Hand className="h-4 w-4" /> Toques nos compartimentos</p>
        <p aria-live="polite" className={freshTouch ? 'mb-2 rounded-xl bg-[#0A73FF] px-3 py-2 text-sm text-white' : 'sr-only'}>
          {freshTouch && `👆 Toque agora: ${PERIOD_LABEL[freshTouch.compartment]}${freshTouch.dose ? ' · dose registrada ✅' : ''}`}
        </p>
        {touches.length === 0 ? (
          <p className="text-xs text-[#64748B]">Nenhum toque ainda. Encoste no alumínio de um compartimento.</p>
        ) : (
          <ul className="space-y-1">
            {touches.map((t) => (
              <li key={t.touchedAt + t.compartment} className="flex items-center justify-between text-sm" data-testid="touch">
                <span className="text-[#1A2B48]">👆 {PERIOD_LABEL[t.compartment]}</span>
                <span className="text-xs text-[#64748B]">
                  {formatTimeSP(t.touchedAt)}
                  {t.dose ? ' · dose registrada' : t.demo ? ' · demonstração' : ' · sem dose pendente'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirming ? (
        <div className="mt-4 rounded-xl bg-[#F7FAFF] p-3">
          <p className="mb-3 text-sm text-[#1A2B48]">Desparear? A caixa para de registrar doses até ser pareada de novo.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)} className="flex-1 rounded-xl border border-[#D9E6F7] px-3 py-2 text-[#64748B]">Cancelar</button>
            <button onClick={onUnpair} className="flex-1 rounded-xl bg-[#FF4D5E] px-3 py-2 text-white">Desparear</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="mt-4 w-full rounded-xl bg-[#FF4D5E]/10 px-4 py-3 text-sm text-[#FF4D5E]">
          Desparear caixa
        </button>
      )}
    </section>
  );
}

function Tile({ icon, label, value, status }: { icon: ReactNode; label: string; value: string; status: RangeStatus | null }) {
  const warn = status === 'alta' || status === 'baixa';
  return (
    <div className={`rounded-xl p-3 ${warn ? 'bg-[#FF4D5E]/10' : 'bg-[#F7FAFF]'}`}>
      <p className={`mb-1 flex items-center gap-1 text-xs ${warn ? 'text-[#C6283A]' : 'text-[#64748B]'}`}>{icon} {label}</p>
      <p className={`text-xl ${warn ? 'text-[#C6283A]' : 'text-[#1A2B48]'}`}>{value}</p>
      {warn && <p className="text-xs text-[#C6283A]">{status === 'alta' ? 'alta demais' : 'baixa demais'}</p>}
    </div>
  );
}

/** Temperatura das últimas 24 h (SVG simples, sem biblioteca), com as linhas dos limites de 15 e 30 °C. */
function Sparkline({ readings }: { readings: DeviceReading[] }) {
  const pts = readings.filter((r) => r.temp !== null) as (DeviceReading & { temp: number })[];
  if (pts.length < 2) return null;
  const W = 280, H = 60;
  const temps = pts.map((p) => p.temp);
  const min = Math.min(...temps, TEMP_MIN - 1);
  const max = Math.max(...temps, TEMP_MAX + 1);
  const t0 = new Date(pts[0].measuredAt).getTime();
  const span = Math.max(1, new Date(pts[pts.length - 1].measuredAt).getTime() - t0);
  const x = (iso: string) => ((new Date(iso).getTime() - t0) / span) * W;
  const y = (t: number) => H - ((t - min) / (max - min)) * H;
  const line = pts.map((p) => `${x(p.measuredAt).toFixed(1)},${y(p.temp).toFixed(1)}`).join(' ');
  return (
    <figure className="mt-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full" role="img" aria-label="Temperatura nas últimas 24 horas">
        <line x1="0" x2={W} y1={y(TEMP_MAX)} y2={y(TEMP_MAX)} stroke="#FF4D5E" strokeDasharray="4 4" strokeWidth="1" />
        <line x1="0" x2={W} y1={y(TEMP_MIN)} y2={y(TEMP_MIN)} stroke="#0A73FF" strokeDasharray="4 4" strokeWidth="1" opacity="0.5" />
        <polyline points={line} fill="none" stroke="#0A73FF" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <figcaption className="text-[11px] text-[#64748B]">Temperatura nas últimas 24 h (tracejados = faixa boa, {TEMP_MIN} a {TEMP_MAX} °C)</figcaption>
    </figure>
  );
}
