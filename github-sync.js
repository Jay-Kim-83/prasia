/**
 * GitHub Contents API를 통한 data/*.json 동기화
 *
 * 환경변수:
 *   GITHUB_TOKEN  – repo 권한이 있는 Personal Access Token
 *   GITHUB_REPO   – "owner/repo" 형식 (예: Jay-Kim-83/Prasia)
 *   GITHUB_BRANCH – 데이터 저장 브랜치 (기본: data)
 */
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const REPO   = process.env.GITHUB_REPO   || '';
const TOKEN  = process.env.GITHUB_TOKEN  || '';
const BRANCH = process.env.GITHUB_BRANCH || 'data';

const DATA_DIR = path.join(__dirname, 'data');

// 동기화 대상 파일
const SYNC_FILES = ['rankings.json', 'schedule.json', 'meta.json', 'config.json'];

function isEnabled() {
  return !!(REPO && TOKEN);
}

// ── GitHub API 요청 ──────────────────────────────────────────────
function ghRequest(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const req = https.request({
      hostname: 'api.github.com',
      path:     apiPath,
      method,
      headers: {
        'Authorization':  `token ${TOKEN}`,
        'User-Agent':     'Prasia-Server',
        'Accept':         'application/vnd.github.v3+json',
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('GitHub API timeout')); });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── data 브랜치 존재 확인 & 생성 ─────────────────────────────────
async function ensureBranch() {
  // 브랜치 존재 확인
  const check = await ghRequest('GET', `/repos/${REPO}/branches/${BRANCH}`);
  if (check.status === 200) return;

  // main 브랜치의 최신 SHA 가져오기
  const main = await ghRequest('GET', `/repos/${REPO}/git/refs/heads/main`);
  if (main.status !== 200) throw new Error('main 브랜치를 찾을 수 없습니다.');

  const sha = main.body.object.sha;
  const create = await ghRequest('POST', `/repos/${REPO}/git/refs`, {
    ref: `refs/heads/${BRANCH}`,
    sha,
  });
  if (create.status === 201) {
    console.log(`[GitHub] '${BRANCH}' 브랜치 생성 완료`);
  } else {
    console.log(`[GitHub] 브랜치 생성 응답: ${create.status}`);
  }
}

// ── 단일 파일 업로드 ─────────────────────────────────────────────
async function uploadFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const base64  = Buffer.from(content).toString('base64');
  const apiPath = `/repos/${REPO}/contents/data/${filename}`;

  // 기존 파일 SHA 가져오기 (업데이트 시 필요)
  let sha;
  const existing = await ghRequest('GET', `${apiPath}?ref=${BRANCH}`);
  if (existing.status === 200 && existing.body.sha) {
    sha = existing.body.sha;
  }

  const body = {
    message: `data: ${filename} 자동 업데이트`,
    content: base64,
    branch:  BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await ghRequest('PUT', apiPath, body);
  if (res.status === 200 || res.status === 201) {
    return true;
  } else {
    const msg = res.body?.message || JSON.stringify(res.body).substring(0, 200);
    console.error(`[GitHub] ${filename} 업로드 실패: ${res.status} - ${msg}`);
    return false;
  }
}

// ── 단일 파일 다운로드 ───────────────────────────────────────────
async function downloadFile(filename) {
  const apiPath = `/repos/${REPO}/contents/data/${filename}?ref=${BRANCH}`;
  const res = await ghRequest('GET', apiPath);

  if (res.status === 200 && res.body.content) {
    const content = Buffer.from(res.body.content, 'base64').toString('utf8');
    const filePath = path.join(DATA_DIR, filename);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// ── 공개 API ─────────────────────────────────────────────────────

/** 서버 시작 시: GitHub에서 데이터 다운로드 (항상 최신으로 덮어씀) */
async function pullAll() {
  if (!isEnabled()) return;
  try {
    await ensureBranch();
    let count = 0;
    for (const file of SYNC_FILES) {
      const ok = await downloadFile(file);
      if (ok) count++;
    }
    if (count > 0) console.log(`[GitHub] ${count}개 파일 복원 완료`);
    else console.log('[GitHub] 복원할 데이터 없음');
  } catch (e) {
    console.error('[GitHub] Pull 실패:', e.message);
  }
}

/** 데이터 변경 후: 변경된 파일을 GitHub에 업로드 */
async function pushFiles(filenames) {
  if (!isEnabled()) return;
  try {
    await ensureBranch();
    let count = 0;
    for (const file of filenames) {
      if (SYNC_FILES.includes(file)) {
        const ok = await uploadFile(file);
        if (ok) count++;
      }
    }
    if (count > 0) console.log(`[GitHub] ${count}개 파일 동기화 완료`);
  } catch (e) {
    console.error('[GitHub] Push 실패:', e.message);
  }
}

/** 모든 데이터 파일 업로드 */
async function pushAll() {
  if (!isEnabled()) return;
  try {
    await ensureBranch();
    let count = 0;
    for (const file of SYNC_FILES) {
      const ok = await uploadFile(file);
      if (ok) count++;
    }
    if (count > 0) console.log(`[GitHub] ${count}개 파일 전체 동기화 완료`);
  } catch (e) {
    console.error('[GitHub] Push 실패:', e.message);
  }
}

module.exports = { pullAll, pushFiles, pushAll, isEnabled };
