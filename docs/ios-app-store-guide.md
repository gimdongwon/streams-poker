# TENTENS — iOS App Store 출시 가이드

> 이 앱은 **Capacitor 원격 URL 래퍼**입니다. 네이티브 껍데기(웹뷰)가 `https://www.tentens.kr` 를 로드하고,
> 네이티브는 스플래시·상태바·햅틱·공유·광고 등 기기 기능만 담당합니다.
> `appId: kr.tentens.app` (안드로이드와 동일 번들 ID 사용).

---

## 0. 준비물

- **Mac + Xcode** — iOS 빌드·아카이브·업로드는 macOS에서만 가능. Mac이 없으면 MacinCloud/MacStadium 등 클라우드 맥, 또는 Codemagic 같은 CI 사용.
- **Apple Developer Program 멤버십: 연 US$99** (자동 갱신). 비영리/교육/정부는 면제 신청 가능.
- **CocoaPods** (`sudo gem install cocoapods`) — Capacitor iOS 의존성 설치용.

---

## 1. 레포 준비 (일부 완료됨 ✅)

이미 이 레포에 반영해 둔 것:

- ✅ `@capacitor/ios` 의존성 추가 (`package.json`)
- ✅ `capacitor.config.ts` 에 `ios` 섹션 추가 (배경색, 스크롤 비활성, `iosScheme: https`)
- ✅ **네이티브 기능 배선** (Guideline 4.2 "웹사이트 재포장" 반려 대비) — `src/lib/native.ts`
  - 카드 배치 시 **햅틱**(`@capacitor/haptics`)
  - 결과 **네이티브 공유 시트**(`@capacitor/share`, `src/lib/share.ts`)
  - **가로모드 고정**(`@capacitor/screen-orientation`, `CapacitorBootstrap`)
  - 기존: 스플래시(`@capacitor/splash-screen`), 상태바(`@capacitor/status-bar`), 뒤로가기(`@capacitor/app`)
  - 모두 `Capacitor.isNativePlatform()` 가드 → 브라우저에서는 no-op

> 원격 URL 래퍼라 위 네이티브 JS는 **tentens.kr 에 배포**되어야 실제 앱 웹뷰에 반영됩니다.
> (즉 이 변경들도 `git push` + 웹 재배포 필요)

남은 것 (아래 단계에서):

- ⬜ iOS 네이티브 프로젝트 생성 (`npx cap add ios`) — **Mac 필요**
- ⬜ 앱 아이콘/런치스크린, 서명, App Store Connect 등록
- ⬜ (광고 붙일 때) ATT 동의 + 개인정보 라벨

---

## 2. iOS 네이티브 프로젝트 생성 (Mac에서)

```bash
git pull                 # 위 준비 커밋 반영
npm install              # @capacitor/ios 등 설치
npx cap add ios          # ios/ 네이티브 프로젝트 생성
npx cap sync ios         # 웹 설정/플러그인 동기화 (CocoaPods 설치 포함)
npx cap open ios         # Xcode 열기
```

> 원격 URL 방식이라 `npm run build` 로 웹을 번들할 필요는 없습니다.
> `webDir`(capacitor-webdir)는 서버 미도달 시 폴백용 최소 페이지입니다. 최소 `index.html` 하나는 있어야 `cap add` 가 통과합니다.

---

## 3. Xcode 설정

- **Bundle Identifier**: `kr.tentens.app`
- **Signing & Capabilities**: 본인 Apple Developer 팀 선택 (자동 서명)
- **Deployment Target**: iOS 14+ 권장
- **Version / Build**: 1.0.0 / 1 부터
- **App Icons**: 1024×1024 마스터 + 아이콘 세트 (기존 `store-assets/icon-1024.png` 활용)
- **Launch Screen**: 배경 `#0b0b12` 단색 (스플래시와 통일)
- **Orientation**: Landscape 만 체크 (가로 전용 게임)
- **Info.plist**
  - 원격 로드는 HTTPS라 ATS 문제 없음 (임의 예외 넣지 말 것)
  - **광고(AdMob) 붙일 때**: `NSUserTrackingUsageDescription`(ATT 문구), `GADApplicationIdentifier`, `SKAdNetworkItems` 추가

---

## 4. App Store Connect 등록

1. **App 레코드 생성** — 플랫폼 iOS, 번들 ID `kr.tentens.app`, 이름 "TENTENS"
2. **카테고리**: 게임 (Games) / 서브카테고리 카드(Card) 또는 캐주얼(Casual)
3. **연령 등급(Age Rating)**: **17+** — 코인/참가비/승자독식은 "시뮬레이션 도박(Simulated Gambling)"에 해당. 등급 설문에서 해당 항목 정직하게 체크.
4. **개인정보처리방침 URL**: `https://www.tentens.kr/privacy` (이미 존재)
5. **App Privacy(데이터 수집 라벨)**: 수집 항목 신고 — 계정(아이디/닉네임), 사용 데이터(GA/GTM), 광고 붙이면 식별자/광고 데이터 추가
6. **스크린샷**: 아이폰 6.9"·6.5" 필수 (가로 캡처). iPad 지원 시 iPad 스샷도. `store-assets/` 의 lobby/multi/playing/result 활용 (가로 해상도로 재캡처 권장)

---

## 5. ⚠️ 심사 리스크 & 대응 (이 앱 특화)

### 5.1 Guideline 4.2 — 최소 기능 (가장 큰 위험)
웹뷰로 사이트만 로드하는 앱은 "Safari와 다를 바 없다"며 반려됩니다.
→ 대응: 위 1단계 네이티브 기능(햅틱/네이티브 공유/가로 고정/스플래시/상태바/뒤로가기)으로 "앱다움" 확보.
추가로 여유가 되면 **푸시 알림(APNs)** 을 넣으면 통과율이 크게 오릅니다(가장 확실한 네이티브 신호).

### 5.2 Guideline 5.3 — 도박 / 시뮬레이션 도박
- 현재: 코인은 **무료 지급(일일 보상)**, **현금 구매·환전 없음** → "시뮬레이션 도박"으로 **허용**. 단 **17+ 등급** 필수, 실제 도박처럼 오인되게 광고/표기하지 말 것.
- 주의: 나중에 **코인을 현금(IAP)으로 판매**하거나 **현금성 보상**을 도입하면 규제가 크게 강화됨(라이선스·지역 제한). 도입 전 반드시 정책 재검토.

### 5.3 광고 (AdMob 예정)
- **ATT(App Tracking Transparency)** 동의 팝업 필수(추적 시), **SKAdNetwork** 설정, App Privacy 라벨에 광고 데이터 신고.
- 미성년 대상 광고 정책 주의(17+라 성인 대상이면 완화되지만 정책 확인).

### 5.4 결제 (IAP)
- 코인 등 **디지털 재화를 판매하면 반드시 Apple In-App Purchase** 사용(외부 결제 불가, 수수료 15~30%).
- 현재는 판매 없음 → 해당 없음.

### 5.5 기타
- **로그인**: 현재 자체 아이디/비번만 → OK. 만약 Google 등 **제3자 소셜 로그인**을 추가하면 **Sign in with Apple** 도 함께 제공해야 함.
- **계정 삭제**: 이미 앱 내 제공(정책 충족).

---

## 6. 빌드 & 제출

1. Xcode → Product → **Archive**
2. Organizer → **Distribute App** → App Store Connect 업로드
3. App Store Connect → **TestFlight** 로 내부 테스트
4. 빌드 선택 후 **심사 제출(Submit for Review)**
5. 심사 메모(Review Notes)에 테스트 계정(아이디/비번) 제공 + "코인은 무료 가상재화, 현금 환전 없음" 명시하면 도박 관련 오해 감소

---

## 7. 출시 전 체크리스트

- [ ] 네이티브 기능 변경분 `git push` + tentens.kr 재배포 (햅틱/공유/가로고정 반영)
- [ ] Mac에서 `npx cap add ios` → `sync` → `open`
- [ ] Bundle ID `kr.tentens.app`, 서명 팀 설정
- [ ] 앱 아이콘·런치스크린, 가로 전용 방향
- [ ] Apple Developer 멤버십 결제
- [ ] App Store Connect 앱 생성, **연령 17+**, 개인정보 URL, App Privacy 라벨
- [ ] 가로 스크린샷 (6.9"/6.5")
- [ ] Archive → 업로드 → TestFlight → 제출
- [ ] (광고 도입 시) ATT/SKAdNetwork/개인정보 라벨 선반영

---

## 8. 푸시 알림 & 리워드 광고 (레포에 스캐폴딩 완료 ✅)

코드/DB/API는 붙여놨고, **계정·키·네이티브 설정만** 채우면 동작합니다.

### 8.1 리워드 광고 (일일 보상)
- 코드: `src/lib/ads.ts` (초기화 + 리워드 노출), `DailyRewardButton`에서 보상 전 광고 노출, `CapacitorBootstrap`에서 초기화 + ATT 요청.
- **광고 단위 ID (실제)** 는 `src/lib/ads.ts` 에 반영 완료 ✅
  - iOS 리워드: `ca-app-pub-1157070050571953/2495101707`
  - Android 리워드: `ca-app-pub-1157070050571953/2437472942`
- **앱 ID (~)** — 네이티브에 설정:
  - Android: `AndroidManifest.xml` 에 반영 완료 ✅ (`ca-app-pub-1157070050571953~1315962960`)
  - iOS: `ios/App/App/Info.plist` 에 아래 추가 (Mac에서 `cap add ios` 후):
    ```xml
    <key>GADApplicationIdentifier</key>
    <string>ca-app-pub-1157070050571953~6220769890</string>
    <key>NSUserTrackingUsageDescription</key>
    <string>맞춤 광고를 제공하기 위해 사용자 활동을 추적합니다.</string>
    <!-- SKAdNetworkItems 는 AdMob 문서의 최신 목록을 붙여넣기:
         https://developers.google.com/admob/ios/ios14 -->
    ```
- Mac: `npm i` 후 `npx cap sync ios` (AdMob pod 설치).

### 8.2 친구 요청 푸시 알림
코드/DB/API 완료. 남은 건 Firebase 세팅뿐. (푸시는 **네이티브 앱에서만** 동작 — 웹 브라우저 X)

**Part 1 — Firebase 프로젝트 + Android 앱 (수신용)**
1. https://console.firebase.google.com → 프로젝트 만들기 (예: `tentens`)
2. **Android 앱 추가** → 패키지 이름 `kr.tentens.app` (SHA 지금 불필요)
3. **google-services.json 다운로드** → `android/app/google-services.json` 에 저장
   - gradle 은 이미 자동 적용되게 설정됨 ✅ (`android/app/build.gradle` 이 이 파일 있으면 google-services 플러그인 적용)
   - 이후 `npx cap sync android` → 빌드

**Part 2 — 서버 발송 자격증명 (FCM HTTP v1)**
1. Firebase 콘솔 → 프로젝트 설정(⚙) → **서비스 계정** 탭 → **새 비공개 키 생성** → JSON 다운로드
2. 서버 env 에 JSON 값 3개 설정 (개발: `.env.local`, 운영: 배포 서버 환경변수):
   - `FCM_PROJECT_ID` = json `project_id`
   - `FCM_CLIENT_EMAIL` = json `client_email`
   - `FCM_PRIVATE_KEY` = json `private_key` → **한 줄로, 개행을 `\n` 으로**, 큰따옴표로 감싸기:
     `FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n....\n-----END PRIVATE KEY-----\n"`
     (코드가 `\n` → 실제 개행으로 변환함. 미설정 시 발송만 no-op, 앱은 정상)

**Part 3 — iOS (Mac 단계에서)**
- Firebase에 **iOS 앱 추가**(번들 `kr.tentens.app`) → `GoogleService-Info.plist` → Xcode에 추가
- Apple Developer → **APNs 인증키(.p8)** 발급 → Firebase 콘솔 **Cloud Messaging** 에 업로드
- Xcode: **Push Notifications** capability 추가
- `npx cap sync ios`

**테스트**: Android 앱(빌드본) 설치 → 로그인하면 토큰 등록 → 다른 계정이 친구 요청 보내면 알림 수신.
현재 트리거: **친구 요청 받음**. (추후 일일보상 리마인더/방 초대 등 확장 가능)

> 이 스캐폴딩도 원격 URL 래퍼라 **웹 재배포 + Mac에서 cap sync** 후에 실제 기기에서 동작합니다.

## 참고 링크
- Apple Developer Program: https://developer.apple.com/programs/whats-included/
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Capacitor iOS 문서: https://capacitorjs.com/docs/ios
