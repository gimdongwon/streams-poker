# 사용자(오너)가 해야 할 일 체크리스트

> 코드 작성은 끝났고, 여기부터는 **외부 계정·키·Mac·배포**가 필요해 제가 대신 못 하는 것들입니다.
> 각 항목 옆 💡 = 제가 옆에서 도와드릴 수 있는 부분.

---

## A. 지금 바로 — 최신 코드 반영 (제일 중요)

- [ ] **git push** — 미푸시 2커밋(iOS 네이티브/광고/푸시 스캐폴딩)
  ```bash
  git push origin main
  ```
- [ ] **웹 + 서버 재배포** (tentens.kr)
  - 서버(소켓) 재배포 필수: **참가비 차감/1등 지급, 동점 공동순위, 참가비 방 중복참여 버그 수정**이 서버 코드예요.
- [ ] **Supabase SQL 실행** (SQL Editor에 파일 *내용* 붙여넣기, 번호순)
  - [ ] `supabase/migrations/0007_coins.sql` ← **안 하면 코인 기능 500 에러**
  - [ ] `supabase/migrations/0008_push_tokens.sql`
  - [ ] (아직 안 했다면) `0004_lock_rls.sql` → `0005` → `0006` 순서로
- [ ] **프로덕션 환경변수 확인** — `SUPABASE_SERVICE_ROLE_KEY` 가 배포 서버에 설정돼 있는지 (코인/친구/푸시 서버가 사용)
- [ ] **카카오 OG 캐시 초기화** — 배포 후 https://developers.kakao.com/tool/debugger/sharing 에 `https://www.tentens.kr` 넣고 초기화

## B. 함께 QA (2계정 필요) 💡 시나리오·로그 같이 확인

- [ ] 참가비 방: 2계정 입장 → **중복참여 안 되는지**, 게임 시작 시 차감, 1등 몰아주기, 공동 1등 균등분배
- [ ] 재접속: 게임 중 한쪽 새로고침/끊김 → 복귀 되는지 (2기기 권장)
- [ ] 일일 보상 하루 1회 지급 / 다음날 재수령

---

## C. iOS 출시 — 계정·키 발급

- [ ] **Apple Developer Program** 가입 ($99/년) — https://developer.apple.com/programs/enroll/
- [ ] **AdMob** 계정 → 앱 등록 → **리워드 광고 단위 ID** + **AdMob 앱 ID** 발급  💡 발급 후 `src/lib/ads.ts` 교체는 제가 해드림
- [ ] **Firebase** 프로젝트 → **서비스 계정 키(JSON)** → 서버 env `FCM_PROJECT_ID`/`FCM_CLIENT_EMAIL`/`FCM_PRIVATE_KEY`  💡 값 넣는 형식 안내
- [ ] **Apple APNs 인증키(.p8)** 발급 → Firebase 콘솔(Cloud Messaging)에 업로드

## D. iOS 빌드 (Mac + Xcode 필요)

- [ ] `git pull && npm install`
- [ ] `npx cap add ios` → `npx cap sync ios` → `npx cap open ios`
- [ ] Xcode: 번들ID `kr.tentens.app`, 서명 팀, 앱 아이콘/런치스크린, **가로 전용** 방향
- [ ] `Info.plist`: `GADApplicationIdentifier`, `SKAdNetworkItems`, `NSUserTrackingUsageDescription`(ATT 문구), **Push Notifications capability**  💡 스니펫 만들어 드림
- [ ] Archive → 업로드 → TestFlight → 심사 제출

## E. App Store Connect

- [ ] 앱 레코드 생성, 카테고리 **게임**
- [ ] **연령 등급 17+** (코인/참가비 = 시뮬레이션 도박)
- [ ] 개인정보처리방침 URL: `https://www.tentens.kr/privacy`
- [ ] **App Privacy(데이터 수집) 라벨** 작성  💡 항목 초안 만들어 드림
- [ ] 스크린샷(가로, 6.9"/6.5") — 배포 후 로비/멀티 재캡처  💡 필요 문구/구성 도움
- [ ] 심사 메모에 테스트 계정 + "코인은 무료 가상재화, 현금 환전 없음" 기재

---

## F. (선택) 안드로이드 Play Store 업데이트

- [ ] 최신 코드로 `npx cap sync android` → AAB 재빌드 → Play Console 업로드

---

## 내가(코드) 이미 끝낸 것 ✅
코인/참가비 멀티, 동점 공동순위, 중복참여 수정, 마이페이지, 닉네임 변경, i18n(한/영),
로딩·티어 진행바·OG 썸네일, iOS 네이티브 배선(햅틱/공유/가로고정), 리워드 광고·푸시 스캐폴딩(테스트 ID/no-op 키).
