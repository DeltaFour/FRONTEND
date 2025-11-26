import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  FaClock,
  FaCalendarCheck,
  FaUserFriends,
  FaExclamationTriangle,
} from "react-icons/fa";

const PontoParaFuncionario = () => {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: "",
    type: "IN",
    timePunched: new Date().toISOString(),
    shiftType: "Matutino",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get("/user");
      const dataToSet = (response.data.data || response.data).filter(
        (f) => f.roleName !== "COMPANY_ADMIN"
      );
      setFuncionarios(dataToSet);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar funcionários:", err);
      setError("Não foi possível carregar a lista de funcionários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      employeeId: formData.employeeId,
      type: formData.type,
      timePunched: formData.timePunched,
      shiftType: formData.shiftType,
    };

    try {
      await api.post("/user/punch-for-user", payload);

      alert(`Ponto de ${formData.type} registrado com sucesso para o usuário!`);
      navigate("/dashboard-empresa/funcionarios");
    } catch (err) {
      console.error(
        "Erro ao marcar ponto para funcionário:",
        err.response || err
      );
      setError(
        `Erro: ${
          err.response?.data?.message ||
          "Verifique se o usuário e o turno estão corretos."
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-8">
        Carregando lista de funcionários...
      </div>
    );
  if (error && !funcionarios.length)
    return (
      <div className="text-red-600 p-4 bg-red-100 rounded flex items-center">
        <FaExclamationTriangle className="mr-2" /> {error}
      </div>
    );

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center mb-6 border-b pb-3">
        <FaCalendarCheck className="mr-3 text-indigo-600" /> Marcar Ponto
        (Terceiros)
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Erro:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="employeeId"
            className="block text-sm font-medium text-gray-700 flex items-center"
          >
            <FaUserFriends className="mr-2" /> Funcionário a Marcar
          </label>
          <select
            name="employeeId"
            id="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          >
            <option value="">Selecione o Funcionário</option>
            {funcionarios.map((func) => (
              <option key={func.id} value={func.id}>
                {func.name} ({func.email}) - {func.roleName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700 flex items-center"
          >
            <FaClock className="mr-2" /> Tipo de Ponto
          </label>
          <select
            name="type"
            id="type"
            value={formData.type}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          >
            <option value="IN">Entrada (IN)</option>
            <option value="OUT">Saída (OUT)</option>
            <option value="INTERVAL_IN">Início Intervalo</option>
            <option value="INTERVAL_OUT">Fim Intervalo</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="timePunched"
            className="block text-sm font-medium text-gray-700"
          >
            Data e Hora do Ponto
          </label>
          <input
            type="datetime-local"
            name="timePunched"
            id="timePunched"
            value={formData.timePunched.substring(0, 16)}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                timePunched: new Date(e.target.value).toISOString(),
              }))
            }
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
          <p className="mt-1 text-xs text-gray-500">
            Este campo permite corrigir ou lançar pontos retroativos.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting || !formData.employeeId}
            className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 ${
              submitting || !formData.employeeId
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {submitting ? "Registrando..." : "Registrar Ponto"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PontoParaFuncionario;
