"use client";

import React, { useState, useEffect, useRef } from "react";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import { showToast } from "@/lib/toast";
import { validateParentLoginEmail, normalizeEmail } from "@/lib/validations/emailValidation";
import { INDIAN_STATES_AND_CITIES } from "@/utils/indianLocations";
import {
  User,
  Users,
  Plus,
  Trash2,
  FileText,
  Upload,
  HeartPulse,
  MapPin,
  School,
  Camera,
  ChevronDown,
  MoreVertical,
  Eye,
  RefreshCw,
} from "lucide-react";

interface Parent {
  name: string;
  relation: string;
  phone: string;
  email: string;
  address?: string;
}

interface UploadedDocument {
  name: string;
  url: string;
  fileName: string;
  fileSize: string;
}

interface AddAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableClasses?: string[];
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AddAdmissionModal({
  isOpen,
  onClose,
  onSuccess,
  availableClasses = ["Play Group", "Nursery", "KG1", "KG2", "Class 1", "Class 2"],
}: AddAdmissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [emailError, setEmailError] = useState("");
  const [phoneErrors, setPhoneErrors] = useState<Record<string, string>>({});
  const [pincodeError, setPincodeError] = useState("");
  const [gmailTypoSuggestion, setGmailTypoSuggestion] = useState<string | null>(null);

  // Form State
  const [childFirstName, setChildFirstName] = useState("");
  const [childLastName, setChildLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [preferredClass, setPreferredClass] = useState("");

  const [parents, setParents] = useState<Parent[]>([
    { name: "", relation: "Father", phone: "", email: "", address: "" },
  ]);

  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const [previousSchool, setPreviousSchool] = useState("");
  const [previousClass, setPreviousClass] = useState("");
  const [reasonForLeaving, setReasonForLeaving] = useState("");

  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [openDocMenu, setOpenDocMenu] = useState<string | null>(null);
  const docMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (docMenuRef.current && !docMenuRef.current.contains(event.target as Node)) {
        setOpenDocMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [applicationDate, setApplicationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [adminNote, setAdminNote] = useState("");

  const resetForm = () => {
    setChildFirstName("");
    setChildLastName("");
    setDob("");
    setGender("");
    setPreferredClass("");
    setParents([{ name: "", relation: "Father", phone: "", email: "", address: "" }]);
    setAddress("");
    setState("");
    setCity("");
    setPincode("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setPreviousSchool("");
    setPreviousClass("");
    setReasonForLeaving("");
    setBloodGroup("");
    setAllergies("");
    setMedicalNotes("");
    setPhotoPreview(null);
    setPhotoFile(null);
    setDocuments([]);
    setEmailError("");
    setPhoneErrors({});
    setPincodeError("");
    setGmailTypoSuggestion(null);
    setApplicationDate(new Date().toISOString().split("T")[0]);
    setAdminNote("");
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!validTypes.includes(file.type) && !["jpg", "jpeg", "png"].includes(ext || "")) {
      showToast.error("Upload a JPG, JPEG or PNG photo.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error("Photo size must be 5 MB or less.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleParentChange = (index: number, field: keyof Parent, value: string) => {
    setParents((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });

    if (field === "email" && index === 0) {
      if (emailError) setEmailError("");
      if (gmailTypoSuggestion) setGmailTypoSuggestion(null);
    }
  };

  const handleAddParent = () => {
    setParents((prev) => [
      ...prev,
      { name: "", relation: "Mother", phone: "", email: "", address: "" },
    ]);
  };

  const handleRemoveParent = (index: number) => {
    setParents((prev) => prev.filter((_, i) => i !== index));
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

  const handlePincodeBlur = (pinValue: string) => {
    const val = pinValue.trim();
    if (val && !/^\d{6}$/.test(val)) {
      setPincodeError("Enter a valid 6-digit PIN code.");
    } else {
      setPincodeError("");
    }
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
    if (parents.length > 0) {
      const parts = parents[0].email.split("@");
      const newEmail = `${parts[0]}@${suggestion}`;
      handleParentChange(0, "email", newEmail);
    }
    setEmailError("");
    setGmailTypoSuggestion(null);
  };

  const handleStateChange = (newState: string) => {
    setState(newState);
    setCity("");
  };

  const handleDocSelect = async (label: string, file: File) => {
    const validExtensions = ["pdf", "jpg", "jpeg", "png"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const validMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!validExtensions.includes(ext) && !validMimeTypes.includes(file.type)) {
      showToast.error("Upload a PDF, JPG, JPEG or PNG file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error("File size must be 5 MB or less.");
      return;
    }

    const cleanFileName = file.name.replace(/^.*[\\\/]/, "");

    try {
      setUploadingDoc(label);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admission/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || "Upload failed");
      }

      setDocuments((prev) => [
        ...prev.filter((d) => d.name !== label),
        {
          name: label,
          url: data.url,
          fileName: cleanFileName,
          fileSize: formatFileSize(file.size),
        },
      ]);
      showToast.success(`${label} uploaded.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      console.error(`Upload error for ${label}:`, err);
      showToast.error(msg);
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleRemoveDoc = (label: string) => {
    setDocuments((prev) => prev.filter((d) => d.name !== label));
  };

  const handleSubmit = async () => {
    if (!childFirstName.trim()) {
      showToast.error("First Name is required");
      return;
    }

    if (!dob) {
      showToast.error("Date of Birth is required");
      return;
    }

    if (!gender) {
      showToast.error("Gender is required");
      return;
    }

    if (!preferredClass) {
      showToast.error("Applied Class is required");
      return;
    }

    if (!parents[0].name.trim()) {
      showToast.error("Parent Name is required");
      return;
    }

    if (!parents[0].phone || !/^\d{10}$/.test(parents[0].phone.trim())) {
      showToast.error("Enter a valid 10-digit phone number.");
      return;
    }

    const cleanEmail = normalizeEmail(parents[0].email || "");
    if (!cleanEmail) {
      showToast.error("Parent Email is required");
      return;
    }

    const emailCheck = validateParentLoginEmail(cleanEmail);
    if (!emailCheck.valid) {
      if (emailCheck.type === "gmail_typo" && emailCheck.suggestion) {
        setGmailTypoSuggestion(emailCheck.suggestion);
        showToast.error(`Did you mean @${emailCheck.suggestion}?`);
      } else {
        setEmailError(emailCheck.error || "Enter a valid email address.");
        showToast.error(emailCheck.error || "Enter a valid email address.");
      }
      return;
    }

    if (!address.trim()) {
      showToast.error("Residential Address is required");
      return;
    }

    if (!state) {
      showToast.error("Please select a State.");
      return;
    }

    if (!city) {
      showToast.error("Please select a City.");
      return;
    }

    if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
      setPincodeError("Enter a valid 6-digit PIN code.");
      showToast.error("Enter a valid 6-digit PIN code.");
      return;
    }

    if (emergencyContactPhone.trim() && !/^\d{10}$/.test(emergencyContactPhone.trim())) {
      showToast.error("Enter a valid 10-digit emergency contact phone number.");
      return;
    }

    try {
      setLoading(true);

      let finalPhotoUrl = photoPreview;

      if (photoFile) {
        try {
          const photoFormData = new FormData();
          photoFormData.append("file", photoFile);
          const uploadRes = await fetch("/api/admission/upload", {
            method: "POST",
            body: photoFormData,
          });
          const uploadData = await uploadRes.json();
          if (uploadData.success && uploadData.url) {
            finalPhotoUrl = uploadData.url;
          }
        } catch (e) {
          console.warn("Photo upload fallback warning:", e);
        }
      }

      const payload = {
        childFirstName,
        childLastName,
        dob,
        gender,
        preferredClass,
        previousSchool,
        previousClass,
        reasonForLeaving,
        bloodGroup,
        allergies,
        medicalNotes,
        photoUrl: finalPhotoUrl,
        address,
        city,
        state,
        pincode,
        emergencyContactName,
        emergencyContactPhone,
        parents,
        documents: documents.map((d) => ({ name: d.name, url: d.url })),
        applicationDate,
        adminNote,
      };

      const res = await fetch("/api/admission/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast.success("Admission application created successfully.");
        onClose();
        resetForm();
        onSuccess();
      } else {
        showToast.error(data.error || "Failed to create admission application");
      }
    } catch {
      showToast.error("An error occurred while saving admission application.");
    } finally {
      setLoading(false);
    }
  };

  const availableCities = state ? INDIAN_STATES_AND_CITIES[state] || ["Other"] : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title="Add New Admission"
      size="lg"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button
            type="button"
            onClick={() => {
              onClose();
              resetForm();
            }}
            variant="secondary"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            variant="primary"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Admission"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 mt-1 pr-1 pb-6 max-h-[calc(80vh-140px)] overflow-y-auto box-border min-w-0">
        {/* CHILD INFORMATION */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-4">
            <User className="w-4 h-4 text-orange-500 shrink-0" />
            <h3 className="text-[15px] font-semibold text-gray-800">Child Information</h3>
          </div>

          {/* Student Photo */}
          <div className="flex flex-col items-center sm:flex-row gap-4 mb-5 p-3.5 bg-gray-50 rounded-xl border border-gray-200 box-border min-w-0">
            <div className="w-20 h-20 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center overflow-hidden shrink-0 relative shadow-sm">
              {photoPreview ? (
                <img src={photoPreview} alt="Student preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-7 h-7 text-gray-400" />
              )}
            </div>
            <div className="space-y-1.5 text-center sm:text-left min-w-0">
              <label className="block text-xs font-semibold text-gray-700">Student Photo</label>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer transition-all box-border">
                  {photoPreview ? "Change Photo" : "Upload Photo"}
                  <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handlePhotoSelect} className="hidden" />
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-semibold text-red-600 transition-all cursor-pointer box-border"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500">JPG, JPEG or PNG (Max 5 MB)</p>
            </div>
          </div>

          <div className="space-y-4 min-w-0">
            {/* ROW 1: First Name * | Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
                <input
                  type="text"
                  placeholder="Enter child's first name"
                  value={childFirstName}
                  onChange={(e) => setChildFirstName(e.target.value)}
                  className="w-full max-w-full h-[38px] px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 transition-all box-border min-w-0"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Enter child's last name"
                  value={childLastName}
                  onChange={(e) => setChildLastName(e.target.value)}
                  className="w-full max-w-full h-[38px] px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 transition-all box-border min-w-0"
                />
              </div>
            </div>

            {/* ROW 2: Date of Birth * | Applied Class * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full max-w-full h-[38px] px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 transition-all box-border min-w-0"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Applied Class *</label>
                <div className="relative w-full min-w-0">
                  <select
                    value={preferredClass}
                    onChange={(e) => setPreferredClass(e.target.value)}
                    className={`w-full max-w-full h-[38px] appearance-none pl-3 pr-10 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 transition-all box-border min-w-0 ${
                      !preferredClass ? "text-gray-400" : "text-gray-800"
                    }`}
                  >
                    <option value="" disabled className="text-gray-400">
                      Select Applied Class
                    </option>
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls} className="text-gray-800">
                        {cls}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* ROW 3: Gender * */}
            <div className="min-w-0">
              <label className="block text-xs font-medium text-slate-600 mb-1">Gender *</label>
              <div className="grid grid-cols-3 gap-3 min-w-0">
                {[
                  { value: "male", label: "Male", emoji: "👦" },
                  { value: "female", label: "Female", emoji: "👧" },
                  { value: "other", label: "Other", emoji: "👤" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGender(option.value)}
                    className={`flex items-center justify-center gap-2 h-[38px] px-4 rounded-lg border transition-all cursor-pointer box-border min-w-0 ${
                      gender === option.value
                        ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold"
                        : "border-gray-300 bg-white text-gray-700 hover:border-orange-300"
                    }`}
                  >
                    <span className="text-base">{option.emoji}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PARENT / GUARDIAN INFORMATION */}
        <div className="pt-2 min-w-0">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-4">
            <Users className="w-4 h-4 text-orange-500 shrink-0" />
            <h3 className="text-[15px] font-semibold text-gray-800">Parent / Guardian Information</h3>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4 box-border min-w-0">
            <span className="text-xs font-semibold text-gray-700 block">
              Primary Parent/Guardian *
            </span>

            <div className="min-w-0">
              <label className="block text-xs font-medium text-slate-600 mb-1">Parent Name *</label>
              <input
                type="text"
                placeholder="Parent Name *"
                value={parents[0].name}
                onChange={(e) => handleParentChange(0, "name", e.target.value)}
                className="w-full max-w-full h-[38px] px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Relation *</label>
                <div className="relative w-full min-w-0">
                  <select
                    value={parents[0].relation}
                    onChange={(e) => handleParentChange(0, "relation", e.target.value)}
                    className="w-full max-w-full h-[38px] appearance-none pl-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="10-digit Phone Number"
                  value={parents[0].phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    handleParentChange(0, "phone", value);
                    if (value.length === 10 || value.length === 0) {
                      setPhoneErrors((prev) => {
                        const copy = { ...prev };
                        delete copy["parent_0"];
                        return copy;
                      });
                    }
                  }}
                  onBlur={() => handlePhoneBlur("parent_0", parents[0].phone)}
                  className={`w-full max-w-full h-[38px] px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800 ${
                    phoneErrors["parent_0"] ? "border-red-400 bg-red-50/20" : "border-gray-300"
                  }`}
                />
                {phoneErrors["parent_0"] && (
                  <p className="text-xs text-red-600 font-medium mt-1">{phoneErrors["parent_0"]}</p>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-medium text-slate-600 mb-1">Email Address *</label>
              <input
                type="email"
                placeholder="Parent's email address"
                value={parents[0].email}
                onChange={(e) => handleParentChange(0, "email", e.target.value)}
                onBlur={(e) => handleEmailBlur(e.target.value)}
                className={`w-full max-w-full h-[38px] px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800 ${
                  emailError ? "border-red-400 bg-red-50/20" : "border-gray-300"
                }`}
              />
              {emailError && <p className="text-xs text-red-600 font-medium mt-1">{emailError}</p>}
              {gmailTypoSuggestion && !emailError && (
                <div className="mt-1.5 text-xs text-amber-800 font-medium bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center justify-between">
                  <span>💡 Did you mean <strong>@{gmailTypoSuggestion}</strong>?</span>
                  <button
                    type="button"
                    onClick={() => handleFixGmailTypo(gmailTypoSuggestion)}
                    className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2 py-0.5 rounded transition-all cursor-pointer"
                  >
                    Use @{gmailTypoSuggestion}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ADDITIONAL PARENT / GUARDIAN */}
        <div className="pt-2 min-w-0">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-4">
            <Users className="w-4 h-4 text-orange-500 shrink-0" />
            <h3 className="text-[15px] font-semibold text-gray-800">Additional Parent / Guardian</h3>
          </div>

          <div className="space-y-4 min-w-0">
            {parents.slice(1).map((parent, idx) => {
              const actualIndex = idx + 1;
              const phoneKey = `parent_${actualIndex}`;

              return (
                <div key={actualIndex} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4 box-border relative min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">
                      Additional Guardian #{actualIndex}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParent(actualIndex)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Guardian Name *</label>
                    <input
                      type="text"
                      placeholder="Guardian Name *"
                      value={parent.name}
                      onChange={(e) => handleParentChange(actualIndex, "name", e.target.value)}
                      className="w-full max-w-full h-[38px] px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                    <div className="min-w-0">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Relation *</label>
                      <div className="relative w-full min-w-0">
                        <select
                          value={parent.relation}
                          onChange={(e) => handleParentChange(actualIndex, "relation", e.target.value)}
                          className="w-full max-w-full h-[38px] appearance-none pl-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800"
                        >
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Other">Other</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="10-digit Phone Number"
                        value={parent.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                          handleParentChange(actualIndex, "phone", value);
                          if (value.length === 10 || value.length === 0) {
                            setPhoneErrors((prev) => {
                              const copy = { ...prev };
                              delete copy[phoneKey];
                              return copy;
                            });
                          }
                        }}
                        onBlur={() => handlePhoneBlur(phoneKey, parent.phone)}
                        className={`w-full max-w-full h-[38px] px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800 ${
                          phoneErrors[phoneKey] ? "border-red-400 bg-red-50/20" : "border-gray-300"
                        }`}
                      />
                      {phoneErrors[phoneKey] && (
                        <p className="text-xs text-red-600 font-medium mt-1">{phoneErrors[phoneKey]}</p>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="Guardian's email address"
                      value={parent.email}
                      onChange={(e) => handleParentChange(actualIndex, "email", e.target.value)}
                      className="w-full max-w-full h-[38px] px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800"
                    />
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddParent}
              className="flex items-center gap-2 px-4 h-[38px] border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-all w-full justify-center text-xs font-medium cursor-pointer box-border min-w-0"
            >
              <Plus className="w-4 h-4" />
              Add Another Parent/Guardian
            </button>
          </div>
        </div>

        {/* CONTACT & ADDRESS INFORMATION */}
        <div className="pt-2 min-w-0">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-4">
            <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
            <h3 className="text-[15px] font-semibold text-gray-800">Contact & Address Information</h3>
          </div>

          <div className="space-y-4 min-w-0">
            {/* Residential Address * (Full width) */}
            <div className="min-w-0">
              <label className="block text-xs font-medium text-slate-600 mb-1">Residential Address *</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full residential address..."
                rows={2}
                className="w-full max-w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm resize-none bg-white box-border min-w-0 text-gray-800"
              />
            </div>

            {/* ROW 2: State * | City * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">State *</label>
                <div className="relative w-full min-w-0">
                  <select
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className={`w-full max-w-full h-[38px] appearance-none pl-3 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 transition-all box-border min-w-0 ${
                      !state ? "bg-white text-gray-400" : "bg-white text-gray-800"
                    }`}
                  >
                    <option value="" disabled className="text-gray-400">
                      Select State
                    </option>
                    {Object.keys(INDIAN_STATES_AND_CITIES).map((st) => (
                      <option key={st} value={st} className="text-gray-800">
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">City *</label>
                <div className="relative w-full min-w-0">
                  <select
                    value={city}
                    disabled={!state}
                    onChange={(e) => setCity(e.target.value)}
                    className={`w-full max-w-full h-[38px] appearance-none pl-3 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 transition-all box-border min-w-0 ${
                      !state
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : !city
                        ? "bg-white text-gray-400"
                        : "bg-white text-gray-800"
                    }`}
                  >
                    <option value="" disabled className="text-gray-400">
                      Select City
                    </option>
                    {availableCities.map((ct) => (
                      <option key={ct} value={ct} className="text-gray-800">
                        {ct}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* ROW 3: PIN Code * | Emergency Contact Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">PIN Code *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit PIN Code"
                  value={pincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPincode(val);
                    if (val.length === 6 || val.length === 0) setPincodeError("");
                  }}
                  onBlur={() => handlePincodeBlur(pincode)}
                  className={`w-full max-w-full h-[38px] px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800 ${
                    pincodeError ? "border-red-400 bg-red-50/20" : "border-gray-300"
                  }`}
                />
                {pincodeError && <p className="text-xs text-red-600 font-medium mt-1">{pincodeError}</p>}
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Emergency Contact Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="10-digit phone number"
                  value={emergencyContactPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setEmergencyContactPhone(val);
                    if (val.length === 10 || val.length === 0) {
                      setPhoneErrors((prev) => {
                        const copy = { ...prev };
                        delete copy["emergency"];
                        return copy;
                      });
                    }
                  }}
                  onBlur={() => handlePhoneBlur("emergency", emergencyContactPhone)}
                  className={`w-full max-w-full h-[38px] px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800 ${
                    phoneErrors["emergency"] ? "border-red-400 bg-red-50/20" : "border-gray-300"
                  }`}
                />
                {phoneErrors["emergency"] && (
                  <p className="text-xs text-red-600 font-medium mt-1">{phoneErrors["emergency"]}</p>
                )}
              </div>
            </div>

            {/* ROW 4: Emergency Contact Name */}
            <div className="min-w-0">
              <label className="block text-xs font-medium text-slate-600 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                placeholder="Emergency contact person"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="w-full max-w-full h-[38px] px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* PREVIOUS SCHOOL INFORMATION (OPTIONAL) */}
        <div className="pt-2 min-w-0">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-4">
            <School className="w-4 h-4 text-orange-500 shrink-0" />
            <h3 className="text-[15px] font-semibold text-gray-800">Previous School Information (Optional)</h3>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Previous School Name</label>
                <input
                  type="text"
                  placeholder="Name of previous school"
                  value={previousSchool}
                  onChange={(e) => setPreviousSchool(e.target.value)}
                  className="w-full max-w-full h-[38px] px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Previous Class</label>
                <input
                  type="text"
                  placeholder="Last completed class"
                  value={previousClass}
                  onChange={(e) => setPreviousClass(e.target.value)}
                  className="w-full max-w-full h-[38px] px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-medium text-slate-600 mb-1">Reason for Leaving</label>
              <input
                type="text"
                placeholder="Reason for transfer / leaving"
                value={reasonForLeaving}
                onChange={(e) => setReasonForLeaving(e.target.value)}
                className="w-full max-w-full h-[38px] px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* MEDICAL INFORMATION (OPTIONAL) */}
        <div className="pt-2 min-w-0">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-4">
            <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />
            <h3 className="text-[15px] font-semibold text-gray-800">Medical Information (Optional)</h3>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Blood Group</label>
                <div className="relative w-full min-w-0">
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className={`w-full max-w-full h-[38px] appearance-none pl-3 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 transition-all box-border min-w-0 ${
                      !bloodGroup ? "bg-white text-gray-400" : "bg-white text-gray-800"
                    }`}
                  >
                    <option value="" disabled className="text-gray-400">
                      Select Blood Group
                    </option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"].map((bg) => (
                      <option key={bg} value={bg} className="text-gray-800">
                        {bg}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Allergies</label>
                <input
                  type="text"
                  placeholder="List any food or drug allergies"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full max-w-full h-[38px] px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm bg-white box-border min-w-0 text-gray-800"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-medium text-slate-600 mb-1">Medical Conditions / Notes</label>
              <textarea
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="Special medical conditions or instructions..."
                rows={2}
                className="w-full max-w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm resize-none bg-white box-border min-w-0 text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* DOCUMENTS UPLOAD */}
        <div className="pt-2 min-w-0">
          <div className="border-b border-gray-100 pb-2.5 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500 shrink-0" />
              <h3 className="text-[15px] font-semibold text-gray-800">Documents Upload</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PDF, JPG, JPEG or PNG • Max 5 MB per file
            </p>
          </div>

          <div className="space-y-3 min-w-0">
            {[
              { type: "Birth Certificate" },
              { type: "Transfer Certificate" },
              { type: "Address Proof" },
              { type: "Other Document" },
            ].map(({ type: docType }) => {
              const uploaded = documents.find((d) => d.name === docType);
              const isUploading = uploadingDoc === docType;
              const isMenuOpen = openDocMenu === docType;

              return (
                <div
                  key={docType}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3 box-border min-w-0 min-h-[48px] relative"
                >
                  {/* Left Side Info */}
                  {uploaded ? (
                    <div className="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 text-xs">{docType}</span>
                          <span className="text-[10px] uppercase font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md">
                            OPTIONAL
                          </span>
                        </div>
                        <span
                          className="text-[11px] text-gray-500 truncate block max-w-[180px] sm:max-w-[260px]"
                          title={uploaded.fileName}
                        >
                          {uploaded.fileName}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                      <span className="font-semibold text-gray-800 text-xs">{docType}</span>
                      <span className="text-[10px] uppercase font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md">
                        OPTIONAL
                      </span>
                    </div>
                  )}

                  {/* Right Side Actions */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isUploading ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-xs font-semibold">
                        <svg className="animate-spin h-3.5 w-3.5 text-orange-500" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        Uploading...
                      </span>
                    ) : uploaded ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenDocMenu(isMenuOpen ? null : docType)}
                          className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors cursor-pointer"
                          title="Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div
                            ref={docMenuRef}
                            className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1"
                          >
                            <a
                              href={uploaded.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpenDocMenu(null)}
                              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              View
                            </a>

                            <label className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                              <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
                              Replace
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                                onChange={(e) => {
                                  setOpenDocMenu(null);
                                  const f = e.target.files?.[0];
                                  if (f) handleDocSelect(docType, f);
                                  e.target.value = "";
                                }}
                                className="hidden"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenDocMenu(null);
                                handleRemoveDoc(docType);
                              }}
                              className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer transition-all box-border shadow-sm">
                        <Upload className="w-3.5 h-3.5 text-gray-500" />
                        Upload
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleDocSelect(docType, f);
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* APPLICATION & ADMIN INFORMATION */}
        <div className="pt-2 min-w-0">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-4">
            <User className="w-4 h-4 text-orange-500 shrink-0" />
            <h3 className="text-[15px] font-semibold text-gray-800">Application & Admin Information</h3>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Application Date *</label>
                <input
                  type="date"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  className="w-full max-w-full h-[38px] px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 transition-all box-border min-w-0"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Application Source</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value="Admin / Walk-in"
                  className="w-full max-w-full h-[38px] px-3 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium box-border min-w-0 cursor-not-allowed select-none"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-medium text-slate-600 mb-1">Admin Notes</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Optional internal comments or walk-in notes..."
                rows={2}
                className="w-full max-w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 focus:border-orange-400 text-sm resize-none bg-white box-border min-w-0 text-gray-800"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
