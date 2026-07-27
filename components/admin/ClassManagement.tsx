"use client";
import React, { useState, useEffect } from "react";
import { ReactNode } from "react";
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
import { exportToCSV } from "@/utils/exportData";
import {
  School,
  Users,
  GraduationCap,
  DoorOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  Info,
  AlertCircle,
  Lock,
} from "lucide-react";

interface Teacher {
  _id: string;
  name: string;
  email: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName?: string;
  classId?: string | null;
}

interface Class {
  _id: string;
  name: string;
  section: string;
  teachers?: Teacher[];
  students?: Student[];
  roomNumber?: string;
  [key: string]: unknown;
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

export default function ClassManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);

  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    section: "",
    roomNumber: "",
    teachers: [] as string[],
    students: [] as string[],
  });

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchStudents();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/classes?limit=1000");
      const data = await res.json();
      setClasses(data.classes || []);
    } catch (error) {
      showToast.error("Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      setTeachers(data.teachers || []);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students?limit=500");
      const data = await res.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const normalizeClassName = (raw: string): string => {
    if (!raw) return "";
    return String(raw).trim().toLowerCase().replace(/\s+/g, " ");
  };

  const normalizeSection = (raw: string): string => {
    if (!raw) return "";
    let clean = String(raw).trim().toUpperCase();
    clean = clean.replace(/^(SECTION|SEC)\s+/i, "");
    const match = clean.match(/[A-Z]/);
    return match ? match[0] : clean;
  };

  // Students eligible for selection:
  // - When creating: only unassigned students (classId or class_id is null/undefined)
  // - When editing: unassigned students + students already in THIS class being edited
  const selectableStudents = students.filter((s) => {
    const studentClassId = s.classId ?? (s as any).class_id;
    if (!studentClassId) return true; // unassigned
    if (editingClass && String(studentClassId) === String(editingClass._id)) return true; // already in this class
    return false;
  });

  const currentEditingId = editingClass ? (editingClass._id || (editingClass as any).id) : null;

  const SUPPORTED_CLASSES = ["Play Group", "Nursery", "KG1", "KG2"];

  const classOptions = React.useMemo(() => {
    const existingNames = new Set<string>();
    classes.forEach((c) => {
      if (c.name?.trim()) existingNames.add(c.name.trim());
    });

    const list = [...SUPPORTED_CLASSES];
    existingNames.forEach((name) => {
      if (!list.some((item) => item.toLowerCase() === name.toLowerCase())) {
        list.push(name);
      }
    });

    const orderMap: Record<string, number> = {
      "play group": 1,
      "nursery": 2,
      "kg1": 3,
      "kg2": 4,
      "class 1": 5,
      "class 2": 6,
      "class 3": 7,
      "class 4": 8,
      "class 5": 9,
      "class 10": 14,
    };

    return list.sort((a, b) => {
      const orderA = orderMap[a.toLowerCase()] ?? 99;
      const orderB = orderMap[b.toLowerCase()] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });
  }, [classes]);

  const assignedSections = React.useMemo(() => {
    const cleanName = normalizeClassName(formData.name);
    if (!cleanName) return [];

    const set = new Set<string>();
    classes.forEach((c) => {
      const classId = c._id || (c as any).id;
      // CRITICAL: Exclude current record being edited by record ID
      if (currentEditingId && String(classId) === String(currentEditingId)) {
        return;
      }
      const cName = normalizeClassName(c.name);
      if (cName === cleanName && c.section) {
        const normSec = normalizeSection(c.section);
        if (normSec) {
          set.add(normSec);
        }
      }
    });

    return Array.from(set);
  }, [classes, formData.name, currentEditingId]);

  const availableSections = React.useMemo(() => {
    return ["A", "B", "C", "D"].filter((s) => !assignedSections.includes(s));
  }, [assignedSections]);

  const roomConflictOwner = React.useMemo(() => {
    const cleanRoom = formData.roomNumber.trim().toLowerCase();
    if (!cleanRoom) return null;

    const found = classes.find((c) => {
      const classId = c._id || (c as any).id;
      // Exclude current record in edit mode
      if (currentEditingId && String(classId) === String(currentEditingId)) {
        return false;
      }
      return c.roomNumber?.trim().toLowerCase() === cleanRoom;
    });

    if (!found) return null;
    return `${found.name} - Section ${found.section}`;
  }, [classes, formData.roomNumber, currentEditingId]);

  const filteredTeachers = React.useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
    );
  }, [teachers, teacherSearch]);

  const filteredSelectableStudents = React.useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return selectableStudents;
    return selectableStudents.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName || ""}`.toLowerCase();
      const idStr = String(s._id || (s as any).id || "").toLowerCase();
      return fullName.includes(q) || idStr.includes(q);
    });
  }, [selectableStudents, studentSearch]);

  useEffect(() => {
    if (!modalOpen) return;
    if (!formData.name.trim()) {
      if (formData.section !== "") {
        setFormData((prev) => ({ ...prev, section: "" }));
      }
      return;
    }
    if (assignedSections.includes(formData.section)) {
      if (availableSections.length > 0) {
        setFormData((prev) => ({ ...prev, section: availableSections[0] }));
      } else {
        setFormData((prev) => ({ ...prev, section: "" }));
      }
    } else if (!formData.section && availableSections.length > 0) {
      setFormData((prev) => ({ ...prev, section: availableSections[0] }));
    }
  }, [assignedSections, availableSections, formData.name, formData.section, modalOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClass = async () => {
    if (!formData.name.trim()) {
      showToast.error("Class name is required");
      return;
    }

    if (!formData.section || assignedSections.includes(formData.section)) {
      showToast.error("Selected section is invalid or already assigned");
      return;
    }

    if (roomConflictOwner) {
      showToast.error(`Room ${formData.roomNumber.trim()} is already assigned to ${roomConflictOwner}`);
      return;
    }

    try {
      setSaving(true);

      if (editingClass) {
        const currentData = {
          name: editingClass.name,
          section: editingClass.section,
          roomNumber: editingClass.roomNumber || "",
          teachers: editingClass.teachers?.map((t) => t._id) || [],
          students: editingClass.students?.map((s) => s._id) || [],
        };

        const hasChanged =
          formData.name !== currentData.name ||
          formData.section !== currentData.section ||
          formData.roomNumber !== currentData.roomNumber ||
          JSON.stringify([...formData.teachers].sort()) !== JSON.stringify([...currentData.teachers].sort()) ||
          JSON.stringify([...formData.students].sort()) !== JSON.stringify([...currentData.students].sort());

        if (!hasChanged) {
          showToast.info("No changes detected");
          setModalOpen(false);
          setEditingClass(null);
          setSaving(false);
          return;
        }
      }

      const method = editingClass ? "PUT" : "POST";
      const url = editingClass ? `/api/classes/${editingClass._id}` : "/api/classes";

      console.log(`[ClassManagement] ${method} to ${url}`, formData);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const result = await res.json();
        showToast.success(`Class ${editingClass ? "updated" : "added"} successfully`);

        if (!editingClass && result.class) {
          const selectedTeacherObjs = teachers.filter((t) =>
            (formData.teachers || []).includes(t._id || (t as any).id)
          );
          const selectedStudentObjs = students.filter((s) =>
            (formData.students || []).includes(s._id || (s as any).id)
          );
          const newClassObj: Class = {
            _id: result.class._id || result.class.id,
            id: result.class.id || result.class._id,
            name: result.class.name,
            section: result.class.section,
            roomNumber: result.class.roomNumber || "",
            teachers: selectedTeacherObjs,
            students: selectedStudentObjs,
            createdAt: new Date().toISOString(),
          };
          setClasses((prev) => [newClassObj, ...prev]);
        }

        setModalOpen(false);
        setEditingClass(null);
        setFormData({ name: "", section: "", roomNumber: "", teachers: [], students: [] });
        setTeacherSearch("");
        setStudentSearch("");
        setSaving(false);

        // Run background data synchronization without blocking the modal response
        Promise.all([fetchClasses(), fetchStudents()]).catch((err) =>
          console.error("[ClassManagement] Background sync error:", err)
        );
      } else {
        const errorData = await res.json();
        console.error("[ClassManagement] Error response:", errorData);
        showToast.error(errorData.error || "Failed to save class");
      }
    } catch (error) {
      console.error("[ClassManagement] Fetch error:", error);
      showToast.error("Failed to save class");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      section: cls.section,
      roomNumber: cls.roomNumber || "",
      teachers: cls.teachers?.map((t) => t._id) || [],
      students: cls.students?.map((s) => s._id) || [],
    });
    setTeacherSearch("");
    setStudentSearch("");
    setModalOpen(true);
  };

  const handleDeleteClass = (cls: Class) => {
    setDeletingClass(cls);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingClass) return;
    const deletedTargetId = deletingClass._id || (deletingClass as any).id;

    try {
      const res = await fetch(`/api/classes/${deletedTargetId}`, { method: "DELETE" });
      if (res.ok) {
        // 1. Immediately show toast & close modal upon server DELETE confirmation
        showToast.success("Class deleted successfully");
        setShowDeleteModal(false);
        setDeletingClass(null);

        // 2. Immediately update local classes state to remove deleted class from table & statistics
        setClasses((prev) =>
          prev.filter(
            (c) =>
              String(c._id) !== String(deletedTargetId) &&
              String(c.id) !== String(deletedTargetId)
          )
        );

        // 3. Immediately update local students state to unassign students from deleted class
        setStudents((prev) =>
          prev.map((s) => {
            const sClassId = s.classId ?? (s as any).class_id;
            if (sClassId && String(sClassId) === String(deletedTargetId)) {
              return {
                ...s,
                classId: undefined,
                class_id: undefined,
                className: undefined,
                section: undefined,
                class: undefined,
              };
            }
            return s;
          })
        );

        // 4. Run background non-blocking sync in parallel without delaying UI responsiveness
        Promise.all([fetchClasses(), fetchStudents()]).catch((err) =>
          console.error("[ClassManagement] Background sync error after delete:", err)
        );
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast.error(errorData.error || "Failed to delete class");
      }
    } catch (error) {
      console.error("[ClassManagement] Delete error:", error);
      showToast.error("Failed to delete class");
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
  const totalTeachers = teachers.length;
  const totalRooms = classes.filter((cls) => cls.roomNumber).length;

  const columns: Column[] = [
    {
      key: "name",
      label: "Class Name",
      render: (value: unknown) => (
        <span className="font-semibold text-gray-800">{String(value)}</span>
      ),
    },
    {
      key: "section",
      label: "Section",
      render: (value: unknown) => (
        <Badge variant="info" size="sm">
          Section {String(value)}
        </Badge>
      ),
    },
    {
      key: "roomNumber",
      label: "Room Number",
      render: (value: unknown) =>
        value ? String(value) : <span className="text-gray-400 text-sm">-</span>,
    },
    {
      key: "teachers",
      label: "Teachers",
      render: (value: unknown) => {
        const teachers = value as Teacher[];
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-gray-700">{teachers?.length || 0}</span>
            </div>
            {teachers && teachers.length > 0 && (
              <div
                className="text-xs text-gray-500 truncate max-w-[150px]"
                title={teachers.map((t) => t.name).join(", ")}
              >
                {teachers.map((t) => t.name).join(", ")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "students",
      label: "Students",
      render: (value: unknown) => {
        const students = value as Student[];
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-pink-600" />
              <span className="font-medium text-gray-700">{students?.length || 0}</span>
            </div>
            {students && students.length > 0 && (
              <div className="text-xs text-gray-500">{students.length} enrolled</div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 pt-2 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Class Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage all classes and sections</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => exportToCSV(classes, "classes.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Classes */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium mb-2">Total Classes</p>
              <p className="text-2xl font-bold text-orange-600">{classes.length}</p>
            </div>
            <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm text-orange-600">
              <School className="w-5 h-5 text-current" />
            </div>
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-700 text-sm font-medium mb-2">Total Students</p>
              <p className="text-2xl font-bold text-pink-600">{totalStudents}</p>
            </div>
            <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm text-pink-600">
              <Users className="w-5 h-5 text-current" />
            </div>
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-2">Total Teachers</p>
              <p className="text-2xl font-bold text-purple-600">{totalTeachers}</p>
            </div>
            <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm text-purple-600">
              <GraduationCap className="w-5 h-5 text-current" />
            </div>
          </div>
        </div>

        {/* Assigned Rooms */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-2">Assigned Rooms</p>
              <p className="text-2xl font-bold text-blue-600">{totalRooms}</p>
            </div>
            <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm text-blue-600">
              <DoorOpen className="w-5 h-5 text-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {/* Card Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">All Classes</h2>
            <p className="text-gray-600 text-sm mt-1">
              {filteredClasses.length} {filteredClasses.length === 1 ? "class" : "classes"} found
            </p>
          </div>
          <button type="button"
            onClick={() => {
              setEditingClass(null);
              setFormData({ name: "", section: "", roomNumber: "", teachers: [], students: [] });
              setTeacherSearch("");
              setStudentSearch("");
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Class
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by class name, section, or room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={filteredClasses}
          loading={loading}
          actions={(row) => (
            <div className="flex gap-2">
              <button type="button"
                onClick={() => handleEditClass(row as Class)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button type="button"
                onClick={() => handleDeleteClass(row as Class)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingClass(null);
        }}
        title={editingClass ? "Edit Class" : "Add New Class"}
        footer={
          <>
            <Button type="button"
              onClick={() => {
                setModalOpen(false);
                setEditingClass(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddClass}
              variant="primary"
              loading={saving}
              disabled={
                !formData.name.trim() ||
                !formData.section ||
                assignedSections.includes(formData.section) ||
                assignedSections.length === 4 ||
                Boolean(roomConflictOwner)
              }
            >
              {editingClass ? "Update" : "Add"} Class
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
              {editingClass ? (
                <Edit2 className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-white" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {editingClass ? "Edit Class" : "Add New Class"}
            </h2>
          </div>

          <Select
            label="Class Name *"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            fullWidth
            placeholder="Select Class"
            options={classOptions.map((className) => ({
              value: className,
              label: className,
            }))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section *</label>
            <div className="grid grid-cols-4 gap-3">
              {["A", "B", "C", "D"].map((section) => {
                const isClassSelected = Boolean(formData.name.trim());
                const isAssigned = isClassSelected && assignedSections.includes(section);
                const isSelected = isClassSelected && formData.section === section;
                const isEditCurrent =
                  editingClass &&
                  normalizeClassName(editingClass.name) === normalizeClassName(formData.name) &&
                  normalizeSection(editingClass.section) === section;

                return (
                  <button
                    key={section}
                    type="button"
                    disabled={!isClassSelected || isAssigned}
                    onClick={() => {
                      if (isClassSelected && !isAssigned) {
                        setFormData((prev) => ({ ...prev, section }));
                      }
                    }}
                    className={`px-2 py-2.5 rounded-lg border-2 transition-all text-center flex flex-col items-center justify-center min-h-[62px] w-full ${
                      !isClassSelected
                        ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                        : isAssigned
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-75"
                        : isSelected
                        ? "border-orange-500 bg-orange-50 text-orange-700 font-medium shadow-sm cursor-pointer"
                        : "border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50/30 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`text-base font-bold leading-none ${isAssigned ? "line-through text-gray-400" : ""}`}>
                        {section}
                      </span>
                      {isAssigned && <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                    </div>
                    <span
                      className={`text-[10px] font-medium block mt-0.5 ${
                        !isClassSelected
                          ? "text-gray-400"
                          : isAssigned
                          ? "text-gray-400"
                          : isSelected
                          ? "text-orange-600 font-semibold"
                          : "text-gray-400"
                      }`}
                    >
                      {!isClassSelected
                        ? "Inactive"
                        : isAssigned
                        ? "Assigned"
                        : isSelected
                        ? isEditCurrent
                          ? "Current"
                          : "Selected"
                        : "Available"}
                    </span>
                  </button>
                );
              })}
            </div>

            {!formData.name.trim() ? (
              <p className="mt-2 text-xs text-gray-400 italic">Select a class name above to view section availability.</p>
            ) : (
              assignedSections.length > 0 && (
                <div className="mt-2.5 text-xs font-medium">
                  {assignedSections.length === 4 ? (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>
                        All sections for <strong>{formData.name.trim()}</strong> are already assigned.
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/60 text-amber-800 flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        {assignedSections.length === 1
                          ? `Section ${assignedSections[0]} is already assigned to `
                          : `Sections ${[...assignedSections].sort().slice(0, -1).join(", ")} and ${[...assignedSections].sort().slice(-1)} are already assigned to `}
                        <strong>{formData.name.trim()}</strong>.
                      </span>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Room Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
            <div className="relative">
              <DoorOpen className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleInputChange}
                placeholder="e.g., 101, 102, A-Wing"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  roomConflictOwner
                    ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                    : "border-gray-300 focus:ring-orange-400 focus:border-transparent"
                }`}
              />
            </div>
            {roomConflictOwner && (
              <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>
                  Room <strong>{formData.roomNumber.trim()}</strong> is already assigned to {roomConflictOwner}.
                </span>
              </p>
            )}
          </div>

          {/* Assign Teachers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                Assign Teachers
              </label>
              {formData.teachers.length > 0 && (
                <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  {formData.teachers.length} teacher{formData.teachers.length !== 1 ? "s" : ""} selected
                </span>
              )}
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              <div className="p-2 border-b border-gray-200 bg-gray-50/50">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search teachers by name or email..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                  />
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                {filteredTeachers.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500 text-center">
                    {teachers.length === 0 ? "No teachers available" : "No matching teachers found"}
                  </div>
                ) : (
                  filteredTeachers.map((teacher) => {
                    const isChecked = formData.teachers.includes(teacher._id);
                    return (
                      <label
                        key={teacher._id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                          isChecked ? "bg-purple-50/60" : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                teachers: [...prev.teachers, teacher._id],
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                teachers: prev.teachers.filter((id) => id !== teacher._id),
                              }));
                            }
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-400"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{teacher.name}</div>
                          <div className="text-xs text-gray-500 truncate">{teacher.email}</div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Assign Students */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-600" />
                Assign Students
              </label>
              {formData.students.length > 0 && (
                <span className="text-xs font-semibold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
                  {formData.students.length} student{formData.students.length !== 1 ? "s" : ""} selected
                </span>
              )}
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              <div className="p-2 border-b border-gray-200 bg-gray-50/50">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search eligible students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-400 bg-white"
                  />
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                {filteredSelectableStudents.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500 text-center">
                    {selectableStudents.length === 0 ? "No eligible students available" : "No matching students found"}
                  </div>
                ) : (
                  filteredSelectableStudents.map((student) => {
                    const isChecked = formData.students.includes(student._id);
                    return (
                      <label
                        key={student._id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                          isChecked ? "bg-pink-50/60" : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                students: [...prev.students, student._id],
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                students: prev.students.filter((id) => id !== student._id),
                              }));
                            }
                          }}
                          className="w-4 h-4 text-pink-600 rounded focus:ring-2 focus:ring-pink-400"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {student.firstName} {student.lastName || ""}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingClass(null);
        }}
        title="Confirm Deletion"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button type="button"
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingClass(null);
              }}
            >
              Cancel
            </Button>
            <button type="button"
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center p-2">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Class?</h3>
          <p className="text-gray-500 mb-2">
            Are you sure you want to delete{" "}
            <span className="font-bold text-red-600">
              {deletingClass?.name} - Section {deletingClass?.section}
            </span>
            ?
          </p>
          <p className="text-xs text-gray-400">
            This action cannot be undone. All classes data will be permanently removed.
          </p>
        </div>
      </Modal>
    </div>
  );
}