import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.post("/auth/refresh-token");

        if (response.data && Object.keys(response.data).length > 0) {
          setUser(response.data);
          localStorage.setItem("userData", JSON.stringify(response.data));
        } else if (response.status === 200 || response.status === 204) {
          const savedUser = localStorage.getItem("userData");
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem("userData");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
        rememberMe,
      });
      setUser(response.data);

      if (rememberMe && response.data) {
        localStorage.setItem("userData", JSON.stringify(response.data));
      } else {
        localStorage.removeItem("userData");
      }

      return response.data;
    } catch (error) {
      console.error("Falha no login:", error);
      return null;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    } finally {
      localStorage.removeItem("userData");
      setUser(null);
    }
  };

  const contextValue = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Carregando Sessão...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
