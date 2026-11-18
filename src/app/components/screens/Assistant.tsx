import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send, Phone, Bot } from 'lucide-react';
import type { Screen, AppState } from '../../App';
import { Header } from '../shared/Header';
import { answer, MAX_MESSAGE_LENGTH } from '../../features/assistant/assistant';
import { DISCLAIMER, STARTERS } from '../../features/assistant/handlers';
import type { AssistantContext, AssistantReply, ReplyAction } from '../../features/assistant/types';
import { healthUnitRepository, medicationRepository } from '../../repositories';

interface AssistantProps {
  navigate: (screen: Screen, data?: Partial<AppState>) => void;
}

type Message = { id: number; from: 'user' } & { text: string } | ({ id: number; from: 'bot' } & AssistantReply);

const ctx: AssistantContext = { medications: medicationRepository, units: healthUnitRepository, now: () => new Date() };

const WELCOME: AssistantReply = {
  source: 'intent',
  text: 'Olá! Sou o assistente do InfoMed. Pergunte sobre remédios, postos, consultas ou lembretes.',
  suggestions: STARTERS,
};

export function Assistant({ navigate }: AssistantProps) {
  // Histórico só em memória: some ao sair da tela e nunca é gravado
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: 'bot', ...WELCOME }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || busy) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [...m, { id: nextId.current++, from: 'user', text: msg }]);
    const reply = await answer(msg, ctx);
    setMessages((m) => [...m, { id: nextId.current++, from: 'bot', ...reply }]);
    setBusy(false);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const act = (a: ReplyAction) => navigate(a.screen, a.data);
  const last = messages[messages.length - 1];

  return (
    <div className="h-full bg-[#F7FAFF] flex flex-col">
      <Header title="Assistente" onBack={() => navigate('home')} showNotification={false} />
      <p className="px-6 pb-2 bg-white text-[11px] text-[#64748B] border-b border-[#E8F1FF]">
        {DISCLAIMER} Em emergência, ligue 192. A conversa não é guardada.
      </p>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
        {messages.map((m) =>
          m.from === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[80%] bg-[#0A73FF] text-white rounded-2xl rounded-br-md px-4 py-2 text-sm whitespace-pre-wrap">{m.text}</p>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2 items-start">
              <div className="w-8 h-8 shrink-0 rounded-full bg-[#0A73FF]/10 flex items-center justify-center" aria-hidden="true">
                <Bot className="w-4 h-4 text-[#0A73FF]" />
              </div>
              <div
                role={m.tone === 'alert' ? 'alert' : undefined}
                className={`max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2 text-sm border ${
                  m.tone === 'alert' ? 'bg-[#FF4D5E]/10 border-[#FF4D5E] text-[#1A2B48]' : 'bg-white border-[#E8F1FF] text-[#1A2B48]'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.actions && m.actions.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3">
                    {m.actions.map((a) =>
                      a.href ? (
                        <a key={a.label} href={a.href} className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#FF4D5E] text-white">
                          <Phone className="w-4 h-4" /> {a.label}
                        </a>
                      ) : (
                        <button key={a.label} onClick={() => act(a)} className="h-10 rounded-xl bg-[#E8F1FF] text-[#0A73FF]">
                          {a.label}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {busy && <p className="text-xs text-[#64748B] pl-10">Digitando...</p>}
        <div ref={endRef} />
      </div>

      {last.from === 'bot' && last.suggestions && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2">
          {last.suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-[#E8F1FF] text-xs text-[#0A73FF]">
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-2 px-4 pt-2 pb-8 bg-white border-t border-[#E8F1FF]">
        <input
          aria-label="Mensagem"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Escreva sua pergunta..."
          autoComplete="off"
          className="flex-1 h-12 px-4 rounded-2xl bg-[#F7FAFF] border border-[#E8F1FF] text-[#1A2B48] text-sm focus:outline-none focus:border-[#0A73FF]"
        />
        <button type="submit" aria-label="Enviar" disabled={!input.trim() || busy} className="w-12 h-12 rounded-2xl bg-[#0A73FF] text-white flex items-center justify-center disabled:opacity-50">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
