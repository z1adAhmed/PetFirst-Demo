import {
  BaseTemplateComponent,
  MessageTemplate,
  CarouselTemplateComponent,
} from "../types";

const VAR_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

const getTemplateVariableMap = (template: MessageTemplate) =>
  template.variableIndexMap;

const getMappedVarsFromText = (
  text: string,
  mappedOrder?: string[],
): string[] => {
  const vars: string[] = [];
  let match: RegExpExecArray | null;
  let idx = 0;
  const re = new RegExp(VAR_REGEX.source, "g");
  while ((match = re.exec(text)) !== null) {
    const raw = (match[1] || "").trim().toLowerCase();
    if (!raw) continue;
    if (/^\d+$/.test(raw) && mappedOrder?.[idx]) {
      vars.push(mappedOrder[idx].toLowerCase());
    } else {
      vars.push(raw);
    }
    idx += 1;
  }
  return vars;
};

/**
 * Extracts template variables from a message template
 */
export const extractTemplateVariables = (
  template: MessageTemplate,
): string[] => {
  const variables = new Set<string>();
  const components = template.components || [];
  const variableMap = getTemplateVariableMap(template);

  const headerComponent = components.find(
    (c): c is BaseTemplateComponent => c.type === "HEADER",
  );
  if (headerComponent) {
    if (
      headerComponent.format === "IMAGE" ||
      headerComponent.format === "VIDEO" ||
      headerComponent.format === "DOCUMENT"
    ) {
      variables.add("mediaUrl");
    } else if (headerComponent.text) {
      const vars = getMappedVarsFromText(headerComponent.text);
      vars.forEach((v) => variables.add(v));
    }
  }

  const bodyComponent = components.find(
    (c): c is BaseTemplateComponent => c.type === "BODY",
  );
  if (bodyComponent?.text) {
    const vars = getMappedVarsFromText(
      bodyComponent.text,
      variableMap?.body,
    );
    vars.forEach((v) => variables.add(v));
  }

  const buttonsComponent = components.find(
    (c): c is BaseTemplateComponent => c.type === "BUTTONS",
  );
  if (buttonsComponent?.buttons) {
    buttonsComponent.buttons.forEach((button) => {
      if (button.type === "URL" && button.url) {
        const vars = getMappedVarsFromText(button.url);
        vars.forEach((v) => variables.add(v));
      }
    });
  }

  const carouselComponent = components.find(
    (c): c is CarouselTemplateComponent => c.type === "CAROUSEL",
  );
  if (carouselComponent?.cards) {
    carouselComponent.cards.forEach((card, cardIndex) => {
      const cardBody = card.components?.find(
        (c): c is BaseTemplateComponent => c.type === "BODY",
      );
      if (cardBody?.text) {
        const vars = getMappedVarsFromText(
          cardBody.text,
          variableMap?.carouselCardBody?.[String(cardIndex)],
        );
        vars.forEach((v) => variables.add(v));
      }
      const cardButtons = card.components?.find(
        (c): c is BaseTemplateComponent => c.type === "BUTTONS",
      );
      cardButtons?.buttons?.forEach((button) => {
        if (button.type === "URL" && button.url) {
          const vars = getMappedVarsFromText(button.url);
          vars.forEach((v) => variables.add(v));
        }
      });
    });
  }

  return Array.from(variables);
};

/**
 * Extracts template variables in order of first appearance (body, then header, then buttons).
 * Used to show required column sequence and validate sheet columns.
 */
export const extractTemplateVariablesInOrder = (
  template: MessageTemplate,
): string[] => {
  const order: string[] = [];
  const seen = new Set<string>();
  const variableMap = getTemplateVariableMap(template);
  const add = (name: string) => {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      order.push(key);
    }
  };

  const components = template.components || [];
  const bodyComponent = components.find(
    (c): c is BaseTemplateComponent => c.type === "BODY",
  );
  if (bodyComponent?.text) {
    const vars = getMappedVarsFromText(bodyComponent.text, variableMap?.body);
    vars.forEach((v) => add(v));
  }

  const headerComponent = components.find(
    (c): c is BaseTemplateComponent => c.type === "HEADER",
  );
  if (headerComponent) {
    if (
      headerComponent.format === "IMAGE" ||
      headerComponent.format === "VIDEO" ||
      headerComponent.format === "DOCUMENT"
    ) {
      add("mediaUrl");
    } else if (headerComponent.text) {
      const vars = getMappedVarsFromText(headerComponent.text);
      vars.forEach((v) => add(v));
    }
  }

  const buttonsComponent = components.find(
    (c): c is BaseTemplateComponent => c.type === "BUTTONS",
  );
  if (buttonsComponent?.buttons) {
    buttonsComponent.buttons.forEach((button) => {
      if (button.type === "URL" && button.url) {
        const vars = getMappedVarsFromText(button.url);
        vars.forEach((v) => add(v));
      }
    });
  }

  const carouselComponent = components.find(
    (c): c is CarouselTemplateComponent => c.type === "CAROUSEL",
  );
  if (carouselComponent?.cards) {
    carouselComponent.cards.forEach((card, cardIndex) => {
      const cardBody = card.components?.find(
        (c): c is BaseTemplateComponent => c.type === "BODY",
      );
      if (cardBody?.text) {
        const vars = getMappedVarsFromText(
          cardBody.text,
          variableMap?.carouselCardBody?.[String(cardIndex)],
        );
        vars.forEach((v) => add(v));
      }
      const cardButtons = card.components?.find(
        (c): c is BaseTemplateComponent => c.type === "BUTTONS",
      );
      cardButtons?.buttons?.forEach((button) => {
        if (button.type === "URL" && button.url) {
          const vars = getMappedVarsFromText(button.url);
          vars.forEach((v) => add(v));
        }
      });
    });
  }

  return order;
};
