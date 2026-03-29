export interface Contact {
  name: string;
  phone: string;
  [key: string]: string;
}

export interface MetaConfig {
  appId: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  templateName: string;
  languageCode: string;
  template?: MessageTemplate | null;
  /** Single-image/header or first carousel card Meta media ID. */
  attachmentId?: string;
  /** Carousel only: Meta media IDs per card (for send payload). */
  carouselAttachmentIds?: string[];
  /** Document header: filename sent to WhatsApp (avoids "Untitled"). e.g. "Invoice_PetsFirst.pdf" or "PetsFirst_Invoice_2026_03_11.pdf". */
  documentFilename?: string;
}

export interface TemplateExample {
  header_handle?: string[];
  body_text?: string[][];
  body_text_named_params?: Array<{
    param_name: string;
    example: string;
  }>;
}

export interface BaseTemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";
  text?: string;
  buttons?: TemplateButton[];
  example?: TemplateExample;
}

export interface CarouselTemplateCard {
  components: BaseTemplateComponent[];
}

export interface CarouselTemplateComponent {
  type: "CAROUSEL";
  cards: CarouselTemplateCard[];
}

export type TemplateComponent =
  | BaseTemplateComponent
  | CarouselTemplateComponent;

export interface TemplateButton {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "FLOW" | "COPY_CODE";
  text: string;
  url?: string;
  phone_number?: string;
  flow_id?: number;
  flow_action?: string;
  navigate_screen?: string;
  /** COPY_CODE: sample code shown in template (max 15 chars). */
  example?: string;
}

/** Flow from Meta GET /{waba-id}/flows (for Form/FLOW button in template). */
export interface Flow {
  id: string;
  name: string;
  status?: string;
}

export interface MessageTemplate {
  name: string;
  status?: string;
  language?: string;
  category?: string;
  id?: string;
  parameter_format?: string;
  components?: TemplateComponent[];
  created_time?: string;
  variableIndexMap?: TemplateVariableIndexMap;
  /** Coupon code saved in Strapi template selection for COPY_CODE button fallback. */
  couponCode?: string;
}

export interface TemplateVariableIndexMap {
  body?: string[];
  carouselCardBody?: Record<string, string[]>;
}

/** Draft for new template creation (Gallabox-style form) */
export type TemplateHeaderFormat =
  | "NONE"
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "DOCUMENT"
  | "LOCATION";

export interface TemplateDraftButton {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "FLOW" | "COPY_CODE";
  text: string;
  url?: string;
  /** For URL buttons with a single variable, Meta requires an example value. */
  urlExample?: string;
  phone_number?: string;
  /** For FLOW (Form) button: Meta flow id, action, and screen. Only one flow per template. */
  flow_id?: number;
  flow_action?: string;
  navigate_screen?: string;
  /** For COPY_CODE (Coupon code) button: sample code, max 15 characters. */
  copyCodeExample?: string;
}

export type CarouselHeaderFormat = "IMAGE" | "VIDEO";
export type CarouselCardButtonType = "QUICK_REPLY" | "URL" | "PHONE_NUMBER";

export interface CarouselCardDraft {
  id: string;
  /** For UI preview only (object URL). File is stored outside Redux. */
  headerMediaUrl?: string;
  bodyText?: string;
  /** Sample text per card body variable for Meta review. Required when bodyText contains variables. */
  bodyVariableSamples?: Record<string, string>;
  /** Exactly matches the selected global button types (1–2). */
  buttons: Array<TemplateDraftButton & { type: CarouselCardButtonType }>;
}

export interface TemplateDraft {
  name: string;
  category: string;
  channelName: string;
  language: string;
  headerType: TemplateHeaderFormat;
  headerText: string;
  headerMediaUrl?: string;
  /** For LOCATION header */
  locationName?: string;
  locationAddress?: string;
  body: string;
  /** Sample text per body variable for Meta review (e.g. { name: "John", email: "john@example.com" }). */
  bodyVariableSamples?: Record<string, string>;
  footer: string;
  buttons: TemplateDraftButton[];

  /** Carousel-only fields (when category === "CAROUSEL"). */
  carouselHeaderFormat?: CarouselHeaderFormat;
  carouselHasCardBody?: boolean;
  carouselButton1Type?: CarouselCardButtonType | "";
  carouselButton2Type?: CarouselCardButtonType | "";
  carouselCards?: CarouselCardDraft[];
}

export enum BroadcastStatus {
  IDLE = "IDLE",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export interface BroadcastResult {
  contact: Contact;
  status: BroadcastStatus;
  error?: string;
  messageId?: string;
  timestamp?: string;
}

export interface CSVData {
  headers: string[];
  rows: Contact[];
  fileName?: string;
}

// Analytics Types
export interface AnalyticsDataPoint {
  start: number;
  end: number;
  sent: number;
  delivered: number;
}

export interface AnalyticsResponse {
  analytics: {
    phone_numbers: string[];
    granularity: string;
    data_points: AnalyticsDataPoint[];
  };
  id: string;
}

export interface AnalyticsConfig {
  wabaId: string;
  accessToken: string;
  startTimestamp?: number;
  endTimestamp?: number;
}

export interface BroadcastHistory {
  id: string;
  name: string;
  fileName?: string;
  templateName: string;
  status: "COMPLETED" | "FAILED" | "PENDING" | "IN_PROGRESS";
  recipients: number;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  clicks?: number;
  formReplied?: number;
  failed: number;
  createdAt: number;
  createdBy: string;
}

/** Optional retry config for broadcast. When enableRetry is true, firstRetryInHours and retryCount are sent in BROADCAST_CAMPAIGN_CREATE only. */
export interface BroadcastRetryOptions {
  enableRetry: boolean;
  /** Hours until first retry (12–24). Sent as firstRetryInHours in create body when enableRetry is true. */
  firstRetryInHours: number;
  /** How many times to retry (1–3). Sent as retryCount in create body when enableRetry is true. */
  retryCount: number;
}
