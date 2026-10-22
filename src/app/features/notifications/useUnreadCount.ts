import { useEffect, useState } from 'react';
import { notificationRepository } from '../../repositories';
import { bus } from './NotificationBus';

/** Quantidade de notificações não lidas. Atualiza sozinha (Observer) e ao voltar para o app. */
export function useUnreadCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () =>
      notificationRepository
        .countUnread()
        .then((n) => alive && setCount(n))
        .catch(() => alive && setCount(0)); // sem login ou sem rede: não mostra número

    load();
    const off = bus.on('notifications-changed', load);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    const timer = setInterval(load, 60_000);

    return () => {
      alive = false;
      off();
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, []);

  return count;
}
