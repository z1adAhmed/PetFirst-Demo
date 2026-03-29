import React, { useState, useRef, useEffect } from "react";
import { TemplateFormField } from "./TemplateFormField";
import Dropdown from "../ui/Dropdown";
import Input from "../ui/Input";
import PhoneNumberInput from "../ui/PhoneNumberInput";
import SortableList from "../ui/SortableList";
import type { TemplateDraftButton, Flow } from "../../types";

interface ButtonsSectionProps {
  buttons: TemplateDraftButton[];
  onAdd: (type: TemplateDraftButton["type"]) => void;
  onUpdate: (index: number, button: Partial<TemplateDraftButton>) => void;
  onRemove: (index: number) => void;
  /** Called when buttons are reordered via drag. New order is reflected in WhatsApp preview. */
  onReorder?: (buttons: TemplateDraftButton[]) => void;
  /** Published flows for FLOW (Form) button dropdown. Only one flow per template. */
  publishedFlows?: Flow[];
  maxButtons?: number;
}

const BUTTON_TYPES: TemplateDraftButton["type"][] = [
  "QUICK_REPLY",
  "URL",
  "PHONE_NUMBER",
  "COPY_CODE",
  "FLOW",
];

const BUTTON_TYPE_OPTIONS = BUTTON_TYPES.map((t) => ({
  value: t,
  label: t === "COPY_CODE" ? "Coupon Code" : t.replace(/_/g, " "),
}));

const COPY_CODE_EXAMPLE_MAX = 12;

const ADD_BUTTON_OPTIONS: {
  type: TemplateDraftButton["type"];
  label: string;
  max: number;
  icon?: string;
}[] = [
  { type: "QUICK_REPLY", label: "Custom replies", max: 2, icon: "↩" },
  { type: "URL", label: "URL", max: 2, icon: "🔗" },
  { type: "PHONE_NUMBER", label: "Phone", max: 1, icon: "📞" },
  { type: "COPY_CODE", label: "Coupon code", max: 1, icon: "🎟" },
  { type: "FLOW", label: "Form", max: 1, icon: "📄" },
];

const FLOW_ACTION = "NAVIGATE";
const FLOW_NAVIGATE_SCREEN = "WELCOME";

export const ButtonsSection: React.FC<ButtonsSectionProps> = ({
  buttons,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
  publishedFlows = [],
  maxButtons = 10,
}) => {
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const addDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        addDropdownRef.current &&
        !addDropdownRef.current.contains(e.target as Node)
      ) {
        setAddDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const countByType = (type: TemplateDraftButton["type"]) =>
    buttons.filter((b) => b.type === type).length;

  const canAdd = (type: TemplateDraftButton["type"], max: number) =>
    countByType(type) < max && buttons.length < maxButtons;

  const quickReplyCount = countByType("QUICK_REPLY");
  const QUICK_REPLY_MAX = 2;
  const copyCodeCount = countByType("COPY_CODE");
  const buildTypeOptions = (currentType: TemplateDraftButton["type"]) =>
    BUTTON_TYPES.map((t) => ({
      value: t,
      label: t === "COPY_CODE" ? "Coupon Code" : t.replace(/_/g, " "),
      disabled:
        (t === "QUICK_REPLY" &&
          currentType !== "QUICK_REPLY" &&
          quickReplyCount >= QUICK_REPLY_MAX) ||
        (t === "COPY_CODE" &&
          currentType !== "COPY_CODE" &&
          copyCodeCount >= 1),
    }));

  return (
    <TemplateFormField label="Buttons" optional>
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Create buttons that let customers respond to your message or take
          action. If you add more than three buttons, they will appear in a
          list.
        </p>
        {onReorder ? (
          <SortableList
            items={buttons}
            onReorder={onReorder}
            className="space-y-3"
            itemClassName=""
            getItemKey={(_, i) => i}
            renderItem={(btn, idx) => (
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Dropdown
                    options={buildTypeOptions(btn.type)}
                    value={btn.type}
                    onChange={(value) => {
                      const newType = value as TemplateDraftButton["type"];
                      onUpdate(idx, {
                        type: newType,
                        ...(newType === "COPY_CODE" ? { text: "Copy offer code" } : {}),
                      });
                    }}
                    size="sm"
                    className="min-w-[140px]"
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="text-slate-400 hover:text-rose-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
                {btn.type === "COPY_CODE" ? (
                  <Input
                    type="text"
                    value="Copy offer code"
                    disabled
                    size="sm"
                    className="bg-slate-100 text-slate-600 cursor-not-allowed"
                  />
                ) : (
                  <Input
                    type="text"
                    value={btn.text}
                    onChange={(e) => onUpdate(idx, { text: e.target.value })}
                    placeholder={
                      btn.type === "URL"
                        ? "e.g. Visit website."
                        : btn.type === "PHONE_NUMBER"
                          ? "e.g. Call us"
                          : btn.type === "FLOW"
                            ? "e.g. View form"
                            : "Button text"
                    }
                    size="sm"
                  />
                )}
                {btn.type === "URL" && (
                  <Input
                    type="text"
                    value={btn.url ?? ""}
                    onChange={(e) => onUpdate(idx, { url: e.target.value })}
                    placeholder="https://www.example.com"
                    size="sm"
                  />
                )}
                {btn.type === "PHONE_NUMBER" && (
                  <PhoneNumberInput
                    value={btn.phone_number ?? ""}
                    onChange={(v) => onUpdate(idx, { phone_number: v })}
                    placeholder="e.g. 3077 524 55"
                  />
                )}
                {btn.type === "COPY_CODE" && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 block">
                      Sample Code <span className="text-slate-400 font-normal">(max {COPY_CODE_EXAMPLE_MAX} characters)</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={btn.copyCodeExample ?? ""}
                        onChange={(e) =>
                          onUpdate(idx, {
                            copyCodeExample: e.target.value.slice(
                              0,
                              COPY_CODE_EXAMPLE_MAX,
                            ),
                          })
                        }
                        placeholder="e.g. GET50OFF"
                        size="sm"
                        maxLength={COPY_CODE_EXAMPLE_MAX}
                        className="pr-12"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 tabular-nums pointer-events-none">
                        {(btn.copyCodeExample ?? "").length}/{COPY_CODE_EXAMPLE_MAX}
                      </span>
                    </div>
                  </div>
                )}
                {btn.type === "FLOW" && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600 block">
                      Search and select a WhatsApp form
                    </label>
                    <Dropdown
                      options={[
                        { value: "", label: "Select a flow…" },
                        ...publishedFlows.map((f) => ({
                          value: f.id,
                          label: f.name,
                        })),
                      ]}
                      value={btn.flow_id != null ? String(btn.flow_id) : ""}
                      onChange={(value) => {
                        if (!value) {
                          onUpdate(idx, {
                            flow_id: undefined,
                            flow_action: undefined,
                            navigate_screen: undefined,
                          });
                          return;
                        }
                        onUpdate(idx, {
                          flow_id: Number(value),
                          flow_action: FLOW_ACTION,
                          navigate_screen: FLOW_NAVIGATE_SCREEN,
                        });
                      }}
                      size="sm"
                      placeholder="Select a flow…"
                    />
                  </div>
                )}
              </div>
            )}
          />
        ) : (
          buttons.map((btn, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <Dropdown
                  options={buildTypeOptions(btn.type)}
                  value={btn.type}
                  onChange={(value) => {
                    const newType = value as TemplateDraftButton["type"];
                    onUpdate(idx, {
                      type: newType,
                      ...(newType === "COPY_CODE" ? { text: "Copy offer code" } : {}),
                    });
                  }}
                  size="sm"
                  className="min-w-[140px]"
                />
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="text-slate-400 hover:text-rose-500 text-sm"
                >
                  Remove
                </button>
              </div>
              {btn.type === "COPY_CODE" ? (
                <Input
                  type="text"
                  value="Copy offer code"
                  disabled
                  size="sm"
                  className="bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              ) : (
                <Input
                  type="text"
                  value={btn.text}
                  onChange={(e) => onUpdate(idx, { text: e.target.value })}
                  placeholder={
                    btn.type === "URL"
                      ? "e.g. Visit website."
                      : btn.type === "PHONE_NUMBER"
                        ? "e.g. Call us"
                        : btn.type === "FLOW"
                          ? "e.g. View form"
                          : "Button text"
                  }
                  size="sm"
                />
              )}
              {btn.type === "URL" && (
                <Input
                  type="text"
                  value={btn.url ?? ""}
                  onChange={(e) => onUpdate(idx, { url: e.target.value })}
                  placeholder="https://www.example.com"
                  size="sm"
                />
              )}
              {btn.type === "PHONE_NUMBER" && (
                <PhoneNumberInput
                  value={btn.phone_number ?? ""}
                  onChange={(v) => onUpdate(idx, { phone_number: v })}
                  placeholder="e.g. 3077 524 55"
                />
              )}
              {btn.type === "COPY_CODE" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 block">
                    Sample Code <span className="text-slate-400 font-normal">(max {COPY_CODE_EXAMPLE_MAX} characters)</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={btn.copyCodeExample ?? ""}
                      onChange={(e) =>
                        onUpdate(idx, {
                          copyCodeExample: e.target.value.slice(
                            0,
                            COPY_CODE_EXAMPLE_MAX,
                          ),
                        })
                      }
                      placeholder="e.g. GET50OFF"
                      size="sm"
                      maxLength={COPY_CODE_EXAMPLE_MAX}
                      className="pr-12"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 tabular-nums pointer-events-none">
                      {(btn.copyCodeExample ?? "").length}/{COPY_CODE_EXAMPLE_MAX}
                    </span>
                  </div>
                </div>
              )}
              {btn.type === "FLOW" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 block">
                    Search and select a WhatsApp form
                  </label>
                  <Dropdown
                    options={[
                      { value: "", label: "Select a flow…" },
                      ...publishedFlows.map((f) => ({
                        value: f.id,
                        label: f.name,
                      })),
                    ]}
                    value={btn.flow_id != null ? String(btn.flow_id) : ""}
                    onChange={(value) => {
                      if (!value) {
                        onUpdate(idx, {
                          flow_id: undefined,
                          flow_action: undefined,
                          navigate_screen: undefined,
                        });
                        return;
                      }
                      onUpdate(idx, {
                        flow_id: Number(value),
                        flow_action: FLOW_ACTION,
                        navigate_screen: FLOW_NAVIGATE_SCREEN,
                      });
                    }}
                    size="sm"
                    placeholder="Select a flow…"
                  />
                </div>
              )}
            </div>
          ))
        )}
        {buttons.length < maxButtons && (
          <div className="relative" ref={addDropdownRef}>
            <button
              type="button"
              onClick={() => setAddDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-600 hover:border-[#00A89E] hover:text-[#00A89E] text-sm font-bold bg-white w-full justify-center"
            >
              <span>+</span>
              Add a button
              <svg
                className={`w-4 h-4 transition-transform ${addDropdownOpen ? "rotate-180" : ""}`}
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
            {addDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-slate-200 bg-white py-1 shadow-lg max-h-[280px] overflow-y-auto min-w-[240px]">
                <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Button types (add up to {maxButtons} total)
                </div>
                {ADD_BUTTON_OPTIONS.map((opt) => {
                  const disabled = !canAdd(opt.type, opt.max);
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => {
                        if (!disabled) {
                          onAdd(opt.type);
                          setAddDropdownOpen(false);
                        }
                      }}
                      disabled={disabled}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center gap-2">
                        {opt.icon && <span>{opt.icon}</span>}
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {opt.max} max
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </TemplateFormField>
  );
};
