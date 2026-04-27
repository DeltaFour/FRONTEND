import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "";
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK === "true";

type UserRole = "ROLE.COMPANY_ADMIN" | "ROLE.EMPLOYEE";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleName: "COMPANY_ADMIN" | "EMPLOYEE";
  cellphone?: string;
  shiftType?: string;
  isAllowedBypassCoord?: boolean;
  shiftId?: string;
}

interface MockShift {
  id: number;
  shiftType: string;
  startTime: string;
  endTime: string;
  toleranceMinutes: number;
}

interface MockPunch {
  id: string;
  userId: string;
  type: string;
  timePunched: string;
  shiftType?: string;
}

const createMockApi = () => {
  let currentUserId = "company-admin-1";

  let users: MockUser[] = [
    {
      id: "company-admin-1",
      name: "Admin da Empresa",
      email: "empresa@deltafour.com",
      role: "ROLE.COMPANY_ADMIN",
      roleName: "COMPANY_ADMIN",
      cellphone: "11999990000",
      shiftType: "Comercial",
      shiftId: "1",
      isAllowedBypassCoord: true,
    },
    {
      id: "employee-1",
      name: "João Funcionário",
      email: "joao@deltafour.com",
      role: "ROLE.EMPLOYEE",
      roleName: "EMPLOYEE",
      cellphone: "11988887777",
      shiftType: "Comercial",
      shiftId: "1",
      isAllowedBypassCoord: false,
    },
  ];

  let shifts: MockShift[] = [
    {
      id: 1,
      shiftType: "Comercial",
      startTime: "08:00:00",
      endTime: "17:00:00",
      toleranceMinutes: 10,
    },
    {
      id: 2,
      shiftType: "Noturno",
      startTime: "22:00:00",
      endTime: "06:00:00",
      toleranceMinutes: 15,
    },
  ];

  let nextPunchTypeByUser: Record<string, "IN" | "OUT"> = {
    "company-admin-1": "IN",
    "employee-1": "IN",
  };

  let punches: MockPunch[] = [
    {
      id: "p1",
      userId: "employee-1",
      type: "IN",
      timePunched: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      shiftType: "Comercial",
    },
    {
      id: "p2",
      userId: "employee-1",
      type: "OUT",
      timePunched: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      shiftType: "Comercial",
    },
  ];

  const delay = async <T>(value: T, ms = 250): Promise<T> => {
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

  const normalizeUrl = (url: string) => (url.startsWith("/") ? url : `/${url}`);

  const getCurrentUser = () => users.find((user) => user.id === currentUserId);

  const get = async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    const normalizedUrl = normalizeUrl(url);

    if (normalizedUrl === "/user/list") {
      return delay(buildResponse({ data: users } as T, config));
    }

    if (normalizedUrl === "/workshift/list" || normalizedUrl === "/workshift") {
      return delay(buildResponse({ data: shifts } as T, config));
    }

    if (normalizedUrl === "/user/allowed-punch") {
      const currentUser = getCurrentUser();
      const punchType = nextPunchTypeByUser[currentUser?.id || ""] || "IN";
      return delay(buildResponse({ punchType } as T, config));
    }

    if (normalizedUrl === "/user/punch-history") {
      const currentUser = getCurrentUser();
      const data = punches
        .filter((punch) => punch.userId === currentUser?.id)
        .sort(
          (a, b) =>
            new Date(b.timePunched).getTime() -
            new Date(a.timePunched).getTime(),
        );
      return delay(buildResponse({ data } as T, config));
    }

    const userByIdMatch = normalizedUrl.match(/^\/user\/(.+)$/);
    if (userByIdMatch) {
      const id = userByIdMatch[1];
      const employee = users.find((user) => user.id === id);

      if (!employee) {
        return Promise.reject({
          response: { data: { message: "Funcionário não encontrado." } },
        });
      }

      const payload = {
        id: employee.id,
        name: employee.name,
        cellphone: employee.cellphone,
        roleName: employee.roleName,
        isAllowedBypassCoord: employee.isAllowedBypassCoord,
        shiftDto: employee.shiftId ? [{ id: employee.shiftId }] : [],
      };

      return delay(buildResponse(payload as T, config));
    }

    return delay(buildResponse({} as T, config));
  };

  const post = async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    const normalizedUrl = normalizeUrl(url);

    if (normalizedUrl === "/auth/login") {
      const { email } = (data || {}) as { email?: string };

      const isEmployee =
        !!email &&
        (email.toLowerCase().includes("func") ||
          email.toLowerCase().includes("employee"));

      const matchedUser = users.find((user) => user.email === email);

      const user: MockUser = matchedUser || {
        id: isEmployee ? "employee-1" : "company-admin-1",
        name: isEmployee ? "Funcionário Web" : "Admin da Empresa",
        email:
          email || (isEmployee ? "funcionario@mock.com" : "empresa@mock.com"),
        role: isEmployee ? "ROLE.EMPLOYEE" : "ROLE.COMPANY_ADMIN",
        roleName: isEmployee ? "EMPLOYEE" : "COMPANY_ADMIN",
        shiftType: "Comercial",
        shiftId: "1",
        isAllowedBypassCoord: !isEmployee,
      };

      currentUserId = user.id;

      return delay(buildResponse(user as unknown as T, config));
    }

    if (normalizedUrl === "/auth/logout") {
      currentUserId = "company-admin-1";
      return delay(buildResponse({} as T, config));
    }

    if (normalizedUrl === "/user") {
      const payload = (data || {}) as {
        name?: string;
        email?: string;
        roleName?: string;
        cellPhone?: string;
        isAllowedBypassCoord?: boolean;
        userShift?: Array<{ shiftId?: string }>;
      };

      const newUser: MockUser = {
        id: `employee-${Date.now()}`,
        name: payload.name || "Novo Funcionário",
        email: payload.email || `novo.${Date.now()}@mock.com`,
        role:
          payload.roleName === "COMPANY_ADMIN"
            ? "ROLE.COMPANY_ADMIN"
            : "ROLE.EMPLOYEE",
        roleName:
          payload.roleName === "COMPANY_ADMIN" ? "COMPANY_ADMIN" : "EMPLOYEE",
        cellphone: payload.cellPhone,
        shiftId: payload.userShift?.[0]?.shiftId,
        shiftType: shifts.find(
          (shift) => String(shift.id) === payload.userShift?.[0]?.shiftId,
        )?.shiftType,
        isAllowedBypassCoord: payload.isAllowedBypassCoord,
      };

      users = [...users, newUser];
      nextPunchTypeByUser[newUser.id] = "IN";

      return delay(buildResponse(newUser as unknown as T, config));
    }

    if (normalizedUrl === "/v1/user/punch-in") {
      const payload = (data || {}) as {
        type?: string;
        timePunched?: string;
        shiftType?: string;
      };
      const currentUser = getCurrentUser();

      if (!currentUser) {
        return Promise.reject({
          response: { data: { message: "Usuário não autenticado." } },
        });
      }

      const newPunch: MockPunch = {
        id: `p-${Date.now()}`,
        userId: currentUser.id,
        type: payload.type || "IN",
        timePunched: payload.timePunched || new Date().toISOString(),
        shiftType: payload.shiftType || currentUser.shiftType,
      };

      punches = [newPunch, ...punches];
      nextPunchTypeByUser[currentUser.id] =
        newPunch.type === "IN" ? "OUT" : "IN";

      return delay(buildResponse(newPunch as unknown as T, config));
    }

    if (normalizedUrl === "/user/punch-for-user") {
      const payload = (data || {}) as {
        employeeId?: string;
        type?: string;
        timePunched?: string;
        shiftType?: string;
      };
      const userId = payload.employeeId;

      if (!userId) {
        return Promise.reject({
          response: { data: { message: "employeeId é obrigatório." } },
        });
      }

      const newPunch: MockPunch = {
        id: `p-${Date.now()}`,
        userId,
        type: payload.type || "IN",
        timePunched: payload.timePunched || new Date().toISOString(),
        shiftType: payload.shiftType,
      };

      punches = [newPunch, ...punches];
      nextPunchTypeByUser[userId] = newPunch.type === "IN" ? "OUT" : "IN";

      return delay(buildResponse(newPunch as unknown as T, config));
    }

    if (normalizedUrl === "/workshift/create") {
      const payload = (data || {}) as {
        shiftType?: string;
        startTime?: string;
        endTime?: string;
        toleranceMinutes?: number;
      };

      const newShift: MockShift = {
        id: Date.now(),
        shiftType: payload.shiftType || "Novo Turno",
        startTime: payload.startTime || "08:00:00",
        endTime: payload.endTime || "17:00:00",
        toleranceMinutes: Number(payload.toleranceMinutes ?? 0),
      };

      shifts = [...shifts, newShift];

      return delay(buildResponse(newShift as unknown as T, config));
    }

    return delay(buildResponse({} as T, config));
  };

  const patch = async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    const normalizedUrl = normalizeUrl(url);

    if (normalizedUrl === "/user") {
      const payload = (data || {}) as {
        id?: string;
        name?: string;
        cellPhone?: string;
        isAllowedBypassCoord?: boolean;
        userShift?: Array<{ shiftId?: string }>;
      };

      const userId = payload.id;
      if (!userId) {
        return Promise.reject({
          response: { data: { message: "ID do usuário é obrigatório." } },
        });
      }

      users = users.map((user) => {
        if (user.id !== userId) {
          return user;
        }

        const nextShiftId = payload.userShift?.[0]?.shiftId || user.shiftId;
        const shiftType = shifts.find(
          (shift) => String(shift.id) === nextShiftId,
        )?.shiftType;

        return {
          ...user,
          name: payload.name ?? user.name,
          cellphone: payload.cellPhone ?? user.cellphone,
          shiftId: nextShiftId,
          shiftType: shiftType ?? user.shiftType,
          isAllowedBypassCoord:
            payload.isAllowedBypassCoord ?? user.isAllowedBypassCoord,
        };
      });

      return delay(buildResponse({} as T, config));
    }

    if (normalizedUrl === "/workshift/update") {
      const payload = (data || {}) as {
        id?: number;
        shiftType?: string;
        startTime?: string;
        endTime?: string;
        toleranceMinutes?: number;
      };

      shifts = shifts.map((shift) =>
        shift.id === payload.id
          ? {
              ...shift,
              shiftType: payload.shiftType ?? shift.shiftType,
              startTime: payload.startTime ?? shift.startTime,
              endTime: payload.endTime ?? shift.endTime,
              toleranceMinutes: Number(
                payload.toleranceMinutes ?? shift.toleranceMinutes,
              ),
            }
          : shift,
      );

      return delay(buildResponse({} as T, config));
    }

    return delay(buildResponse({} as T, config));
  };

  const del = async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    const normalizedUrl = normalizeUrl(url);

    const userDeleteMatch = normalizedUrl.match(/^\/user\/(.+)$/);
    if (userDeleteMatch) {
      const userId = userDeleteMatch[1];
      users = users.filter((user) => user.id !== userId);
      punches = punches.filter((punch) => punch.userId !== userId);
      delete nextPunchTypeByUser[userId];
      return delay(buildResponse({} as T, config));
    }

    const shiftDeleteMatch = normalizedUrl.match(
      /^\/workshift\/change-status\/(.+)$/,
    );
    if (shiftDeleteMatch) {
      const shiftId = Number(shiftDeleteMatch[1]);
      shifts = shifts.filter((shift) => shift.id !== shiftId);
      return delay(buildResponse({} as T, config));
    }

    return delay(buildResponse({} as T, config));
  };

  return {
    get,
    post,
    patch,
    put: post,
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
