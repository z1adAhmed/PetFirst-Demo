import { createAsyncThunk } from "@reduxjs/toolkit";
import { MessageTemplate } from "../../types";
import { RootState } from "../index";
import { setSelectedTemplate, persistConfig } from "../slices/configSlice";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";

interface FetchTemplateIfNeededParams {
  templateName: string;
}

export const fetchTemplateIfNeeded = createAsyncThunk<
  MessageTemplate | null,
  FetchTemplateIfNeededParams,
  { state: RootState; rejectValue: string }
>(
  "config/fetchTemplateIfNeeded",
  async (params, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const { config, selectedTemplate } = state.config;

    if (!config.templateName || !config.accessToken || !config.wabaId) {
      return null;
    }

    const needsFetch =
      !selectedTemplate || selectedTemplate.name !== config.templateName;
    if (!needsFetch) {
      const mappedVariable =
        getState().templates.templateSelectionMap[selectedTemplate.name]
          ?.templateVariables;
      const mappedCouponCode =
        getState().templates.templateSelectionMap[selectedTemplate.name]
          ?.couponCode;
      if (
        (mappedVariable &&
          JSON.stringify(selectedTemplate.variableIndexMap || {}) !==
            JSON.stringify(mappedVariable)) ||
        (mappedCouponCode &&
          (selectedTemplate.couponCode || "").trim() !== mappedCouponCode)
      ) {
        const enriched = {
          ...selectedTemplate,
          variableIndexMap: mappedVariable,
          couponCode: mappedCouponCode || selectedTemplate.couponCode,
        };
        dispatch(setSelectedTemplate(enriched));
        return enriched;
      }
      return selectedTemplate;
    }

    try {
      const apiVersion = import.meta.env.VITE_META_API_VERSION || "v22.0";
      const url = API_ENDPOINTS.META.GET_TEMPLATE_DETAILS(
        apiVersion,
        config.wabaId,
        params.templateName,
      );

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
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
        return null;
      }

      const templateName = (templates[0] as MessageTemplate).name;
      const templateVariables =
        getState().templates.templateSelectionMap[templateName]
          ?.templateVariables;
      const couponCode =
        getState().templates.templateSelectionMap[templateName]?.couponCode;
      const template = {
        ...(templates[0] as MessageTemplate),
        variableIndexMap: templateVariables,
        couponCode,
      };
      dispatch(setSelectedTemplate(template));
      dispatch(persistConfig());
      return template;
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch template details",
      );
    }
  },
);
