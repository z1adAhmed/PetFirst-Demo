import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createBroadcastHistory,
  saveBroadcastHistory,
  updateBroadcastStatus,
} from "../../services/broadcastHistory";
import {
  BroadcastResult,
  BroadcastStatus,
  Contact,
  MetaConfig,
} from "../../types";
import { RootState } from "../index";
import {
  setCurrentBroadcastId,
  setIsBroadcasting,
  setIsTestBroadcasting,
  setResults,
  addResult,
} from "../slices/broadcastSlice";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import { buildWhatsAppPayload } from "../../utils/payloadBuilder";

interface SendMessageParams {
  contact: Contact;
  config: MetaConfig;
}

/**
 * Sends a WhatsApp message using Meta API
 */
const sendWhatsAppMessage = async (
  contact: Contact,
  config: MetaConfig,
): Promise<BroadcastResult> => {
  // Build payload using utility functions
  const body = buildWhatsAppPayload(contact, config, config.template || null);

  // Send to Meta API
  const apiVersion = import.meta.env.VITE_META_API_VERSION || "v22.0";
  const actualUrl = API_ENDPOINTS.META.SEND_MESSAGE(
    apiVersion,
    config.phoneNumberId,
  );

  try {
    const response = await fetch(actualUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const apiError = data?.error;
      const errorMessage =
        apiError?.error_data?.details ||
        apiError?.error_user_msg ||
        apiError?.message ||
        "Meta API Error";
      return {
        contact,
        status: BroadcastStatus.FAILED,
        error: errorMessage,
      };
    }

    return {
      contact,
      status: BroadcastStatus.SUCCESS,
      messageId: data.messages[0].id,
    };
  } catch (error: any) {
    return {
      contact,
      status: BroadcastStatus.FAILED,
      error: error.message || "Check your internet connection",
    };
  }
};

export const sendMessage = createAsyncThunk<
  BroadcastResult,
  SendMessageParams,
  { rejectValue: string }
>("broadcast/sendMessage", async (params, { rejectWithValue }) => {
  try {
    const result = await sendWhatsAppMessage(params.contact, params.config);
    return { ...result, timestamp: new Date().toISOString() };
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to send message");
  }
});

/** Params for two-step broadcast: create campaign then upload recipients. */
export interface UploadBroadcastAnalyticParams {
  file: File;
  template: Record<string, unknown>;
  campaignName: string;
  templateName: string;
  usersCount: number;
  /** Optional. When set (12–24), sent as top-level firstRetryInHours in BROADCAST_CAMPAIGN_CREATE only. Omit when retry disabled. */
  firstRetryInHours?: number;
  /** Optional. When retry enabled, how many times to retry (1–3). Sent as retryCount in create body. */
  retryCount?: number;
}

/** Step 1: Create broadcast campaign. Step 2: Upload file with campaign id. */
export const uploadBroadcastAnalytic = createAsyncThunk<
  { ok: boolean; message?: string; campaignId?: string | number },
  UploadBroadcastAnalyticParams,
  { rejectValue: string }
>("broadcast/uploadBroadcastAnalytic", async (params, { rejectWithValue }) => {
  const scheduledAt = new Date().toISOString();

  const createBody: Record<string, unknown> = {
    campaignName: params.campaignName,
    templateName: params.templateName,
    usersCount: params.usersCount,
    scheduledAt,
    template: params.template,
  };
  if (params.firstRetryInHours != null) {
    createBody.firstRetryInHours = params.firstRetryInHours;
  }
  if (params.retryCount != null) {
    createBody.tries = params.retryCount;
  }

  const createUrl = API_ENDPOINTS.STRAPI.BROADCAST_CAMPAIGN_CREATE();
  const createResponse = await fetch(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createBody),
  });

  const createText = await createResponse.text();
  let createData: Record<string, unknown> = {};
  try {
    if (createText) createData = JSON.parse(createText);
  } catch {
    // ignore
  }

  if (!createResponse.ok) {
    const message =
      (createData?.error as any)?.message ||
      (createData?.message as string) ||
      createText ||
      `Create campaign failed (${createResponse.status})`;
    return rejectWithValue(
      typeof message === "string" ? message : "Create campaign failed",
    );
  }

  const campaignId =
    (createData?.data as any)?.id ??
    (createData?.data as any)?.documentId ??
    (createData?.id as string | number) ??
    (createData?.documentId as string | number);
  if (campaignId == null) {
    return rejectWithValue(
      "Campaign was created but no id returned from the server.",
    );
  }

  const formData = new FormData();
  formData.append("broadcastFile", params.file, params.file.name);
  formData.append("broadcastCampaign", String(campaignId));

  const uploadUrl = API_ENDPOINTS.STRAPI.BROADCAST_RECIPIENT_UPLOAD();
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const uploadText = await uploadResponse.text();
  let uploadData: Record<string, unknown> = {};
  try {
    if (uploadText) uploadData = JSON.parse(uploadText);
  } catch {
    // ignore
  }

  if (!uploadResponse.ok) {
    const message =
      (uploadData?.error as any)?.message ||
      (uploadData?.message as string) ||
      uploadText ||
      `Recipient upload failed (${uploadResponse.status})`;
    return rejectWithValue(
      typeof message === "string" ? message : "Recipient upload failed",
    );
  }

  return {
    ok: true,
    message: (uploadData?.message as string) || undefined,
    campaignId,
  };
});

interface ExecuteBroadcastParams {
  delay?: number;
}

type FailureReasonSummary = Array<{ reason: string; count: number }>;
type FailedSample = { name: string; phone: string; error: string };

const normalizeErrorReason = (error?: string) => {
  const trimmed = (error || "").trim();
  return trimmed.length > 0 ? trimmed : "Unknown error";
};

const buildFailureSummary = (
  results: BroadcastResult[],
  maxSamples: number,
) => {
  const reasonCounts = new Map<string, number>();
  const samples: FailedSample[] = [];

  for (const r of results) {
    if (r.status !== BroadcastStatus.FAILED) continue;
    const reason = normalizeErrorReason(r.error);
    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    if (samples.length < maxSamples) {
      samples.push({
        name: r.contact?.name || "",
        phone: r.contact?.phone || "",
        error: reason,
      });
    }
  }

  const failureReasons: FailureReasonSummary = Array.from(
    reasonCounts.entries(),
  )
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));

  return { failureReasons, failedSamples: samples };
};

export const executeBroadcast = createAsyncThunk<
  {
    successCount: number;
    failedCount: number;
    total: number;
    failureReasons: FailureReasonSummary;
    failedSamples: FailedSample[];
  },
  ExecuteBroadcastParams,
  { state: RootState; rejectValue: string }
>(
  "broadcast/executeBroadcast",
  async (params, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const { csvData, isBroadcasting, isTestBroadcasting } = state.broadcast;
    const { config, selectedTemplate } = state.config;

    if (isBroadcasting || isTestBroadcasting) {
      return rejectWithValue("Broadcast already in progress");
    }

    if (!csvData || csvData.rows.length === 0) {
      return rejectWithValue("No CSV data available");
    }

    if (!config.templateName) {
      return rejectWithValue("No template selected");
    }

    const fileName = csvData.fileName || "uploaded_file.csv";
    const broadcastName = csvData.fileName
      ? csvData.fileName.replace(/\.[^/.]+$/, "")
      : `Broadcast - ${config.templateName}`;

    const broadcast = createBroadcastHistory(
      broadcastName,
      fileName,
      config.templateName,
      csvData.rows.length,
    );
    const broadcastId = broadcast.id;
    saveBroadcastHistory(broadcast);
    updateBroadcastStatus(broadcastId, { status: "IN_PROGRESS" });

    dispatch(setCurrentBroadcastId(broadcastId));
    dispatch(setIsBroadcasting(true));
    dispatch(setResults([]));

    const total = csvData.rows.length;
    const broadcastResults: BroadcastResult[] = [];
    const delay = params.delay || 3000;

    for (let i = 0; i < total; i++) {
      const contact = csvData.rows[i];

      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const result = await sendWhatsAppMessage(contact, {
        ...config,
        template: selectedTemplate,
      });

      const resultWithTimestamp = {
        ...result,
        timestamp: new Date().toISOString(),
      };
      broadcastResults.push(resultWithTimestamp);
      dispatch(addResult(resultWithTimestamp));

      if (broadcastId) {
        const successCount = broadcastResults.filter(
          (r) => r.status === BroadcastStatus.SUCCESS,
        ).length;
        const failedCount = broadcastResults.filter(
          (r) => r.status === BroadcastStatus.FAILED,
        ).length;
        updateBroadcastStatus(broadcastId, {
          sent: successCount + failedCount,
          delivered: successCount,
          failed: failedCount,
        });
      }
    }

    dispatch(setIsBroadcasting(false));

    const successCount = broadcastResults.filter(
      (r) => r.status === BroadcastStatus.SUCCESS,
    ).length;
    const failedCount = broadcastResults.filter(
      (r) => r.status === BroadcastStatus.FAILED,
    ).length;

    if (broadcastId) {
      updateBroadcastStatus(broadcastId, {
        status: failedCount === total ? "FAILED" : "COMPLETED",
        sent: successCount + failedCount,
        delivered: successCount,
        failed: failedCount,
      });
    }

    const { failureReasons, failedSamples } = buildFailureSummary(
      broadcastResults,
      5,
    );
    return { successCount, failedCount, total, failureReasons, failedSamples };
  },
);

interface TestBroadcastParams {
  numbers: string[];
}

export const executeTestBroadcast = createAsyncThunk<
  {
    successCount: number;
    failedCount: number;
    total: number;
    failureReasons: FailureReasonSummary;
    failedSamples: FailedSample[];
  },
  TestBroadcastParams,
  { state: RootState; rejectValue: string }
>(
  "broadcast/executeTestBroadcast",
  async (params, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const { config, selectedTemplate } = state.config;
    const { isBroadcasting, isTestBroadcasting } = state.broadcast;

    if (isBroadcasting || isTestBroadcasting) {
      return rejectWithValue("Broadcast already in progress");
    }

    if (!params.numbers.length) {
      return rejectWithValue("No phone numbers provided");
    }

    if (!selectedTemplate) {
      return rejectWithValue("No template selected");
    }

    dispatch(setIsTestBroadcasting(true));

    const testResults: BroadcastResult[] = [];
    const delay = 3000;

    for (let i = 0; i < params.numbers.length; i++) {
      const phone = params.numbers[i];
      const contact = { name: "", phone };

      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const result = await sendWhatsAppMessage(contact, {
        ...config,
        template: selectedTemplate,
      });
      testResults.push(result);
    }

    dispatch(setIsTestBroadcasting(false));

    const successCount = testResults.filter(
      (r) => r.status === BroadcastStatus.SUCCESS,
    ).length;
    const failedCount = testResults.filter(
      (r) => r.status === BroadcastStatus.FAILED,
    ).length;

    const { failureReasons, failedSamples } = buildFailureSummary(
      testResults,
      5,
    );
    return {
      successCount,
      failedCount,
      total: params.numbers.length,
      failureReasons,
      failedSamples,
    };
  },
);
