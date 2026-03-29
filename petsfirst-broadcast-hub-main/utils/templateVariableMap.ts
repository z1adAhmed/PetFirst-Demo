import type { TemplateDraft, TemplateVariableIndexMap } from "../types";
const VAR_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

function extractVariablesInOrder(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(VAR_RE.source, "g");
  while ((m = re.exec(text)) !== null) {
    const name = (m[1] || "").trim().toLowerCase();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

export function buildVariableIndexMapFromDraft(
  draft: TemplateDraft,
): TemplateVariableIndexMap {
  const body = extractVariablesInOrder(draft.body || "");
  const carouselCardBody: Record<string, string[]> = {};

  (draft.carouselCards || []).forEach((card, idx) => {
    const vars = extractVariablesInOrder(card.bodyText || "");
    if (vars.length > 0) {
      carouselCardBody[String(idx)] = vars;
    }
  });

  const map: TemplateVariableIndexMap = {};
  if (body.length > 0) map.body = body;
  if (Object.keys(carouselCardBody).length > 0) {
    map.carouselCardBody = carouselCardBody;
  }
  return map;
}

export function parseTemplateVariableMap(
  raw: unknown,
): TemplateVariableIndexMap | undefined {
  let parsed: unknown = raw;

  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    if (!trimmed) return undefined;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return undefined;
    }
  }

  if (!parsed || typeof parsed !== "object") return undefined;

  const candidate = parsed as {
    body?: unknown;
    carouselCardBody?: unknown;
  };

  const map: TemplateVariableIndexMap = {};
  if (Array.isArray(candidate.body)) {
    map.body = candidate.body
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
  }

  if (
    candidate.carouselCardBody &&
    typeof candidate.carouselCardBody === "object"
  ) {
    const out: Record<string, string[]> = {};
    Object.entries(candidate.carouselCardBody as Record<string, unknown>).forEach(
      ([key, value]) => {
        if (!Array.isArray(value)) return;
        const vars = value
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.trim().toLowerCase())
          .filter(Boolean);
        if (vars.length > 0) out[key] = vars;
      },
    );
    if (Object.keys(out).length > 0) map.carouselCardBody = out;
  }

  if (!map.body?.length && !map.carouselCardBody) return undefined;
  return map;
}

