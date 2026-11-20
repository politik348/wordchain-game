# 모여게임즈 — 7종 실시간 웹게임

한국어 웹게임 포털 [드립대학게임즈](https://dripp.kro.kr/)의 공개적으로 설명된 게임 목록·규칙을 참고하여 **처음부터 독립적으로 작성한** 프로젝트입니다. 원본 서비스의 소스 코드·이미지·상표를 복사하거나 서버에 연결하지 않았으며, 외관/게임 룰이 완전히 동일하지는 않습니다.

## 구현된 게임

| 게임 | 인원 | 주요 기능 |
| --- | --- | --- |
| 가면단 (마피아) | 4~12명 | 마피아·경찰·의사·시민, 낮 토론/투표, 밤 행동, 승리 판정 |
| 오목 | 2명 | 15×15 대국, 승리 판정, **간소화된** 직선 쌍삼 검사, AI 연습 |
| 윷놀이 | 2~4명 | 주사위형 윷 던지기, 지름길, 말 잡기·업기, 네 말 완주. **전통 규칙 간소화** |
| 낙서왕 | 2~8명 | 화가/제시어 배정, 동기화 캔버스, 정답 채팅·득점, 라운드 |
| 도깨비 종 | 2~4명 | 자동 카드 공개, 종 치기, 짝·도깨비 규칙, 점수 |
| 라이어 게임 | 3~8명 | 비밀 역할/주제/제시어, 설명, 투표, 최후 추리 |
| 끝말잇기 | 2~10명 | 서버 단어 판정, 턴 타이머, 목숨, 점수/미션, AI 연습 |

> **정확한 한계**: 끝말잇기는 700여 개의 수작업 구성 단어 목록으로만 판정합니다. 표준국어대사전 전체가 아닙니다. 오목 금수/윷놀이는 간소화된 규칙입니다. 별도 회원가입·영구 전적·관전/재접속 동기화의 장기간 보장은 구현되지 않았습니다. 프로덕션에서는 영속 DB·다중 인스턴스 세션 스토어·악용 방지/레이트 리밋을 추가하는 것이 좋습니다.

## 로컬에서 실행하기

**Node.js 20 이상** 필요. 외부 라이브러리를 설치할 필요가 없습니다.

```bash
npm start
```

브라우저에서 **http://localhost:3000/** 접속. 친구와 테스트하려면 같은 주소를 서로 다른 브라우저/기기에서 열고 방을 생성한 후 코드를 공유하세요. 로컬 네트워크에서 사용하려면 서버 컴퓨터의 LAN IP와 포트 3000에 접근할 수 있어야 합니다.

```bash
npm test
```

자동 테스트는 방 생성·입장·준비·승리·비밀 정보 보호 등 주요 경로를 점검합니다.

## 인터넷에 배포하기: GitHub + Render

1. GitHub에서 새 저장소를 만듭니다. 이 폴더의 파일들을 올립니다.
2. Render 서비스(https://render.com/)에서 **New → Web Service → Git Provider**를 선택하고 저장소를 연결합니다.
3. `render.yaml` Blueprint로 만들거나 Node 서버를 직접 만들 때 **Build Command**를 `npm install`, **Start Command**를 `npm start`로 지정합니다.
4. 배포된 `https://...onrender.com` 주소를 친구에게 보내면 됩니다. 친구들도 동일한 Render 주소에 접속해야 실제 멀티플레이가 작동합니다.

Render 무료 플랜의 슬립·재시작은 게임방이 사라지는 원인이 될 수 있습니다. 안정적인 상시 서비스가 필요하면 유료 상시 호스팅과 데이터베이스를 사용하세요. 요금·플랜 정책은 Render 공식 사이트에서 확인하십시오.

### GitHub Pages와의 차이

GitHub Pages는 정적 파일만 배포하기 때문에 **실시간 방 생성 서버를 실행할 수 없습니다.** `public/`의 파일만 GitHub Pages에 올리면 메뉴 탐색과 AI 연습은 작동하지만, 인터넷 멀티플레이는 제공하지 않습니다. 온라인 대전까지 쓰려면 Node.js 서버 호스팅이 필요합니다.

## 폴더 구조

```text
moyeo-games/
├─ server.js           # 순수 Node HTTP + SSE 실시간 게임 서버
├─ data/words.js       # 내장 단어 및 제시어 목록
├─ public/
│  ├─ index.html       # SPA 진입점
│  ├─ styles.css       # 모바일 반응형 디자인
│  ├─ app.js           # 모든 화면과 게임 UI/AI
│  ├─ words.json       # 정적 AI 연습용 단어 목록
│  └─ favicon.svg
├─ test/games.test.mjs # 통합 테스트
├─ package.json
└─ render.yaml
```

## 참고 출처

- 원본 서비스 소개: https://dripp.kro.kr/
- 오목 규칙: https://dripp.kro.kr/games/omok
- 끝말잇기 규칙: https://dripp.kro.kr/games/wordchain
- 라이어 게임: https://dripp.kro.kr/games/liar
- 낙서왕: https://dripp.kro.kr/games/doodle
- 도깨비 종: https://dripp.kro.kr/games/bell
- 가면단: https://dripp.kro.kr/games/mafia
- 윷놀이: https://dripp.kro.kr/games/yut

모든 구현 코드는 본 프로젝트용으로 새로 작성되었습니다.

### Windows에서 더 쉽게 실행

Node.js 설치 후 `start-windows.bat`를 더블 클릭하면 로컬 서버가 실행되고 브라우저가 열립니다.
