FROM node:25.0-alpine AS builder

WORKDIR /app

# Install PNPM
RUN npm install -g pnpm@10

# Copy dependency files
COPY pnpm-lock.yaml package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY src/ ./src/
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Build application
RUN pnpm run build

# ============================================
# Production Stage
# ============================================
FROM node:25.0-alpine

WORKDIR /app

# Install PNPM and create non-root user
RUN npm install -g pnpm@10 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependency files
COPY pnpm-lock.yaml package.json ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod && \
    pnpm prune --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs .

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/main.js"]
