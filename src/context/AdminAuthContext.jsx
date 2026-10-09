"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAdminToken, getAdminUser, removeAdminSession, adminLogin as apiLogin } from "@/services/api";

const AdminAuthContext = createContext({
  admin: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = getAdminToken();
    const savedUser = getAdminUser();
    if (savedToken && savedUser) {
      setToken(savedToken);
      setAdmin(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    setToken(res.data.token);
    setAdmin(res.data.admin);
    return res;
  };

  const logout = () => {
    removeAdminSession();
    setToken(null);
    setAdmin(null);
    router.push("/admin/login");
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
