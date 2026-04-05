export type Role = "CENTRAL_BANK" | "BANK" | "COMPLIANCE" | "USER";

export type KYCStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  kycStatus: KYCStatus;
  walletAddress: string | null;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

export type SystemStats = {
  userCount: number;
  activeUsers: number;
  transactionCount: number;
  totalVolume: number;
  blacklistCount: number;
  pendingKycUsers: number;
  totalSupplyWei: string | null;
};

export type TransactionRow = {
  id: string;
  from: string;
  to: string;
  amount: number;
  purpose: string | null;
  status: string;
  flagged: boolean;
  createdAt: string;
  userId?: string;
  user?: { id: string; email: string; role: string };
};

export type AuditLogRow = {
  id: string;
  action: string;
  userId: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export type UserRow = {
  id: string;
  email: string;
  role: Role;
  kycStatus: KYCStatus;
  walletAddress: string | null;
  isActive: boolean;
  createdAt: string;
};

export type BlacklistRow = {
  id: string;
  address: string;
  reason: string;
  addedBy: string;
  createdAt: string;
};
