"use client";
import { createContext, useState, useContext, useEffect } from "react";
import { formatPersonName } from "@/lib/formatName";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: any) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("user");
      }
    }

    fetch("/api/auth/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          const profile = {
            ...data.user,
            name: formatPersonName(data.user, data.user.email || "User"),
          };
          localStorage.setItem("user", JSON.stringify(profile));
          setUser(profile);
        }
      })
      .catch(() => {
        // Keep cached user if profile refresh fails
      });
  }, []);

  const login = (data: any) => {
    const normalized = {
      ...data,
      name: formatPersonName(data, data.email || "User"),
    };
    localStorage.setItem("user", JSON.stringify(normalized));
    setUser(normalized);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
