# iOS 출시 런북 (Mac에서 진행)

TENTENS iOS 앱을 App Store에 올리기까지 **Mac에서 순서대로** 실행하는 체크리스트.
개념 설명·심사 리스크는 `ios-app-store-guide.md` 참고. 이 문서는 "지금 뭘 누르면 되는가"에 집중.

## 고정값 (복붙용)

| 항목 | 값 |
|---|---|
| Bundle ID | `kr.tentens.app` |
| Firebase 프로젝트 | `tentens-76f99` |
| iOS AdMob 앱 ID | `ca-app-pub-9943215492404656~4280932456` |
| iOS 리워드 광고 단위 | `ca-app-pub-9943215492404656/2315068499` |
| 원격 URL(웹뷰) | `https://www.tentens.kr` |

> 이미 코드에 반영됨: Info.plist(AdMob/ATT/SKAdNetwork/가로모드 고정), AppDelegate `FirebaseApp.configure()`, 푸시는 `@capacitor-firebase/messaging`(iOS·Android 모두 FCM 토큰).

---

## 1. 최신 코드 동기화 + 네이티브 sync

푸시 플러그인을 교체했으므로 **양 플랫폼 cap sync 필수** (iOS는 CocoaPods 필요).

```bash
git pull
npm install
# CocoaPods 없으면: brew install cocoapods
npx cap sync ios
npx cap sync android   # 안드로이드도 플러그인 바뀌었으니 재동기화
npx cap open ios       # Xcode 열림
```

`cap sync ios`가 FirebaseMessaging pod을 설치함. 실패 시 `cd ios/App && pod install`.

## 2. Firebase에 iOS 앱 등록 → GoogleService-Info.plist

1. Firebase 콘솔 → 프로젝트 `tentens-76f99` → 앱 추가 → **iOS**.
2. Apple 번들 ID = `kr.tentens.app` 입력 → 앱 등록.
3. **GoogleService-Info.plist** 다운로드.
4. Xcode에서 `App` 타깃에 드래그로 추가 (Copy items if needed 체크, Target: App).
   - 위치: `ios/App/App/GoogleService-Info.plist`.
   - ⚠️ 이 파일은 `.gitignore` 되어 있을 수 있음 — 커밋 여부는 팀 정책대로(보통 커밋해도 무방).

## 3. APNs 인증키(.p8) 발급 → Firebase 업로드

1. Apple Developer → Certificates, Identifiers & Profiles → **Keys** → `+`.
2. **Apple Push Notifications service (APNs)** 체크 → 생성 → **.p8 다운로드(1회만 가능)**.
   - **Key ID** 기록, **Team ID**(우상단 멤버십)도 확인.
3. Firebase 콘솔 → 프로젝트 설정 → **Cloud Messaging** → Apple 앱 구성 → **APNs 인증 키 업로드**: .p8 + Key ID + Team ID.

> 이 방식은 Firebase가 sandbox(개발)/production(TestFlight·출시) APNs 환경을 자동 선택하므로 서버 코드 변경 불필요.

## 4. Xcode 설정

`App` 타깃 → **Signing & Capabilities**:
- Team 선택, Automatically manage signing, Bundle Identifier = `kr.tentens.app`.
- `+ Capability` → **Push Notifications** 추가.
- (선택) `+ Capability` → **Background Modes** → *Remote notifications* 체크 (백그라운드 수신).

**General**:
- Deployment Info → iPhone/iPad Orientation은 **Landscape만** (Info.plist에 이미 반영됨).
- App Icons: `Assets.xcassets` → AppIcon에 1024×1024 아이콘 넣기 (`store-assets/`의 아이콘 활용).

Info.plist / AppDelegate는 이미 반영되어 추가 작업 없음:
- `GADApplicationIdentifier`, `NSUserTrackingUsageDescription`, `SKAdNetworkItems`, 가로모드.
- `FirebaseApp.configure()`.

## 5. 실기기 테스트

- 실제 iPhone 연결 → Run.
- 로그인 후 푸시 권한 허용 → 친구 요청으로 알림 수신 확인.
- 일일 보상에서 리워드 광고(테스트/실제) 노출 확인.
- 가로모드 고정, ATT 프롬프트 노출 확인.

## 6. App Store Connect

1. 새 앱 생성: 이름 TENTENS, 번들 `kr.tentens.app`, 언어 한국어.
2. **연령 등급**: 모의 도박(참가비/상금) 요소 → **17+** 로 설정(해당 문항 Yes).
3. **개인정보 처리방침 URL** 입력 (앱 내 privacy 페이지 URL).
4. **App Privacy**: 광고/추적용 식별자 수집 신고(AdMob), 이메일(계정) 등.
5. 스크린샷: **가로(landscape)** 6.7"/6.5"/5.5" + iPad. `store-assets/` 활용.
6. Export Compliance: 표준 암호화(HTTPS)만 사용 → 해당 문항 답변.

## 7. 아카이브 → 업로드 → 제출

```
Xcode → 상단 기기 "Any iOS Device (arm64)" 선택 → Product → Archive
→ Distribute App → App Store Connect → Upload
```
- TestFlight에서 내부 테스트로 푸시/광고 최종 확인.
- App Store Connect에서 빌드 선택 → 심사 제출.

## 심사 유의 (요약)

- **Guideline 4.2 (최소 기능)**: 단순 웹뷰로 보이면 리젝 위험. 네이티브 기능(푸시/광고/햅틱/가로고정)이 이를 완화. 필요 시 리뷰노트에 명시.
- **모의 도박**: 실제 현금 환전 없음(코인은 게임 내 재화)을 리뷰노트에 분명히 기재.
