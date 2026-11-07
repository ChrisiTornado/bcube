# === Build Stage ===
FROM node:22 AS build
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# === Production Stage ===
# Unprivileged variant: runs as a non-root user and listens on 8080 instead of 80.
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/bcube-frontend/browser /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]