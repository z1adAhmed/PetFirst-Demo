import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MetaConfig, MessageTemplate } from "../../types";

interface ConfigState {
  config: MetaConfig;
  selectedTemplate: MessageTemplate | null;
  attachmentId: string | null;
  carouselAttachmentIds: string[] | null;
}

const loadPersistedConfig = () => {
  const saved = localStorage.getItem("pets_first_meta_config");
  if (!saved) {
    return {
      templateName: "",
      languageCode: import.meta.env.VITE_META_LANGUAGE_CODE || "en",
      template: null as MessageTemplate | null,
      documentFilename: undefined,
    };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      templateName: parsed.templateName || "",
      languageCode:
        parsed.languageCode || import.meta.env.VITE_META_LANGUAGE_CODE || "en",
      template: parsed.template || null,
      documentFilename: parsed.documentFilename || undefined,
    };
  } catch {
    return {
      templateName: "",
      languageCode: import.meta.env.VITE_META_LANGUAGE_CODE || "en",
      template: null as MessageTemplate | null,
      documentFilename: undefined,
    };
  }
};

const persisted = loadPersistedConfig();

const initialState: ConfigState = {
  config: {
    accessToken: import.meta.env.VITE_META_ACCESS_TOKEN || "",
    phoneNumberId: import.meta.env.VITE_META_PHONE_NUMBER_ID || "",
    wabaId: import.meta.env.VITE_META_WABA_ID || "",
    appId: import.meta.env.VITE_META_APP_ID || "",
    templateName: persisted.templateName,
    languageCode: persisted.languageCode,
    template: persisted.template,
    documentFilename: persisted.documentFilename,
  },
  selectedTemplate: persisted.template,
  attachmentId: null,
  carouselAttachmentIds: null,
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setConfig: (state, action: PayloadAction<Partial<MetaConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },
    setTemplateName: (state, action: PayloadAction<string>) => {
      state.config.templateName = action.payload;
    },
    setSelectedTemplate: (
      state,
      action: PayloadAction<MessageTemplate | null>,
    ) => {
      state.selectedTemplate = action.payload;
      if (action.payload) {
        state.config.templateName = action.payload.name;
        state.config.template = action.payload;
      }
    },
    setAttachmentId: (state, action: PayloadAction<string | null>) => {
      state.attachmentId = action.payload;
      if (action.payload) {
        state.config = { ...state.config, attachmentId: action.payload };
      } else {
        const { attachmentId: _, ...rest } = state.config;
        state.config = rest as MetaConfig;
      }
      state.carouselAttachmentIds = null;
    },
    setCarouselAttachmentIds: (state, action: PayloadAction<string[] | null>) => {
      state.carouselAttachmentIds = action.payload;
      if (action.payload?.length) {
        state.config = { ...state.config, carouselAttachmentIds: action.payload };
      } else {
        const { carouselAttachmentIds: __, ...rest } = state.config;
        state.config = rest as MetaConfig;
      }
    },
    resetConfig: (state) => {
      state.config.templateName = "";
      state.selectedTemplate = null;
      state.attachmentId = null;
      state.carouselAttachmentIds = null;
      state.config.template = null;
      const { attachmentId: _, carouselAttachmentIds: __, template, ...rest } = state.config;
      state.config = { ...rest, template: null };
    },
    persistConfig: (state) => {
      const { templateName, languageCode } = state.config;
      const saved = localStorage.getItem("pets_first_meta_config");
      let parsed: any = {};
      if (saved) {
        try {
          parsed = JSON.parse(saved);
        } catch (e) {
          // Ignore parse errors
        }
      }
      parsed.templateName = templateName;
      parsed.languageCode = languageCode;
      if (state.config.documentFilename) {
        parsed.documentFilename = state.config.documentFilename;
      } else {
        delete parsed.documentFilename;
      }
      // Backward-compat: remove old simulation fields if present
      delete parsed.isSimulated;
      delete parsed.configVersion;
      if (state.selectedTemplate) {
        parsed.template = state.selectedTemplate;
      }
      localStorage.setItem("pets_first_meta_config", JSON.stringify(parsed));
    },
  },
});

export const {
  setConfig,
  setTemplateName,
  setSelectedTemplate,
  setAttachmentId,
  setCarouselAttachmentIds,
  resetConfig,
  persistConfig,
} = configSlice.actions;

export default configSlice.reducer;
