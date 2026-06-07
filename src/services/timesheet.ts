import api from "./api";

export type TimesheetSignatureRole = "RH" | "EMPLOYEE";

export interface TimesheetPeriod {
  month?: number;
  year?: number;
}

export interface TimesheetData {
  employeeName?: string;
  employeeEmail?: string;
  periodStart?: string;
  periodEnd?: string;
  referenceMonth?: string;
  status?: string;
  deadline?: string;
  companyName?: string;
  generatedAt?: string;
  rhSignedAt?: string;
  employeeSignedAt?: string;
  rhSignature?: string;
  employeeSignature?: string;
  signedByHR?: boolean;
  signedByEmployee?: boolean;
  raw?: Record<string, unknown>;
}

interface TimesheetSignaturePayload {
  userId?: string;
  role: TimesheetSignatureRole;
  signatureName?: string;
  signatureBase64?: string;
  month?: number;
  year?: number;
}

const pickString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : undefined;

const pickBoolean = (value: unknown) => {
  if (value === true || value === false) return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  if (value === "true" || value === "TRUE") return true;
  if (value === "false" || value === "FALSE") return false;
  return undefined;
};

const readNestedValue = (value: unknown, keys: string[]) => {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const candidate = pickString(record[key]);
    if (candidate) return candidate;
  }

  return undefined;
};

const normalizeTimesheetData = (raw: unknown): TimesheetData => {
  const payload = Array.isArray(raw) ? raw[0] : raw;
  const record = ((payload as { data?: unknown })?.data ??
    payload ??
    {}) as Record<string, unknown>;

  const employeeName =
    pickString(record.employeeName) ||
    pickString(record.userName) ||
    pickString(record.name) ||
    readNestedValue(record.employee, ["name", "fullName", "employeeName"]) ||
    readNestedValue(record.Employee, ["Name", "FullName", "EmployeeName"]) ||
    readNestedValue(record.user, ["name", "fullName", "employeeName"]);

  const employeeEmail =
    pickString(record.employeeEmail) ||
    pickString(record.email) ||
    readNestedValue(record.employee, ["email", "employeeEmail"]) ||
    readNestedValue(record.user, ["email", "employeeEmail"]);

  const periodStart =
    pickString(record.periodStart) ||
    pickString(record.startDate) ||
    pickString(record.initialDate) ||
    pickString(record.start) ||
    pickString(record.from);

  const periodEnd =
    pickString(record.periodEnd) ||
    pickString(record.endDate) ||
    pickString(record.finalDate) ||
    pickString(record.end) ||
    pickString(record.to);

  const referenceMonth =
    pickString(record.referenceMonth) ||
    pickString(record.period) ||
    pickString(record.Period) ||
    pickString(record.month) ||
    pickString(record.competencia);

  const status =
    pickString(record.status) ||
    pickString(record.state) ||
    pickString(record.situation);

  const deadline =
    pickString(record.deadline) ||
    pickString(record.limitDate) ||
    pickString(record.dueDate) ||
    pickString(record.dataLimite);

  const companyName =
    pickString(record.companyName) ||
    readNestedValue(record.company, ["name", "companyName"]) ||
    readNestedValue(record.Company, ["Name", "CompanyName"]) ||
    pickString(record.empresa);

  const generatedAt =
    pickString(record.generatedAt) || pickString(record.GeneratedAt);

  const rhSignedAt =
    pickString(record.rhSignedAt) ||
    pickString(record.rhSignedDate) ||
    pickString(record.signedRhAt);

  const employeeSignedAt =
    pickString(record.employeeSignedAt) ||
    pickString(record.employeeSignedDate) ||
    pickString(record.signedEmployeeAt);

  const rhSignature =
    pickString(record.rhSignature) ||
    pickString(record.signatureRh) ||
    pickString(record.rhSignatureBase64);

  const employeeSignature =
    pickString(record.employeeSignature) ||
    pickString(record.signatureEmployee) ||
    pickString(record.employeeSignatureBase64);

  const signedByHR =
    pickBoolean(record.signedByHR) ??
    pickBoolean(record.signedByRh) ??
    pickBoolean(record.SignedByHR) ??
    pickBoolean(record.SignedByRh);

  const signedByEmployee =
    pickBoolean(record.signedByEmployee) ??
    pickBoolean(record.SignedByEmployee) ??
    pickBoolean(record.signedByUser) ??
    pickBoolean(record.SignedByUser);

  return {
    employeeName,
    employeeEmail,
    periodStart,
    periodEnd,
    referenceMonth,
    status,
    deadline,
    companyName,
    generatedAt,
    rhSignedAt,
    employeeSignedAt,
    rhSignature,
    employeeSignature,
    signedByHR,
    signedByEmployee,
    raw: record,
  };
};

const isPdfDataUrl = (value: string) =>
  value.trim().startsWith("data:application/pdf");

const isLikelyPdfBase64 = (value: string) => value.trim().startsWith("JVBERi0");

const toPdfDataUrl = (base64: string) => {
  if (isPdfDataUrl(base64)) return base64;
  return `data:application/pdf;base64,${base64}`;
};

const extractPdfFromObject = (payload: Record<string, unknown>) => {
  const url =
    pickString(payload.pdfUrl) ||
    pickString(payload.url) ||
    pickString(payload.fileUrl);
  if (url) return url;

  const base64 =
    pickString(payload.pdfBase64) ||
    pickString(payload.base64) ||
    pickString(payload.fileBase64) ||
    pickString(payload.content) ||
    pickString(payload.data);

  if (base64) {
    return toPdfDataUrl(base64);
  }

  return null;
};

const parseTextPayload = (text: string) => {
  if (isPdfDataUrl(text) || isLikelyPdfBase64(text)) {
    return toPdfDataUrl(text);
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed === "string") {
      return parseTextPayload(parsed);
    }
    if (parsed && typeof parsed === "object") {
      return extractPdfFromObject(parsed as Record<string, unknown>);
    }
  } catch {
    return null;
  }

  return null;
};

const resolvePdfUrl = async (payload: unknown) => {
  if (payload instanceof Blob) {
    if (payload.type?.includes("application/json")) {
      const text = await payload.text();
      const parsed = parseTextPayload(text);
      if (parsed) return parsed;
    }

    return URL.createObjectURL(payload);
  }

  if (typeof payload === "string") {
    const parsed = parseTextPayload(payload);
    if (parsed) return parsed;
  }

  if (payload && typeof payload === "object") {
    const parsed = extractPdfFromObject(payload as Record<string, unknown>);
    if (parsed) return parsed;
  }

  throw new Error("Formato de PDF nao reconhecido.");
};

const buildPeriodParams = (period?: TimesheetPeriod) => {
  if (!period) return undefined;
  const params: Record<string, number> = {};
  if (period.month) params.month = period.month;
  if (period.year) params.year = period.year;
  return Object.keys(params).length ? params : undefined;
};

export const fetchTimesheetData = async (
  userId?: string,
  period?: TimesheetPeriod,
) => {
  const endpoint = userId ? `/timesheet/data/${userId}` : "/timesheet/data/me";
  const response = await api.get(endpoint, {
    params: buildPeriodParams(period),
  });
  return normalizeTimesheetData(response.data);
};

export const fetchTimesheetPdfUrl = async (
  userId?: string,
  period?: TimesheetPeriod,
) => {
  const endpoint = userId ? `/timesheet/pdf/${userId}` : "/timesheet/pdf/me";
  const response = await api.get(endpoint, {
    responseType: "blob",
    params: buildPeriodParams(period),
  });
  return resolvePdfUrl(response.data);
};

export const requestTimesheetPdf = async (
  userId?: string,
  period?: TimesheetPeriod,
) => {
  const endpoint = userId ? `/timesheet/pdf/${userId}` : "/timesheet/pdf/me";
  await api.get(endpoint, {
    responseType: "blob",
    params: buildPeriodParams(period),
  });
};

export const saveTimesheetSignature = async (
  payload: TimesheetSignaturePayload,
) => {
  await api.post("/timesheet/signature", payload);
};

export interface TimeSheetStatusResponse {
  exists: boolean;
  timeSheetId?: string;
  signedByEmployee?: boolean;
  employeeSignedAt?: string;
  signedByHR?: boolean;
  hrSignedAt?: string;
  hrSignerName?: string;
}

export interface TimeSheetListItemDto {
  id: string;
  userId: string;
  userName: string;
  month: number;
  year: number;
  signedByEmployee: boolean;
  signedByHR: boolean;
  createdAt: string;
}

export const getTimeSheetStatus = async (
  userId?: string,
  period?: TimesheetPeriod,
): Promise<TimeSheetStatusResponse> => {
  const endpoint = userId
    ? `/timesheet/status/${userId}`
    : "/timesheet/status/me";
  const response = await api.get(endpoint, {
    params: buildPeriodParams(period),
  });
  return response.data as TimeSheetStatusResponse;
};

export const signTimeSheetByEmployee = async (timeSheetId: string) => {
  await api.post(`/timesheet/${timeSheetId}/sign/employee`);
};

export const signTimeSheetByHR = async (timeSheetId: string) => {
  await api.post(`/timesheet/${timeSheetId}/sign/hr`);
};

export const confirmTimeSheetSignature = async (timeSheetId: string, token: string) => {
  await api.post("/timesheet/sign/confirm", { timeSheetId, token });
};

export const listTimeSheets = async (
  userId?: string,
  period?: TimesheetPeriod,
): Promise<TimeSheetListItemDto[]> => {
  const params: Record<string, string | number> = {};
  if (userId) params.userId = userId;
  if (period?.month) params.month = period.month;
  if (period?.year) params.year = period.year;

  const response = await api.get("/timesheet/list", { params });
  return response.data as TimeSheetListItemDto[];
};

export interface TimeSheetSignatureItemDto {
  signerType: string;
  signerName: string;
  signerCpf: string;
  signerEmail: string;
  signedAtUtc: string;
  signerIp: string;
  timeSheetHash: string;
}

export interface TimeSheetSignatureRequestItemDto {
  signerType: string;
  email: string;
  createdAt: string;
  expiresAtUtc: string;
  usedAtUtc?: string;
}

export interface TimeSheetSignatureHistoryDto {
  signatures: TimeSheetSignatureItemDto[];
  requests: TimeSheetSignatureRequestItemDto[];
}

export interface TimeSheetAuditDto {
  operation: string;
  userName: string;
  oldValues: string;
  newValues: string;
  createdAt: string;
}

export const fetchTimesheetSignatures = async (timeSheetId: string): Promise<TimeSheetSignatureHistoryDto> => {
  const response = await api.get(`/timesheet/${timeSheetId}/signatures`);
  return response.data as TimeSheetSignatureHistoryDto;
};

export const fetchTimesheetAudits = async (timeSheetId: string): Promise<TimeSheetAuditDto[]> => {
  const response = await api.get(`/timesheet/${timeSheetId}/audits`);
  return response.data as TimeSheetAuditDto[];
};
