import React from "react";
import type {
  BaseTemplateComponent,
  CarouselTemplateComponent,
  MessageTemplate,
} from "../../types";
import { Check } from "lucide-react";
import Tooltip from "./Tooltip";
import CarouselPreview from "./CarouselPreview";
import { getBodySegmentsWithVariableValues } from "../../utils/templateBodySegments";
import CardActionsMenu from "./CardActionsMenu";
import "../../styles/template-preview.css";

interface TemplateCardProps {
  template: MessageTemplate;
  onBroadcastClick: () => void;
  onUploadClick: () => void;
  onViewTemplateClick?: () => void;
  onDeleteClick?: () => void;
  deleteDisabled?: boolean;
  onMouseEnter?: () => void;
  isSelected?: boolean;
  expanded?: boolean;
  expandedContent?: React.ReactNode;
  uploadedImageUrl?: string | null;
  showUploadButton?: boolean;
  uploadLabel?: string;
  broadcastDisabled?: boolean;
  uploadDisabled?: boolean;
  /** Created date from Strapi (ISO string). */
  createdAt?: string;
  /** When true, show checkbox for bulk selection. */
  selectionMode?: boolean;
  /** Whether this card is selected in bulk selection. */
  bulkSelected?: boolean;
  /** Called when bulk selection checkbox is toggled. */
  onBulkSelectChange?: (selected: boolean) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onBroadcastClick,
  onUploadClick,
  onViewTemplateClick,
  onDeleteClick,
  deleteDisabled = false,
  onMouseEnter,
  isSelected = false,
  expanded = false,
  expandedContent,
  uploadedImageUrl,
  showUploadButton = true,
  uploadLabel = "Upload Media",
  broadcastDisabled = false,
  uploadDisabled = false,
  createdAt,
  selectionMode = false,
  bulkSelected = false,
  onBulkSelectChange,
}) => {
  // Extract message content from components (handle both standard + carousel templates)
  const carouselComponent = template.components?.find(
    (c): c is CarouselTemplateComponent => c.type === "CAROUSEL",
  );
  const headerComponent = template.components?.find(
    (c): c is BaseTemplateComponent => c.type === "HEADER",
  );
  const bodyComponent = template.components?.find(
    (c): c is BaseTemplateComponent => c.type === "BODY",
  );
  const footerComponent = template.components?.find(
    (c): c is BaseTemplateComponent => c.type === "FOOTER",
  );
  const buttonsComponent = template.components?.find(
    (c): c is BaseTemplateComponent => c.type === "BUTTONS",
  );

  const headerText = headerComponent?.text || "";
  const bodyText = bodyComponent?.text || "";
  const footerText = footerComponent?.text || "";
  const buttons = buttonsComponent?.buttons || [];

  // Get media URL from header example (or first carousel card header)
  const firstCarouselHeader = carouselComponent?.cards?.[0]?.components?.find(
    (c): c is BaseTemplateComponent => c.type === "HEADER",
  );
  const headerMediaUrl =
    headerComponent?.example?.header_handle?.[0] ||
    firstCarouselHeader?.example?.header_handle?.[0];
  // Use uploaded image if available, otherwise use Meta template image
  const displayMediaUrl = uploadedImageUrl || headerMediaUrl;
  const effectiveHeaderFormat =
    headerComponent?.format || firstCarouselHeader?.format;
  const hasHeaderMedia =
    effectiveHeaderFormat === "IMAGE" || effectiveHeaderFormat === "VIDEO";
  const isVideo = effectiveHeaderFormat === "VIDEO";
  const isImage = effectiveHeaderFormat === "IMAGE";
  const isDocument = effectiveHeaderFormat === "DOCUMENT";
  const isLocation = effectiveHeaderFormat === "LOCATION";

  // Carousel: collect each card's header image + body (with segments for variable highlighting)
  const isCarousel = Boolean(carouselComponent?.cards?.length);
  const isAttachmentHeaderTemplate =
    !isCarousel && (isImage || isVideo || isDocument);
  const carouselCardsForDisplay = isCarousel
    ? (carouselComponent!.cards ?? []).map((card) => {
        const cardHeader = card.components?.find(
          (c): c is BaseTemplateComponent => c.type === "HEADER",
        );
        const cardBody = card.components?.find(
          (c): c is BaseTemplateComponent => c.type === "BODY",
        );
        const cardButtonsComponent = card.components?.find(
          (c): c is BaseTemplateComponent => c.type === "BUTTONS",
        );
        const imageUrl = cardHeader?.example?.header_handle?.[0];
        const format = cardHeader?.format;
        const rawBodyText = cardBody?.text ?? "";
        const bodySegments = getBodySegmentsWithVariableValues(
          rawBodyText,
          cardBody,
        );
        const buttonsForCard = cardButtonsComponent?.buttons ?? [];
        return {
          imageUrl,
          bodyText: rawBodyText
            ? bodySegments.map((s) => s.value).join("")
            : "",
          bodySegments: bodySegments.some((s) => s.type === "variable")
            ? bodySegments
            : undefined,
          format,
          buttons: buttonsForCard,
        };
      })
    : [];

  // Top-level body segments (for carousel main body and non-carousel body; variable data highlighted)
  const processedBodySegments = getBodySegmentsWithVariableValues(
    bodyText,
    bodyComponent,
  );
  const processedBodyText = processedBodySegments.map((s) => s.value).join("");

  // Format date - use template creation date if available, otherwise current date
  const formatDate = () => {
    let date: Date;
    if (template.created_time) {
      // Meta API returns ISO 8601 format
      date = new Date(template.created_time);
    } else {
      date = new Date();
    }
    const currentYear = new Date().getFullYear();
    const templateYear = date.getFullYear();

    if (templateYear !== currentYear) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const normalizedStatus = (template.status || "").toUpperCase();
  const isPending = normalizedStatus === "PENDING";

  const toTitleCase = (value: string) =>
    value
      .toLowerCase()
      .split(/[\s_]+/g)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const statusLabel =
    normalizedStatus === "APPROVED" || normalizedStatus === "ACTIVE"
      ? "Active"
      : normalizedStatus
        ? toTitleCase(normalizedStatus)
        : "";

  const statusTone =
    normalizedStatus === "APPROVED" || normalizedStatus === "ACTIVE"
      ? "bg-green-100 text-green-700 border-green-200"
      : normalizedStatus === "PENDING"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-slate-100 text-slate-600 border-slate-200";

  const categoryLabel = template.category
    ? toTitleCase(String(template.category))
    : "";

  return (
    <div
      onMouseEnter={isPending ? undefined : onMouseEnter}
      className={`group relative bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col ${
        isSelected
          ? "border-[#00A89E] shadow-lg shadow-teal-100"
          : bulkSelected
            ? "border-[#00A89E] shadow-md shadow-teal-50 ring-2 ring-teal-200/50"
            : "border-slate-200 hover:border-teal-300 hover:shadow-md"
      } ${isPending ? "cursor-not-allowed opacity-75 hover:shadow-none" : "cursor-default"}`}
      style={{
        maxHeight: expanded ? "500px" : "500px",
        height: expanded ? "500px" : "500px",
      }}
    >
      {/* Content */}
      <div className="p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header (Gallabox-like) */}
        <div className="mb-3 flex-shrink-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex items-start gap-2">
              {selectionMode && onBulkSelectChange && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBulkSelectChange(!bulkSelected);
                  }}
                  className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    bulkSelected
                      ? "bg-[#00A89E] border-[#00A89E] text-white"
                      : "bg-white border-slate-300 text-slate-400 hover:border-teal-400 hover:text-teal-600"
                  }`}
                  aria-label={
                    bulkSelected ? "Deselect template" : "Select template"
                  }
                >
                  {bulkSelected ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  ) : null}
                </button>
              )}
              <h3 className="text-[15px] leading-5 font-bold text-slate-800 line-clamp-1">
                {template.name}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              {(onDeleteClick || template.id || onViewTemplateClick) && (
                <CardActionsMenu
                  copyValue={template.id ? String(template.id) : undefined}
                  onView={onViewTemplateClick}
                  onDelete={
                    onDeleteClick
                      ? () => {
                          if (!deleteDisabled) onDeleteClick();
                        }
                      : undefined
                  }
                  deleteDisabled={deleteDisabled}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {statusLabel && (
              <span
                className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${statusTone}`}
              >
                {statusLabel}
              </span>
            )}
            {categoryLabel && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {categoryLabel}
              </span>
            )}
          </div>
        </div>

        {/* Main body text for carousel - WhatsApp-style bubble outside carousel */}
        {isCarousel && processedBodyText && (
          <div className="mb-3 flex-shrink-0 relative">
            {/* Bubble tail on top-left (like WhatsApp incoming message) */}
            <div className="bg-white rounded-2xl px-4 py-2.5 text-sm text-slate-900 leading-relaxed shadow-md border border-slate-100 max-h-[100px] overflow-y-auto custom-scrollbar">
              <p className="whitespace-pre-wrap break-words">
                {processedBodySegments.map((seg, i) =>
                  seg.type === "variable" ? (
                    <span key={i} className="template-listing-variable">
                      {seg.value}
                    </span>
                  ) : (
                    <React.Fragment key={i}>{seg.value}</React.Fragment>
                  ),
                )}
              </p>
            </div>
          </div>
        )}

        {/* Message Preview - Scrollable Content */}
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl overflow-hidden flex-1 flex flex-col min-h-0 border border-slate-200 shadow-sm mb-0">
          {/* Scrollable Content Area - Media and Content together */}
          <div
            className="flex-1 overflow-y-auto custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 #f1f5f9",
              minHeight: 0,
            }}
          >
            <div className="space-y-0">
              {/* Carousel: one slide at a time, with card body below each image */}
              {isCarousel && carouselCardsForDisplay.length > 0 ? (
                <CarouselPreview
                  cards={carouselCardsForDisplay.map((c, i) => ({
                    id: `card-${i}`,
                    imageUrl: c.imageUrl,
                    bodyText: c.bodyText,
                    bodySegments: c.bodySegments,
                    format: c.format as "IMAGE" | "VIDEO" | undefined,
                    buttons: (c.buttons ?? []).map((b) => ({
                      type: b.type,
                      text: b.text || "",
                      url: b.url,
                      phone_number: b.phone_number,
                    })),
                  }))}
                  hasCardBody={true}
                  showBadge
                />
              ) : (
                /* Media Header - single image/video (non-carousel) */
                hasHeaderMedia &&
                displayMediaUrl && (
                  <div
                    className="relative w-full bg-slate-900 overflow-hidden"
                    style={{ height: "180px" }}
                  >
                    {isVideo ? (
                      <video
                        src={displayMediaUrl}
                        className="w-full h-full object-cover"
                        controls={false}
                        muted
                        playsInline
                        onMouseEnter={(e) => {
                          const video = e.currentTarget;
                          video.play().catch(() => {});
                        }}
                        onMouseLeave={(e) => {
                          const video = e.currentTarget;
                          video.pause();
                          video.currentTime = 0;
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : isImage ? (
                      <img
                        src={displayMediaUrl}
                        alt="Template preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          if (target.parentElement) {
                            target.parentElement.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00A89E] to-cyan-500">
                                <span class="text-white text-2xl">🖼️</span>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : null}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <span className="text-white text-xl ml-1">▶</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* WhatsApp-style message preview content */}
              <div className="p-4 space-y-3">
                {/* Text Header (if no media) */}
                {headerComponent && !hasHeaderMedia && headerText && (
                  <div className="pb-2 border-b border-slate-200">
                    <p className="text-sm font-bold text-slate-800">
                      {headerText}
                    </p>
                  </div>
                )}

                {/* Document Header */}
                {isDocument && (
                  <div className="pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg">
                      <span className="text-xl">📄</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-700">
                          Document
                        </p>
                        <p className="text-[10px] text-slate-500">
                          File attachment
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location Header */}
                {isLocation && (
                  <div className="pb-2 border-b border-slate-200">
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <div className="h-20 bg-gradient-to-br from-emerald-50 to-cyan-50 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                          <span className="text-lg">📍</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-black text-slate-800">
                          Location
                        </p>
                        <p className="text-[10px] text-slate-500">
                          The location details will be provided when sending the
                          broadcast.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Body - Full text with scrolling (skip for carousel - body shown at top) */}
                {!isCarousel && processedBodyText ? (
                  <div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {processedBodySegments.map((seg, i) =>
                        seg.type === "variable" ? (
                          <span key={i} className="template-listing-variable">
                            {seg.value}
                          </span>
                        ) : (
                          <React.Fragment key={i}>{seg.value}</React.Fragment>
                        ),
                      )}
                    </p>
                  </div>
                ) : !isCarousel && !headerComponent && !buttons.length ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-slate-400">
                      No preview available
                    </p>
                  </div>
                ) : null}

                {/* Buttons */}
                {buttons.length > 0 && (
                  <div className="pt-2 space-y-2">
                    {buttons &&
                      buttons?.map((button, idx) => {
                        const handlePreviewButtonClick = () => {
                          if (button.type === "URL" && button.url) {
                            const url = button.url.startsWith("http")
                              ? button.url
                              : `https://${button.url}`;
                            window.open(url, "_blank", "noopener,noreferrer");
                            return;
                          }
                          if (
                            button.type === "PHONE_NUMBER" &&
                            button.phone_number
                          ) {
                            window.location.href = `tel:${button.phone_number}`;
                            return;
                          }
                        };

                        const isClickable =
                          (button.type === "URL" && Boolean(button.url)) ||
                          (button.type === "PHONE_NUMBER" &&
                            Boolean(button.phone_number));

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isClickable) return;
                              handlePreviewButtonClick();
                            }}
                            className={`w-full px-3 py-2 bg-[#00A89E] text-white rounded-lg text-xs font-bold text-center transition-colors ${
                              isClickable
                                ? "hover:bg-[#00c4b8] cursor-pointer"
                                : "opacity-70 cursor-default"
                            }`}
                            title={
                              button.type === "PHONE_NUMBER"
                                ? button.phone_number
                                : button.type === "URL"
                                  ? button.url
                                  : button.type === "FLOW" && button.flow_id
                                    ? "In WhatsApp, this opens the flow in-app"
                                    : undefined
                            }
                          >
                            {button.text}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer with language and date - Fixed at bottom */}
          {/* <div className="flex items-center justify-between pt-2 px-4 pb-2 border-t border-slate-100 flex-shrink-0 bg-gradient-to-br from-slate-50 to-white">
            {template.language && (
              <span className="text-[10px] text-slate-500 font-bold">
                {template.language}
              </span>
            )}
            {createdAt && (
              <span className="text-[10px] text-slate-500 font-bold ml-auto">
                {new Date(createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div> */}
        </div>
      </div>

      <div className="px-6 pb-5 pt-3 border-t border-slate-100 bg-white">
        <div
          className={`grid ${showUploadButton && !isCarousel ? "grid-cols-2" : "grid-cols-1"} gap-3`}
        >
          {showUploadButton && !isCarousel && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (uploadDisabled || isPending) return;
                onUploadClick();
              }}
              disabled={uploadDisabled || isPending}
              className="h-10 px-4 rounded-lg text-xs font-black bg-white text-[#00A89E] border-2 border-[#00A89E] hover:bg-[#00A89E] hover:text-white disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {uploadLabel}
            </button>
          )}
          <Tooltip
            content="Please upload the template media before you can start a broadcast."
            disabled={!(isAttachmentHeaderTemplate && broadcastDisabled)}
            className="w-full"
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (broadcastDisabled || isPending) return;
                onBroadcastClick();
              }}
              disabled={broadcastDisabled || isPending}
              className="w-full h-10 px-4 rounded-lg text-xs font-black bg-[#00A89E] text-white hover:bg-[#00c4b8] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              Broadcast
            </button>
          </Tooltip>
        </div>
      </div>

      {expanded && expandedContent && (
        <div
          className="border-t border-slate-100 bg-slate-50 p-4"
          onClick={(event) => event.stopPropagation()}
        >
          {expandedContent}
        </div>
      )}

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00A89E]/0 to-[#00A89E]/0 group-hover:from-[#00A89E]/5 group-hover:to-cyan-500/5 transition-all duration-300 pointer-events-none" />

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .carousel-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .carousel-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .carousel-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .carousel-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default TemplateCard;
