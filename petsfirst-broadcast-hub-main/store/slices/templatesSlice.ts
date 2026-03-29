import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MessageTemplate, TemplateVariableIndexMap } from "../../types";
import {
  fetchTemplates,
  fetchTemplateDetailsThunk,
  fetchTemplateSelections,
  deleteTemplateThunk,
} from "../thunks/templateThunks";

interface TemplateSelectionMap {
  [templateName: string]: {
    selectionId?: number;
    image?: string;
    imageId?: string;
    imageUrl?: string;
    templateImageId?: string;
    templateImageUrl?: string;
    templateType?: string;
    templateImageFileId?: number;
    templateCarouselImageIds?: number[];
    /** Meta media IDs for carousel send. */
    carouselAttachmentIds?: string[];
    /** Positional-to-named variable map from Strapi templateVariables. */
    templateVariables?: TemplateVariableIndexMap;
    /** Coupon code fallback from Strapi selection. */
    couponCode?: string;
    /** Created date from Strapi (ISO string). */
    createdAt?: string;
    /** Document template: actual filename from marketing attachment API (e.g. "PetsFirst Bot Template Appointment Feedback.pdf"). */
    templateAttachmentFileName?: string;
  };
}

interface TemplatesState {
  templates: MessageTemplate[];
  isLoading: boolean;
  error: string | null;
  loadingDetails: string[];
  expandedTemplate: string | null;
  uploadingTemplate: string | null;
  uploadErrors: Record<string, string | null>;
  templateSelectionMap: TemplateSelectionMap;
  searchQuery: string;
}

const initialState: TemplatesState = {
  templates: [],
  isLoading: false,
  error: null,
  loadingDetails: [],
  expandedTemplate: null,
  uploadingTemplate: null,
  uploadErrors: {},
  templateSelectionMap: {},
  searchQuery: "",
};

const templatesSlice = createSlice({
  name: "templates",
  initialState,
  reducers: {
    setTemplates: (state, action: PayloadAction<MessageTemplate[]>) => {
      state.templates = action.payload;
    },
    updateTemplate: (state, action: PayloadAction<MessageTemplate>) => {
      const index = state.templates.findIndex(
        (t) => t.name === action.payload.name,
      );
      if (index !== -1) {
        state.templates[index] = {
          ...state.templates[index],
          ...action.payload,
        };
      }
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addLoadingDetail: (state, action: PayloadAction<string>) => {
      if (!state.loadingDetails.includes(action.payload)) {
        state.loadingDetails.push(action.payload);
      }
    },
    removeLoadingDetail: (state, action: PayloadAction<string>) => {
      state.loadingDetails = state.loadingDetails.filter(
        (name) => name !== action.payload,
      );
    },
    setExpandedTemplate: (state, action: PayloadAction<string | null>) => {
      state.expandedTemplate = action.payload;
    },
    setUploadingTemplate: (state, action: PayloadAction<string | null>) => {
      state.uploadingTemplate = action.payload;
    },
    setUploadError: (
      state,
      action: PayloadAction<{ templateName: string; error: string | null }>,
    ) => {
      state.uploadErrors[action.payload.templateName] = action.payload.error;
    },
    clearUploadErrors: (state) => {
      state.uploadErrors = {};
    },
    setTemplateSelectionMap: (
      state,
      action: PayloadAction<TemplateSelectionMap>,
    ) => {
      state.templateSelectionMap = {
        ...state.templateSelectionMap,
        ...action.payload,
      };
    },
    updateTemplateSelection: (
      state,
      action: PayloadAction<{
        templateName: string;
        data: TemplateSelectionMap[string];
      }>,
    ) => {
      state.templateSelectionMap[action.payload.templateName] =
        action.payload.data;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    resetTemplates: (state) => {
      state.templates = [];
      state.error = null;
      state.loadingDetails = [];
      state.expandedTemplate = null;
      state.uploadingTemplate = null;
      state.uploadErrors = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch templates
      .addCase(fetchTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload;
        state.error = null;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch templates";
      })
      // Fetch template details
      .addCase(fetchTemplateDetailsThunk.pending, (state, action) => {
        const templateName = action.meta.arg.templateName;
        if (!state.loadingDetails.includes(templateName)) {
          state.loadingDetails.push(templateName);
        }
      })
      .addCase(fetchTemplateDetailsThunk.fulfilled, (state, action) => {
        const templateName = action.meta.arg.templateName;
        state.loadingDetails = state.loadingDetails.filter(
          (name) => name !== templateName,
        );
        const index = state.templates.findIndex((t) => t.name === templateName);
        if (index !== -1) {
          state.templates[index] = {
            ...state.templates[index],
            ...action.payload,
            components:
              action.payload.components || state.templates[index].components,
          };
        }
      })
      .addCase(fetchTemplateDetailsThunk.rejected, (state, action) => {
        const templateName = action.meta.arg.templateName;
        state.loadingDetails = state.loadingDetails.filter(
          (name) => name !== templateName,
        );
      })
      // Fetch template selections
      .addCase(fetchTemplateSelections.fulfilled, (state, action) => {
        state.templateSelectionMap = {
          ...state.templateSelectionMap,
          ...action.payload,
        };
        state.templates = state.templates.map((template) => ({
          ...template,
          variableIndexMap:
            action.payload[template.name]?.templateVariables ||
            template.variableIndexMap,
          couponCode:
            action.payload[template.name]?.couponCode || template.couponCode,
        }));
      })
      // Delete template
      .addCase(deleteTemplateThunk.fulfilled, (state, action) => {
        const name = action.payload.templateName;
        state.templates = state.templates.filter((t) => t.name !== name);
        delete state.templateSelectionMap[name];
        delete state.uploadErrors[name];
        if (state.expandedTemplate === name) state.expandedTemplate = null;
      });
  },
});

export const {
  setTemplates,
  updateTemplate,
  setIsLoading,
  setError,
  addLoadingDetail,
  removeLoadingDetail,
  setExpandedTemplate,
  setUploadingTemplate,
  setUploadError,
  clearUploadErrors,
  setTemplateSelectionMap,
  updateTemplateSelection,
  setSearchQuery,
  resetTemplates,
} = templatesSlice.actions;

export default templatesSlice.reducer;
