import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password }, { withCredentials: true });
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Falha no login:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    } finally {
      setUser(null);
    }
  };

  const contextValue = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
