const express = require('express');
const cron    = require('node-cron');
const path    = require('path');
const fs      = require('fs');
const { scrapeRankings, loadData, loadMeta } = require('./scraper');

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

// ── 비밀번호 설정 ──────────────────────────────────────────────
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const def = { adminPassword: 'prasia1234' };
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(def, null, 2));
    return def;
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
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
    const startH = parseInt(config.startHour) || 0;
    const startM = parseInt(config.startMinute) || 0;
    const intervalMin = Math.max(10, parseInt(config.interval) || 10);
    // 분 단위 반복: startMinute부터 interval분 간격
    expr = `${startM}-59/${intervalMin} * * * *`;
  } else {
    const startH = parseInt(config.startHour) || 0;
    const intervalH = Math.max(1, parseInt(config.interval) || 6);
    expr = `0 ${startH}-23/${intervalH} * * *`;
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

// ── API ───────────────────────────────────────────────────────
app.get('/api/data', (req, res) => res.json(loadData()));

app.get('/api/status', (req, res) => {
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
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
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
  res.json({ success: true, message: '수집 시작됨' });
  runScrape();
});

app.get('/api/task-scheduler-cmd', (req, res) => {
  const nodePath    = process.execPath.replace(/\\/g, '\\\\');
  const collectPath = path.join(__dirname, 'collect.js').replace(/\\/g, '\\\\');
  res.json({ cmd: `schtasks /create /tn "PrasiaRanking" /tr "${nodePath} ${collectPath}" /sc daily /st 00:00 /f` });
});

const schedule = loadSchedule();
startScheduler(schedule);

app.listen(PORT, () => {
  const config = loadConfig();
  console.log(`\n🗡️  프라시아 전기 랭킹 서버 가동`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   관리자: http://localhost:${PORT}/admin.html`);
  console.log(`   초기 비밀번호: ${config.adminPassword}\n`);
});