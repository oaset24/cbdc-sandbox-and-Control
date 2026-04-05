import type {
  AuthUser,
  AuditLogRow,
  BlacklistRow,
  ComplianceMonitorAccount,
  LoginResponse,
  OnChainBalance,
  SystemStats,
  TransactionRow,
  UserRow,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const TOKEN_KEY = "cbdc_access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<ApiError> {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { message?: string | string[] };
    const msg =
      typeof json.message === "string"
        ? json.message
        : Array.isArray(json.message)
          ? json.message.join(", ")
          : text;
    return new ApiError(res.status, msg || res.statusText, json);
  } catch {
    return new ApiError(res.status, text || res.statusText);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  if (!res.ok) throw await parseError(res);
  const ct = res.headers.get("content-type");
  if (!ct?.includes("application/json")) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    apiFetch<AuthUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch<AuthUser>("/auth/me"),

  myOnChainBalance: () => apiFetch<OnChainBalance>("/blockchain/balance/me"),

  systemStats: () => apiFetch<SystemStats>("/dashboard/system-stats"),

  users: () => apiFetch<UserRow[]>("/users"),

  updateUserKyc: (id: string, status: string) =>
    apiFetch<UserRow>(`/users/${id}/kyc`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  transactions: () => apiFetch<TransactionRow[]>("/transactions"),

  transactionsForUser: (userId: string) => apiFetch<TransactionRow[]>(`/transactions/user/${userId}`),

  transfer: (to: string, amount: string, purpose?: string) =>
    apiFetch<TransactionRow>("/transactions/transfer", {
      method: "POST",
      body: JSON.stringify({ to, amount, ...(purpose ? { purpose } : {}) }),
    }),

  mint: (to: string, amount: string) =>
    apiFetch<{ txHash: string }>("/admin/mint", {
      method: "POST",
      body: JSON.stringify({ to, amount }),
    }),

  burn: (from: string, amount: string) =>
    apiFetch<{ txHash: string }>("/admin/burn", {
      method: "POST",
      body: JSON.stringify({ from, amount }),
    }),

  freeze: (address: string) =>
    apiFetch<{ txHash: string }>(`/admin/freeze/${encodeURIComponent(address)}`, { method: "POST" }),

  unfreeze: (address: string) =>
    apiFetch<{ txHash: string }>(`/admin/unfreeze/${encodeURIComponent(address)}`, { method: "POST" }),

  forceTransfer: (from: string, to: string, amount: string) =>
    apiFetch<{ txHash: string }>("/admin/force-transfer", {
      method: "POST",
      body: JSON.stringify({ from, to, amount }),
    }),

  auditLogs: () => apiFetch<AuditLogRow[]>("/admin/audit-logs"),

  flagged: () => apiFetch<TransactionRow[]>("/compliance/flagged"),

  blacklist: () => apiFetch<BlacklistRow[]>("/compliance/blacklist"),

  addBlacklist: (address: string, reason: string) =>
    apiFetch<BlacklistRow>("/compliance/blacklist", {
      method: "POST",
      body: JSON.stringify({ address, reason }),
    }),

  complianceReport: () =>
    apiFetch<{
      flaggedTransactionCount: number;
      blacklistEntryCount: number;
      pendingKycUsers: number;
      recentFlagged: TransactionRow[];
    }>("/compliance/report"),

  complianceMonitorAccounts: () => apiFetch<ComplianceMonitorAccount[]>("/compliance/monitor-accounts"),
};
