# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for native modules if needed
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy Prisma schema and generate client for production
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/main"]
