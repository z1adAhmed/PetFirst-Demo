export type AppEnv = "stage" | "prod";

export function getStrapiBaseUrl(env: AppEnv): string {
  return env === "prod"
    ? (import.meta.env.VITE_STRAPI_PROD_BASE_URL ?? "")
    : (import.meta.env.VITE_STRAPI_STAGE_BASE_URL ?? "");
}

export function getMetaGraphApiBase(): string {
  return (
    import.meta.env.VITE_META_GRAPH_API_BASE ?? "https://graph.facebook.com"
  );
}
