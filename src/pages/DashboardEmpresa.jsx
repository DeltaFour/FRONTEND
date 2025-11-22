import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUsers, FaClock, FaSignOutAlt } from "react-icons/fa";

const DashboardEmpresa = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-indigo-800 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-extrabold truncate">
            Empresa | {user?.name || "Dashboard"}
          </h1>
        </div>
        <nav className="flex-1 px-4 py-2">
          <Link
            to="/dashboard-empresa/funcionarios"
            className="flex items-center py-2.5 px-4 rounded-lg transition duration-200 hover:bg-indigo-700 mb-2"
          >
            <FaUsers className="mr-3" /> Gerenciar Funcionários
          </Link>
          <Link
            to="/dashboard-empresa/ponto"
            className="flex items-center py-2.5 px-4 rounded-lg transition duration-200 hover:bg-indigo-700"
          >
            <FaClock className="mr-3" /> Meu Ponto
          </Link>
        </nav>

        <div className="mt-auto p-4 border-t border-indigo-700">
          <p className="text-sm font-semibold mb-2">Perfil: {user?.role}</p>
          <button
            onClick={logout}
            className="flex items-center text-sm text-red-300 hover:text-red-100 transition duration-150"
          >
            <FaSignOutAlt className="mr-2" /> Sair
          </button>
        </div>
      </div>

      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardEmpresa;
