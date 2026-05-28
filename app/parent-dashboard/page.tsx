"use client";
import { useState, useEffect } from "react";
import Card from "@/components/common/Card";
import StatsCard from "@/components/common/StatsCard";
import Button from "@/components/common/Button";
import Alert from "@/components/common/Alert";
import PageHeader from "@/components/common/PageHeader";
import Link from "next/link";
export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    children: 0,
    attendance: 0,
    fees: 0,
    announcements: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [childrenRes, attendanceRes, feeRes, announcementRes] = await Promise.all([
          fetch("/api/parent/children"),
          fetch("/api/attendance/summary"),
          fetch("/api/fees"),
          fetch("/api/notifications"),
        ]);

        const childrenData = await childrenRes.json().catch(() => ({ data: [] }));
        const attendanceData = await attendanceRes.json().catch(() => ({ data: {} }));
        const feeData = await feeRes.json().catch(() => ({ data: [] }));
        const announcementData = await announcementRes.json().catch(() => ({ data: [] }));

        setStats({
          children: childrenData.data?.length || 0,
          attendance: attendanceData.data?.percentage || 0,
          fees: feeData.data?.filter((f: Record<string, unknown>) => f.status === "pending").length || 0,
          announcements: announcementData.data?.length || 0,
        });
      } catch (error) {
        console.error("Failed to fetch parent stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader title="Parent Dashboard" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          icon="👨‍👩‍👧"
          title="Children"
          value={stats.children}
          color="blue"
        />
        <StatsCard
          icon="✓"
          title="Attendance"
          value={`${stats.attendance}%`}
          color="green"
        />
        <StatsCard
          icon="💳"
          title="Pending Fees"
          value={stats.fees}
          color="red"
        />
        <StatsCard
          icon="📢"
          title="Announcements"
          value={stats.announcements}
          color="purple"
        />
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
   <div className="flex flex-wrap gap-3">
  <Link href="/parent-dashboard/children">
    <Button variant="primary">View Children Progress</Button>
  </Link>

  <Link href="/parent-dashboard/fees">
    <Button variant="secondary">Manage Fees</Button>
  </Link>

  <Link href="/parent-dashboard/attendance">
    <Button variant="secondary">Check Attendance</Button>
  </Link>

  <Link href="/parent-dashboard/announcements">
    <Button variant="secondary">School Updates</Button>
  </Link>
</div>

      </Card>

    <Alert variant="info">
  <strong>Welcome, Parent!</strong> Stay updated with your child&apos;s progress.
</Alert>

    </div>
  );
}
