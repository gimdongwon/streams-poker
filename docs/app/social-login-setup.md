# 소셜 로그인(Apple/Google) 설정 가이드 — Phase 2

> 코드는 모두 구현됨(서버 토큰검증 + 클라 플러그인 + 승격 모달 버튼). 아래 **외부 설정 + env**만
> 채우고 `NEXT_PUBLIC_SOCIAL_ENABLED=true` 로 켜면 동작한다. 설정 전에는 소셜 버튼이 숨겨지고
> 아이디/비번 승격으로 폴백되므로, 지금 배포해도 안전하다.

## 이미 구현된 것 (코드)
- 서버 `/api/auth/social`: Apple/Google **ID 토큰을 jose 로 검증**(provider 공개키 JWKS) →
  게스트를 같은 id 로 승격 / 이미 있으면 기존 계정 로그인(충돌, 병합 X) / 없으면 신규 생성.
- 클라 `src/lib/socialAuth.ts`: `@capgo/capacitor-social-login` 래퍼(네이티브 전용).
- `authStore.socialUpgrade(provider)`, `UpgradeAccountModal` 의 플랫폼별 버튼(iOS=Apple, Android=Google).
- 마이그레이션 `0010_social_identity.sql`: users.provider/provider_sub/email + 유니크 인덱스.

## 켜기 전 필수 작업

### 0) 마이그레이션
- Supabase SQL Editor 에서 `0010_social_identity.sql` 실행.

### 1) Google (Android)
- Google Cloud Console → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID:
  - **웹 애플리케이션** 클라이언트 생성 → **웹 클라이언트 ID** 확보 → env `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`
    (플러그인 serverClientId + 서버 검증 audience 로 사용)
  - **Android** 클라이언트 생성 → 패키지명 `kr.tentens.app` + **SHA-1**(디버그/릴리스 서명 인증서 모두) 등록
    - SHA 확인: `keytool -list -v -keystore <업로드키스토어> -alias <alias>`
- env 설정: `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=<웹 클라이언트 ID>` (Railway + 로컬 `.env.local`)

### 2) Apple (iOS)
- Apple Developer → App ID `kr.tentens.app` 에 **Sign in with Apple** capability 활성화.
- Xcode → App 타깃 → Signing & Capabilities → **+ Capability → Sign in with Apple** 추가.
- 네이티브 Apple 로그인 idToken 의 `aud` 는 번들 ID(`kr.tentens.app`) → 서버 기본값과 일치.
  (다르면 env `APPLE_AUDIENCE` 로 지정)

### 3) 네이티브 플러그인 반영
- 플러그인 설치됨(package.json). 네이티브 프로젝트에 반영: `npx cap sync` → 앱 재빌드.

### 4) 켜기
- env `NEXT_PUBLIC_SOCIAL_ENABLED=true` (Railway + 로컬). 그러면 승격 모달에 소셜 버튼 노출.

## env 요약
| 이름 | 용도 | 예시 |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` | 구글 로그인(클라 플러그인 + 서버 aud) | `xxxx.apps.googleusercontent.com` |
| `APPLE_AUDIENCE` | 애플 토큰 aud (선택, 기본 `kr.tentens.app`) | `kr.tentens.app` |
| `NEXT_PUBLIC_SOCIAL_ENABLED` | 소셜 버튼 노출 스위치 | `true` |

## 테스트 (실기기)
1. 게스트 상태 → 멀티 입구 → 소셜 버튼 → 로그인 → **같은 id 로 승격**(싱글 전적 유지) 확인.
2. 다른 기기에서 같은 소셜 계정 → **기존 계정으로 로그인**(충돌 처리, 게스트 진행 버려짐) 확인.
3. iOS: 첫 로그인 시 이름 저장 확인(이후엔 Apple 이 이름 미제공).

## 확인 필요 (핸드오프 열린 질문)
- `@capgo/capacitor-social-login` 응답 필드명(idToken/identityToken, profile.givenName 등) — 설치 버전 기준
  실기기에서 1회 확인. `src/lib/socialAuth.ts` 가 방어적으로 추출하지만 버전차 있으면 매핑 조정.
- iOS 4.8: 서드파티(구글) 제공 시 Apple 로그인 필수 → iOS 는 Apple 버튼을 기본 제공하도록 되어 있음.

## 알려진 후속(하드닝)
- 소셜 충돌로 기존 계정 로그인 시, 남은 게스트 행이 orphan 으로 남는다(무해하나 누적). 정리 배치 후순위.
- 소켓/방 직접 URL 진입의 서버측 게스트 차단(현재 클라 게이트).
