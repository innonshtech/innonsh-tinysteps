"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Users,
  HeartPulse,
  ShieldCheck,
  CreditCard,
  Calendar,
  Edit2,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Button from "@/components/common/Button";
import StudentModal from "@/components/admin/StudentModal";

interface Parent {
  _id?: string;
  id?: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
}

interface StudentProfileData {
  _id: string;
  firstName: string;
  lastName?: string;
  admissionNo: string;
  dob?: string;
  gender?: string;
  admissionDate?: string;
  className?: string;
  section?: string;
  email?: string;
  medicalAllergies?: string[];
  medicalNotes?: string;
  pickupPerson?: string;
  pickupPhone?: string;
  medical?: {
    allergies?: string[];
    notes?: string;
  };
  pickupInfo?: {
    pickupPerson?: string;
    pickupPhone?: string;
  };
  parents?: Parent[];
  attendanceSummary?: {
    present: number;
    absent: number;
    leave: number;
    total: number;
    percentage: number;
  };
  feeSummary?: {
    totalDue: number;
    totalPaid: number;
    totalPending: number;
    status: string;
    recentTransactions?: Array<{
      _id: string;
      amountDue: number;
      amountPaid: number;
      status: string;
      dueDate?: string;
      createdAt?: string;
    }>;
  };
}

export default function StudentProfile({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "fees">("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
  }, [studentId]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/students/${studentId}`);
      const data = await res.json();
      if (data.success && data.student) {
        setStudent(data.student);
      } else {
        setError(data.error || "Failed to load student profile");
      }
    } catch {
      setError("An unexpected error occurred while fetching student data.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not provided";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Not provided";
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Not provided";
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-3"></div>
        <p className="text-gray-600 font-medium text-sm">Loading Student Record...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6 bg-gray-50 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800 mb-1">Student Record Not Found</h2>
          <p className="text-gray-600 text-sm mb-5">{error || "The requested student record could not be found."}</p>
          <Button onClick={() => router.push("/dashboard/students")} className="w-full">
            Back to Students Directory
          </Button>
        </div>
      </div>
    );
  }

  const fullName = `${student.firstName} ${student.lastName || ""}`.trim();
  const classSection = student.className
    ? student.section && String(student.section) !== "undefined"
      ? `${student.className} - ${student.section}`
      : student.className
    : "Not Assigned";

  const primaryParent = student.parents && student.parents.length > 0 ? student.parents[0] : null;
  const additionalGuardians = student.parents && student.parents.length > 1 ? student.parents.slice(1) : [];

  const allergiesList = student.medical?.allergies || student.medicalAllergies || [];
  const medicalNotesText = student.medical?.notes || student.medicalNotes || "";
  const pickupPersonName = student.pickupInfo?.pickupPerson || student.pickupPerson || "";
  const pickupPhoneNo = student.pickupInfo?.pickupPhone || student.pickupPhone || "";

  return (
    <div className="p-4 md:p-6 bg-gray-50 space-y-5 max-w-7xl mx-auto">
      {/* Back Navigation */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/students")}
          className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 text-orange-700 rounded-xl flex items-center justify-center text-xl font-bold border border-orange-200 shrink-0">
              {student.firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-sm font-medium text-gray-600 mt-0.5">
                <span className="font-mono">{student.admissionNo || "Not provided"}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span>{classSection}</span>
              </p>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              Edit Student
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-gray-200 bg-white px-4 rounded-xl border">
        <nav className="flex gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "border-orange-500 text-orange-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("attendance")}
            className={`py-3 px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === "attendance"
                ? "border-orange-500 text-orange-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Attendance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("fees")}
            className={`py-3 px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === "fees"
                ? "border-orange-500 text-orange-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Fees
          </button>
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section 1: Student Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              Student Information
            </h2>
            <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-2 text-sm">
              <span className="text-gray-500 font-medium">Full Name</span>
              <span className="text-gray-900 font-semibold">{fullName}</span>

              <span className="text-gray-500 font-medium">Date of Birth</span>
              <span className="text-gray-900">{formatDate(student.dob)}</span>

              <span className="text-gray-500 font-medium">Gender</span>
              <span className="text-gray-900 capitalize">{student.gender || "Not provided"}</span>

              <span className="text-gray-500 font-medium">Admission No.</span>
              <span className="font-mono text-gray-900 font-semibold">{student.admissionNo || "Not provided"}</span>

              <span className="text-gray-500 font-medium">Admission Date</span>
              <span className="text-gray-900">{formatDate(student.admissionDate)}</span>

              <span className="text-gray-500 font-medium">Class</span>
              <span className="text-gray-900">{student.className || "Not Assigned"}</span>

              <span className="text-gray-500 font-medium">Section</span>
              <span className="text-gray-900">
                {student.section && String(student.section) !== "undefined" ? student.section : "Not Assigned"}
              </span>
            </div>
          </div>

          {/* Section 2: Parent & Guardian Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Parent & Guardian Information
            </h2>

            {primaryParent ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Primary Guardian
                  </span>
                  <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-2 text-sm bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                    <span className="text-gray-500 font-medium">Name</span>
                    <span className="text-gray-900 font-semibold">{primaryParent.name || "Not provided"}</span>

                    <span className="text-gray-500 font-medium">Relation</span>
                    <span className="text-gray-900 capitalize">{primaryParent.relation || "Parent"}</span>

                    <span className="text-gray-500 font-medium">Phone</span>
                    <span className="text-gray-900">
                      {primaryParent.phone ? (
                        <a href={`tel:${primaryParent.phone}`} className="text-orange-600 font-medium hover:underline">
                          {primaryParent.phone}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </span>

                    <span className="text-gray-500 font-medium">Email</span>
                    <span className="text-gray-900">{student.email || primaryParent.email || "Not provided"}</span>
                  </div>
                </div>

                {additionalGuardians.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                      Additional Guardians
                    </span>
                    <div className="space-y-2">
                      {additionalGuardians.map((g, idx) => (
                        <div key={idx} className="grid grid-cols-[140px_1fr] gap-y-2 gap-x-2 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <span className="text-gray-500 font-medium">Name</span>
                          <span className="text-gray-900 font-medium">{g.name} ({g.relation || "Guardian"})</span>
                          <span className="text-gray-500 font-medium">Phone</span>
                          <span className="text-gray-900">{g.phone || "Not provided"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Not provided</p>
            )}
          </div>

          {/* Section 3: Health & Pickup Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 md:col-span-2">
            <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-500" />
              Health & Pickup Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Medical
                </span>
                <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-2">
                  <span className="text-gray-500 font-medium">Allergies</span>
                  <span className="text-gray-900">
                    {allergiesList.length > 0 ? allergiesList.join(", ") : "Not provided"}
                  </span>

                  <span className="text-gray-500 font-medium">Medical Notes</span>
                  <span className="text-gray-900">{medicalNotesText || "Not provided"}</span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Pickup
                </span>
                <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-2">
                  <span className="text-gray-500 font-medium">Authorized Person</span>
                  <span className="text-gray-900">{pickupPersonName || "Not provided"}</span>

                  <span className="text-gray-500 font-medium">Pickup Phone</span>
                  <span className="text-gray-900">{pickupPhoneNo || "Not provided"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Attendance Summary
          </h2>

          {student.attendanceSummary && student.attendanceSummary.total > 0 ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-center">
                  <span className="text-xs text-amber-700 font-medium block">Attendance %</span>
                  <span className="text-xl font-bold text-amber-900">{student.attendanceSummary.percentage}%</span>
                </div>
                <div className="bg-green-50 border border-green-200 p-3.5 rounded-lg text-center">
                  <span className="text-xs text-green-700 font-medium block">Present</span>
                  <span className="text-xl font-bold text-green-900">{student.attendanceSummary.present}</span>
                </div>
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg text-center">
                  <span className="text-xs text-red-700 font-medium block">Absent</span>
                  <span className="text-xl font-bold text-red-900">{student.attendanceSummary.absent}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-center">
                  <span className="text-xs text-slate-700 font-medium block">Leave</span>
                  <span className="text-xl font-bold text-slate-900">{student.attendanceSummary.leave}</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-lg text-center col-span-2 sm:col-span-1">
                  <span className="text-xs text-blue-700 font-medium block">Total Working Days</span>
                  <span className="text-xl font-bold text-blue-900">{student.attendanceSummary.total}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm italic">
              No attendance records available.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FEES */}
      {activeTab === "fees" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-500" />
              Fee Summary
            </h2>
            {student.feeSummary && student.feeSummary.status !== "no_fees" && (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/fees/${student._id}`)}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
              >
                View Full Fee Details →
              </button>
            )}
          </div>

          {student.feeSummary && student.feeSummary.status !== "no_fees" ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 block font-medium">Total Fees</span>
                  <span className="text-lg font-bold text-gray-900">₹{student.feeSummary.totalDue.toLocaleString()}</span>
                </div>
                <div className="bg-emerald-50 p-3.5 rounded-lg border border-emerald-200">
                  <span className="text-xs text-emerald-700 block font-medium">Paid</span>
                  <span className="text-lg font-bold text-emerald-900">₹{student.feeSummary.totalPaid.toLocaleString()}</span>
                </div>
                <div className="bg-amber-50 p-3.5 rounded-lg border border-amber-200">
                  <span className="text-xs text-amber-700 block font-medium">Pending Balance</span>
                  <span className="text-lg font-bold text-amber-900">₹{student.feeSummary.totalPending.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-700 block font-medium">Payment Status</span>
                  <span className="text-sm font-bold text-slate-900 capitalize">{student.feeSummary.status}</span>
                </div>
              </div>

              {student.feeSummary.recentTransactions && student.feeSummary.recentTransactions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-gray-700">Payment History</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Amount Due</th>
                          <th className="px-4 py-2.5">Amount Paid</th>
                          <th className="px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {student.feeSummary.recentTransactions.map((tx) => (
                          <tr key={tx._id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-600">{formatDate(tx.createdAt)}</td>
                            <td className="px-4 py-2.5 font-medium text-gray-900">₹{tx.amountDue?.toLocaleString()}</td>
                            <td className="px-4 py-2.5 font-medium text-emerald-700">₹{tx.amountPaid?.toLocaleString()}</td>
                            <td className="px-4 py-2.5 font-medium capitalize text-gray-700">{tx.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm italic">
              No fee transactions recorded.
            </div>
          )}
        </div>
      )}

      {/* Edit Student Modal */}
      <StudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editingStudent={student}
        onSuccess={() => {
          fetchStudentProfile();
        }}
      />
    </div>
  );
}
