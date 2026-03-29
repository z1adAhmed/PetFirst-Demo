import { createAsyncThunk } from '@reduxjs/toolkit';
import { AnalyticsResponse, AnalyticsConfig } from '../../types';
import { API_ENDPOINTS } from '../../utils/apiEndpoints';

export const fetchWhatsAppAnalytics = createAsyncThunk<
  AnalyticsResponse | null,
  AnalyticsConfig,
  { rejectValue: string }
>('analytics/fetchWhatsAppAnalytics', async (config, { rejectWithValue }) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const startTimestamp = config.startTimestamp || now - 7 * 24 * 60 * 60;
    const endTimestamp = config.endTimestamp || now;

    const apiVersion = 'v22.0'; // Default API version for analytics
    const url = API_ENDPOINTS.META.GET_ANALYTICS(
      apiVersion,
      config.wabaId,
      startTimestamp,
      endTimestamp,
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(
        data.error?.message ||
        data.error?.error_user_msg ||
        'Failed to fetch analytics',
      );
    }

    return data;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Network error. Check your connection.');
  }
});
