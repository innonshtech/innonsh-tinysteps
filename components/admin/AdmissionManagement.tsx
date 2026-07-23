"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Modal from "@/components/common/Modal";
import Table from "@/components/common/Table";
import Card from "@/components/common/Card";
import Badge from "@/components/common/Badge";
import Alert from "@/components/common/Alert";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { showToast } from "@/lib/toast";
import { FileText, Send, Clock, CheckCircle, XCircle, Search, Users, Eye, Check, X } from "lucide-react";

interface Parent {
  _id?: string;
  name?: string;
  phone?: string;
  email?: string;
  relation?: string;
}

interface Admission {
  _id: string;
  admissionNo?: string;
  childFirstName: string;
  childLastName?: string;
  preferredClass?: string;
  parents?: Parent[];
  dob?: Date;
  gender?: string;
  status: "submitted" | "pending" | "approved" | "rejected" | "enrolled";
  appliedByParentId?: string;
  admissionFeePaid: boolean;
  createdAt?: string | Date;
  [key: string]: unknown;
}

export default function AdmissionManagement() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(null);

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admission/list");
      const data = await res.json();
      setAdmissions(data.admissions || []);
    } catch (error) {
      showToast.error("Failed to fetch admissions");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const endpoint =
        newStatus === "approved"
          ? `/api/admission/approve`
          : newStatus === "rejected"
            ? `/api/admission/reject`
            : null;
      if (!endpoint) return;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admissionId: id }),
      });
      if (res.ok) {
        showToast.success(`Admission ${newStatus}`);
        fetchAdmissions();
      }
    } catch (error) {
      showToast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: "success" | "warning" | "danger" | "info" | "gray" } = {
      submitted: "info",
      pending: "warning",
      approved: "success",
      rejected: "danger",
      enrolled: "success",
    };
    return colors[status] || "gray";
  };

  const filteredAdmissions = admissions.filter((admission) => {
    const parentName = admission.parents && admission.parents.length > 0 ? admission.parents[0].name : "";
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      admission.childFirstName.toLowerCase().includes(search) ||
      (admission.childLastName && admission.childLastName.toLowerCase().includes(search)) ||
      (admission.admissionNo && String(admission.admissionNo).toLowerCase().includes(search)) ||
      (admission.preferredClass && String(admission.preferredClass).toLowerCase().includes(search)) ||
      (parentName && parentName.toLowerCase().includes(search)) ||
      (admission.parents && admission.parents.some((p) => p.phone && p.phone.toLowerCase().includes(search)));

    const matchesStatus = !statusFilter || admission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "admissionNo",
      label: "Admission No.",
      render: (value: unknown, row: Record<string, unknown>) => {
        const adm = row as unknown as Admission;
        const isApproved = adm.status === "approved";
        const no = adm.admissionNo || adm.admission_no;
        return (
          <span className="font-medium text-gray-800">
            {isApproved && no ? String(no) : "-"}
          </span>
        );
      },
    },
    {
      key: "childFirstName",
      label: "Child Name",
      render: (value: unknown, row: Record<string, unknown>) => {
        const adm = row as unknown as Admission;
        const fullName = [adm.childFirstName, adm.childLastName].filter(Boolean).join(" ");
        return <span className="font-semibold text-gray-900">{fullName || "-"}</span>;
      },
    },
    {
      key: "parents",
      label: "Parent Name",
      render: (value: unknown, row: Record<string, unknown>) => {
        const adm = row as unknown as Admission;
        const parentName = adm.parents && adm.parents.length > 0 ? adm.parents[0].name : null;
        return <span className="text-gray-700">{parentName || "-"}</span>;
      },
    },
    {
      key: "preferredClass",
      label: "Applied Class",
      render: (value: unknown) => (
        <Badge variant="info" size="sm">
          {String(value || "-")}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Application Date",
      render: (value: unknown) => {
        if (!value) return <span className="text-gray-400">-</span>;
        const d = new Date(String(value));
        return (
          <span className="text-gray-600">
            {isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => (
        <Badge variant={getStatusColor(String(value))} size="sm">
          {String(value || "").toUpperCase()}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-4 pt-2 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admission Management</h1>
            <p className="text-sm text-gray-600 mt-1">Review and process admission applications</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-xs sm:text-sm font-medium mb-1">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{admissions.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm text-blue-600">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-current" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 text-xs sm:text-sm font-medium mb-1">Pending Review</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-600">
                {admissions.filter((a) => a.status === "pending" || a.status === "submitted").length}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm text-amber-600">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-current" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-700 text-xs sm:text-sm font-medium mb-1">Approved</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                {admissions.filter((a) => a.status === "approved").length}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm text-emerald-600">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-current" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-xs sm:text-sm font-medium mb-1">Rejected</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">
                {admissions.filter((a) => a.status === "rejected").length}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm text-red-600">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-gray-200 rounded-2xl flex flex-col" style={{ minHeight: '480px' }}>
        {/* Toolbar */}
        <div className="px-5 pt-4 pb-4 border-b border-gray-100 bg-white sticky top-[64px] z-20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, parent, or application no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 font-medium text-gray-700 text-sm transition-all"
              />
            </div>
            <div className="w-full md:w-auto relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-48 appearance-none pl-4 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 font-medium text-gray-700 text-sm transition-all"
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="enrolled">Enrolled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
          <Table
            columns={columns}
            data={filteredAdmissions as unknown as Record<string, unknown>[]}
            loading={loading}
            onRowClick={(row) => {
              setEditingAdmission(row as unknown as Admission);
              setModalOpen(true);
            }}
            actions={(row) => {
              const adm = row as unknown as Admission;
              const isPendingOrSubmitted = adm.status === "pending" || adm.status === "submitted";
              return (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {isPendingOrSubmitted && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(adm._id, "approved");
                        }}
                        className="p-1.5 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(adm._id, "rejected");
                        }}
                        className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAdmission(adm);
                      setModalOpen(true);
                    }}
                    className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              );
            }}
          />
        </div>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAdmission(null);
        }}
        title="Application Details"
        size="lg"
      >
        {editingAdmission && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Admission Number</p>
                <p className="text-base font-semibold text-gray-900">
                  {editingAdmission.status === "approved" && (editingAdmission.admissionNo || editingAdmission.admission_no)
                    ? String(editingAdmission.admissionNo || editingAdmission.admission_no)
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Child Name</p>
                <p className="text-base font-semibold text-gray-900">
                  {[editingAdmission.childFirstName, editingAdmission.childLastName].filter(Boolean).join(" ") || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Parent Name</p>
                <p className="text-base font-semibold text-gray-900">
                  {editingAdmission.parents && editingAdmission.parents.length > 0 ? editingAdmission.parents[0].name : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Parent Mobile Number</p>
                <p className="text-base font-semibold text-gray-900">
                  {editingAdmission.parents && editingAdmission.parents.length > 0 && editingAdmission.parents[0].phone
                    ? editingAdmission.parents[0].phone
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Applied Class</p>
                <p className="text-base font-semibold text-gray-900">{editingAdmission.preferredClass ? String(editingAdmission.preferredClass) : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Gender</p>
                <p className="text-base font-semibold text-gray-900">{editingAdmission.gender ? String(editingAdmission.gender) : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Date of Birth</p>
                <p className="text-base font-semibold text-gray-900">
                  {editingAdmission.dob
                    ? new Date(editingAdmission.dob).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Application Date</p>
                <p className="text-base font-semibold text-gray-900">
                  {editingAdmission.createdAt
                    ? new Date(String(editingAdmission.createdAt)).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Status</p>
                <Badge variant={getStatusColor(editingAdmission.status)}>
                  {editingAdmission.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}