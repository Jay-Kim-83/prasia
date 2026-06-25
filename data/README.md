# Prasia Data Layer — 변경 이력

## 2026-06-25 결사 이전 추적 시스템 (자동 스냅샷 방식)

### 신규 파일

| 파일 | 설명 |
|------|------|
| `guild-tracker.js` | 결사 추적 핵심 모듈 |
| `tracker-routes.js` | Express REST API 라우터 |
| `guild_snapshot.json` | 전체 결사 스냅샷 (런타임 생성, gitignored) |
| `guild_tracking.json` | 확정된 이전 히스토리 (런타임 생성, gitignored) |
| `migration_candidates.json` | 이전 감지 대기/완료 목록 (런타임 생성, gitignored) |

---

### 배경

프라시아 전기는 약 1~1.5개월 주기로 서버 이전이 발생한다.
이전 시 결사명 변경이 가능하므로 결사명만으로는 동일 결사 추적이 불가능하다.
**전체 결사 스냅샷 → 멤버 닉네임 집합 교집합 비율**로 이전 후 동일 결사를 탐지하는 방식으로 구현했다.

---

### 동작 방식

1. 스케줄러(10분 주기) 랭킹 수집 후 자동 호출:
   - `syncMembers()` — 전체 결사 스냅샷 저장 (= snapshotAllGuilds)
   - `runAutoDetection()` — 스냅샷 vs 현재 랭킹 비교, 이전 감지
2. 감지 조건: 현재 멤버 수 < 마지막 스냅샷 멤버 수 × 30%
3. 후보 조건: 닉네임 일치율 15% 이상인 결사를 candidates로 추출
4. 후보는 `migration_candidates.json`의 `pending`에 저장
5. 관리자 화면(결사 추적 카드)에서 확정/기각 처리

---

### 서버 연동 (server.js)

```js
const tracker = require('./data/guild-tracker');
app.use('/api/tracker', require('./data/tracker-routes'));

// runScrape() 내부, scrapeRankings() 직후:
try { tracker.syncMembers(); tracker.runAutoDetection(); } catch(e) { console.error('[Tracker]', e.message); }
```

---

### API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/tracker/status` | 스냅샷 정보 (갱신시각, 결사 수) |
| GET | `/api/tracker/pending` | 이전 감지 대기 목록 |
| GET | `/api/tracker/confirmed` | 확정된 이전 히스토리 |
| POST | `/api/tracker/pending/:id/confirm` | 이전 확정 `{ candidateIndex }` |
| POST | `/api/tracker/pending/:id/dismiss` | 이전 기각 |
| POST | `/api/tracker/detect` | 수동 감지 실행 |
| POST | `/api/tracker/snapshot` | 수동 스냅샷 저장 |

---

### 특이사항

- 직업(job) 변경된 멤버는 닉네임 기준으로 매칭 후 `jobChanges` 필드에 별도 표시
- `crypto.randomUUID()` 사용 — Node.js 14.17+ 필요
- 런타임 데이터 파일 3종은 .gitignore에 포함되어 있어 서버 기동 시 자동 생성됨
