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

# Update Alpine packages and install dumb-init
RUN apk upgrade --no-cache && \
    apk add --no-cache dumb-init=1.2.5-r3

# npm/npx are not required in the runtime container.
# Removing them reduces the attack surface and removes
# vulnerabilities bundled with npm dependencies such as undici.
RUN rm -rf /usr/local/lib/node_modules/npm && \
    rm -f /usr/local/bin/npm && \
    rm -f /usr/local/bin/npx

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
