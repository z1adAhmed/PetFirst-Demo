import React from 'react';
import { BroadcastHistory } from '../../types';

interface BroadcastTableProps {
  broadcasts: BroadcastHistory[];
  onRetarget?: (broadcast: BroadcastHistory) => void;
}

const BroadcastTable: React.FC<BroadcastTableProps> = ({
  broadcasts,
  onRetarget,
}) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      COMPLETED: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
    };
    return (
      <span
        className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
          statusClasses[status as keyof typeof statusClasses] ||
          'bg-slate-100 text-slate-600'
        }`}
      >
        {status}
      </span>
    );
  };

  const getProgressBar = (current: number, total: number) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00A89E] to-cyan-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-bold text-slate-600 min-w-[60px] text-right">
          {current} ({percentage.toFixed(0)}%)
        </span>
      </div>
    );
  };

  if (broadcasts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📭</span>
        </div>
        <h3 className="text-lg font-black text-slate-700 mb-2">
          No Broadcasts Yet
        </h3>
        <p className="text-slate-400 text-sm">
          Start your first broadcast to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                Recipients
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                Sent
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                Delivered
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                Read
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                Replied
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                Failed
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {broadcasts.map((broadcast) => (
              <tr
                key={broadcast.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">
                    {broadcast.name}
                  </div>
                  {broadcast.fileName && (
                    <div className="text-xs text-slate-400 mt-1">
                      {broadcast.fileName}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(broadcast.status)}
                </td>
                <td className="px-6 py-4">
                  <span className="font-black text-slate-800">
                    {broadcast.recipients}
                  </span>
                </td>
                <td className="px-6 py-4 min-w-[120px]">
                  {getProgressBar(broadcast.sent, broadcast.recipients)}
                </td>
                <td className="px-6 py-4 min-w-[120px]">
                  {getProgressBar(broadcast.delivered, broadcast.recipients)}
                </td>
                <td className="px-6 py-4 min-w-[120px]">
                  {getProgressBar(broadcast.read, broadcast.recipients)}
                </td>
                <td className="px-6 py-4 min-w-[120px]">
                  {getProgressBar(broadcast.replied, broadcast.recipients)}
                </td>
                <td className="px-6 py-4 min-w-[120px]">
                  {getProgressBar(broadcast.failed, broadcast.recipients)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00A89E] to-cyan-500 flex items-center justify-center text-white text-xs font-black">
                      {broadcast.createdBy.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {broadcast.createdBy}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatDate(broadcast.createdAt)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {onRetarget && (
                      <button
                        onClick={() => onRetarget(broadcast)}
                        className="px-3 py-1.5 bg-[#00A89E] hover:bg-[#00c4b8] text-white text-xs font-black rounded-lg transition-colors"
                      >
                        Retarget
                      </button>
                    )}
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      <span className="text-slate-400">⋯</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BroadcastTable;
