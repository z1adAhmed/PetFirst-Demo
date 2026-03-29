import React from "react";

type TemplateSubmissionModalVariant = "creating" | "success";

interface TemplateSubmissionModalProps {
  isOpen: boolean;
  variant: TemplateSubmissionModalVariant;
  onPrimaryAction?: () => void;
  primaryLabel?: string;
}

const TransferAnimation: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-5 py-2">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shadow-sm">
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-blue-600" fill="none">
          <path
            d="M6 8.5L12 5l6 3.5M6 8.5v7L12 19l6-3.5v-7M6 8.5L12 12l6-3.5M12 12v7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="relative w-28 h-8 flex items-center justify-center">
        <div className="w-full border-t-2 border-dashed border-slate-300" />
        <span className="absolute moving-dot w-2.5 h-2.5 rounded-full bg-[#00A89E]" />
      </div>

      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-sm">
        f
      </div>
    </div>
  );
};

const SuccessIcon: React.FC = () => (
  <div className="mx-auto w-16 h-16 rounded-full border-[3px] border-blue-500 flex items-center justify-center">
    <svg
      viewBox="0 0 24 24"
      className="w-8 h-8 text-blue-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  </div>
);

const TemplateSubmissionModal: React.FC<TemplateSubmissionModalProps> = ({
  isOpen,
  variant,
  onPrimaryAction,
  primaryLabel,
}) => {
  if (!isOpen) return null;

  const creating = variant === "creating";
  const title = creating ? "Creating template" : "Submitted Successfully";
  const description = creating
    ? "Please wait, we are creating the WhatsApp template for you."
    : "Template submitted for approval. Facebook (Meta) may take up to 24 hours to approve the template.";
  const cta = primaryLabel || (creating ? "Loading..." : "Move to Templates");

  return (
    <>
      <style>{`
        @keyframes modalFadeInLocal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPopLocal {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes moveDot {
          0% { transform: translateX(-48px); opacity: 0.25; }
          25% { opacity: 1; }
          100% { transform: translateX(48px); opacity: 0.25; }
        }
        .template-submit-backdrop { animation: modalFadeInLocal .2s ease-out; }
        .template-submit-card { animation: modalPopLocal .25s ease-out; }
        .moving-dot { animation: moveDot 1.2s ease-in-out infinite; }
      `}</style>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 template-submit-backdrop"
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
        <div className="relative w-full max-w-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 template-submit-card">
          <div className="px-7 pt-6 pb-4 border-b border-slate-100">
            <h3 className="text-2xl font-black text-slate-800">{title}</h3>
          </div>
          <div className="px-7 py-6 text-center space-y-5">
            {creating ? <TransferAnimation /> : <SuccessIcon />}
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {description}
            </p>
          </div>
          <div className="px-7 pb-6 flex justify-end">
            <button
              type="button"
              onClick={onPrimaryAction}
              disabled={creating}
              className={`px-5 py-2 rounded-lg text-sm font-bold ${
                creating
                  ? "bg-[#8bcfc9] text-white cursor-wait"
                  : "bg-[#00A89E] text-white hover:bg-[#00c4b8]"
              }`}
            >
              {cta}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateSubmissionModal;

