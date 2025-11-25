import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DashboardAdmin = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-gray-800 text-white p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-6 ">Painel do Admin</h1>
        <nav className="flex-1">
          <Link
            to="/dashboard-admin"
            className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
          >
            Empresas
          </Link>
        </nav>
        <div className="mt-auto">
          <p className="text-sm">Logado como: {user?.name}</p>
          <button
            onClick={logout}
            className="mt-2 text-red-400 hover:text-red-500 text-sm"
          >
            Sair
          </button>
        </div>
      </div>

      <main className="flex-1 p-8 overflow-y-auto text-gray-800">
        <h2 className="text-3xl font-semibold mb-6">
          Dashboard Administrativa
        </h2>
        <p className="text-gray-800">
          Bem-vindo, Super Admin! Use o menu lateral para gerenciar.
        </p>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardAdmin;
