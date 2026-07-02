# syntax=docker/dockerfile:1

# ============================================================================
# TENTENS — 커스텀 서버(Next + Socket.io, tsx 실행) 컨테이너 이미지
# 방식: 멀티스테이지. build 단계에서 next build, runtime 단계는 prod 의존성만.
# 서버가 런타임에 @/(→ src) alias 를 tsx 로 해석하므로 .next 외에 src/server/config 도 포함한다.
# ============================================================================

# ---- Build stage ----
FROM node:22-bookworm-slim AS build
WORKDIR /app

# NEXT_PUBLIC_* 는 next build 시 클라이언트 번들에 인라인된다 → 빌드타임 주입 필요.
# (Supabase anon 키는 공개 설계값이라 build-arg 로 전달해도 안전)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# 커스텀 서버는 tsx 로 TS 를 직접 실행하며 런타임에 @/ alias(→ src) 를 해석한다.
# 따라서 .next 뿐 아니라 src / server / tsconfig / next.config 도 런타임에 필요하다.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src
COPY --from=build /app/server ./server
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

# npm start = NODE_ENV=production tsx server/index.ts
CMD ["npm", "run", "start"]
