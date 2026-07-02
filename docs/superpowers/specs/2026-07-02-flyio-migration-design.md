# ① Fly.io 인프라 이전 (설계)

> 작성일: 2026-07-02
> 상위 로드맵: [2026-07-02-app-roadmap-design.md](2026-07-02-app-roadmap-design.md)
> 상태: 아티팩트 준비 완료, 실제 배포는 사용자 Fly.io 계정 필요

## 목표

현재 Railway 에서 운영 중인 커스텀 tsx 서버(Next + Socket.io)를 Fly.io로 이전한다.
(Railway 안정성 이슈 + 무료 티어 종료가 이전 동기 — monetization 문서 참고.)
안정적인 공개 HTTPS/WSS 엔드포인트 + `app-ads.txt` 호스팅 확보. 도메인 `www.tentens.kr`(구매) 은
현재 Railway 를 가리키며, 이전 시 Fly 로 재지정한다.

## 아키텍처 사실 (컨테이너화에 영향)

- 프로덕션 기동 = `NODE_ENV=production tsx server/index.ts` (커스텀 서버가 Next를 prepare 후 서빙 + Socket.io).
- **서버가 런타임에 `@/`(→ `src/`) alias를 tsx로 해석**한다 (`server/scoring.ts` → `@/lib/poker/evaluator`).
  따라서 런타임 이미지에 `.next` 뿐 아니라 `src/`, `tsconfig.json`, `server/`, `next.config.ts` 가 필요하다.
- 환경변수 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 는 `next build` 시
  클라이언트 번들에 인라인된다 → **빌드타임 주입 필수**. (anon 키는 공개 설계값이라 build-arg로 무방)
  서버측 API 라우트도 런타임에 같은 값을 읽으므로 런타임 env로도 세팅한다.
- 네이티브 빌드 의존성 없음(bcryptjs 순수 JS, sharp 없음) → slim 베이스 이미지로 충분.

## 확정 결정 (기본값 — 필요 시 변경)

1. **리전**: `nrt`(도쿄) — 한국 사용자에 가장 가까운 Fly 리전.
2. **단일 인스턴스 고정**: 인메모리 방 상태(보류된 #3) 때문에 **절대 2대 이상으로 스케일하지 않는다.**
   `fly scale count 1`, 오토스케일 비활성. (Redis 도입 전까지 하드 제약)
3. **슬립 정책**: `auto_stop_machines="stop"` + `min_machines_running=0` 으로 유휴 시 정지(비용 절감).
   - WebSocket 연결이 있으면(=게임 중) 정지되지 않는다. 연결 0일 때만 정지 → 진행 중 게임 손실 없음.
   - 트레이드오프: 완전 유휴 후 첫 접속에 콜드스타트(수 초). 소프트론칭엔 허용.
   - 콜드스타트가 싫으면 `min_machines_running=1`(상시가동, 비용↑)로 전환.
4. **VM**: `shared-cpu-1x`, 512MB (Next+소켓 소규모).
5. **포트**: 컨테이너 3000, Fly `http_service`가 443→3000 프록시 + WSS 자동 처리.
6. **도메인**: `www.tentens.kr`(구매 도메인, 현재 Railway 연결) 를 Fly 앱에 연결(인증서 발급). 전환 시 DNS를 Railway → Fly로 재지정.

## 산출물

- `Dockerfile` — 멀티스테이지(build: 전체 설치+`next build`, runtime: prod-only 설치 + `.next`/`src`/`server`/config 복사).
- `.dockerignore` — node_modules/.next/android 등 제외.
- `fly.toml` — 위 결정 반영.
- `docs/app/flyio-deploy.md` — 배포 런북(launch/secrets/build-arg/deploy/도메인/app-ads.txt).

## 검증

- 로컬 `docker build`(더미 NEXT_PUBLIC 인자)로 이미지 빌드 성공 확인.
- (사용자) `fly deploy` 후 멀티 게임 동작 + WSS 재연결 확인.

## 리스크 / 주의

- **스케일 금지**: 2대 이상이면 방이 인스턴스별로 갈려 멀티가 깨진다. Redis(#3) 전까지 count=1.
- **빌드 인자 누락 시**: NEXT_PUBLIC 미주입이면 클라에서 Supabase 초기화 실패 → 리더보드/로그인 깨짐. 런북에 강조.
- 도메인 전환 시 앱(방식 A)의 `server.url` 은 이미 `www.tentens.kr` 라 그대로 유지된다(재빌드 불필요).
