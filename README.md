# 프라시아 전기 랭킹 수집 & 검색 시스템

## 설치 및 실행

### 1. 필수 요구사항
- Node.js 18 이상
- Windows 10/11 (작업 스케줄러 사용 시)

### 2. 설치

```bash
npm install
npm install puppeteer  # 브라우저 자동화 (별도 설치)
```

> **주의**: `puppeteer` 설치 시 Chrome이 자동 다운로드됩니다 (약 150MB).

### 3. 서버 실행

```bash
node server.js
```

브라우저에서 `http://localhost:3000` 접속

### 4. 데이터 수집

**방법 A) 관리자 페이지에서 수집**
- `http://localhost:3000/admin.html` 접속
- "지금 수집 시작" 버튼 클릭

**방법 B) 명령줄에서 직접 수집**
```bash
node collect.js
```

**방법 C) Windows 작업 스케줄러**
- 관리자 CMD 열기
- 관리자 페이지 → "명령어 복사" → 붙여넣기 후 실행
- 이후 `node server.js` 없이도 자동 수집됨

## 구조

```
prasia-ranking/
├── server.js       # Express 서버 + 스케줄러
├── scraper.js      # Puppeteer 크롤러
├── collect.js      # CLI 수집 엔트리포인트
├── public/
│   ├── index.html  # 랭킹 검색 페이지
│   └── admin.html  # 관리자 페이지
└── data/
    ├── rankings.json   # 수집된 데이터
    └── schedule.json   # 스케줄 설정
```

## 포트 변경

```bash
PORT=8080 node server.js
```
