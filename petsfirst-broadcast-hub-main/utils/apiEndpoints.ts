/**
 * API Endpoints Configuration
 * Centralized location for all API routes used in the application.
 * Base URLs come from env helpers (see utils/env.ts).
 */

import { getMetaGraphApiBase, getStrapiBaseUrl } from "./env";

const STRAPI_BASE_URL = getStrapiBaseUrl("prod");
const META_GRAPH_API_BASE = getMetaGraphApiBase();

export const API_ENDPOINTS = {
  // Strapi API Endpoints
  STRAPI: {
    // Marketing/Template Selection
    GET_TEMPLATE_SELECTIONS: () =>
      `${STRAPI_BASE_URL}/api/marketings?populate=*`,
    POST_TEMPLATE_SELECTION: () => `${STRAPI_BASE_URL}/api/marketings`,
    PUT_TEMPLATE_SELECTION: (id: string | number) =>
      `${STRAPI_BASE_URL}/api/marketings/${id}`,
    /** Strapi 5: use documentId; Strapi v4: use id */
    DELETE_TEMPLATE_SELECTION: (id: string | number) =>
      `${STRAPI_BASE_URL}/api/marketings/${id}`,
    /** Find marketing entry by Meta templateId (to get documentId for delete). */
    GET_MARKETING_BY_TEMPLATE_ID: (templateId: string) =>
      `${STRAPI_BASE_URL}/api/marketings?filters[templateId][$eq]=${encodeURIComponent(templateId)}`,
    GET_MARKETING_STATS: (page: number = 1, pageSize: number = 10) =>
      `${STRAPI_BASE_URL}/api/marketing?page=${page}&pageSize=${pageSize}`,
    GET_MARKETING_BY_ID: (id: string | number) =>
      `${STRAPI_BASE_URL}/api/marketing/${id}`,

    /** Step 1: Create broadcast campaign. POST JSON: campaignName, templateName, usersCount, scheduledAt, template. Returns campaign with id. */
    BROADCAST_CAMPAIGN_CREATE: () =>
      `${STRAPI_BASE_URL}/api/broadcast-campaign/create`,
    /** Step 2: Upload recipients file for a campaign. POST formData: broadcastFile, broadcastCampaign (id from step 1). */
    BROADCAST_RECIPIENT_UPLOAD: () =>
      `${STRAPI_BASE_URL}/api/broadcast-recipient/upload`,

    /** Get broadcast campaign analytics with pagination. Returns { data, pagination }. */
    GET_BROADCAST_ANALYTICS: (page: number = 1, pageSize: number = 10) =>
      `${STRAPI_BASE_URL}/api/broadcast-campaign/analytics?page=${page}&pageSize=${pageSize}`,
    /** Get single broadcast campaign analytics by campaign id (includes users list). */
    GET_BROADCAST_ANALYTICS_BY_ID: (id: string | number) =>
      `${STRAPI_BASE_URL}/api/broadcast-campaign/${id}/analytics`,

    // File Upload
    UPLOAD_FILE: () => `${STRAPI_BASE_URL}/api/upload`,
    GET_UPLOADED_FILE: (imagePath: string) => {
      if (imagePath.startsWith("http")) return imagePath;
      if (imagePath.startsWith("/")) return `${STRAPI_BASE_URL}${imagePath}`;
      return `${STRAPI_BASE_URL}/uploads/${imagePath}`;
    },
  },

  // Meta/Facebook Graph API Endpoints
  META: {
    // Message Templates
    GET_MESSAGE_TEMPLATES: (
      apiVersion: string,
      wabaId: string,
      templateName?: string,
    ) => {
      let url = `${META_GRAPH_API_BASE}/${apiVersion}/${wabaId}/message_templates?fields=
    name,
    status,
    language,
    category,
    parameter_format,
    created_time,
    components{
      type,
      format,
      text,
      example,
      buttons{
        type,
        text,
        url,
        phone_number,
        flow_id,
        flow_action,
        navigate_screen
      },
      cards{
        components{
          type,
          format,
          text,
          example,
          buttons{
            type,
            text,
            url,
            phone_number,
            flow_id,
            flow_action,
            navigate_screen
          }
        }
      }
    }&limit=200`;

      if (templateName) {
        url += `&name=${encodeURIComponent(templateName)}`;
      }

      return url.replace(/\s+/g, "");
    },

    GET_TEMPLATE_DETAILS: (
      apiVersion: string,
      wabaId: string,
      templateName: string,
    ) =>
      `${META_GRAPH_API_BASE}/${apiVersion}/${wabaId}/message_templates?name=${encodeURIComponent(templateName)}&fields=name,status,language,category,parameter_format,created_time,components{type,format,text,buttons{type,text,url,phone_number,flow_id,flow_action,navigate_screen},example}`,

    /** Delete message template. DELETE with query param name (and optional hsm_id). */
    DELETE_MESSAGE_TEMPLATE: (
      apiVersion: string,
      wabaId: string,
      templateName: string,
      hsmId?: string,
    ) => {
      let url = `${META_GRAPH_API_BASE}/${apiVersion}/${wabaId}/message_templates?name=${encodeURIComponent(
        templateName,
      )}`;
      if (hsmId) {
        url += `&hsm_id=${encodeURIComponent(hsmId)}`;
      }
      return url;
    },

    /** Create message template (no media). POST with JSON body. */
    CREATE_MESSAGE_TEMPLATE: (apiVersion: string, wabaId: string) =>
      `${META_GRAPH_API_BASE}/${apiVersion}/${wabaId}/message_templates`,

    /** Step 1 Resumable Upload: get upload session. Use Facebook App ID (not WABA ID). POST with JSON { file_length, file_type, file_name }. */
    GET_UPLOAD_KEY: (apiVersion: string, appId: string) =>
      `${META_GRAPH_API_BASE}/${apiVersion}/${appId}/uploads`,

    /** Step 2 Resumable Upload: send file. POST to this URL (id from step 1) with file binary, header file_offset: 0. */
    UPLOAD_FILE_PART: () => `${STRAPI_BASE_URL}/api/marketing/upload-meta-file`,

    /** List flows for WABA (for Form/FLOW button in template). GET. */
    GET_FLOWS: (apiVersion: string, wabaId: string) =>
      `${META_GRAPH_API_BASE}/${apiVersion}/${wabaId}/flows?fields=id,name,status`,

    // Media Upload
    UPLOAD_MEDIA: (apiVersion: string, phoneNumberId: string) =>
      `${META_GRAPH_API_BASE}/${apiVersion}/${phoneNumberId}/media`,

    // Send Messages
    SEND_MESSAGE: (apiVersion: string, phoneNumberId: string) =>
      `${META_GRAPH_API_BASE}/${apiVersion}/${phoneNumberId}/messages`,

    // Analytics
    GET_ANALYTICS: (
      apiVersion: string,
      wabaId: string,
      startTimestamp: number,
      endTimestamp: number,
    ) =>
      `${META_GRAPH_API_BASE}/${apiVersion}/${wabaId}?fields=analytics.start(${startTimestamp}).end(${endTimestamp}).granularity(DAY)`,
  },
};
