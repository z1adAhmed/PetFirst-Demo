import type {
  BaseTemplateComponent,
  CarouselTemplateComponent,
  Contact,
  MessageTemplate,
  MetaConfig,
} from "../types";

/**
 * Extracts variable value from contact data.
 * Maps positional {{1}}/{{2}} from API templates to name/phone so sheet columns Name, Phone work.
 */
export const getVariableValue = (varName: string, contact: Contact): string => {
  const normalizeKey = (key: string) =>
    key.toLowerCase().replace(/[\s_-]+/g, "");

  const pickFromContact = (key: string): string => {
    const direct = (contact as any)?.[key];
    if (direct != null && String(direct).trim() !== "") return String(direct);
    const normalizedWanted = normalizeKey(key);
    const matchedKey = Object.keys(contact).find(
      (k) => normalizeKey(k) === normalizedWanted,
    );
    const matched = matchedKey ? (contact as any)?.[matchedKey] : "";
    return matched != null ? String(matched) : "";
  };

  const varNameLower = varName.toLowerCase();
  if (varNameLower === "1") return pickFromContact("name") || "";
  if (varNameLower === "2") {
    // In positional templates {{2}} is not always phone; prefer explicit/semantic columns first.
    return (
      pickFromContact("2") ||
      pickFromContact("email") ||
      pickFromContact("email_address") ||
      pickFromContact("mail") ||
      pickFromContact("phone") ||
      pickFromContact("phone_number") ||
      ""
    );
  }
  if (varNameLower === "name") return pickFromContact("name") || "";
  if (varNameLower === "phone") return pickFromContact("phone") || "";
  return pickFromContact(varNameLower) || pickFromContact(varName) || "";
};

/**
 * Checks if a variable is required (name or phone)
 */
export const isRequiredVariable = (varName: string): boolean => {
  const varNameLower = varName.toLowerCase();
  return varNameLower === "name" || varNameLower === "phone";
};

/**
 * Default document filename when none is provided (avoids WhatsApp "Untitled").
 * Uses date so each send has a clear, professional label.
 */
function defaultDocumentFilename(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `PetsFirst_Invoice_${y}_${m}_${d}.pdf`;
}

/**
 * Builds header component parameter for media (IMAGE, VIDEO, DOCUMENT).
 * For DOCUMENT, pass filename so WhatsApp shows it instead of "Untitled".
 */
export const buildMediaHeaderParam = (
  format: "IMAGE" | "VIDEO" | "DOCUMENT",
  attachmentId?: string,
  mediaUrl?: string,
  documentFilename?: string,
): any | null => {
  if (attachmentId) {
    // Use attachmentId for all media types
    if (format === "IMAGE") {
      return {
        type: "image",
        image: { id: attachmentId },
      };
    } else if (format === "VIDEO") {
      return {
        type: "video",
        video: { id: attachmentId },
      };
    } else if (format === "DOCUMENT") {
      const filename =
        documentFilename?.trim() || defaultDocumentFilename();
      return {
        type: "document",
        document: { id: attachmentId, filename },
      };
    }
  } else if (mediaUrl && mediaUrl.trim()) {
    // Fallback to link if no attachmentId
    if (format === "IMAGE") {
      return {
        type: "image",
        image: { link: mediaUrl },
      };
    } else if (format === "VIDEO") {
      return {
        type: "video",
        video: { link: mediaUrl },
      };
    } else if (format === "DOCUMENT") {
      const filename =
        documentFilename?.trim() || defaultDocumentFilename();
      return {
        type: "document",
        document: { link: mediaUrl, filename },
      };
    }
  }

  return null;
};

/**
 * Builds header component parameter for location.
 * WhatsApp Cloud API expects: { type: 'location', location: { latitude, longitude, name?, address? } }
 *
 * We try to read lat/lng + name/address from the contact row first, then fall back to config (if present).
 */
export const buildLocationHeaderParam = (
  contact: Contact,
  config: MetaConfig,
): any | null => {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = (contact as any)?.[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    const cfg: any = config as any;
    for (const k of keys) {
      const v = cfg?.[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };

  const latRaw = pick(
    "latitude",
    "lat",
    "location_lat",
    "locationLat",
    "locationLatitude",
  );
  const lngRaw = pick(
    "longitude",
    "lng",
    "lon",
    "location_lng",
    "locationLng",
    "locationLongitude",
  );
  const latitude = Number(latRaw);
  const longitude = Number(lngRaw);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const name =
    pick("location_name", "locationName", "name_location", "locationTitle") ||
    "Location";
  const address =
    pick(
      "location_address",
      "locationAddress",
      "address_location",
      "address",
    ) || "Address";

  const location: any = {
    latitude,
    longitude,
    // Meta requires name for location header parameters
    name,
    // Meta also requires address for location header parameters
    address,
  };

  return {
    type: "location",
    location,
  };
};

/**
 * Builds header component parameter for text with variables
 */
export const buildTextHeaderParam = (
  headerText: string,
  contact: Contact,
): any[] => {
  const headerParams: any[] = [];
  const varRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let match: RegExpExecArray | null;

  while ((match = varRegex.exec(headerText)) !== null) {
    const varName = match[1];
    const value = getVariableValue(varName, contact);
    const isRequired = isRequiredVariable(varName);

    if (isRequired || value.trim()) {
      headerParams.push({
        type: "text",
        text: String(value || "").trim(),
      });
    }
  }

  return headerParams;
};

/**
 * Builds body component parameters
 */
export const buildBodyParams = (
  bodyText: string,
  contact: Contact,
  template: MessageTemplate,
  bodyComponentOverride?: BaseTemplateComponent,
  positionalVariableNames?: string[],
  useVariablePlaceholders: boolean = false,
): any[] => {
  const bodyParams: any[] = [];
  const isNamedFormat = template.parameter_format === "NAMED";

  const getFallbackValue = (
    paramName: string,
    bodyComponent: any,
    positionIndex?: number,
  ) => {
    const exampleParams = bodyComponent.example?.body_text_named_params || [];
    const exampleMatch = exampleParams.find(
      (p: any) => p.param_name.toLowerCase() === paramName.toLowerCase(),
    );
    const namedValue = (exampleMatch?.example || "").toString().trim();
    if (namedValue) return namedValue;

    const row = bodyComponent.example?.body_text?.[0];
    if (Array.isArray(row)) {
      const numericIndex = Number(paramName);
      const idx =
        Number.isFinite(numericIndex) && numericIndex > 0
          ? numericIndex - 1
          : (positionIndex ?? -1);
      if (idx >= 0) {
        const positionalValue = (row[idx] ?? "").toString().trim();
        if (positionalValue) return positionalValue;
      }
    }

    return "N/A";
  };

  const bodyComponent =
    bodyComponentOverride ||
    template.components?.find(
      (c): c is BaseTemplateComponent => c.type === "BODY",
    );
  if (!bodyComponent) return [];

  const preferNameOverNa = (val: string) =>
    (val === "N/A" && contact.name?.trim() ? contact.name.trim() : val) ||
    "N/A";

  if (isNamedFormat && bodyComponent.example?.body_text_named_params) {
    // NAMED format: use example params order
    bodyComponent.example.body_text_named_params.forEach((param: any) => {
      const varName = param.param_name.toLowerCase();
      if (useVariablePlaceholders) {
        bodyParams.push({
          type: "text",
          text: `{{${param.param_name}}}`,
          parameter_name: param.param_name,
        });
        return;
      }
      let value = getVariableValue(varName, contact);

      const paramValue = String(value || "").trim();
      const fallbackValue = getFallbackValue(
        param.param_name,
        bodyComponent,
        bodyParams.length,
      );
      let finalValue = paramValue || fallbackValue;
      finalValue = preferNameOverNa(finalValue);

      bodyParams.push({
        type: "text",
        text: finalValue,
        parameter_name: param.param_name,
      });
    });
  } else {
    // POSITIONAL format: extract variables in order
    const varRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = varRegex.exec(bodyText)) !== null) {
      matches.push(match[1]);
    }

    matches.forEach((varName, varIndex) => {
      const placeholderName =
        /^\d+$/.test(varName) && positionalVariableNames?.[varIndex]
          ? positionalVariableNames[varIndex]
          : varName;
      if (useVariablePlaceholders) {
        bodyParams.push({
          type: "text",
          text: `{{${placeholderName}}}`,
        });
        return;
      }
      let value = getVariableValue(varName, contact);
      if (/^\d+$/.test(varName) && positionalVariableNames?.[varIndex]) {
        value = getVariableValue(positionalVariableNames[varIndex], contact);
      }
      // Map positional {{1}} to name when template expects name as first param
      if (!value?.trim() && (varName === "1" || varName === "name")) {
        value = contact.name || "";
      }

      let paramValue = String(value || "").trim();
      if (/^\d+$/.test(varName) && paramValue === "0") {
        // Keep fallback behavior when sheet value is a placeholder-like zero.
        paramValue = "";
      }
      const fallbackValue = getFallbackValue(varName, bodyComponent, varIndex);
      let finalValue = paramValue || fallbackValue;
      finalValue = preferNameOverNa(finalValue);

      bodyParams.push({
        type: "text",
        text: finalValue,
      });
    });
  }

  return bodyParams;
};

/**
 * Builds button component parameters
 */
export const buildButtonParams = (
  buttons: any[],
  contact: Contact,
  cleanPhone: string,
  templateCouponCode?: string,
): any[] => {
  const buttonComponents: any[] = [];

  buttons.forEach((button, index) => {
    if (button.type === "FLOW") {
      buttonComponents.push({
        type: "button",
        sub_type: "flow",
        index: index.toString(),
        parameters: [
          {
            type: "action",
            action: {
              flow_token: cleanPhone,
              flow_action_data: {
                fad_phone: cleanPhone,
              },
            },
          },
        ],
      });
    } else if (button.type === "COPY_CODE") {
      const fromContact =
        (contact as any).coupon_code?.trim() || (contact as any).code?.trim();
      const fromText =
        typeof button.text === "string" && button.text.includes(" | ")
          ? button.text.split(" | ")[1]?.trim().slice(0, 12) || ""
          : "";
      const fromTemplate = (templateCouponCode || "").trim().slice(0, 12);
      const couponCode = fromContact || fromTemplate || fromText || "";
      buttonComponents.push({
        type: "button",
        sub_type: "copy_code",
        index: index.toString(),
        parameters: [
          {
            type: "coupon_code",
            coupon_code: (couponCode || "CODE").slice(0, 12),
          },
        ],
      });
    } else if (button.type === "URL" && button.url && /\{\{/.test(button.url)) {
      let urlParam = button.url;
      const varRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
      let match: RegExpExecArray | null;

      while ((match = varRegex.exec(button.url)) !== null) {
        const varName = match[1];
        const value = getVariableValue(varName, contact);
        urlParam = urlParam.replace(match[0], value || "");
      }

      if (urlParam && urlParam.trim() && urlParam !== button.url) {
        buttonComponents.push({
          type: "button",
          sub_type: "url",
          index: index.toString(),
          parameters: [
            {
              type: "text",
              text: urlParam.trim(),
            },
          ],
        });
      }
    }
  });

  return buttonComponents;
};

/**
 * Builds the complete WhatsApp message payload
 */
export const buildWhatsAppPayload = (
  contact: Contact,
  config: MetaConfig,
  template: MessageTemplate | null,
  options?: {
    useVariablePlaceholders?: boolean;
  },
): any => {
  const cleanPhone = contact.phone.replace(/\D/g, "");
  const flowToken = cleanPhone;
  const components: any[] = [];

  if (!template) {
    // Fallback for no template
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "template",
      template: {
        name: config.templateName,
        language: { code: config.languageCode || "en" },
        components: [
          { type: "body" },
          {
            type: "button",
            sub_type: "flow",
            index: "0",
            parameters: [
              {
                type: "action",
                action: {
                  flow_token: flowToken,
                  flow_action_data: { fad_phone: cleanPhone },
                },
              },
            ],
          },
        ],
      },
    };
  }

  const carouselComponent = template.components?.find(
    (c): c is CarouselTemplateComponent => c.type === "CAROUSEL",
  );
  const isCarousel = Boolean(carouselComponent);
  const carouselIds = config.carouselAttachmentIds ?? [];
  const bodyComponent = template.components?.find(
    (c): c is BaseTemplateComponent => c.type === "BODY",
  );
  const useVariablePlaceholders = Boolean(options?.useVariablePlaceholders);

  if (isCarousel && carouselComponent?.cards?.length) {
    const cards = carouselComponent.cards.map((card, cardIndex) => {
      const cardComponents: any[] = [];
      const headerInCard = card.components?.find(
        (c): c is BaseTemplateComponent => c.type === "HEADER",
      );
      const mediaId = carouselIds[cardIndex];
      if (headerInCard && mediaId) {
        const format = headerInCard.format === "VIDEO" ? "VIDEO" : "IMAGE";
        const headerParam = buildMediaHeaderParam(format, mediaId, undefined);
        if (headerParam) {
          cardComponents.push({ type: "header", parameters: [headerParam] });
        }
      }
      const bodyInCard = card.components?.find(
        (c): c is BaseTemplateComponent => c.type === "BODY",
      );
      if (bodyInCard?.text && /\{\{/.test(bodyInCard.text)) {
        const cardVars = template.variableIndexMap?.carouselCardBody?.[
          String(cardIndex)
        ];
        const bodyParams = buildBodyParams(
          bodyInCard.text,
          contact,
          template,
          bodyInCard,
          cardVars,
          useVariablePlaceholders,
        );
        if (bodyParams.length > 0) {
          cardComponents.push({ type: "body", parameters: bodyParams });
        }
      }
      const buttonsInCard = card.components?.find(
        (c): c is BaseTemplateComponent => c.type === "BUTTONS",
      );
      if (buttonsInCard?.buttons?.length) {
        const buttonComponents = buildButtonParams(
          buttonsInCard.buttons,
          contact,
          cleanPhone,
          template.couponCode,
        );
        cardComponents.push(...buttonComponents);
      }
      return { card_index: cardIndex, components: cardComponents };
    });
    const filteredCards = cards.filter((c) => c.components.length > 0);
    if (filteredCards.length > 0) {
      components.push({ type: "carousel", cards: filteredCards });
    }
  } else if (!isCarousel) {
    // Build header component (single-image / non-carousel only)
    const headerComponent = template.components?.find(
      (c): c is BaseTemplateComponent => c.type === "HEADER",
    );
    if (headerComponent) {
      const hasMedia =
        headerComponent.format === "IMAGE" ||
        headerComponent.format === "VIDEO" ||
        headerComponent.format === "DOCUMENT";

      if (
        hasMedia &&
        (headerComponent.format === "IMAGE" ||
          headerComponent.format === "VIDEO" ||
          headerComponent.format === "DOCUMENT")
      ) {
        const mediaUrl =
          contact.mediaUrl || headerComponent.example?.header_handle?.[0] || "";
        // Document filename: per-row column override, then config default, then date-based default
        const documentFilename =
          headerComponent.format === "DOCUMENT"
            ? (contact.document_filename ||
                (contact as any).documentFilename ||
                (contact as any).filename ||
                config.documentFilename)
            : undefined;
        const headerParam = buildMediaHeaderParam(
          headerComponent.format,
          config.attachmentId,
          mediaUrl,
          documentFilename,
        );

        if (headerParam) {
          components.push({
            type: "header",
            parameters: [headerParam],
          });
        }
      } else if (headerComponent.format === "LOCATION") {
        const locationParam = buildLocationHeaderParam(contact, config);
        if (locationParam) {
          components.push({
            type: "header",
            parameters: [locationParam],
          });
        }
      } else if (headerComponent.text) {
        const hasVariables = /\{\{/.test(headerComponent.text);
        if (hasVariables) {
          const headerParams = buildTextHeaderParam(
            headerComponent.text,
            contact,
          );
          if (headerParams.length > 0) {
            components.push({
              type: "header",
              parameters: headerParams,
            });
          }
        }
      }
    }
  }

  // Build body component (both carousel and non-carousel)
  if (bodyComponent?.text) {
    const hasVariables = /\{\{/.test(bodyComponent.text);

    if (hasVariables) {
      const bodyParams = buildBodyParams(
        bodyComponent.text,
        contact,
        template,
        undefined,
        template.variableIndexMap?.body,
        useVariablePlaceholders,
      );
      if (bodyParams.length > 0) {
        components.push({
          type: "body",
          parameters: bodyParams,
        });
      }
    } else {
      components.push({
        type: "body",
      });
    }
  }

  if (!isCarousel) {
    // Build button components
    const buttonsComponent = template.components?.find(
      (c): c is BaseTemplateComponent => c.type === "BUTTONS",
    );
    if (buttonsComponent?.buttons) {
      const buttonComponents = buildButtonParams(
        buttonsComponent.buttons,
        contact,
        cleanPhone,
        template.couponCode,
      );
      components.push(...buttonComponents);
    }
  }

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "template",
    template: {
      name: config.templateName,
      language: { code: config.languageCode || "en" },
      components,
    },
  };
};
