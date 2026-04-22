import { createContext, useContext, useState, ReactNode } from "react";
import api from "../services/api";

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser | false>;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (
    email: string,
    password: string,
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
      return normalizedUser;
    } catch (error) {
      console.error("Falha no login:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    } finally {
      setUser(null);
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
