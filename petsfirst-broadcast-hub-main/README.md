## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env.local` with the following variables:
   - **Meta API:** `VITE_META_ACCESS_TOKEN`, `VITE_META_PHONE_NUMBER_ID`, `VITE_META_WABA_ID`, `VITE_META_APP_ID` (Facebook App ID, required for template creation with media; do not use WABA ID here), `VITE_META_API_VERSION` (default: `v22.0`), `VITE_META_LANGUAGE_CODE` (default: `en`)
   - **Location search (Create Template):** `VITE_GOOGLE_MAPS_API_KEY` — enable Maps JavaScript API and Places API in Google Cloud to use location autocomplete
3. Run the app:
   `npm run dev`

## Run With Docker

This image supports runtime env injection, so you can pass variables when
running the container.

Build:

`docker build -t petsfirst-marketing .`

Run:
`docker run --rm -p 3000:3000 \
  -e VITE_META_ACCESS_TOKEN=... \
  -e VITE_META_PHONE_NUMBER_ID=... \
  -e VITE_META_WABA_ID=... \
  -e VITE_META_APP_ID=... \
  -e VITE_META_API_VERSION=v22.0 \
  -e VITE_META_LANGUAGE_CODE=en \
  -e VITE_PUBLIC_BACKEND_BASE_URL=... \
  petsfirst-marketing`
