import { useCallback, useEffect, useState } from "react";
import {
  fetchRecentNotifications,
  markAllNotificationsRead,
  normalizeNotification,
  NOTIFICATION_EVENT,
  type NotificationItem,
} from "../services/notifications";
import {
  getRealtimeConnection,
  startRealtimeConnection,
} from "../services/realtime";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

interface UseNotificationsResult {
  notifications: NotificationItem[];
  unreadCount: number;
  isConnected: boolean;
  markAllRead: () => Promise<void>;
}

/**
 * Carrega as notificações persistidas (sobrevive a reloads) e escuta novas
 * batidas de ponto em tempo real via SignalR. A conexão é um singleton
 * compartilhado, então o hook apenas registra/desregistra seu handler.
 */
export const useNotifications = (maxItems = 30): UseNotificationsResult => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const upsert = useCallback(
    (incoming: NotificationItem) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) {
          return prev;
        }
        return [incoming, ...prev].slice(0, maxItems);
      });
    },
    [maxItems],
  );

  // Carga inicial a partir do banco (persistência ao recarregar a página).
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchRecentNotifications();
        if (!cancelled) {
          setNotifications(data.slice(0, maxItems));
        }
      } catch {
        // Sem dados persistidos: o card apenas inicia vazio.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [maxItems]);

  // Conexão em tempo real.
  useEffect(() => {
    if (USE_MOCK) {
      return;
    }

    let active = true;
    const conn = getRealtimeConnection();

    const handleNotification = (notification: unknown) => {
      upsert(normalizeNotification(notification as Record<string, unknown>));
    };
    const handleReconnected = () => {
      if (active) setIsConnected(true);
    };
    const handleClosed = () => {
      if (active) setIsConnected(false);
    };

    conn.on(NOTIFICATION_EVENT, handleNotification);
    conn.onreconnected(handleReconnected);
    conn.onclose(handleClosed);

    startRealtimeConnection()
      .then(() => {
        if (active) setIsConnected(true);
      })
      .catch(() => {
        if (active) setIsConnected(false);
      });

    return () => {
      active = false;
      conn.off(NOTIFICATION_EVENT, handleNotification);
    };
  }, [upsert]);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignora falhas de marcação; o estado local permanece.
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { notifications, unreadCount, isConnected, markAllRead };
};
