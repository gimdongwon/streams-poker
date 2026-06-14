# TENS — MVP 추가 기능 실행 계획

> 범위: 사운드 / 결과 공유 / 재접속 처리 / 방 목록 조회 / DB 다운 graceful 처리 / 가로모드 안내 / 점수 서버 검증
> (온보딩·튜토리얼 제외)
>
> 원칙: 각 단계는 독립적으로 빌드·동작 가능하게. 단계마다 `tsc --noEmit` + 빌드 확인.

---

## 결정사항 (실행 전 디폴트 — 바꾸고 싶으면 명령에 명시)

1. **사운드 소스**: 음원 파일 없이 **Web Audio 합성음**(짧은 비프/클릭)으로 시작. → 에셋 의존성 0, 즉시 동작. (나중에 실제 음원으로 교체 가능)
2. **결과 공유**: **텍스트 + 앱 링크**(`navigator.share`, 실패 시 클립보드 복사)로 시작. 보드 이미지 캡처 공유는 후순위.
3. **재접속 범위**: **일시 끊김 복구 + 방 재입장** 우선. 새로고침 후 "내가 놓은 카드"까지 복구하는 건 localStorage 스냅샷으로 stretch.
4. **방 목록**: MVP에선 **모든 대기방 공개 목록**. 공개/비공개 플래그는 후순위.
5. **점수 서버 검증**: 포함하되 **가장 마지막 단계**(가장 무겁고, 광고 직전 필수). 앞 단계와 독립.

---

## Phase 1 — 빠른 체감·하드닝 (독립적, 서버 변경 적음)

### 1-1. 사운드 효과
- **목표**: 카드 배치 / 타이머 경고(≤3초) / 조합·결과 공개 / 승리 시 사운드. 전역 음소거 토글.
- **접근**: `src/lib/sound.ts` 사운드 매니저(Web Audio로 합성음, `play(name)`, `setMuted`, 음소거 상태 localStorage 영속). 첫 사용자 제스처에서 AudioContext 초기화(모바일 autoplay 정책 대응).
- **트리거 연결**: `gameStore.placeCard`(배치음), `Timer`(≤3초 경고음), `GameScreen` 게임오버(결과/승리음), 버튼 클릭(선택).
- **파일**: 신규 `src/lib/sound.ts`; 수정 `gameStore.ts`, `Timer.tsx`, `GameScreen.tsx`, 헤더(음소거 버튼 — `Logo` 옆 또는 `RoundInfo` 근처).
- **고려**: SSR 가드(`typeof window`), Capacitor 웹뷰 호환, 과한 사운드 금지(짧고 가볍게).

### 1-2. 가로모드 안내
- **목표**: 휴대폰 세로로 접속 시 "기기를 가로로 돌려주세요" 오버레이.
- **접근**: `OrientationGate` 컴포넌트(또는 layout 레벨 오버레이). `portrait` + 작은 화면에서만 노출(데스크톱 제외). Tailwind `portrait:` + `max-height`/matchMedia.
- **파일**: 신규 `src/components/common/OrientationGate.tsx`; 수정 `layout.tsx`(게임/로비 등 핵심 화면 감싸기).
- **고려**: 데스크톱·태블tablet 오탐 방지(높이 기준 병행), 키보드 올라올 때 깜빡임 방지.

### 1-3. DB 다운 graceful 처리
- **목표**: Supabase 장애 시에도 게임 플레이는 계속. 저장/조회 실패가 화면을 막지 않게.
- **접근**: 점수 저장은 이미 fire-and-forget(결과 화면 비차단) — 확인·강화. 리더보드/로비 누적순위 조회 실패 시 조용한 fallback + 재시도 UI(리더보드엔 이미 있음). signup/login DB 연결 실패 메시지 명확화(앞서 detail 추가됨).
- **파일**: 수정 `Leaderboard.tsx`, `lobby/page.tsx`(rankInfo fetch try/catch), `GameScreen.tsx`(저장 실패 무시 확인), 필요 시 `auth` 라우트 메시지.
- **고려**: 미처리 rejection 제거, 네트워크 타임아웃.

### 1-4. 결과 공유
- **목표**: 결과 화면에서 "공유" → 점수/요약 텍스트 + 앱 링크 공유. 모바일 네이티브 공유 시트, 실패 시 클립보드 복사 + 토스트.
- **접근**: `src/lib/share.ts`(`navigator.share` 지원 분기 + clipboard fallback). `ResultScreen` 헤더/우상단에 공유 아이콘 버튼.
- **파일**: 신규 `src/lib/share.ts`; 수정 `ResultScreen.tsx`.
- **고려**: 공유 문구 포맷("TENS에서 N점! 같은 카드, 다른 전략 🃏 <링크>"), 앱 공개 URL 확정 필요(임시: 배포 도메인).

**Phase 1 검증**: tsc + 폰트스텁 빌드, 음소거/가로안내/공유 수동 점검 항목.

---

## Phase 2 — 멀티플레이 신뢰도 (서버 변경)

### 2-1. 방 목록 조회
- **목표**: 코드 없이 로비에서 공개 대기방 목록 → 클릭 입장.
- **서버**(`server/handlers/room.ts`): `room:list` 수신 → `waiting` 상태 방들 `{code, hostNickname, playerCount, max}` emit(`room:listed`). 방 생성/갱신/삭제 시 목록 변동 브로드캐스트(또는 목록 열 때 1회 조회 + 새로고침).
- **클라이언트**: `roomStore`에 `roomList` 상태 + `requestRoomList`/리스너. 로비에 "방 찾기" 뷰(목록 + 새로고침 + 입장).
- **파일**: 수정 `server/handlers/room.ts`, `server/index.ts`(필요 시), `roomStore.ts`, `lobby/page.tsx`.
- **고려**: 가득 찬 방 비활성, 빈 목록 상태, 잦은 브로드캐스트 최적화.

### 2-2. 재접속 처리
- **목표**: 게임 중 일시 끊김/탭 전환 시 방에서 즉시 제거되지 않고 재접속하면 복귀. (가능하면 새로고침 복구까지)
- **서버**: 플레이어 식별을 `socketId` → `userId` 기준으로 보강(이미 `auth:register`로 매핑 존재). `playing` 중 disconnect는 즉시 제거하지 않고 **유예 윈도우**(예: 15~30초) 후 미복귀 시 제거. 재접속(같은 userId) 시 기존 player 슬롯에 새 socket 재바인딩 + `game:resync`(현재 round, deck, 배치 현황) emit.
- **클라이언트**: 소켓 reconnect 시 `auth:register` 재전송 → `game:resync` 수신해 `gameStore`/`roomStore` 재구성. `roomCode`(+게임중 플래그)를 localStorage에 보관해 새로고침 후 자동 재입장 시도.
- **(stretch)** 새로고침 시 내가 놓은 슬롯 복구: 라운드별 내 배치를 localStorage 스냅샷으로 저장/복원.
- **파일**: 수정 `server/handlers/auth.ts`·`room.ts`·`game.ts`·`rounds.ts`·`state.ts`(유예/재바인딩), `roomStore.ts`·`gameStore.ts`(resync), `socket.ts`(reconnect 옵션).
- **고려**: 유예 중 라운드 진행 동기화(미배치자 처리), 호스트 이탈/복귀, 중복 세션 강제로그아웃 로직과 충돌 방지.

**Phase 2 검증**: 2탭/2기기 멀티 시나리오 — 끊김→재접속, 방 목록 입장, 라운드 동기화 확인.

---

## Phase 3 — 점수 서버 검증 (anti-cheat, 가장 마지막)

### 3-1. 권위 점수(서버 재계산)
- **목표**: 클라이언트가 보낸 점수를 그대로 믿지 않고 서버가 재계산해 저장 → 리더보드 조작 차단.
- **접근**:
  - 포커 평가기(`src/lib/poker/evaluator.ts`)를 서버/클라 공용으로 사용(같은 Next 앱이라 API 라우트·커스텀 서버 모두 import 가능). 필요 시 순수 함수 위치 정리.
  - **멀티**: 서버가 이미 각 플레이어의 `slots`를 수신 → 서버에서 재평가한 점수를 권위값으로 저장/브로드캐스트.
  - **싱글**: 리더보드 POST에 `slots`(+필요 시 라운드 시드) 포함 → API 라우트가 재평가해 점수 산출(클라 점수 무시). 가능하면 덱 시드도 검증.
- **파일**: 수정 `server/handlers/game.ts`, `api/leaderboard/route.ts`, `lib/leaderboard.ts`, 평가기 import 경로.
- **고려**: 싱글은 서버가 덱을 모르므로 "보드만으로 점수 재계산"은 가능하나 "받은 카드가 실제 덱인지"까지 검증하려면 시드/덱 서버화 필요 — MVP에선 **보드 기반 점수 재계산까지**, 덱 위조 방지는 후속.

**Phase 3 검증**: 위조 점수 POST가 거부/보정되는지, 정상 플레이 점수 일치 확인.

---

## 실행 순서 요약
1. Phase 1 (사운드 → 가로안내 → DB 하드닝 → 공유) — 각 독립 커밋
2. Phase 2 (방 목록 → 재접속)
3. Phase 3 (점수 서버 검증)

각 기능 단위로 커밋 분리, 단계 끝마다 tsc+빌드 검증. 커밋/푸시는 별도 지시 시.
