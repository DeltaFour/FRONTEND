import { createContext, useContext, useState, ReactNode } from "react";
import api from "../services/api";
import { toaster } from "../components/ui/toaster";

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<AuthUser | false>;
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
      toaster.error({
        title: "Falha no login",
        description:
          "Não foi possível autenticar com as credenciais informadas.",
      });
      return false;
    }
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

  const contextValue: AuthContextValue = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
