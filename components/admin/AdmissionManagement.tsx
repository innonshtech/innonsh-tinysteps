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
import { FileText, Send, Clock, CheckCircle, XCircle, Search, Users, Eye, Check, X, Filter, ChevronDown, Plus } from "lucide-react";
import AddAdmissionModal from "@/components/admin/AddAdmissionModal";

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
  academicYear?: string;
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
  const [classFilter, setClassFilter] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<"status" | "class" | "academicYear">("status");
  const [modalOpen, setModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(null);

  const popoverRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAdmissions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

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

  // Helper to calculate academic year from date (e.g. 2026 -> "2026-2027")
  const getAcademicYear = (dateValue?: string | Date | null): string => {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    return `${year}-${year + 1}`;
  };

  const getAdmissionAcademicYear = (a: Admission): string => {
    if (a.academicYear && typeof a.academicYear === "string" && a.academicYear.trim().length > 0) {
      return a.academicYear;
    }
    const dateVal = a.createdAt || a.created_at || a.admissionDate || a.admission_date;
    return getAcademicYear(dateVal as string | Date);
  };

  // Derive available classes dynamically from admission data with standard defaults
  const availableClasses = Array.from(
    new Set([
      "Play Group", "Nursery", "KG1", "KG2",
      ...admissions.map((a) => a.preferredClass).filter((c): c is string => Boolean(c))
    ])
  );

  // Derive available academic years dynamically from real admission application dates
  const availableAcademicYears = Array.from(
    new Set(
      admissions
        .map((a) => getAdmissionAcademicYear(a))
        .filter((y): y is string => Boolean(y))
    )
  ).sort();

  const activeFilterCount = (statusFilter ? 1 : 0) + (classFilter ? 1 : 0) + (academicYearFilter ? 1 : 0);

  const filteredAdmissions = admissions.filter((admission) => {
    const parentName = admission.parents && admission.parents.length > 0 ? admission.parents[0].name : "";
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !search ||
      admission.childFirstName.toLowerCase().includes(search) ||
      (admission.childLastName && admission.childLastName.toLowerCase().includes(search)) ||
      (admission.admissionNo && String(admission.admissionNo).toLowerCase().includes(search)) ||
      (admission.preferredClass && String(admission.preferredClass).toLowerCase().includes(search)) ||
      (parentName && parentName.toLowerCase().includes(search)) ||
      (admission.parents && admission.parents.some((p) => p.phone && p.phone.toLowerCase().includes(search)));

    const matchesStatus = !statusFilter || admission.status === statusFilter;
    const matchesClass = !classFilter || admission.preferredClass === classFilter;
    const matchesAcademicYear =
      !academicYearFilter ||
      getAdmissionAcademicYear(admission) === academicYearFilter;

    return matchesSearch && matchesStatus && matchesClass && matchesAcademicYear;
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
          {/* ROW 1: Search, + Add New Admission, Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 h-[38px] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 font-medium text-gray-700 text-sm transition-all box-border min-w-0"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 h-[38px] bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl font-medium text-sm transition-all shadow-sm cursor-pointer whitespace-nowrap box-border flex-1 sm:flex-initial"
              >
                <Plus className="w-4 h-4" />
                Add New Admission
              </button>

              {/* Consolidated Filter Button & Popover */}
              <div className="relative flex-1 sm:flex-initial" ref={popoverRef}>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                  className={`flex items-center justify-between gap-2 px-4 h-[38px] border rounded-xl font-medium text-sm transition-all cursor-pointer box-border w-full ${
                    activeFilterCount > 0
                      ? "bg-orange-50 border-orange-300 text-orange-700 shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-current" />
                    <span>Filter{activeFilterCount > 0 ? ` ${activeFilterCount}` : ""}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Filter Popover Panel */}
                {isFilterOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-4 transition-all">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                      <span className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                        <Filter className="w-4 h-4 text-orange-500" />
                        Filter Applications
                      </span>
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter("");
                            setClassFilter("");
                            setAcademicYearFilter("");
                          }}
                          className="text-xs text-orange-600 hover:text-orange-700 font-semibold transition-colors cursor-pointer"
                        >
                          Reset All
                        </button>
                      )}
                    </div>

                    {/* Category Nav Tabs */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setActiveCategoryTab("status")}
                        className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center relative cursor-pointer ${
                          activeCategoryTab === "status"
                            ? "bg-white text-gray-900 shadow-sm font-semibold"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Status
                        {statusFilter && <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full"></span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCategoryTab("class")}
                        className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center relative cursor-pointer ${
                          activeCategoryTab === "class"
                            ? "bg-white text-gray-900 shadow-sm font-semibold"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Class
                        {classFilter && <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full"></span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCategoryTab("academicYear")}
                        className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center relative cursor-pointer ${
                          activeCategoryTab === "academicYear"
                            ? "bg-white text-gray-900 shadow-sm font-semibold"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Acad. Year
                        {academicYearFilter && <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full"></span>}
                      </button>
                    </div>

                    {/* Tab Content Panel */}
                    <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                      {/* Category 1: Status */}
                      {activeCategoryTab === "status" && (
                        <div className="space-y-1">
                          {[
                            { label: "All Statuses", value: "" },
                            { label: "Pending Review", value: "pending" },
                            { label: "Approved", value: "approved" },
                            { label: "Rejected", value: "rejected" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setStatusFilter(opt.value)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                statusFilter === opt.value
                                  ? "bg-orange-50 text-orange-700 font-semibold"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {statusFilter === opt.value && <Check className="w-3.5 h-3.5 text-orange-600" />}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Category 2: Class */}
                      {activeCategoryTab === "class" && (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setClassFilter("")}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                              classFilter === ""
                                ? "bg-orange-50 text-orange-700 font-semibold"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>All Classes</span>
                            {classFilter === "" && <Check className="w-3.5 h-3.5 text-orange-600" />}
                          </button>
                          {availableClasses.map((cls) => (
                            <button
                              key={cls}
                              type="button"
                              onClick={() => setClassFilter(cls)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                classFilter === cls
                                  ? "bg-orange-50 text-orange-700 font-semibold"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span>{cls}</span>
                              {classFilter === cls && <Check className="w-3.5 h-3.5 text-orange-600" />}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Category 3: Academic Year */}
                      {activeCategoryTab === "academicYear" && (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setAcademicYearFilter("")}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                              academicYearFilter === ""
                                ? "bg-orange-50 text-orange-700 font-semibold"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>All Academic Years</span>
                            {academicYearFilter === "" && <Check className="w-3.5 h-3.5 text-orange-600" />}
                          </button>
                          {availableAcademicYears.map((year) => (
                            <button
                              key={year}
                              type="button"
                              onClick={() => setAcademicYearFilter(year)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                academicYearFilter === year
                                  ? "bg-orange-50 text-orange-700 font-semibold"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span>{year}</span>
                              {academicYearFilter === year && <Check className="w-3.5 h-3.5 text-orange-600" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ROW 2: Active Filter Removable Chips Bar */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Filters:</span>
              {statusFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-lg shadow-sm">
                  Status: <span className="capitalize font-semibold">{statusFilter}</span>
                  <button type="button" onClick={() => setStatusFilter("")} className="hover:text-amber-950 transition-colors cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {classFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium rounded-lg shadow-sm">
                  Class: <span className="font-semibold">{classFilter}</span>
                  <button type="button" onClick={() => setClassFilter("")} className="hover:text-blue-950 transition-colors cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {academicYearFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-medium rounded-lg shadow-sm">
                  Academic Year: <span className="font-semibold">{academicYearFilter}</span>
                  <button type="button" onClick={() => setAcademicYearFilter("")} className="hover:text-purple-950 transition-colors cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("");
                  setClassFilter("");
                  setAcademicYearFilter("");
                }}
                className="text-xs text-red-600 hover:text-red-700 font-semibold underline ml-1 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}
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
                <p className="text-sm text-gray-600 font-medium">Academic Year</p>
                <p className="text-base font-semibold text-gray-900">{editingAdmission.academicYear ? String(editingAdmission.academicYear) : "-"}</p>
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

      {/* Add New Admission Modal */}
      <AddAdmissionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchAdmissions}
        availableClasses={availableClasses}
      />
    </div>
  );
}