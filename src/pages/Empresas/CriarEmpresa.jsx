import React, { useState } from "react";
import { replace, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { FaBuilding, FaIdCard, FaSave } from "react-icons/fa";

const CriarEmpresa = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    emailAdmin: "",
    nameAdmin: "",
    senhaAdmin: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name: formData.nome,
      cnpj: formData.cnpj,
      employee: {
        email: formData.emailAdmin,
        name: formData.nameAdmin,
        password: formData.senhaAdmin,
      },
    };

    try {
      const response = await api.post("/admin-control/company/create", payload);

      setSuccess(`Empresa "${formData.nome}" criada com sucesso!`);

      setTimeout(() => {
        navigate("/dashboard-admin/empresas", { replace: true });
      }, 1500);
    } catch (err) {
      console.error("Erro na criação da empresa:", err.response || err);

      let message = "Ocorreu um erro ao criar a empresa. Verifique os dados.";

      if (err.response && err.response.data && err.response.data.errors) {
        const validationErrors = Object.values(err.response.data.errors)
          .flat()
          .join(" | ");

        message = `Falha na validação: ${validationErrors}`;
      } else if (err.response && err.response.data) {
        message = err.response.data.message || err.response.data;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-3">
        Cadastrar Nova Empresa
      </h2>

      {success && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {success}
        </div>
      )}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          <strong className="font-bold">Erro:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-700 pt-4 border-t mt-6">
          Dados da Empresa
        </h3>
        <div>
          <label
            htmlFor="nome"
            className="block text-sm font-medium text-gray-700"
          >
            Nome da Empresa
          </label>
          <input
            type="text"
            name="nome"
            id="nome"
            value={formData.nome}
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

        <h3 className="text-xl font-semibold text-gray-700 pt-4 border-t mt-6">
          Dados do Administrador Inicial
        </h3>
        <div>
          <label
            htmlFor="nameAdmin"
            className="block text-sm font-medium text-gray-700"
          >
            Nome Completo do Admin
          </label>
          <input
            type="text"
            name="nameAdmin"
            id="nameAdmin"
            value={formData.nameAdmin}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>
        <div>
          <label
            htmlFor="emailAdmin"
            className="block text-sm font-medium text-gray-700"
          >
            E-mail do Administrador
          </label>
          <input
            type="email"
            name="emailAdmin"
            id="emailAdmin"
            value={formData.emailAdmin}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>

        <div>
          <label
            htmlFor="senhaAdmin"
            className="block text-sm font-medium text-gray-700"
          >
            Senha Temporária
          </label>
          <input
            type="password"
            name="senhaAdmin"
            id="senhaAdmin"
            value={formData.senhaAdmin}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 ${
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
            {loading ? "Cadastrando..." : "Cadastrar Empresa"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CriarEmpresa;
