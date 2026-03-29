import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  TemplateDraft,
  TemplateDraftButton,
  TemplateHeaderFormat,
  Flow,
  CarouselCardDraft,
  CarouselHeaderFormat,
  CarouselCardButtonType,
} from '../../types';
import { submitCreateTemplate } from '../thunks/createTemplateThunks';
import { fetchFlows } from '../thunks/templateThunks';

const DEFAULT_CHANNEL = 'MyPetsFirst Veterinary Clinic';
const DEFAULT_LANGUAGE = 'en';
const QUICK_REPLY_MAX = 2;

/** Template name: only lowercase letters, digits, and underscore. Max length for Meta. */
export const TEMPLATE_NAME_MAX = 60;
const TEMPLATE_NAME_ALLOWED = /[^a-z0-9_]/g;

function normalizeTemplateName(value: string): string {
  return value.toLowerCase().replace(TEMPLATE_NAME_ALLOWED, '').slice(0, TEMPLATE_NAME_MAX);
}

export type CreateTemplateSubmitStatus = 'idle' | 'pending' | 'success' | 'failed';

export interface CreateTemplateState extends TemplateDraft {
  submitStatus: CreateTemplateSubmitStatus;
  submitError: string | null;
  /** Published flows for FLOW button dropdown (from GET /{waba-id}/flows). */
  publishedFlows: Flow[];
}

const draftInitial: TemplateDraft = {
  name: '',
  category: '',
  channelName: DEFAULT_CHANNEL,
  language: DEFAULT_LANGUAGE,
  headerType: 'NONE',
  headerText: '',
  headerMediaUrl: undefined,
  locationName: '',
  locationAddress: '',
  body: '',
  bodyVariableSamples: {},
  footer: '',
  buttons: [],
  carouselHeaderFormat: 'IMAGE',
  carouselHasCardBody: true,
  carouselButton1Type: '',
  carouselButton2Type: '',
  carouselCards: [],
};

const initialState: CreateTemplateState = {
  ...draftInitial,
  submitStatus: 'idle',
  submitError: null,
  publishedFlows: [],
};

const createTemplateSlice = createSlice({
  name: 'createTemplate',
  initialState,
  reducers: {
    setDraft: (state, action: PayloadAction<Partial<TemplateDraft>>) => {
      const { name, ...rest } = action.payload;
      if (name !== undefined) state.name = normalizeTemplateName(name);
      Object.assign(state, rest);
    },
    setName: (state, action: PayloadAction<string>) => {
      state.name = normalizeTemplateName(action.payload);
    },
    setCategory: (state, action: PayloadAction<string>) => {
      state.category = action.payload;
    },
    setChannelName: (state, action: PayloadAction<string>) => {
      state.channelName = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setHeaderType: (state, action: PayloadAction<TemplateHeaderFormat>) => {
      const prevType = state.headerType;
      state.headerType = action.payload;
      if (action.payload === 'NONE') {
        state.headerText = '';
        state.headerMediaUrl = undefined;
      } else if (prevType !== action.payload) {
        state.headerMediaUrl = undefined;
      }
    },
    setHeaderText: (state, action: PayloadAction<string>) => {
      state.headerText = action.payload;
    },
    setHeaderMediaUrl: (state, action: PayloadAction<string | undefined>) => {
      state.headerMediaUrl = action.payload;
    },
    setLocationName: (state, action: PayloadAction<string>) => {
      state.locationName = action.payload;
    },
    setLocationAddress: (state, action: PayloadAction<string>) => {
      state.locationAddress = action.payload;
    },
    setBody: (state, action: PayloadAction<string>) => {
      state.body = action.payload;
    },
    setBodyVariableSample: (state, action: PayloadAction<{ varName: string; sample: string }>) => {
      if (!state.bodyVariableSamples) state.bodyVariableSamples = {};
      state.bodyVariableSamples[action.payload.varName] = action.payload.sample;
    },
    setFooter: (state, action: PayloadAction<string>) => {
      state.footer = action.payload;
    },
    setButtons: (state, action: PayloadAction<TemplateDraftButton[]>) => {
      state.buttons = action.payload;
    },
    setCarouselFormat: (
      state,
      action: PayloadAction<{
        headerFormat?: CarouselHeaderFormat;
        hasCardBody?: boolean;
        button1Type?: CarouselCardButtonType | '';
        button2Type?: CarouselCardButtonType | '';
      }>,
    ) => {
      if (action.payload.headerFormat != null) state.carouselHeaderFormat = action.payload.headerFormat;
      if (action.payload.hasCardBody != null) state.carouselHasCardBody = action.payload.hasCardBody;
      if (action.payload.button1Type != null) state.carouselButton1Type = action.payload.button1Type;
      if (action.payload.button2Type != null) state.carouselButton2Type = action.payload.button2Type;
    },
    setCarouselCards: (state, action: PayloadAction<CarouselCardDraft[]>) => {
      state.carouselCards = action.payload;
    },
    addCarouselCard: (state, action: PayloadAction<CarouselCardDraft>) => {
      if (!state.carouselCards) state.carouselCards = [];
      if (state.carouselCards.length < 10) state.carouselCards.push(action.payload);
    },
    updateCarouselCard: (
      state,
      action: PayloadAction<{ id: string; patch: Partial<CarouselCardDraft> }>,
    ) => {
      const list = state.carouselCards || [];
      const idx = list.findIndex((c) => c.id === action.payload.id);
      if (idx === -1) return;
      list[idx] = { ...list[idx], ...action.payload.patch };
      state.carouselCards = list;
    },
    removeCarouselCard: (state, action: PayloadAction<string>) => {
      state.carouselCards = (state.carouselCards || []).filter((c) => c.id !== action.payload);
    },
    addButton: (state, action: PayloadAction<TemplateDraftButton>) => {
      if (state.buttons.length >= 10) return;
      if (action.payload.type === 'QUICK_REPLY') {
        const quickReplyCount = state.buttons.filter((b) => b.type === 'QUICK_REPLY').length;
        if (quickReplyCount >= QUICK_REPLY_MAX) return;
      }
      if (action.payload.type === 'COPY_CODE') {
        const copyCodeCount = state.buttons.filter((b) => b.type === 'COPY_CODE').length;
        if (copyCodeCount >= 1) return;
      }
      state.buttons.push(action.payload);
    },
    updateButton: (state, action: PayloadAction<{ index: number; button: Partial<TemplateDraftButton> }>) => {
      const { index, button } = action.payload;
      if (index >= 0 && index < state.buttons.length) {
        if (button.type === 'QUICK_REPLY') {
          const otherQuickReplies = state.buttons.filter(
            (b, i) => i !== index && b.type === 'QUICK_REPLY',
          ).length;
          if (otherQuickReplies >= QUICK_REPLY_MAX) return;
        }
        if (button.type === 'COPY_CODE') {
          const otherCopyCode = state.buttons.filter(
            (b, i) => i !== index && b.type === 'COPY_CODE',
          ).length;
          if (otherCopyCode >= 1) return;
        }
        state.buttons[index] = { ...state.buttons[index], ...button };
      }
    },
    removeButton: (state, action: PayloadAction<number>) => {
      state.buttons.splice(action.payload, 1);
    },
    resetDraft: () => initialState,
    clearSubmitStatus: (state) => {
      state.submitStatus = 'idle';
      state.submitError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitCreateTemplate.pending, (state) => {
        state.submitStatus = 'pending';
        state.submitError = null;
      })
      .addCase(submitCreateTemplate.fulfilled, (state) => {
        Object.assign(state, { ...draftInitial, submitStatus: 'success' as const, submitError: null, publishedFlows: state.publishedFlows });
      })
      .addCase(submitCreateTemplate.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitError = action.payload ?? action.error?.message ?? 'Submit failed';
      })
      .addCase(fetchFlows.fulfilled, (state, action) => {
        state.publishedFlows = (action.payload || []).filter(
          (f) => (f.status ?? '').toUpperCase() === 'PUBLISHED',
        );
      });
  },
});

export const {
  setDraft,
  setName,
  setCategory,
  setChannelName,
  setLanguage,
  setHeaderType,
  setHeaderText,
  setHeaderMediaUrl,
  setLocationName,
  setLocationAddress,
  setBody,
  setBodyVariableSample,
  setFooter,
  setButtons,
  setCarouselFormat,
  setCarouselCards,
  addCarouselCard,
  updateCarouselCard,
  removeCarouselCard,
  addButton,
  updateButton,
  removeButton,
  resetDraft,
  clearSubmitStatus,
} = createTemplateSlice.actions;

export default createTemplateSlice.reducer;
