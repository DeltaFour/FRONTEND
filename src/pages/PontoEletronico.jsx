import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { FaClock, FaSignInAlt, FaSignOutAlt, FaTimes } from "react-icons/fa";

const PontoEletronico = () => {
  const { user } = useAuth();
  const [allowedPunch, setAllowedPunch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllowedPunch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/user/allowed-punch");

      setAllowedPunch(response.data);
    } catch (err) {
      console.error("Erro ao buscar status do ponto:", err);
      setError("Não foi possível carregar o status de marcação.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllowedPunch();
  }, [fetchAllowedPunch]);

  const handlePunch = async () => {
    if (!allowedPunch || submitting) return;

    const punchType = allowedPunch.punchType;
    const confirmMsg = `Confirmar marcação de ponto: ${punchType}?`;

    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    setError(null);

    const payload = {
      type: punchType,
      timePunched: new Date().toISOString(),
      shiftType: user?.shiftType,
      imageBase64: null,
      latitude: 0,
      longitude: 0,
    };

    try {
      await api.post("/user/punch-in", payload);

      alert(`Ponto de ${punchType} registrado com sucesso!`);

      fetchAllowedPunch();
    } catch (err) {
      console.error("Erro ao marcar ponto:", err.response || err);
      setError(
        `Erro ao marcar ponto: ${
          err.response?.data?.message || "Verifique a jornada de trabalho."
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-8">Verificando status de ponto...</div>
    );
  if (error)
    return (
      <div className="text-red-600 p-4 bg-red-100 rounded flex items-center">
        <FaTimes className="mr-2" /> {error}
      </div>
    );
  if (!allowedPunch)
    return (
      <div className="text-center py-8">Dados de ponto não disponíveis.</div>
    );

  const isPunchIn = allowedPunch.punchType === "IN";
  const buttonClass = isPunchIn
    ? "bg-green-600 hover:bg-green-700"
    : "bg-red-600 hover:bg-red-700";

  return (
    <div className="p-8 bg-white rounded-lg shadow-2xl max-w-lg mx-auto text-center">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6">
        <FaClock className="inline mr-3 text-indigo-600" /> Marcação de Ponto
      </h2>

      <p className="text-lg text-gray-600 mb-2">Próxima Ação Necessária:</p>
      <p
        className={`text-4xl font-bold mb-8 ${
          isPunchIn ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPunchIn ? "ENTRADA (IN)" : "SAÍDA (OUT)"}
      </p>

      <button
        onClick={handlePunch}
        disabled={submitting}
        className={`w-full py-4 px-6 text-xl font-semibold text-white rounded-lg transition duration-150 shadow-md flex items-center justify-center ${buttonClass} ${
          submitting ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {submitting ? (
          <>
            <svg className="animate-spin mr-3 h-6 w-6" viewBox="0 0 24 24">
              ...
            </svg>
            Registrando...
          </>
        ) : (
          <>
            {isPunchIn ? (
              <FaSignInAlt className="mr-3" />
            ) : (
              <FaSignOutAlt className="mr-3" />
            )}
            Marcar Ponto de {allowedPunch.punchType}
          </>
        )}
      </button>

      <p className="mt-6 text-sm text-gray-500">
        Turno Atual: {user?.shiftType || "N/A"}
      </p>
    </div>
  );
};

export default PontoEletronico;
