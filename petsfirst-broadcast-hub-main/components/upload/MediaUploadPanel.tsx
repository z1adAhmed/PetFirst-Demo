import React, { useRef, useState } from "react";
import Loader from "../ui/Loader";
import { validateMetaMediaByFile } from "../../utils/metaMediaValidation";

interface MediaUploadPanelProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  error?: string | null;
}

/** Meta 2026: Image 5MB, Video 16MB, Document 100MB, doc filename ≤240 chars. */
const META_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/3gpp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain";

const MediaUploadPanel: React.FC<MediaUploadPanelProps> = ({
  onUpload,
  isUploading,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLocalError(null);

    const validationError = validateMetaMediaByFile(file);
    if (validationError) {
      setLocalError(validationError);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setFileName(file.name);
    await onUpload(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-slate-700 uppercase tracking-[0.2em]">
            Upload Media
          </p>
          <p className="text-[11px] text-slate-500">
            Image (5MB), video (16MB), or document (100MB). Meta WhatsApp limits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="px-3 py-1.5 rounded-lg text-xs font-black bg-[#00A89E] text-white hover:bg-[#00c4b8] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Choose File
        </button>
      </div>

      {isUploading && (
        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
          <Loader size="sm" ariaLabel="Uploading" />
          Uploading...
        </div>
      )}

      {(() => {
        const msg = localError ?? error;
        const text = typeof msg === "string" ? msg : null;
        return text ? (
          <p className="text-xs text-rose-500 font-bold">{text}</p>
        ) : null;
      })()}

      <input
        ref={inputRef}
        type="file"
        accept={META_ACCEPT}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default MediaUploadPanel;
