import React from "react";
import { TemplateFormField } from "../TemplateFormField";
import Dropdown from "../../ui/Dropdown";
import type {
  CarouselCardButtonType,
  CarouselHeaderFormat,
} from "../../../types";

const HEADER_FORMAT_OPTIONS = [
  { value: "IMAGE", label: "Image Carousel" },
  { value: "VIDEO", label: "Video Carousel" },
] as const;

const BUTTON_TYPE_OPTIONS: Array<{
  value: CarouselCardButtonType | "";
  label: string;
}> = [
  { value: "", label: "Select type" },
  // { value: "QUICK_REPLY", label: "Quick reply" },
  { value: "URL", label: "Website URL" },
  { value: "PHONE_NUMBER", label: "Call phone" },
];

interface CarouselFormatSectionProps {
  headerFormat: CarouselHeaderFormat;
  hasCardBody: boolean;
  button1Type: CarouselCardButtonType | "";
  button2Type: CarouselCardButtonType | "";
  onChange: (patch: {
    headerFormat?: CarouselHeaderFormat;
    hasCardBody?: boolean;
    button1Type?: CarouselCardButtonType | "";
    button2Type?: CarouselCardButtonType | "";
  }) => void;
}

const InfoRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] text-slate-500 leading-relaxed">{children}</div>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-3 cursor-pointer select-none">
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? "bg-[#00A89E]" : "bg-slate-200"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
    <span className="text-sm font-black text-slate-700">{label}</span>
  </label>
);

export const CarouselFormatSection: React.FC<CarouselFormatSectionProps> = ({
  headerFormat,
  hasCardBody,
  button1Type,
  button2Type,
  onChange,
}) => {
  return (
    <TemplateFormField
      label="Carousel format"
      hint="The media header format, button types and card body must be the same across all cards in a carousel template."
    >
      <div className="space-y-4 p-4 rounded-2xl border border-slate-200 bg-white">
        <Toggle
          checked={hasCardBody}
          onChange={(v) => onChange({ hasCardBody: v })}
          label="Card body"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Carousel type
            </label>
            <Dropdown
              options={HEADER_FORMAT_OPTIONS as any}
              value={headerFormat}
              onChange={(v) =>
                onChange({ headerFormat: v as CarouselHeaderFormat })
              }
              placeholder="Image Carousel"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Button 1 type
            </label>
            <Dropdown
              options={BUTTON_TYPE_OPTIONS}
              value={button1Type}
              onChange={(v) => onChange({ button1Type: v as any })}
              placeholder="Select type"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Button 2 type
            </label>
            <Dropdown
              options={BUTTON_TYPE_OPTIONS as any}
              value={button2Type}
              onChange={(v) => onChange({ button2Type: v as any })}
              placeholder="Select type"
            />
          </div>
        </div>

        <InfoRow>
          Cards must have a media header (image or video) and at least one
          button. Supports up to 2 buttons. Buttons can be a mix of quick reply,
          phone, or URL buttons.
        </InfoRow>
      </div>
    </TemplateFormField>
  );
};
