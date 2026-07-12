# TENTENS 출시 체크리스트

앱 스토어 배포까지 남은 작업. `[x]` 완료 / `[ ]` 남음 / `(확인)` 상태 점검 필요.

## 0. 공통 (먼저)

- [ ] 로컬 커밋 전부 `git push origin main`
- [ ] **웹 재배포** — 앱이 `tentens.kr`를 로드하므로, 스크롤·리더보드 코인·티어·세이프에어리어·광고 로직이 웹에 올라가야 앱에 반영됨
- [x] 코드/기능 완성 및 실기기 검증 (게임·점수·스크롤·아이콘·스플래시)
- [x] AdMob 테스트 광고 노출 확인 (rewarded)
- (확인) AdMob 계정 승인 대기 → 승인 후 실광고 서빙 (출시 무관, 대기만)
- (확인) `app-ads.txt` 게시 완료 → 스토어 게시 후 자동 인증

## iOS (App Store)

### 네이티브 / 푸시
- [x] `cap add ios` + 웹 원격 URL 래퍼 구성
- [x] Firebase iOS 앱 등록 + `GoogleService-Info.plist` 추가
- [x] Info.plist(AdMob/ATT/SKAdNetwork/가로모드) + AppDelegate `FirebaseApp.configure()`
- [x] 서명 팀 설정, Push Notifications capability
- [x] 앱 아이콘 1024, 스플래시 교체
- [ ] **APNs `.p8` 발급 → Firebase Cloud Messaging 업로드** (푸시 실동작 조건)
- [ ] 실기기에서 푸시 수신 최종 확인

### 스토어 제출
- [ ] Xcode 버전/빌드번호 설정 → **Archive → App Store Connect 업로드**
- [ ] App Store Connect 앱 레코드 생성 (이름/부제/카테고리)
- [ ] **연령 등급 17+** (모의 도박 문항 Yes)
- [ ] 개인정보 처리방침 URL (`tentens.kr/privacy`)
- [ ] **App Privacy 라벨** (광고·추적 식별자, 계정 이메일)
- [ ] **가로 스크린샷** (6.7"/6.5" + iPad)
- [ ] Export Compliance (HTTPS 표준 암호화만)
- [ ] **심사 노트**: 코인=게임내 재화(현금 환전 없음) + 네이티브 기능(4.2 대비)
- [ ] TestFlight 내부 테스트 → **심사 제출**

## Android (Play Store)

### 네이티브 / 푸시
- [x] AdMob 앱 ID(Manifest), google-services.json
- [ ] 플러그인 교체 반영: `cap sync android` → 재빌드 → **푸시 재테스트**
- [ ] **서명 keystore로 release AAB 생성** (Android Studio → Generate Signed Bundle) — 업로드 키 안전 보관

### 스토어 제출
- [ ] Play Console 앱 생성 + 스토어 등록정보 (설명, 아이콘 512, 피처 그래픽, 스크린샷)
- [ ] **콘텐츠 등급 설문** (모의 도박)
- [ ] **데이터 안전** 양식 (광고 식별자 수집)
- [ ] 대상 API 레벨 확인
- [ ] 개인정보 처리방침 URL
- [ ] 내부 테스트 → **프로덕션 심사 제출**

## 지금 당장 병목

1. **APNs `.p8` 업로드** (iOS 푸시)
2. **Android release AAB 서명**
3. 스토어 콘솔 입력 (등급/개인정보/스크린샷/심사노트)

> 제가 초안 만들 수 있는 것: 심사 노트 문구, App Privacy/데이터 안전 답변표, 스토어 설명(한/영).
