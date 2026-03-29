/**
 * Extracts the filename from a file path and formats it for display
 * Removes the /uploads/ prefix and file extension, truncates to 50 characters max
 *
 * @param filePath - The full file path (e.g., "/uploads/Felis_silvestris_silvestris_small_gradual_decrease_of_quality_26b04638d8.png")
 * @returns The formatted filename (e.g., "Felis_silvestris_silvestris_small_gradual_decrease_of_quality_26b04638d8")
 */
export const formatFileName = (filePath: string | null | undefined): string => {
  if (!filePath) return "";

  // Remove /uploads/ prefix if present
  let fileName = filePath.replace(/^\/uploads\//, "");

  // Remove file extension (e.g., .png, .jpg, .jpeg, .gif, etc.)
  fileName = fileName.replace(/\.[^/.]+$/, "");

  // Truncate to 50 characters max, add ... if longer
  if (fileName.length > 40) {
    return fileName.substring(0, 40) + "...";
  }

  return fileName;
};

export const formatFailureDetails = (payload: any) => {
  const failedCount = Number(payload?.failedCount || 0);
  if (!failedCount) return "";

  const reasons = Array.isArray(payload?.failureReasons)
    ? payload.failureReasons
    : [];

  const reasonLines = reasons.slice(0, 5).map((r: any) => {
    const reason = String(r?.reason || "Unknown error");
    const count = Number(r?.count || 0);
    return `- ${count}× ${reason}`;
  });

  const lines: string[] = [];
  lines.push("");
  lines.push("Failure reasons:");
  if (reasonLines.length) lines.push(...reasonLines);
  if (reasons.length > 5) {
    lines.push("");
    lines.push("(Showing first 5 only)");
  }
  return lines.join("\n");
};
