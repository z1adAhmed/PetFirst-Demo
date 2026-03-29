/**
 * Sheet/upload validation: required columns (headers) and per-row missing data
 * for Name, Phone, and all template variables (required + additional).
 */

/** Map template variable to sheet column name: 1→name, 2→phone. */
export function templateVarToSheetColumn(v: string): string {
  const key = v.toLowerCase();
  if (key === "1") return "name";
  if (key === "2") return "phone";
  return key;
}

/** List of variable names missing from sheet headers (mediaUrl excluded). */
export function getMissingTemplateColumns(
  sheetHeaders: string[],
  templateVariablesInOrder: string[],
): string[] {
  const headerSet = new Set(sheetHeaders.map((h) => h.toLowerCase()));
  return templateVariablesInOrder.filter((v) => {
    const key = v.toLowerCase();
    if (key === "mediaurl") return false;
    const sheetCol = templateVarToSheetColumn(v);
    return !headerSet.has(sheetCol);
  });
}

/** Required column names for display/validation: Name, Phone, then all template vars (deduped). */
export function getRequiredColumnsDisplayOrder(
  templateVariablesInOrder: string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (col: string) => {
    const key = col.toLowerCase();
    if (key === "mediaurl" || seen.has(key)) return;
    seen.add(key);
    out.push(col === "1" ? "name" : col === "2" ? "phone" : col);
  };
  add("name");
  add("phone");
  templateVariablesInOrder.forEach((v) => add(templateVarToSheetColumn(v)));
  return out;
}

export type RowMissingError = { rowNumber: number; missingColumns: string[] };

/** Get value from row by column name (case-insensitive key match). */
function getRowValue(row: Record<string, string>, col: string): string {
  const key = Object.keys(row).find((k) => k.toLowerCase() === col.toLowerCase());
  const val = key ? (row[key] ?? "").toString().trim() : "";
  return val;
}

/**
 * Check every row for missing data in required columns and all template variable columns.
 * (Name, Phone, and every additional variable from the template.)
 * Row numbers are 1-based in the sheet (row 1 = header, first data row = 2).
 * Uses case-insensitive column lookup so all columns are checked reliably.
 */
export function getRowsWithMissingData(
  rows: Array<Record<string, string>>,
  requiredColumns: string[],
): RowMissingError[] {
  const toCheck = requiredColumns.filter((c) => c.toLowerCase() !== "mediaurl");
  const errors: RowMissingError[] = [];
  rows.forEach((row, index) => {
    const missing: string[] = [];
    toCheck.forEach((col) => {
      const val = getRowValue(row, col);
      if (!val) missing.push(col.charAt(0).toUpperCase() + col.slice(1));
    });
    if (missing.length > 0) {
      errors.push({ rowNumber: index + 2, missingColumns: missing });
    }
  });
  return errors;
}

/** Sample value for a column (for display in required-columns table). */
export function sampleValueForColumn(col: string): string {
  const k = col.toLowerCase();
  if (k === "name") return "Ali Raza";
  if (k === "phone") return "+923077534255";
  if (k === "email") return "ali@example.com";
  return col;
}

export type SheetValidationResult =
  | { ok: true; headers: string[]; rows: Array<Record<string, string>> }
  | {
      ok: false;
      error: "column_name_mismatch";
      mismatches: Array<{ expected: string; found: string }>;
      requiredOrder: string[];
    }
  | {
      ok: false;
      error: "missing_columns";
      missing: string[];
      requiredOrder: string[];
    }
  | {
      ok: false;
      error: "rows_missing_data";
      rowErrors: RowMissingError[];
    };

export type SheetValidationFailure = Exclude<SheetValidationResult, { ok: true }>;

export function isSheetValidationFailure(
  r: SheetValidationResult,
): r is SheetValidationFailure {
  return !r.ok;
}

/**
 * Run full validation: required columns present, then no missing data in any row
 * for Name, Phone, or any template variable column.
 */
export function validateUploadedSheet(
  headers: string[],
  rows: Array<Record<string, string>>,
  templateVariablesInOrder: string[],
): SheetValidationResult {
  const requiredOrder = getRequiredColumnsDisplayOrder(templateVariablesInOrder);
  const expectedColumns = requiredOrder.filter(
    (col) => col.toLowerCase() !== "mediaurl",
  );

  const headerSetExact = new Set(headers);
  const headerMapLowerToActual = new Map<string, string>();
  headers.forEach((h) => {
    const k = h.toLowerCase();
    if (!headerMapLowerToActual.has(k)) headerMapLowerToActual.set(k, h);
  });

  const mismatches: Array<{ expected: string; found: string }> = [];
  const missing: string[] = [];
  expectedColumns.forEach((expected) => {
    if (headerSetExact.has(expected)) return;
    const foundWithDifferentCase = headerMapLowerToActual.get(
      expected.toLowerCase(),
    );
    if (foundWithDifferentCase) {
      mismatches.push({ expected, found: foundWithDifferentCase });
      return;
    }
    missing.push(expected);
  });

  if (mismatches.length > 0) {
    return {
      ok: false,
      error: "column_name_mismatch",
      mismatches,
      requiredOrder,
    };
  }

  if (missing.length > 0) {
    return {
      ok: false,
      error: "missing_columns",
      missing,
      requiredOrder,
    };
  }

  const requiredColumns = requiredOrder.filter((col) =>
    headerSetExact.has(col),
  );
  const rowErrors = getRowsWithMissingData(rows, requiredColumns);
  if (rowErrors.length > 0) {
    return { ok: false, error: "rows_missing_data", rowErrors };
  }

  return { ok: true, headers, rows };
}
