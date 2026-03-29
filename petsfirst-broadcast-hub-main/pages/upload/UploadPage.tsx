import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Uploader from "../../components/upload/Uploader";
import {
  BroadcastResult,
  BroadcastRetryOptions,
  CSVData,
  MessageTemplate,
} from "../../types";
import {
  extractTemplateVariables,
  extractTemplateVariablesInOrder,
} from "../../utils/templateUtils";
import StatusIndicator from "../../components/BroadcastStatus";
import Accordion from "../../components/ui/Accordion";
import Loader from "../../components/ui/Loader";
import TestBroadcastModal from "../../components/modal/TestBroadcastModal";
import RetrySection from "@/components/broadcast/RetrySection";

const DEFAULT_RETRY_OPTIONS: BroadcastRetryOptions = {
  enableRetry: false,
  firstRetryInHours: 12,
  retryCount: 1,
};

interface UploadPageProps {
  template: MessageTemplate | null;
  templateName: string;
  csvData: CSVData | null;
  onDataLoaded: (data: CSVData | null, file?: File | null) => void;
  onBack: () => void;
  /** Called with the uploaded file and optional retry options (retry sent only when enableRetry is true). */
  onStartBroadcast: (
    file: File | null,
    retryOptions?: BroadcastRetryOptions,
  ) => void;
  onTestBroadcast: (numbers: string[]) => Promise<void>;
  results: BroadcastResult[];
  isBroadcasting: boolean;
  isTestBroadcasting: boolean;
}

const UploadPage: React.FC<UploadPageProps> = ({
  template,
  templateName,
  csvData,
  onDataLoaded,
  onBack,
  onStartBroadcast,
  onTestBroadcast,
  results,
  isBroadcasting,
  isTestBroadcasting,
}) => {
  const location = useLocation();
  const [localCsvData, setLocalCsvData] = useState<CSVData | null>(null);
  const templateVariables = useMemo(
    () => (template ? extractTemplateVariables(template) : []),
    [template],
  );
  const templateVariablesInOrder = useMemo(
    () => (template ? extractTemplateVariablesInOrder(template) : []),
    [template],
  );
  const [showAll, setShowAll] = useState(false);
  const [sampleDownloaded, setSampleDownloaded] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [broadcastFile, setBroadcastFile] = useState<File | null>(null);
  const [retryOptions, setRetryOptions] = useState<BroadcastRetryOptions>(
    DEFAULT_RETRY_OPTIONS,
  );
  const statusPanelRef = React.useRef<HTMLDivElement | null>(null);
  const INITIAL_DISPLAY_COUNT = 8;

  const displayCsvData = localCsvData || csvData;

  const isSampleSectionCompleted = sampleDownloaded || true;
  const isUploadSectionCompleted =
    !!displayCsvData && displayCsvData.rows.length > 0;
  const isPreviewSectionCompleted = isUploadSectionCompleted;

  const resetUploadPage = React.useCallback(() => {
    setShowAll(false);
    setSampleDownloaded(false);
    setLocalCsvData(null);
    setBroadcastFile(null);
    onDataLoaded(null, null);
  }, [onDataLoaded]);

  const prevPathRef = React.useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current === "/upload" && location.pathname !== "/upload") {
      resetUploadPage();
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, resetUploadPage]);

  useEffect(() => {
    return () => {
      resetUploadPage();
    };
  }, [resetUploadPage]);

  useEffect(() => {
    if (!isBroadcasting && csvData === null && results.length === 0) {
      setShowAll(false);
      setSampleDownloaded(false);
    }
  }, [isBroadcasting, csvData, results.length]);

  useEffect(() => {
    if (displayCsvData && displayCsvData.rows.length > 0) {
      setOpenAccordions((prev) => {
        const newSet = new Set(prev);
        newSet.add("preview");
        return newSet;
      });
    }
  }, [displayCsvData]);

  useEffect(() => {
    if (isBroadcasting) {
      statusPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [isBroadcasting]);

  useEffect(() => {
    if (csvData && csvData.rows.length > 0) {
      setLocalCsvData(csvData);
    } else if (!csvData) {
      setLocalCsvData(null);
    }
  }, [csvData]);

  const displayedContacts = displayCsvData?.rows
    ? showAll
      ? displayCsvData.rows
      : displayCsvData.rows.slice(0, INITIAL_DISPLAY_COUNT)
    : [];

  const remainingCount = displayCsvData
    ? displayCsvData.rows.length - INITIAL_DISPLAY_COUNT
    : 0;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={() => {
            resetUploadPage();
            onBack();
          }}
          className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <span className="text-lg md:text-xl">←</span>
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-800 mb-1 md:mb-2 truncate">
            Upload Recipient List
          </h2>
          <p className="text-xs md:text-sm text-slate-500 truncate">
            Selected template: <span className="font-bold">{templateName}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-2">
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#00A89E] text-white flex items-center justify-center font-black text-xs md:text-sm">
            ✓
          </div>
          <span className="text-xs md:text-sm font-bold text-[#00A89E] whitespace-nowrap">
            1 Select Template
          </span>
        </div>
        <div className="flex-1 min-w-[20px] h-0.5 bg-[#00A89E]">
          <div className="h-full bg-[#00A89E] w-full" />
        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <div
            className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-xs md:text-sm ${
              isUploadSectionCompleted
                ? "bg-[#00A89E] text-white"
                : "bg-[#00A89E] text-white"
            }`}
          >
            {isUploadSectionCompleted ? "✓" : "2"}
          </div>
          <span className="text-xs md:text-sm font-bold text-[#00A89E] whitespace-nowrap">
            2 Select Audience
          </span>
        </div>
        <div
          className={`flex-1 min-w-[20px] h-0.5 ${
            isUploadSectionCompleted ? "bg-[#00A89E]" : "bg-slate-200"
          }`}
        >
          {isUploadSectionCompleted && (
            <div className="h-full bg-[#00A89E] w-full" />
          )}
        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <div
            className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-xs md:text-sm ${
              isUploadSectionCompleted
                ? "bg-[#00A89E] text-white"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            3
          </div>
          <span
            className={`text-xs md:text-sm font-bold whitespace-nowrap ${
              isUploadSectionCompleted ? "text-[#00A89E]" : "text-slate-400"
            }`}
          >
            3 Send Broadcast
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-start">
        <div className="lg:col-span-12">
          <Accordion
            controlledOpenItems={openAccordions}
            onOpenItemsChange={setOpenAccordions}
            items={[
              {
                id: "sample",
                title: "Download a sample file",
                description:
                  "Use a ready-to-fill Excel file with the required fields",
                icon: "✓",
                badge: "Optional",
                isCompleted: isSampleSectionCompleted,
                defaultOpen: false,
                children: null,
                footer: (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs md:text-sm text-slate-600 font-bold">
                          Required Variables:
                        </span>
                        <span className="text-[10px] md:text-xs text-slate-700 font-medium">
                          {`{{name}}`}
                        </span>
                        <span className="text-[10px] md:text-xs text-slate-700 font-medium">
                          {`{{phone}}`}
                        </span>
                      </div>
                      {templateVariables.filter((v) => {
                        const vLower = v.toLowerCase().trim();
                        return (
                          vLower !== "name" &&
                          vLower !== "phone" &&
                          vLower !== "mediaurl" &&
                          vLower !== "media_url" &&
                          v !== "mediaUrl" &&
                          v !== "MediaUrl"
                        );
                      }).length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs md:text-sm text-slate-600 font-bold">
                            Additional Variables:
                          </span>
                          {templateVariables
                            .filter((v) => {
                              const vLower = v.toLowerCase().trim();
                              return (
                                vLower !== "name" &&
                                vLower !== "phone" &&
                                vLower !== "mediaurl" &&
                                vLower !== "media_url" &&
                                v !== "mediaUrl" &&
                                v !== "MediaUrl"
                              );
                            })
                            .map((v) => (
                              <span
                                key={v}
                                className="text-[10px] md:text-xs text-slate-700 font-medium"
                              >
                                {`{{${v}}}`}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          const normalizedVars = templateVariables
                            .map((v) => v.replace(/^\{\{?\s*|\s*\}?\}?$/g, ""))
                            .map((v) => v.trim())
                            .filter(Boolean);
                          const seen = new Set<string>();
                          const optionalVars: string[] = [];
                          for (const v of normalizedVars) {
                            const key = v.toLowerCase();
                            if (key === "name" || key === "phone") continue;
                            if (!seen.has(key)) {
                              seen.add(key);
                              optionalVars.push(v);
                            }
                          }
                          const headers = [
                            "Name",
                            "Phone",
                            ...optionalVars.map(
                              (h) => h.charAt(0).toUpperCase() + h.slice(1),
                            ),
                          ];
                          const sampleRow = [
                            "Ali Raza",
                            "+918122334455",
                            ...optionalVars.map((k) =>
                              k.toLowerCase() === "email"
                                ? "ali@example.com"
                                : k,
                            ),
                          ];
                          const csvContent = `${headers.join(",")}\n${sampleRow.join(",")}`;
                          const blob = new Blob([csvContent], {
                            type: "text/csv",
                          });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.setAttribute("href", url);
                          a.setAttribute(
                            "download",
                            "pets_first_broadcast_template.csv",
                          );
                          a.click();
                          window.URL.revokeObjectURL(url);
                          setSampleDownloaded(true);
                        }}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-[#00A89E] hover:bg-[#00c4b8] text-white rounded-xl text-xs md:text-sm font-black transition-colors flex items-center gap-2"
                      >
                        <span>📥</span>
                        <span className="hidden sm:inline">
                          Download Sample file
                        </span>
                        <span className="sm:hidden">Download</span>
                      </button>
                    </div>
                  </div>
                ),
              },
              {
                id: "upload",
                title: "Upload your contact file",
                description:
                  "Upload Excel file. We’ll validate names and phone numbers.",
                icon: "⬆️",
                isCompleted: isUploadSectionCompleted,
                isDisabled: false,
                defaultOpen: false,
                children: (
                  <Uploader
                    data={displayCsvData}
                    onDataLoaded={(data, file) => {
                      setLocalCsvData(data);
                      setBroadcastFile(file ?? null);
                      onDataLoaded(data, file);
                    }}
                    templateVariablesInOrder={templateVariablesInOrder}
                  />
                ),
              },
              {
                id: "preview",
                title: "Review recipients",
                description: "Confirm your audience before you send",
                icon: "👥",
                isCompleted: isPreviewSectionCompleted,
                isDisabled: !isUploadSectionCompleted,
                defaultOpen: false,
                children:
                  displayCsvData && displayCsvData.rows.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        {displayedContacts.map((contact, index) => (
                          <div
                            key={index}
                            className="group relative bg-gradient-to-br from-slate-50 to-white p-3 md:p-4 rounded-xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all duration-300"
                          >
                            <div className="absolute -top-1.5 -left-1.5 md:-top-2 md:-left-2 w-5 h-5 md:w-6 md:h-6 bg-teal-500 text-white rounded-lg flex items-center justify-center text-[10px] md:text-xs font-black shadow-lg">
                              {index + 1}
                            </div>

                            <div className="flex items-start gap-2 md:gap-3">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs md:text-sm font-black shadow-sm flex-shrink-0">
                                {contact.name
                                  ? contact.name.charAt(0).toUpperCase()
                                  : "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-800 text-xs md:text-sm truncate mb-1">
                                  {contact.name || "Unknown"}
                                </p>
                                <div className="flex items-center">
                                  <span className="text-xs md:text-sm mr-1">
                                    📱
                                  </span>
                                  <span className="font-mono text-teal-600 font-bold text-[10px] md:text-xs truncate">
                                    {contact.phone || "No phone"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {remainingCount > 0 && (
                        <div className="text-center pt-2">
                          <button
                            onClick={() => setShowAll(!showAll)}
                            className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 hover:bg-teal-50 rounded-xl border border-slate-100 hover:border-teal-200 transition-all text-xs md:text-sm font-bold text-slate-600 hover:text-teal-600"
                          >
                            {!showAll
                              ? `Show +${remainingCount} more contacts`
                              : "Show less"}
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 md:gap-3 pt-3 md:pt-4 border-t border-slate-100">
                        <div className="text-center p-2 md:p-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
                          <div className="text-xl md:text-2xl font-black text-teal-600 mb-1">
                            {displayCsvData.rows.length}
                          </div>
                          <div className="text-[9px] md:text-[10px] font-black text-teal-500 uppercase tracking-wider">
                            Total
                          </div>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                          <div className="text-xl md:text-2xl font-black text-green-600 mb-1">
                            {displayCsvData.rows.filter((r) => r.phone).length}
                          </div>
                          <div className="text-[9px] md:text-[10px] font-black text-green-500 uppercase tracking-wider">
                            Valid
                          </div>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                          <div className="text-xl md:text-2xl font-black text-blue-600 mb-1">
                            {displayCsvData.headers.length}
                          </div>
                          <div className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-wider">
                            Fields
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-400">
                        Upload Excel file to review recipients
                      </p>
                    </div>
                  ),
              },
            ]}
          />

          {displayCsvData && displayCsvData.rows.length > 0 && (
            <div className="pt-6 md:pt-8 space-y-4" ref={statusPanelRef}>
              <RetrySection
                value={retryOptions}
                onChange={setRetryOptions}
                disabled={isBroadcasting || isTestBroadcasting}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  disabled={
                    isBroadcasting || isTestBroadcasting || !displayCsvData
                  }
                  onClick={() => setIsTestModalOpen(true)}
                  className="w-full py-3 md:py-4 rounded-2xl font-black text-sm md:text-base border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Broadcast
                </button>
                <button
                  disabled={
                    isBroadcasting ||
                    isTestBroadcasting ||
                    !displayCsvData ||
                    !broadcastFile
                  }
                  onClick={() => onStartBroadcast(broadcastFile, retryOptions)}
                  className={`relative w-full py-3 md:py-4 rounded-2xl font-black text-sm md:text-base transition-all flex items-center justify-center gap-2 ${
                    isBroadcasting || isTestBroadcasting || !displayCsvData
                      ? "bg-slate-800 cursor-not-allowed text-slate-600"
                      : "bg-[#00A89E] text-white hover:bg-[#00c4b8] hover:scale-[1.02] shadow-[0_20px_40px_-15px_rgba(0,168,158,0.4)] active:scale-[0.98]"
                  }`}
                >
                  {isBroadcasting ? (
                    <>
                      <Loader
                        size="md"
                        className="text-white"
                        ariaLabel="Sending"
                      />
                      <span>Sending…</span>
                    </>
                  ) : (
                    <span>Send Broadcast Now</span>
                  )}
                </button>
              </div>

              {/* <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/80 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-black text-slate-800">
                      Keep this tab open while the broadcast is sending
                    </p>
                    <p className="text-xs md:text-sm text-slate-600 mt-1 leading-relaxed">
                      Closing or refreshing may interrupt delivery status
                      updates. You can continue working in other tabs.
                    </p>
                  </div>
                </div>
              </div> */}

              {/* <StatusIndicator
                results={results}
                total={displayCsvData?.rows.length || 0}
                isBroadcasting={isBroadcasting}
              /> */}
            </div>
          )}
        </div>
      </div>

      <TestBroadcastModal
        isOpen={isTestModalOpen}
        isSending={isTestBroadcasting}
        onClose={() => setIsTestModalOpen(false)}
        onSend={async (numbers) => {
          await onTestBroadcast(numbers);
          setIsTestModalOpen(false);
        }}
      />
    </div>
  );
};

export default UploadPage;
