#!/bin/sh
# Xcode Cloud: 클론 직후 실행 — node_modules 설치 + Capacitor iOS 동기화.
# (Capacitor iOS는 node_modules 내 로컬 SPM 패키지를 참조하므로 필수)
set -e

# Node 설치 (Xcode Cloud 이미지에 Homebrew 포함)
brew install node@20 2>/dev/null || brew install node
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci
npx cap sync ios
