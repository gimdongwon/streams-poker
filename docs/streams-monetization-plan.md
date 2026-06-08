# Streams — 수익화 & 앱 출시 전략 정리

> 게임: STREAMS POKER (가칭, 네이밍 변경 예정)
> 핵심 컨셉: 같은 카드, 다른 전략 — 운 제거 + 순수 전략 카드 배치 게임
> 현재 상태: MVP 완성, 가오픈 후 지인 테스트 반응 양호

---

## 1. 수익화 방향

### 우선순위
1. **보상형 광고 (Rewarded Ads)** — 1순위, 현재 게임 구조에 가장 적합
2. **전면광고 (Interstitial)** — 2순위, 싱글 모드 결과 화면 등
3. **광고 제거 IAP** — 3순위, 경쟁 성향 유저가 잘 구매
4. **구독 / 시즌제** — 나중에, 유저 베이스 확보 후
5. **코인 구매** — 보류 (초기엔 진입 장벽이 독이 될 수 있음)

### 보상형 광고 핵심 설계 — "1.5배 점수"
- Ready를 광고 강제 관문으로 두지 말 것 (정책 위반 소지)
- 대신 **자발적 보너스 트리거**로 설계
  - 예: "Ready는 그냥 진행 + 광고 보면 이번 판 점수 1.5배"
  - 리더보드 경쟁심 자극 + 정책 통과 + 거부감 최소
- AdMob 정책: 보상형 광고는 유저가 "예/광고 보기" 버튼으로 명확히 옵트인해야 함. 강제·차단 금지(스킵/닫기 가능해야 함)

### 광고 도입 타이밍 (중요)
- 초기에 광고부터 박으면 리텐션 깎이고 입소문 죽음
- 순서: 광고 최소화 → 유저 확보 → 리텐션 검증(D1/D7) → 트래픽 쌓인 후 광고 본격 도입

---

## 2. 광고 승인 절차 (AdMob)

- AdSense처럼 **앱 심사·승인 필요**
- 선행 조건:
  1. 앱이 **구글플레이/앱스토어에 정식 출시**되어 있어야 함 (미완성/개발중 거절)
  2. **app-ads.txt 파일 검증** (2024년부터 추가된 단계)
- 절차: 스토어 출시 → AdMob 계정/앱 등록 + app-ads.txt → 심사(며칠~2주) → 승인 후 광고 서빙
- **즉, 광고는 스토어 출시 이후에야 달 수 있음**

---

## 3. 인프라 (Fly.io 이전 결정)

### 왜 Fly.io
- 게임이 Socket.io 상시 연결(WebSocket) 기반 → 정적/서버리스 호스팅 불가
- Vercel: 함수 타임아웃 존재 + 무료 Hobby는 약관상 비상업용 전용 → 광고 붙이면 위반
- Railway: 최근 안정성 이슈(2025.12 EU 리전 빌드 중단, 2026.05 약 8시간 전체 장애), 무료 티어 종료
- **Fly.io: 소규모 VM 무료 한도 + WebSocket 지원 + 글로벌 배포 → 현 케이스 최적 무료 옵션**

### 구성
- 서버: Fly.io (무료 티어로 시작, 동접 늘면 유료 전환)
- DB: Supabase 무료 티어 유지
- 결제도 추후 Fly.io 환경에서 처리 예정

### 비용 절감 팁
- 유휴 시 슬립 → 접속 시 깨어남 구조로 상시 가동 비용 절감
- 트레이드오프: 콜드 스타트로 첫 접속 몇 초 지연 (초기엔 합리적)

---

## 4. 앱 출시 전략 — Capacitor (RN 아님)

### 결정: Capacitor 채택
- 이미 Next.js 웹 게임 완성됨 → 그대로 네이티브 껍데기에 넣으면 됨
- RN은 같은 "React"여도 렌더 타겟이 다름(View/Text/StyleSheet) → 사실상 전면 재작성
- Tailwind, Framer Motion, 기존 컴포넌트 전부 RN에선 못 씀

| 항목 | Capacitor | React Native |
|---|---|---|
| 기존 Next.js 코드 | 그대로 사용 | 전면 재작성 |
| 웹/앱 코드 공유 | 단일 코드베이스 | 분리 |
| Tailwind / Framer Motion | 동작 | 불가 |
| AdMob 플러그인 | `@capacitor-community/admob` | 있음 |
| 학습 비용 | 거의 없음 | 새 패러다임 |

### 역할 분리 구조 (핵심)
- **게임 진행 = 웹뷰** (Next.js, Socket.io 대전, 카드 배치, 결과)
- **광고 노출 = 네이티브** (Capacitor AdMob 플러그인이 전체화면 광고 띄움)
- 둘이 한 화면에 겹치는 게 아니라, 웹뷰가 네이티브에 "광고 띄워줘" 신호만 보냄 (JS Bridge)

### 흐름 예시
```
[웹뷰] 대기방에서 Ready 클릭
   ↓ (JS Bridge → 네이티브 호출)
[네이티브] AdMob 보상형 광고 전체화면 노출
   ↓ (시청 완료 콜백)
[웹뷰] 보상(1.5배 등) 반영 후 게임 시작
```

### 구현 스케치
```typescript
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';

async function handleReadyClick() {
  await AdMob.prepareRewardVideoAd({ adId: 'ca-app-pub-xxx/yyy' });

  AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
    // 광고 끝까지 본 경우만 도달 → 보너스 적용
    socket.emit('player-ready', { roomId });
  });

  await AdMob.showRewardVideoAd();
}
```

### 잠재 리스크
- Capacitor는 웹뷰 기반 → 저가 안드로이드 단말에서 Framer Motion 버벅일 수 있음
- 대응: CSS transform 기반으로 애니메이션 경량화 (이 정도로 충분, RN까지 갈 이유 아님)

---

## 5. 네이밍

- 후보 압축: **Adjacent** (인접 규칙 강조) vs **TENS** (10장/10라운드/10슬롯) — 둘 중 고민 중
- "poker" 키워드는 스토어 심사·연령등급 리스크 있어 피하는 방향
- 영문 브랜드 + 한글 표기 통일 권장

---

## 6. 실행 순서 (요약)

1. Fly.io로 인프라 이전 + Supabase 무료 유지
2. 네이밍 확정 (Adjacent / TENS)
3. 게임 버전 보완 업데이트 (별도 진행)
4. Capacitor로 앱 래핑 → 안드로이드 빌드
5. 구글플레이 스토어 출시
6. AdMob 심사 (스토어 출시 이후 가능)
7. 승인 후 보상형 광고("1.5배 점수") 정식 도입

> 광고는 5~6단계 이후에야 달 수 있으므로, 그 전까지는 인프라 이전 / 게임 보완 / 앱 래핑에 집중.
