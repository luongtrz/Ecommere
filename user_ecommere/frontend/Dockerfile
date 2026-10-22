FROM node:20-bookworm-slim AS build
WORKDIR /app
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
# Pull the patched OpenSSL packages from Alpine; the base image ships libcrypto3 3.3.3 with a CRITICAL CVE (fixed in 3.3.7).
USER root
RUN apk upgrade --no-cache libcrypto3 libssl3
USER 101
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
