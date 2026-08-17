"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/common/Card";
import StatsCard from "@/components/common/StatsCard";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import { useAuth } from "@/context/AuthContext";
import { formatPersonName, formatStudentName } from "@/lib/formatName";
import { Baby, Home, Users, ClipboardCheck, IndianRupee } from "lucide-react";

interface ParentStudent {
  _id: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  admissionNo?: string;
  admission_no?: string;
  className?: string;
  section?: string;
  class?: { name?: string; section?: string };
  parents?: Array<{ name?: string; relation?: string }>;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"home" | "children">("home");
  const [loading, setLoading] = useState(true);
  const [parentName, setParentName] = useState("");
  const [children, setChildren] = useState<ParentStudent[]>([]);
  const [stats, setStats] = useState({
    attendance: 0,
    fees: 0,
    announcements: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, childrenRes, announcementRes] = await Promise.all([
          fetch("/api/auth/profile"),
          fetch("/api/parent/students"),
          fetch("/api/parent/notifications"),
        ]);

        const profileData = await profileRes.json().catch(() => ({}));
        if (profileData.user) {
          setParentName(formatPersonName(profileData.user, "Parent"));
        } else {
          setParentName(formatPersonName(user, "Parent"));
        }

        const childrenData = await childrenRes.json().catch(() => ({ students: [] }));
        const studentList: ParentStudent[] = childrenData.students || [];
        setChildren(studentList);

        const announcementData = await announcementRes.json().catch(() => ({ notifications: [] }));
        setStats({
          attendance: 0,
          fees: 0,
          announcements: (announcementData.notifications || []).length,
        });
      } catch (error) {
        console.error("Failed to fetch parent dashboard:", error);
        setParentName(formatPersonName(user, "Parent"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, <span className="font-semibold text-gray-700">{parentName}</span>
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "home"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Home className="w-4 h-4" />
          Home
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("children")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "children"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4" />
          My Children ({children.length})
        </button>
      </div>

      {activeTab === "home" && (
        <div className="space-y-6">
          <Alert variant="info">
            <strong>Hello, {parentName}!</strong> Stay updated with your child&apos;s progress at school.
          </Alert>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard icon="👨‍👩‍👧" title="Children" value={children.length} color="blue" />
            <StatsCard icon="✓" title="Attendance" value={`${stats.attendance}%`} color="green" />
            <StatsCard icon="💳" title="Pending Fees" value={stats.fees} color="red" />
            <StatsCard icon="📢" title="Updates" value={stats.announcements} color="purple" />
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="primary" onClick={() => setActiveTab("children")}>
                View My Children
              </Button>
              <Link href="/parent-dashboard/announcements">
                <Button type="button" variant="secondary">School Updates</Button>
              </Link>
              <Link href="/parent-portal">
                <Button type="button" variant="secondary">Parent Portal</Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "children" && (
        <div className="space-y-4">
          {children.length === 0 ? (
            <Card className="p-8 text-center">
              <Baby className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No linked children found.</p>
              <p className="text-sm text-gray-400 mt-1">Contact the school if your child should appear here.</p>
            </Card>
          ) : (
            children.map((child) => {
              const studentName = formatStudentName(child);
              const classLabel = child.className || child.class?.name;
              const sectionLabel = child.section || child.class?.section;
              const classDisplay =
                classLabel && sectionLabel
                  ? `${classLabel} - ${sectionLabel}`
                  : classLabel || sectionLabel || "Not assigned";

              return (
                <Card key={child._id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{studentName}</h3>
                        <p className="text-sm text-gray-500">
                          Admission No: {child.admissionNo || child.admission_no || "-"}
                        </p>
                        <p className="text-sm text-gray-500">Class: {classDisplay}</p>
                        {child.parents?.[0]?.name && (
                          <p className="text-sm text-gray-500 mt-1">
                            Parent: {child.parents[0].name}
                            {child.parents[0].relation ? ` (${child.parents[0].relation})` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link href={`/parent-portal/students/${child._id}`}>
                        <Button type="button" variant="primary" size="sm">
                          View Profile
                        </Button>
                      </Link>
                      <Link href={`/parent-portal/attendance/${child._id}`}>
                        <Button type="button" variant="secondary" size="sm">
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          Attendance
                        </Button>
                      </Link>
                      <Link href={`/parent-portal/fees/${child._id}`}>
                        <Button type="button" variant="secondary" size="sm">
                          <IndianRupee className="w-3.5 h-3.5" />
                          Fees
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
