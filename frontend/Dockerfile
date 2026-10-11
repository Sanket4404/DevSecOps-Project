# ---- Build stage ----
FROM node:24-alpine3.23 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install && \
    npm cache clean --force

COPY . .

RUN npm run build


# ---- Production stage ----
FROM nginx:1.27-alpine AS production

# Update Alpine packages so known OS-level vulnerabilities
# such as the zlib issue detected by Trivy are patched.
RUN apk upgrade --no-cache

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
