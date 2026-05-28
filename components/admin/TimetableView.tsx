"use client";
import { useState, useEffect } from "react";
import Card from "@/components/common/Card";
import StatsCard from "@/components/common/StatsCard";
import Badge from "@/components/common/Badge";
import PageHeader from "@/components/common/PageHeader";
import Select from "@/components/common/Select";
import Loader from "@/components/common/Loader";

interface TimetableEntry {
  _id: string;
  classId: { _id: string; name: string; section: string };
  day: string;
  subject: string;
  teacherId: { _id: string; firstName: string; lastName: string };
  startTime: string;
  endTime: string;
  roomNumber: string;
  [key: string]: unknown; // Added index signature
}

interface Class {
  _id: string;
  name: string;
  section: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DAY_COLORS: Record<string, string> = {
  Monday: "bg-blue-50 border-blue-500",
  Tuesday: "bg-green-50 border-green-500",
  Wednesday: "bg-purple-50 border-purple-500",
  Thursday: "bg-orange-50 border-orange-500",
  Friday: "bg-red-50 border-red-500",
  Saturday: "bg-pink-50 border-pink-500",
};

const DAY_BADGE_COLORS: Record<string, "primary" | "success" | "danger" | "warning" | "info" | "gray"> = {
  Monday: "info", // Blue-like
  Tuesday: "success", // Green-like
  Wednesday: "primary", // Purple-like
  Thursday: "warning", // Orange-like
  Friday: "danger", // Red
  Saturday: "gray", // Neutral for cyan
};

export default function TimetableView() {
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetableRes, classesRes] = await Promise.all([
        fetch("/api/timetable"),
        fetch("/api/classes"),
      ]);

      const timetableData = await timetableRes.json();
      const classesData = await classesRes.json();

      if (timetableData.success || timetableData.timetable) {
        const allTimetables = timetableData.timetable || timetableData.data || [];
        setTimetables(allTimetables);

        // Auto-select first class if available
        if (allTimetables.length > 0 && !selectedClass) {
          const firstClassId = typeof allTimetables[0].classId === "string" ? allTimetables[0].classId : (allTimetables[0].classId as any)?._id;
          if (firstClassId) setSelectedClass(firstClassId);
        }
      }

      if (classesData.success) setClasses(classesData.data || []);
    } catch (err) {
      console.error("Failed to fetch timetable:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTimetables = selectedClass
    ? timetables.filter((t) =>
        typeof (t.classId as any) === "string" ? (t.classId as any) === selectedClass : (t.classId as any)?._id === selectedClass
      )
    : timetables;

  // Group by day
  const scheduleByDay = DAYS.map((day) => ({
    day,
    sessions: filteredTimetables
      .filter((t) => t.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  const classStats = {
    totalSessions: filteredTimetables.length,
    uniqueSubjects: new Set(filteredTimetables.map((t) => t.subject)).size,
    uniqueTeachers: new Set(filteredTimetables.map((t) => (typeof (t.teacherId as any) === "string" ? (t.teacherId as any) : (t.teacherId as any)?._id)).filter(Boolean)).size,
    daysActive: new Set(filteredTimetables.map((t) => t.day)).size,
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader title="Class Timetable" />

      {selectedClass && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon="📚"
            title="Total Sessions"
            value={classStats.totalSessions}
            color="blue"
          />
          <StatsCard
            icon="📖"
            title="Subjects"
            value={classStats.uniqueSubjects}
            color="green"
          />
          <StatsCard
            icon="👨‍🏫"
            title="Teachers"
            value={classStats.uniqueTeachers}
            color="purple"
          />
          <StatsCard
            icon="📅"
            title="Days Active"
            value={classStats.daysActive}
            color="orange"
          />
        </div>
      )}

      <Card className="p-6 mb-6">
        <div className="mb-6">
          <Select
            label="Select Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[
              { value: "", label: "All Classes" },
              ...classes.map((c) => ({
                value: c._id,
                label: `${c.name} ${c.section}`,
              })),
            ]}
          />
        </div>

        {selectedClass && filteredTimetables.length > 0 ? (
          <div className="space-y-6">
            {scheduleByDay.map((daySchedule) => (
              <div key={daySchedule.day}>
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-bold">
                    <Badge variant={DAY_BADGE_COLORS[daySchedule.day]}>
                      {daySchedule.day}
                    </Badge>
                  </h3>
                </div>

                {daySchedule.sessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {daySchedule.sessions.map((session) => (
                      <div
                        key={session._id}
                        className={`p-5 rounded-lg border-l-4 ${DAY_COLORS[daySchedule.day]}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg">{session.subject}</h4>
                            <p className="text-sm text-gray-600">
                              {session.classId.name} {session.classId.section}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-600">{session.startTime}</p>
                            <p className="text-xs text-gray-500">to {session.endTime}</p>
                          </div>
                        </div>

                        <div className="border-t pt-3 space-y-2">
                          <div className="flex items-center text-sm">
                            <span className="text-gray-600">👨‍🏫</span>
                            <span className="ml-2 font-medium">
                              {((session.teacherId as any)?.firstName || (session.teacherId as any)?.name) ?? "-"} {((session.teacherId as any)?.lastName) || ""}
                            </span>
                          </div>
                          {session.roomNumber && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-600">🚪</span>
                              <span className="ml-2 font-medium">Room {session.roomNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No classes scheduled for {daySchedule.day}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {filteredTimetables.length === 0
                ? "No timetable available"
                : "Select a class to view timetable"}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}