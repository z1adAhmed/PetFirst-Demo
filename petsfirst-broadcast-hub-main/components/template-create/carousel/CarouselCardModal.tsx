import React, { useEffect, useMemo, useState } from "react";
import Input from "../../ui/Input";
import Textarea from "../../ui/Textarea";
import FileUpload from "../../ui/FileUpload";
import PhoneNumberInput from "../../ui/PhoneNumberInput";
import {
  validateMetaImage,
  validateMetaVideo,
  validateMetaImageDimensions,
  getMetaAcceptString,
  getMetaAllowedTypesLabel,
  getMetaMaxSizeMB,
} from "../../../utils/metaMediaValidation";
import type {
  CarouselCardButtonType,
  CarouselCardDraft,
  CarouselHeaderFormat,
} from "../../../types";
import { getBodyVariableNames } from "../../../hooks/useTemplatePreview";

const CARD_BODY_MAX = 160;
const BUTTON_TEXT_MAX = 25;

type FieldErrors = Record<string, string>;

interface CarouselCardModalProps {
  isOpen: boolean;
  index: number; // 0-based
  headerFormat: CarouselHeaderFormat;
  hasCardBody: boolean;
  buttonTypes: CarouselCardButtonType[];
  card: CarouselCardDraft;
  headerFile: File | null;
  onClose: () => void;
  onSave: (patch: Partial<CarouselCardDraft>, headerFile: File | null) => void;
}

const niceButtonType = (t: CarouselCardButtonType) =>
  t === "PHONE_NUMBER" ? "Call phone" : "Website URL";

export const CarouselCardModal: React.FC<CarouselCardModalProps> = ({
  isOpen,
  index,
  headerFormat,
  hasCardBody,
  buttonTypes,
  card,
  headerFile,
  onClose,
  onSave,
}) => {
  const [local, setLocal] = useState<CarouselCardDraft>(card);
  const [localFile, setLocalFile] = useState<File | null>(headerFile);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [varsDropdownOpen, setVarsDropdownOpen] = useState(false);
  const [customVariable, setCustomVariable] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLocal(card);
    setLocalFile(headerFile);
    setErrors({});
    setVarsDropdownOpen(false);
    setCustomVariable("");
    setShowCustomInput(false);
  }, [isOpen, card, headerFile]);

  const title = `Carousel card ${index + 1}`;

  const ensureButtons = useMemo(() => {
    const nextButtons = buttonTypes.map((type, i) => {
      const existing = local.buttons?.[i];
      return {
        type,
        text: existing?.text || "",
        url: existing?.url,
        urlExample: existing?.urlExample,
        phone_number: existing?.phone_number,
      };
    });
    return nextButtons;
  }, [buttonTypes, local.buttons]);

  useEffect(() => {
    // keep local buttons aligned with selected types/order
    setLocal((prev) => ({ ...prev, buttons: ensureButtons as any }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttonTypes.join("|")]);

  const validate = () => {
    const next: FieldErrors = {};
    if (!localFile) next.header = "Card header is required.";
    if (hasCardBody && !(local.bodyText || "").trim()) {
      next.bodyText = "Card body is required.";
    }

    if (hasCardBody) {
      const vars = getBodyVariableNames(local.bodyText || "");
      vars.forEach((v) => {
        const sample = (local.bodyVariableSamples || {})[v]?.trim();
        if (!sample) next[`var_${v}`] = `Sample for {{${v}}} is required.`;
      });
    }

    ensureButtons.forEach((b, idx) => {
      if (!b.text?.trim()) next[`btn_${idx}_text`] = "Button text is required.";
      if (b.type === "URL") {
        if (!b.url?.trim()) next[`btn_${idx}_url`] = "URL is required.";
        const hasVar = (b.url || "").includes("{{1}}");
        if (hasVar && !b.urlExample?.trim()) {
          next[`btn_${idx}_urlExample`] =
            "URL example is required when using {{1}}.";
        }
      }
      if (b.type === "PHONE_NUMBER") {
        if (!b.phone_number?.trim())
          next[`btn_${idx}_phone`] = "Phone number is required.";
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative bg-white rounded-[22px] shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-auto">
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700">
              Card header <span className="text-rose-500">*</span>
            </label>
            <FileUpload
              onFileSelect={(f) => setLocalFile(f)}
              selectedFile={localFile}
              onClear={() => setLocalFile(null)}
              previewVariant={headerFormat === "VIDEO" ? "video" : "image"}
              accept={
                headerFormat === "VIDEO"
                  ? getMetaAcceptString("VIDEO")
                  : getMetaAcceptString("IMAGE")
              }
              maxSizeMB={
                headerFormat === "VIDEO"
                  ? getMetaMaxSizeMB("VIDEO")
                  : getMetaMaxSizeMB("IMAGE")
              }
              validator={
                headerFormat === "VIDEO" ? validateMetaVideo : validateMetaImage
              }
              asyncValidator={
                headerFormat === "VIDEO"
                  ? undefined
                  : validateMetaImageDimensions
              }
              allowedTypesLabel={
                headerFormat === "VIDEO"
                  ? getMetaAllowedTypesLabel("VIDEO")
                  : getMetaAllowedTypesLabel("IMAGE")
              }
              hint="Upload a sample to help us understand what kind of image/video that you want to send to your users. You can change this asset anytime later while sending this template."
            />
            {errors.header && (
              <p className="text-xs text-rose-600 font-medium">
                {errors.header}
              </p>
            )}
          </div>

          {hasCardBody && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-slate-700">
                  Card body <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-400 tabular-nums">
                  {(local.bodyText || "").length}/{CARD_BODY_MAX}
                </span>
              </div>
              <Textarea
                value={local.bodyText || ""}
                onChange={(e) => {
                  const v = e.target.value.slice(0, CARD_BODY_MAX);
                  setLocal((p) => ({ ...p, bodyText: v }));
                  if (errors.bodyText && v.trim()) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.bodyText;
                      return next;
                    });
                  }
                }}
                rows={3}
                placeholder="Describe this card..."
                maxLength={CARD_BODY_MAX}
              />
              {errors.bodyText && (
                <p className="text-xs text-rose-600 font-medium">
                  {errors.bodyText}
                </p>
              )}

              {/* Add variables (like template body) */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setVarsDropdownOpen((o) => !o)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#00A89E]/10 text-[#00A89E] hover:bg-[#00A89E]/20 border border-[#00A89E]/30 flex items-center gap-1.5"
                  >
                    Add variables
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${varsDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {varsDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Contact
                      </div>
                      {["name", "email", "phone"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            const insert = `{{${v}}}`;
                            const next = local.bodyText || "";
                            const withSpace =
                              next &&
                              !next.endsWith(" ") &&
                              !next.endsWith("\n")
                                ? next + " "
                                : next;
                            setLocal((p) => ({
                              ...p,
                              bodyText: (withSpace + insert).slice(
                                0,
                                CARD_BODY_MAX,
                              ),
                            }));
                            setVarsDropdownOpen(false);
                            setShowCustomInput(false);
                            setCustomVariable("");
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {v}
                        </button>
                      ))}
                      {showCustomInput ? (
                        <div className="p-2 border-t border-slate-100 flex gap-2">
                          <Input
                            type="text"
                            value={customVariable}
                            onChange={(e) => setCustomVariable(e.target.value)}
                            placeholder="variable_name"
                            size="sm"
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key !== "Enter") return;
                              const cleaned =
                                customVariable
                                  .trim()
                                  .replace(/\s+/g, "_")
                                  .replace(/[^a-zA-Z0-9_]/g, "") || "variable";
                              const insert = `{{${cleaned}}}`;
                              const next = local.bodyText || "";
                              const withSpace =
                                next &&
                                !next.endsWith(" ") &&
                                !next.endsWith("\n")
                                  ? next + " "
                                  : next;
                              setLocal((p) => ({
                                ...p,
                                bodyText: (withSpace + insert).slice(
                                  0,
                                  CARD_BODY_MAX,
                                ),
                              }));
                              setVarsDropdownOpen(false);
                              setShowCustomInput(false);
                              setCustomVariable("");
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cleaned =
                                customVariable
                                  .trim()
                                  .replace(/\s+/g, "_")
                                  .replace(/[^a-zA-Z0-9_]/g, "") || "variable";
                              const insert = `{{${cleaned}}}`;
                              const next = local.bodyText || "";
                              const withSpace =
                                next &&
                                !next.endsWith(" ") &&
                                !next.endsWith("\n")
                                  ? next + " "
                                  : next;
                              setLocal((p) => ({
                                ...p,
                                bodyText: (withSpace + insert).slice(
                                  0,
                                  CARD_BODY_MAX,
                                ),
                              }));
                              setVarsDropdownOpen(false);
                              setShowCustomInput(false);
                              setCustomVariable("");
                            }}
                            className="px-2 py-1 rounded bg-[#00A89E] text-white text-xs font-bold"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowCustomInput(true)}
                          className="w-full px-3 py-2 text-left text-sm text-[#00A89E] font-medium hover:bg-teal-50"
                        >
                          Add Custom
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Variable samples (required when variables exist) */}
              {getBodyVariableNames(local.bodyText || "").length > 0 && (
                <div className="pt-3 space-y-2">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Variable samples
                  </div>
                  {getBodyVariableNames(local.bodyText || "").map((varName) => (
                    <div key={varName} className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        <span className="variable-tag-create">{`{{${varName}}}`}</span>{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={(local.bodyVariableSamples || {})[varName] ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setLocal((p) => ({
                            ...p,
                            bodyVariableSamples: {
                              ...(p.bodyVariableSamples || {}),
                              [varName]: value,
                            },
                          }));
                          if (errors[`var_${varName}`] && value.trim()) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next[`var_${varName}`];
                              return next;
                            });
                          }
                        }}
                        placeholder={`Enter sample for {{${varName}}}`}
                        size="sm"
                        className={
                          errors[`var_${varName}`] ? "border-rose-300" : ""
                        }
                      />
                      {errors[`var_${varName}`] && (
                        <p className="text-xs text-rose-600">
                          {errors[`var_${varName}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {ensureButtons.map((b, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-slate-800">{`Button ${idx + 1}`}</div>
                <div className="text-xs font-bold text-slate-500">
                  {niceButtonType(b.type)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Button text <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {(b.text || "").length}/{BUTTON_TEXT_MAX}
                  </span>
                </div>
                <Input
                  type="text"
                  value={b.text || ""}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, BUTTON_TEXT_MAX);
                    setLocal((p) => {
                      const next = { ...p };
                      const buttons = [...ensureButtons];
                      buttons[idx] = { ...buttons[idx], text: v } as any;
                      (next as any).buttons = buttons;
                      return next;
                    });
                    if (errors[`btn_${idx}_text`] && v.trim()) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next[`btn_${idx}_text`];
                        return next;
                      });
                    }
                  }}
                  placeholder="e.g. Yes"
                  size="sm"
                />
                {errors[`btn_${idx}_text`] && (
                  <p className="text-xs text-rose-600">
                    {errors[`btn_${idx}_text`]}
                  </p>
                )}
              </div>

              {b.type === "URL" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                      URL <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={b.url || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLocal((p) => {
                          const next = { ...p };
                          const buttons = [...ensureButtons];
                          buttons[idx] = { ...buttons[idx], url: v } as any;
                          (next as any).buttons = buttons;
                          return next;
                        });
                        if (errors[`btn_${idx}_url`] && v.trim()) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next[`btn_${idx}_url`];
                            return next;
                          });
                        }
                      }}
                      placeholder="https://example.com/item/{{1}}"
                      size="sm"
                    />
                    {errors[`btn_${idx}_url`] && (
                      <p className="text-xs text-rose-600">
                        {errors[`btn_${idx}_url`]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                      URL example
                    </label>
                    <Input
                      type="text"
                      value={b.urlExample || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLocal((p) => {
                          const next = { ...p };
                          const buttons = [...ensureButtons];
                          buttons[idx] = {
                            ...buttons[idx],
                            urlExample: v,
                          } as any;
                          (next as any).buttons = buttons;
                          return next;
                        });
                        if (errors[`btn_${idx}_urlExample`] && v.trim()) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next[`btn_${idx}_urlExample`];
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. BLUE_ELF"
                      size="sm"
                    />
                    {errors[`btn_${idx}_urlExample`] && (
                      <p className="text-xs text-rose-600">
                        {errors[`btn_${idx}_urlExample`]}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {b.type === "PHONE_NUMBER" && (
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    Phone number <span className="text-rose-500">*</span>
                  </label>
                  <PhoneNumberInput
                    value={b.phone_number || ""}
                    onChange={(v) => {
                      const value = v || "";
                      setLocal((p) => {
                        const next = { ...p };
                        const buttons = [...ensureButtons];
                        buttons[idx] = {
                          ...buttons[idx],
                          phone_number: value,
                        } as any;
                        (next as any).buttons = buttons;
                        return next;
                      });
                      if (errors[`btn_${idx}_phone`] && value.trim()) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next[`btn_${idx}_phone`];
                          return next;
                        });
                      }
                    }}
                    placeholder="+15550051310"
                    className="w-full"
                  />
                  {errors[`btn_${idx}_phone`] && (
                    <p className="text-xs text-rose-600">
                      {errors[`btn_${idx}_phone`]}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-black text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!validate()) return;
              onSave(
                {
                  bodyText: hasCardBody ? local.bodyText || "" : undefined,
                  bodyVariableSamples: hasCardBody
                    ? local.bodyVariableSamples || {}
                    : undefined,
                  buttons: ensureButtons as any,
                },
                localFile,
              );
            }}
            className="px-4 py-2 rounded-xl font-black text-white bg-[#00A89E] hover:bg-[#00c4b8] transition-all shadow-sm"
          >
            Add card
          </button>
        </div>
      </div>
    </div>
  );
};
