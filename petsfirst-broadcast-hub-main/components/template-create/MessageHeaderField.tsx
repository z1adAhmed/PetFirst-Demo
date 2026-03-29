import React, { useCallback, useEffect, useRef, useState } from "react";
import { TemplateFormField } from "./TemplateFormField";
import RadioGroup from "../ui/Radio";
import Input from "../ui/Input";
import FileUpload from "../ui/FileUpload";
import LocationSearch from "../ui/LocationSearch";
import {
  validateMetaImage,
  validateMetaVideo,
  validateMetaDocument,
  validateMetaImageDimensions,
  getMetaAcceptString,
  getMetaAllowedTypesLabel,
  getMetaMaxSizeMB,
} from "../../utils/metaMediaValidation";
import type { TemplateHeaderFormat } from "../../types";

const HEADER_OPTIONS: { value: TemplateHeaderFormat; label: string }[] = [
  { value: "NONE", label: "None" },
  { value: "TEXT", label: "Text" },
  { value: "IMAGE", label: "Image" },
  { value: "VIDEO", label: "Video" },
  { value: "DOCUMENT", label: "Document" },
  // { value: "LOCATION", label: "Location" }, // kept for future enablement
];

interface MessageHeaderFieldProps {
  value: TemplateHeaderFormat;
  headerMediaUrl?: string;
  headerText: string;
  locationName: string;
  locationAddress: string;
  onTypeChange: (v: TemplateHeaderFormat) => void;
  onHeaderTextChange: (v: string) => void;
  onHeaderMediaUrlChange: (v: string | undefined) => void;
  /** When user selects a file for IMAGE/VIDEO/DOCUMENT, pass the File for Meta Resumable Upload. Call with null when switching away from media. */
  onHeaderMediaFileChange?: (file: File | null) => void;
  /** Skip automatic media reset on header type change (used by view mode prefill). */
  suppressTypeChangeReset?: boolean;
  onLocationNameChange: (v: string) => void;
  onLocationAddressChange: (v: string) => void;
}

export const MessageHeaderField: React.FC<MessageHeaderFieldProps> = ({
  value,
  headerMediaUrl,
  headerText,
  locationName,
  locationAddress,
  onTypeChange,
  onHeaderTextChange,
  onHeaderMediaUrlChange,
  onHeaderMediaFileChange,
  suppressTypeChangeReset = false,
  onLocationNameChange,
  onLocationAddressChange,
}) => {
  const [locationQuery, setLocationQuery] = useState("");
  const prevHeaderTypeRef = useRef<typeof value | undefined>(undefined);
  /** Selected file for IMAGE/VIDEO/DOCUMENT so we can show preview in attachment area (like Gallabox). */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  /** Address from last place selected via search; used for "View in Map" link. Only set when user selects from dropdown. */
  const [mapQuery, setMapQuery] = useState<string | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);

  const sanitizeNoVariables = useCallback((input: string) => {
    const hasVariableSyntax = input.includes("{{") || input.includes("}}");
    if (!hasVariableSyntax) return { value: input, hadVariables: false };
    // Remove any {{...}} blocks and also remove dangling braces.
    const cleaned = input
      .replace(/\{\{[^}]*\}\}/g, "")
      .replace(/\{\{/g, "")
      .replace(/\}\}/g, "");
    return { value: cleaned, hadVariables: true };
  }, []);

  useEffect(() => {
    if (!locationAddress.trim()) setMapQuery(null);
  }, [locationAddress]);

  useEffect(() => {
    const prev = prevHeaderTypeRef.current;
    prevHeaderTypeRef.current = value;
    if (suppressTypeChangeReset) return;
    if (prev !== undefined && prev !== value) {
      setSelectedFile(null);
      onHeaderMediaUrlChange(undefined);
      onHeaderMediaFileChange?.(null);
      setHeaderError(null);
    }
    // Only clear when header type *changes* (e.g. Image → Video), not on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    // Location header option is temporarily disabled in template creation UI.
    // Keep this fallback so older drafts using LOCATION do not get stuck.
    if (value === "LOCATION") {
      onTypeChange("NONE");
    }
  }, [value, onTypeChange]);

  const handleFileSelect = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      onHeaderMediaUrlChange(url);
      onHeaderMediaFileChange?.(file);
    },
    [onHeaderMediaUrlChange, onHeaderMediaFileChange],
  );

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    onHeaderMediaUrlChange(undefined);
    onHeaderMediaFileChange?.(null);
  }, [onHeaderMediaUrlChange, onHeaderMediaFileChange]);

  return (
    <TemplateFormField label="Message header" optional error={value === "TEXT" ? headerError ?? undefined : undefined}>
      <div className="space-y-4">
        <RadioGroup
          name="headerType"
          options={HEADER_OPTIONS}
          value={value}
          onChange={onTypeChange}
        />

        {value === "TEXT" && (
          <Input
            type="text"
            value={headerText}
            onChange={(e) => {
              const nextRaw = e.target.value;
              const sanitized = sanitizeNoVariables(nextRaw);
              if (sanitized.hadVariables) {
                setHeaderError(
                  "Variables ({{...}}) are only supported in the message body. Please remove them from the header.",
                );
              } else if (headerError) {
                setHeaderError(null);
              }
              onHeaderTextChange(sanitized.value);
            }}
            placeholder="Header text"
            maxLength={60}
          />
        )}

        {value === "IMAGE" && (
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            existingFileUrl={!selectedFile ? headerMediaUrl : undefined}
            onClear={handleClearFile}
            previewVariant="image"
            accept={getMetaAcceptString("IMAGE")}
            maxSizeMB={getMetaMaxSizeMB("IMAGE")}
            validator={validateMetaImage}
            asyncValidator={validateMetaImageDimensions}
            allowedTypesLabel={getMetaAllowedTypesLabel("IMAGE")}
            hint="Upload a sample to help us understand what kind of image that you want to send to your users. You can change this image anytime later while sending this template."
          />
        )}

        {value === "VIDEO" && (
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            existingFileUrl={!selectedFile ? headerMediaUrl : undefined}
            onClear={handleClearFile}
            previewVariant="video"
            accept={getMetaAcceptString("VIDEO")}
            maxSizeMB={getMetaMaxSizeMB("VIDEO")}
            validator={validateMetaVideo}
            allowedTypesLabel={getMetaAllowedTypesLabel("VIDEO")}
            hint="Upload a sample video for the template header. Use H.264 video and AAC audio for best compatibility."
          />
        )}

        {value === "DOCUMENT" && (
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            existingFileUrl={!selectedFile ? headerMediaUrl : undefined}
            onClear={handleClearFile}
            previewVariant="document"
            accept={getMetaAcceptString("DOCUMENT")}
            maxSizeMB={getMetaMaxSizeMB("DOCUMENT")}
            validator={validateMetaDocument}
            allowedTypesLabel={getMetaAllowedTypesLabel("DOCUMENT")}
            hint="Upload a sample document for the template header. PDF, DOC(X), XLS(X), PPT(X), or TXT. Filename up to 240 characters."
          />
        )}

        {value === "LOCATION" && (
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <Input
              type="text"
              value={locationName}
              onChange={(e) => onLocationNameChange(e.target.value)}
              placeholder="e.g. Central Park"
            />
            <Input
              type="text"
              value={locationAddress}
              onChange={(e) => onLocationAddressChange(e.target.value)}
              placeholder="e.g. 123 Main Street, City, Country"
            />
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 block">
                Location *
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <LocationSearch
                    value={locationQuery}
                    onSearchChange={setLocationQuery}
                    onPlaceSelect={(details) => {
                      onLocationNameChange(details.name);
                      onLocationAddressChange(details.address);
                      setMapQuery(details.address);
                    }}
                    placeholder="Search location (e.g. Lahore)"
                    aria-label="Search location"
                  />
                </div>
                {mapQuery && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-200 text-slate-600 hover:bg-slate-300 whitespace-nowrap"
                  >
                    View in Map
                  </a>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              You can share only the static location and not real time locations
              on WhatsApp business.
            </p>
          </div>
        )}
      </div>
    </TemplateFormField>
  );
};
