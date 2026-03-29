import React, { useCallback, useState, useRef, useEffect } from "react";
import { TemplateFormField } from "./TemplateFormField";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";

const BODY_MAX = 1024;

const DEFAULT_VARIABLES = [
  { value: "name", label: "name" },
  { value: "email", label: "email" },
  { value: "phone", label: "phone" },
];

interface MessageBodyEditorProps {
  value: string;
  onChange: (v: string) => void;
  onAddVariable?: (variableName: string) => void;
  readOnly?: boolean;
}

export const MessageBodyEditor: React.FC<MessageBodyEditorProps> = ({
  value,
  onChange,
  onAddVariable,
  readOnly = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customVariable, setCustomVariable] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setShowCustomInput(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const insertVariable = useCallback(
    (varName: string) => {
      const name =
        varName
          .trim()
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "") || "variable";
      const insert = `{{${name}}}`;
      onChange(value + (value && !value.endsWith("\n") ? " " : "") + insert);
      onAddVariable?.(name);
      setDropdownOpen(false);
      setShowCustomInput(false);
      setCustomVariable("");
    },
    [value, onChange, onAddVariable],
  );

  const handleAddCustom = () => {
    if (customVariable.trim()) {
      insertVariable(customVariable.trim());
    } else {
      setShowCustomInput(true);
    }
  };

  return (
    <TemplateFormField
      label="Message body"
      required
      charCount={{ current: value.length, max: BODY_MAX }}
    >
      <div className="space-y-2" ref={wrapRef}>
        <Textarea
          value={value}
          onChange={(e) => {
            if (readOnly) return;
            onChange(e.target.value.slice(0, BODY_MAX));
          }}
          placeholder="Hi {{Name}}!&#10;Your message here..."
          rows={5}
          maxLength={BODY_MAX}
          readOnly={readOnly}
        />
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#00A89E]/10 text-[#00A89E] hover:bg-[#00A89E]/20 border border-[#00A89E]/30 flex items-center gap-1.5"
              >
                Add variables
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
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
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Contact
                  </div>
                  {DEFAULT_VARIABLES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => insertVariable(opt.value)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      {opt.label}
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
                        onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustom}
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
        )}
      </div>
    </TemplateFormField>
  );
};
