import type {
  TemplateDraft,
  TemplateDraftButton,
  CarouselCardDraft,
} from "../types";

const VAR_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g;

/**
 * Extract variable names from text in order of appearance (unique order).
 */
function getVariablesInOrder(text: string): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  const re = new RegExp(VAR_PATTERN.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = (m[1] || "").trim();
    if (!name) continue;
    if (!seen.has(name)) {
      seen.add(name);
      order.push(name);
    }
  }
  return order;
}

/**
Optional Variables * Convert text with {{name}} variables to Meta positional {{1}}, {{2}}.
 * Does not set examples; caller provides sample values for body_text.
 */
function toPositionalText(text: string): {
  text: string;
  variableNamesInOrder: string[];
} {
  const vars = getVariablesInOrder(text);
  if (vars.length === 0) return { text, variableNamesInOrder: [] };
  let out = text;
  vars.forEach((name, i) => {
    const index = i + 1;
    const placeholder = new RegExp(
      `\\{\\{\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\}\\}`,
      "g",
    );
    out = out.replace(placeholder, `{{${index}}}`);
  });
  return { text: out, variableNamesInOrder: vars };
}

/**
 * Build body_text_named_params for NAMED format: keep {{name}}, {{email}} in text and pass named examples.
 */
function buildBodyNamedParams(
  variableNamesInOrder: string[],
  bodyVariableSamples?: Record<string, string>,
): Array<{ param_name: string; example: string }> {
  return variableNamesInOrder.map((name) => ({
    param_name: name,
    example: (bodyVariableSamples?.[name] ?? name).trim() || name,
  }));
}

/**
 * Build body_text example row for Meta review.
 * If text contains {{...}} but parsing finds no variables, provide a safe fallback sample.
 */
function buildBodyTextExample(
  text: string,
  variableNamesInOrder: string[],
  samples?: Record<string, string>,
): string[][] | undefined {
  if (variableNamesInOrder.length > 0) {
    const row = variableNamesInOrder.map(
      (name) => (samples?.[name] ?? name).trim() || name,
    );
    return [row];
  }
  if (/\{\{/.test(text)) {
    return [["sample"]];
  }
  return undefined;
}

/**
 * Build Meta API button object from draft button.
 */
function buildMetaButton(btn: TemplateDraftButton): Record<string, unknown> {
  const base: Record<string, unknown> = {
    type: btn.type,
    text: btn.type === "COPY_CODE" ? "Copy offer code" : btn.text || "Button",
  };
  if (btn.type === "URL" && btn.url) {
    base.url = btn.url;
    // Meta requires an example when URL supports a variable ({{1}}).
    if (btn.url.includes("{{1}}") && btn.urlExample?.trim()) {
      base.example = [btn.urlExample.trim()];
    }
  }
  if (btn.type === "PHONE_NUMBER" && btn.phone_number) {
    base.phone_number = btn.phone_number;
  }
  if (btn.type === "FLOW" && btn.flow_id != null) {
    base.flow_id = btn.flow_id;
    base.flow_action = btn.flow_action ?? "NAVIGATE";
    base.navigate_screen = btn.navigate_screen ?? "WELCOME";
  }
  if (btn.type === "COPY_CODE" && btn.copyCodeExample?.trim()) {
    base.example = btn.copyCodeExample.trim().slice(0, 12);
  }
  return base;
}

export interface MetaTemplateCreatePayload {
  name: string;
  language: string;
  category: string;
  components: Array<Record<string, unknown>>;
  parameter_format?: "NAMED" | "POSITIONAL";
}

/**
 * Build the JSON payload for Meta Graph API POST message_templates.
 * Uses positional variables {{1}}, {{2}} and example arrays. For media header, pass headerHandle from Resumable Upload.
 */
export function buildMetaTemplatePayload(
  draft: TemplateDraft,
  headerHandle?: string,
  carouselHeaderHandles?: Record<string, string>,
): MetaTemplateCreatePayload {
  const components: Array<Record<string, unknown>> = [];
  const isCarousel = draft.category === "CAROUSEL";
  const isLocationHeader = !isCarousel && draft.headerType === "LOCATION";

  // ---- HEADER (standard templates only) ----
  if (!isCarousel) {
    if (draft.headerType === "TEXT" && draft.headerText.trim()) {
      const { text, variableNamesInOrder } = toPositionalText(
        draft.headerText.trim(),
      );
      const header: Record<string, unknown> = {
        type: "HEADER",
        format: "TEXT",
        text,
      };
      if (variableNamesInOrder.length > 0) {
        header.example = { header_text: variableNamesInOrder };
      }
      components.push(header);
    } else if (
      (draft.headerType === "IMAGE" ||
        draft.headerType === "VIDEO" ||
        draft.headerType === "DOCUMENT") &&
      headerHandle
    ) {
      components.push({
        type: "HEADER",
        format: draft.headerType,
        example: { header_handle: [headerHandle] },
      });
    } else if (draft.headerType === "LOCATION") {
      components.push({
        type: "HEADER",
        format: "LOCATION",
      });
    }
    // NONE: no header component
  }

  // ---- BODY ----
  if (draft.body.trim()) {
    const bodyTextRaw = draft.body.trim();
    if (isCarousel) {
      const { text, variableNamesInOrder } = toPositionalText(bodyTextRaw);
      const body: Record<string, unknown> = {
        type: "BODY",
        text,
      };
      const bodyTextExample = buildBodyTextExample(
        text,
        variableNamesInOrder,
        draft.bodyVariableSamples,
      );
      if (bodyTextExample) {
        body.example = { body_text: bodyTextExample };
      }
      components.push(body);
    } else {
      const variableNamesInOrder = getVariablesInOrder(bodyTextRaw);
      const hasNumericVars = variableNamesInOrder.some((v) => /^\d+$/.test(v));
      const shouldUsePositional = isLocationHeader || hasNumericVars;

      if (shouldUsePositional) {
        const { text, variableNamesInOrder: vars } =
          toPositionalText(bodyTextRaw);
        const body: Record<string, unknown> = { type: "BODY", text };
        if (vars.length > 0) {
          const row = vars.map(
            (name) =>
              (draft.bodyVariableSamples?.[name] ?? name).trim() || name,
          );
          body.example = { body_text: [row] };
        }
        components.push(body);
      } else {
        // Standard templates: keep actual variable names in text (NAMED format).
        const body: Record<string, unknown> = {
          type: "BODY",
          text: bodyTextRaw,
        };
        if (variableNamesInOrder.length > 0) {
          body.example = {
            body_text_named_params: buildBodyNamedParams(
              variableNamesInOrder,
              draft.bodyVariableSamples,
            ),
          };
        }
        components.push(body);
      }
    }
  }

  // ---- FOOTER (standard templates only) ----
  if (!isCarousel && draft.footer.trim()) {
    components.push({ type: "FOOTER", text: draft.footer.trim() });
  }

  // ---- BUTTONS (standard templates only; carousel buttons are per-card) ----
  if (!isCarousel && draft.buttons.length > 0) {
    const buttons = draft.buttons
      .filter(
        (b) =>
          b.text?.trim() &&
          (b.type !== "FLOW" || b.flow_id != null) &&
          (b.type !== "COPY_CODE" || (b.copyCodeExample ?? "").trim()),
      )
      .map((b) => buildMetaButton(b));
    if (buttons.length > 0) {
      components.push({ type: "BUTTONS", buttons });
    }
  }

  // ---- CAROUSEL ----
  if (isCarousel) {
    const cards: CarouselCardDraft[] = draft.carouselCards || [];
    const headerFormat = draft.carouselHeaderFormat || "IMAGE";
    const hasCardBody = Boolean(draft.carouselHasCardBody);
    const handles = carouselHeaderHandles || {};

    const cardObjects = cards.map((card) => {
      const headerHandleForCard = handles[card.id];
      const cardComponents: Array<Record<string, unknown>> = [];

      const buttons = (card.buttons || [])
        .filter((b) => b.text?.trim())
        .map((b) => buildMetaButton(b as any));
      if (buttons.length > 0) {
        cardComponents.push({ type: "BUTTONS", buttons });
      }

      if (hasCardBody) {
        const raw = (card.bodyText || "").trim();
        const { text, variableNamesInOrder } = toPositionalText(raw);
        const body: Record<string, unknown> = { type: "BODY", text };
        const bodyTextExample = buildBodyTextExample(
          text,
          variableNamesInOrder,
          card.bodyVariableSamples,
        );
        if (bodyTextExample) {
          body.example = { body_text: bodyTextExample };
        }
        cardComponents.push(body);
      }

      if (headerHandleForCard) {
        const header: Record<string, unknown> = {
          type: "HEADER",
          format: headerFormat,
          example: { header_handle: [headerHandleForCard] },
        };
        cardComponents.push(header);
      }
      return { components: cardComponents };
    });

    components.push({ type: "CAROUSEL", cards: cardObjects });
  }

  const payload: MetaTemplateCreatePayload = {
    name: draft.name.trim(),
    language: draft.language || "en",
    category: isCarousel ? "MARKETING" : draft.category || "MARKETING",
    components,
  };
  const hasBodyVars =
    draft.body.trim() && getVariablesInOrder(draft.body.trim()).length > 0;
  if (hasBodyVars) {
    payload.parameter_format =
      isCarousel || isLocationHeader ? "POSITIONAL" : "NAMED";
  }
  return payload;
}
