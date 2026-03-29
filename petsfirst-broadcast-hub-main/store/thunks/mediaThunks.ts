import { createAsyncThunk } from "@reduxjs/toolkit";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import { strapiErrorMessage } from "../../utils/errorMessage";
import type { TemplateVariableIndexMap } from "../../types";

interface UploadMediaParams {
  file: File;
  accessToken: string;
  phoneNumberId: string;
  apiVersion: string;
}

export const uploadMediaToMeta = createAsyncThunk<
  string,
  UploadMediaParams,
  { rejectValue: string }
>("templates/uploadMediaToMeta", async (params, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("type", params.file.type || "application/octet-stream");
    formData.append("file", params.file);

    const response = await fetch(
      API_ENDPOINTS.META.UPLOAD_MEDIA(params.apiVersion, params.phoneNumberId),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
        },
        body: formData,
      },
    );

    const data = await response.json();
    if (!response.ok) {
      const rawMessage = data?.error?.message || "";
      const friendlyMessage = rawMessage.includes("Param file must be a file")
        ? "Unsupported file type. Please upload JPG, PNG, WEBP, MP4/3GPP, or PDF/DOC/PPT/XLS/TXT."
        : "Media upload failed. Please try another file.";
      return rejectWithValue(friendlyMessage);
    }

    if (!data?.id) {
      return rejectWithValue("Media upload succeeded but returned no id");
    }

    return data.id as string;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to upload media");
  }
});

interface UploadStrapiFileParams {
  file: File;
  ref?: string;
  refId?: number;
  field?: string;
}

interface StrapiFileResponse {
  id: number;
  name: string;
  url: string;
}

export const uploadStrapiFile = createAsyncThunk<
  StrapiFileResponse,
  UploadStrapiFileParams,
  { rejectValue: string }
>("templates/uploadStrapiFile", async (params, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("files", params.file, params.file.name);
    if (params.ref) {
      formData.append("ref", params.ref);
    }
    if (params.field) {
      formData.append("field", params.field);
    }
    if (typeof params.refId === "number") {
      formData.append("refId", String(params.refId));
    }

    const response = await fetch(API_ENDPOINTS.STRAPI.UPLOAD_FILE(), {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      const message =
        (typeof data?.error === "object" && data?.error?.message) ||
        data?.message ||
        "Strapi upload failed";
      return rejectWithValue(
        typeof message === "string" ? message : "Strapi upload failed",
      );
    }

    const uploaded = Array.isArray(data) ? data[0] : data;
    return {
      id: uploaded?.id,
      name: uploaded?.name || params.file.name,
      url: uploaded?.url,
    };
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to upload file to Strapi");
  }
});

interface SaveTemplateSelectionParams {
  templateId: string;
  templateName: string;
  mediaId: string;
  templateType: string;
  isCarousel: boolean;
  templateVariables?: TemplateVariableIndexMap;
  couponCode?: string;
}

export const saveTemplateSelection = createAsyncThunk<
  any,
  SaveTemplateSelectionParams,
  { rejectValue: string }
>("templates/saveTemplateSelection", async (params, { rejectWithValue }) => {
  try {
    const payloadData = params.isCarousel
      ? {
          templateId: params.templateId,
          templateName: params.templateName,
          templateAttachmentId: params.mediaId,
          templateType: params.templateType,
          templateVariables: params.templateVariables,
          couponCode: params.couponCode,
          templateAttachment: null,
          carouselTemplateAttachment: [],
        }
      : {
          templateId: params.templateId,
          templateName: params.templateName,
          templateAttachmentId: params.mediaId,
          templateType: params.templateType,
          templateVariables: params.templateVariables,
          couponCode: params.couponCode,
          templateAttachment: null,
        };

    const response = await fetch(
      API_ENDPOINTS.STRAPI.POST_TEMPLATE_SELECTION(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: payloadData,
        }),
      },
    );

    if (!response.ok) {
      let message = "Failed to save template selection";
      try {
        const localData = await response.json();
        message = strapiErrorMessage(localData, message);
      } catch {
        // ignore parse errors
      }
      return rejectWithValue(message);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    return rejectWithValue(
      error.message || "Failed to save template selection",
    );
  }
});

interface UpdateTemplateSelectionParams {
  selectionId: number;
  templateId: string;
  templateName: string;
  mediaId: string;
  templateType: string;
  isCarousel: boolean;
  templateVariables?: TemplateVariableIndexMap;
  couponCode?: string;
}

export const updateTemplateSelection = createAsyncThunk<
  any,
  UpdateTemplateSelectionParams,
  { rejectValue: string }
>("templates/updateTemplateSelection", async (params, { rejectWithValue }) => {
  try {
    const payloadData = params.isCarousel
      ? {
          templateId: params.templateId,
          templateName: params.templateName,
          templateAttachmentId: params.mediaId,
          templateType: params.templateType,
          templateVariables: params.templateVariables,
          couponCode: params.couponCode,
          templateAttachment: null,
          carouselTemplateAttachment: [],
        }
      : {
          templateId: params.templateId,
          templateName: params.templateName,
          templateAttachmentId: params.mediaId,
          templateType: params.templateType,
          templateVariables: params.templateVariables,
          couponCode: params.couponCode,
          templateAttachment: null,
        };

    const response = await fetch(
      API_ENDPOINTS.STRAPI.PUT_TEMPLATE_SELECTION(params.selectionId),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: payloadData,
        }),
      },
    );

    if (!response.ok) {
      let message = "Failed to update template selection";
      try {
        const localData = await response.json();
        message = strapiErrorMessage(localData, message);
      } catch {
        // ignore parse errors
      }
      return rejectWithValue(message);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    return rejectWithValue(
      error.message || "Failed to update template selection",
    );
  }
});
