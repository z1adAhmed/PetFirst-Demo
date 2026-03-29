import type { BaseTemplateComponent } from "../types";

export type BodySegment = { type: "text" | "variable"; value: string };

/**
 * Splits template body text into segments, marking substituted variable values
 * so they can be highlighted (e.g. light green in listing).
 */
export function getBodySegmentsWithVariableValues(
  text: string,
  bodyComponent?: BaseTemplateComponent,
): BodySegment[] {
  if (!text?.trim()) return [{ type: "text", value: text || "" }];

  const firstRow = bodyComponent?.example?.body_text?.[0];
  const namedParams = bodyComponent?.example?.body_text_named_params ?? [];
  const regex = /\{\{\s*([^}]+)\s*\}\}/g;
  const segments: BodySegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }
    const placeholder = match[1].trim();
    let value: string | null = null;
    const num = parseInt(placeholder, 10);
    if (
      Array.isArray(firstRow) &&
      !Number.isNaN(num) &&
      num >= 1 &&
      num <= firstRow.length
    ) {
      value = String(firstRow[num - 1] ?? "");
    }
    if (value === null && namedParams.length > 0) {
      const p = namedParams.find(
        (param) => param.param_name.toLowerCase() === placeholder.toLowerCase(),
      );
      value = p ? p.example : placeholder;
    }
    if (value === null) value = placeholder;
    segments.push({ type: "variable", value });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }
  return segments.length ? segments : [{ type: "text", value: text }];
}
