import axios from "axios";
// O AuthContext precisa do history para redirecionar após o logout forçado
// Assumindo que você usa react-router-dom v6 (com useNavigate)
// Você precisará de uma forma de acessar o contexto AuthContext ou a função logout.
// Para manter a simplicidade, faremos o interceptor aqui, mas a função de logout será importada do AuthContext.
const BASE_URL = import.meta.env.VITE_BASE_URL || "";
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK === "true";

const createMockApi = () => {
  let companies = [
    {
      id: "1",
      name: "Empresa Exemplo LTDA",
      cnpj: "12.345.678/0001-99",
      isActive: true,
    },
    {
      id: "2",
      name: "DeltaFour Serviços",
      cnpj: "98.765.432/0001-11",
      isActive: true,
    },
    {
      id: "3",
      name: "Tech Solutions SA",
      cnpj: "11.222.333/0001-44",
      isActive: false,
    },
  ];

  const delay = (value, ms = 400) =>
    new Promise((resolve) => setTimeout(() => resolve(value), ms));

  const buildResponse = (data, config) => ({
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: config || {},
  });

  const get = async (url, config) => {
    if (url === "/super-admin/company") {
      return delay(buildResponse(companies, config));
    }

    if (url === "/admin-control/company") {
      return delay(buildResponse({ data: companies }, config));
    }

    const matchCompanyById = url.match(/^\/super-admin\/company\/(.+)$/);
    if (matchCompanyById) {
      const id = matchCompanyById[1];
      const company = companies.find((c) => c.id === id);
      if (!company) {
        return Promise.reject({
          response: { data: { message: "Empresa não encontrada no mock." } },
        });
      }

      return delay(
        buildResponse(
          {
            name: company.name,
            cnpj: company.cnpj,
          },
          config,
        ),
      );
    }

    return delay(buildResponse({}, config));
  };

  const post = async (url, data, config) => {
    if (url === "/auth/login") {
      const { email } = data || {};
      const isSuperAdmin =
        email &&
        (email.toLowerCase().includes("super") ||
          email.toLowerCase().includes("admin"));

      const user = {
        id: "mock-user-1",
        name: isSuperAdmin ? "Super Admin" : "Company Admin",
        email: email || "user@mock.com",
        role: isSuperAdmin ? "ROLE.SUPER_ADMIN" : "ROLE.COMPANY_ADMIN",
      };

      return delay(buildResponse(user, config));
    }

    if (url === "/auth/logout") {
      return delay(buildResponse({}, config));
    }

    if (url === "/super-admin/company") {
      const payload = data || {};
      const newCompany = {
        id: String(Date.now()),
        name: payload.name || "Nova Empresa Mock",
        cnpj: payload.cnpj || "00.000.000/0000-00",
        isActive: true,
      };

      companies = [...companies, newCompany];
      return delay(buildResponse(newCompany, config));
    }

    const matchChangeStatus = url.match(
      /^\/admin-control\/company\/(.+)\/change-status$/,
    );
    if (matchChangeStatus) {
      const id = matchChangeStatus[1];
      companies = companies.map((company) =>
        company.id === id
          ? { ...company, isActive: !company.isActive }
          : company,
      );

      return delay(buildResponse({}, config));
    }

    return delay(buildResponse({}, config));
  };

  const put = async (url, data, config) => {
    const matchUpdate = url.match(/^\/super-admin\/company\/(.+)$/);
    if (matchUpdate) {
      const id = matchUpdate[1];
      const payload = data || {};
      let updated;

      companies = companies.map((company) => {
        if (company.id === id) {
          updated = {
            ...company,
            name: payload.name ?? company.name,
            cnpj: payload.cnpj ?? company.cnpj,
          };
          return updated;
        }
        return company;
      });

      if (!updated) {
        return Promise.reject({
          response: {
            data: { message: "Empresa não encontrada para atualização." },
          },
        });
      }

      return delay(buildResponse(updated, config));
    }

    return delay(buildResponse({}, config));
  };

  const del = async (url, config) => {
    const matchDelete = url.match(/^\/super-admin\/company\/(.+)$/);
    if (matchDelete) {
      const id = matchDelete[1];
      companies = companies.filter((company) => company.id !== id);
      return delay(buildResponse({}, config));
    }

    return delay(buildResponse({}, config));
  };

  return { get, post, put, delete: del };
};

let api;

if (USE_MOCK_API) {
  api = createMockApi();
} else {
  api = axios.create({
    baseURL: BASE_URL + "/api",
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
}

export default api;
