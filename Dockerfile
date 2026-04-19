# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Remove dev dependencies to keep the image small
RUN npm prune --production

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose the port (default 8080, can be overridden)
ENV PORT=8080
EXPOSE 8080

# Health check (depends on the /health endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Run the compiled entry point (main.ts -> dist/main.js)
CMD ["node", "dist/main.js"]