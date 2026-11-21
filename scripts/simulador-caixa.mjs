// Simulador da caixa de remédios: faz EXATAMENTE o papel do ESP32 (mesmas
// funções do banco, mesma janela de horário, mesma fila offline). Plano B da
// apresentação e forma de testar o app sem o hardware.
//
// Uso (na pasta do projeto, com o .env preenchido):
//   node scripts/simulador-caixa.mjs parear 123456   pareia com o código mostrado no app
//   node scripts/simulador-caixa.mjs                 liga a caixa (teclas: 1 2 3 t f o s q)
//   node scripts/simulador-caixa.mjs esquecer        apaga o pareamento deste computador
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import readline from 'node:readline';
import { lerEnv } from './caixa-config.mjs';

const ARQUIVO = '.caixa-simulada.json';
const VERSAO = 'sim-1.3.0';
const DEMO_MS = 5000; // modo demonstração: cada LED de HORA fica aceso 5 s
const ANTES = 30 * 60, NO_HORARIO = 30 * 60, LIMITE = 2 * 60 * 60; // segundos (igual ao banco)
const COMPARTIMENTOS = ['manhã', 'tarde', 'noite'];

const { url, key } = lerEnv();

async function rpc(funcao, corpo) {
  const r = await fetch(`${url}/rest/v1/rpc/${funcao}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key },
    body: JSON.stringify(corpo),
  });
  const texto = await r.text();
  let json = null;
  try { json = JSON.parse(texto); } catch { /* corpo vazio */ }
  if (!r.ok) {
    const e = new Error(json?.message || `HTTP ${r.status}`);
    e.revogada = json?.code === '28000';
    throw e;
  }
  return json;
}

const salvar = (estado) => writeFileSync(ARQUIVO, JSON.stringify(estado, null, 2));
const carregar = () => (existsSync(ARQUIVO) ? JSON.parse(readFileSync(ARQUIVO, 'utf8')) : null);

// ------------------------------------------------------------------ horários
const compartimento = (hhmm) => (hhmm < '12:00' ? 0 : hhmm < '18:00' ? 1 : 2);

/** Data de hoje em São Paulo (+desloc dias) -> { epoch da dose, dia da semana } */
function ocorrencia(hhmm, agoraSeg, desloc) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date((agoraSeg + desloc * 86400) * 1000)); // '2026-11-18'
  const epoch = Date.parse(`${p}T${hhmm}:00-03:00`) / 1000;
  const [y, m, d] = p.split('-').map(Number);
  return { epoch, dia: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

/** Doses abertas agora, por compartimento: [{ lembrete, nome, horario, agendada, dif }] */
function dosesAbertas(agenda, tomadas, agoraSeg) {
  const out = [[], [], []];
  for (const l of agenda?.lembretes ?? []) {
    for (const h of l.horarios) {
      for (const desloc of [-1, 0]) {
        const { epoch, dia } = ocorrencia(h, agoraSeg, desloc);
        if (!l.dias.includes(dia) || tomadas.has(`${l.id}|${epoch}`)) continue;
        const dif = agoraSeg - epoch;
        if (dif < -ANTES || dif >= LIMITE) continue;
        out[compartimento(h)].push({ lembrete: l.id, nome: l.nome, horario: h, agendada: epoch, dif });
      }
    }
  }
  return out;
}

/** 'HH:MM' de um epoch, no fuso de São Paulo */
const horaSP = (epoch) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(epoch * 1000));

/** LED TOMADO: aceso até 2 h depois do horário (mínimo 5 min após o toque); piscando enquanto espera na fila */
function ledTomado(tomadas, fila, c, agoraSeg) {
  const ativas = [...tomadas.entries()].filter(([k, ate]) => ate > agoraSeg && compartimento(horaSP(Number(k.split('|')[1]))) === c);
  if (!ativas.length) return 'apagado';
  return ativas.some(([k]) => fila.some((f) => `${f.lembrete}|${f.agendada}` === k)) ? 'PISCANDO (enviando)' : 'ACESO';
}

const modoLed = (doses) =>
  doses.some((d) => d.dif >= NO_HORARIO) ? 'PISCANDO (atrasada)' : doses.some((d) => d.dif >= 0) ? 'ACESO' : 'apagado';

// ------------------------------------------------------------------ comandos
async function parear(codigo) {
  if (!/^\d{6}$/.test(codigo ?? '')) throw new Error('Informe o código de 6 dígitos: node scripts/simulador-caixa.mjs parear 123456');
  const r = await rpc('parear_caixa', { p_code: codigo, p_name: 'Caixa simulada', p_firmware: VERSAO });
  if (!r.ok) throw new Error(`Pareamento recusado: ${r.erro}`);
  salvar({ deviceId: r.deviceId, token: r.token, fila: [] });
  console.log('✅ Caixa simulada pareada! O app deve mostrar "Caixa pareada". Agora rode: node scripts/simulador-caixa.mjs');
}

async function rodar() {
  const est = carregar();
  if (!est) throw new Error('Caixa não pareada. No app gere o código e rode: node scripts/simulador-caixa.mjs parear 123456');
  const auth = { p_device: est.deviceId, p_token: est.token };

  let agenda = null;
  let tomadas = new Map(); // 'lembrete|agendada' -> até quando o LED TOMADO fica aceso (epoch)
  let offline = false;
  let calor = false;
  let semSensor = false;
  let demoInicio = 0;
  let indiceCiclo = -1;
  const tomadoNoCiclo = [false, false, false];
  let ultimaAgenda = 0, ultimaLeitura = 0;
  const leds = ['', '', ''];
  const ledsTomado = ['', '', ''];
  const ledAte = (agendada, tomada = 0) => Math.max(agendada + LIMITE, tomada ? tomada + 5 * 60 : 0);

  const log = (msg) => console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`);
  const revogada = () => {
    log('⛔ Esta caixa foi despareada no app. Apagando o pareamento local.');
    unlinkSync(ARQUIVO);
    process.exit(0);
  };

  async function buscarAgenda() {
    ultimaAgenda = Date.now();
    agenda = await rpc('caixa_agenda', auth);
    const antes = tomadas;
    tomadas = new Map(agenda.tomadas.map((t) => {
      const k = `${t.lembrete}|${t.agendada}`;
      return [k, antes.get(k) ?? ledAte(t.agendada)];
    }));
    for (const f of est.fila) tomadas.set(`${f.lembrete}|${f.agendada}`, ledAte(f.agendada, f.tomada));
    log(`📅 Agenda: ${agenda.lembretes.map((l) => `${l.nome} ${l.horarios.join('/')}`).join(' · ') || 'nenhum lembrete ativo'}`);
  }

  async function enviarFila() {
    while (est.fila.length && !offline) {
      const f = est.fila[0];
      const r = await rpc('caixa_registrar_dose', { ...auth, p_reminder: f.lembrete, p_scheduled: f.agendada, p_taken: f.tomada });
      log(r.ok ? `☁️  Dose enviada (${r.status}${r.repetida ? ', repetida: ignorada' : ''})` : `☁️  Servidor recusou a dose: ${r.erro}`);
      est.fila.shift();
      salvar(est);
    }
  }

  async function enviarLeitura() {
    ultimaLeitura = Date.now();
    // temperatura e umidade nulas = sensor sem sinal (igual ao ESP32)
    const temp = semSensor ? null : calor ? 32.5 : 24.0, umid = semSensor ? null : calor ? 60 : 55;
    const r = await rpc('caixa_leitura', { ...auth, p_temp: temp, p_umid: umid, p_firmware: VERSAO });
    if (semSensor) return log('🔴 Sensor SEM SINAL enviado ao app (LED vermelho aceso)');
    log(`🌡️  ${temp} °C, ${umid}%${r.alerta ? ' → ALERTA enviado ao app (LED amarelo de temperatura piscando)' : ''}`);
  }

  async function ciclo() {
    const agora = Math.floor(Date.now() / 1000);
    if (!offline) {
      try {
        if (Date.now() - ultimaAgenda > 15_000) await buscarAgenda();
        await enviarFila();
        if (Date.now() - ultimaLeitura > 5 * 60_000) await enviarLeitura();
      } catch (e) {
        if (e.revogada) return revogada();
        log(`⚠️  Falha de rede: ${e.message}`);
      }
    }
    if (agenda?.demo) return cicloDemo();
    if (demoInicio) { demoInicio = 0; leds.fill(''); log('🎬 Modo demonstração desligado: LEDs seguem os lembretes'); }
    const abertas = dosesAbertas(agenda, tomadas, agora);
    abertas.forEach((doses, c) => {
      const modo = modoLed(doses);
      if (modo !== leds[c]) {
        leds[c] = modo;
        const quais = doses.filter((d) => d.dif >= 0).map((d) => `${d.nome} ${d.horario}`).join(', ');
        log(`💡 LED HORA ${COMPARTIMENTOS[c]}: ${modo}${quais ? ` — ${quais}` : ''}`);
      }
      const tomado = ledTomado(tomadas, est.fila, c, agora);
      if (tomado !== ledsTomado[c]) {
        ledsTomado[c] = tomado;
        log(`✅ LED TOMADO ${COMPARTIMENTOS[c]}: ${tomado}`);
      }
    });
  }

  // Modo demonstração (ligado pelo app): manhã -> tarde -> noite, 5 s cada
  function cicloDemo() {
    if (!demoInicio) { demoInicio = Date.now(); indiceCiclo = -1; log('🎬 Modo demonstração LIGADO pelo app'); }
    const i = Math.floor((Date.now() - demoInicio) / DEMO_MS) % 3;
    if (i === indiceCiclo) return;
    if (i === 0) tomadoNoCiclo.fill(false);
    indiceCiclo = i;
    log(`💡 [demo] LED HORA ${COMPARTIMENTOS[i]}: ${tomadoNoCiclo[i] ? 'apagado (já tocado neste ciclo)' : 'ACESO por 5 s'}`);
  }

  function enviarToque(c, agora, dose) {
    if (offline) return;
    rpc('caixa_toque', { ...auth, p_compartimento: c, p_tocado: agora, p_dose: dose, p_demo: !!agenda?.demo })
      .then(() => log(`📲 Toque na ${COMPARTIMENTOS[c]} enviado ao app`))
      .catch((e) => (e.revogada ? revogada() : log(`⚠️  ${e.message}`)));
  }

  function tocar(c) {
    const agora = Math.floor(Date.now() / 1000);
    const doses = dosesAbertas(agenda, tomadas, agora)[c];
    if (agenda?.demo) {
      tomadoNoCiclo[c] = true;
      log(`👆 [demo] ${COMPARTIMENTOS[c]}: LED HORA apagado até o fim do ciclo`);
    }
    enviarToque(c, agora, doses.length > 0);
    if (!doses.length) return log(`👆 Toque na ${COMPARTIMENTOS[c]}: nenhuma dose de lembrete pendente${agenda?.demo ? '' : ' (LED HORA pisca 1 vez)'}`);
    for (const d of doses) {
      est.fila.push({ lembrete: d.lembrete, agendada: d.agendada, tomada: agora });
      tomadas.set(`${d.lembrete}|${d.agendada}`, ledAte(d.agendada, agora));
      log(`👆 ${d.nome} das ${d.horario} TOMADA${offline ? ' — guardada na fila offline' : ''}`);
    }
    salvar(est);
    void ciclo();
  }

  console.log('Caixa simulada ligada. Teclas: [1] manhã  [2] tarde  [3] noite  [t] calor  [f] falha do sensor  [o] offline  [s] status  [q] sair\n');
  await ciclo();
  const timer = setInterval(() => void ciclo(), 2000);

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.on('keypress', (_s, k) => {
    const n = k?.name;
    if (n === 'q' || (k?.ctrl && n === 'c')) { clearInterval(timer); process.exit(0); }
    if (n === '1' || n === '2' || n === '3') tocar(Number(n) - 1);
    if (n === 'o') {
      offline = !offline;
      log(offline ? '📴 OFFLINE (LED de status aceso fixo). Toques vão para a fila.' : `📶 ONLINE de novo: reenviando ${est.fila.length} dose(s)`);
      void ciclo();
    }
    if (n === 'f') {
      semSensor = !semSensor;
      if (!offline) enviarLeitura().catch((e) => (e.revogada ? revogada() : log(`⚠️  ${e.message}`)));
    }
    if (n === 't') {
      calor = !calor;
      if (!offline) enviarLeitura().catch((e) => (e.revogada ? revogada() : log(`⚠️  ${e.message}`)));
    }
    if (n === 's') log(`Status: ${offline ? 'offline' : 'online'} · fila: ${est.fila.length} · HORA: ${leds.join(" / ")} · TOMADO: ${ledsTomado.join(" / ")}`);
  });
}

const [cmd, arg] = process.argv.slice(2);
const acao = cmd === 'parear' ? parear(arg)
  : cmd === 'esquecer' ? Promise.resolve(existsSync(ARQUIVO) && unlinkSync(ARQUIVO)).then(() => console.log('Pareamento local apagado.'))
  : rodar();
acao.catch((e) => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
