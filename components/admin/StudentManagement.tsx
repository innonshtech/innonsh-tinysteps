"use client";
import React, { useState, useEffect } from "react";
import { ReactNode } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import Modal from "@/components/common/Modal";
import StudentModal from "@/components/admin/StudentModal";
import Table from "@/components/common/Table";
import Card from "@/components/common/Card";
import Badge from "@/components/common/Badge";
import Alert from "@/components/common/Alert";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { exportToCSV, exportStudentsToCSV } from "@/utils/exportData";
import { validateParentLoginEmail, normalizeEmail } from "@/lib/validations/emailValidation";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  AlertCircle,
  X,
  Eye,
  Key,
  ChevronDown,
} from "lucide-react";

interface Parent {
  name: string;
  phone: string;
  email: string;
  relation: string;
}

interface MedicalInfo {
  allergies: string[];
  notes: string;
}

interface PickupInfo {
  pickupPerson: string;
  pickupPhone: string;
}

interface Student {
  _id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  hasParentPassword?: boolean;
  admissionNo?: string;
  admissionDate?: Date;
  classId?: string;
  className?: string;
  section?: string;
  class?: {
    _id?: string;
    id?: string;
    name?: string;
    section?: string;
  };
  dob?: Date;
  gender?: string;
  parents?: Parent[];
  medical?: MedicalInfo;
  pickupInfo?: PickupInfo;
  [key: string]: unknown; // Added index signature
}

interface Class {
  _id: string;
  name: string;
  section: string;
}

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
  width?: string;
}

export default function StudentManagement() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // --- Fee assignment at enrollment ---
  interface FeeStructureForClass {
    _id: string;
    name: string;
    heads: { title: string; amount: number; frequency: string }[];
  }
  const [classStructures, setClassStructures] = useState<FeeStructureForClass[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState("");
  const [selectedHeads, setSelectedHeads] = useState<Record<string, boolean>>({});
  const [feeMonth, setFeeMonth] = useState(new Date().getMonth().toString());
  const [feeYear, setFeeYear] = useState(new Date().getFullYear().toString());
  const [feeDueDate, setFeeDueDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0]
  );
  const [loadingStructures, setLoadingStructures] = useState(false);
  // ------------------------------------

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dob: string;
    gender: string;
    classId: string;
    section: string;
    admissionNo: string;
    admissionDate: string;
    parents: Parent[];
    medical: MedicalInfo;
    pickupInfo: PickupInfo;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dob: "",
    gender: "",
    classId: "",
    section: "",
    admissionNo: "",
    admissionDate: "",
    parents: [{ name: "", phone: "", email: "", relation: "" }],
    medical: {
      allergies: [],
      notes: "",
    },
    pickupInfo: {
      pickupPerson: "",
      pickupPhone: "",
    },
  });

  const [phoneErrors, setPhoneErrors] = useState<Record<string, string>>({});
  const [emailError, setEmailError] = useState<string>("");
  const [gmailTypoSuggestion, setGmailTypoSuggestion] = useState<string | null>(null);

  const handleEmailBlur = (email: string) => {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      setEmailError("");
      setGmailTypoSuggestion(null);
      return;
    }

    const res = validateParentLoginEmail(normalized);
    if (!res.valid) {
      if (res.type === "gmail_typo" && res.suggestion) {
        setEmailError("");
        setGmailTypoSuggestion(res.suggestion);
      } else {
        setEmailError(res.error || "Enter a valid email address.");
        setGmailTypoSuggestion(null);
      }
    } else {
      setEmailError("");
      setGmailTypoSuggestion(null);
    }
  };

  const handleFixGmailTypo = (suggestedDomain: string) => {
    const currentEmail = formData.email.trim();
    const atIdx = currentEmail.lastIndexOf("@");
    if (atIdx !== -1) {
      const local = currentEmail.slice(0, atIdx);
      const fixedEmail = `${local}@${suggestedDomain}`;
      setFormData((prev) => {
        const updatedParents = [...prev.parents];
        if (updatedParents.length > 0) {
          updatedParents[0] = { ...updatedParents[0], email: fixedEmail };
        }
        return { ...prev, email: fixedEmail, parents: updatedParents };
      });
      setEmailError("");
      setGmailTypoSuggestion(null);
    }
  };

  const handlePhoneBlur = (key: string, value: string) => {
    if (value && value.trim().length > 0 && value.trim().length < 10) {
      setPhoneErrors((prev) => ({
        ...prev,
        [key]: "Enter a valid 10-digit phone number.",
      }));
    } else {
      setPhoneErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const getTodayFormatted = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const resetForm = () => {
    setEditingStudent(null);
    setSelectedClassName("");
    setSelectedSection("");
    setPhoneErrors({});
    setEmailError("");
    setGmailTypoSuggestion(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      dob: "",
      gender: "",
      classId: "",
      section: "",
      admissionNo: "",
      admissionDate: getTodayFormatted(),
      parents: [{ name: "", phone: "", email: "", relation: "Father" }],
      medical: {
        allergies: [],
        notes: "",
      },
      pickupInfo: {
        pickupPerson: "",
        pickupPhone: "",
      },
    });
    setClassStructures([]);
    setSelectedStructureId("");
    setSelectedHeads({});
  };

  const ACADEMIC_ORDER = [
    "play group",
    "playgroup",
    "nursery",
    "kg1",
    "lkg",
    "kg2",
    "ukg",
    "class 1",
    "class 2",
    "class 3",
    "class 4",
    "class 5",
    "class 6",
    "class 7",
    "class 8",
    "class 9",
    "class 10",
  ];

  const getAcademicSortWeight = (name: string): number => {
    const cleanName = name.trim().toLowerCase();
    const idx = ACADEMIC_ORDER.indexOf(cleanName);
    if (idx !== -1) return idx;
    const match = cleanName.match(/\d+/);
    if (match) return 100 + parseInt(match[0], 10);
    return 500;
  };

  const uniqueClassNames = Array.from(
    new Set(classes.map((c) => c.name).filter(Boolean))
  ).sort((a, b) => getAcademicSortWeight(a) - getAcademicSortWeight(b));

  const DEFAULT_SECTIONS = ["A", "B", "C", "D"];

  const availableSections = React.useMemo(() => {
    if (!selectedClassName) return [];
    return DEFAULT_SECTIONS;
  }, [selectedClassName]);

  const matchedClassRecord = React.useMemo(() => {
    if (!selectedClassName || !selectedSection) return null;
    return classes.find(
      (c) =>
        c.name.trim().toLowerCase() === selectedClassName.trim().toLowerCase() &&
        c.section.trim().toUpperCase() === selectedSection.trim().toUpperCase()
    );
  }, [classes, selectedClassName, selectedSection]);

  const isClassUncreated = Boolean(
    selectedClassName && selectedSection && !matchedClassRecord
  );

  const handleClearClassAssignment = () => {
    setSelectedClassName("");
    setSelectedSection("");
    setFormData((prev) => ({ ...prev, classId: "", section: "" }));
    setClassStructures([]);
    setSelectedStructureId("");
    setSelectedHeads({});
  };

  const handleClassNameChange = (className: string) => {
    setSelectedClassName(className);
    setSelectedSection("");
    setFormData((prev) => ({ ...prev, classId: "", section: "" }));
    setClassStructures([]);
    setSelectedStructureId("");
    setSelectedHeads({});
  };

  const handleSectionChange = (section: string) => {
    setSelectedSection(section);
    const matchedClass = classes.find(
      (c) =>
        c.name.trim().toLowerCase() === selectedClassName.trim().toLowerCase() &&
        c.section.trim().toUpperCase() === section.trim().toUpperCase()
    );

    if (matchedClass) {
      const classId = matchedClass._id || (matchedClass as any).id;
      setFormData((prev) => ({ ...prev, classId, section }));
      fetchStructuresForClass(classId);
    } else {
      setFormData((prev) => ({ ...prev, classId: "", section }));
      setClassStructures([]);
      setSelectedStructureId("");
      setSelectedHeads({});
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students?limit=500");
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      showToast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      const data = await res.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const handleParentChange = (index: number, field: string, value: string) => {
    const updatedParents = [...formData.parents];
    updatedParents[index] = { ...updatedParents[index], [field]: value };
    setFormData((prev) => ({ ...prev, parents: updatedParents }));
  };

  const handleAddParent = () => {
    setFormData((prev) => ({
      ...prev,
      parents: [...prev.parents, { name: "", phone: "", email: "", relation: "Mother" }],
    }));
  };

  const handleRemoveParent = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      parents: prev.parents.filter((_, i) => i !== index),
    }));
  };

  const handleAddAllergy = (allergy: string) => {
    if (allergy.trim()) {
      setFormData((prev) => ({
        ...prev,
        medical: {
          ...prev.medical,
          allergies: [...prev.medical.allergies, allergy.trim()],
        },
      }));
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      medical: {
        ...prev.medical,
        allergies: prev.medical.allergies.filter((_, i) => i !== index),
      },
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "email") {
      const normalized = normalizeEmail(value);
      if (emailError || gmailTypoSuggestion) {
        const check = validateParentLoginEmail(normalized);
        if (check.valid) {
          setEmailError("");
          setGmailTypoSuggestion(null);
        }
      }
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Sync primary parent email with Parent Login Email
      if (name === "email") {
        const updatedParents = [...prev.parents];
        if (updatedParents.length > 0) {
          updatedParents[0] = { ...updatedParents[0], email: value };
        } else {
          updatedParents.push({ name: "", phone: "", email: value, relation: "Father" });
        }
        updated.parents = updatedParents;
      }
      return updated;
    });

    // When class changes, fetch available fee structures
    if (name === "classId" && value) {
      fetchStructuresForClass(value);
    } else if (name === "classId" && !value) {
      setClassStructures([]);
      setSelectedStructureId("");
      setSelectedHeads({});
    }
  };

  const fetchStructuresForClass = async (classId: string) => {
    setLoadingStructures(true);
    try {
      const res = await fetch("/api/fees");
      const data = await res.json();
      const all: FeeStructureForClass[] = data.items || [];
      const filtered = all.filter(
        (s: any) => !s.classId || s.classId === classId || s.classId?._id === classId
      );
      setClassStructures(filtered);
      setSelectedStructureId("");
      setSelectedHeads({});
    } catch {
      console.error("Failed to load fee structures");
    } finally {
      setLoadingStructures(false);
    }
  };

  const handleStructureSelect = (structureId: string) => {
    setSelectedStructureId(structureId);
    const structure = classStructures.find((s) => s._id === structureId);
    if (structure) {
      const allSelected: Record<string, boolean> = {};
      structure.heads.forEach((h) => { allSelected[h.title] = true; });
      setSelectedHeads(allSelected);
    } else {
      setSelectedHeads({});
    }
  };

  const handleAddStudent = async () => {
    if (!formData.firstName || !formData.firstName.trim()) {
      showToast.error("First name is required");
      return;
    }

    if (!formData.dob) {
      showToast.error("Date of birth is required");
      return;
    }

    if (!formData.gender) {
      showToast.error("Gender is required");
      return;
    }

    let targetClassId: string | null = null;
    if (selectedClassName && selectedSection) {
      const matched = classes.find(
        (c) =>
          c.name.trim().toLowerCase() === selectedClassName.trim().toLowerCase() &&
          c.section.trim().toUpperCase() === selectedSection.trim().toUpperCase()
      );
      if (matched) {
        targetClassId = matched._id || (matched as any).id;
      }
    }

    const cleanEmail = normalizeEmail(formData.email || "");

    if (!editingStudent || cleanEmail) {
      if (!cleanEmail) {
        showToast.error("Parent Login Email is required");
        return;
      }

      const emailResult = validateParentLoginEmail(cleanEmail);
      if (!emailResult.valid) {
        if (emailResult.type === "gmail_typo" && emailResult.suggestion) {
          setGmailTypoSuggestion(emailResult.suggestion);
          setEmailError("");
          showToast.error(`Did you mean @${emailResult.suggestion}?`);
        } else {
          setEmailError(emailResult.error || "Enter a valid email address.");
          setGmailTypoSuggestion(null);
          showToast.error(emailResult.error || "Enter a valid email address.");
        }
        return;
      }
    }

    if (!editingStudent && !formData.password) {
      showToast.error("Parent Login Password is required");
      return;
    }

    // Validation: Fee Structure is MANDATORY for new students
    if (!editingStudent && !selectedStructureId && classStructures.length > 0) {
      showToast.error("Please assign a Fee Structure to proceed");
      return;
    }

    // Ensure primary parent email is synced with Parent Login Email
    const parentsWithSync = (formData.parents || []).map((p, idx) => {
      if (idx === 0) {
        return { ...p, email: formData.email.trim() };
      }
      return p;
    });

    // Validation: Parent/Guardian entries
    let parentsPayload: any[] | undefined = undefined;

    if (!editingStudent) {
      // Mandatory validation for NEW student creation
      if (!parentsWithSync || parentsWithSync.length === 0) {
        showToast.error("At least one parent/guardian is required");
        return;
      }
      if (!parentsWithSync[0].name || !parentsWithSync[0].name.trim()) {
        showToast.error("Parent Name is required");
        return;
      }
      if (!parentsWithSync[0].phone || !/^\d{10}$/.test(parentsWithSync[0].phone.trim())) {
        showToast.error("Enter a valid 10-digit phone number.");
        return;
      }
      // Validate additional guardians if present
      for (let i = 1; i < parentsWithSync.length; i++) {
        const p = parentsWithSync[i];
        if (p.name.trim() || p.phone.trim() || p.email.trim()) {
          if (!p.name.trim()) {
            showToast.error(`Guardian ${i + 1} Name is required`);
            return;
          }
          if (p.phone && p.phone.trim() && !/^\d{10}$/.test(p.phone.trim())) {
            showToast.error(`Guardian ${i + 1} phone must be a valid 10-digit number.`);
            return;
          }
        }
      }
      parentsPayload = parentsWithSync;
    } else {
      // Flexible validation for EDITING an existing student
      const filledParents = parentsWithSync.filter(
        (p) => p.name.trim() || p.phone.trim() || p.email.trim() || p.relation.trim()
      );
      if (filledParents.length > 0) {
        for (let i = 0; i < filledParents.length; i++) {
          const p = filledParents[i];
          if (!p.name.trim()) {
            showToast.error("Parent Name is required if parent details are modified");
            return;
          }
          if (p.phone && p.phone.trim() && !/^\d{10}$/.test(p.phone.trim())) {
            showToast.error("Enter a valid 10-digit phone number.");
            return;
          }
        }
        parentsPayload = filledParents;
      }
    }

    try {
      const method = editingStudent ? "PUT" : "POST";
      const url = editingStudent ? `/api/students/${editingStudent._id}` : "/api/students";

      const payload = {
        ...formData,
        classId: targetClassId,
        section: targetClassId ? selectedSection : "",
        ...(parentsPayload !== undefined ? { parents: parentsPayload } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedData = await res.json();
        const studentId = editingStudent ? editingStudent._id : savedData.student?._id || savedData._id;

        // --- Assign selected fee heads if this is a new student and a structure was chosen ---
        if (!editingStudent && selectedStructureId && studentId) {
          const structure = classStructures.find((s) => s._id === selectedStructureId);
          if (structure) {
            const items = structure.heads
              .filter((h) => selectedHeads[h.title])
              .map((h) => ({ head: h.title, amount: h.amount }));
            const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);

            if (items.length > 0 && totalAmount > 0) {
              const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
              await fetch("/api/fees/transactions/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  studentId,
                  items,
                  amountDue: totalAmount,
                  dueDate: feeDueDate,
                  note: `${structure.name} - ${monthNames[parseInt(feeMonth)]} ${feeYear}`,
                }),
              });
            }
          }
        }

        showToast.success(`Student ${editingStudent ? "updated" : "added"} successfully`);
        setModalOpen(false);
        resetForm();
        fetchStudents();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast.error(errData.error || "Failed to save student");
      }
    } catch (error) {
      showToast.error("An error occurred");
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setDeletingStudent(student);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingStudent) return;
    try {
      const res = await fetch(`/api/students/${deletingStudent._id}`, { method: "DELETE" });
      if (res.ok) {
        showToast.success("Student deleted successfully");
        setShowDeleteModal(false);
        setDeletingStudent(null);
        fetchStudents();
      }
    } catch {
      showToast.error("Failed to delete student");
    }
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName || ""}`.toLowerCase();
    const admNo = (student.admissionNo || "").toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(searchLower) || admNo.includes(searchLower);

    const matchesClass = (() => {
      if (!selectedClass) return true;
      if (selectedClass === "unassigned") {
        return !student.classId && !student.class && !student.className;
      }
      const cId = typeof student.classId === "object"
        ? (student.classId as any)?._id || (student.classId as any)?.id
        : student.classId;
      return cId === selectedClass;
    })();

    return matchesSearch && matchesClass;
  });

  const columns: Column[] = [
    {
      key: "admissionNo",
      label: "Admission No.",
      width: "22%",
      render: (value: unknown) => (
        <div className="whitespace-nowrap">
          {value ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              {String(value)}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: "studentName",
      label: "Student Name",
      width: "28%",
      render: (_: unknown, row: Record<string, unknown>) => {
        const item = row as unknown as Student;
        const name = `${item.firstName} ${item.lastName || ""}`.trim();
        return (
          <div className="whitespace-nowrap font-medium text-gray-900">
            {name}
          </div>
        );
      },
    },
    {
      key: "section",
      label: "Class & Section",
      width: "25%",
      render: (_: unknown, row: Record<string, unknown>) => {
        const item = row as unknown as Student;
        const cls = item.class;
        const className = item.className || cls?.name;
        const sectionName = item.section || cls?.section;

        if (className && sectionName && String(sectionName) !== "undefined") {
          return <div className="whitespace-nowrap text-gray-700 font-medium">{className} - {String(sectionName)}</div>;
        }
        if (className) {
          return <div className="whitespace-nowrap text-gray-700 font-medium">{className}</div>;
        }
        if (sectionName && String(sectionName) !== "undefined") {
          return <div className="whitespace-nowrap text-gray-700 font-medium">Section {String(sectionName)}</div>;
        }
        return (
          <div className="whitespace-nowrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
              Not Assigned
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 pt-2 bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage all students in the system</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => exportStudentsToCSV(students, "students.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all cursor-pointer">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-700 text-sm font-medium mb-2">Total Students</p>
              <p className="text-2xl font-bold text-pink-600">{students.length}</p>
            </div>
            <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm text-pink-600">
              <Users className="w-5 h-5 text-current" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-2">Enrolled</p>
              <p className="text-2xl font-bold text-green-600">
                {students.filter((s) => s.classId || s.class || s.className).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm text-green-600">
              <UserCheck className="w-5 h-5 text-current" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-700 text-sm font-medium mb-2">Not Assigned</p>
              <p className="text-2xl font-bold text-amber-600">
                {students.filter((s) => !s.classId && !s.class && !s.className).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm text-amber-600">
              <UserX className="w-5 h-5 text-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">All Students</h2>
            <p className="text-gray-600 text-sm mt-1">
              {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"} found
            </p>
          </div>
          <button type="button"
            onClick={() => {
              setEditingStudent(null);
              resetForm();
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg font-medium transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative min-w-[190px]">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm cursor-pointer"
              >
                <option value="">All Classes</option>
                <option value="unassigned">Unassigned</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name} — {cls.section}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-gray-500" />
            </div>
            {selectedClass && (
              <button type="button"
                onClick={() => setSelectedClass("")}
                className="px-3 py-2.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div>
          <Table
            columns={columns}
            data={filteredStudents}
            loading={loading}
            actionsWidth="25%"
            actions={(row) => {
              const studentItem = row as unknown as Student;
              return (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/students/${studentItem._id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-all text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap h-[32px]"
                    title="View Student Profile"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditStudent(studentItem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition-all text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap h-[32px]"
                    title="Edit Student"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(studentItem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-all text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap h-[32px]"
                    title="Delete Student"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <StudentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingStudent(null);
        }}
        editingStudent={editingStudent}
        onSuccess={() => {
          fetchStudents();
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingStudent(null);
        }}
        title="Confirm Deletion"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end w-full">
            <Button type="button"
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingStudent(null);
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Student?</h3>
          <p className="text-gray-500 mb-2">
            Are you sure you want to delete{" "}
            <span className="font-bold text-red-600">
              {deletingStudent?.firstName} {deletingStudent?.lastName}
            </span>
            ?
          </p>
          <p className="text-xs text-gray-400">
            This action cannot be undone. All student records, attendance, and fee history will be permanently removed.
          </p>
        </div>
      </Modal>
    </div>
  );
}