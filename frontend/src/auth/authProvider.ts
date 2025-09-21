import type { AuthBindings } from "@refinedev/core";
import { api } from "@/api/client";

export const authProvider: AuthBindings = {
  login: async ({ email, password }) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      return { success: true, redirectTo: "/" };
    } catch (e) {
      return { success: false, error: { name: "LoginError", message: "Invalid credentials" } };
    }
  },
  logout: async () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    return { success: true, redirectTo: "/login" };
  },
  check: async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return { authenticated: false, redirectTo: "/login" };
    try {
      await api.get("/api/auth/me");
      return { authenticated: true };
    } catch {
      return { authenticated: false, redirectTo: "/login" };
    }
  },
  getIdentity: async () => {
    const userStr = localStorage.getItem("auth_user");
    if (!userStr) return { id: undefined } as any;
    return JSON.parse(userStr);
  },
  onError: async (error) => {
    if ((error as any)?.response?.status === 401) {
      return { logout: true, redirectTo: "/login" };
    }
    return {};
  },
};
