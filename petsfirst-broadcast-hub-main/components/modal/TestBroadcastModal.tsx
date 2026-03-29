import React, { useEffect, useState } from "react";
import PhoneNumberInput from "../ui/PhoneNumberInput";
import Loader from "../ui/Loader";

interface TestBroadcastModalProps {
  isOpen: boolean;
  isSending: boolean;
  onClose: () => void;
  onSend: (numbers: string[]) => Promise<void>;
  maxNumbers?: number;
}

const TestBroadcastModal: React.FC<TestBroadcastModalProps> = ({
  isOpen,
  isSending,
  onClose,
  onSend,
  maxNumbers = 10,
}) => {
  const [numbers, setNumbers] = useState<string[]>([""]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNumbers([""]);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateNumber = (index: number, value: string) => {
    setNumbers((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const addNumber = () => {
    if (numbers.length < maxNumbers) {
      setNumbers((prev) => [...prev, ""]);
    }
  };

  const removeNumber = (index: number) => {
    setNumbers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const cleaned = numbers.map((n) => n.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setError("Please add at least one phone number.");
      return;
    }
    setError("");
    await onSend(cleaned);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-800">
                Test Broadcast
              </h3>
              <p className="text-xs text-slate-400">
                Add up to {maxNumbers} numbers for testing
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {numbers.map((value, index) => (
            <div key={index} className="flex items-center gap-3">
              <PhoneNumberInput
                value={value}
                onChange={(val) => updateNumber(index, val)}
                placeholder="Phone number"
                className="flex-1 rounded-xl"
              />
              <button
                onClick={() => removeNumber(index)}
                disabled={numbers.length === 1}
                className="w-10 h-10 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Remove number"
              >
                ✕
              </button>
            </div>
          ))}

          {numbers.length < maxNumbers && (
            <button
              onClick={addNumber}
              className="text-sm font-black text-[#00A89E] hover:text-[#00c4b8]"
            >
              + Add new
            </button>
          )}

          {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className={`px-5 py-2.5 rounded-xl font-black text-white transition-colors flex items-center justify-center gap-2 ${
              isSending
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-[#00A89E] hover:bg-[#00c4b8]"
            }`}
          >
            {isSending ? (
              <>
                <Loader size="sm" className="text-white" ariaLabel="Sending" />
                <span>Sending...</span>
              </>
            ) : (
              "Send now"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestBroadcastModal;
