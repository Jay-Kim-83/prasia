const express = require('express');
const cron    = require('node-cron');
const path    = require('path');
const fs      = require('fs');
const { scrapeRankings, loadData, loadMeta } = require('./scraper');
const github = require('./github-sync');

const app  = express();
const PORT = process.env.PORT || 3000;

const SCHEDULE_FILE = path.join(__dirname, 'data', 'schedule.json');
const CONFIG_FILE   = path.join(__dirname, 'data', 'config.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ── 로그 스트림 (SSE) ──────────────────────────────────────────
const logClients = new Set();
const logBuffer  = [];   // 마지막 200줄 보존
let   isScraping = false;

function emitLog(msg, type = 'log') {
  const entry = { time: new Date().toLocaleTimeString('ko-KR'), msg, type };
  logBuffer.push(entry);
  if (logBuffer.length > 200) logBuffer.shift();
  const data = `data: ${JSON.stringify(entry)}\n\n`;
  logClients.forEach(res => res.write(data));
}

// console.log를 SSE로도 중계
const _origLog = console.log.bind(console);
const _origErr = console.error.bind(console);
console.log   = (...a) => { _origLog(...a);  emitLog(a.join(' '), 'log');   };
console.error = (...a) => { _origErr(...a);  emitLog(a.join(' '), 'error'); };

// ── 설정 (관리자 + 사용자) ──────────────────────────────────────
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const def = { adminPassword: 'prasia1234', users: [] };
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(def, null, 2));
    return def;
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  if (!config.users) config.users = [];
  return config;
}
function saveConfig(config) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  github.pushFiles(['config.json']).catch(() => {});
}

// ── 스케줄 ────────────────────────────────────────────────────
let activeJob = null;
function loadSchedule() {
  if (!fs.existsSync(SCHEDULE_FILE)) return { type: 'none', interval: 6, isRunning: false };
  return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
}
function saveSchedule(s) {
  fs.mkdirSync(path.dirname(SCHEDULE_FILE), { recursive: true });
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(s, null, 2));
  github.pushFiles(['schedule.json']).catch(() => {});
}
function stopActiveJob() { if (activeJob) { activeJob.stop(); activeJob = null; } }
function startScheduler(config) {
  stopActiveJob();
  if (config.type === 'none' || !config.isRunning) return;

  let expr;
  const hour = parseInt(config.hour) || 0;
  const minute = parseInt(config.minute) || 0;

  if (config.type === 'daily') {
    expr = `${minute} ${hour} * * *`;
  } else if (config.unit === 'minute') {
    const startM = parseInt(config.startMinute) || 0;
    const intervalMin = Math.max(10, parseInt(config.interval) || 10);
    // 분 단위 반복: startMinute부터 interval분 간격 (명시적 목록)
    const mins = [];
    for (let m = startM; mins.length < 60; m = (m + intervalMin) % 60) {
      if (mins.includes(m)) break;
      mins.push(m);
    }
    mins.sort((a, b) => a - b);
    expr = `${mins.join(',')} * * * *`;
  } else {
    const startH = parseInt(config.startHour) || 0;
    const intervalH = Math.max(1, parseInt(config.interval) || 6);
    // 시간 단위 반복: startHour부터 interval시간 간격 (명시적 목록)
    const hrs = [];
    for (let h = startH; hrs.length < 24; h = (h + intervalH) % 24) {
      if (hrs.includes(h)) break;
      hrs.push(h);
    }
    hrs.sort((a, b) => a - b);
    expr = `0 ${hrs.join(',')} * * *`;
  }

  activeJob = cron.schedule(expr, async () => {
    if (isScraping) return;
    console.log(`[Scheduler] 자동 수집 시작`);
    await runScrape();
  });
  console.log(`[Scheduler] 등록: ${config.type} (${expr})`);
}

async function runScrape() {
  if (isScraping) { console.log('[Scraper] 이미 수집 중입니다.'); return; }
  isScraping = true;
  const startTime = Date.now();
  emitLog('── 수집 시작 ──', 'start');
  try {
    await scrapeRankings();
    // 수집 완료 후 모든 동적 파일 GitHub 동기화
    github.pushAll().catch(e => console.error('[GitHub] 동기화 오류:', e.message));
    const elapsed = Date.now() - startTime;
    const min = Math.floor(elapsed / 60000);
    const sec = Math.floor((elapsed % 60000) / 1000);
    const timeStr = min > 0 ? `${min}분 ${sec}초` : `${sec}초`;
    emitLog(`── 수집 완료 (${timeStr} 소요) ──`, 'done');
  } catch (e) {
    console.error('[Scraper] 오류:', e.message);
    const elapsed = Date.now() - startTime;
    const min = Math.floor(elapsed / 60000);
    const sec = Math.floor((elapsed % 60000) / 1000);
    const timeStr = min > 0 ? `${min}분 ${sec}초` : `${sec}초`;
    emitLog(`── 수집 실패 (${timeStr} 경과) ──`, 'error');
  } finally {
    isScraping = false;
    const doneData = `data: ${JSON.stringify({ type: 'complete' })}\n\n`;
    logClients.forEach(res => res.write(doneData));
  }
}

// ── 사용자 인증 ──────────────────────────────────────────────
function makeToken(id) { return Buffer.from(id + ':prasia_user').toString('base64'); }
function verifyAdminToken(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    if (!decoded.endsWith(':prasia')) return false;
    const pw = decoded.replace(/:prasia$/, '');
    const config = loadConfig();
    return pw === config.adminPassword;
  } catch {}
  return false;
}

function verifyUserToken(token) {
  if (!token) return null;
  // 관리자 토큰도 유효한 사용자로 인정
  if (verifyAdminToken(token)) return '_admin';
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const id = decoded.replace(/:prasia_user$/, '');
    if (!id || id === decoded) return null;
    const config = loadConfig();
    if (config.users.find(u => u.id === id)) return id;
  } catch {}
  return null;
}

function requireUser(req, res, next) {
  const token = req.headers['x-user-token'] || req.query.token;
  if (verifyUserToken(token)) return next();
  return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
}

// 사용자 로그인
app.post('/api/user/login', (req, res) => {
  const { id, password } = req.body;
  const config = loadConfig();
  const user = config.users.find(u => u.id === id);
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
  }
  res.json({ success: true, id: user.id, token: makeToken(user.id) });
});

// 사용자 인증 필요 여부 확인
app.get('/api/user/check', (req, res) => {
  const token = req.headers['x-user-token'] || req.query.token;
  const loggedIn = !!verifyUserToken(token);
  res.json({ requireLogin: true, loggedIn });
});

// ── 사용자 관리 (관리자 전용) ─────────────────────────────────
app.get('/api/users', (req, res) => {
  const config = loadConfig();
  res.json(config.users.map(u => ({ id: u.id })));
});

app.post('/api/users', (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력하세요.' });
  if (id.length < 2) return res.status(400).json({ success: false, message: '아이디는 2자 이상이어야 합니다.' });
  if (password.length < 4) return res.status(400).json({ success: false, message: '비밀번호는 4자 이상이어야 합니다.' });
  const config = loadConfig();
  if (config.users.find(u => u.id === id)) {
    return res.status(400).json({ success: false, message: '이미 존재하는 아이디입니다.' });
  }
  config.users.push({ id, password });
  saveConfig(config);
  res.json({ success: true });
});

app.delete('/api/users/:id', (req, res) => {
  const config = loadConfig();
  const idx = config.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
  config.users.splice(idx, 1);
  saveConfig(config);
  res.json({ success: true });
});

app.post('/api/users/:id/password', (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 4) return res.status(400).json({ success: false, message: '비밀번호는 4자 이상이어야 합니다.' });
  const config = loadConfig();
  const user = config.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
  user.password = password;
  saveConfig(config);
  res.json({ success: true });
});

// ── 활성 월드 관리 ───────────────────────────────────────────
app.get('/api/worlds', (req, res) => {
  const config = loadConfig();
  const meta = loadMeta();
  // 전체 월드 목록 (meta에서), 활성 월드 (config에서)
  const allWorlds = meta.worldCodeMap || {};
  const activeWorlds = config.activeWorlds || []; // 빈 배열 = 자동 감지
  res.json({ allWorlds, activeWorlds });
});

app.post('/api/worlds', (req, res) => {
  const { activeWorlds } = req.body;
  const config = loadConfig();
  config.activeWorlds = Array.isArray(activeWorlds) ? activeWorlds : [];
  saveConfig(config);
  res.json({ success: true });
});

// ── API ───────────────────────────────────────────────────────
app.get('/api/data', requireUser, (req, res) => res.json(loadData()));

app.get('/api/status', requireUser, (req, res) => {
  const data     = loadData();
  const schedule = loadSchedule();
  res.json({
    lastUpdated: data.lastUpdated,
    total:    data.meta?.total || data.characters?.length || 0,
    isSample: data.meta?.isSample || false,
    schedule, jobActive: !!activeJob, isScraping,
  });
});

app.get('/api/schedule', (req, res) => res.json(loadSchedule()));

app.post('/api/schedule', (req, res) => {
  const { type, interval, isRunning, hour, minute, unit, startHour, startMinute } = req.body;
  const s = {
    type, interval: parseInt(interval) || 6, isRunning: !!isRunning,
    hour: parseInt(hour) || 0, minute: parseInt(minute) || 0,
    unit: unit || 'hour',
    startHour: parseInt(startHour) || 0, startMinute: parseInt(startMinute) || 0,
  };
  saveSchedule(s);
  startScheduler(s);
  res.json({ success: true, schedule: s });
});

// 비밀번호 인증
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  const config = loadConfig();
  if (password === config.adminPassword) {
    res.json({ success: true, token: Buffer.from(password + ':prasia').toString('base64') });
  } else {
    res.status(401).json({ success: false, message: '비밀번호가 틀렸습니다.' });
  }
});

// 비밀번호 변경
app.post('/api/auth/change', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const config = loadConfig();
  if (oldPassword !== config.adminPassword) return res.status(401).json({ success:false, message:'현재 비밀번호가 틀렸습니다.' });
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ success:false, message:'새 비밀번호는 4자 이상이어야 합니다.' });
  config.adminPassword = newPassword;
  saveConfig(config);
  res.json({ success: true });
});

// SSE: 실시간 로그
app.get('/api/logs/stream', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  // 버퍼된 로그 먼저 전송
  logBuffer.forEach(entry => {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  });

  logClients.add(res);
  req.on('close', () => logClients.delete(res));
});

// 수집 실행
app.post('/api/collect', (req, res) => {
  if (isScraping) {
    return res.json({ success: false, message: '이미 수집 중입니다.' });
  }
  res.json({ success: true, message: '수집 시작됨' });
  runScrape();
});

app.get('/api/task-scheduler-cmd', (req, res) => {
  const nodePath    = process.execPath.replace(/\\/g, '\\\\');
  const collectPath = path.join(__dirname, 'collect.js').replace(/\\/g, '\\\\');
  res.json({ cmd: `schtasks /create /tn "PrasiaRanking" /tr "${nodePath} ${collectPath}" /sc daily /st 00:00 /f` });
});

// 서버 시작: GitHub에서 데이터 복원 후 스케줄러 시작
app.listen(PORT, async () => {
  await github.pullAll();
  const config = loadConfig();
  const schedule = loadSchedule();
  startScheduler(schedule);
  console.log(`\n🗡️  프라시아 전기 랭킹 서버 가동`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   관리자: http://localhost:${PORT}/admin.html`);
  console.log(`   초기 비밀번호: ${config.adminPassword}\n`);
});