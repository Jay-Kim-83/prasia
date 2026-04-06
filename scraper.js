const puppeteer = require('puppeteer');
const fs    = require('fs');
const path  = require('path');
const https = require('https');

const DATA_FILE = path.join(__dirname, 'data', 'rankings.json');
const META_FILE = path.join(__dirname, 'data', 'meta.json');
const BASE_URL  = 'https://wp.nexon.com/records/ranking';
const API_URL   = 'https://wp-api.nexon.com/v1/GameData/gcranking';

// 월드 코드→이름 (페이지에서 동적으로 갱신됨)
let WORLD_CODE_MAP = {
  W01:'아우리엘', W02:'론도',    W03:'라인소프', W04:'시길',   W05:'아민타',
  W06:'로메네스', W07:'이오스',   W08:'가리안',   W09:'벨세이즈',W10:'사도바',
  W11:'제롬',     W12:'아티산',   W13:'엘렌',     W14:'나세르',  W15:'필레츠',
  W16:'타리아',   W17:'카렐',     W18:'나스카',   W19:'벤아트',  W20:'페넬로페',
  W21:'마커스',   W22:'르비안트', W23:'카시미르',  W24:'트렌체',  W25:'바이람',
  W26:'하이퍼부스팅', W27:'메르비스', W28:'레전드부스팅', W29:'올인원부스팅',
};

// class 영문→한글 (동적으로 갱신 가능)
let JOB_NAME_MAP = {
  'Enforcer':      '집행관',
  'MirageBlade':   '환영검사',
  'WildWarrior':   '야만투사',
  'AbyssRevenant': '심연추방자',
  'RuneScribe':    '주문각인사',
  'IncenseArcher': '향사수',
  'SolarSentinel': '태양감시자',
};

function loadMeta() {
  if (!fs.existsSync(META_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(META_FILE, 'utf8')); } catch { return {}; }
}
function saveMeta(meta) {
  fs.mkdirSync(path.dirname(META_FILE), { recursive: true });
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf8');
}

function resolveJob(v) {
  const s = String(v || '').trim();
  return JOB_NAME_MAP[s] || s || '-';
}

// 토벌등급: 숫자→한글 (동적 범위)
function resolveGrade(numStr) {
  const n = parseInt(numStr);
  if (isNaN(n)) return String(numStr || '-');
  if (n >= 24) return '신화';
  if (n >= 20) return '전설';
  if (n >= 16) return '영웅';
  if (n >= 12) return '희귀';
  return '일반';
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return { characters: [], lastUpdated: null, meta: {} };
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function saveData(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function extractList(body) {
  if (!body || typeof body !== 'object') return null;
  if (body.result && typeof body.result === 'object') {
    if (Array.isArray(body.result)) return body.result;
    for (const k of Object.keys(body.result)) {
      if (Array.isArray(body.result[k]) && body.result[k].length > 0) return body.result[k];
    }
  }
  if (Array.isArray(body) && body.length > 0) return body;
  for (const k of ['list', 'data', 'records', 'ranking', 'characters', 'items', 'gc']) {
    if (Array.isArray(body[k]) && body[k].length > 0) return body[k];
  }
  return null;
}

function normalizeItem(item, idx, worldName, realmLabel) {
  const gradeNum = item.string_map?.grade ?? item.grade ?? '';
  return {
    id:    idx + 1,
    rank:  Number(item.ranking ?? item.rank ?? idx + 1),
    nickname: String(item.gc_name ?? item.characterName ?? item.nickname ?? `캐릭터${idx + 1}`),
    job:   resolveJob(item.class ?? item.job ?? item.className),
    level: Number(item.gc_level ?? item.level ?? 0),
    world: worldName,
    realm: realmLabel,
    guild: String(item.guild_name ?? item.guild ?? ''),
    conquestGrade: resolveGrade(gradeNum),
  };
}

function postRequest(url, headers, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const urlObj  = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path:     urlObj.pathname,
      method:   'POST',
      headers: {
        ...headers,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: null }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(bodyStr);
    req.end();
  });
}

// ── 브라우저에서 토큰 + 월드 목록 동적 획득 ──────────────────────
async function fetchTokenAndWorlds() {
  console.log('[Scraper] 브라우저 실행 (토큰·월드 획득)...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  let token = null;
  let pageWorlds = {}; // { W02: '론도', ... }

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36');
    await page.setRequestInterception(true);
    page.on('request', req => {
      const auth = req.headers()['authorization'];
      if (req.url().includes('gcranking') && req.method() === 'POST' && auth && !token) {
        token = auth;
        console.log(`[Scraper] 토큰 획득: ${auth.substring(0, 30)}...`);
      }
      req.continue();
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 4000));

    // 페이지에서 월드 select 옵션 동적 읽기
    pageWorlds = await page.evaluate(() => {
      const result = {};
      document.querySelectorAll('select option').forEach(opt => {
        const val  = String(opt.value || '');
        const name = opt.textContent.trim();
        if (!val || !name) return;
        const code = val.replace(/^LIVE_/i, '').replace(/_R\d+$/, '').toUpperCase();
        if (/^W\d+$/.test(code) && !val.includes('_R')) result[code] = name;
      });
      return result;
    });

    if (Object.keys(pageWorlds).length > 0) {
      console.log(`[Scraper] 페이지에서 월드 ${Object.keys(pageWorlds).length}개 확인`);
      Object.assign(WORLD_CODE_MAP, pageWorlds);
    }

    await page.close();
  } finally {
    await browser.close();
  }

  return { token, pageWorlds };
}

// ── 메인 수집 ─────────────────────────────────────────────────────
async function scrapeRankings() {
  const { token, pageWorlds } = await fetchTokenAndWorlds();
  if (!token) {
    console.log('[Scraper] 토큰 획득 실패.');
    return null;
  }

  // 이전 메타에서 활성 월드 목록 로드, 없으면 기본값
  const prevMeta = loadMeta();
  const activeWorldCodes = prevMeta.activeWorldCodes ||
    ['W02','W03','W05','W08','W10','W11','W12','W14','W16','W27'];

  const headers = {
    'Authorization':   token,
    'x-wp-api-key':    'wp_fe_api_key',
    'Accept':          'application/json, text/plain, */*',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Origin':          'https://wp.nexon.com',
    'Referer':         'https://wp.nexon.com/',
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
  };

  const allCharacters = [];
  const discoveredWorlds   = new Set();
  const discoveredRealms   = new Map();  // worldCode → Set<realmLabel>
  const discoveredJobs     = new Set();
  const discoveredGrades   = new Set();

  // 렐름은 최대 10개까지 시도 (실제 없으면 빈 응답으로 스킵)
  const MAX_REALMS = 10;

  for (const worldCode of activeWorldCodes) {
    const worldName = WORLD_CODE_MAP[worldCode] || worldCode;
    let worldHasData = false;
    console.log(`\n[Scraper] 월드: ${worldName} (${worldCode})`);

    for (let r = 1; r <= MAX_REALMS; r++) {
      const realmLabel = `${worldName} ${String(r).padStart(2, '0')}`;
      const body = {
        world_id:       `LIVE_${worldCode}_R${r}`,
        world_group_id: `LIVE_${worldCode}`,
      };

      try {
        const res = await postRequest(API_URL, headers, body);
        if (res.status !== 200 || !res.body) continue;

        const list = extractList(res.body);
        if (!list || list.length === 0) {
          // 빈 응답 = 이 렐름 없음 → 루프 종료 (렐름은 연속적)
          if (r > 1) break; // r=1이 없으면 월드 전체 skip
          continue;
        }

        const chars = list.map((item, i) => normalizeItem(item, i, worldName, realmLabel));
        allCharacters.push(...chars);
        worldHasData = true;

        // 발견 정보 수집
        discoveredWorlds.add(worldCode);
        if (!discoveredRealms.has(worldCode)) discoveredRealms.set(worldCode, new Set());
        discoveredRealms.get(worldCode).add(realmLabel);
        chars.forEach(c => {
          discoveredJobs.add(c.job);
          discoveredGrades.add(c.conquestGrade);
        });

        console.log(`  ${realmLabel}: ${chars.length}명`);
      } catch (e) {
        console.log(`  ${realmLabel}: 오류 - ${e.message}`);
      }

      await new Promise(r => setTimeout(r, 150));
    }

    if (!worldHasData) console.log(`  → 데이터 없음 (비활성 또는 미존재)`);
  }

  if (allCharacters.length === 0) {
    console.log('\n[Scraper] 수집 실패.');
    return null;
  }

  // 메타 정보 저장 (동적 발견 결과)
  const realmMap = {};
  discoveredRealms.forEach((realms, code) => { realmMap[code] = [...realms].sort(); });

  const newMeta = {
    activeWorldCodes: [...discoveredWorlds],
    worldCodeMap: WORLD_CODE_MAP,
    realmMap,
    jobs: [...discoveredJobs].sort(),
    grades: [...discoveredGrades],
    jobNameMap: JOB_NAME_MAP,
    lastUpdated: new Date().toISOString(),
  };
  saveMeta(newMeta);
  console.log(`\n[Scraper] 발견: 월드 ${discoveredWorlds.size}개, 직업 ${discoveredJobs.size}종, 등급 ${discoveredGrades.size}종`);

  const data = {
    characters: allCharacters,
    lastUpdated: new Date().toISOString(),
    meta: { total: allCharacters.length, source: BASE_URL, isSample: false },
  };
  saveData(data);
  console.log(`[Scraper] 완료: 총 ${allCharacters.length}개 저장`);
  return data;
}

module.exports = { scrapeRankings, loadData, saveData, loadMeta, WORLD_CODE_MAP, JOB_NAME_MAP };