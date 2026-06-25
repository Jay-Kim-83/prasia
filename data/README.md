# Prasia Data Layer — 변경 이력

## 2026-06-25 결사 이전 추적 시스템 추가

### 신규 파일

| 파일 | 설명 |
|------|------|
| `guild-tracker.js` | 결사 추적 핵심 모듈 |
| `tracker-routes.js` | Express REST API 라우터 |
| `guild_tracking.json` | 추적 중인 결사 목록 (초기 빈 상태) |
| `migration_candidates.json` | 이전 감지 대기/완료 목록 (초기 빈 상태) |

---

### 배경

프라시아 전기는 약 1~1.5개월 주기로 서버 이전이 발생한다.
이전 시 결사명 변경이 가능하므로 결사명만으로는 동일 결사 추적이 불가능하다.
**멤버(닉네임) 집합 교집합 비율**로 이전 후 동일 결사를 찾아내는 방식으로 구현했다.

---

### 동작 방식

1. `addTrackedGuild(guildName, world)` — 추적할 결사 등록, 현재 멤버 스냅샷 저장
2. 스케줄러(10분 주기) 랭킹 수집 후 아래 두 함수 호출 필요:
   - `syncMembers()` — 추적 결사 현재 멤버 목록 최신화
   - `runDetection()` — 이전 감지 실행
3. 감지 조건: 현재 멤버 수 < 마지막 멤버 수 × 30%
4. 감지 시 전체 랭킹에서 닉네임 일치율 15% 이상인 결사를 후보로 추출
5. 후보는 `migration_candidates.json`의 `pending`에 저장
6. 관리자가 `confirmMigration()` 또는 `dismissMigration()` 으로 처리

---

### 서버 연동

```js
// 라우터 마운트
app.use('/api/tracker', require('./data/tracker-routes'));

// 스케줄러에 추가 (기존 랭킹 수집 직후)
tracker.syncMembers();
tracker.runDetection();
```

---

### API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/tracker/guilds` | 추적 결사 목록 |
| GET | `/api/tracker/guilds/:id` | 결사 상세 + 이전 히스토리 |
| POST | `/api/tracker/guilds` | 결사 추적 등록 `{ guildName, world }` |
| DELETE | `/api/tracker/guilds/:id` | 추적 해제 |
| GET | `/api/tracker/pending` | 이전 감지 대기 목록 |
| POST | `/api/tracker/pending/:id/confirm` | 이전 확정 `{ candidateIndex }` |
| POST | `/api/tracker/pending/:id/dismiss` | 이전 기각 |
| POST | `/api/tracker/detect` | 수동 감지 실행 |
| POST | `/api/tracker/sync` | 수동 멤버 동기화 |

---

### 특이사항

- 직업(job) 변경된 멤버는 닉네임 기준으로 매칭 후 `jobChanges` 필드에 별도 표시
- `guild-tracker.js`의 `DATA_DIR`은 현재 `__dirname` (= `data/` 폴더)
  - 파일 위치 변경 시 `DATA_DIR` 경로 수정 필요
- `crypto.randomUUID()` 사용 — Node.js 14.17+ 필요
