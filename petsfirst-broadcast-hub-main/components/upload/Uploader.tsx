import React, { useRef, useState, useEffect } from "react";
import { CSVData } from "../../types";
import Loader from "../ui/Loader";
import Modal, { ModalProps } from "../modal/Modal";
import { parseFile } from "@/utils/csvParser";
import {
  validateUploadedSheet,
  isSheetValidationFailure,
  type RowMissingError,
} from "@/utils/sheetValidation";
import SheetValidationErrorView, {
  type SheetValidationError,
} from "./SheetValidationErrorView";

interface UploaderProps {
  /** Called when file is parsed or cleared. Second arg is the raw File for upload API. */
  onDataLoaded: (data: CSVData | null, file?: File | null) => void;
  data: CSVData | null;
  /** Template variables in order of appearance (for validation and sequence display). */
  templateVariablesInOrder?: string[];
}

const Uploader: React.FC<UploaderProps> = ({
  onDataLoaded,
  data,
  templateVariablesInOrder = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [localData, setLocalData] = useState<CSVData | null>(null);
  const isClearingRef = useRef(false);
  const [missingColumnsError, setMissingColumnsError] = useState<{
    missing: string[];
    requiredOrder: string[];
  } | null>(null);
  const [columnNameMismatchError, setColumnNameMismatchError] = useState<{
    mismatches: Array<{ expected: string; found: string }>;
    requiredOrder: string[];
  } | null>(null);
  const [rowsWithMissingError, setRowsWithMissingError] = useState<
    RowMissingError[] | null
  >(null);
  const [modal, setModal] = useState<
    Omit<ModalProps, "isOpen"> & { isOpen: boolean }
  >({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
    onClose: () => {
      setModal((prev) => ({ ...prev, isOpen: false }));
      setMissingColumnsError(null);
      setColumnNameMismatchError(null);
      setRowsWithMissingError(null);
    },
  });

  const displayData = localData || data;

  useEffect(() => {
    if (data && data.rows && data.rows.length > 0) {
      if (!localData) {
        setLocalData(data);
      } else if (localData.fileName !== data.fileName) {
        setLocalData(data);
      }
    } else if (!data && localData && isClearingRef.current) {
      setLocalData(null);
      setFileName("");
      isClearingRef.current = false;
    }
  }, [data]);

  useEffect(() => {
    if (displayData?.fileName && displayData.fileName !== fileName) {
      setFileName(displayData.fileName);
    }
  }, [displayData?.fileName, fileName]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    try {
      const parsed = await parseFile(file);
      const result = validateUploadedSheet(
        parsed.headers,
        parsed.rows,
        templateVariablesInOrder,
      );

      if (result.ok) {
        const dataWithFileName = {
          ...parsed,
          fileName: file.name,
        };
        setLocalData(dataWithFileName);
        onDataLoaded(dataWithFileName, file);
        return;
      }

      if (!isSheetValidationFailure(result)) return;

      if (result.error === "column_name_mismatch") {
        setColumnNameMismatchError({
          mismatches: result.mismatches,
          requiredOrder: result.requiredOrder,
        });
        setMissingColumnsError(null);
        setRowsWithMissingError(null);
        setModal({
          isOpen: true,
          title: "Column names don't match template variables",
          message: "",
          type: "error",
          onClose: () => {
            setModal((prev) => ({ ...prev, isOpen: false }));
            setColumnNameMismatchError(null);
            setFileName("");
            setLocalData(null);
          },
        });
        onDataLoaded(null, null);
        setLocalData(null);
        return;
      }

      if (result.error === "missing_columns") {
        setMissingColumnsError({
          missing: result.missing,
          requiredOrder: result.requiredOrder,
        });
        setColumnNameMismatchError(null);
        setRowsWithMissingError(null);
        setModal({
          isOpen: true,
          title: "Sheet doesn't match template",
          message: "",
          type: "error",
          onClose: () => {
            setModal((prev) => ({ ...prev, isOpen: false }));
            setMissingColumnsError(null);
            setFileName("");
            setLocalData(null);
          },
        });
        onDataLoaded(null, null);
        setLocalData(null);
        return;
      }

      setRowsWithMissingError(result.rowErrors);
      setMissingColumnsError(null);
      setColumnNameMismatchError(null);
      setModal({
        isOpen: true,
        title: "Rows with missing data",
        message: "",
        type: "error",
        onClose: () => {
          setModal((prev) => ({ ...prev, isOpen: false }));
          setRowsWithMissingError(null);
          setFileName("");
          setLocalData(null);
        },
      });
      onDataLoaded(null, null);
      setLocalData(null);
    } catch (err: any) {
      setMissingColumnsError(null);
      setColumnNameMismatchError(null);
      setRowsWithMissingError(null);
      setModal({
        isOpen: true,
        title: "File Error",
        message: err.message,
        type: "error",
        onClose: () => {
          setModal((prev) => ({ ...prev, isOpen: false }));
          setFileName("");
          setLocalData(null);
        },
      });
      onDataLoaded(null, null);
    } finally {
      setIsLoading(false);
      // Reset input so re-selecting the same file triggers change and re-validation
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClear = () => {
    isClearingRef.current = true;
    setLocalData(null);
    setFileName("");
    onDataLoaded(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayFileName = displayData?.fileName || fileName || "Contact List";

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 pb-6 border-b border-slate-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center mb-2">
              <span className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mr-3 shadow-lg shadow-teal-100">
                <span className="text-white text-lg">📋</span>
              </span>
              Contact Upload
            </h2>
            <p className="text-slate-500 font-medium">
              Upload Excel (.xlsx) files with Name & Phone columns
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {!displayData || !displayData.rows || displayData.rows.length === 0 ? (
          <div
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`group relative border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
              isLoading
                ? "border-teal-300 bg-teal-50"
                : "border-slate-200 hover:border-teal-400 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50"
            }`}
          >
            <div className="absolute top-4 right-4 w-20 h-20 bg-teal-100 rounded-full opacity-30 blur-xl group-hover:scale-150 transition-transform duration-500" />
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-cyan-100 rounded-full opacity-30 blur-xl group-hover:scale-150 transition-transform duration-500" />

            <div
              className={`relative w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-300 ${
                isLoading
                  ? "bg-teal-100 animate-pulse"
                  : "bg-gradient-to-br from-slate-100 to-slate-50 group-hover:from-teal-100 group-hover:to-cyan-100 group-hover:scale-110 group-hover:rotate-3"
              }`}
            >
              {isLoading ? (
                <Loader size="lg" ariaLabel="Processing file" />
              ) : (
                <span className="text-4xl">📁</span>
              )}
            </div>

            <p className="text-slate-800 font-black text-xl mb-2 relative">
              {isLoading ? "Processing..." : "Drop your file here"}
            </p>
            <p className="text-slate-400 text-sm font-medium relative">
              {isLoading
                ? "Reading your contact list"
                : "or click to browse • Excel supported"}
            </p>

            <div className="flex gap-3 mt-6">
              <span className="px-3 py-1.5 bg-green-50 text-green-600 text-[11px] font-black rounded-lg border border-green-100">
                .XLSX
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx"
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-gradient-to-r from-teal-500 to-cyan-500 p-5 rounded-2xl text-white">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <p className="font-black text-lg">{displayFileName}</p>
                  <p className="text-teal-100 text-sm font-medium">
                    {displayData && displayData.rows
                      ? displayData.rows.length
                      : 0}{" "}
                    contacts loaded successfully
                  </p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors backdrop-blur-sm flex items-center"
              >
                <span className="mr-2">🔄</span> Change File
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #00A89E, #06b6d4);
          border-radius: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #00917e, #0891b2);
        }
      `}</style>

      <Modal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        children={((): React.ReactNode => {
          const err: SheetValidationError | null = columnNameMismatchError
            ? {
                type: "column_name_mismatch",
                mismatches: columnNameMismatchError.mismatches,
                requiredOrder: columnNameMismatchError.requiredOrder,
              }
            : missingColumnsError
            ? {
                type: "missing_columns",
                missing: missingColumnsError.missing,
                requiredOrder: missingColumnsError.requiredOrder,
              }
            : rowsWithMissingError && rowsWithMissingError.length > 0
              ? {
                  type: "rows_missing_data",
                  rowErrors: rowsWithMissingError,
                }
              : null;
          return err ? <SheetValidationErrorView error={err} /> : undefined;
        })()}
      />
    </div>
  );
};

export default Uploader;
