import React from "react";
import {
  useTemplatePreview,
  getBodySegments,
} from "../../hooks/useTemplatePreview";
import "../../styles/template-preview.css";
import {
  CheckCircle,
  Mic,
  Phone,
  Link as LinkIcon,
  MessageCircle,
  FileText,
  Copy,
} from "lucide-react";

/** Renders body text with {{variable}} segments highlighted. Returns null if body is empty (don't show body block). */
function BodyWithVariables({ body }: { body: string }) {
  if (!body.trim()) return null;
  const segments = getBodySegments(body);
  return (
    <span className="template-preview-bubble__body">
      {segments.map((seg, i) =>
        seg.type === "variable" ? (
          <span key={i} className="template-preview-bubble__variable">
            {seg.value.toUpperCase()}
          </span>
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </span>
  );
}

import { CarouselPreview } from "../ui/CarouselPreview";
import { LocationMap } from "../ui/LocationMap";

export const MessagePreview: React.FC = () => {
  const { draft } = useTemplatePreview();

  const isCarousel = draft.category === "CAROUSEL";
  const carouselCards = draft.carouselCards || [];
  const hasCarouselCards = isCarousel && carouselCards.length > 0;

  const hasFooter = draft.footer.trim().length > 0;
  const hasButtons =
    draft.buttons.length > 0 && draft.buttons.some((b) => b.text.trim());
  const hasBody = draft.body.trim().length > 0;
  /** Header counts as content only when user has actually added something (not just selected the radio). */
  const hasHeaderContent =
    (draft.headerType === "TEXT" && draft.headerText.trim().length > 0) ||
    (draft.headerType === "IMAGE" && !!draft.headerMediaUrl) ||
    (draft.headerType === "VIDEO" && !!draft.headerMediaUrl) ||
    (draft.headerType === "DOCUMENT" && !!draft.headerMediaUrl) ||
    (draft.headerType === "LOCATION" &&
      (draft.locationName?.trim() || draft.locationAddress?.trim()));
  /** Only show the message bubble when there is real content; no bubble on radio click without upload/input. */
  const hasBubbleContent =
    hasHeaderContent || hasBody || hasFooter || hasButtons || hasCarouselCards;
  const channelDisplay = draft.channelName || "MyPetsFirst...";

  return (
    <div className="template-preview-phone">
      <div className="template-preview-phone__header">
        <span className="template-preview-phone__header-back" aria-hidden>
          ←
        </span>
        <div className="template-preview-phone__header-avatar">
          <span className="template-preview-phone__header-avatar-text">
            PETS
            <br />
            FIRST
          </span>
        </div>
        <div className="template-preview-phone__header-info">
          <div className="template-preview-phone__header-name">
            {channelDisplay}
          </div>
          <div className="template-preview-phone__header-status">WhatsApp</div>
        </div>
        <div className="template-preview-phone__header-actions">
          <span className="template-preview-phone__header-verified" aria-hidden>
            <CheckCircle />
          </span>
          <span className="template-preview-phone__header-menu" aria-hidden>
            ⋮
          </span>
        </div>
      </div>

      <div className="template-preview-phone__chat-area">
        {hasBubbleContent && (
          <div className="h-full max-h-[360px] overflow-y-auto pr-1">
            <div className="template-preview-bubble">
              {!isCarousel &&
                (draft.headerType === "IMAGE" ||
                draft.headerType === "VIDEO" ? (
                  draft.headerMediaUrl ? (
                    draft.headerType === "VIDEO" ? (
                      <video
                        key={draft.headerMediaUrl}
                        src={draft.headerMediaUrl}
                        className="template-preview-bubble__header-media"
                        controls={false}
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={draft.headerMediaUrl}
                        alt="Header"
                        className="template-preview-bubble__header-media"
                      />
                    )
                  ) : (
                    <div className="template-preview-bubble__header-media">
                      [Media]
                    </div>
                  )
                ) : null)}

              {!isCarousel &&
                draft.headerType === "TEXT" &&
                draft.headerText.trim() && (
                  <div className="template-preview-bubble__header-text">
                    {draft.headerText}
                  </div>
                )}

              {!isCarousel && draft.headerType === "DOCUMENT" && (
                <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg mb-2">
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Document</p>
                    <p className="text-[10px] text-slate-500">
                      File attachment
                    </p>
                  </div>
                </div>
              )}

              {!isCarousel && draft.headerType === "LOCATION" && (
                <div className="mb-2">
                  <LocationMap
                    name={draft.locationName}
                    address={draft.locationAddress}
                    height={120}
                    aspectRatio={16 / 9}
                    className="rounded-lg overflow-hidden"
                  />
                </div>
              )}

              {hasBody ? <BodyWithVariables body={draft.body} /> : null}

              {isCarousel && hasCarouselCards && (
                <CarouselPreview
                  className="mt-3"
                  cards={carouselCards.map((c) => ({
                    id: c.id,
                    imageUrl: c.headerMediaUrl,
                    bodyText: c.bodyText,
                    format: draft.carouselHeaderFormat || "IMAGE",
                    buttons: (c.buttons || []).map((b) => ({
                      type: b.type,
                      text: b.text || "",
                      url: b.url,
                      phone_number: b.phone_number,
                    })),
                  }))}
                  hasCardBody={Boolean(draft.carouselHasCardBody)}
                  compact
                />
              )}

              {!isCarousel && hasFooter && (
                <div className="template-preview-bubble__footer">
                  {draft.footer}
                </div>
              )}

              {!isCarousel && hasButtons && (
                <>
                  <div className="template-preview-bubble__btn-divider template-preview-bubble__btn-divider--above-buttons" />
                  <div className="template-preview-bubble__buttons">
                    {draft.buttons
                      .filter((b) => b.text.trim())
                      .slice(0, 3)
                      .map((btn, i) => {
                        const Icon =
                          btn.type === "PHONE_NUMBER"
                            ? Phone
                            : btn.type === "URL"
                              ? LinkIcon
                              : btn.type === "COPY_CODE"
                                ? Copy
                                : btn.type === "FLOW"
                                  ? FileText
                                  : MessageCircle;
                        return (
                          <React.Fragment key={i}>
                            {i > 0 && (
                              <div className="template-preview-bubble__btn-divider" />
                            )}
                            <span className="template-preview-bubble__btn template-preview-bubble__btn--link">
                              <Icon
                                className="template-preview-bubble__btn-icon"
                                aria-hidden
                              />
                              <span>{btn.text}</span>
                            </span>
                          </React.Fragment>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="template-preview-phone__input-bar">
        <div className="template-preview-phone__input-wrap">
          <span className="template-preview-phone__input-emoji" aria-hidden>
            😀
          </span>
          <input
            type="text"
            placeholder="Message"
            readOnly
            aria-label="Message input"
          />
          <span className="template-preview-phone__input-attach" aria-hidden>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </span>
          <span className="template-preview-phone__input-camera" aria-hidden>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
        </div>
        <span className="template-preview-phone__mic-btn" aria-hidden>
          <Mic />
        </span>
      </div>
    </div>
  );
};
