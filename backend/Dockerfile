# ---- Build stage ----
FROM node:24-alpine3.23 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev && \
    npm cache clean --force


# ---- Production stage ----
FROM node:24-alpine3.23 AS production

# Create non-root application user
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup

# Install dumb-init for proper PID 1 signal handling
RUN apk upgrade --no-cache \
    && apk add --no-cache dumb-init=1.2.5-r3

WORKDIR /app

# Copy production dependencies
COPY --from=build /app/node_modules ./node_modules

# Copy application source
COPY src/ ./src/

# Ensure application files belong to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "src/index.js"]
