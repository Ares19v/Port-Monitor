# ─────────────────────────────────────────────────────────────────────────────
# Port-Monitor — Frontend Dockerfile
# Stage 1: Build the Vite/React app
# Stage 2: Serve with Nginx
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:stable-alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Add custom config that proxies /api to the backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
