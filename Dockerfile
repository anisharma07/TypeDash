# ---- Stage 1: build the React client (Vite) ----
FROM node:22 AS client-build
WORKDIR /build/client
# Copy manifests first so the dependency layer is cached
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- Stage 2: runtime (Node server + built client) ----
FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
# Root package-lock.json is gitignored, so use install (not ci)
RUN npm install --omit=dev
COPY app.js ./
COPY utils ./utils
COPY --from=client-build /build/client/dist ./client/dist

EXPOSE 2360

CMD ["node", "app.js"]
