import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { Link } from "react-router-dom";

const ListarEmpresas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/super-admin/company");

        setEmpresas(response.data);
      } catch (err) {
        console.error("Erro ao buscar empresas:", err.response || err);
        setError(
          "Não foi possível carregar a lista de empresas. Verifique se o token é válido."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">Carregando dados das empresas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Erro:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Gerenciamento de Empresas
        </h2>
        <Link
          to="/empresas/criar"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 shadow-md"
        >
          + Nova Empresa
        </Link>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome da Empresa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CNPJ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {empresas.map((empresa) => (
              <tr key={empresa.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {empresa.nome || "Nome Indisponível"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {empresa.cnpj || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {empresa.id || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${
                      empresa.status === "Ativo"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {empresa.status === "Ativo" ? (
                      <FaCheckCircle className="mr-1" />
                    ) : (
                      <FaTimesCircle className="mr-1" />
                    )}
                    {empresa.status || "Inativo"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    to={`/empresas/editar/${empresa.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-3 transition duration-150"
                    title="Editar Empresa"
                  >
                    <FaEdit className="inline" />
                  </Link>
                  <button
                    onClick={() =>
                      console.log("Excluir empresa: " + empresa.id)
                    }
                    className="text-red-600 hover:text-red-900 transition duration-150"
                    title="Excluir Empresa"
                  >
                    <FaTrash className="inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {empresas.length === 0 && !loading && !error && (
        <div className="mt-4 p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
          Nenhuma empresa encontrada.
        </div>
      )}
    </div>
  );
};

export default ListarEmpresas;
