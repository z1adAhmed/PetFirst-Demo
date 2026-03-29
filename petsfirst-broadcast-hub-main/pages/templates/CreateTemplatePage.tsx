import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useTemplateDraft } from "../../hooks/useTemplateDraft";
import { getBodyVariableNames } from "../../hooks/useTemplatePreview";
import { submitCreateTemplate } from "../../store/thunks/createTemplateThunks";
import { fetchFlows } from "../../store/thunks/templateThunks";
import { TEMPLATE_NAME_MAX } from "../../store/slices/createTemplateSlice";
import {
  TemplateFormField,
  MessageHeaderField,
  MessageBodyEditor,
  BodyVariableSamplesSection,
  FooterInput,
  ButtonsSection,
  MessagePreview,
  CarouselFormatSection,
  CarouselCardsSection,
  TemplateSubmissionModal,
} from "../../components/template-create";
import Dropdown from "../../components/ui/Dropdown";
import SearchableDropdown from "../../components/ui/SearchableDropdown";
import Input from "../../components/ui/Input";
import Loader from "../../components/ui/Loader";
import { metaLanguages } from "../../data/metaLanguages";
import { isValidEmail } from "../../utils/validation";
import type {
  BaseTemplateComponent,
  CarouselTemplateComponent,
  MessageTemplate,
  TemplateDraft,
  TemplateDraftButton,
} from "../../types";

const CATEGORIES = [
  { value: "", label: "Select Category" },
  { value: "MARKETING", label: "Marketing" },
  { value: "UTILITY", label: "Utility", disabled: false },
  {
    value: "CAROUSEL",
    label: "Carousel",
    description: "Send 10 media cards",
    badge: "NEW",
  },
];
const LANGUAGE_OPTIONS = [
  { value: "", label: "Select Language" },
  ...metaLanguages,
];

const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(
      TEMPLATE_NAME_MAX,
      `Template name must be at most ${TEMPLATE_NAME_MAX} characters`,
    ),
  category: z.string().min(1, "Category is required"),
  language: z.string().min(1, "Language is required"),
});

type FieldErrors = Record<string, string>;

type CreateTemplateLocationState = {
  mode?: "view";
  template?: MessageTemplate;
  uploadedImageUrl?: string;
};

const getNamedParamsFromExample = (component?: BaseTemplateComponent) => {
  const params = component?.example?.body_text_named_params || [];
  return params.reduce<Record<string, string>>((acc, item) => {
    if (!item?.param_name) return acc;
    acc[item.param_name] = item.example || "";
    return acc;
  }, {});
};

const mapPositionalVariablesToNamed = (
  text: string | undefined,
  mappedOrder?: string[],
) => {
  if (!text) return "";
  if (!mappedOrder?.length) return text;
  return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_match, rawIndex) => {
    const idx = Number(rawIndex) - 1;
    const mappedName = mappedOrder[idx];
    if (!mappedName) return `{{${rawIndex}}}`;
    return `{{${mappedName}}}`;
  });
};

const mapTemplateButtonToDraftButton = (
  button: any,
  couponCode?: string,
): TemplateDraftButton => {
  if (button?.type === "COPY_CODE") {
    return {
      type: "COPY_CODE",
      text: "Copy offer code",
      copyCodeExample: button?.example || couponCode || "",
    };
  }
  if (button?.type === "FLOW") {
    return {
      type: "FLOW",
      text: button?.text || "",
      flow_id: button?.flow_id != null ? Number(button.flow_id) : undefined,
      flow_action: button?.flow_action,
      navigate_screen: button?.navigate_screen,
    };
  }
  return {
    type: button?.type,
    text: button?.text || "",
    url: button?.url,
    phone_number: button?.phone_number,
  } as TemplateDraftButton;
};

const buildDraftFromTemplate = (
  template: MessageTemplate,
  uploadedImageUrl?: string,
): Partial<TemplateDraft> => {
  const components = template.components || [];
  const header = components.find(
    (c): c is BaseTemplateComponent => c.type === "HEADER",
  );
  const body = components.find(
    (c): c is BaseTemplateComponent => c.type === "BODY",
  );
  const footer = components.find(
    (c): c is BaseTemplateComponent => c.type === "FOOTER",
  );
  const buttons = components.find(
    (c): c is BaseTemplateComponent => c.type === "BUTTONS",
  );
  const carousel = components.find(
    (c): c is CarouselTemplateComponent => c.type === "CAROUSEL",
  );

  const isCarousel = Boolean(carousel?.cards?.length);
  if (isCarousel && carousel) {
    const firstCardHeader = carousel.cards[0]?.components?.find(
      (c): c is BaseTemplateComponent => c.type === "HEADER",
    );
    const firstCardButtons = carousel.cards[0]?.components?.find(
      (c): c is BaseTemplateComponent => c.type === "BUTTONS",
    )?.buttons;
    const buttonTypes = Array.from(
      new Set((firstCardButtons || []).map((b) => b.type).filter(Boolean)),
    ).slice(0, 2) as Array<"URL" | "PHONE_NUMBER" | "QUICK_REPLY">;

    const cards = carousel.cards.map((card, idx) => {
      const cardHeader = card.components?.find(
        (c): c is BaseTemplateComponent => c.type === "HEADER",
      );
      const cardBody = card.components?.find(
        (c): c is BaseTemplateComponent => c.type === "BODY",
      );
      const cardButtons = card.components?.find(
        (c): c is BaseTemplateComponent => c.type === "BUTTONS",
      )?.buttons;
      return {
        id: `view_card_${idx + 1}`,
        headerMediaUrl: cardHeader?.example?.header_handle?.[0],
        bodyText: mapPositionalVariablesToNamed(
          cardBody?.text,
          template.variableIndexMap?.carouselCardBody?.[String(idx)],
        ),
        bodyVariableSamples: getNamedParamsFromExample(cardBody),
        buttons: (cardButtons || []).map((b) => ({
          type: b.type as "URL" | "PHONE_NUMBER" | "QUICK_REPLY",
          text: b.text || "",
          url: b.url,
          phone_number: b.phone_number,
        })),
      };
    });

    return {
      name: template.name || "",
      category: "CAROUSEL",
      language: template.language || "",
      body: mapPositionalVariablesToNamed(
        body?.text,
        template.variableIndexMap?.body,
      ),
      bodyVariableSamples: getNamedParamsFromExample(body),
      carouselHeaderFormat:
        (firstCardHeader?.format as "IMAGE" | "VIDEO" | undefined) || "IMAGE",
      carouselHasCardBody: cards.some((c) => Boolean(c.bodyText?.trim())),
      carouselButton1Type: buttonTypes[0] || "",
      carouselButton2Type: buttonTypes[1] || "",
      carouselCards: cards,
    };
  }

  return {
    name: template.name || "",
    category: template.category || "MARKETING",
    language: template.language || "",
    headerType:
      (header?.format as
        | "NONE"
        | "TEXT"
        | "IMAGE"
        | "VIDEO"
        | "DOCUMENT"
        | "LOCATION") || "NONE",
    headerText: header?.text || "",
    headerMediaUrl: uploadedImageUrl || header?.example?.header_handle?.[0],
    body: mapPositionalVariablesToNamed(
      body?.text,
      template.variableIndexMap?.body,
    ),
    bodyVariableSamples: getNamedParamsFromExample(body),
    footer: footer?.text || "",
    buttons: (buttons?.buttons || []).map((b) =>
      mapTemplateButtonToDraftButton(b, template.couponCode),
    ),
  };
};

const CreateTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.config.config);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const headerMediaFileRef = useRef<File | null>(null);
  const viewState =
    (location.state as CreateTemplateLocationState | null) || null;
  const isViewOnly = viewState?.mode === "view" && Boolean(viewState.template);
  const {
    draft,
    submitStatus,
    submitError,
    setName,
    setCategory,
    setChannelName,
    setLanguage,
    setHeaderType,
    setHeaderText,
    setHeaderMediaUrl,
    setLocationName,
    setLocationAddress,
    setBody,
    setBodyVariableSample,
    setFooter,
    setButtons,
    addButton,
    updateButton,
    removeButton,
    resetDraft,
    setDraft,
    setCarouselFormat,
    addCarouselCard,
    updateCarouselCard,
    removeCarouselCard,
  } = useTemplateDraft();

  const submitting = submitStatus === "pending";
  const isCarousel = draft.category === "CAROUSEL";
  const cardFilesRef = useRef<Record<string, File | null>>({});
  const latestDraftRef = useRef(draft);
  const preViewDraftRef = useRef<TemplateDraft | null>(null);
  const viewModeActiveRef = useRef(false);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  useEffect(() => {
    latestDraftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    return () => {
      resetDraft();
    };
  }, [resetDraft]);

  useEffect(() => {
    if (config.accessToken?.trim() && config.wabaId?.trim()) {
      dispatch(
        fetchFlows({ accessToken: config.accessToken, wabaId: config.wabaId }),
      );
    }
  }, [config.accessToken, config.wabaId, dispatch]);

  useEffect(() => {
    if (isViewOnly && viewState?.template) {
      if (!viewModeActiveRef.current) {
        preViewDraftRef.current = JSON.parse(
          JSON.stringify(latestDraftRef.current),
        ) as TemplateDraft;
        viewModeActiveRef.current = true;
      }
      const viewDraft = buildDraftFromTemplate(
        viewState.template,
        viewState.uploadedImageUrl,
      );
      setDraft(viewDraft);
      setFieldErrors({});
      return;
    }

    if (viewModeActiveRef.current) {
      if (preViewDraftRef.current) {
        setDraft(preViewDraftRef.current);
      }
      preViewDraftRef.current = null;
      viewModeActiveRef.current = false;
    }
  }, [isViewOnly, viewState, setDraft]);

  const handleSubmit = async () => {
    if (isViewOnly) return;
    const result = createTemplateSchema.safeParse({
      name: draft.name.trim(),
      category: draft.category,
      language: draft.language,
    });
    if (!result.success) {
      const errors: FieldErrors = {};
      const flattened = result.error.flatten().fieldErrors;
      Object.entries(flattened).forEach(([key, messages]) => {
        if (messages?.[0]) errors[key] = messages[0];
      });
      setFieldErrors(errors);
      return;
    }
    const bodyVars = getBodyVariableNames(draft.body);
    const sampleErrors: FieldErrors = {};
    bodyVars.forEach((varName) => {
      const sample = (draft.bodyVariableSamples ?? {})[varName]?.trim();
      if (!sample) {
        sampleErrors[`body_sample_${varName}`] =
          `Sample text for {{${varName}}} is required`;
        return;
      }
      if (varName.toLowerCase() === "email" && !isValidEmail(sample)) {
        sampleErrors[`body_sample_${varName}`] =
          "Please enter a valid email address (e.g. name@example.com).";
      }
    });
    draft.buttons.forEach((b: any, idx: number) => {
      if (b.type === "COPY_CODE") {
        const code = (b.copyCodeExample ?? "").trim();
        if (!code) {
          sampleErrors[`button_${idx}_copyCodeExample`] =
            "Please enter a sample coupon code (e.g. GET50OFF). This is required for the Copy offer code button.";
        } else if (code.length > 12) {
          sampleErrors[`button_${idx}_copyCodeExample`] =
            "Sample coupon code must be 12 characters or fewer. Please shorten it.";
        }
      }
    });
    if (Object.keys(sampleErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...sampleErrors }));
      return;
    }

    if (isCarousel) {
      const cards = draft.carouselCards || [];
      const buttonTypes = [
        draft.carouselButton1Type,
        draft.carouselButton2Type,
      ].filter((t): t is any => Boolean(t)) as any[];

      if (buttonTypes.length === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          carousel_format:
            "Select at least one button type for carousel cards.",
        }));
        return;
      }

      if (cards.length < 2 || cards.length > 10) {
        setFieldErrors((prev) => ({
          ...prev,
          carousel_cards: "Add between 2 and 10 carousel cards.",
        }));
        return;
      }

      const hasBody = Boolean(draft.carouselHasCardBody);
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        if (!cardFilesRef.current[c.id]) {
          setFieldErrors((prev) => ({
            ...prev,
            carousel_cards: `Card ${i + 1}: header media is required.`,
          }));
          return;
        }
        if (hasBody && !(c.bodyText || "").trim()) {
          setFieldErrors((prev) => ({
            ...prev,
            carousel_cards: `Card ${i + 1}: card body is required.`,
          }));
          return;
        }
        (c.buttons || []).forEach((b: any, idx: number) => {
          if (!b.text?.trim()) {
            sampleErrors[`carousel_card_${i}_btn_${idx}`] =
              `Card ${i + 1}: button ${idx + 1} text is required.`;
          }
          if (b.type === "URL") {
            if (!b.url?.trim()) {
              sampleErrors[`carousel_card_${i}_btn_${idx}_url`] =
                `Card ${i + 1}: URL is required.`;
            }
            if ((b.url || "").includes("{{1}}") && !b.urlExample?.trim()) {
              sampleErrors[`carousel_card_${i}_btn_${idx}_urlExample`] =
                `Card ${i + 1}: URL example is required for {{1}}.`;
            }
          }
          if (b.type === "PHONE_NUMBER" && !b.phone_number?.trim()) {
            sampleErrors[`carousel_card_${i}_btn_${idx}_phone`] =
              `Card ${i + 1}: phone number is required.`;
          }
        });
      }

      if (
        Object.keys(sampleErrors).some((k) => k.startsWith("carousel_card_"))
      ) {
        setFieldErrors((prev) => ({ ...prev, ...sampleErrors }));
        return;
      }
    }

    setFieldErrors({});
    try {
      await dispatch(
        submitCreateTemplate({
          headerMediaFile: headerMediaFileRef.current ?? undefined,
          carouselCardFiles: isCarousel ? cardFilesRef.current : undefined,
        }),
      ).unwrap();
      headerMediaFileRef.current = null;
      setShowSuccessModal(true);
    } catch {
      // submitError is set by the thunk (rejectWithValue) and shown from slice state
    }
  };

  const handleAddButton = (
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE" | "FLOW",
  ) => {
    addButton({
      type,
      text: type === "COPY_CODE" ? "Copy offer code" : "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              resetDraft();
              navigate("/templates");
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            aria-label="Back"
          >
            ←
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-slate-700">
            {isViewOnly ? "View Template" : "Create Template"}
          </h1>
        </div>
        {isViewOnly ? (
          <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
            View only
          </span>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-bold bg-[#00A89E] text-white hover:bg-[#00c4b8] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader
                  size="sm"
                  className="text-white"
                  ariaLabel="Submitting"
                />
                <span>Submitting…</span>
              </>
            ) : (
              "Submit for approval"
            )}
          </button>
        )}
      </div>
      {submitError && (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Form */}
        <div className="lg:col-span-8 space-y-6">
          {isViewOnly && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This is view-only mode. Template details are shown for review and
              cannot be edited.
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6">
            <div
              className={`space-y-6 ${isViewOnly ? "pointer-events-none opacity-90" : ""}`}
            >
              <TemplateFormField
                label="Template name"
                required
                hint="Only lowercase letters, numbers, and underscore (_)"
                charCount={{
                  current: draft.name.length,
                  max: TEMPLATE_NAME_MAX,
                }}
                error={fieldErrors.name}
              >
                <Input
                  type="text"
                  value={draft.name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                  }}
                  placeholder="e.g. welcome_template, order_confirmation"
                  maxLength={TEMPLATE_NAME_MAX}
                />
              </TemplateFormField>

              {/* Category and Language in one row, 50% each */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TemplateFormField
                  label="Category"
                  required
                  error={fieldErrors.category}
                >
                  <Dropdown
                    options={CATEGORIES}
                    value={draft.category}
                    onChange={(v) => {
                      setCategory(v);
                      clearFieldError("category");
                    }}
                    placeholder="Select Category"
                  />
                </TemplateFormField>
                <TemplateFormField
                  label="Language"
                  required
                  error={fieldErrors.language}
                >
                  <SearchableDropdown
                    options={LANGUAGE_OPTIONS}
                    value={draft.language}
                    onChange={(v) => {
                      setLanguage(v);
                      clearFieldError("language");
                    }}
                    placeholder="Select Language"
                    searchPlaceholder="Search language…"
                  />
                </TemplateFormField>
              </div>

              {!isCarousel && (
                <MessageHeaderField
                  value={draft.headerType}
                  headerMediaUrl={draft.headerMediaUrl}
                  headerText={draft.headerText}
                  locationName={draft.locationName ?? ""}
                  locationAddress={draft.locationAddress ?? ""}
                  onTypeChange={setHeaderType}
                  onHeaderTextChange={setHeaderText}
                  onHeaderMediaUrlChange={setHeaderMediaUrl}
                  onHeaderMediaFileChange={(file) => {
                    headerMediaFileRef.current = file ?? null;
                  }}
                  suppressTypeChangeReset={isViewOnly}
                  onLocationNameChange={setLocationName}
                  onLocationAddressChange={setLocationAddress}
                />
              )}

              <div className={isViewOnly ? "pointer-events-auto" : ""}>
                <MessageBodyEditor
                  value={draft.body}
                  onChange={setBody}
                  readOnly={isViewOnly}
                />
              </div>

              <BodyVariableSamplesSection
                body={draft.body}
                samples={draft.bodyVariableSamples ?? {}}
                onSampleChange={(varName, sample) => {
                  setBodyVariableSample(varName, sample);
                  const key = `body_sample_${varName}`;
                  const trimmed = (sample || "").trim();
                  if (!trimmed) {
                    // Don't show "required" while typing; it will be enforced on submit.
                    clearFieldError(key);
                    return;
                  }
                  if (varName.toLowerCase() === "email") {
                    if (!isValidEmail(trimmed)) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        [key]:
                          "Please enter a valid email address (e.g. name@example.com).",
                      }));
                      return;
                    }
                  }
                  clearFieldError(key);
                }}
                errors={Object.fromEntries(
                  Object.entries(fieldErrors)
                    .filter(([k]) => k.startsWith("body_sample_"))
                    .map(([k, v]) => [k.replace("body_sample_", ""), v]),
                )}
              />

              {isCarousel ? (
                <>
                  <CarouselFormatSection
                    headerFormat={draft.carouselHeaderFormat || "IMAGE"}
                    hasCardBody={Boolean(draft.carouselHasCardBody)}
                    button1Type={draft.carouselButton1Type || ""}
                    button2Type={draft.carouselButton2Type || ""}
                    onChange={(patch) => {
                      setCarouselFormat(patch as any);
                      clearFieldError("carousel_format");
                    }}
                  />
                  {fieldErrors.carousel_format && (
                    <p
                      className="text-xs text-rose-600 font-medium"
                      role="alert"
                    >
                      {fieldErrors.carousel_format}
                    </p>
                  )}

                  <CarouselCardsSection
                    headerFormat={draft.carouselHeaderFormat || "IMAGE"}
                    hasCardBody={Boolean(draft.carouselHasCardBody)}
                    buttonTypes={
                      [
                        draft.carouselButton1Type,
                        draft.carouselButton2Type,
                      ].filter((t): t is any => Boolean(t)) as any
                    }
                    cards={draft.carouselCards || []}
                    cardFiles={cardFilesRef.current}
                    onAddCard={(card, file) => {
                      addCarouselCard(card);
                      cardFilesRef.current[card.id] = file;
                      if (file) {
                        const url = URL.createObjectURL(file);
                        updateCarouselCard(card.id, { headerMediaUrl: url });
                      }
                      clearFieldError("carousel_cards");
                    }}
                    onUpdateCard={(id, patch, file) => {
                      // Manage preview URL from uploaded file
                      if (file) {
                        const url = URL.createObjectURL(file);
                        // revoke old object URL if any
                        const existing = (draft.carouselCards || []).find(
                          (c) => c.id === id,
                        )?.headerMediaUrl;
                        if (existing && existing.startsWith("blob:")) {
                          try {
                            URL.revokeObjectURL(existing);
                          } catch {}
                        }
                        patch = { ...patch, headerMediaUrl: url };
                      }
                      updateCarouselCard(id, patch);
                      cardFilesRef.current[id] = file;
                      clearFieldError("carousel_cards");
                    }}
                    onRemoveCard={(id) => {
                      const existing = (draft.carouselCards || []).find(
                        (c) => c.id === id,
                      )?.headerMediaUrl;
                      if (existing && existing.startsWith("blob:")) {
                        try {
                          URL.revokeObjectURL(existing);
                        } catch {}
                      }
                      removeCarouselCard(id);
                      delete cardFilesRef.current[id];
                    }}
                  />
                  {fieldErrors.carousel_cards && (
                    <p
                      className="text-xs text-rose-600 font-medium"
                      role="alert"
                    >
                      {fieldErrors.carousel_cards}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <FooterInput value={draft.footer} onChange={setFooter} />
                  <ButtonsSection
                    buttons={draft.buttons}
                    onAdd={(type) => handleAddButton(type)}
                    onUpdate={updateButton}
                    onRemove={removeButton}
                    onReorder={setButtons}
                    publishedFlows={draft.publishedFlows ?? []}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Real-time preview (Gallabox-style) */}
        {/* Right: sticky + max-height so preview never scrolls into navbar */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-auto space-y-3">
          <MessagePreview />
        </div>
      </div>
      <TemplateSubmissionModal isOpen={submitting} variant="creating" />
      <TemplateSubmissionModal
        isOpen={showSuccessModal}
        variant="success"
        primaryLabel="Move to Templates"
        onPrimaryAction={() => {
          setShowSuccessModal(false);
          navigate("/templates");
        }}
      />
    </div>
  );
};

export default CreateTemplatePage;
