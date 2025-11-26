import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  FaUserPlus,
  FaSave,
  FaArrowLeft,
  FaClock,
  FaIdCard,
  FaMobileAlt,
  FaUserShield,
} from "react-icons/fa";

const CriarFuncionario = () => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    roleName: "",
    email: "",
    password: "",
    cellPhone: "",
    shiftId: "",
    isAllowedBypassCoord: false,
    imageBase64: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await api.get("/workshift");
        setShifts(response.data.data || response.data);
      } catch (err) {
        console.error("Erro ao carregar turnos:", err);
        setError("Não foi possível carregar os turnos de trabalho.");
      }
    };
    fetchShifts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name: formData.name,
      roleName: formData.roleName,
      email: formData.email,
      password: formData.password,
      cellPhone: formData.cellPhone,
      imageBase64: formData.imageBase64,
      isAllowedBypassCoord: formData.isAllowedBypassCoord,
      employeeShift: [
        {
          shiftId: formData.shiftId,
          startDate: new Date().toISOString(),
          isActive: true,
        },
      ],
    };

    try {
      await api.post("/user", payload);
      setSuccess(`Funcionário "${formData.name}" cadastrado com sucesso!`);

      setTimeout(() => {
        navigate("/dashboard-empresa/funcionarios");
      }, 1500);
    } catch (err) {
      console.error("Erro no cadastro do funcionário:", err.response || err);
      const message =
        err.response?.data?.message || err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" | ")
          : "Ocorreu um erro ao cadastrar o funcionário.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (shifts.length === 0 && !error)
    return (
      <div className="text-center py-8">Carregando dados necessários...</div>
    );

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <FaUserPlus className="mr-3 text-green-600" /> Cadastro de Funcionário
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition duration-150"
        >
          <FaArrowLeft className="mr-2" /> Voltar
        </button>
      </div>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Erro:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-700 pt-4 border-t">
          Dados Pessoais e Acesso
        </h3>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Nome Completo
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            E-mail
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Senha Inicial
          </label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>

        <div>
          <label
            htmlFor="cellPhone"
            className="block text-sm font-medium text-gray-700"
          >
            Telefone
          </label>
          <input
            type="text"
            name="cellPhone"
            id="cellPhone"
            value={formData.cellPhone}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>

        <h3 className="text-xl font-semibold text-gray-700 pt-4 border-t mt-6">
          Perfil e Jornada
        </h3>

        <div>
          <label
            htmlFor="roleName"
            className="block text-sm font-medium text-gray-700 flex items-center"
          >
            <FaUserShield className="mr-2" /> Perfil de Acesso
          </label>
          <select
            name="roleName"
            id="roleName"
            value={formData.roleName}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          >
            <option value="">Selecione o Perfil</option>
            <option value="COMPANY_ADMIN">Administrador da Empresa</option>
            <option value="EMPLOYEE">Funcionário Padrão</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="shiftId"
            className="block text-sm font-medium text-gray-700 flex items-center"
          >
            <FaClock className="mr-2" /> Turno de Trabalho
          </label>
          <select
            name="shiftId"
            id="shiftId"
            value={formData.shiftId}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          >
            <option value="">Selecione o Turno</option>
            {shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.workShiftType} ({shift.workShiftStartTime.hour}:
                {shift.workShiftStartTime.minute} -{" "}
                {shift.workShiftEndTime.hour}:{shift.workShiftEndTime.minute})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="isAllowedBypassCoord"
            id="isAllowedBypassCoord"
            checked={formData.isAllowedBypassCoord}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label
            htmlFor="isAllowedBypassCoord"
            className="ml-2 block text-sm text-gray-900"
          >
            Permitir marcação de ponto fora da coordenação (Bypass)
          </label>
        </div>

        <h3 className="text-xl font-semibold text-gray-700 pt-4 border-t mt-6">
          Foto (Opcional)
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Foto Base64 (Opcional)
          </label>
          <input
            type="file"
            disabled
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            A implementação de Base64 será feita após o CRUD básico.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition duration-150 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <FaSave className="mr-2" />
            )}
            {loading ? "Cadastrando..." : "Cadastrar Funcionário"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CriarFuncionario;
