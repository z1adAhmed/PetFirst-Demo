# Multi-stage build for React app
FROM --platform=linux/arm64 node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npm run build

# Production stage with nginx
FROM --platform=linux/arm64 nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]