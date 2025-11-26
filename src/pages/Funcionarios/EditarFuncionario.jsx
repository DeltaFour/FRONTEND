import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  FaEdit,
  FaSave,
  FaArrowLeft,
  FaClock,
  FaMobileAlt,
  FaUserShield,
} from "react-icons/fa";

const EditarFuncionario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    cellPhone: "",
    roleName: "",
    shiftId: "",
    employeeShiftId: "",
    isAllowedBypassCoord: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchRequiredData = async () => {
      try {
        setLoading(true);
        setError(null);

        const shiftsResponse = await api.get("/workshift");
        const shiftsData = shiftsResponse.data.data || shiftsResponse.data;
        setShifts(shiftsData);

        const employeeResponse = await api.get(`/user/${id}`);
        const employee = employeeResponse.data;

        const currentShift =
          employee.shiftDto?.length > 0 ? employee.shiftDto[0] : {};

        setFormData({
          id: employee.id,
          name: employee.name || "",
          cellPhone: employee.cellphone || "",
          roleName: employee.roleName || "",
          isAllowedBypassCoord: employee.isAllowedBypassCoord || false,
          shiftId: currentShift.id || "",
          employeeShiftId: currentShift.id || "",
        });
      } catch (err) {
        console.error("Erro ao buscar dados:", err.response || err);
        setError(
          "Não foi possível carregar os dados do funcionário ou os turnos."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchRequiredData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const employeeShiftArray = [
      {
        id: formData.employeeShiftId,
        shiftId: formData.shiftId,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        isActive: true,
      },
    ];

    const payload = {
      id: formData.id,
      name: formData.name,
      cellPhone: formData.cellPhone,
      isAllowedBypassCoord: formData.isAllowedBypassCoord,
      employeeShift: employeeShiftArray,
    };

    try {
      await api.patch("/user", payload);

      setSuccess(`Funcionário "${formData.name}" atualizado com sucesso!`);

      setTimeout(() => {
        navigate("/dashboard-empresa/funcionarios");
      }, 1500);
    } catch (err) {
      console.error("Erro na atualização:", err.response || err);
      const message =
        err.response?.data?.message || err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" | ")
          : "Ocorreu um erro ao atualizar o funcionário.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <div className="text-center py-8">Carregando dados...</div>;
  if (error && !submitting)
    return (
      <div className="text-red-600 p-4 bg-red-100 rounded max-w-2xl mx-auto">
        {error}
      </div>
    );

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <FaEdit className="mr-3 text-indigo-600" /> Editar Funcionário
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
      {error && submitting && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Erro:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-700 pt-4 border-t">
          Dados Pessoais
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
          <input
            type="text"
            name="roleName"
            id="roleName"
            value={formData.roleName}
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-gray-100 cursor-not-allowed"
          />
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

        <div className="flex items-center pt-4">
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

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting}
            className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 ${
              submitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {submitting ? (
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
            {submitting ? "Atualizando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarFuncionario;
