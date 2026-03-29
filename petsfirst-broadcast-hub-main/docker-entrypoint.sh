#!/bin/sh
set -e

# Load env files if present (mounted or copied into image)
for env_file in /app/.env.local /app/.env; do
  if [ -f "$env_file" ]; then
    set -a
    . "$env_file"
    set +a
  fi
done

exec npm run dev
#!/bin/sh
set -eu

cat <<EOF > /usr/share/nginx/html/env.js
window.__ENV = {
  VITE_PUBLIC_BACKEND_BASE_URL: "${VITE_PUBLIC_BACKEND_BASE_URL:-}",
  VITE_META_ACCESS_TOKEN: "${VITE_META_ACCESS_TOKEN:-}",
  VITE_META_PHONE_NUMBER_ID: "${VITE_META_PHONE_NUMBER_ID:-}",
  VITE_META_WABA_ID: "${VITE_META_WABA_ID:-}",
  VITE_META_API_VERSION: "${VITE_META_API_VERSION:-}",
  VITE_META_LANGUAGE_CODE: "${VITE_META_LANGUAGE_CODE:-}"
};
EOF
