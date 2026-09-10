# At Sea :: dot PARTY

Canvas 2D로 만든 픽셀 아트 잠수·낚시 게임입니다. 프레임워크, 서버 API, 환경 변수 없이 실행하는 정적 사이트입니다.

## 폴더 구조

```text
site/
  index.html             # 게임 진입점
  404.html               # 없는 주소의 안내 화면
  _headers               # Pages 응답 헤더
  _redirects             # 기존 /atseadot.html 주소를 /로 연결
  apple-touch-icon.png   # Apple 홈 화면 아이콘 (180px)
  site.webmanifest       # Android 앱 이름·아이콘·시작 주소
  assets/
    css/style.css        # 화면 스타일
    js/game.js           # 게임 로직, 픽셀 도안, 번역 데이터
    fonts/                # Galmuri11 웹폰트와 OFL 라이선스
    favicon.svg
    icon-maskable.svg    # Android 마스크 적용용 원본
    icons/               # Apple·Android 기기별 PNG 아이콘
scripts/
  generate-icons.mjs     # SVG 원본에서 PNG 아이콘 재생성
package.json             # 로컬 실행·검증·배포 명령
package-lock.json         # Wrangler 의존성 버전 고정
wrangler.jsonc           # Pages 프로젝트와 배포 폴더 설정
.node-version            # Node.js 24
```

루트의 `atseadot.html`은 비교용 원본입니다. `.gitignore`로 제외했으며 배포 폴더에도 포함하지 않습니다. 이후 게임 수정은 `site/`에서 진행합니다.

## 로컬 실행

Node.js 22 이상이 필요하며, 이 프로젝트의 기본 버전은 Node.js 24입니다.

```sh
npm ci
npm run dev
```

브라우저에서 <http://127.0.0.1:8788>을 엽니다. Wrangler가 Pages의 정적 파일, 리다이렉트, 응답 헤더를 함께 실행합니다. 로컬 실행에는 Cloudflare 로그인이 필요하지 않습니다.

```sh
npm run build
```

별도의 번들 생성 과정은 없습니다. `build`는 JavaScript 구문 검사와 회귀 테스트를 실행하며, 배포 결과물은 이미 준비된 `site/`입니다. 테스트만 실행할 때는 `npm test`를 사용합니다.

## 한글 픽셀 글자

[Galmuri11](https://github.com/quiple/galmuri) 폰트를 프로젝트에 포함해 기기에 설치된 글꼴과 관계없이 같은 한글을 표시합니다. 원래 격자인 12px를 기준으로 그리며, 작은 글꼴의 번짐을 줄이기 위해 3배로 그린 뒤 픽셀 중심을 샘플링합니다. 최초 폰트 로딩은 최대 2초 기다리고, 지연되거나 실패하면 기본 글꼴로 게임을 시작합니다.

Retina 화면에서도 게임 픽셀을 정수 배율로 확대하며 입력 좌표를 같은 배율로 변환합니다. 한글 줄 간격과 메뉴 여백을 늘리고, 긴 기록은 의미 단위로 줄바꿈합니다. 폰트 출처, 모바일 미리보기와 검증 범위는 [검증 문서](docs/verification.md#모바일-한글-픽셀-글자)에 정리했습니다.

## 게임 조작과 저장

제목 화면은 메뉴를 직접 클릭하거나 방향키와 Enter로 선택합니다. 화면 너비가 1024px 이하인 모바일·태블릿 크기에서만 화면 아래에 가상 다이얼과 액션 버튼이 표시됩니다. 1025px 이상에서는 터치 지원 여부와 관계없이 숨깁니다. 왼쪽 다이얼을 밀어 8방향으로 이동하고, 바깥쪽으로 더 밀면 가속합니다. 오른쪽의 큰 액션 버튼은 손가락이 닿는 즉시 작동하므로 이동과 포획을 두 손가락으로 동시에 조작할 수 있습니다.

| 동작 | 키보드 | 터치 |
| --- | --- | --- |
| 이동·낚싯줄 깊이 조절 | 방향키, Shift로 가속 | 왼쪽 다이얼, 바깥쪽으로 밀기 또는 가속 버튼 |
| 그물·줄 던지기·챔질 | Space | 오른쪽 큰 액션 버튼 |
| 잠수부·배 전환 | Tab | 배 타기·잠수하기 |
| 도감·조작법 | D·H | 도감·더 보기 → 조작법 |
| 도움말 페이지 이동 | 방향키·Page Up/Down·Q/E | 다이얼 또는 창의 < > |
| 상세 카드 스크롤 | 위·아래 방향키, 휠 | 다이얼 위·아래 또는 카드 드래그 |
| 뒤로 | X·Esc | 뒤로 |
| 언어·일시정지·기타 기능 | L·P 등, 조작법 참고 | 더 보기 |

다이얼 가운데는 이동하지 않는 영역이며, 손을 떼거나 화면을 회전하면 중앙으로 돌아옵니다. 메뉴와 도감에서는 다이얼로 한 항목씩 이동합니다. 가로 화면은 다이얼·메뉴·액션을 좌우로 나란히 배치하고, 모든 버튼의 터치 영역은 최소 44px를 유지합니다.

입질 중에는 알림이 떠 있어도 포획 버튼을 누르면 바로 챔질합니다. 화면 크기 변경은 진행 중인 바다와 수심을 유지하며, 새 바다는 메뉴에서 새 게임을 시작하거나 `N`·`더 보기 → 새 바다`로 생성합니다.

수집 기록은 이 브라우저에 자동 저장됩니다. 손상된 저장 필드는 복구하고 정상 기록은 유지하며, 페이지를 닫거나 숨길 때 대기 중인 기록을 저장합니다. 수정 항목과 검증 결과는 [게임 검증 문서](docs/verification.md)에 정리했습니다.

## Apple·Android 홈 화면 아이콘

`favicon.svg`의 픽셀 아트와 색상을 유지한 PNG 아이콘을 제공합니다. `index.html`과 `404.html`에 Apple 아이콘 및 웹 앱 매니페스트를 연결했습니다.

| 용도 | 크기 | 파일 |
| --- | --- | --- |
| Apple 기본·iPhone | 180×180 | `site/apple-touch-icon.png` |
| iPad | 152×152, 167×167 | `site/assets/icons/apple-touch-icon-{크기}x{크기}.png` |
| Android 일반 | 192×192, 512×512 | `site/assets/icons/android-chrome-{크기}x{크기}.png` |
| Android 마스크 적용 | 192×192, 512×512 | `site/assets/icons/android-chrome-maskable-{크기}x{크기}.png` |

[Apple의 홈 화면 아이콘 설정](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)과 [웹 앱 매니페스트 안내](https://web.dev/learn/pwa/web-app-manifest)를 기준으로 구성했습니다. 마스크 적용용 원본은 물고기를 중앙 안전 영역 안에 배치해 원형이나 둥근 사각형으로 표시할 때도 잘리지 않도록 했습니다. 모든 PNG는 불투명 배경이며, 모서리는 기기에서 처리합니다.

원본 SVG를 수정한 뒤 다음 명령으로 PNG를 다시 생성합니다. 마스크 적용용 도안은 `site/assets/icon-maskable.svg`에서도 함께 수정합니다.

```sh
npm run icons:generate
```

생성된 PNG를 배포 파일에 포함하므로 일반 빌드에서는 다시 생성하지 않습니다. 홈 화면에 추가하면 `At Sea DOT` 이름과 아이콘을 사용하고 `/`에서 게임을 엽니다. 이 설정은 아이콘·실행 정보이며 오프라인 캐시는 포함하지 않습니다.

## Cloudflare Pages: Git 연동

이 프로젝트를 GitHub 또는 GitLab 저장소에 올리고 Cloudflare 대시보드의 **Workers & Pages → Create application → Pages → Import an existing Git repository**에서 연결합니다.

| 설정 | 값 |
| --- | --- |
| Framework preset | None |
| Production branch | 저장소의 기본 브랜치, 예: `main` |
| Root directory | 저장소 루트, 하위 폴더 지정 없음 |
| Build command | `npm run build` |
| Build output directory | `site` |
| 환경 변수 | 필요 없음 |

`wrangler.jsonc`의 프로젝트 이름은 `atseadot`입니다. 다른 이름의 Pages 프로젝트를 사용하면 이 파일의 `name`도 해당 이름으로 맞춥니다.

## Cloudflare Pages: 직접 업로드

대시보드의 직접 업로드를 사용하면 `site` 폴더를 업로드합니다. 로컬에서 빌드를 추가로 실행할 필요는 없습니다.

Wrangler로 업로드할 때는 먼저 로그인하고, 아직 프로젝트가 없다면 한 번 생성합니다.

```sh
npx wrangler login
npx wrangler pages project create atseadot --production-branch main
npm run deploy -- --branch main
```

이미 프로젝트가 있다면 생성 명령은 생략합니다. `deploy`는 검증 후 `wrangler.jsonc`에 지정된 `site` 폴더를 업로드합니다. 미리보기 배포에는 `--branch preview`처럼 별도 브랜치 이름을 사용합니다.

직접 업로드로 만든 프로젝트에 Git 자동 배포를 연결하려면 Git 연동 프로젝트를 새로 만들어야 합니다. 기존 Git 연동 프로젝트에는 Wrangler로 수동 배포할 수 있지만, 대시보드의 드래그 앤 드롭 업로드는 사용할 수 없습니다.

## 배포 확인

- `/`에서 게임 제목 화면이 표시되는지 확인합니다.
- 방향키와 Enter로 잠수·낚시를 시작하고, `D`로 도감을 엽니다.
- `/atseadot.html`과 `/atseadot`이 `/`로 이동하는지 확인합니다.
- 없는 주소에서는 404 안내가 표시됩니다.
- 언어·도감·수집 기록은 브라우저의 `localStorage`에 저장됩니다. 로컬 주소, 미리보기 주소, 실제 서비스 도메인은 각각 별도의 저장 공간을 사용합니다.

배포 파일에서 다운로드 시 삽입된 AdGuard 스크립트를 제거했습니다. 게임에 필요한 CSS, JavaScript, 아이콘은 모두 같은 사이트에서 제공합니다.

## 공식 문서

- [Pages 정적 HTML 배포](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)
- [Pages Wrangler 설정](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [Pages 직접 업로드](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Pages 리다이렉트](https://developers.cloudflare.com/pages/configuration/redirects/)
