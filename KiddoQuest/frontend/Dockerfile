# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
RUN apk add --no-cache gettext

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config (SPA + optional API proxy)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Default backend URL (override at runtime with -e BACKEND_URL=...)
ENV BACKEND_URL=http://localhost:8081

# Note: The backend URL in vite.config.ts is only used for the Vite development server proxy.
# In production (Docker/nginx), BACKEND_URL is used by nginx for API proxying.
# You do NOT need to pass BACKEND_URL to Vite or the frontend build process.
# Only provide BACKEND_URL at container/runtime for nginx if proxying API calls in production.

CMD ["/bin/sh", "-c", "envsubst '$$BACKEND_URL' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
