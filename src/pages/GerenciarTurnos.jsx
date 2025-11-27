import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import {
  FaClock,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
} from "react-icons/fa";

const initialShiftData = {
  id: null,
  workShiftType: "",
  startTime: "08:00:00",
  endTime: "17:00:00",
  workShiftToleranceMinutes: 15,
};

const GerenciarTurnos = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialShiftData);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("workshift/list");
      const formattedShifts = (response.data.data || response.data).map(
        (shift) => ({
          id: shift.id,
          workShiftType: shift.shiftType,
          startTime: shift.startTime.slice(0, 8),
          endTime: shift.endTime.slice(0, 8),
          workShiftToleranceMinutes: shift.toleranceMinutes,
        })
      );
      setShifts(formattedShifts);
    } catch {
      setError("Não foi possível carregar a lista de turnos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = (shift = null) => {
    if (shift) {
      setIsEditing(true);
      setFormData({
        id: shift.id,
        workShiftType: shift.workShiftType,
        startTime: shift.startTime,
        endTime: shift.endTime,
        workShiftToleranceMinutes: shift.workShiftToleranceMinutes,
      });
    } else {
      setIsEditing(false);
      setFormData(initialShiftData);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialShiftData);
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      shiftType: formData.workShiftType,
      startTime: formData.startTime.includes(":")
        ? formData.startTime
        : formData.startTime + ":00",
      endTime: formData.endTime.includes(":")
        ? formData.endTime
        : formData.endTime + ":00",
      toleranceMinutes: Number(formData.workShiftToleranceMinutes),
    };

    if (isEditing) {
      payload.id = formData.id;
    }

    const endpoint = isEditing ? "/workshift/update" : "/workshift/create";
    const method = isEditing ? api.patch : api.post;

    try {
      await method(endpoint, payload);
      alert(`Turno ${isEditing ? "atualizado" : "criado"} com sucesso!`);
      closeModal();
      fetchShifts();
    } catch (err) {
      setError(
        `Erro ao salvar: ${
          err.response?.data?.message || "Verifique os dados informados."
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (shiftId, shiftType) => {
    if (
      !window.confirm(`Tem certeza que deseja EXCLUIR o turno "${shiftType}"?`)
    )
      return;
    try {
      await api.delete(`/workshift/change-status/${shiftId}`);
      alert(`Turno "${shiftType}" excluído com sucesso!`);
      fetchShifts();
    } catch {
      alert("Erro ao excluir turno.");
    }
  };

  if (loading)
    return (
      <div className="text-center py-8">Carregando jornadas de trabalho...</div>
    );
  if (error && !isModalOpen)
    return <div className="text-red-600 p-4 bg-red-100 rounded">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaClock className="mr-3 text-indigo-600" /> Gerenciar Jornadas de
          Trabalho
        </h2>
        <button
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 shadow-md flex items-center"
        >
          <FaPlus className="mr-2" /> Novo Turno
        </button>
      </div>

      {shifts.length === 0 ? (
        <div className="mt-4 p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
          Nenhuma jornada de trabalho cadastrada.
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome do Turno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Início
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tolerância (min)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shifts.map((shift) => (
                <tr key={shift.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {shift.workShiftType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shift.startTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shift.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shift.workShiftToleranceMinutes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(shift)}
                      className="text-blue-600 hover:text-blue-900 mr-3 p-1 inline-flex items-center"
                    >
                      <FaEdit className="inline mr-1" /> Editar
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(shift.id, shift.workShiftType)
                      }
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
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {isEditing ? "Editar Turno" : "Criar Novo Turno"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            {error && submitting && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="workShiftType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tipo de Turno
                </label>
                <select
                  name="workShiftType"
                  id="workShiftType"
                  value={formData.workShiftType}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                >
                  <option value="">Selecione</option>
                  <option value="Matutino">Matutino</option>
                  <option value="Diurno">Diurno</option>
                  <option value="Noturno">Noturno</option>
                </select>
              </div>

              <div className="flex space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="startTime"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    id="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    step="1"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="endTime"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Horário de Fim
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    id="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    step="1"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="workShiftToleranceMinutes"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tolerância (minutos)
                </label>
                <input
                  type="number"
                  name="workShiftToleranceMinutes"
                  id="workShiftToleranceMinutes"
                  value={formData.workShiftToleranceMinutes}
                  onChange={handleChange}
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 ${
                    submitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <FaSave className="mr-2" />
                  {submitting ? "Salvando..." : "Salvar Turno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciarTurnos;
