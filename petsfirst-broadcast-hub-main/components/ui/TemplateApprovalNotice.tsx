import React from "react";
import type { MessageTemplate } from "../../types";

interface TemplateApprovalNoticeProps {
  templates: MessageTemplate[];
}

const TemplateApprovalNotice: React.FC<TemplateApprovalNoticeProps> = ({
  templates,
}) => {
  const pending = templates.filter((t) => {
    const status = (t.status || "").toUpperCase();
    return status === "PENDING" || status === "IN_REVIEW";
  });

  if (pending.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-amber-700">ⓘ</div>
        <div className="min-w-0">
          <p className="text-sm font-black text-amber-900">
            Template approval in progress
          </p>

          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            One or more templates are currently being reviewed by WhatsApp
            (Meta). This review process is required before templates can be used
            for broadcasts or customer messages. Approval usually takes a few
            minutes but may take up to{" "}
            <span className="font-semibold">24 hours</span>.
          </p>

          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            You don’t need to take any action. Once approved, the template will
            automatically become available for sending messages.
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {pending.map((t) => (
              <span
                key={t.name}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-amber-200 text-amber-800"
              >
                {t.name} - {(t.status || "PENDING").toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateApprovalNotice;
