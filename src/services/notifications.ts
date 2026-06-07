import api from "./api";

export type NotificationSeverity = "Info" | "Success" | "Warning" | "Danger";

export interface NotificationItem {
  id: string;
  type: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  userId?: string | null;
  userName?: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Evento SignalR emitido pelo backend (NotificationService.NotificationEvent). */
export const NOTIFICATION_EVENT = "ReceiveNotification";

type RawNotification = Record<string, unknown>;

const pick = (raw: RawNotification, camel: string, pascal: string): unknown =>
  raw[camel] ?? raw[pascal];

/**
 * Normaliza o payload independente da convenção de nomes (camelCase do REST ou
 * eventual PascalCase do SignalR), garantindo um shape estável no front.
 */
export const normalizeNotification = (raw: RawNotification): NotificationItem => ({
  id: String(pick(raw, "id", "Id") ?? ""),
  type: String(pick(raw, "type", "Type") ?? ""),
  severity: (pick(raw, "severity", "Severity") as NotificationSeverity) ?? "Info",
  title: String(pick(raw, "title", "Title") ?? ""),
  message: String(pick(raw, "message", "Message") ?? ""),
  userId: (pick(raw, "userId", "UserId") as string | null) ?? null,
  userName: (pick(raw, "userName", "UserName") as string | null) ?? null,
  isRead: Boolean(pick(raw, "isRead", "IsRead") ?? false),
  createdAt: String(
    pick(raw, "createdAt", "CreatedAt") ?? new Date().toISOString(),
  ),
});

/** Notificações recentes (últimas 24h) da empresa — usado para repovoar ao recarregar. */
export const fetchRecentNotifications = async (): Promise<NotificationItem[]> => {
  const { data } = await api.get<RawNotification[]>("/notifications");
  return Array.isArray(data) ? data.map(normalizeNotification) : [];
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};
