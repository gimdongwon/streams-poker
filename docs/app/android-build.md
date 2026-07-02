# 안드로이드 앱 빌드 가이드 (Capacitor)

> 방식 A: 원격 URL 웹뷰 래퍼. 웹뷰가 `https://www.tentens.kr` 를 로드한다.
> 앱 화면은 전부 그 사이트이고, 네이티브는 스플래시/상태바/뒤로가기/광고(추후)만 담당한다.
> 설정: [capacitor.config.ts](../../capacitor.config.ts)

## 이 저장소에 이미 되어 있는 것

- Capacitor 의존성 설치 (`@capacitor/core`, `app`, `status-bar`, `splash-screen`, `cli`, `android`)
- `capacitor.config.ts` — appId `kr.tentens.app`, appName `TENTENS`, `server.url = https://www.tentens.kr`
- `android/` 네이티브 프로젝트 스캐폴딩 완료
- 네이티브 동작 배선: [CapacitorBootstrap](../../src/components/common/CapacitorBootstrap.tsx) — 상태바/스플래시 해제/안드로이드 뒤로가기 (네이티브에서만 동작, 브라우저 no-op)

## 사전 준비 (이 작업은 사용자가 로컬에서)

이 머신에는 JDK/Android SDK/Android Studio가 없어 **빌드는 아래를 설치한 뒤** 진행한다.

1. **Android Studio 설치** — https://developer.android.com/studio
   설치 시 함께 들어오는 것: JDK(Embedded), Android SDK, 플랫폼 도구.
2. 실기기: **개발자 옵션 → USB 디버깅** 켜고 USB 연결. (또는 Android Studio의 에뮬레이터 생성)

## 빌드 · 실행 (디버그)

```bash
# 1) 웹 설정을 네이티브에 동기화 (설정/플러그인 바뀌면 매번)
npx cap sync android

# 2) Android Studio로 android/ 프로젝트 열기
npx cap open android
```

Android Studio에서:
- 상단 기기 선택에서 연결된 실기기/에뮬레이터 선택
- ▶ Run 버튼 → 앱이 설치되고 실행되며 `https://www.tentens.kr` 가 웹뷰에 뜬다.

> 기기에 인터넷이 필요하다(원격 URL 로드). 오프라인 시 `capacitor-webdir/index.html` 폴백만 보인다.

## 중요: 네이티브 동작은 사이트 재배포 후 반영

방식 A라 웹뷰는 **배포된** `tentens.kr` 를 로드한다. 따라서 `CapacitorBootstrap`(상태바/뒤로가기/스플래시 제어)는
**tentens.kr 에 이 프론트 변경이 배포되어야** APK 웹뷰에서 동작한다. APK 자체는 프론트 JS가 바뀌어도
다시 빌드할 필요 없이 최신 사이트를 로드한다 — 이게 방식 A의 장점이다.

`server.url` 만 로컬 개발 서버로 잠깐 바꿔 테스트하려면 `capacitor.config.ts` 의 url을
`http://<PC-LAN-IP>:3000` 으로 두고 `server.cleartext: true` 를 추가한 뒤 `npx cap sync` 한다. (테스트 후 원복)

## 앱 아이콘 / 스플래시 (출시 전 = 하위 프로젝트 ③)

현재는 Capacitor 기본 아이콘이다. 브랜드 아이콘 교체 방법:
- **간편**: Android Studio → `app` 우클릭 → New → Image Asset → 소스 이미지(브랜드 로고) 지정 → 밀도별 자동 생성.
- **자동화**: `@capacitor/assets`(1024² 아이콘 + 2732² 스플래시 소스 필요). 단 이 도구는 `sharp` 네이티브 빌드가 필요해
  현재 머신에선 설치 실패했다 — 빌드 툴체인(Xcode CLT/python) 정비 후 재시도 가능.

## 릴리스 빌드 (하위 프로젝트 ③에서)

- 서명 키스토어 생성 → `android/app` 서명 설정 → Build → Generate Signed Bundle (**AAB**) → 구글플레이 업로드.
- 상세는 스토어 출시 하위 프로젝트에서 다룬다.
