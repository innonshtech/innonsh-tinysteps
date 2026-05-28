"use client";
import React, { useEffect, useState, useRef } from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Clock, Search, X } from "lucide-react";
import { showToast } from "@/lib/toast";

interface LogEntry {
  _id: string;
  actorId?: any;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  result: string;
  message?: string;
  createdAt: string;
}

export default function LogActivityCenter() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/log-activity`);
      const data = await res.json();
      if (res.ok && data.logs) {
        console.log("Fetched logs:", data.logs);
        setLogs(data.logs);
      } else {
        console.error("API error:", data);
        showToast.error(data.error || "Failed to fetch logs");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showToast.error("Error fetching logs");
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((l) => {
    if (!searchTerm) return true;
    return (
      (l.actorEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.message || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Log Activity" }]} />

      <div className="mt-6 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Log Activity</h1>
          <p className="text-gray-600 mt-1">Tracks login attempts and related actions</p>
        </div>
        <div className="w-80 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            placeholder="Search by email, action, message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {logs.length > 0 ? `Showing ${filtered.length} of ${logs.length} entries` : "No logs available"}
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((l) => (
              <div key={l._id} className={`border rounded-lg p-4 ${l.result === 'failure' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-semibold text-gray-800 truncate">{l.actorEmail || (l.actorId && l.actorId.email) || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{l.actorRole}</div>
                      <div className="text-xs text-gray-500">• {l.action}</div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{l.message}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(l.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${l.result === 'failure' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {l.result}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No activity found</p>
          </div>
        )}
      </div>
    </div>
  );
}
