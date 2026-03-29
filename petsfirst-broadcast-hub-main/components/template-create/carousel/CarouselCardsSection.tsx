import React, { useEffect, useMemo, useState } from "react";
import { TemplateFormField } from "../TemplateFormField";
import type { CarouselCardButtonType, CarouselCardDraft, CarouselHeaderFormat } from "../../../types";
import { CarouselCardModal } from "./CarouselCardModal";

interface CarouselCardsSectionProps {
  headerFormat: CarouselHeaderFormat;
  hasCardBody: boolean;
  buttonTypes: CarouselCardButtonType[];
  cards: CarouselCardDraft[];
  cardFiles: Record<string, File | null>;
  onAddCard: (card: CarouselCardDraft, file: File | null) => void;
  onUpdateCard: (id: string, patch: Partial<CarouselCardDraft>, file: File | null) => void;
  onRemoveCard: (id: string) => void;
}

const makeId = () => `card_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;

export const CarouselCardsSection: React.FC<CarouselCardsSectionProps> = ({
  headerFormat,
  hasCardBody,
  buttonTypes,
  cards,
  cardFiles,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
}) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState<CarouselCardDraft | null>(null);
  const [newDraftFile, setNewDraftFile] = useState<File | null>(null);
  const [addCardError, setAddCardError] = useState<string | null>(null);
  const editing = useMemo(() => cards.find((c) => c.id === openId) || null, [cards, openId]);
  const editingIndex = editing ? cards.findIndex((c) => c.id === editing.id) : -1;

  const hasAtLeastOneButtonType = buttonTypes.length >= 1;

  useEffect(() => {
    if (hasAtLeastOneButtonType && addCardError) setAddCardError(null);
  }, [hasAtLeastOneButtonType]);

  const openNew = () => {
    if (!hasAtLeastOneButtonType) {
      setAddCardError("Please select at least one button type in Carousel format above.");
      return;
    }
    setAddCardError(null);
    const id = makeId();
    const emptyButtons = buttonTypes.map((t) => ({ type: t, text: "" }));
    const card: CarouselCardDraft = {
      id,
      headerMediaUrl: undefined,
      bodyText: "",
      bodyVariableSamples: {},
      buttons: emptyButtons as any,
    };
    setNewDraft(card);
    setNewDraftFile(null);
  };

  return (
    <TemplateFormField
      label="Carousel cards"
      hint="Carousel templates support up to 10 carousel cards. Minimum 2 cards are required."
    >
      <div className="space-y-3 p-4 rounded-2xl border border-slate-200 bg-white">
        {cards.length === 0 ? (
          <p className="text-sm text-slate-500">No cards yet.</p>
        ) : (
          <div className="space-y-2">
            {cards.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-20 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {c.headerMediaUrl ? (
                      headerFormat === "VIDEO" ? (
                        <video
                          key={c.headerMediaUrl}
                          src={c.headerMediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={c.headerMediaUrl}
                          alt={`Card ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <span className="text-slate-400 text-xs font-bold">
                        No media
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-800 truncate">
                      {`Card ${idx + 1}`}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {(c.bodyText || "").trim()
                        ? (c.bodyText || "").trim()
                        : "No card body"}
                    </div>
                    <div className="pt-1 flex flex-wrap gap-1">
                      {(c.buttons || []).slice(0, 2).map((b, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-black text-slate-600"
                        >
                          {b.text?.trim() ? b.text.trim() : "Button"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(c.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-black bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveCard(c.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-black bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {addCardError && (
          <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" role="alert">
            {addCardError}
          </p>
        )}
        <button
          type="button"
          onClick={openNew}
          disabled={cards.length >= 10}
          className="w-full px-4 py-2.5 rounded-xl font-black text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span>
          Add carousel card
        </button>
      </div>

      {editing && (
        <CarouselCardModal
          isOpen={Boolean(openId)}
          index={editingIndex}
          headerFormat={headerFormat}
          hasCardBody={hasCardBody}
          buttonTypes={buttonTypes}
          card={editing}
          headerFile={cardFiles[editing.id] || null}
          onClose={() => setOpenId(null)}
          onSave={(patch, file) => {
            onUpdateCard(editing.id, patch, file);
            setOpenId(null);
          }}
        />
      )}

      {newDraft && (
        <CarouselCardModal
          isOpen={true}
          index={cards.length}
          headerFormat={headerFormat}
          hasCardBody={hasCardBody}
          buttonTypes={buttonTypes}
          card={newDraft}
          headerFile={newDraftFile}
          onClose={() => {
            // Simply discard draft when user closes modal
            setNewDraft(null);
            setNewDraftFile(null);
          }}
          onSave={(patch, file) => {
            const fullCard: CarouselCardDraft = { ...newDraft, ...patch };
            onAddCard(fullCard, file);
            setNewDraft(null);
            setNewDraftFile(null);
          }}
        />
      )}
    </TemplateFormField>
  );
};

