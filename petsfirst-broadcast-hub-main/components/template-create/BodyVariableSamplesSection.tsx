import React from "react";
import { TemplateFormField } from "./TemplateFormField";
import Input from "../ui/Input";
import { getBodyVariableNames } from "../../hooks/useTemplatePreview";

interface BodyVariableSamplesSectionProps {
  body: string;
  samples: Record<string, string>;
  onSampleChange: (varName: string, sample: string) => void;
  errors?: Record<string, string>;
}

export const BodyVariableSamplesSection: React.FC<BodyVariableSamplesSectionProps> = ({
  body,
  samples,
  onSampleChange,
  errors = {},
}) => {
  const variableNames = getBodyVariableNames(body);

  if (variableNames.length === 0) return null;

  return (
    <TemplateFormField
      label="Variable samples"
      required
      hint="Include sample content for each variable for Meta review. Do not use real customer data."
    >
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Add sample text for every variable in your message body. These are used for template review only.
        </p>
        <div className="space-y-3">
          {variableNames.map((varName) => (
            <div key={varName} className="space-y-1">
              <label className="text-sm font-medium text-slate-700 block">
                <span className="variable-tag-create">{`{{${varName}}}`}</span>
              </label>
              <Input
                type="text"
                value={samples[varName] ?? ""}
                onChange={(e) => onSampleChange(varName, e.target.value)}
                placeholder={`Enter content for {{${varName}}}`}
                size="sm"
                className={errors[varName] ? "border-rose-300" : ""}
              />
              {errors[varName] && (
                <p className="text-xs text-rose-600">{errors[varName]}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </TemplateFormField>
  );
};
