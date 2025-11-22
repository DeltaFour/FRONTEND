import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { FaBuilding, FaSave, FaArrowLeft } from "react-icons/fa";

const EditarEmpresa = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", cnpj: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/super-admin/company/${id}`);
        const { name, cnpj } = response.data;
        setFormData({ name, cnpj });
      } catch (err) {
        console.error("Erro ao buscar dados da empresa:", err.response || err);
        setError("Empresa não encontrada ou erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name: formData.name,
      cnpj: formData.cnpj,
    };

    try {
      await api.put(`/super-admin/company/${id}`, payload);

      setSuccess(`Empresa "${formData.name}" atualizada com sucesso!`);

      setTimeout(() => {
        navigate("/dashboard-admin/empresas");
      }, 1500);
    } catch (err) {
      console.error("Erro na atualização da empresa:", err.response || err);
      const message =
        err.response?.data?.message ||
        "Ocorreu um erro ao atualizar a empresa. Verifique os dados.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-8">Carregando dados da empresa...</div>
    );
  if (error && !submitting)
    return (
      <div className="text-red-600 p-4 bg-red-100 rounded max-w-2xl mx-auto">
        {error}
      </div>
    );

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-3">
        <h2 className="text-3xl font-bold text-gray-800">
          <FaBuilding className="inline mr-3 text-indigo-600" /> Editar Empresa
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition duration-150"
        >
          <FaArrowLeft className="mr-2" /> Voltar
        </button>
      </div>

      {success && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {success}
        </div>
      )}
      {error && submitting && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <strong className="font-bold">Erro:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Nome da Empresa
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
            htmlFor="cnpj"
            className="block text-sm font-medium text-gray-700"
          >
            CNPJ
          </label>
          <input
            type="text"
            name="cnpj"
            id="cnpj"
            value={formData.cnpj}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>

        <div className="flex justify-end">
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

export default EditarEmpresa;
