import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import api from "../services/api";
import { toaster } from "../components/ui/toaster";

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role: string;
  [key: string]: unknown;
}

interface RegisterCompanyPayload {
  companyName: string;
  cnpj: string;
  email: string;
  name: string;
  password: string;
  cpf: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<AuthUser | false>;
  registerCompany: (payload: RegisterCompanyPayload) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_STORAGE_KEY = "deltafour.auth.user";
const AUTH_STORAGE_MODE_KEY = "deltafour.auth.mode";

const readStoredUser = (): AuthUser | null => {
  const mode = localStorage.getItem(AUTH_STORAGE_MODE_KEY);
  const storage = mode === "local" ? localStorage : sessionStorage;
  const storedUser = storage.getItem(AUTH_STORAGE_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_MODE_KEY);
    return null;
  }
};

const persistUser = (user: AuthUser, rememberMe?: boolean) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_STORAGE_MODE_KEY, rememberMe ? "local" : "session");
};

const clearStoredUser = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_MODE_KEY);
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const refreshIntervalRef = useRef<number | null>(null);
  const refreshInFlightRef = useRef(false);

  const login = async (
    email: string,
    password: string,
    rememberMe?: boolean,
  ): Promise<AuthUser | false> => {
    try {
      const response = await api.post<AuthUser>(
        "/auth/login",
        { email, password },
        { withCredentials: true },
      );

      const rawUser = response.data;
      const normalizedRole = (rawUser.role || "")
        .toString()
        .split(".")
        .pop()
        ?.toUpperCase();

      const normalizedUser: AuthUser = {
        ...rawUser,
        role: normalizedRole || rawUser.role,
      };

      setUser(normalizedUser);
      persistUser(normalizedUser, rememberMe);
      return normalizedUser;
    } catch (error) {
      throw error;
    }
  };

  const registerCompany = async (
    payload: RegisterCompanyPayload,
  ): Promise<void> => {
    await api.post("/subscription/register", {
      name: payload.companyName,
      cnpj: payload.cnpj,
      cpf: payload.cpf,
      user: {
        email: payload.email,
        name: payload.name,
        password: payload.password,
        cpf: payload.cpf,
      },
    });
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      toaster.error({
        title: "Falha ao sair",
        description: "Não foi possível finalizar a sessão corretamente.",
      });
    } finally {
      setUser(null);
      clearStoredUser();
    }
  };

  const refreshSession = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;

    try {
      await api.post("/auth/refresh-token", {}, { withCredentials: true });
    } catch (error: unknown) {
      const status =
        (error as { response?: { status?: number } })?.response?.status ?? 0;
      if (status === 401 || status === 403) {
        setUser(null);
        clearStoredUser();
      }
    } finally {
      refreshInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      if (refreshIntervalRef.current) {
        window.clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    void refreshSession();
    refreshIntervalRef.current = window.setInterval(() => {
      void refreshSession();
    }, 120000);

    return () => {
      if (refreshIntervalRef.current) {
        window.clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [refreshSession, user]);

  const contextValue: AuthContextValue = {
    user,
    login,
    registerCompany,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
