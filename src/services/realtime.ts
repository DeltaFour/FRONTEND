import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

/**
 * Gerenciador de conexão SignalR (singleton) reutilizável por qualquer feature de
 * tempo real do sistema. Mantém uma única conexão com o hub de notificações e
 * compartilha o mesmo `start()` entre múltiplos consumidores.
 *
 * A autenticação acontece pelo cookie `Jwt` (enviado via `withCredentials`),
 * o mesmo mecanismo usado pelas chamadas REST.
 */
const BASE_URL = import.meta.env.VITE_BASE_URL_API || "";
const HUB_URL = `${BASE_URL}/hubs/notifications`;

let connection: HubConnection | null = null;
let startPromise: Promise<void> | null = null;

const buildConnection = (): HubConnection =>
  new HubConnectionBuilder()
    .withUrl(HUB_URL, { withCredentials: true })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

export const getRealtimeConnection = (): HubConnection => {
  if (!connection) {
    connection = buildConnection();
  }
  return connection;
};

/**
 * Inicia (ou reutiliza) a conexão. Chamadas concorrentes compartilham a mesma
 * promise para evitar múltiplos `start()` simultâneos.
 */
export const startRealtimeConnection = async (): Promise<HubConnection> => {
  const conn = getRealtimeConnection();

  if (conn.state === HubConnectionState.Connected) {
    return conn;
  }

  if (!startPromise) {
    startPromise = conn.start().finally(() => {
      startPromise = null;
    });
  }

  await startPromise;
  return conn;
};

export const stopRealtimeConnection = async (): Promise<void> => {
  if (!connection) {
    return;
  }

  const conn = connection;
  connection = null;
  startPromise = null;
  await conn.stop();
};
