import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { FaBuilding, FaEdit, FaTrash, FaPlus } from "react-icons/fa";

const ListarEmpresas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/super-admin/company");
      setEmpresas(response.data);
    } catch (err) {
      console.error("Erro ao buscar empresas:", err.response || err);
      setError("Não foi possível carregar a lista de empresas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDelete = async (companyId, companyName) => {
    if (
      !window.confirm(
        `Tem certeza que deseja EXCLUIR a empresa "${companyName}"? Esta ação é irreversível.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/super-admin/company/${companyId}`);

      setEmpresas((prev) => prev.filter((empresa) => empresa.id !== companyId));
      alert(`Empresa "${companyName}" excluída com sucesso!`);
    } catch (err) {
      console.error("Erro ao excluir empresa:", err.response || err);
      const message =
        err.response?.data?.message ||
        "Erro ao excluir a empresa. Tente novamente.";
      alert(message);
    }
  };

  if (loading)
    return (
      <div className="text-center py-8">Carregando lista de empresas...</div>
    );
  if (error)
    return <div className="text-red-600 p-4 bg-red-100 rounded">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaBuilding className="mr-3 text-indigo-600" /> Gerenciamento de
          Empresas
        </h2>
        <Link
          to="/dashboard-admin/empresas/criar"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 shadow-md flex items-center"
        >
          <FaPlus className="mr-2" /> Nova Empresa
        </Link>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CNPJ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {empresas.length > 0 ? (
              empresas.map((empresa) => (
                <tr key={empresa.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {empresa.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {empresa.cnpj}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                    {empresa.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/dashboard-admin/empresas/editar/${empresa.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-3 p-1 inline-flex items-center"
                    >
                      <FaEdit className="inline mr-1" /> Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(empresa.id, empresa.name)}
                      className="text-red-600 hover:text-red-900 p-1 inline-flex items-center ml-2"
                    >
                      <FaTrash className="inline mr-1" /> Excluir
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListarEmpresas;
