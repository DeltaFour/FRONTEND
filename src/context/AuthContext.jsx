import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("Resposta do login:", response.data);
      const { token, user: userData } = response.data;

      if (!token || !userData) {
        console.error(
          "ERRO DE ESTRUTURA: Token ou User ausentes na resposta da API. Verifique a desestruturação!"
        );
        return null;
      }

      localStorage.setItem("authToken", token);
      api.defaults.headers.Authorization = `Bearer ${token}`;

      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Falha no login:", error);
      return false;
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const response = await api.post("/auth/check-session");
          setUser(response.data.user);
        } catch (error) {
          console.error("JWT inválido/expirado. Deslogando.", error);
          localStorage.removeItem("authToken");
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("authToken");
    api.defaults.headers.Authorization = null;
    setUser(null);
  };

  const contextValue = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
