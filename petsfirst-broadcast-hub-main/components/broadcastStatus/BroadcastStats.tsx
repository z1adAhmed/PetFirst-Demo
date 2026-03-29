import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import Pagination from "../ui/Pagination";
import type { BroadcastAnalyticsRow, BroadcastAnalyticsResponse } from "./types";
import BroadcastStatsHeader from "./BroadcastStatsHeader";
import BroadcastStatsEmpty from "./BroadcastStatsEmpty";
import BroadcastStatsLoading from "./BroadcastStatsLoading";
import BroadcastStatsCard from "./BroadcastStatsCard";
import BroadcastStatsTable from "./BroadcastStatsTable";

const DEFAULT_PAGE_SIZE = 10;

const BroadcastStats: React.FC = () => {
  const [rows, setRows] = useState<BroadcastAnalyticsRow[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    pageCount: 1,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const hasData = rows.length > 0;

  const currentPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1,
  );

  const fetchAnalytics = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          API_ENDPOINTS.STRAPI.GET_BROADCAST_ANALYTICS(page, pagination.pageSize),
        );
        const json = await response.json();
        const payload = json as BroadcastAnalyticsResponse;
        const data = Array.isArray(payload?.data) ? payload.data : [];
        const pag = payload?.pagination;
        setRows(data);
        if (pag) {
          setPagination({
            page: pag.page ?? page,
            pageSize: pag.pageSize ?? pagination.pageSize,
            pageCount: pag.pageCount ?? 1,
            total: pag.total ?? 0,
          });
        } else {
          setPagination((prev) => ({
            ...prev,
            page,
            pageCount: 1,
            total: data.length,
          }));
        }
      } catch {
        setRows([]);
        setPagination((prev) => ({ ...prev, page, pageCount: 1, total: 0 }));
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.pageSize],
  );

  useEffect(() => {
    fetchAnalytics(currentPage);
  }, [currentPage]);

  const handlePrev = () => {
    if (pagination.page > 1) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(pagination.page - 1));
        return next;
      });
    }
  };

  const handleNext = () => {
    if (pagination.page < pagination.pageCount) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(pagination.page + 1));
        return next;
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-[32px] border border-slate-100 overflow-hidden">
      <BroadcastStatsHeader />

      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <BroadcastStatsLoading />
        ) : !hasData ? (
          <BroadcastStatsEmpty />
        ) : (
          <div>
            <div className="md:hidden space-y-3">
              {rows.map((row) => (
                <BroadcastStatsCard key={row.campaignId} row={row} />
              ))}
            </div>

            <div className="hidden md:block">
              <BroadcastStatsTable rows={rows} />
            </div>

            <div className="pt-4">
              <Pagination
                page={currentPage}
                pageCount={pagination.pageCount}
                total={pagination.total}
                pageSize={pagination.pageSize}
                onPrev={handlePrev}
                onNext={handleNext}
                onRefresh={() => fetchAnalytics(currentPage)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BroadcastStats;
export type { BroadcastAnalyticsRow } from "./types";
