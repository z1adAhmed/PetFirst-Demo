import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BodySegment } from "../../utils/templateBodySegments";

/** Minimal button shape for carousel preview (draft or API template). */
export interface CarouselPreviewButton {
  type: string;
  text: string;
  url?: string;
  phone_number?: string;
}

export interface CarouselPreviewCard {
  id?: string;
  imageUrl?: string;
  bodyText?: string;
  /** When set, body is rendered with variable segments highlighted (e.g. green in listing). */
  bodySegments?: BodySegment[];
  format?: "IMAGE" | "VIDEO";
  buttons?: CarouselPreviewButton[];
}

export interface CarouselPreviewProps {
  cards: CarouselPreviewCard[];
  /** Show body section (even if empty) when true; when false, only show body if card has bodyText. */
  hasCardBody?: boolean;
  /** Show "Carousel" badge (e.g. on template cards). */
  showBadge?: boolean;
  /** Compact style for in-bubble preview (smaller nav, no badge). */
  compact?: boolean;
  /** Optional class for the root. */
  className?: string;
}

const CAROUSEL_IMAGE_HEIGHT = 180;

/**
 * Reusable WhatsApp-style carousel: one card at a time with prev/next, optional body and buttons.
 * Used in template creation preview and in TemplateCard.
 */
export const CarouselPreview: React.FC<CarouselPreviewProps> = ({
  cards,
  hasCardBody = true,
  showBadge = false,
  compact = false,
  className = "",
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!cards.length) return null;

  const safeIndex = Math.min(activeIndex, cards.length - 1);
  const current = cards[safeIndex];
  const hasMultiple = cards.length > 1;

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((i) => (i <= 0 ? cards.length - 1 : i - 1));
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((i) => (i >= cards.length - 1 ? 0 : i + 1));
  };

  const navBtnClass = compact
    ? "w-7 h-7 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white hover:border-teal-400 hover:text-teal-600 text-xs font-bold"
    : "w-9 h-9 rounded-full bg-white/98 backdrop-blur-sm border-2 border-white/50 shadow-lg flex items-center justify-center text-slate-700 hover:bg-white hover:border-teal-400 hover:text-teal-600 transition-all duration-200 hover:scale-110";

  const renderMedia = () => {
    const url = current.imageUrl;
    if (!url) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-300 text-xs">
          No media
        </div>
      );
    }
    if (current.format === "VIDEO") {
      return (
        <video
          src={url}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            e.currentTarget.currentTime = 0.5;
          }}
        />
      );
    }
    return (
      <img
        src={url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          const t = e.currentTarget;
          t.style.display = "none";
          const parent = t.parentElement;
          if (parent) {
            const fallback = document.createElement("div");
            fallback.className =
              "absolute inset-0 flex items-center justify-center bg-slate-700";
            fallback.innerHTML =
              '<span class="text-white text-2xl">🖼️</span>';
            parent.appendChild(fallback);
          }
        }}
      />
    );
  };

  const showBody =
    (hasCardBody && (current.bodyText?.trim() ?? "")) || (!hasCardBody && current.bodyText?.trim());
  const showButtons = current.buttons && current.buttons.length > 0;

  const handleButtonClick = (button: CarouselPreviewButton) => {
    if (button.type === "URL" && button.url) {
      const url = button.url.startsWith("http") ? button.url : `https://${button.url}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    if (button.type === "PHONE_NUMBER" && button.phone_number) {
      window.location.href = `tel:${button.phone_number}`;
    }
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm relative ${className}`}
    >
      {showBadge && (
        <div className="absolute top-2 left-2 z-20">
          <div className="px-2 py-1 rounded-lg bg-[#00A89E] text-white text-[10px] font-black uppercase tracking-wider shadow-md">
            Carousel
          </div>
        </div>
      )}

      <div
        className="relative w-full bg-slate-800 overflow-hidden"
        style={{ height: CAROUSEL_IMAGE_HEIGHT }}
      >
        {renderMedia()}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 ${navBtnClass}`}
            >
              {compact ? "‹" : <ChevronLeft className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 ${navBtnClass}`}
            >
              {compact ? "›" : <ChevronRight className="w-5 h-5" />}
            </button>
          </>
        )}
      </div>

      {showBody && (
        <div className={compact ? "px-3 py-2" : "px-4 pt-3"}>
          <div
            className={
              compact
                ? "text-xs text-slate-900 leading-relaxed whitespace-pre-wrap break-words max-h-24 overflow-y-auto"
                : "bg-[#DCF8C6] rounded-lg px-4 py-2.5 text-sm text-slate-900 leading-relaxed shadow-sm max-h-28 overflow-y-auto"
            }
          >
            <p className="whitespace-pre-wrap break-words">
              {current.bodySegments?.length
                ? current.bodySegments.map((seg, i) =>
                    seg.type === "variable" ? (
                      <span key={i} className="template-listing-variable">
                        {seg.value}
                      </span>
                    ) : (
                      <React.Fragment key={i}>{seg.value}</React.Fragment>
                    ),
                  )
                : current.bodyText}
            </p>
          </div>
        </div>
      )}

      {showButtons && (
        <div className={compact ? "px-3 pb-2 pt-1 space-y-1.5" : "px-4 pb-4 pt-2 space-y-2"}>
          {current.buttons!.map((button, index) => {
            const isClickable =
              (button.type === "URL" && Boolean(button.url)) ||
              (button.type === "PHONE_NUMBER" && Boolean(button.phone_number));
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isClickable) return;
                  handleButtonClick(button);
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
                      : undefined
                }
              >
                {button.text || "Button"}
              </button>
            );
          })}
        </div>
      )}

      {hasMultiple && (
        <div className="px-3 pb-2 flex items-center justify-center gap-1">
          {cards.map((card, idx) => (
            <span
              key={card.id ?? idx}
              className={`w-1.5 h-1.5 rounded-full ${
                idx === safeIndex ? "bg-teal-500" : "bg-slate-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CarouselPreview;
