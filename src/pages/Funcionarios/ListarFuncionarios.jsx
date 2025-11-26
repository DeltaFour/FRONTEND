import React, { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import {
  FaEdit,
  FaPlus,
  FaUsers,
  FaTrash,
  FaTimes,
  FaSave,
  FaClock,
  FaMobileAlt,
  FaUserShield,
} from "react-icons/fa";

const FormularioFuncionario = ({ employeeData, onClose, onSave, shifts }) => {
  const isEditing = !!employeeData?.id;
  const [formData, setFormData] = useState({
    id: employeeData?.id || "",
    name: employeeData?.name || "",
    email: employeeData?.email || "",
    password: "",
    cellPhone: employeeData?.cellphone || "",
    roleName: employeeData?.roleName || "EMPLOYEE",
    isAllowedBypassCoord: employeeData?.isAllowedBypassCoord || false,
    shiftId: employeeData?.shiftDto?.[0]?.shiftId || "",
    employeeShiftId: employeeData?.shiftDto?.[0]?.id || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

    const employeeShiftArray = [];
    if (formData.shiftId) {
      employeeShiftArray.push({
        id: isEditing
          ? formData.employeeShiftId
          : "00000000-0000-0000-0000-000000000000",
        shiftId: formData.shiftId,
        startDate: new Date().toISOString(),
        endDate: null,
        isActive: true,
      });
    }

    const payload = {
      id: isEditing ? formData.id : undefined,
      name: formData.name,
      cellPhone: formData.cellPhone,
      roleName: formData.roleName,
      isAllowedBypassCoord: formData.isAllowedBypassCoord,
      employeeShift: employeeShiftArray,
    };

    if (!isEditing) {
      payload.email = formData.email;
      payload.password = formData.password;
    }

    onSave(payload, isEditing);
    setSubmitting(false);
  };

  return (
    <div className="p-4 bg-white shadow-2xl rounded-lg h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4 border-b pb-3">
        <h3 className="text-xl font-bold">
          {isEditing ? "Editar Funcionário" : "Novo Funcionário"}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          <FaTimes />
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-gray-700">Nome Completo</span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="border p-2 w-full rounded mt-1"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Telefone</span>
          <input
            type="text"
            name="cellPhone"
            value={formData.cellPhone}
            onChange={handleChange}
            required
            className="border p-2 w-full rounded mt-1"
          />
        </label>

        {!isEditing && (
          <>
            <label className="block">
              <span className="text-gray-700">Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="border p-2 w-full rounded mt-1"
              />
            </label>
            <label className="block">
              <span className="text-gray-700">Senha Inicial</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="border p-2 w-full rounded mt-1"
              />
            </label>
          </>
        )}

        <label className="block">
          <span className="text-gray-700">Perfil</span>
          <select
            name="roleName"
            value={formData.roleName}
            onChange={handleChange}
            required
            className="border p-2 w-full rounded mt-1"
          >
            <option value="EMPLOYEE">Funcionário Padrão</option>
            <option value="COMPANY_ADMIN">Administrador da Empresa</option>
          </select>
        </label>

        <label className="block">
          <span className="text-gray-700 flex items-center">
            <FaClock className="mr-2" /> Turno de Trabalho
          </span>
          <select
            name="shiftId"
            value={formData.shiftId}
            onChange={handleChange}
            required
            className="border p-2 w-full rounded mt-1"
          >
            <option value="">Selecione o Turno</option>

            {shifts &&
              Array.isArray(shifts) &&
              shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.workShiftType}
                </option>
              ))}
          </select>
        </label>

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
            className="ml-2 block text-sm text-gray-700"
          >
            Permitir Bypass de Coordenada
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 flex items-center justify-center ${
            submitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <FaSave className="mr-2" />
          {submitting ? "Salvando..." : "Salvar Dados"}
        </button>
      </form>
    </div>
  );
};

const ListarFuncionarios = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentView, setCurrentView] = useState("list");
  const [editingEmployee, setEditingEmployee] = useState(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get("/user/list");
      setFuncionarios(response.data.data || response.data);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
      setError("Não foi possível carregar a lista de usuários.");
    }
  }, []);

  const fetchShifts = useCallback(async () => {
    try {
      const response = await api.get("/workshift/list");

      const rawData =
        response.data.data ||
        response.data.shifts ||
        response.data.workshifts ||
        response.data;

      if (Array.isArray(rawData)) {
        setShifts(rawData);
      } else {
        const arrayData = rawData.shifts || rawData.items || rawData.workshifts;

        if (Array.isArray(arrayData)) {
          setShifts(arrayData);
        } else {
          console.error("Dados de turnos não são um array:", rawData);
          setShifts([]);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar turnos:", err);
      setError("Não foi possível carregar os turnos de trabalho.");
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchEmployees(), fetchShifts()]);
      setLoading(false);
    };
    loadInitialData();
  }, [fetchEmployees, fetchShifts]);

  const handleDelete = async (funcId, funcName) => {
    if (
      !window.confirm(
        `Tem certeza que deseja EXCLUIR o usuário "${funcName}"? Esta ação é irreversível.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/user/${funcId}`);
      setFuncionarios((prev) => prev.filter((f) => f.id !== funcId));
      alert(`Usuário "${funcName}" excluído com sucesso!`);
    } catch (err) {
      console.error("Erro ao excluir usuário:", err.response || err);
      alert(
        `Erro ao excluir usuário: ${
          err.response?.data?.message || "Erro de API."
        }`
      );
    }
  };

  const handleSaveEmployee = async (payload, isEditing) => {
    const endpoint = "/user";
    const method = isEditing ? api.patch : api.post;

    try {
      await method(endpoint, payload);
      alert(`Funcionário ${isEditing ? "atualizado" : "criado"} com sucesso!`);
      setCurrentView("list");
      fetchEmployees();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" | ")
          : "Erro ao salvar os dados. Detalhes no console.");
      alert(`Erro: ${message}`);
      console.error("Erro ao salvar funcionário:", err.response || err);
    }
  };

  const openCreateForm = () => {
    setCurrentView("create");
    setEditingEmployee(null);
  };

  const openEditForm = (func) => {
    setEditingEmployee({
      ...func,
      shiftId: func.shiftDto?.[0]?.shiftId || "",
      employeeShiftId: func.shiftDto?.[0]?.id || "",
    });
    setCurrentView("edit");
  };

  const closeForm = () => {
    setCurrentView("list");
    setEditingEmployee(null);
  };

  if (loading)
    return (
      <div className="text-center py-8">Carregando dados necessários...</div>
    );
  if (error && currentView === "list")
    return <div className="text-red-600 p-4 bg-red-100 rounded">{error}</div>;

  return (
    <div className="flex h-full gap-6">
      <div
        className={`transition-all duration-300 ${
          currentView === "list" ? "w-full" : "w-2/3"
        }`}
      >
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaUsers className="mr-3 text-indigo-800" /> Gerenciar Usuários
            </h2>
            <button
              onClick={openCreateForm}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 shadow-md flex items-center"
            >
              <FaPlus className="mr-2" /> Novo Usuário
            </button>
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
                    Perfil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Turno
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {func.roleName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                      <FaClock className="mr-2" />
                      {func.shiftDto && func.shiftDto.length > 0
                        ? func.shiftDto[0].workShiftType
                        : "Sem Turno"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          func.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {func.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditForm(func)}
                        className="text-blue-600 hover:text-blue-900 mr-3 p-1 inline-flex items-center"
                      >
                        <FaEdit className="inline mr-1" /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(func.id, func.name)}
                        className="text-red-600 hover:text-red-900 p-1 inline-flex items-center ml-2"
                      >
                        <FaTrash className="inline mr-1" /> Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(currentView === "create" || currentView === "edit") && (
        <div className="w-1/3 transition-all duration-300">
          <FormularioFuncionario
            employeeData={editingEmployee}
            onClose={closeForm}
            onSave={handleSaveEmployee}
            shifts={shifts}
          />
        </div>
      )}
    </div>
  );
};

export default ListarFuncionarios;
