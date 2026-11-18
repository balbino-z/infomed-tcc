import { normalize, tokenize } from '../triage/classifier.mjs';
import { CONTACTS, detectAlert } from '../triage/emergency';
import { analyzeSymptoms } from '../triage/triage';
import { isOpenNow } from '../units/unitUtils';
import { DEFAULT_FILTERS } from '../units/filters/types';
import type { AssistantContext, AssistantHandler, AssistantReply, ReplyAction } from './types';
import faqJson from './faq.json';

export const DISCLAIMER = 'Não substitui um profissional de saúde.';
export const STARTERS = ['Onde tem Losartana?', 'Qual UBS está aberta agora?', 'Qual especialista procurar?', 'Como cancelo uma consulta?'];

// ---------- 1. Sinais de alerta (mesmas regras da triagem) ----------
export const alertHandler: AssistantHandler = {
  name: 'alerta',
  async handle(message) {
    const alert = detectAlert(message);
    if (!alert) return null;
    const contacts = CONTACTS[alert.level];
    return {
      source: 'alert',
      tone: 'alert',
      text:
        alert.level === 'life-risk'
          ? 'Sinto muito que você esteja passando por isso. Você não precisa enfrentar sozinho(a): o CVV atende de graça, 24 horas, pelo 188. Se houver risco imediato, ligue 192.'
          : `Isso pode ser uma emergência (${alert.reasons.join(', ')}). Não espere: ligue agora para o SAMU (192) ou procure o pronto-socorro mais próximo.`,
      actions: contacts.map((c) => ({ label: `Ligar ${c.phone} (${c.name})`, screen: 'home', href: `tel:${c.phone}` })),
    };
  },
};

// ---------- 2. Intenções com ações no app (custo zero) ----------
type Intent = { name: string; test: (t: string) => boolean; run: (msg: string, ctx: AssistantContext) => Promise<AssistantReply | null> };

const has = (t: string, re: RegExp) => re.test(t);

const INTENTS: Intent[] = [
  {
    name: 'saudacao',
    test: (t) => has(t, /^(oi|ola|bom dia|boa tarde|boa noite|eai|e ai|hey)\b/) && t.split(' ').length <= 4,
    run: async () => ({
      source: 'intent',
      text: 'Olá! Posso ajudar a achar remédios e postos, agendar consultas, ver lembretes e indicar qual especialista procurar.',
      suggestions: STARTERS,
    }),
  },
  {
    name: 'agradecimento',
    test: (t) => has(t, /\b(obrigad[oa]|valeu|agradeco)\b/) && t.split(' ').length <= 5,
    run: async () => ({ source: 'intent', text: 'Por nada! Se precisar, é só perguntar.' }),
  },
  {
    name: 'medicamento',
    test: (t) => has(t, /\b(onde (tem|acho|encontro|pego|retiro)|tem (o |a )?\w+ (em|no|na|disponivel)|disponivel|disponibilidade|estoque|remedio|medicamento)\b/),
    run: async (msg, ctx) => {
      const t = normalize(msg);
      const meds = await ctx.medications.list();
      const words = new Set(t.split(/[^a-z0-9]+/));
      const med = meds.find((m) => normalize(m.name).split(/\s+/).some((w) => w.length >= 5 && words.has(w)));
      if (!med) {
        // pergunta genérica sobre remédios (receita, estoque...) fica para a FAQ
        if (!/\bonde (tem|acho|encontro|pego|retiro)\b/.test(t)) return null;
        return {
          source: 'intent',
          text: 'Qual medicamento você procura? Você também pode ver o catálogo completo.',
          actions: [{ label: 'Ver medicamentos', screen: 'medications' }],
        };
      }
      const ids = await ctx.units.unitIdsWithMedication(med.id);
      const label = `${med.name} ${med.dosage}`;
      const actions: ReplyAction[] = [{ label: 'Ver detalhes do remédio', screen: 'medication-detail', data: { selectedMedication: med } }];
      if (ids.length > 0) actions.unshift({ label: 'Ver postos com o remédio', screen: 'postos', data: { unitFilters: { ...DEFAULT_FILTERS, medicationId: med.id } } });
      return {
        source: 'intent',
        text:
          ids.length > 0
            ? `${label} aparece como disponível em ${ids.length} ${ids.length === 1 ? 'posto' : 'postos'} (estoque simulado; confirme com a unidade). Lembre-se de levar a receita.`
            : `No momento ${label} não aparece como disponível em nenhum posto (estoque simulado).`,
        actions,
      };
    },
  },
  {
    name: 'aberto-agora',
    test: (t) => has(t, /\b(abert[oa]s?|funcionando|atendendo)\b/) && has(t, /\b(ubs|posto|postos|unidade|unidades|agora|hoje)\b/),
    run: async (_msg, ctx) => {
      const units = await ctx.units.list();
      const open = units.filter((u) => isOpenNow(u, ctx.now()));
      return {
        source: 'intent',
        text:
          open.length > 0
            ? `Agora ${open.length === 1 ? 'há 1 posto aberto' : `há ${open.length} postos abertos`}: ${open.slice(0, 3).map((u) => u.name).join(', ')}${open.length > 3 ? ' e outros' : ''}.`
            : 'Nenhum posto está aberto agora. As UBS atendem de segunda a sexta; veja o horário de cada uma na lista. Em urgência, ligue 192.',
        actions: [{ label: open.length > 0 ? 'Ver postos abertos' : 'Ver postos', screen: 'postos', data: { unitFilters: { ...DEFAULT_FILTERS, openNow: open.length > 0 } } }],
      };
    },
  },
  {
    name: 'cancelar',
    test: (t) => has(t, /\b(cancel\w*|desmarc\w*)\b/),
    run: async () => ({
      source: 'intent',
      text: 'Para cancelar: abra o Histórico, toque na consulta agendada e em "Cancelar consulta". O horário fica livre para outra pessoa.',
      actions: [{ label: 'Abrir histórico', screen: 'history' }],
    }),
  },
  {
    name: 'especialista',
    test: (t) => has(t, /\b(qual (especialista|especialidade|medico)|que (especialista|medico)|estou com|to com|sinto|sentindo|dor|febre|tosse|enjoo|coceira|menstrua\w*|dente)\b/),
    run: async (msg) => {
      if (/\b(qual|que) (especialista|especialidade|medico)\b/.test(normalize(msg)) && msg.trim().split(/\s+/).length <= 5) {
        return {
          source: 'intent',
          text: 'Me conte o que está sentindo (por exemplo: "dor de dente há dois dias") ou use a triagem.',
          actions: [{ label: 'Abrir triagem', screen: 'triage' }],
        };
      }
      const r = analyzeSymptoms(msg);
      if (r.kind !== 'suggestion') return null; // alerta já tratado antes; texto curto segue a corrente
      return {
        source: 'intent',
        text: r.precaution
          ? 'Não ficou claro qual especialista procurar. Por precaução, comece pelo Clínico Geral, que avalia e encaminha se for preciso.'
          : `Pelo que você descreveu, a especialidade mais indicada parece ser ${r.specialty} (compatibilidade ${r.compatibility}). Isto não é diagnóstico.`,
        actions: [
          { label: `Agendar ${r.specialty}`, screen: 'schedule-specialty' },
          { label: 'Abrir triagem', screen: 'triage' },
        ],
      };
    },
  },
  {
    name: 'agendar',
    test: (t) => has(t, /\b(agend\w*|marcar|consulta)\b/),
    run: async () => ({
      source: 'intent',
      text: 'Você escolhe a especialidade, o médico e o horário em 3 passos. As consultas são de segunda a sexta, com pelo menos 2 horas de antecedência.',
      actions: [{ label: 'Agendar consulta', screen: 'schedule-specialty' }],
    }),
  },
  {
    name: 'lembretes',
    test: (t) => has(t, /\b(lembrete\w*|lembrar|horario do remedio|alarme)\b/),
    run: async () => ({
      source: 'intent',
      text: 'Em Lembretes você cadastra o nome do remédio, os horários e os dias da semana. O aviso aparece com o app aberto.',
      actions: [
        { label: 'Meus lembretes', screen: 'reminders' },
        { label: 'Novo lembrete', screen: 'create-reminder' },
      ],
    }),
  },
];

export const intentHandler: AssistantHandler = {
  name: 'intencao',
  async handle(message, ctx) {
    const t = normalize(message).trim();
    for (const intent of INTENTS) {
      if (!intent.test(t)) continue;
      const reply = await intent.run(message, ctx);
      if (reply) return reply;
    }
    return null;
  },
};

// ---------- 3. Perguntas frequentes (busca por similaridade) ----------
interface FaqEntry {
  id: string;
  question: string;
  keywords: string;
  answer: string;
  action?: { label: string; screen: ReplyAction['screen'] };
}
const FAQ = faqJson as FaqEntry[];
const words = (s: string) => new Set(tokenize(s).filter((x) => !x.includes('_')));
const FAQ_INDEX = FAQ.map((f) => ({ entry: f, terms: words(`${f.question} ${f.keywords}`) }));

/** Quanto da pergunta foi coberto pelos termos da FAQ (0 a 1). */
export function faqScore(message: string, terms: Set<string>): number {
  const q = words(message);
  if (q.size === 0) return 0;
  let hit = 0;
  q.forEach((w) => terms.has(w) && hit++);
  return hit / q.size;
}

/**
 * Cria o elo de FAQ. Usado duas vezes na corrente:
 * - antes das intenções, só com correspondência forte (a pergunta é quase igual à da FAQ);
 * - depois delas, com limiar menor, para o que as intenções não pegaram.
 */
export function createFaqHandler(threshold: number, minWords = 1): AssistantHandler {
  return {
    name: `faq(${threshold})`,
    async handle(message) {
      let best: { entry: FaqEntry; score: number } | null = null;
      for (const { entry, terms } of FAQ_INDEX) {
        const score = faqScore(message, terms);
        if (!best || score > best.score) best = { entry, score };
      }
      if (!best || best.score < threshold || words(message).size < minWords) return null;
      return {
        source: 'faq',
        text: best.entry.answer,
        actions: best.entry.action ? [best.entry.action] : undefined,
      };
    },
  };
}

export const strongFaqHandler = createFaqHandler(0.75, 3);
export const faqHandler = createFaqHandler(0.34);

// ---------- 4. Último elo: não entendeu ----------
export const fallbackHandler: AssistantHandler = {
  name: 'fallback',
  async handle() {
    return {
      source: 'fallback',
      text: 'Ainda não sei responder isso. Posso ajudar com remédios, postos, consultas e lembretes. Tente uma destas:',
      suggestions: STARTERS,
    };
  },
};
