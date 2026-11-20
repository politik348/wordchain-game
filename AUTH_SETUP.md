# 모여게임즈 회원제 운영 안내

이 프로젝트에서 **싱글 플레이(고양이 대전·게임지옥·테트리스 싱글·로직)**는 회원가입 없이 이용할 수 있습니다. 친구와의 온라인 게임방(모여마블 온라인 포함), 모여마블 같은 기기 로컬 대전은 회원가입·로그인이 필요합니다.

## 사전 필수 설정

운영자는 Render 대시보드의 웹서비스 **Environment**에 다음 값을 직접 등록해야 합니다. 비밀값을 GitHub 코드, ZIP 또는 채팅으로 전달하지 마세요.

| 환경변수 | 설명 |
|---|---|
| `MOYEO_ADMIN_KEY` | 운영자만 아는 충분히 긴 무작위 인증키(24자 이상). 예: 로컬 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 명령으로 생성. 생성된 실제 값을 채팅/깃허브에 올리지 마세요. |
| `DATABASE_URL` | Render Postgres 등 **영구 PostgreSQL 연결 문자열**. 권장. |
| `AUTH_STORE_PATH` | **대안**: PostgreSQL을 사용하지 않을 때, 영구 디스크에 있는 JSON 파일의 절대 경로. 예: `/var/data/moyeo-accounts.json` (실제 디스크 마운트가 존재해야 함). |
| `DATABASE_SSL` | PostgreSQL 연결에 TLS가 필요한 경우 `require` (인증서 검증 활성화). |

`DATABASE_URL`이 있으면 PostgreSQL이 우선합니다. 두 저장소 변수가 모두 없으면 회원가입·로그인은 503으로 비활성화되고, 방 API는 로그인 필요(401)로 차단됩니다.

**주의:** 현재 `render.yaml` 웹서비스는 Render의 `free` 플랜입니다. Render 무료 웹서비스의 **로컬 파일은 재시작·재배포 때 유지되지 않으며 영구 디스크를 연결할 수 없습니다.** 따라서 `AUTH_STORE_PATH`를 무료 웹서비스 내부 경로에 설정하는 것은 해결책이 아닙니다. 무료 환경에서는 외부 영구 DB를 연결하세요. 무료 PostgreSQL도 서비스 기간·만료 제한이 있을 수 있으므로 Render의 현재 정책을 확인하세요. 계정·발급번호·비밀번호 해시가 유실되면 로그인이 불가능합니다.

## Render 배포: 데이터베이스 연결 (필수)

GitHub에 있는 `render.yaml`에는 웹서비스 `wordchain-game`, PostgreSQL `moyeo-accounts`, 그리고 데이터베이스의 내부 연결 문자열을 `DATABASE_URL`에 주입하는 Blueprint 설정이 포함되어 있습니다.

**중요:** GitHub에 `render.yaml`을 커밋하는 것만으로 이미 Render 대시보드에서 개별 생성한 웹서비스에 PostgreSQL이 자동 생성되지는 않습니다. 기존 서비스를 Blueprint로 관리하는 경우에만 Blueprint 동기화에서 이 설정이 반영됩니다. 현재 운영 중인 Render 서비스에서는 다음 절차가 가장 확실합니다.

1. Render 대시보드의 **New → Postgres**에서 기존 게임 웹서비스와 **동일 리전**에 데이터베이스를 생성합니다.
2. 데이터베이스의 **Internal Database URL**을 복사합니다. 이 값에는 계정 비밀번호가 포함되어 있으므로 공개하지 않습니다.
3. **기존** `wordchain-game` 웹서비스의 **Environment**에서 `DATABASE_URL` 값을 해당 URL로 설정합니다. 앞서 설정한 `MOYEO_ADMIN_KEY` (24자 이상)도 유지합니다.
4. **Save, rebuild, and deploy**로 재배포합니다.
5. `https://wordchain-game-0nb3.onrender.com/api/auth/me`에서 `storageConfigured: true` 및 `invitesEnabled: true`인지 확인합니다. 이 값들은 환경변수 존재 여부만 검증하며 실제 PostgreSQL 접속 성공을 증명하지는 않습니다. 마지막으로 `/admin.html`에서 실제 번호를 발급해 연결 상태를 확인합니다.

Blueprint로 **새로운 인프라를 생성**하는 경우에는 `render.yaml`을 선택하여 생성·동기화하고, `MOYEO_ADMIN_KEY` 비밀값은 Render에서 직접 입력합니다. 기존 서비스가 이미 있다면 중복 서비스가 만들어지지 않도록 리소스 이름과 Blueprint 소속을 먼저 확인하세요.

**비용·보존 주의:** 여기 포함된 `moyeo-accounts`의 `plan: free`는 시험용입니다. Render 무료 PostgreSQL은 생성 후 30일에 만료되므로 실제 회원 정보의 장기 보존에는 적합하지 않습니다. 실제 공개 서비스는 만료되지 않는 유료 Postgres 또는 지속형 외부 PostgreSQL로 교체하고, 백업 정책도 마련해야 합니다.

## 가입번호 발급 (운영자)

1. 환경변수를 설정한 뒤 사이트의 `/admin.html`로 이동합니다.
2. `MOYEO_ADMIN_KEY`와 가입시킬 사람의 **정확한 드립대학 닉네임**을 입력합니다.
3. (선택) 운영자가 정한 **4자리 숫자**를 입력하거나 비워 두고 무작위 번호를 발급합니다.
4. 화면에 표시된 번호를 **해당 사용자에게 비공개로 전달**합니다. 코드 원문은 저장하지 않으며 발급 후 다시 조회할 수 없습니다.

닉네임별로 하나의 유효한 4자리 번호를 발급할 수 있습니다. 번호는 14일 후 만료되고 가입 시 소진됩니다. **다시 발급하면 이전 번호는 즉시 무효화**됩니다. 같은 닉네임으로 중복 가입할 수 없습니다. 코드를 알고 있다고 해서 드립대학의 실제 계정을 자동으로 소유 인증하는 것은 아닙니다. 운영자가 드립대학 닉네임을 확인하고 그 사람에게 직접 전달해야 합니다.

## 가입·로그인 (사용자)

1. 홈페이지 오른쪽 위 `로그인 / 회원가입` 클릭 → `회원가입`.
2. **드립대학 닉네임과 운영자가 준 4자리 번호** 입력 후 확인.
3. 인증 성공 시 10분 동안 유효한 회원가입 진행 권한으로 `아이디`(영문 시작 4~20자), `비밀번호`(10~128자) 작성.
4. 계정 생성 후 즉시 로그인되고, 게임방 만들기·입장하기가 활성화됩니다.
5. 이후 일반적인 아이디·비밀번호로 로그인할 수 있습니다. 세션은 최대 7일입니다. 로그아웃하면 해당 쿠키는 폐기되고 서버 세션도 취소됩니다.

비밀번호는 무작위 salt와 **scrypt 해시**로 저장합니다. 인증번호는 관리자 비밀키 기반 HMAC 해시만 저장합니다. 가입 확인·로그인 요청에는 횟수 제한을 적용하며 세션 쿠키는 `HttpOnly; SameSite=Lax`와 프로덕션 `Secure` 속성이 적용됩니다. 서버는 방 생성·입장·행동·조회 및 SSE·WebSocket, 모여마블 API에서 세션 계정과 플레이어 ID의 일치를 검증합니다.

## 설치와 로컬 실행

```bash
npm install
export MOYEO_ADMIN_KEY="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
export AUTH_STORE_PATH="./.local-moyeo-accounts.json"
npm start
```

`/admin.html`에서 가입 코드를 발급하여 가입→로그인→게임방 생성 흐름을 테스트할 수 있습니다. 실제 배포에는 PostgreSQL 또는 **실제 영구 디스크**를 사용해야 합니다. `.local-moyeo-accounts.json`과 관리자 키는 Git에 커밋하지 마세요.

## 게임 타이머 변경

- 온라인 게임들은 서버의 `Date.now()` 데드라인을 기준으로 돌아갑니다.
- 게임지옥의 시간제 모드는 탭을 떠나도 시간이 흐릅니다. **사용자가 직접 누르는 일시정지**는 여전히 유지합니다.
- 테트리스는 실제 경과시간으로 낙하와 고양이 AI를 따라잡도록 하며, 2분 넘게 반응이 없으면 해당 게임이 종료될 수 있습니다.
- 모여로직은 제한시간이 없는 퍼즐이므로 탭을 전환해도 진행 상태가 그대로 유지됩니다.
