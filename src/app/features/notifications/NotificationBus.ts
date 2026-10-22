/**
 * PADRÃO OBSERVER: um "canal de avisos" onde quem tem novidades publica (emit)
 * e quem se interessa assina (on). Quem publica não precisa conhecer quem assina.
 * Ex.: ao agendar uma consulta, o repositório publica "notifications-changed" e
 * o sino do cabeçalho se atualiza sozinho.
 */
export interface DueReminder {
  reminderId: string;
  label: string;
  time: string; // 'HH:MM'
  note: string | null;
}

type Events = {
  'notifications-changed': undefined;
  'reminders-changed': undefined;
  'reminder-due': DueReminder;
};

type Listener<T> = (payload: T) => void;

export class EventBus<E extends Record<string, unknown>> {
  private listeners: { [K in keyof E]?: Set<Listener<E[K]>> } = {};

  /** Assina um evento. Retorna a função para cancelar a assinatura. */
  on<K extends keyof E>(event: K, fn: Listener<E[K]>): () => void {
    (this.listeners[event] ??= new Set()).add(fn);
    return () => this.listeners[event]?.delete(fn);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    this.listeners[event]?.forEach((fn) => fn(payload));
  }
}

export const bus = new EventBus<Events>();
export const emitNotificationsChanged = () => bus.emit('notifications-changed', undefined);
export const emitRemindersChanged = () => bus.emit('reminders-changed', undefined);
