import { createAsyncThunk } from "@reduxjs/toolkit";
import { MessageTemplate, Flow } from "../../types";
import { RootState } from "../index";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import { strapiErrorMessage } from "../../utils/errorMessage";
import { parseTemplateVariableMap } from "../../utils/templateVariableMap";

interface FetchTemplatesParams {
  accessToken: string;
  wabaId: string;
  apiVersion?: string;
}

export const fetchTemplates = createAsyncThunk<
  MessageTemplate[],
  FetchTemplatesParams,
  { rejectValue: string }
>("templates/fetchTemplates", async (params, { rejectWithValue }) => {
  try {
    const { accessToken, wabaId } = params;
    const apiVersion = params.apiVersion || "v22.0";

    if (!accessToken || !wabaId) {
      return rejectWithValue("Missing Meta API credentials");
    }

    const url = API_ENDPOINTS.META.GET_MESSAGE_TEMPLATES(apiVersion, wabaId);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(
        data.error?.message ||
          data.error?.error_user_msg ||
          "Failed to fetch templates",
      );
    }

    const templates = (data.data || []) as MessageTemplate[];
    // Filter out templates with name "hello_world" - show all others
    const filteredTemplates = templates.filter((t) => t.name !== "hello_world");
    return filteredTemplates;
  } catch (error: any) {
    return rejectWithValue(
      error.message || "Network error. Check your connection.",
    );
  }
});

interface FetchTemplateDetailsParams {
  accessToken: string;
  wabaId: string;
  templateName: string;
  apiVersion?: string;
}

export const fetchTemplateDetailsThunk = createAsyncThunk<
  MessageTemplate,
  FetchTemplateDetailsParams,
  { rejectValue: string }
>("templates/fetchTemplateDetails", async (params, { rejectWithValue }) => {
  try {
    const { accessToken, wabaId, templateName } = params;
    const apiVersion = params.apiVersion || "v22.0";

    if (!accessToken || !wabaId || !templateName) {
      return rejectWithValue("Missing required parameters");
    }

    const url = API_ENDPOINTS.META.GET_TEMPLATE_DETAILS(
      apiVersion,
      wabaId,
      templateName,
    );

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(
        data.error?.message ||
          data.error?.error_user_msg ||
          "Failed to fetch template details",
      );
    }

    const templates = data.data || [];
    if (templates.length === 0) {
      return rejectWithValue("Template not found");
    }

    return templates[0] as MessageTemplate;
  } catch (error: any) {
    return rejectWithValue(
      error.message || "Network error. Check your connection.",
    );
  }
});

interface FetchFlowsParams {
  accessToken: string;
  wabaId: string;
  apiVersion?: string;
}

export const fetchFlows = createAsyncThunk<
  Flow[],
  FetchFlowsParams,
  { rejectValue: string }
>("templates/fetchFlows", async (params, { rejectWithValue }) => {
  try {
    const { accessToken, wabaId } = params;
    const apiVersion = params.apiVersion || "v22.0";

    if (!accessToken || !wabaId) {
      return rejectWithValue("Missing Meta API credentials");
    }

    const url = API_ENDPOINTS.META.GET_FLOWS(apiVersion, wabaId);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(
        data.error?.message ||
          data.error?.error_user_msg ||
          "Failed to fetch flows",
      );
    }

    const raw = (data.data || []) as Array<{
      id: string | number;
      name: string;
      status?: string;
    }>;
    return raw.map((f) => ({
      id: String(f.id),
      name: f.name || String(f.id),
      status: f.status,
    }));
  } catch (error: any) {
    return rejectWithValue(
      error.message || "Network error. Check your connection.",
    );
  }
});

export const fetchTemplateSelections = createAsyncThunk<
  Record<
    string,
    {
      selectionId?: number;
      image?: string;
      imageId?: string;
      imageUrl?: string;
      templateImageId?: string;
      templateImageUrl?: string;
      templateType?: string;
      templateImageFileId?: number;
      templateCarouselImageIds?: number[];
      /** Meta media IDs for carousel send (from Strapi carouselTemplateAttachmentIds). */
      carouselAttachmentIds?: string[];
      templateVariables?: MessageTemplate["variableIndexMap"];
      couponCode?: string;
      /** Created date from Strapi (ISO string). */
      createdAt?: string;
    }
  >,
  void,
  { rejectValue: string }
>("templates/fetchTemplateSelections", async (_, { rejectWithValue }) => {
  try {
    const { API_ENDPOINTS } = await import("../../utils/apiEndpoints");
    const response = await fetch(
      API_ENDPOINTS.STRAPI.GET_TEMPLATE_SELECTIONS(),
    );
    const data = await response.json();

    const list = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];
    const mapped: Record<
      string,
      {
        selectionId?: number;
        image?: string;
        imageId?: string;
        imageUrl?: string;
        templateImageId?: string;
        templateImageUrl?: string;
        templateType?: string;
        templateImageFileId?: number;
        templateCarouselImageIds?: number[];
        carouselAttachmentIds?: string[];
        templateVariables?: MessageTemplate["variableIndexMap"];
        couponCode?: string;
        createdAt?: string;
        /** Document template: actual filename from Strapi (e.g. "PetsFirst Bot Template Appointment Feedback.pdf"). */
        templateAttachmentFileName?: string;
      }
    > = {};

    list.forEach((item: any) => {
      const selectionId = item?.id;
      const attributes = item?.attributes || item;
      const templateName = attributes?.templateName;
      if (!templateName) return;

      // Strapi Marketing fields: templateId, templateName, templateAttachmentId, templateType, templateAttachment, carouselTemplateAttachment, carouselTemplateAttachmentIds
      const templateAttachmentId = attributes?.templateAttachmentId;
      const templateType = attributes?.templateType;
      const templateAttachmentData = attributes?.templateAttachment?.data;
      const templateAttachmentUrl = templateAttachmentData?.attributes?.url;
      const templateAttachmentFileId = templateAttachmentData?.id;
      const attachmentName = templateAttachmentData?.attributes?.name;
      const templateAttachmentFileName =
        typeof attachmentName === "string" &&
        attachmentName.trim() &&
        attachmentName.includes(".") &&
        !attachmentName.startsWith("application/")
          ? attachmentName.trim()
          : undefined;
      const carouselData = attributes?.carouselTemplateAttachment?.data;
      const templateCarouselImageIds = Array.isArray(carouselData)
        ? carouselData.map((image: any) => image?.id).filter(Boolean)
        : [];
      const rawCarouselIds = attributes?.carouselTemplateAttachmentIds;
      const templateVariables = parseTemplateVariableMap(
        attributes?.templateVariables,
      );
      const couponCode =
        typeof attributes?.couponCode === "string" &&
        attributes.couponCode.trim()
          ? attributes.couponCode.trim()
          : undefined;
      let carouselAttachmentIds: string[] | undefined;
      if (Array.isArray(rawCarouselIds)) {
        carouselAttachmentIds = rawCarouselIds
          .filter((id: any) => id != null && String(id).trim())
          .map((id: any) => String(id));
      } else if (typeof rawCarouselIds === "string" && rawCarouselIds.trim()) {
        try {
          const parsed = JSON.parse(rawCarouselIds);
          carouselAttachmentIds = Array.isArray(parsed)
            ? parsed
                .filter((id: any) => id != null && String(id).trim())
                .map((id: any) => String(id))
            : undefined;
        } catch {
          carouselAttachmentIds = undefined;
        }
      }

      // Extract createdAt from Strapi (can be at item level or attributes level)
      const createdAt =
        item?.createdAt ||
        attributes?.createdAt ||
        item?.created_at ||
        attributes?.created_at;

      mapped[templateName] = {
        selectionId,
        templateImageId: templateAttachmentId,
        templateType,
        templateImageUrl: templateAttachmentUrl,
        templateImageFileId: templateAttachmentFileId,
        templateCarouselImageIds,
        carouselAttachmentIds,
        templateVariables,
        couponCode,
        createdAt: createdAt ? String(createdAt) : undefined,
        templateAttachmentFileName,
        imageId: templateAttachmentId,
        imageUrl: templateAttachmentUrl,
      };
    });

    return mapped;
  } catch (error: any) {
    return rejectWithValue(
      error.message || "Failed to fetch template selections",
    );
  }
});

interface DeleteTemplateParams {
  accessToken: string;
  wabaId: string;
  templateName: string;
  /** Optional Meta hsm_id if available on the template object */
  hsmId?: string;
  apiVersion?: string;
  /** Strapi marketing entry id/documentId – when set, also deletes from Strapi */
  strapiSelectionId?: string | number;
  /** Optional Meta template id for Strapi lookup when selectionId is missing */
  templateId?: string;
}

export const deleteTemplateThunk = createAsyncThunk<
  { templateName: string },
  DeleteTemplateParams,
  { rejectValue: string }
>("templates/deleteTemplate", async (params, { rejectWithValue }) => {
  try {
    const { accessToken, wabaId, templateName, hsmId, strapiSelectionId } =
      params;
    const apiVersion = params.apiVersion || "v22.0";

    if (!accessToken || !wabaId || !templateName) {
      return rejectWithValue("Missing required parameters");
    }

    // 1. Delete from Meta
    const url = API_ENDPOINTS.META.DELETE_MESSAGE_TEMPLATE(
      apiVersion,
      wabaId,
      templateName,
      hsmId,
    );

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return rejectWithValue(
        data?.error?.error_data?.details ||
          data?.error?.error_user_msg ||
          data?.error?.message ||
          "Failed to delete template",
      );
    }

    // 2. Delete from Strapi if we have a marketing entry for this template
    if (strapiSelectionId != null && strapiSelectionId !== "") {
      const strapiResponse = await fetch(
        API_ENDPOINTS.STRAPI.DELETE_TEMPLATE_SELECTION(strapiSelectionId),
        { method: "DELETE" },
      );
      if (!strapiResponse.ok) {
        let message = "Failed to delete template from Strapi";
        try {
          const body = await strapiResponse.json();
          message = strapiErrorMessage(body, message);
        } catch {
          // ignore
        }
        return rejectWithValue(message);
      }
    }

    return { templateName };
  } catch (error: any) {
    return rejectWithValue(
      error.message || "Network error. Check your connection.",
    );
  }
});
