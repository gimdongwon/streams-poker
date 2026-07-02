# Fly.io 배포 런북

> 설계: [flyio-migration-design](../superpowers/specs/2026-07-02-flyio-migration-design.md)
> 아티팩트: [`Dockerfile`](../../Dockerfile), [`fly.toml`](../../fly.toml), [`.dockerignore`](../../.dockerignore)
>
> ✅ 로컬 `docker build` + 컨테이너 기동 검증 완료 (HTTP / → 307, /lobby → 200, /api/socketio → 200).

## ⚠️ 절대 규칙

**인스턴스는 1대로 고정.** 방/게임 상태가 인메모리라(기술부채 #3) 2대 이상이면 멀티가 깨진다.
`fly scale count 1`, 오토스케일 금지. (Redis 도입 전까지)

## 0. 사전 준비

```bash
# flyctl 설치 (macOS)
brew install flyctl
fly auth login
```

## 1. 앱 생성

`fly.toml` 의 `app = "tentens"` 는 Fly 전역에서 유일해야 한다. 이미 선점됐으면 이름을 바꾼다
(예: `tentens-kr`). 앱 이름은 커스텀 도메인과 무관하다.

```bash
# fly.toml 을 그대로 쓰되 배포는 아직 안 함
fly launch --no-deploy --copy-config --name tentens --region nrt
# (이름 충돌 시 --name tentens-kr 등으로)
```

## 2. 런타임 시크릿 설정 (서버측에서 읽는 값)

NEXT_PUBLIC 값은 (1) 빌드타임에 클라 번들로 인라인되고, (2) 서버측 API 라우트가 런타임에도 읽는다.
런타임용으로 secrets 를 세팅한다. (anon 키는 공개값이지만 관리 일관성 위해 secrets 로 둔다)

```bash
fly secrets set \
  NEXT_PUBLIC_SUPABASE_URL="https://<프로젝트>.supabase.co" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

## 3. 배포 (빌드 인자 필수)

`NEXT_PUBLIC_*` 를 **build-arg 로 반드시 전달**한다. 누락하면 클라에서 Supabase 초기화가 깨져
로그인/리더보드가 동작하지 않는다.

```bash
fly deploy \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://<프로젝트>.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

## 4. 단일 인스턴스 확인

```bash
fly scale count 1
fly status   # 머신 1대인지 확인
```

## 5. 커스텀 도메인 (www.tentens.kr)

```bash
fly certs add www.tentens.kr
fly certs show www.tentens.kr   # 요구하는 DNS 레코드 확인
```

- DNS(현재 Cloudflare)에서 `www` 를 Fly가 안내하는 대상으로 변경한다.
  - Cloudflare 사용 시 **프록시(주황 구름) 끄고 DNS-only** 로 두는 게 WSS + Fly 인증서에 안전.
  - `CNAME www → <app>.fly.dev` + Fly가 요구하는 `_acme-challenge` TXT (인증서 발급용).
- 인증서 `Ready` 되면 https://www.tentens.kr 이 Fly로 연결된다.
- 전환 후 기존 집 서버 + Cloudflare Tunnel 은 내려도 된다.

> 앱(Capacitor 방식 A)의 `server.url` 은 이미 `https://www.tentens.kr` 라 도메인이 Fly로 옮겨가도
> **APK 재빌드 불필요** — 웹뷰가 같은 도메인을 계속 로드한다.

## 6. 검증

- https://www.tentens.kr 접속 → 로비/로그인/리더보드 정상.
- 2개 탭/기기로 멀티 방 생성·참여 → 라운드 동기화·결과.
- 네트워크 끊었다 재연결 시 Socket.io 재접속(재접속 유예 로직) 동작.

## 슬립/비용 메모

- `fly.toml`: 유휴(연결 0) 시 머신 정지(`auto_stop_machines`), 접속 시 자동 기동.
  진행 중 게임은 WS 연결이 있어 정지되지 않음. 완전 유휴 후 첫 접속만 콜드스타트(수 초).
- 콜드스타트가 싫으면 `min_machines_running = 1` 로 바꿔 상시가동(비용↑).

## app-ads.txt (하위 프로젝트 ④ AdMob 때)

AdMob 퍼블리셔 ID 확정 후 `public/app-ads.txt` 를 추가하면 `https://www.tentens.kr/app-ads.txt` 로 서빙된다.
(Next 는 `public/` 을 정적 서빙)
