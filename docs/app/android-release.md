# 안드로이드 릴리스(서명·AAB) 빌드 가이드

> 디버그 실행은 [android-build.md](android-build.md) 참고. 이 문서는 **스토어 업로드용 서명 AAB** 절차.

## 1. Play App Signing 개념 (권장)

구글플레이는 **Play App Signing** 을 권장한다:
- **앱 서명 키**: 구글이 보관·관리 (분실 위험 제거).
- **업로드 키**: 내가 만들어 AAB 에 서명 → 구글이 검증 후 앱 서명 키로 재서명.
- 즉 아래에서 만드는 키스토어는 **업로드 키**다. (분실해도 구글 지원으로 재설정 가능)

## 2. 업로드 키스토어 생성

```bash
keytool -genkey -v \
  -keystore tentens-upload.keystore \
  -alias tentens-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```
- 비밀번호·별칭을 **안전하게 보관**(비밀번호 매니저). 분실 시 새 업로드 키 등록 필요.
- ⚠️ **키스토어 파일과 비밀번호는 git 에 커밋 금지.** (아래 gitignore)

## 3. 서명 설정 (gitignore + keystore.properties)

`android/keystore.properties` (gitignore 대상) 생성:
```properties
storeFile=/절대경로/tentens-upload.keystore
storePassword=****
keyAlias=tentens-upload
keyPassword=****
```

`android/app/build.gradle` 에 서명 설정 추가(요지):
```gradle
def keystoreProps = new Properties()
def keystoreFile = rootProject.file("keystore.properties")
if (keystoreFile.exists()) { keystoreProps.load(new FileInputStream(keystoreFile)) }

android {
  signingConfigs {
    release {
      if (keystoreFile.exists()) {
        storeFile file(keystoreProps['storeFile'])
        storePassword keystoreProps['storePassword']
        keyAlias keystoreProps['keyAlias']
        keyPassword keystoreProps['keyPassword']
      }
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled false   // 웹뷰 래퍼라 네이티브 코드 최소
    }
  }
}
```

`.gitignore` 에 추가할 항목:
```
android/keystore.properties
*.keystore
*.jks
```

## 4. 버전 관리

`android/app/build.gradle` 의 `defaultConfig`:
- `versionCode` : 정수, **업로드마다 반드시 증가** (1, 2, 3…).
- `versionName` : 표시용 문자열 (예: "1.0.0").

## 5. AAB 빌드

**Android Studio**: Build → Generate Signed Bundle / APK → **Android App Bundle** → 키스토어 선택 → release → 완료.

또는 CLI:
```bash
cd android
./gradlew bundleRelease
# 산출물: android/app/build/outputs/bundle/release/app-release.aab
```

이 `.aab` 를 플레이 콘솔에 업로드한다. (체크리스트: [play-store-checklist.md](play-store-checklist.md))

## 참고
- 방식 A(원격 URL)라 릴리스 빌드도 `https://www.tentens.kr` 를 로드한다. 웹 변경은 재빌드 없이 반영.
- 앱 아이콘은 아직 기본값 → 출시 전 브랜드 아이콘 교체 필요(Android Studio Image Asset).
