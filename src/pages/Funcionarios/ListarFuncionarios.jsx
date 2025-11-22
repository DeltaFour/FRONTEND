import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { FaEdit, FaPlus, FaLock, FaUnlockAlt, FaUsers } from "react-icons/fa";
import { Link } from "react-router-dom";

const ListarFuncionarios = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/employee");
      const dataToSet = response.data.data || response.data;
      setFuncionarios(dataToSet);
    } catch (err) {
      console.error("Erro ao buscar funcionários:", err.response || err);
      setError(
        "Não foi possível carregar a lista de funcionários. Verifique o acesso à API."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleToggleActivation = async (func) => {
    const currentStatus = func.isActive;
    const newStatus = !currentStatus;
    const action = newStatus ? "ativar" : "desativar";
    const endpoint = newStatus ? "active" : "desactive";

    if (
      !window.confirm(
        `Tem certeza que deseja ${action} o funcionário ${func.name}?`
      )
    ) {
      return;
    }

    try {
      await api.post(`/employee/${func.id}/${endpoint}`);

      alert(`Funcionário ${func.name} ${action}do com sucesso!`);

      setFuncionarios((prev) =>
        prev.map((f) => (f.id === func.id ? { ...f, isActive: newStatus } : f))
      );
    } catch (err) {
      console.error(`Erro ao ${action} funcionário:`, err.response || err);
      alert(`Erro ao ${action} funcionário. Verifique as permissões.`);
    }
  };

  if (loading)
    return (
      <div className="text-center py-8">
        Carregando lista de funcionários...
      </div>
    );
  if (error)
    return <div className="text-red-600 p-4 bg-red-100 rounded">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaUsers className="mr-3 text-indigo-800" /> Funcionários da Empresa
        </h2>
        <Link
          to="/dashboard-empresa/funcionarios/criar"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 shadow-md flex items-center"
        >
          <FaPlus className="mr-2" /> Novo Funcionário
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
                E-mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {funcionarios.map((func) => (
              <tr key={func.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {func.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {func.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        func.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                  >
                    {func.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Botão de Edição */}
                  <Link
                    to={`/dashboard-empresa/funcionarios/editar/${func.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-3 p-1 inline-flex items-center"
                  >
                    <FaEdit className="inline mr-1" /> Editar
                  </Link>

                  {/* Botão de Toggle Ativar/Desativar */}
                  <button
                    onClick={() => handleToggleActivation(func)}
                    className={`p-1 inline-flex items-center ml-2 font-medium transition duration-150 ${
                      func.isActive
                        ? "text-red-600 hover:text-red-800"
                        : "text-green-600 hover:text-green-800"
                    }`}
                  >
                    {func.isActive ? (
                      <>
                        <FaLock className="inline mr-1" /> Desativar
                      </>
                    ) : (
                      <>
                        <FaUnlockAlt className="inline mr-1" /> Ativar
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListarFuncionarios;
