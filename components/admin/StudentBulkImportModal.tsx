"use client";
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { showToast } from "@/lib/toast";
import { Upload, Download, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

interface StudentBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StudentBulkImportModal({
  isOpen,
  onClose,
  onSuccess,
}: StudentBulkImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<{
    successCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);

  const downloadTemplate = () => {
    const headers = [
      "First Name",
      "Last Name",
      "DOB (YYYY-MM-DD)",
      "Gender",
      "Class",
      "Section",
      "Admission No",
      "Admission Date (YYYY-MM-DD)",
      "Parent Name",
      "Parent Phone",
      "Parent Email",
      "Relation",
      "Medical Allergies",
      "Medical Notes",
      "Pickup Person",
      "Pickup Phone"
    ];
    const sampleRow = [
      "Aarav",
      "Sharma",
      "2021-04-12",
      "Male",
      "Nursery",
      "A",
      "",
      "2026-08-18",
      "Rohan Sharma",
      "9876543210",
      "rohan.sharma@example.com",
      "Father",
      "Peanuts",
      "Needs inhaler in case of dust",
      "Sita Sharma",
      "9876543211"
    ];
    
    // Add BOM for Excel UTF-8 display compatibility
    const csvContent = "\uFEFF" + [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "student_bulk_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setSummary(null);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          showToast.error("The uploaded file is empty.");
          return;
        }

        const parsed = rawData.map((row: any) => {
          const getVal = (keys: string[]) => {
            for (const key of keys) {
              const matchedKey = Object.keys(row).find(
                (k) => k.trim().toLowerCase() === key.toLowerCase()
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
                return String(row[matchedKey]).trim();
              }
            }
            return "";
          };

          return {
            firstName: getVal(["First Name", "FirstName", "Name"]),
            lastName: getVal(["Last Name", "LastName"]),
            dob: getVal(["DOB", "Date of Birth", "BirthDate"]),
            gender: getVal(["Gender", "Sex"]),
            className: getVal(["Class", "ClassName"]),
            section: getVal(["Section"]),
            admissionNo: getVal(["Admission No", "AdmissionNo", "Roll No", "RollNo"]),
            admissionDate: getVal(["Admission Date", "AdmissionDate"]),
            parentName: getVal(["Parent Name", "ParentName", "Guardian Name", "GuardianName", "Father Name", "Mother Name"]),
            parentPhone: getVal(["Parent Phone", "ParentPhone", "Guardian Phone", "GuardianPhone", "Mobile"]),
            parentEmail: getVal(["Parent Email", "ParentEmail", "Email", "Guardian Email"]),
            parentRelation: getVal(["Relation", "ParentRelation", "Relationship"]) || "Father",
            medicalAllergies: getVal(["Medical Allergies", "Allergies"]),
            medicalNotes: getVal(["Medical Notes", "Notes"]),
            pickupPerson: getVal(["Pickup Person", "PickupPerson"]),
            pickupPhone: getVal(["Pickup Phone", "PickupPhone"]),
          };
        });

        setParsedData(parsed);
        showToast.success(`Successfully parsed ${parsed.length} rows.`);
      } catch (err) {
        console.error(err);
        showToast.error("Failed to read sheet. Ensure it is a valid .csv, .xls, or .xlsx file.");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleImportSubmit = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    try {
      const res = await fetch("/api/students/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: parsedData }),
      });

      const data = await res.json();
      if (data.success) {
        setSummary({
          successCount: data.successCount,
          failedCount: data.failedCount,
          errors: data.errors || [],
        });

        if (data.successCount > 0) {
          showToast.success(`Successfully imported ${data.successCount} students.`);
          onSuccess();
        }
        
        if (data.failedCount > 0) {
          showToast.warning(`${data.failedCount} rows failed to import. Check details below.`);
        }
      } else {
        showToast.error(data.error || "Failed to process import request.");
      }
    } catch (err) {
      console.error(err);
      showToast.error("An unexpected error occurred during import.");
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setParsedData([]);
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import Students"
      size="lg"
      footer={
        <div className="flex justify-between items-center w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={downloadTemplate}
            className="flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download Template
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                resetModal();
                onClose();
              }}
              disabled={importing}
            >
              Close
            </Button>
            {parsedData.length > 0 && !summary && (
              <Button
                type="button"
                variant="primary"
                onClick={handleImportSubmit}
                loading={importing}
              >
                Import {parsedData.length} Students
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Helper Note */}
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600" /> Instructions:
          </p>
          <ul className="list-disc pl-4 space-y-0.5 text-blue-700">
            <li>Download the onboarding template CSV file.</li>
            <li>Fill in student info. First Name, DOB, and Parent Email are **mandatory**.</li>
            <li>Classes and Sections will be **created automatically** if they don't exist in the database.</li>
            <li>Parent login password will be set to `parent123` by default.</li>
          </ul>
        </div>

        {/* Upload Drop Zone */}
        {!summary && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              file
                ? "border-orange-400 bg-orange-50/10"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100/50 hover:border-orange-300"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
            />
            <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-auto shadow-sm text-gray-500 mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {file ? file.name : "Drag & drop your student spreadsheet here"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports .xlsx, .xls, and .csv formats
            </p>
            {file && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetModal();
                }}
                className="mt-3 text-xs font-semibold text-red-500 hover:underline"
              >
                Remove file
              </button>
            )}
          </div>
        )}

        {/* Import Results Summary */}
        {summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs text-green-800 font-medium">Successfully Imported</p>
                  <p className="text-xl font-bold text-green-700">{summary.successCount}</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600 shrink-0" />
                <div>
                  <p className="text-xs text-red-800 font-medium">Failed to Import</p>
                  <p className="text-xl font-bold text-red-700">{summary.failedCount}</p>
                </div>
              </div>
            </div>

            {summary.errors.length > 0 && (
              <div className="border border-red-200 rounded-lg overflow-hidden bg-white">
                <div className="px-4 py-2 border-b border-red-200 bg-red-50 text-xs font-bold text-red-800">
                  Import Errors & Warnings
                </div>
                <div className="max-h-60 overflow-y-auto p-3 text-xs text-red-600 space-y-1 bg-red-50/10 font-mono divide-y divide-red-100">
                  {summary.errors.map((err, i) => (
                    <div key={i} className="py-1 first:pt-0">
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={resetModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Import another file
              </button>
            </div>
          </div>
        )}

        {/* Data Preview Table */}
        {parsedData.length > 0 && !summary && (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700">Preview: {parsedData.length} records detected</span>
              <span className="text-[10px] text-gray-400 italic">Showing up to 5 rows</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-500 font-medium select-none">
                    <th className="px-3 py-2">First Name</th>
                    <th className="px-3 py-2">Last Name</th>
                    <th className="px-3 py-2">DOB</th>
                    <th className="px-3 py-2">Class</th>
                    <th className="px-3 py-2">Sec</th>
                    <th className="px-3 py-2">Parent Email</th>
                    <th className="px-3 py-2">Parent Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {parsedData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2 font-medium text-gray-900">{row.firstName || "-"}</td>
                      <td className="px-3 py-2">{row.lastName || "-"}</td>
                      <td className="px-3 py-2">{row.dob || "-"}</td>
                      <td className="px-3 py-2">{row.className || "-"}</td>
                      <td className="px-3 py-2 font-mono text-[10px]">{row.section || "-"}</td>
                      <td className="px-3 py-2 truncate max-w-[120px]" title={row.parentEmail}>{row.parentEmail || "-"}</td>
                      <td className="px-3 py-2">{row.parentPhone || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
