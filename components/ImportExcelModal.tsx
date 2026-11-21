'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Clock,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { Attendance } from '@/types/attendance';
import {
  parseAttendanceExcel,
  downloadAttendanceTemplate,
  ParsedAttendanceResult,
} from '@/lib/attendance/excel-import';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportConfirm: (records: Attendance[], date: string) => Promise<void>;
  defaultDate: string;
}

export default function ImportExcelModal({
  isOpen,
  onClose,
  onImportConfirm,
  defaultDate,
}: ImportExcelModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ParsedAttendanceResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(defaultDate);
      setParsedData(null);
      setErrorMessage(null);
    }
  }, [isOpen, defaultDate]);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setIsParsing(true);
    setErrorMessage(null);
    setParsedData(null);

    try {
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        throw new Error('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      }

      const buffer = await file.arrayBuffer();
      const result = await parseAttendanceExcel(buffer, file.name, selectedDate);
      setParsedData(result);
      if (result.detectedDate && result.detectedDate !== selectedDate) {
        setSelectedDate(result.detectedDate);
      }
    } catch (err) {
      console.error('File parsing error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse Excel file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleConfirm = async () => {
    if (!parsedData || parsedData.records.length === 0) return;
    setIsImporting(true);
    try {
      // Ensure all parsed records use the chosen target date
      const finalRecords = parsedData.records.map((r) => ({
        ...r,
        date: selectedDate,
      }));
      await onImportConfirm(finalRecords, selectedDate);
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save imported records.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadAttendanceTemplate(selectedDate);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Import Attendance from Excel
              </h3>
              <p className="text-xs text-slate-500">
                Upload your daily Excel or CSV file to bulk update branch attendance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target Date & Template Download Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <label htmlFor="import-date" className="text-xs font-semibold text-blue-900">
                Target Date for Attendance:
              </label>
              <input
                id="import-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-medium bg-white border border-blue-200 rounded-md text-slate-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* File Dropzone */}
          {!parsedData && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {isParsing ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-700">Reading Excel sheet...</p>
                  <p className="text-xs text-slate-400">Matching employee names, branches, and leave statuses</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Click to choose an Excel / CSV file or drag and drop here
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supports .xlsx, .xls, and .csv files from Excel, Google Sheets, or exports
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600">
                    Auto-detects Bangalore Branches & Employees
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parsed Preview Section */}
          {parsedData && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* File Info & Re-upload */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">{parsedData.fileName}</span>
                  <span className="text-slate-500">• {parsedData.totalParsed} employees recognized</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null);
                    setErrorMessage(null);
                  }}
                  className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                >
                  Choose another file
                </button>
              </div>

              {/* Metric Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-1.5 text-blue-700 text-xs font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    <span>Total Staff</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900 mt-1">{parsedData.totalParsed}</p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Present</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-900 mt-1">{parsedData.presentCount}</p>
                </div>

                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                  <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold">
                    <UserX className="w-3.5 h-3.5" />
                    <span>Absent</span>
                  </div>
                  <p className="text-lg font-bold text-rose-900 mt-1">{parsedData.absentCount}</p>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Late / Half-Day</span>
                  </div>
                  <p className="text-lg font-bold text-amber-900 mt-1">
                    {parsedData.lateCount + parsedData.halfDayCount}
                  </p>
                </div>
              </div>

              {/* Records Preview Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Preview (Showing first 6 of {parsedData.totalParsed} records):
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Role</th>
                        <th className="py-2 px-3">Branch</th>
                        <th className="py-2 px-3">Times</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.records.slice(0, 6).map((rec, i) => (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {rec.name}
                            {rec.relieverName && (
                              <span className="block text-[10px] text-purple-600 font-normal">
                                Reliever: {rec.relieverName}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {rec.department || (rec.role?.includes('Assistant') ? 'ABM' : 'BM')}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{rec.branch}</td>
                          <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                            {rec.status === 'Absent' ? '--:--' : `${rec.checkIn} - ${rec.checkOut}`}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                rec.status === 'Present'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rec.status === 'Absent'
                                  ? 'bg-rose-100 text-rose-800'
                                  : rec.status === 'Pending'
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">
            {parsedData
              ? `Ready to import ${parsedData.totalParsed} records for ${selectedDate}`
              : 'Select an Excel file to begin'}
          </p>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!parsedData || isImporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Import {parsedData ? `${parsedData.totalParsed} Records` : 'Attendance'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
