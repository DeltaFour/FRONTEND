import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "";
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK === "true";

interface MockCompany {
  id: string;
  name: string;
  cnpj: string;
  isActive: boolean;
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const createMockApi = () => {
  let companies: MockCompany[] = [
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

  const delay = async <T>(value: T, ms = 400): Promise<T> => {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
  };

  const buildResponse = <T>(
    data: T,
    config?: AxiosRequestConfig,
  ): AxiosResponse<T> => {
    return {
      data,
      status: 200,
      statusText: "OK",
      headers: {},
      config: (config || {}) as InternalAxiosRequestConfig,
    };
  };

  const get = async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    // Lista de empresas para super-admin
    if (url === "/super-admin/company") {
      return delay(buildResponse(companies as unknown as T, config));
    }

    // Lista de empresas para admin-control
    if (url === "/admin-control/company") {
      const payload = { data: companies } as unknown as T;
      return delay(buildResponse(payload, config));
    }

    // Detalhes de empresa
    const matchCompanyById = url.match(/^\/super-admin\/company\/(.+)$/);
    if (matchCompanyById) {
      const id = matchCompanyById[1];
      const company = companies.find((c) => c.id === id);
      if (!company) {
        return Promise.reject({
          response: {
            data: { message: "Empresa não encontrada no mock." },
          },
        });
      }

      const payload = {
        name: company.name,
        cnpj: company.cnpj,
      } as unknown as T;

      return delay(buildResponse(payload, config));
    }

    return delay(buildResponse({} as T, config));
  };

  const post = async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    // Login fake
    if (url === "/auth/login") {
      const { email } = (data || {}) as { email?: string; password?: string };

      const isSuperAdmin =
        !!email &&
        (email.toLowerCase().includes("super") ||
          email.toLowerCase().includes("admin"));

      const user: MockUser = {
        id: "mock-user-1",
        name: isSuperAdmin ? "Super Admin" : "Company Admin",
        email: email || "user@mock.com",
        role: isSuperAdmin ? "ROLE.SUPER_ADMIN" : "ROLE.COMPANY_ADMIN",
      };

      return delay(buildResponse(user as unknown as T, config));
    }

    // Logout fake
    if (url === "/auth/logout") {
      return delay(buildResponse({} as T, config));
    }

    // Criação de empresa
    if (url === "/super-admin/company") {
      const payload = (data || {}) as {
        name?: string;
        cnpj?: string;
      };

      const newCompany: MockCompany = {
        id: String(Date.now()),
        name: payload.name || "Nova Empresa Mock",
        cnpj: payload.cnpj || "00.000.000/0000-00",
        isActive: true,
      };

      companies = [...companies, newCompany];

      return delay(buildResponse(newCompany as unknown as T, config));
    }

    // Alterar status da empresa
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

      return delay(buildResponse({} as T, config));
    }

    return delay(buildResponse({} as T, config));
  };

  const put = async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    const matchUpdate = url.match(/^\/super-admin\/company\/(.+)$/);
    if (matchUpdate) {
      const id = matchUpdate[1];
      const payload = (data || {}) as { name?: string; cnpj?: string };

      let updated: MockCompany | undefined;
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

      return delay(buildResponse(updated as unknown as T, config));
    }

    return delay(buildResponse({} as T, config));
  };

  const del = async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    const matchDelete = url.match(/^\/super-admin\/company\/(.+)$/);
    if (matchDelete) {
      const id = matchDelete[1];
      companies = companies.filter((company) => company.id !== id);
      return delay(buildResponse({} as T, config));
    }

    return delay(buildResponse({} as T, config));
  };

  return {
    get,
    post,
    put,
    delete: del,
  } as unknown as AxiosInstance;
};

let api: AxiosInstance;

if (USE_MOCK_API) {
  api = createMockApi();
} else {
  api = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem("authToken");
      if (token && config.headers) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );
}

export default api;
