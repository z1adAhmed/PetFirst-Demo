import React from "react";
import type { RowMissingError } from "@/utils/sheetValidation";
import { sampleValueForColumn } from "@/utils/sheetValidation";

const TABLE_MAX_HEIGHT = "280px";

export type MissingColumnsError = {
  type: "missing_columns";
  missing: string[];
  requiredOrder: string[];
};

export type ColumnNameMismatchError = {
  type: "column_name_mismatch";
  mismatches: Array<{ expected: string; found: string }>;
  requiredOrder: string[];
};

export type RowsMissingDataError = {
  type: "rows_missing_data";
  rowErrors: RowMissingError[];
};

export type SheetValidationError =
  | MissingColumnsError
  | ColumnNameMismatchError
  | RowsMissingDataError;

interface SheetValidationErrorViewProps {
  error: SheetValidationError;
  /** Optional custom sample value fn; defaults to sheetValidation.sampleValueForColumn */
  sampleValueForColumn?: (col: string) => string;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Reusable view for sheet validation errors: missing columns or rows with missing data.
 * Renders errors in a table view with scroll when there are many records, and shows total count.
 */
const SheetValidationErrorView: React.FC<SheetValidationErrorViewProps> = ({
  error,
  sampleValueForColumn: sampleFn = sampleValueForColumn,
}) => {
  if (error.type === "column_name_mismatch") {
    const { mismatches, requiredOrder } = error;
    const count = mismatches.length;
    const countLabel = count === 1 ? "1 column name mismatch" : `${count} column name mismatches`;

    return (
      <>
        <p className="text-sm font-medium text-slate-700 leading-relaxed">
          Your sheet column names must exactly match template variable names (case-sensitive).
          Please rename the following columns and upload again.
        </p>
        <p className="text-xs font-bold text-rose-800 mt-2 mb-1">
          Mismatched columns ({countLabel}):
        </p>
        <div className="rounded-xl border border-rose-200 bg-rose-50 overflow-hidden mb-3">
          <div
            className="overflow-auto scrollbar-thin"
            style={{ maxHeight: TABLE_MAX_HEIGHT }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-rose-100">
                  <th className="px-3 py-2 text-xs font-black text-rose-800 border-b border-rose-200 whitespace-nowrap">
                    Current in Sheet
                  </th>
                  <th className="px-3 py-2 text-xs font-black text-rose-800 border-b border-rose-200 whitespace-nowrap">
                    Rename To
                  </th>
                </tr>
              </thead>
              <tbody>
                {mismatches.map((row, i) => (
                  <tr key={i} className="border-b border-rose-100 last:border-0">
                    <td className="px-3 py-2 text-sm font-semibold text-rose-700">
                      {row.found}
                    </td>
                    <td className="px-3 py-2 text-sm font-semibold text-rose-700">
                      {row.expected}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-600 mb-1.5">
          Your sheet should use these exact column names:
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div
            className="overflow-auto scrollbar-thin"
            style={{ maxHeight: TABLE_MAX_HEIGHT }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {requiredOrder.map((col, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-xs font-black text-slate-700 border-b border-slate-200 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {requiredOrder.map((col, i) => (
                    <td
                      key={i}
                      className="px-3 py-2 text-xs text-slate-600 border-b border-slate-100"
                    >
                      {sampleFn(col)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  if (error.type === "missing_columns") {
    const { missing, requiredOrder } = error;
    const count = missing.length;
    const countLabel = count === 1 ? "1 missing column" : `${count} missing columns`;

    return (
      <>
        <p className="text-sm font-medium text-slate-700 leading-relaxed">
          The following columns are required by the selected template but are
          missing from your sheet. Add these columns and upload again.
        </p>
        <p className="text-xs font-bold text-rose-800 mt-2 mb-1">
          Missing columns ({countLabel}):
        </p>
        <div className="rounded-xl border border-rose-200 bg-rose-50 overflow-hidden mb-3">
          <div
            className="overflow-auto scrollbar-thin"
            style={{ maxHeight: TABLE_MAX_HEIGHT }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-rose-100">
                  <th className="px-3 py-2 text-xs font-black text-rose-800 border-b border-rose-200 whitespace-nowrap">
                    Column
                  </th>
                  <th className="px-3 py-2 text-xs font-black text-rose-800 border-b border-rose-200 whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {missing.map((col, i) => (
                  <tr key={i} className="border-b border-rose-100 last:border-0">
                    <td className="px-3 py-2 text-sm font-semibold text-rose-700">
                      {cap(col)}
                    </td>
                    <td className="px-3 py-2 text-xs text-rose-600">Missing</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-600 mb-1.5">
          Your sheet should look like this (columns in order):
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div
            className="overflow-auto scrollbar-thin"
            style={{ maxHeight: TABLE_MAX_HEIGHT }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {requiredOrder.map((col, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-xs font-black text-slate-700 border-b border-slate-200 whitespace-nowrap"
                    >
                      {cap(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {requiredOrder.map((col, i) => (
                    <td
                      key={i}
                      className="px-3 py-2 text-xs text-slate-600 border-b border-slate-100"
                    >
                      {sampleFn(col)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  const { rowErrors } = error;
  const count = rowErrors.length;
  const totalMissingCells = rowErrors.reduce(
    (sum, err) => sum + err.missingColumns.length,
    0,
  );
  const countLabel =
    count === 1
      ? "1 row with missing data"
      : `${count} rows with missing data`;
  const totalLabel =
    totalMissingCells === 1
      ? "1 missing value in total"
      : `${totalMissingCells} missing values in total`;

  return (
    <>
      <p className="text-sm font-medium text-slate-700 leading-relaxed">
        The following rows have missing data. Please fill in Name, Phone, and
        any other template variable columns for each row and upload again.
      </p>
      <p className="text-xs font-bold text-rose-800 mt-2 mb-1.5">
        {countLabel} ({totalLabel})
      </p>
      <div className="rounded-xl border border-rose-200 bg-rose-50 overflow-hidden">
        <div
          className="overflow-auto scrollbar-thin"
          style={{ maxHeight: TABLE_MAX_HEIGHT }}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-rose-100">
                <th className="px-3 py-2 text-xs font-black text-rose-800 border-b border-rose-200 whitespace-nowrap">
                  Row #
                </th>
                <th className="px-3 py-2 text-xs font-black text-rose-800 border-b border-rose-200">
                  Missing columns
                </th>
              </tr>
            </thead>
            <tbody>
              {rowErrors.map((err, i) => (
                <tr key={i} className="border-b border-rose-100 last:border-0">
                  <td className="px-3 py-2 text-sm font-semibold text-rose-700 whitespace-nowrap">
                    Row {err.rowNumber}
                  </td>
                  <td className="px-3 py-2 text-sm text-rose-700">
                    {err.missingColumns.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default SheetValidationErrorView;
