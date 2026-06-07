import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL || "";
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK === "true";

type UserRole = "ROLE.SUPER_ADMIN" | "ROLE.ADMIN" | "ROLE.RH" | "ROLE.EMPLOYEE";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleName: "SUPER_ADMIN" | "ADMIN" | "RH" | "EMPLOYEE";
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
  let currentUserId = "admin-1";

  let users: MockUser[] = [
    {
      id: "admin-1",
      name: "Admin",
      email: "empresa@deltafour.com",
      role: "ROLE.ADMIN",
      roleName: "ADMIN",
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

  const mockPdfBase64 =
    "JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDIgMCBSPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9LaWRzIFszIDAgUl0vQ291bnQgMT4+CmVuZG9iagozIDAgb2JqCjw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3ggWzAgMCAyMDAgMjAwXS9Db250ZW50cyA0IDAgUi9SZXNvdXJjZXMgPDw+Pj4+CmVuZG9iago0IDAgb2JqCjw8L0xlbmd0aCA0ND4+CnN0cmVhbQpCVC9GMSAxMiBUZiA3MiAxMjAgVGQgKFRpbWVzaGVldCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MSAwMDAwMCBuIAowMDAwMDAwMTE2IDAwMDAwIG4gCjAwMDAwMDAyMTYgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDUvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgozMTkKJSVFT0YK";

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

  const buildTimesheetData = (userId?: string) => {
    const employee =
      users.find((user) => user.id === userId) || getCurrentUser();
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const deadline = new Date(now.getFullYear(), now.getMonth() + 1, 10);
    const referenceMonth = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    return {
      employeeName: employee?.name,
      employeeEmail: employee?.email,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      referenceMonth,
      status: "Pendente",
      deadline: deadline.toISOString(),
    };
  };

  const get = async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> => {
    const normalizedUrl = normalizeUrl(url);

    if (normalizedUrl === "/user/list") {
      return delay(buildResponse({ data: users } as T, config));
    }

    if (normalizedUrl === "/user/get-all-attendances") {
      const allAttendances = punches.map((punch) => {
        const employee = users.find((u) => u.id === punch.userId);
        return {
          attendanceId: punch.id,
          name: employee?.name || "Funcionário Desconhecido",
          timePunched: punch.timePunched,
          isLate: false,
          type: punch.type,
          shiftType: punch.shiftType || employee?.shiftType,
          status: "APROVADO",
          justification: "",
          observation: "",
          filePath: "",
        };
      });
      return delay(buildResponse(allAttendances as T, config));
    }

    if (normalizedUrl === "/workshift/list" || normalizedUrl === "/workshift") {
      return delay(buildResponse({ data: shifts } as T, config));
    }

    if (normalizedUrl === "/user/refresh-information") {
      const currentUser = getCurrentUser();
      const lastPunch = punches
        .filter((punch) => punch.userId === currentUser?.id)
        .sort(
          (a, b) =>
            new Date(b.timePunched).getTime() -
            new Date(a.timePunched).getTime(),
        )[0];

      const lastUserAttendances = punches
        .filter((punch) => punch.userId === currentUser?.id)
        .slice(0, 10)
        .map((punch) => ({
          punchType: punch.type,
          shiftType: punch.shiftType,
          punchTime: punch.timePunched,
          punchDate: punch.timePunched,
        }));

      const payload = {
        name: currentUser?.name,
        role: currentUser?.roleName,
        shiftType: currentUser?.shiftType,
        lastPunchType: lastPunch?.type,
        lastUserAttendances,
      };

      return delay(buildResponse(payload as T, config));
    }

    if (normalizedUrl === "/timesheet/data/me") {
      const currentUser = getCurrentUser();
      return delay(
        buildResponse(buildTimesheetData(currentUser?.id) as T, config),
      );
    }

    if (normalizedUrl === "/punctuality-metrics/scatter-plot") {
      const mockScatterData = {
        points: [
          { userId: "employee-1", userName: "João Funcionário", latePercentage: 15, averageLateMinutes: 12, cluster: 0 },
          { userId: "employee-2", userName: "Carlos Funcionário", latePercentage: 45, averageLateMinutes: 28, cluster: 1 },
          { userId: "employee-3", userName: "Ana RH", latePercentage: 5, averageLateMinutes: 8, cluster: 0 },
          { userId: "employee-4", userName: "Marcos Oliveira", latePercentage: 80, averageLateMinutes: 45, cluster: 2 },
          { userId: "employee-5", userName: "Juliana Costa", latePercentage: 90, averageLateMinutes: 60, cluster: 2 },
          { userId: "employee-6", userName: "Amanda Lima", latePercentage: 8, averageLateMinutes: 5, cluster: 0 },
          { userId: "employee-7", userName: "Bruno Silva", latePercentage: 12, averageLateMinutes: 9, cluster: 0 },
          { userId: "employee-8", userName: "Camila Souza", latePercentage: 4, averageLateMinutes: 4, cluster: 0 },
          { userId: "employee-9", userName: "Daniel Alves", latePercentage: 10, averageLateMinutes: 11, cluster: 0 },
          { userId: "employee-10", userName: "Eduardo Santos", latePercentage: 35, averageLateMinutes: 20, cluster: 1 },
          { userId: "employee-11", userName: "Fernanda Oliveira", latePercentage: 40, averageLateMinutes: 25, cluster: 1 },
          { userId: "employee-12", userName: "Gabriel Costa", latePercentage: 50, averageLateMinutes: 32, cluster: 1 },
          { userId: "employee-13", userName: "Helena Rodrigues", latePercentage: 30, averageLateMinutes: 18, cluster: 1 },
          { userId: "employee-14", userName: "Igor Pereira", latePercentage: 75, averageLateMinutes: 50, cluster: 2 },
          { userId: "employee-15", userName: "Larissa Santos", latePercentage: 85, averageLateMinutes: 55, cluster: 2 },
          { userId: "employee-16", userName: "Mateus Ferreira", latePercentage: 95, averageLateMinutes: 65, cluster: 2 },
        ],
        centroids: [
          { cluster: 0, latePercentage: 9, averageLateMinutes: 8.2 },
          { cluster: 1, latePercentage: 40, averageLateMinutes: 24.6 },
          { cluster: 2, latePercentage: 85, averageLateMinutes: 55.5 },
        ]
      };
      return delay(buildResponse(mockScatterData as T, config));
    }

    const timesheetDataMatch = normalizedUrl.match(/^\/timesheet\/data\/(.+)$/);
    if (timesheetDataMatch) {
      const id = timesheetDataMatch[1];
      return delay(buildResponse(buildTimesheetData(id) as T, config));
    }

    if (normalizedUrl === "/timesheet/pdf/me") {
      return delay(buildResponse({ pdfBase64: mockPdfBase64 } as T, config));
    }

    const timesheetPdfMatch = normalizedUrl.match(/^\/timesheet\/pdf\/(.+)$/);
    if (timesheetPdfMatch) {
      return delay(buildResponse({ pdfBase64: mockPdfBase64 } as T, config));
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
        id: isEmployee ? "employee-1" : "admin-1",
        name: isEmployee ? "Funcionário Web" : "Admin",
        email:
          email || (isEmployee ? "funcionario@mock.com" : "empresa@mock.com"),
        role: isEmployee ? "ROLE.EMPLOYEE" : "ROLE.ADMIN",
        roleName: isEmployee ? "EMPLOYEE" : "ADMIN",
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

    if (normalizedUrl === "/auth/forgot-password") {
      return delay(buildResponse({ message: "Se o e-mail estiver cadastrado, um código de recuperação foi enviado." } as unknown as T, config));
    }

    if (normalizedUrl === "/auth/reset-password") {
      return delay(buildResponse({ message: "Senha redefinida com sucesso." } as unknown as T, config));
    }

    if (normalizedUrl === "/auth/change-password") {
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

      const roleName = (payload.roleName || "EMPLOYEE").toUpperCase() as
        | "SUPER_ADMIN"
        | "ADMIN"
        | "RH"
        | "EMPLOYEE";

      const newUser: MockUser = {
        id: `employee-${Date.now()}`,
        name: payload.name || "Novo Funcionário",
        email: payload.email || `novo.${Date.now()}@mock.com`,
        role: `ROLE.${roleName}` as UserRole,
        roleName,
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

    if (normalizedUrl === "/user/allowed-punch") {
      return delay(buildResponse(true as unknown as T, config));
    }

    if (normalizedUrl === "/user/register-point") {
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

      return delay(buildResponse({} as T, config));
    }

    if (normalizedUrl === "/user/punch-for-user") {
      const payload = (data || {}) as {
        userId?: string;
        type?: string;
        timePunched?: string;
        shiftType?: string;
      };
      const userId = payload.userId;

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

    if (normalizedUrl.endsWith("/sign/employee") || normalizedUrl.endsWith("/sign/hr")) {
      return delay(buildResponse({ message: "Código de confirmação enviado." } as unknown as T, config));
    }

    if (normalizedUrl === "/timesheet/sign/confirm") {
      return delay(buildResponse({ message: "Assinatura confirmada com sucesso." } as unknown as T, config));
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
    baseURL: `${BASE_URL}/api/v1`,
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
