import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../index";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import {
  buildMetaTemplatePayload,
  type MetaTemplateCreatePayload,
} from "../../utils/metaTemplateCreation";
import { buildVariableIndexMapFromDraft } from "../../utils/templateVariableMap";
import type { TemplateVariableIndexMap } from "../../types";
import { uploadMediaToMeta } from "./mediaThunks";

const API_VERSION = import.meta.env.VITE_META_API_VERSION || "v22.0";

/** Step 1: Get upload session key. Content-Type must be application/json. Token in Bearer header only. */
async function getUploadKey(
  appId: string,
  accessToken: string,
  file: File,
): Promise<string> {
  const url = API_ENDPOINTS.META.GET_UPLOAD_KEY(API_VERSION, appId);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      file_length: String(file.size),
      file_type: file.type,
      file_name: file.name,
      contentType: "application/octet-stream",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg =
      data?.error?.error_user_msg ||
      data?.error?.message ||
      "Failed to get upload key";
    throw new Error(msg);
  }
  const id = data?.id;
  if (!id || typeof id !== "string")
    throw new Error("Upload key response missing id");
  return id;
}

/** Step 2: Send file from React to Strapi (FormData). Strapi forwards to Meta and returns handle. */
async function uploadFileToSession(
  uploadId: string,
  file: File,
): Promise<string> {
  const url = API_ENDPOINTS.META.UPLOAD_FILE_PART();

  const formData = new FormData();
  formData.append("uploadId", uploadId);
  formData.append("file", file);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "File upload failed");
  }

  return data.h;
}

/** Step 3: POST create message template. */
async function postCreateTemplate(
  wabaId: string,
  accessToken: string,
  payload: MetaTemplateCreatePayload,
): Promise<{ id?: string }> {
  const url = API_ENDPOINTS.META.CREATE_MESSAGE_TEMPLATE(API_VERSION, wabaId);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg =
      data?.error?.error_user_msg ||
      data?.error?.message ||
      "Template creation failed";
    throw new Error(msg);
  }
  return { id: data?.id };
}

/** Strapi templateType from payload we already built (Video, Image, Document, Carousel). */
function templateTypeFromPayload(
  payload: MetaTemplateCreatePayload,
  isCarousel: boolean,
): string {
  if (isCarousel) return "Carousel";
  const header = (
    payload.components as Array<{ type?: string; format?: string }> | undefined
  )?.find((c) => c.type === "HEADER");
  const format = header?.format;
  if (format === "VIDEO") return "Video";
  if (format === "DOCUMENT") return "Document";
  return "Image";
}

function getDraftCouponCode(
  draft: RootState["createTemplate"],
): string | undefined {
  const btn = (draft.buttons || []).find((b) => b.type === "COPY_CODE");
  const code = (btn?.copyCodeExample || "").trim().slice(0, 12);
  return code || undefined;
}

/** POST template selection to Strapi. Sends templateAttachmentId and carouselTemplateAttachmentIds (Meta media IDs for sending). Do NOT send relation fields (templateAttachment / carouselTemplateAttachment) with Meta IDs - those are filled by upload. */
async function postTemplateSelectionToStrapi(payload: {
  templateId: string;
  templateName: string;
  templateType: string;
  templateVariables?: TemplateVariableIndexMap;
  couponCode?: string;
  /** Meta media ID for single image or first carousel card; used when sending messages. Strapi field should be string/bigint. */
  templateAttachmentId?: string;
  /** Carousel only: array of Meta media IDs for each card; used when sending carousel messages. Strapi field carouselTemplateAttachmentIds (string/JSON). */
  carouselTemplateAttachmentIds?: string[];
}): Promise<number | string> {
  const body: Record<string, unknown> = {
    templateId: payload.templateId,
    templateName: payload.templateName,
    templateType: payload.templateType,
    templateAttachment: null,
  };
  if (payload.templateVariables) {
    body.templateVariables = payload.templateVariables;
  }
  if (payload.couponCode) {
    body.couponCode = payload.couponCode;
  }
  if (
    payload.templateAttachmentId != null &&
    payload.templateAttachmentId !== ""
  ) {
    body.templateAttachmentId = payload.templateAttachmentId;
  }
  if (
    payload.carouselTemplateAttachmentIds != null &&
    payload.carouselTemplateAttachmentIds.length > 0
  ) {
    body.carouselTemplateAttachmentIds = payload.carouselTemplateAttachmentIds;
  }
  // Do not set carouselTemplateAttachment / templateAttachment here - they are relations (integer file IDs). We link media by uploading with ref/refId/field after create.
  const res = await fetch(API_ENDPOINTS.STRAPI.POST_TEMPLATE_SELECTION(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      (typeof err?.error === "object" && err?.error?.message) ||
      err?.message ||
      "Failed to save template selection to Strapi";
    throw new Error(typeof msg === "string" ? msg : "Strapi save failed");
  }
  const data = await res.json();
  const created = data?.data;
  const id = created?.id ?? created?.documentId ?? data?.id;
  if (id == null) throw new Error("Strapi create response missing id");
  return id;
}

/** Upload file to Strapi and link to marketing entry (so image appears). */
async function uploadFileToStrapi(
  file: File,
  refId: number | string,
  field: "templateAttachment" | "carouselTemplateAttachment",
): Promise<void> {
  const formData = new FormData();
  formData.append("files", file, file.name);
  formData.append("ref", "api::marketing.marketing");
  formData.append("refId", String(refId));
  formData.append("field", field);
  const res = await fetch(API_ENDPOINTS.STRAPI.UPLOAD_FILE(), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      (typeof err?.error === "object" && err?.error?.message) ||
      err?.message ||
      "Failed to upload image to Strapi";
    throw new Error(typeof msg === "string" ? msg : "Strapi upload failed");
  }
}

export interface SubmitCreateTemplateArg {
  /** For IMAGE/VIDEO/DOCUMENT header: file to upload via Resumable Upload. */
  headerMediaFile?: File | null;
  /** For Carousel: per-card header media file map (cardId -> File). */
  carouselCardFiles?: Record<string, File | null>;
}

/**
 * Submit the current create-template draft to Meta (message_templates).
 * Reads draft and config from state. Without media: single POST. With media: get key → upload file → create.
 * On success dispatches resetDraft.
 */
export const submitCreateTemplate = createAsyncThunk<
  { id?: string },
  SubmitCreateTemplateArg,
  { state: RootState; rejectValue: string }
>(
  "createTemplate/submit",
  async (
    { headerMediaFile, carouselCardFiles },
    { getState, dispatch, rejectWithValue },
  ) => {
    const state = getState();
    const draft = state.createTemplate;
    const { accessToken, wabaId, appId, phoneNumberId } = state.config.config;

    if (!accessToken?.trim() || !wabaId?.trim()) {
      return rejectWithValue(
        "Missing Meta API credentials. Set VITE_META_ACCESS_TOKEN and VITE_META_WABA_ID.",
      );
    }

    const isCarousel = draft.category === "CAROUSEL";

    const isMediaHeader =
      draft.headerType === "IMAGE" ||
      draft.headerType === "VIDEO" ||
      draft.headerType === "DOCUMENT";
    let headerHandle: string | undefined;
    let carouselHeaderHandles: Record<string, string> | undefined;

    if (isCarousel) {
      const files = carouselCardFiles || {};
      const entries = Object.entries(files).filter(
        ([, f]) => f != null,
      ) as Array<[string, File]>;
      if (entries.length > 0) {
        if (!appId?.trim()) {
          return rejectWithValue(
            "Missing App ID for media upload. Set VITE_META_APP_ID to your Facebook App ID (not the WABA ID).",
          );
        }
        carouselHeaderHandles = {};
        for (const [cardId, file] of entries) {
          try {
            const uploadId = await getUploadKey(
              appId.trim(),
              accessToken,
              file,
            );
            const handle = await uploadFileToSession(uploadId, file);
            carouselHeaderHandles[cardId] = handle;
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Media upload failed";
            return rejectWithValue(msg);
          }
        }
      }
    } else if (isMediaHeader && headerMediaFile) {
      if (!appId?.trim()) {
        return rejectWithValue(
          "Missing App ID for media upload. Set VITE_META_APP_ID to your Facebook App ID (not the WABA ID).",
        );
      }
      try {
        const uploadId = await getUploadKey(
          appId.trim(),
          accessToken,
          headerMediaFile,
        );
        headerHandle = await uploadFileToSession(uploadId, headerMediaFile);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Media upload failed";
        return rejectWithValue(msg);
      }
    }

    const payload = buildMetaTemplatePayload(
      draft,
      headerHandle,
      carouselHeaderHandles,
    );
    const variableIndexMap = buildVariableIndexMapFromDraft(draft);

    let result: { id?: string };
    try {
      result = await postCreateTemplate(wabaId, accessToken, payload);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Template creation failed";
      return rejectWithValue(msg);
    }

    const templateId = result?.id;
    if (!templateId) {
      return rejectWithValue("Template created but no template id returned");
    }

    const templateName = draft.name.trim();
    const templateType = templateTypeFromPayload(payload, isCarousel);
    const couponCode = getDraftCouponCode(draft);

    try {
      let createdMarketingId: number | string | null = null;

      if (isCarousel && carouselCardFiles && phoneNumberId?.trim()) {
        const cards = draft.carouselCards || [];
        const mediaIds: string[] = [];
        for (const card of cards) {
          const file = carouselCardFiles[card.id];
          if (file) {
            const id = await dispatch(
              uploadMediaToMeta({
                file,
                accessToken,
                phoneNumberId: phoneNumberId.trim(),
                apiVersion: API_VERSION,
              }),
            ).unwrap();
            mediaIds.push(id);
          }
        }
        createdMarketingId = await postTemplateSelectionToStrapi({
          templateId,
          templateName,
          templateType,
          templateVariables: variableIndexMap,
          couponCode,
          templateAttachmentId: mediaIds[0],
          carouselTemplateAttachmentIds: mediaIds,
        });
        if (createdMarketingId != null) {
          for (const card of cards) {
            const file = carouselCardFiles[card.id];
            if (file) {
              await uploadFileToStrapi(
                file,
                createdMarketingId,
                "carouselTemplateAttachment",
              );
            }
          }
        }
      } else if (isMediaHeader && headerMediaFile && phoneNumberId?.trim()) {
        const templateAttachmentId = await dispatch(
          uploadMediaToMeta({
            file: headerMediaFile,
            accessToken,
            phoneNumberId: phoneNumberId.trim(),
            apiVersion: API_VERSION,
          }),
        ).unwrap();
        createdMarketingId = await postTemplateSelectionToStrapi({
          templateId,
          templateName,
          templateType,
          templateVariables: variableIndexMap,
          couponCode,
          templateAttachmentId,
        });
        if (createdMarketingId != null) {
          await uploadFileToStrapi(
            headerMediaFile,
            createdMarketingId,
            "templateAttachment",
          );
        }
      } else {
        await postTemplateSelectionToStrapi({
          templateId,
          templateName,
          templateType,
          templateVariables: variableIndexMap,
          couponCode,
        });
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to save template selection";
      return rejectWithValue(msg);
    }

    return result;
  },
);
