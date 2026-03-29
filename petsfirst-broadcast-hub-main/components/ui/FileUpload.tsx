import React, { useRef, useState, useEffect } from "react";
import { Download, Trash2 } from "lucide-react";

export type FileUploadPreviewVariant = "image" | "video" | "document";

/** Sync validation: return error message or null if valid. */
export type FileValidator = (file: File) => string | null;
/** Async validation (e.g. image dimensions). Return error message or null if valid. */
export type FileAsyncValidator = (file: File) => Promise<string | null>;

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  /** When set, show preview (attachment-style) like image or document. */
  selectedFile?: File | null;
  /** Existing uploaded media URL (used for read-only/view mode previews). */
  existingFileUrl?: string;
  onClear?: () => void;
  /** How to render preview: image (thumbnail), video (icon/thumbnail), document (icon + name). */
  previewVariant?: FileUploadPreviewVariant;
  accept?: string;
  maxSizeMB?: number;
  /** If provided, used instead of built-in size-only check. Use for Meta media validation. */
  validator?: FileValidator;
  /** Optional async check (e.g. image min dimensions). Run after sync validator passes. */
  asyncValidator?: FileAsyncValidator;
  allowedTypesLabel?: string;
  hint?: string;
  className?: string;
}

const DEFAULT_LABEL =
  "Allowed file types: .jpeg, .jpg, .png. Max file size: 5MB";

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  selectedFile = null,
  existingFileUrl,
  onClear,
  previewVariant = "image",
  accept = ".jpeg,.jpg,.png",
  maxSizeMB = 5,
  validator: customValidator,
  asyncValidator,
  allowedTypesLabel = DEFAULT_LABEL,
  hint = "Upload a sample to help us understand what kind of image that you want to send to your users. You can change this image anytime later while sending this template.",
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const maxBytes = maxSizeMB * 1024 * 1024;

  useEffect(() => {
    if (!selectedFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const displayUrl =
    previewVariant === "image"
      ? selectedFile?.type.startsWith("image/")
        ? previewUrl
        : existingFileUrl || null
      : null;
  const downloadUrl = previewUrl || existingFileUrl || null;
  const displayedFileName =
    selectedFile?.name ||
    (existingFileUrl ? existingFileUrl.split("/").pop() || "attachment" : "");

  const validateSync = (file: File): string | null => {
    if (customValidator) return customValidator(file);
    if (file.size > maxBytes) return `File size must be under ${maxSizeMB}MB`;
    return null;
  };

  const handleFile = async (file: File | null) => {
    setError(null);
    if (!file) return;
    const syncErr = validateSync(file);
    if (syncErr) {
      setError(syncErr);
      return;
    }
    if (asyncValidator) {
      setValidating(true);
      try {
        const asyncErr = await asyncValidator(file);
        if (asyncErr) {
          setError(asyncErr);
          return;
        }
      } finally {
        setValidating(false);
      }
    }
    onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    void handleFile(file ?? null);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    void handleFile(file ?? null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
  };

  const hasPreview = selectedFile != null || Boolean(existingFileUrl);

  return (
    <div className={className}>
      <div
        onClick={() => !hasPreview && !validating && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
          validating ? "pointer-events-none opacity-70" : ""
        } ${
          isDragging
            ? "border-[#00A89E] bg-teal-50/50"
            : "border-slate-300 hover:border-teal-300 bg-slate-50/50 hover:bg-teal-50/30"
        } ${hasPreview ? "p-4" : "p-6 cursor-pointer"}`}
      >
        {hasPreview ? (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 p-3 min-w-0 flex-1">
                {previewVariant === "document" && (
                  <>
                    <span className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600 font-bold text-sm">
                      PDF
                    </span>
                    <span className="text-sm font-medium text-slate-700 truncate flex-1 min-w-0">
                      {displayedFileName}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {downloadUrl && (
                        <a
                          href={downloadUrl}
                          download={displayedFileName}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                          aria-label="Download"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
                {(previewVariant === "image" || previewVariant === "video") && (
                  <>
                    {previewVariant === "image" && displayUrl ? (
                      <img
                        src={displayUrl}
                        alt="Preview"
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <span className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 text-lg">
                        {previewVariant === "video" ? "🎬" : "🖼"}
                      </span>
                    )}
                    <span className="text-sm font-medium text-slate-700 truncate flex-1 min-w-0">
                      {displayedFileName}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {downloadUrl && (
                        <a
                          href={downloadUrl}
                          download={displayedFileName}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                          aria-label="Download"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <p
              className="text-xs text-slate-500 mt-3 cursor-pointer"
              onClick={() => inputRef.current?.click()}
            >
              Drag & drop to replace, or click to choose another file
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {allowedTypesLabel}
            </p>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0 text-2xl">
              ☁️
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700">
                Please Upload a File
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Drag & drop your file here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {allowedTypesLabel}
              </p>
            </div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {hint && <p className="text-xs text-slate-500 mt-2">{hint}</p>}
      {validating && (
        <p className="text-xs text-slate-500 font-medium mt-2">Checking file…</p>
      )}
      {error && (
        <p className="text-xs text-rose-500 font-medium mt-2">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
