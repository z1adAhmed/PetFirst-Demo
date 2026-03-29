import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
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
} from '../store/slices/createTemplateSlice';
import type {
  TemplateDraft,
  TemplateDraftButton,
  TemplateHeaderFormat,
  CarouselCardDraft,
  CarouselHeaderFormat,
  CarouselCardButtonType,
} from '../types';

export function useTemplateDraft() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.createTemplate);

  return {
    draft,
    submitStatus: draft.submitStatus,
    submitError: draft.submitError,
    setName: useCallback((v: string) => dispatch(setName(v)), [dispatch]),
    setCategory: useCallback((v: string) => dispatch(setCategory(v)), [dispatch]),
    setChannelName: useCallback((v: string) => dispatch(setChannelName(v)), [dispatch]),
    setLanguage: useCallback((v: string) => dispatch(setLanguage(v)), [dispatch]),
    setHeaderType: useCallback((v: TemplateHeaderFormat) => dispatch(setHeaderType(v)), [dispatch]),
    setHeaderText: useCallback((v: string) => dispatch(setHeaderText(v)), [dispatch]),
    setHeaderMediaUrl: useCallback((v: string | undefined) => dispatch(setHeaderMediaUrl(v)), [dispatch]),
    setLocationName: useCallback((v: string) => dispatch(setLocationName(v)), [dispatch]),
    setLocationAddress: useCallback((v: string) => dispatch(setLocationAddress(v)), [dispatch]),
    setBody: useCallback((v: string) => dispatch(setBody(v)), [dispatch]),
    setBodyVariableSample: useCallback(
      (varName: string, sample: string) => dispatch(setBodyVariableSample({ varName, sample })),
      [dispatch],
    ),
    setFooter: useCallback((v: string) => dispatch(setFooter(v)), [dispatch]),
    setButtons: useCallback((v: TemplateDraftButton[]) => dispatch(setButtons(v)), [dispatch]),
    setCarouselFormat: useCallback(
      (v: {
        headerFormat?: CarouselHeaderFormat;
        hasCardBody?: boolean;
        button1Type?: CarouselCardButtonType | '';
        button2Type?: CarouselCardButtonType | '';
      }) => dispatch(setCarouselFormat(v)),
      [dispatch],
    ),
    setCarouselCards: useCallback((v: CarouselCardDraft[]) => dispatch(setCarouselCards(v)), [dispatch]),
    addCarouselCard: useCallback((c: CarouselCardDraft) => dispatch(addCarouselCard(c)), [dispatch]),
    updateCarouselCard: useCallback(
      (id: string, patch: Partial<CarouselCardDraft>) => dispatch(updateCarouselCard({ id, patch })),
      [dispatch],
    ),
    removeCarouselCard: useCallback((id: string) => dispatch(removeCarouselCard(id)), [dispatch]),
    setDraft: useCallback((v: Partial<TemplateDraft>) => dispatch(setDraft(v)), [dispatch]),
    addButton: useCallback((b: TemplateDraftButton) => dispatch(addButton(b)), [dispatch]),
    updateButton: useCallback((index: number, button: Partial<TemplateDraftButton>) => dispatch(updateButton({ index, button })), [dispatch]),
    removeButton: useCallback((index: number) => dispatch(removeButton(index)), [dispatch]),
    resetDraft: useCallback(() => dispatch(resetDraft()), [dispatch]),
  };
}
