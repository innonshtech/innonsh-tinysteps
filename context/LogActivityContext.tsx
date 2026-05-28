"use client";
import React, { createContext, useState, useCallback } from "react";

export interface LogActivityEntry {
  _id?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  result: "success" | "failure";
  message?: string;
  ip?: string;
  userAgent?: string;
  createdAt?: string;
}

interface LogActivityContextType {
  logs: LogActivityEntry[];
  loading: boolean;
  error: string | null;
  fetchLogs: () => Promise<void>;
  createLog: (entry: LogActivityEntry) => Promise<void>;
  clearError: () => void;
}

export const LogActivityContext = createContext<LogActivityContextType | undefined>(undefined);

export function LogActivityProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/log-activity");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLog = useCallback(async (entry: LogActivityEntry) => {
    try {
      setError(null);
      const res = await fetch("/api/log-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error("Failed to create log");
      const data = await res.json();
      setLogs((prev) => [data.entry, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <LogActivityContext.Provider value={{ logs, loading, error, fetchLogs, createLog, clearError }}>
      {children}
    </LogActivityContext.Provider>
  );
}
