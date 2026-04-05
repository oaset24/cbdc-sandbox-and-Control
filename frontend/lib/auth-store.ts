import { create } from "zustand";
import type { AuthUser } from "./types";
import { setAccessToken } from "./api";

const USER_KEY = "cbdc_user";

function readUserFromStorage(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function writeUserToStorage(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => void;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  hydrate: () => {
    const user = readUserFromStorage();
    set({ user, hydrated: true });
  },
  setAuth: (token, user) => {
    setAccessToken(token);
    writeUserToStorage(user);
    set({ user });
  },
  logout: () => {
    setAccessToken(null);
    writeUserToStorage(null);
    set({ user: null });
  },
}));

export function dashboardPathForRole(role: string): string {
  switch (role) {
    case "CENTRAL_BANK":
      return "/central-bank/overview";
    case "BANK":
      return "/bank/overview";
    case "USER":
      return "/wallet/dashboard";
    case "COMPLIANCE":
      return "/compliance/monitor";
    default:
      return "/login";
  }
}
