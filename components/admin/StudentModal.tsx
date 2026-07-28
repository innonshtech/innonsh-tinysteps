"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import { showToast } from "@/lib/toast";
import { validateParentLoginEmail, normalizeEmail } from "@/lib/validations/emailValidation";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Key,
  UserCheck,
} from "lucide-react";

interface Parent {
  name: string;
  phone: string;
  email: string;
  relation: string;
}

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStudent: any | null;
  onSuccess: () => void;
}

export default function StudentModal({
  isOpen,
  onClose,
  editingStudent,
  onSuccess,
}: StudentModalProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedClassName, setSelectedClassName] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [emailError, setEmailError] = useState("");
  const [phoneErrors, setPhoneErrors] = useState<Record<string, string>>({});
  const [gmailTypoSuggestion, setGmailTypoSuggestion] = useState<string | null>(null);

  // Fee structure assignment (only for new students)
  const [classStructures, setClassStructures] = useState<any[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState("");
  const [selectedHeads, setSelectedHeads] = useState<Record<string, boolean>>({});
  const [feeMonth, setFeeMonth] = useState<string>(new Date().getMonth().toString());
  const [feeYear, setFeeYear] = useState<string>(new Date().getFullYear().toString());
  const [feeDueDate, setFeeDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [loadingStructures, setLoadingStructures] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dob: "",
    gender: "",
    admissionDate: new Date().toISOString().split("T")[0],
    classId: null as string | null,
    section: "",
    medical: {
      allergies: [] as string[],
      notes: "",
    },
    pickupInfo: {
      pickupPerson: "",
      pickupPhone: "",
    },
    parents: [
      { name: "", relation: "Father", phone: "", email: "" },
    ] as Parent[],
  });

  const STANDARD_SECTIONS = ["A", "B", "C", "D"];

  const uniqueClassNames = Array.from(
    new Set([
      ...classes.map((c) => c.name.trim()),
      ...(selectedClassName ? [selectedClassName.trim()] : []),
    ])
  )
    .filter(Boolean)
    .sort();

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && editingStudent) {
      handleEditStudentSetup(editingStudent);
    } else if (isOpen && !editingStudent) {
      resetForm();
    }
  }, [isOpen, editingStudent, classes]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await fetch("/api/classes");
      const data = await res.json();
      setClasses(data.classes || []);
    } catch {
      showToast.error("Failed to fetch classes");
    } finally {
      setLoadingClasses(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      dob: "",
      gender: "",
      admissionDate: new Date().toISOString().split("T")[0],
      classId: null,
      section: "",
      medical: {
        allergies: [],
        notes: "",
      },
      pickupInfo: {
        pickupPerson: "",
        pickupPhone: "",
      },
      parents: [{ name: "", relation: "Father", phone: "", email: "" }],
    });
    setSelectedClassName("");
    setSelectedSection("");
    setAvailableSections([]);
    setEmailError("");
    setPhoneErrors({});
    setGmailTypoSuggestion(null);
    setClassStructures([]);
    setSelectedStructureId("");
    setSelectedHeads({});
  };

  const handleEditStudentSetup = (student: any) => {
    const s = student;
    const studentClassId = s.classId || s.class_id || s.class?._id || s.class?.id;

    let matchedClass = classes.find(
      (c) =>
        (c._id && (c._id === studentClassId || String(c._id) === String(studentClassId))) ||
        (c.id && (c.id === studentClassId || String(c.id) === String(studentClassId)))
    );

    if (!matchedClass && (s.className || s.class?.name) && (s.section || s.class?.section)) {
      const targetName = String(s.className || s.class?.name || "").trim().toLowerCase();
      const targetSec = String(s.section || s.class?.section || "").trim().toUpperCase();
      matchedClass = classes.find(
        (c) =>
          c.name.trim().toLowerCase() === targetName &&
          c.section.trim().toUpperCase() === targetSec
      );
    }

    let clsName = "";
    let secName = "";
    let resolvedClassId: string | null = null;

    if (matchedClass) {
      clsName = matchedClass.name;
      secName = matchedClass.section;
      resolvedClassId = matchedClass._id || matchedClass.id;
    } else if (s.className || s.class?.name) {
      clsName = s.className || s.class?.name || "";
      secName = s.section || s.class?.section || "";
      resolvedClassId = studentClassId || null;
    }

    setSelectedClassName(clsName);
    setSelectedSection(secName);

    if (clsName) {
      const existingSections = classes
        .filter((c) => c.name.trim().toLowerCase() === clsName.trim().toLowerCase())
        .map((c) => c.section.trim().toUpperCase());
      const combined = Array.from(
        new Set([...STANDARD_SECTIONS, ...existingSections, ...(secName ? [secName.trim().toUpperCase()] : [])])
      ).sort();
      setAvailableSections(combined);
    } else {
      setAvailableSections([]);
    }

    const parentList = (s.parents || s.student_parents || []).map((p: any) => ({
      name: p.name || "",
      phone: p.phone || "",
      email: p.email || "",
      relation: p.relation || "Father",
    }));

    if (parentList.length === 0) {
      parentList.push({ name: "", relation: "Father", phone: "", email: s.email || "" });
    }

    setFormData({
      firstName: s.firstName || s.first_name || "",
      lastName: s.lastName || s.last_name || "",
      email: s.email || "",
      password: "",
      dob: s.dob ? new Date(s.dob).toISOString().split("T")[0] : "",
      gender: s.gender || "",
      admissionDate: s.admissionDate || s.admission_date ? new Date(s.admissionDate || s.admission_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      classId: resolvedClassId,
      section: secName || "",
      medical: {
        allergies: s.medical?.allergies || s.medicalAllergies || [],
        notes: s.medical?.notes || s.medicalNotes || "",
      },
      pickupInfo: {
        pickupPerson: s.pickupInfo?.pickupPerson || s.pickupPerson || "",
        pickupPhone: s.pickupInfo?.pickupPhone || s.pickupPhone || "",
      },
      parents: parentList,
    });
  };

  const isClassUncreated = Boolean(
    !loadingClasses &&
    selectedClassName &&
    selectedSection &&
    classes.length > 0 &&
    !classes.some(
      (c) =>
        c.name.trim().toLowerCase() === selectedClassName.trim().toLowerCase() &&
        c.section.trim().toUpperCase() === selectedSection.trim().toUpperCase()
    )
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "email") {
      setFormData((prev) => ({
        ...prev,
        email: value,
        parents: prev.parents.map((p, i) => (i === 0 ? { ...p, email: value } : p)),
      }));
      if (emailError) setEmailError("");
      if (gmailTypoSuggestion) setGmailTypoSuggestion(null);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleClassNameChange = async (className: string) => {
    setSelectedClassName(className);
    setSelectedSection("");

    if (className) {
      const existingSections = classes
        .filter((c) => c.name.trim().toLowerCase() === className.trim().toLowerCase())
        .map((c) => c.section.trim().toUpperCase());
      const combined = Array.from(new Set([...STANDARD_SECTIONS, ...existingSections])).sort();
      setAvailableSections(combined);

      const matched = classes.find((c) => c.name.trim().toLowerCase() === className.trim().toLowerCase());
      if (matched && !editingStudent) {
        fetchClassStructures(matched._id || matched.id);
      }
    } else {
      setAvailableSections([]);
      setFormData((prev) => ({ ...prev, classId: null, section: "" }));
      setClassStructures([]);
      setSelectedStructureId("");
      setSelectedHeads({});
    }
  };

  const fetchClassStructures = async (classId: string) => {
    try {
      setLoadingStructures(true);
      const res = await fetch(`/api/fees/structures?classId=${classId}`);
      const data = await res.json();
      const structures = data.structures || data.data || [];
      setClassStructures(structures);
      if (structures.length > 0) {
        setSelectedStructureId(structures[0]._id);
        const allSelected: Record<string, boolean> = {};
        structures[0].heads.forEach((h: any) => { allSelected[h.title] = true; });
        setSelectedHeads(allSelected);
      } else {
        setSelectedStructureId("");
        setSelectedHeads({});
      }
    } catch {
      setClassStructures([]);
    } finally {
      setLoadingStructures(false);
    }
  };

  const handleSectionChange = (section: string) => {
    setSelectedSection(section);
    if (selectedClassName && section) {
      const matched = classes.find(
        (c) =>
          c.name.trim().toLowerCase() === selectedClassName.trim().toLowerCase() &&
          c.section.trim().toUpperCase() === section.trim().toUpperCase()
      );
      if (matched) {
        const cId = matched._id || matched.id;
        setFormData((prev) => ({ ...prev, classId: cId, section }));
        if (!editingStudent) {
          fetchClassStructures(cId);
        }
      } else {
        setFormData((prev) => ({ ...prev, classId: null, section }));
      }
    } else {
      setFormData((prev) => ({ ...prev, classId: null, section: "" }));
    }
  };

  const handleClearClassAssignment = () => {
    setSelectedClassName("");
    setSelectedSection("");
    setFormData((prev) => ({ ...prev, classId: null, section: "" }));
  };

  const handleEmailBlur = (emailValue: string) => {
    const clean = normalizeEmail(emailValue);
    if (!clean) return;
    const res = validateParentLoginEmail(clean);
    if (!res.valid) {
      if (res.type === "gmail_typo" && res.suggestion) {
        setGmailTypoSuggestion(res.suggestion);
        setEmailError("");
      } else {
        setEmailError(res.error || "Enter a valid email address.");
        setGmailTypoSuggestion(null);
      }
    } else {
      setEmailError("");
      setGmailTypoSuggestion(null);
    }
  };

  const handleFixGmailTypo = (suggestion: string) => {
    const parts = formData.email.split("@");
    const newEmail = `${parts[0]}@${suggestion}`;
    setFormData((prev) => ({
      ...prev,
      email: newEmail,
      parents: prev.parents.map((p, i) => (i === 0 ? { ...p, email: newEmail } : p)),
    }));
    setEmailError("");
    setGmailTypoSuggestion(null);
  };

  const handleParentChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const newParents = [...prev.parents];
      newParents[index] = { ...newParents[index], [field]: value };
      return { ...prev, parents: newParents };
    });
  };

  const handleAddParent = () => {
    setFormData((prev) => ({
      ...prev,
      parents: [...prev.parents, { name: "", relation: "Father", phone: "", email: "" }],
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

  const handlePhoneBlur = (key: string, phoneValue: string) => {
    const val = phoneValue.trim();
    if (val && !/^\d{10}$/.test(val)) {
      setPhoneErrors((prev) => ({ ...prev, [key]: "Enter a valid 10-digit phone number." }));
    } else {
      setPhoneErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleSubmit = async () => {
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
        targetClassId = matched._id || matched.id;
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

    if (!editingStudent && !selectedStructureId && classStructures.length > 0) {
      showToast.error("Please assign a Fee Structure to proceed");
      return;
    }

    const parentsWithSync = (formData.parents || []).map((p, idx) => {
      if (idx === 0) {
        return { ...p, email: formData.email.trim() };
      }
      return p;
    });

    let parentsPayload: any[] | undefined = undefined;

    if (!editingStudent) {
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
      parentsPayload = parentsWithSync;
    } else {
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
      const studentTargetId = editingStudent._id || editingStudent.id;
      const url = editingStudent ? `/api/students/${studentTargetId}` : "/api/students";

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
        showToast.success(`Student ${editingStudent ? "updated" : "added"} successfully`);
        onClose();
        resetForm();
        onSuccess();
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast.error(errData.error || "Failed to save student");
      }
    } catch {
      showToast.error("An error occurred while saving student");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title={editingStudent ? "Edit Student" : "Add New Student"}
      size="lg"
      footer={
        <>
          <Button
            type="button"
            onClick={() => {
              onClose();
              resetForm();
            }}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} variant="primary">
            {editingStudent ? "Update" : "Add"} Student
          </Button>
        </>
      }
    >
      <div className="space-y-6 mt-4 pr-2 pb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
            {editingStudent ? (
              <Edit2 className="w-5 h-5 text-white" />
            ) : (
              <Plus className="w-5 h-5 text-white" />
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-800">
            {editingStudent ? "Edit Student" : "Add New Student"}
          </h2>
        </div>

        {/* Section 1: Basic Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            Basic Information
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter first name"
                fullWidth
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter last name"
                fullWidth
              />
            </div>

            {editingStudent && (
              <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center gap-2">
                <span className="font-semibold text-gray-700">Admission No:</span>
                <span>{editingStudent.admissionNo || editingStudent.admission_no || "-"}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date of Birth *"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
                fullWidth
              />
              <Input
                label="Admission Date *"
                name="admissionDate"
                type="date"
                value={formData.admissionDate}
                onChange={handleInputChange}
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "male", label: "Male", emoji: "👦" },
                  { value: "female", label: "Female", emoji: "👧" },
                  { value: "other", label: "Other", emoji: "👤" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, gender: option.value }))}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                      formData.gender === option.value
                        ? "border-pink-500 bg-pink-50 text-pink-700 font-semibold"
                        : "border-gray-200 bg-white text-gray-700 hover:border-pink-300"
                    }`}
                  >
                    <span className="text-lg">{option.emoji}</span>
                    <span className="font-medium text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select
                  value={selectedClassName}
                  onChange={(e) => handleClassNameChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all appearance-none bg-white text-sm"
                >
                  <option value="">Select Class (Optional)</option>
                  {uniqueClassNames.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  disabled={!selectedClassName}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all appearance-none bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${
                    isClassUncreated ? "border-amber-400 bg-amber-50/20" : "border-gray-300"
                  }`}
                >
                  <option value="">{selectedClassName ? "Select Section (Optional)" : "Select Class First"}</option>
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Full-width Warning Box Below Row */}
            {isClassUncreated && (
              <div className="mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                <p className="text-xs text-amber-800 font-medium flex items-center gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>{selectedClassName} - Section {selectedSection}</strong> has not been created in the Class Module yet.
                  </span>
                </p>
                <button
                  type="button"
                  onClick={handleClearClassAssignment}
                  className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  Clear Class Assignment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Parent/Guardian Information */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            Parent/Guardian Information *
          </h3>
          <div className="space-y-4">
            {formData?.parents?.map((parent, index) => {
              const isKnownRel = ["Father", "Mother", "Guardian"].includes(parent.relation);
              const relSelectVal = isKnownRel ? parent.relation : parent.relation ? "Other" : "Father";
              const phoneKey = `parent_${index}`;

              return (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative space-y-4 min-w-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">
                      {index === 0 ? "Primary Parent/Guardian" : `Additional Guardian #${index + 1}`}
                    </span>
                    {formData.parents.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveParent(index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="w-full min-w-0">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {index === 0 ? "Parent Name *" : "Guardian Name *"}
                    </label>
                    <input
                      type="text"
                      placeholder={index === 0 ? "Parent Name *" : "Guardian Name *"}
                      value={parent.name}
                      onChange={(e) => handleParentChange(index, "name", e.target.value)}
                      className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                    <div className="min-w-0">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Relation {index === 0 ? "*" : ""}
                      </label>
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <select
                          value={relSelectVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== "Other") {
                              handleParentChange(index, "relation", val);
                            } else {
                              handleParentChange(index, "relation", "Other");
                            }
                          }}
                          className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white"
                        >
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Other">Other</option>
                        </select>
                        {relSelectVal === "Other" && (
                          <input
                            type="text"
                            placeholder="Specify relation"
                            value={parent.relation === "Other" ? "" : parent.relation}
                            onChange={(e) => handleParentChange(index, "relation", e.target.value || "Other")}
                            className="w-full min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-xs bg-white"
                          />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {index === 0 ? "Phone Number *" : "Phone Number"}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="10-digit Phone Number"
                        value={parent.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                          handleParentChange(index, "phone", value);
                          if (value.length === 10 || value.length === 0) {
                            setPhoneErrors((prev) => {
                              const copy = { ...prev };
                              delete copy[phoneKey];
                              return copy;
                            });
                          }
                        }}
                        onBlur={() => handlePhoneBlur(phoneKey, parent.phone)}
                        className={`w-full min-w-0 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white ${
                          phoneErrors[phoneKey] ? "border-red-400 bg-red-50/20" : "border-gray-300"
                        }`}
                      />
                      {phoneErrors[phoneKey] && (
                        <p className="text-xs text-red-600 font-medium mt-1">{phoneErrors[phoneKey]}</p>
                      )}
                    </div>
                  </div>

                  {index === 0 && (
                    <div className="pt-3 border-t border-gray-200/80 space-y-3 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        <Key className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>Parent Mobile App Login Credentials</span>
                      </div>

                      <div className="space-y-3 min-w-0">
                        <div className="w-full min-w-0">
                          <Input
                            label="Parent Login Email *"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onBlur={(e) => handleEmailBlur(e.target.value)}
                            placeholder="Parent's email address"
                            autoComplete="off"
                            error={emailError}
                            fullWidth
                            className="w-full min-w-0"
                          />
                          {gmailTypoSuggestion && !emailError && (
                            <div className="mt-1.5 text-xs text-amber-800 font-medium bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center justify-between shadow-sm">
                              <span className="flex items-center gap-1.5">
                                <span>💡</span> Did you mean <strong>@{gmailTypoSuggestion}</strong>?
                              </span>
                              <button
                                type="button"
                                onClick={() => handleFixGmailTypo(gmailTypoSuggestion)}
                                className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded transition-all ml-2 shrink-0 cursor-pointer"
                              >
                                Use @{gmailTypoSuggestion}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="w-full min-w-0">
                          <Input
                            label={editingStudent ? "Parent Login Password" : "Parent Login Password *"}
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder={editingStudent ? "Enter new password (optional)" : "Set password for parent login"}
                            autoComplete="new-password"
                            fullWidth
                            className="w-full min-w-0"
                          />
                          {editingStudent ? (
                            <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                              {editingStudent.hasParentPassword || editingStudent.has_parent_password ? (
                                <p className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                                  <span>🔒</span> Password already set — leave blank to keep existing password
                                </p>
                              ) : (
                                <p className="text-xs font-medium text-amber-700 flex items-center gap-1.5">
                                  <span>🔑</span> No password is currently set. Enter a password to enable parent login.
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">Share this password with the parent</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddParent}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-all w-full justify-center text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Another Parent/Guardian
            </button>
          </div>
        </div>

        {/* Medical Information */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Medical Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Type allergy and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAllergy(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {formData?.medical?.allergies.map((allergy, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(index)}
                      className="hover:bg-red-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medical Notes</label>
              <textarea
                value={formData?.medical?.notes || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    medical: { ...prev.medical, notes: e.target.value },
                  }))
                }
                placeholder="Any medical conditions, medications, or special care instructions..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Pickup Information */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Pickup Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Authorized Pickup Person"
              value={formData?.pickupInfo?.pickupPerson || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  pickupInfo: { ...prev.pickupInfo, pickupPerson: e.target.value },
                }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
            />
            <div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="10-digit Pickup Person Phone"
                value={formData?.pickupInfo?.pickupPhone || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData((prev) => ({
                    ...prev,
                    pickupInfo: { ...prev.pickupInfo, pickupPhone: value },
                  }));
                  if (value.length === 10 || value.length === 0) {
                    setPhoneErrors((prev) => {
                      const copy = { ...prev };
                      delete copy["pickupPhone"];
                      return copy;
                    });
                  }
                }}
                onBlur={() => handlePhoneBlur("pickupPhone", formData?.pickupInfo?.pickupPhone || "")}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white ${
                  phoneErrors["pickupPhone"] ? "border-red-400 bg-red-50/20" : "border-gray-300"
                }`}
              />
              {phoneErrors["pickupPhone"] && (
                <p className="text-xs text-red-600 font-medium mt-1">{phoneErrors["pickupPhone"]}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
