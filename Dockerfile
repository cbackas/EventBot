FROM node:18-slim AS base
RUN apt-get update && apt-get install -y python3

FROM base AS build
WORKDIR /build
COPY package.json .
COPY package-lock.json .
RUN npm ci

COPY src src
COPY esbuild.mjs esbuild.mjs
COPY tsconfig.json tsconfig.json
RUN npm run build

FROM base AS prod
WORKDIR /app
RUN npm install pm2 --save-dev && npm install canvas --save
COPY --from=build /build/dist .
COPY entrypoint.sh .
ENV TZ="America/Chicago"
ENTRYPOINT ["sh", "entrypoint.sh"]
