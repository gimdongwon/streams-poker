# 집 서버 배포 (Cloudflare Tunnel)

공유기 포트 개방 없이 **HTTPS + Socket.io(WebSocket)** 를 쓰려면 Cloudflare Tunnel을 권장합니다. 앱은 로컬 `127.0.0.1:3000`만 바인딩하고, 터널이 외부와 연결합니다.

## 사전 준비

- 집 PC 또는 라즈베리파이 등 **항상 켜둘 머신**
- [Node.js](https://nodejs.org/) LTS
- 무료 [Cloudflare](https://www.cloudflare.com/) 계정 + 본인 도메인 DNS를 Cloudflare로 넘긴 상태(또는 Cloudflare에서 구매한 도메인)

## 1. 저장소 & 빌드

`NEXT_PUBLIC_SUPABASE_*` 는 **`npm run build` 할 때** 클라이언트 번들에 들어갑니다. 빌드하는 환경에 `.env.local`(또는 동일한 값의 환경변수)이 있어야 합니다.

```bash
cd /path/to/streams-poker
cp .env.example .env.local
# .env.local 에 Supabase 키 입력
npm ci
npm run build
```

## 2. 수동으로 한 번 띄워 보기

```bash
npm start
```

브라우저에서 `http://127.0.0.1:3000` 으로 멀티플레이까지 확인합니다.

## 3. Cloudflare Tunnel (빠른 테스트)

[cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) 설치 후:

```bash
cloudflared tunnel --url http://127.0.0.1:3000
```

터미널에 나오는 `*.trycloudflare.com` 주소로 접속해 동작을 확인할 수 있습니다. (임시 URL, 재시작 시 바뀔 수 있음.)

## 4. 고정 도메인(권장)

1. Cloudflare Zero Trust 대시보드에서 **Networks → Connectors → Cloudflare Tunnels** 로 터널을 만듭니다.
2. **Public hostname** 에서 서브도메인(예: `poker`)을 지정하고, 서비스는 `http://127.0.0.1:3000` 으로 둡니다.
3. 생성된 설정을 로컬에 저장하거나, 이 폴더의 `cloudflared-config.example.yml` 을 참고해 `~/.cloudflared/config.yml` 을 만듭니다.

```bash
cloudflared tunnel run
```

## 5. 부팅 시 자동 실행 (Linux + systemd)

1. `streams-poker.service` · `cloudflared.service` 안의 `YOUR_LINUX_USER`, 경로, `ExecStart` 를 환경에 맞게 수정합니다.
2. nvm을 쓰면 Node/npm **절대 경로**로 `ExecStart` 를 바꾸는 것이 안정적입니다.

```bash
sudo cp streams-poker.service /etc/systemd/system/
sudo cp cloudflared.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now streams-poker.service
sudo systemctl enable --now cloudflared.service
sudo systemctl status streams-poker.service
```

앱 서비스는 **반드시** `npm run build` 가 끝난 뒤에 기동해야 합니다.

## macOS 집 서버

Linux용 `systemd` 대신 **터미널에서 직접** `npm start` 와 `cloudflared tunnel run` 을 띄워도 됩니다. 부팅 후 자동 실행은 `launchd` plist 또는 [Homebrew 서비스](https://formulae.brew.sh/formula/cloudflared)로 `cloudflared`만 등록하는 방식이 흔합니다.

## 운영 시 참고

- **전기/슬립**: 머신이 절전 모드로 가면 접속이 끊깁니다. 전원·절전 설정을 확인하세요.
- **Supabase**: 리더보드/인증은 그대로 클라우드 DB를 씁니다. 별도로 집에 DB를 둘 필요는 없습니다.
- **보안**: 라우터에서 3000번 포트를 열지 않아도 됩니다. SSH만 필요하면 터널과 별도로 관리하세요.
