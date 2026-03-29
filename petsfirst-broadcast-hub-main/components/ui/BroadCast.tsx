import React from "react";
import StatusIndicator from "../../components/BroadcastStatus";
import Loader from "./Loader";
import { CSVData, BroadcastResult } from "../../types";

interface BroadCastProps {
  csvData: CSVData | null;
  results: BroadcastResult[];
  isBroadcasting: boolean;
  onStartBroadcast: () => void;
}

const BroadCast: React.FC<BroadCastProps> = ({
  csvData,
  results,
  isBroadcasting,
  onStartBroadcast,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <div className="lg:col-span-4 space-y-8">
        <div className="flex items-center justify-between mb-4 lg:mb-0">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">
            Control Center
          </h3>
        </div>

        <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00A89E] opacity-10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000" />

          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-4 leading-tight">
              Launch <br />
              The <span className="text-[#00A89E]">Campaign</span>
            </h3>
            <p className="text-slate-400 text-sm mb-10 font-medium leading-relaxed">
              Ready to reach your pet owners? Ensure your template matches the
              placeholders shown in the preview.
            </p>

            <button
              disabled={isBroadcasting || !csvData}
              onClick={onStartBroadcast}
              className={`relative w-full py-6 rounded-3xl font-black text-xl transition-all flex items-center justify-center gap-3 ${
                isBroadcasting || !csvData
                  ? "bg-slate-800 cursor-not-allowed text-slate-600"
                  : "bg-[#00A89E] text-white hover:bg-[#00c4b8] hover:scale-[1.02] shadow-[0_20px_40px_-15px_rgba(0,168,158,0.4)] active:scale-[0.98]"
              }`}
            >
              {isBroadcasting ? (
                <>
                  <Loader size="md" className="text-white" ariaLabel="Sending" />
                  <span>In progress...</span>
                </>
              ) : (
                <span>Send Broadcast →</span>
              )}
            </button>
          </div>
        </div>

        <StatusIndicator
          results={results}
          total={csvData?.rows.length || 0}
          isBroadcasting={isBroadcasting}
        />
      </div>
    </div>
  );
};

export default BroadCast;
