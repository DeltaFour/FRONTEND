import React from "react";
import { useAuth } from "../context/AuthContext";

const DashboardEmpresa = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-blue-50 p-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">
          Dashboard da Empresa
        </h1>
        <div className="text-right">
          <p className="text-sm text-gray-600">
            Logado como: {user?.email} ({user?.role})
          </p>
          <button
            onClick={logout}
            className="mt-1 text-red-500 hover:text-red-600 font-semibold"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p className="text-gray-700">
          Esta é a área do administrador da empresa ou funcionário. Aqui serão
          listados funcionários e realizados os controles de ponto.
        </p>
      </div>
    </div>
  );
};

export default DashboardEmpresa;
