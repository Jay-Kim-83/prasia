const AUTH_KEY = 'prasia_admin_token';
let   evtSource = null;
let   isScraping = false;
let   waitingForComplete = false; // 수집 버튼 클릭 후 완료 대기 플래그
let   isMaster = false; // 마스터 비밀번호 로그인 여부

// admin 토큰을 X-User-Token으로 전송 (requireUser 미들웨어 통과용)
function adminFetch(url, opts = {}) {
  const token = localStorage.getItem(AUTH_KEY);
  if (token) {
    opts.headers = { ...opts.headers, 'X-User-Token': token };
  }
  return fetch(url, opts);
}

// ── 인증 ────────────────────────────────────────────────────────
async function checkAuth() {
  const token = localStorage.getItem(AUTH_KEY);
  if (token) {
    // 토큰이 여전히 관리자 권한인지 서버에서 확인
    try {
      const res = await fetch('/api/user/check', { headers: { 'X-User-Token': token } });
      const data = await res.json();
      if (data.loggedIn && data.isAdmin) {
        isMaster = !!data.isMaster;
        document.getElementById('loginOverlay').classList.add('hidden');
        initAdmin();
        return;
      }
      // 서버가 정상 응답했지만 권한 없음 → 토큰 제거
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // 서버 연결 실패(재배포 등) → 토큰 유지, 재시도
      console.log('[Auth] 서버 연결 실패, 5초 후 재시도');
      setTimeout(checkAuth, 5000);
    }
    return;
  }
}

async function doLogin() {
  const id  = document.getElementById('loginId').value.trim();
  const pw  = document.getElementById('pwInput').value;
  const err = document.getElementById('loginError');
  if (!pw) { err.textContent = '비밀번호를 입력하세요.'; return; }
  try {
    if (id) {
      // 계정 로그인 → 관리자 권한 확인
      const res = await fetch('/api/user/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: pw })
      });
      const data = await res.json();
      if (data.success) {
        if (!data.isAdmin) {
          err.textContent = '관리자 권한이 없는 계정입니다.';
          return;
        }
        isMaster = false;
        localStorage.setItem(AUTH_KEY, data.token);
        document.getElementById('loginOverlay').classList.add('hidden');
        initAdmin();
      } else {
        err.textContent = data.message || '로그인 실패';
      }
    } else {
      // 마스터 비밀번호 로그인
      const res = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw })
      });
      const data = await res.json();
      if (data.success) {
        isMaster = true;
        localStorage.setItem(AUTH_KEY, data.token);
        document.getElementById('loginOverlay').classList.add('hidden');
        initAdmin();
      } else {
        err.textContent = data.message || '비밀번호가 틀렸습니다.';
      }
    }
  } catch {
    err.textContent = '서버 연결 실패';
  }
}

function doLogout() {
  localStorage.removeItem(AUTH_KEY);
  location.reload();
}

// ── 자동 로그아웃 ──────────────────────────────────────────────
let autoLogoutTimer = null;
function startAutoLogout(minutes) {
  if (autoLogoutTimer) clearTimeout(autoLogoutTimer);
  if (!minutes || minutes <= 0) return;
  const ms = minutes * 60 * 1000;
  const reset = () => {
    if (autoLogoutTimer) clearTimeout(autoLogoutTimer);
    autoLogoutTimer = setTimeout(doLogout, ms);
  };
  ['click','keydown','scroll','mousemove','touchstart'].forEach(e => document.addEventListener(e, reset, { passive: true }));
  autoLogoutTimer = setTimeout(doLogout, ms);
}

// ── 초기화 ──────────────────────────────────────────────────────
let statusInterval = null;

async function initAdmin() {
    initCardCollapse();
    loadBossConfig();
  // 마스터가 아니면 마스터 전용 카드 비활성화
  if (!isMaster) {
    document.querySelectorAll('.master-only').forEach(el => el.classList.add('disabled'));
  }
  await loadStatus();
  loadLadderCode();
  connectLogStream();
  loadScheduleUI();
  loadCmd();
  loadUsers();
  loadWorlds();
  loadDisplay();
  loadBubbles();
  loadMyGuild();
  loadGuildTracker();
  // 자동 로그아웃 설정 가져오기
  try {
    const chk = await fetch('/api/user/check', { headers: { 'X-User-Token': localStorage.getItem(AUTH_KEY) } }).then(r => r.json());
    if (!chk.isMaster) startAutoLogout(chk.autoLogoutMin ?? 30);
  } catch {}
  // 현황 실시간 갱신 (10초마다)
  statusInterval = setInterval(loadStatus, 10000);
  initSidebar();
}

function initSidebar() {
  document.body.classList.toggle('is-master', isMaster);
  // 클릭 시 스크롤
  document.querySelectorAll('.sidebar-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.target;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('sidebar').classList.remove('open');
      }
    });
  });
  // 스크롤 위치에 따라 활성 카드 하이라이트 (화면 상단 기준 가장 위에 보이는 카드)
  const cards = [...document.querySelectorAll('.card[id]')];
  const OFFSET = 80; // 뷰포트 상단 오프셋
  function updateActive() {
    let active = cards[0];
    for (const c of cards) {
      const rect = c.getBoundingClientRect();
      if (rect.top - OFFSET <= 0) active = c;
      else break;
    }
    if (!active) return;
    document.querySelectorAll('.sidebar-item').forEach(b => {
      b.classList.toggle('active', b.dataset.target === active.id);
    });
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();
}

async function loadLadderCode() {
  try {
    const res = await adminFetch('/api/ladder/code');
    const d = await res.json();
    document.getElementById('statLadderCode').textContent = d.success ? d.code : '권한 없음';
  } catch {
    document.getElementById('statLadderCode').textContent = '오류';
  }
}

function copyLadderCode() {
  const code = document.getElementById('statLadderCode').textContent;
  if (!/^\d{6}$/.test(code)) return;
  navigator.clipboard.writeText(code).then(() => showToast('입장 코드가 복사되었습니다.'));
}

async function loadStatus() {
  try {
    const res  = await adminFetch('/api/status');
    const s    = await res.json();
    document.getElementById('statTotal').textContent = (s.total || 0).toLocaleString();
    document.getElementById('statSample').textContent = s.isSample ? '샘플 데이터' : '실제 데이터';
    if (s.lastUpdated) {
      const d = new Date(s.lastUpdated);
      document.getElementById('statDate').textContent = d.toLocaleDateString('ko-KR');
      document.getElementById('statTime').textContent = d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
    } else {
      document.getElementById('statDate').textContent = '없음';
    }
    const sch = s.schedule || {};
    let schedLabel = '-';
    if (sch.type === 'none') schedLabel = '비활성';
    else if (sch.type === 'daily') schedLabel = `매일 ${String(sch.hour||0).padStart(2,'0')}:${String(sch.minute||0).padStart(2,'0')}:${String(sch.second||0).padStart(2,'0')}`;
    else if (sch.type === 'hourly') {
      const start = `${String(sch.startHour||0).padStart(2,'0')}:${String(sch.startMinute||0).padStart(2,'0')}:${String(sch.startSecond||0).padStart(2,'0')}`;
      schedLabel = sch.unit === 'minute' ? `${start}부터 ${sch.interval}분마다` : `${start}부터 ${sch.interval}시간마다`;
    }
    document.getElementById('statSchedule').textContent = schedLabel;

    // 수집 상태: 서버가 수집 중이면 항상 반영
    if (s.isScraping) {
      isScraping = true;
      waitingForComplete = true;
      document.getElementById('statScraping').textContent = '⏳ 수집 중';
      updateCollectBtn(true);
      setFavicon('collecting');
    } else if (!waitingForComplete) {
      isScraping = false;
      document.getElementById('statScraping').textContent = '✅ 대기';
      updateCollectBtn(false);
    }
  } catch {}
}

// ── SSE 로그 스트림 ──────────────────────────────────────────────
function connectLogStream() {
  if (evtSource) evtSource.close();
  evtSource = new EventSource('/api/logs/stream');
  const area = document.getElementById('logArea');
  let buffering = true; // 초기 버퍼 로그 수신 중

  // 버퍼 로그가 모두 전송된 후 실시간 모드로 전환
  setTimeout(() => { buffering = false; }, 2000);

  evtSource.onmessage = (e) => {
    const data = JSON.parse(e.data);

    // 수집 완료 신호
    if (data.type === 'complete') {
      if (!buffering) {
        waitingForComplete = false;
        isScraping = false;
        document.getElementById('statScraping').textContent = '✅ 대기';
        updateCollectBtn(false);
        setFavicon('done');
        loadStatus();
      }
      return;
    }

    // 수집 시작 감지 (자동 수집 포함) — 버퍼 로그에서는 무시
    if (data.type === 'start' && !buffering) {
      waitingForComplete = true;
      isScraping = true;
      document.getElementById('statScraping').textContent = '⏳ 수집 중';
      updateCollectBtn(true);
      setFavicon('collecting');
    }

    // 로그 라인 추가
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `<span class="log-time">${data.time}</span><span class="log-msg ${data.type||''}">${esc(data.msg)}</span>`;
    area.appendChild(line);

    // 자동 스크롤 (최하단이면)
    if (area.scrollHeight - area.scrollTop < area.clientHeight + 60) {
      area.scrollTop = area.scrollHeight;
    }

    // 200줄 초과 시 앞 줄 제거
    while (area.children.length > 200) area.removeChild(area.firstChild);
  };
}

// ── 수집 ────────────────────────────────────────────────────────
async function collectNow() {
  if (isScraping || waitingForComplete) return;
  waitingForComplete = true;
  isScraping = true;
  updateCollectBtn(true);
  document.getElementById('statScraping').textContent = '⏳ 수집 중';

  try {
    const res = await fetch('/api/collect', { method:'POST' });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || '수집 요청 실패');
      waitingForComplete = false;
      isScraping = false;
      updateCollectBtn(false);
      document.getElementById('statScraping').textContent = '✅ 대기';
    }
  } catch {
    showToast('수집 요청 실패');
    waitingForComplete = false;
    isScraping = false;
    updateCollectBtn(false);
    document.getElementById('statScraping').textContent = '✅ 대기';
  }
}

function updateCollectBtn(scraping) {
  const btn     = document.getElementById('btnCollect');
  const spinner = document.getElementById('spinner');
  const txt     = document.getElementById('btnTxt');
  btn.disabled  = scraping;
  spinner.style.display = scraping ? 'block' : 'none';
  txt.textContent = scraping ? '수집 중...' : '🚀 지금 수집 시작';
}

// ── 스케줄 ──────────────────────────────────────────────────────
function buildTimeSelects() {
  // 시간 0~23
  const hourSels = ['dailyHour','startHour'];
  hourSels.forEach(id => {
    const sel = document.getElementById(id);
    for (let h=0; h<24; h++) {
      const o = document.createElement('option');
      o.value = h; o.textContent = String(h).padStart(2,'0');
      sel.appendChild(o);
    }
  });
  // dailyMinute: 00,10,20,...,50 / startMinute: 00~59
  ['dailyMinute'].forEach(id => {
    const sel = document.getElementById(id);
    for (let m=0; m<60; m+=10) {
      const o = document.createElement('option');
      o.value = m; o.textContent = String(m).padStart(2,'0');
      sel.appendChild(o);
    }
  });
  ['startMinute'].forEach(id => {
    const sel = document.getElementById(id);
    for (let m=0; m<60; m++) {
      const o = document.createElement('option');
      o.value = m; o.textContent = String(m).padStart(2,'0');
      sel.appendChild(o);
    }
  });
  // 초: 10초 간격
  ['dailySecond','startSecond'].forEach(id => {
    const sel = document.getElementById(id);
    for (let s=0; s<60; s+=10) {
      const o = document.createElement('option');
      o.value = s; o.textContent = String(s).padStart(2,'0');
      sel.appendChild(o);
    }
  });
  // 간격 초기: 시간
  buildIntervalOptions('hour');
}

function buildIntervalOptions(unit) {
  const sel = document.getElementById('intervalVal');
  sel.innerHTML = '';
  if (unit === 'minute') {
    [10,20,30,40,50].forEach(v => {
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      sel.appendChild(o);
    });
    document.getElementById('intervalLabel').textContent = '분마다';
  } else {
    for (let h=1; h<=12; h++) {
      const o = document.createElement('option');
      o.value = h; o.textContent = h;
      sel.appendChild(o);
    }
    document.getElementById('intervalLabel').textContent = '시간마다';
  }
}

function onUnitChange() {
  buildIntervalOptions(document.getElementById('intervalUnit').value);
}

async function loadScheduleUI() {
  buildTimeSelects();
  const res = await fetch('/api/schedule').then(r=>r.json());
  selectSchedByType(res.type || 'none');
  if (res.hour != null)  document.getElementById('dailyHour').value = res.hour;
  if (res.minute != null) document.getElementById('dailyMinute').value = res.minute;
  if (res.second != null) document.getElementById('dailySecond').value = res.second;
  if (res.startHour != null) document.getElementById('startHour').value = res.startHour;
  if (res.startMinute != null) document.getElementById('startMinute').value = res.startMinute;
  if (res.startSecond != null) document.getElementById('startSecond').value = res.startSecond;
  if (res.unit) {
    document.getElementById('intervalUnit').value = res.unit;
    buildIntervalOptions(res.unit);
  }
  if (res.interval) document.getElementById('intervalVal').value = res.interval;
}

function selectSched(el) {
  document.querySelectorAll('.sched-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const type = el.dataset.type;
  document.getElementById('dailyRow').style.display = type === 'daily' ? 'flex' : 'none';
  document.getElementById('hourlyRow').style.display = type === 'hourly' ? 'block' : 'none';
}

function selectSchedByType(type) {
  const el = document.querySelector(`.sched-card[data-type="${type}"]`);
  if (el) selectSched(el);
}

async function saveSchedule() {
  const type = document.querySelector('.sched-card.selected')?.dataset.type;
  if (!type) return showToast('유형을 선택해 주세요.');
  const body = { type, isRunning: type !== 'none' };
  if (type === 'daily') {
    body.hour = parseInt(document.getElementById('dailyHour').value) || 0;
    body.minute = parseInt(document.getElementById('dailyMinute').value) || 0;
    body.second = parseInt(document.getElementById('dailySecond').value) || 0;
  } else if (type === 'hourly') {
    body.startHour = parseInt(document.getElementById('startHour').value) || 0;
    body.startMinute = parseInt(document.getElementById('startMinute').value) || 0;
    body.startSecond = parseInt(document.getElementById('startSecond').value) || 0;
    body.unit = document.getElementById('intervalUnit').value;
    body.interval = parseInt(document.getElementById('intervalVal').value) || 6;
  }
  await fetch('/api/schedule', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  showToast('✅ 스케줄 저장됨');
  loadStatus();
}

async function stopSchedule() {
  await fetch('/api/schedule', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ type:'none', interval:6, isRunning:false }) });
  selectSchedByType('none');
  showToast('⏹ 스케줄 중지됨');
  loadStatus();
}

// ── 비밀번호 변경 ────────────────────────────────────────────────
async function changePw() {
  const old  = document.getElementById('pwOld').value;
  const nw   = document.getElementById('pwNew').value;
  const nw2  = document.getElementById('pwNew2').value;
  if (!old || !nw)  return showToast('모든 항목을 입력해 주세요.');
  if (nw !== nw2)   return showToast('새 비밀번호가 일치하지 않습니다.');
  const res  = await fetch('/api/auth/change', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ oldPassword:old, newPassword:nw }) });
  const data = await res.json();
  if (data.success) {
    showToast('✅ 비밀번호 변경 완료. 다시 로그인해 주세요.');
    localStorage.removeItem(AUTH_KEY);
    setTimeout(() => location.reload(), 2000);
  } else {
    showToast(data.message || '변경 실패');
  }
}

// ── 작업 스케줄러 ────────────────────────────────────────────────
async function loadCmd() {
  const res = await fetch('/api/task-scheduler-cmd').then(r=>r.json());
  document.getElementById('cmdText').textContent = res.cmd;
}
function copyCmd() {
  navigator.clipboard.writeText(document.getElementById('cmdText').textContent).then(() => showToast('📋 복사됨'));
}

// ── 표시 설정 ───────────────────────────────────────────────────
async function loadDisplay() {
  try {
    const data = await fetch('/api/display').then(r => r.json());
    document.getElementById('minLevel').value = data.minLevel || 0;
    document.getElementById('minConquestGrade').value = data.minConquestGrade || 0;
    const cb = document.getElementById('requireLogin');
    cb.checked = data.requireLogin !== false;
    updateLoginLabel();
    cb.addEventListener('change', updateLoginLabel);
    const totalMin = data.autoLogoutMin ?? 30;
    document.getElementById('autoLogoutHour').value = Math.floor(totalMin / 60);
    document.getElementById('autoLogoutMinute').value = totalMin % 60;
  } catch {}
}

function updateLoginLabel() {
  const on = document.getElementById('requireLogin').checked;
  const label = document.getElementById('requireLoginLabel');
  label.textContent = on ? '사용' : '해제';
  label.style.color = on ? 'var(--green)' : 'var(--red)';
}

async function saveDisplay() {
  const minLevel = parseInt(document.getElementById('minLevel').value) || 0;
  const minConquestGrade = parseInt(document.getElementById('minConquestGrade').value) || 0;
  const requireLogin = document.getElementById('requireLogin').checked;
  const h = parseInt(document.getElementById('autoLogoutHour').value) || 0;
  const m = parseInt(document.getElementById('autoLogoutMinute').value) || 0;
  const autoLogoutMin = h * 60 + m;
  await fetch('/api/display', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minLevel, minConquestGrade, requireLogin, autoLogoutMin })
  });
  showToast('✅ 표시 설정 저장됨');
}

// ── 월드 설정 ───────────────────────────────────────────────────
async function loadWorlds() {
  try {
    const data = await fetch('/api/worlds').then(r => r.json());
    const container = document.getElementById('worldCheckboxes');
    const allWorlds = data.allWorlds || {};
    const activeWorlds = data.activeWorlds || [];
    const codes = Object.keys(allWorlds).sort((a, b) => {
      const na = parseInt(a.replace('W', '')), nb = parseInt(b.replace('W', ''));
      return na - nb;
    });

    if (codes.length === 0) {
      container.innerHTML = '<div style="font-size:12px;color:var(--text-faint)">월드 정보가 없습니다. 먼저 수집을 실행하세요.</div>';
      return;
    }

    container.innerHTML = codes.map(code => {
      const name = allWorlds[code];
      const checked = activeWorlds.length === 0 || activeWorlds.includes(code);
      return `<label style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:12px;color:var(--text)">
        <input type="checkbox" value="${code}" class="world-cb" ${checked ? 'checked' : ''} onchange="syncSelectAll()">
        <span>${esc(name)}</span>
        <span style="color:var(--text-faint)">${code}</span>
      </label>`;
    }).join('');
    syncSelectAll();
  } catch {}
}

function toggleAllWorlds(checked) {
  document.querySelectorAll('.world-cb').forEach(cb => cb.checked = checked);
}

function syncSelectAll() {
  const all = document.querySelectorAll('.world-cb');
  const checkedCount = document.querySelectorAll('.world-cb:checked').length;
  const sa = document.getElementById('worldSelectAll');
  if (sa) { sa.checked = checkedCount === all.length; sa.indeterminate = checkedCount > 0 && checkedCount < all.length; }
}

async function saveWorlds() {
  const checked = [...document.querySelectorAll('.world-cb:checked')].map(cb => cb.value);
  const all = [...document.querySelectorAll('.world-cb')].length;
  // 전부 선택 = 자동 감지와 동일하므로 빈 배열로 저장
  const activeWorlds = checked.length === all ? [] : checked;
  await fetch('/api/worlds', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activeWorlds })
  });
  showToast(`✅ ${checked.length}개 월드 설정 저장됨`);
}

async function clearWorlds() {
  await fetch('/api/worlds', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activeWorlds: [] })
  });
  showToast('✅ 자동 감지로 초기화됨');
  loadWorlds();
}

// ── 사용자 관리 ─────────────────────────────────────────────────
async function loadUsers() {
  try {
    const users = await fetch('/api/users').then(r => r.json());
    const list = document.getElementById('userList');
    if (!users.length) {
      list.innerHTML = '<div style="font-size:12px;color:var(--text-faint)">등록된 사용자가 없습니다. (모든 사람이 접근 가능)</div>';
      return;
    }
    const today = new Date().toISOString().slice(0,10);
    const savedOpen = JSON.parse(localStorage.getItem('prasia_user_expanded') || '{}');
    list.innerHTML = users.map(u => {
      const expired = u.expiresAt && u.expiresAt < today;
      const expLabel = u.expiresAt ? (expired ? `<span style="color:var(--red)">만료 (${u.expiresAt})</span>` : `<span style="color:var(--green)">${u.expiresAt}까지</span>`) : '<span style="color:var(--text-faint)">무제한</span>';
      const ipLabel = u.allowedIPs && u.allowedIPs.length ? `<span style="color:var(--cyan)">${u.allowedIPs.join(', ')}</span>` : '<span style="color:var(--text-faint)">모든 IP</span>';
      const memoLabel = u.memo ? `<span style="color:var(--text);font-style:italic" title="${esc(u.memo)}">📝 ${esc(u.memo.length > 20 ? u.memo.slice(0,20)+'…' : u.memo)}</span>` : '';
      const isOpen = !!savedOpen[u.id];
      return `
      <div class="user-card" data-user-id="${esc(u.id)}" style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:10px 12px;display:flex;flex-direction:column;gap:6px${expired?' ;opacity:.6':''}">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;cursor:pointer" onclick="toggleUserCard('${esc(u.id)}')">
          <span class="user-toggle" style="font-size:11px;color:var(--text-dim);width:14px;display:inline-block;text-align:center">${isOpen ? '▼' : '▶'}</span>
          <span style="font-size:13px;font-weight:600;color:var(--text)">${esc(u.id)}</span>
          ${u.isAdmin ? '<span style="font-size:10px;color:var(--gold-light);background:rgba(201,162,39,.12);border:1px solid rgba(201,162,39,.3);border-radius:3px;padding:1px 6px">관리자</span>' : ''}
          <span style="font-size:11px">${expLabel}</span>
          ${memoLabel}
          <span style="flex:1"></span>
          <button class="btn-sm danger" onclick="event.stopPropagation();deleteUser('${esc(u.id)}')">삭제</button>
        </div>
        <div class="user-body" style="display:${isOpen ? 'flex' : 'none'};flex-direction:column;gap:6px;padding-top:6px;border-top:1px solid var(--border)">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:11px">
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;color:${u.isAdmin ? 'var(--gold-light)' : 'var(--text-dim)'}">
              <input type="checkbox" ${u.isAdmin ? 'checked' : ''} onchange="toggleAdmin('${esc(u.id)}', this.checked)"> 관리자 권한
            </label>
            <span style="color:var(--text-dim);margin-left:8px">IP:</span> ${ipLabel}
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <input type="password" class="pw-input" id="pw_${esc(u.id)}" placeholder="새 비밀번호" style="width:120px;font-size:12px;padding:5px 8px">
            <button class="btn-sm" onclick="changeUserPw('${esc(u.id)}')">비밀번호 변경</button>
            <input type="date" class="pw-input" id="exp_${esc(u.id)}" value="${u.expiresAt||''}" style="width:130px;font-size:12px;padding:5px 8px">
            <button class="btn-sm" onclick="setUserExpiry('${esc(u.id)}')">만료일 설정</button>
            <input type="text" class="pw-input" id="ip_${esc(u.id)}" value="${(u.allowedIPs||[]).join(', ')}" placeholder="IP (쉼표 구분)" style="width:160px;font-size:12px;padding:5px 8px">
            <button class="btn-sm" onclick="setUserIPs('${esc(u.id)}')">IP 설정</button>
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <input type="text" class="pw-input" id="memo_${esc(u.id)}" value="${esc(u.memo||'')}" placeholder="메모" style="flex:1;min-width:160px;font-size:12px;padding:5px 8px">
            <button class="btn-sm" onclick="setUserMemo('${esc(u.id)}')">메모 저장</button>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch {}
}

async function addUser() {
  const id = document.getElementById('newUserId').value.trim();
  const pw = document.getElementById('newUserPw').value;
  const expiresAt = document.getElementById('newUserExpires').value || '';
  if (!id || !pw) return showToast('아이디와 비밀번호를 입력하세요.');
  const res = await fetch('/api/users', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password: pw })
  });
  const data = await res.json();
  if (data.success) {
    // 만료일이 있으면 바로 설정
    if (expiresAt) {
      await fetch(`/api/users/${encodeURIComponent(id)}/expires`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresAt })
      });
    }
    document.getElementById('newUserId').value = '';
    document.getElementById('newUserPw').value = '';
    document.getElementById('newUserExpires').value = '';
    showToast('✅ 사용자 추가됨');
    loadUsers();
  } else {
    showToast(data.message || '추가 실패');
  }
}

async function setUserExpiry(id) {
  const expiresAt = document.getElementById('exp_' + id)?.value || '';
  const res = await fetch(`/api/users/${encodeURIComponent(id)}/expires`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresAt })
  });
  const data = await res.json();
  if (data.success) { showToast(expiresAt ? `✅ 만료일: ${expiresAt}` : '✅ 만료일 해제'); loadUsers(); }
  else showToast(data.message || '설정 실패');
}

async function setUserIPs(id) {
  const raw = document.getElementById('ip_' + id)?.value || '';
  const allowedIPs = raw.split(',').map(s => s.trim()).filter(Boolean);
  const res = await fetch(`/api/users/${encodeURIComponent(id)}/ips`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ allowedIPs })
  });
  const data = await res.json();
  if (data.success) { showToast(allowedIPs.length ? `✅ IP ${allowedIPs.length}개 등록` : '✅ IP 제한 해제'); loadUsers(); }
  else showToast(data.message || '설정 실패');
}

function toggleUserCard(id) {
  const card = document.querySelector(`.user-card[data-user-id="${CSS.escape(id)}"]`);
  if (!card) return;
  const body = card.querySelector('.user-body');
  const toggle = card.querySelector('.user-toggle');
  const open = body.style.display === 'none';
  body.style.display = open ? 'flex' : 'none';
  toggle.textContent = open ? '▼' : '▶';
  const saved = JSON.parse(localStorage.getItem('prasia_user_expanded') || '{}');
  if (open) saved[id] = true; else delete saved[id];
  localStorage.setItem('prasia_user_expanded', JSON.stringify(saved));
}

function toggleAllUserCards(expand) {
  document.querySelectorAll('.user-card').forEach(card => {
    const body = card.querySelector('.user-body');
    const toggle = card.querySelector('.user-toggle');
    if (!body || !toggle) return;
    body.style.display = expand ? 'flex' : 'none';
    toggle.textContent = expand ? '▼' : '▶';
  });
  const saved = {};
  if (expand) {
    document.querySelectorAll('.user-card').forEach(card => { saved[card.dataset.userId] = true; });
  }
  localStorage.setItem('prasia_user_expanded', JSON.stringify(saved));
}

async function setUserMemo(id) {
  const memo = document.getElementById('memo_' + id)?.value || '';
  const res = await fetch(`/api/users/${encodeURIComponent(id)}/memo`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memo })
  });
  const data = await res.json();
  if (data.success) showToast('✅ 메모 저장됨');
  else showToast(data.message || '저장 실패');
}

async function changeUserPw(id) {
  const pw = document.getElementById('pw_' + id)?.value;
  if (!pw) return showToast('새 비밀번호를 입력하세요.');
  const res = await fetch(`/api/users/${encodeURIComponent(id)}/password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pw })
  });
  const data = await res.json();
  if (data.success) { showToast('✅ 비밀번호 변경됨'); loadUsers(); }
  else showToast(data.message || '변경 실패');
}

async function toggleAdmin(id, isAdmin) {
  const res = await fetch(`/api/users/${encodeURIComponent(id)}/admin`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isAdmin })
  });
  const data = await res.json();
  if (data.success) { showToast(isAdmin ? '✅ 관리자 권한 부여' : '관리자 권한 해제'); loadUsers(); }
  else showToast(data.message || '변경 실패');
}

async function deleteUser(id) {
  if (!confirm(`'${id}' 사용자를 삭제하시겠습니까?`)) return;
  const res = await fetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.success) { showToast('✅ 사용자 삭제됨'); loadUsers(); }
  else showToast(data.message || '삭제 실패');
}

// ── 서버 데이터 동기화 ──────────────────────────────────────────────
const syncDirDB = (() => {
  let db;
  const open = () => new Promise((res, rej) => {
    if (db) return res(db);
    const req = indexedDB.open('prasia-sync', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('handles');
    req.onsuccess = e => { db = e.target.result; res(db); };
    req.onerror = rej;
  });
  const tx = async (mode, fn) => {
    const d = await open();
    return new Promise((res, rej) => {
      const t = d.transaction('handles', mode);
      const req = fn(t.objectStore('handles'));
      req.onsuccess = () => res(req.result);
      req.onerror = rej;
    });
  };
  return {
    get: () => tx('readonly', s => s.get('syncDir')),
    set: (h) => tx('readwrite', s => s.put(h, 'syncDir')),
    clear: () => tx('readwrite', s => s.delete('syncDir')),
  };
})();

async function getSyncDirHandle() {
  let handle = await syncDirDB.get();
  if (handle) {
    const perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') return handle;
    const req = await handle.requestPermission({ mode: 'readwrite' });
    if (req === 'granted') return handle;
  }
  handle = await window.showDirectoryPicker({ mode: 'readwrite' });
  await syncDirDB.set(handle);
  return handle;
}

async function syncPull() {
  const btn = document.getElementById('btnSyncPull');
  btn.disabled = true;
  btn.textContent = '⏳ 다운로드 중...';
  try {
    const res = await adminFetch('/api/sync-download');
    const data = await res.json();
    if (!data.success || !data.files) { showToast(data.message || '다운로드 실패'); return; }

    const entries = Object.entries(data.files).filter(([, v]) => v !== null);

    if ('showDirectoryPicker' in window) {
      const dirHandle = await getSyncDirHandle();
      for (const [name, fileContent] of entries) {
        const fileHandle = await dirHandle.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(fileContent, null, 2));
        await writable.close();
      }
      showToast(`✅ ${entries.length}개 파일 저장 완료 — ${dirHandle.name}`);
    } else {
      for (const [name, fileContent] of entries) {
        const blob = new Blob([JSON.stringify(fileContent, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      showToast(`✅ ${entries.length}개 파일 다운로드 완료`);
    }
  } catch (e) {
    if (e.name !== 'AbortError') showToast('서버 연결 실패');
  } finally {
    btn.disabled = false;
    btn.textContent = '📥 서버 → 로컬 다운로드';
  }
}

async function syncChangeDirHandle() {
  await syncDirDB.clear();
  showToast('저장 폴더가 초기화되었습니다. 다음 다운로드 시 폴더를 다시 선택해주세요.');
}

// ── 말풍선 관리 ───────────────────────────────────────────────────
async function loadBubbles() {
  try {
    const bubbles = await fetch('/api/bubbles').then(r => r.json());
    const list = document.getElementById('bubbleList');
    if (!bubbles.length) {
      list.innerHTML = '<div style="font-size:12px;color:var(--text-faint)">등록된 말풍선이 없습니다.</div>';
      return;
    }
    list.innerHTML = bubbles.map((b, i) => `
      <div style="display:flex;align-items:center;gap:8px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 12px;flex-wrap:wrap">
        <span style="font-size:12px;color:var(--cyan)">${esc(b.guild)}</span>
        <span style="font-size:12px;color:var(--text-faint)">›</span>
        <span style="font-size:12px;color:var(--gold-light)">${esc(b.nickname)}</span>
        <span style="font-size:12px;color:var(--text-faint)">›</span>
        <span style="font-size:12px;color:var(--text);flex:1">💬 ${esc(b.message)}</span>
        <button class="btn-sm danger" onclick="deleteBubble(${i})">삭제</button>
      </div>
    `).join('');
  } catch {}
}

async function addBubble() {
  const guild = document.getElementById('bubbleGuild').value.trim();
  const nickname = document.getElementById('bubbleNick').value.trim();
  const message = document.getElementById('bubbleMsg').value.trim();
  if (!guild || !nickname || !message) return showToast('결사, 닉네임, 메시지를 모두 입력하세요.');
  const res = await fetch('/api/bubbles', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guild, nickname, message })
  });
  const data = await res.json();
  if (data.success) {
    document.getElementById('bubbleGuild').value = '';
    document.getElementById('bubbleNick').value = '';
    document.getElementById('bubbleMsg').value = '';
    showToast('✅ 말풍선 추가됨');
    loadBubbles();
  } else {
    showToast(data.message || '추가 실패');
  }
}

async function deleteBubble(idx) {
  if (!confirm('이 말풍선을 삭제하시겠습니까?')) return;
  const res = await fetch(`/api/bubbles/${idx}`, { method: 'DELETE' });
  const data = await res.json();
  if (data.success) { showToast('✅ 말풍선 삭제됨'); loadBubbles(); }
  else showToast(data.message || '삭제 실패');
}

// ── 내 결사 관리 ─────────────────────────────────────────────────
function escAttr(s) { return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
let myGuildAllGuilds = [];
let myGuildSelectedKey = '';
async function loadMyGuild() {
  try {
    const [dataRes, dispRes] = await Promise.all([
      adminFetch('/api/data'),
      fetch('/api/display')
    ]);
    const data = await dataRes.json();
    const disp = await dispRes.json();

    const guildMap = {};
    (data.characters || []).forEach(c => {
      if (!c.guild) return;
      const key = `${c.realm||''}\t${c.guild}`;
      if (!guildMap[key]) guildMap[key] = { guild: c.guild, realm: c.realm||'', count: 0 };
      guildMap[key].count++;
    });
    myGuildAllGuilds = Object.values(guildMap).sort((a,b) => {
      if (a.realm !== b.realm) return a.realm.localeCompare(b.realm);
      return b.count - a.count;
    });

    const current = disp.myGuild;
    myGuildSelectedKey = current ? `${current.realm||''}\t${current.guild}` : '';
    document.getElementById('myGuildAutoFilter').checked = !!(current && current.autoFilter);

    filterMyGuildOptions();

    const cur = document.getElementById('myGuildCurrent');
    if (current) {
      const realmLabel = current.realm ? ` <span style="color:var(--text-faint);font-size:11px">${esc(current.realm)}</span>` : '';
      cur.innerHTML = `현재 지정: <strong style="color:var(--gold-light)">⭐ ${esc(current.guild)}</strong>${realmLabel}`;
    } else {
      cur.innerHTML = '<span style="color:var(--text-faint)">지정된 결사 없음</span>';
    }
  } catch (e) {
    const cur = document.getElementById('myGuildCurrent');
    if (cur) cur.innerHTML = '<span style="color:var(--red)">로딩 실패</span>';
  }
}

function filterMyGuildOptions() {
  const q = (document.getElementById('myGuildSearch').value || '').trim().toLowerCase();
  const list = document.getElementById('myGuildList');
  const filtered = q
    ? myGuildAllGuilds.filter(g => g.guild.toLowerCase().includes(q) || g.realm.toLowerCase().includes(q))
    : myGuildAllGuilds;

  if (!filtered.length) {
    list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-faint);font-size:12px">결과가 없습니다</div>';
    return;
  }
  list.innerHTML = filtered.slice(0, 200).map(g => {
    const key = `${g.realm}\t${g.guild}`;
    const active = key === myGuildSelectedKey;
    const realmLabel = g.realm ? `<span style="color:var(--text-faint);font-size:11px;margin-left:6px">${esc(g.realm)}</span>` : '';
    const bg = active ? 'background:rgba(201,162,39,.15);border-color:var(--gold-dim)' : 'background:var(--bg3);border-color:var(--border)';
    const icon = active ? '⭐' : '⚔';
    return `<button type="button" onclick="pickMyGuild('${escAttr(key)}')" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border:1px solid;border-radius:6px;font-family:inherit;font-size:13px;color:var(--text);cursor:pointer;text-align:left;${bg}">
      <span><span style="color:var(--gold-light)">${icon} ${esc(g.guild)}</span>${realmLabel}</span>
      <span style="color:var(--cyan);font-size:12px;font-weight:600">${g.count}명</span>
    </button>`;
  }).join('');
  if (filtered.length > 200) {
    list.innerHTML += `<div style="padding:8px;text-align:center;color:var(--text-faint);font-size:11px">상위 200개만 표시 (${filtered.length}개 중)</div>`;
  }
}

function pickMyGuild(key) {
  myGuildSelectedKey = myGuildSelectedKey === key ? '' : key;
  filterMyGuildOptions();
}

async function saveMyGuild() {
  let body = {};
  if (myGuildSelectedKey) {
    const [realm, guild] = myGuildSelectedKey.split('\t');
    body = { guild, realm, autoFilter: document.getElementById('myGuildAutoFilter').checked };
  }
  const res = await adminFetch('/api/my-guild', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.success) { showToast('✅ 내 결사 저장됨'); loadMyGuild(); }
  else showToast(data.message || '저장 실패');
}

async function clearMyGuild() {
  if (!confirm('내 결사 지정을 해제하시겠습니까?')) return;
  const res = await adminFetch('/api/my-guild', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  const data = await res.json();
  if (data.success) { showToast('✅ 해제됨'); loadMyGuild(); }
  else showToast(data.message || '해제 실패');
}

// ── 파비콘 상태 ──────────────────────────────────────────────────
let faviconTimer = null;
function setFavicon(state) {
  const el = document.getElementById('favicon');
  if (!el) return;
  if (state === 'collecting') {
    el.href = '/favicon-collecting.svg';
    document.title = '⏳ 수집 중 — 프라시아 랭킹';
  } else if (state === 'done') {
    el.href = '/favicon-done.svg';
    document.title = '✅ 수집 완료 — 프라시아 랭킹';
    clearTimeout(faviconTimer);
    faviconTimer = setTimeout(() => setFavicon('idle'), 30000);
  } else {
    el.href = '/favicon.svg';
    document.title = '관리자 — 프라시아 랭킹';
  }
}

// ── 유틸 ────────────────────────────────────────────────────────
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── THEME TOGGLE ────────────────────────────────────────────────
(function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('prasia-theme') || 'dark';

  function applyTheme(mode) {
    let effective = mode;
    if (mode === 'system') {
      effective = window.matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', effective);
  }

  function setActive(mode) {
    toggle.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === mode);
    });
  }

  toggle.addEventListener('click', e => {
    const btn = e.target.closest('.theme-btn');
    if (!btn) return;
    const mode = btn.dataset.theme;
    localStorage.setItem('prasia-theme', mode);
    applyTheme(mode);
    setActive(mode);
  });

  window.matchMedia('(prefers-color-scheme:light)').addEventListener('change', () => {
    if (localStorage.getItem('prasia-theme') === 'system') applyTheme('system');
  });

  applyTheme(saved);
  setActive(saved);
})();


// ── 결사 추적 ─────────────────────────────────────────────────
async function loadGuildTracker() {
    const [sRes, pRes, cRes] = await Promise.all([
        adminFetch('/api/tracker/status'),
        adminFetch('/api/tracker/pending'),
        adminFetch('/api/tracker/confirmed')
    ]);
    const sData = await sRes.json();
    const pData = await pRes.json();
    const cData = await cRes.json();

    const snap = sData.ok ? sData.data : null;
    const pending = pData.ok ? pData.data : [];
    const confirmed = cData.ok ? cData.data : [];

    renderGtStatus(snap);
    renderGtPending(pending);
    renderGtConfirmed(confirmed);

    const badge = document.getElementById('gt-badge');
    if (badge) {
        badge.textContent = pending.length > 0 ? pending.length : '';
        badge.style.display = pending.length > 0 ? 'inline-flex' : 'none';
    }
}

function renderGtStatus(snap) {
    const el = document.getElementById('gt-status');
    if (!el) return;
    if (!snap || !snap.updatedAt) {
        el.innerHTML = '<span style="color:var(--text-faint);font-size:12px">스냅샷 없음 — 다음 수집 시 자동 시작</span>';
        return;
    }
    el.innerHTML = `<span style="font-size:12px;color:var(--cyan)">● 자동 추적 중</span>
        <span style="font-size:11px;color:var(--text-faint);margin-left:10px">결사 ${snap.totalGuilds}개 · 마지막 스냅샷: ${new Date(snap.updatedAt).toLocaleString('ko-KR')}</span>`;
}

function renderGtPending(pending) {
    const wrap = document.getElementById('gt-pending-wrap');
    const list = document.getElementById('gt-pending-list');
    if (!pending.length) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    list.innerHTML = pending.map(p => {
        const candidateRows = p.candidates.slice(0, 5).map((c, i) => {
            const jobChangeLabel = c.jobChanges && c.jobChanges.length
                ? `<span style="font-size:10px;color:var(--gold)"> (직업변경 ${c.jobChanges.length}명)</span>`
                : '';
            return `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:var(--bg);border-radius:5px;margin-bottom:4px">
                <div>
                    <span style="color:var(--text);font-size:12px">⚔ ${esc(c.guildName)}</span>
                    <span style="color:var(--text-faint);font-size:11px;margin-left:6px">${esc(c.world)}</span>
                    ${jobChangeLabel}
                    <div style="font-size:11px;color:var(--cyan)">${c.matchCount}명 일치 (${c.matchRate}%)</div>
                </div>
                <button class="btn-secondary" onclick="gtConfirm('${p.id}', ${i})">✓ 확정</button>
            </div>`;
        }).join('');
        return `<div style="padding:12px;background:var(--bg2);border:1px solid var(--gold);border-radius:8px;margin-bottom:10px">
            <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">
                <strong style="color:var(--text)">⚔ ${esc(p.guildName)}</strong>
                <span style="color:var(--text-faint);font-size:11px;margin-left:4px">${esc(p.world)}</span>
                <span style="color:var(--gold);font-size:11px;margin-left:8px">서버 이전 의심</span>
                <span style="font-size:10px;color:var(--text-faint);margin-left:8px">${new Date(p.detectedAt).toLocaleString('ko-KR')}</span>
                <div style="font-size:11px;color:var(--text-faint);margin-top:2px">스냅샷 ${p.lastMemberCount}명 → 현재 ${p.currentMemberCount}명 (${Math.round(p.currentMemberCount/p.lastMemberCount*100)}% 잔류)</div>
            </div>
            ${candidateRows}
            <button class="btn-sm" title="이전이 아님 (해체·자연감소 등) — 대기 목록에서 제거" style="font-size:11px;margin-top:6px;color:var(--text-faint)" onclick="gtDismiss('${p.id}')">✕ 이전 아님</button>
        </div>`;
    }).join('');
}

function renderGtConfirmed(confirmed) {
    const el = document.getElementById('gt-confirmed-list');
    if (!el) return;
    if (!confirmed.length) {
        el.innerHTML = '<div style="font-size:12px;color:var(--text-faint);padding:6px 0">확정된 이전 이력이 없습니다.</div>';
        return;
    }
    el.innerHTML = confirmed.slice().reverse().slice(0, 50).map(c => {
        const date = new Date(c.confirmedAt).toLocaleDateString('ko-KR');
        const matchColor = c.matchRate >= 50 ? 'var(--green,#4caf50)' : c.matchRate >= 30 ? 'var(--gold)' : 'var(--text-faint)';
        return `<div style="padding:10px 12px;background:var(--bg2);border-radius:7px;border:1px solid var(--border);margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span style="font-size:13px;font-weight:600;color:var(--text)">${esc(c.from.guildName)}</span>
                <span style="font-size:11px;color:var(--text-faint)">${esc(c.from.world)}</span>
                <span style="color:var(--gold);font-size:16px;margin:0 2px">→</span>
                <span style="font-size:13px;font-weight:600;color:var(--cyan)">${esc(c.to.guildName)}</span>
                <span style="font-size:11px;color:var(--text-faint)">${esc(c.to.world)}</span>
                <span style="margin-left:auto;font-size:12px;font-weight:600;color:${matchColor}">${c.matchRate}%</span>
            </div>
            <div style="margin-top:5px;font-size:11px;color:var(--text-faint)">
                멤버 ${c.matchCount}명 일치 · ${date} · ${esc(c.confirmedBy || 'admin')}
            </div>
        </div>`;
    }).join('');
}

async function gtConfirm(pendingId, candidateIndex) {
    const res = await adminFetch('/api/tracker/pending/' + pendingId + '/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIndex })
    });
    const data = await res.json();
    if (data.ok) { showToast('✅ 이전 확정됨'); loadGuildTracker(); }
    else showToast('오류: ' + (data.error || '알 수 없음'));
}

async function gtDismiss(pendingId) {
    const res = await adminFetch('/api/tracker/pending/' + pendingId + '/dismiss', { method: 'POST' });
    const data = await res.json();
    if (data.ok) { showToast('무시됨'); loadGuildTracker(); }
    else showToast('오류: ' + (data.error || '알 수 없음'));
}

checkAuth();

// ── 카드 접기/펴기 ────────────────────────────────────────────
function initCardCollapse() {
    document.querySelectorAll('.card').forEach(card => {
        const title = card.querySelector(':scope > .card-title');
        if (!title) return;

        const body = document.createElement('div');
        body.className = 'card-body';
        [...card.children].forEach(el => { if (el !== title) body.appendChild(el); });
        card.appendChild(body);

        const key = 'card-collapsed-' + (card.id || title.textContent.trim().slice(0, 20));
        if (localStorage.getItem(key) === '1') card.classList.add('collapsed');

        title.addEventListener('click', e => {
            if (e.target.closest('.tip')) return;
            card.classList.toggle('collapsed');
            localStorage.setItem(key, card.classList.contains('collapsed') ? '1' : '0');
        });
    });
}

// ── 보스젠 관리 ───────────────────────────────────────────────
let bossConfigData = { bosses: [], maintenanceDate: '', maintenanceTime: '22:00' };

async function loadBossConfig() {
    try {
        const res = await adminFetch('/api/boss/config');
        const data = await res.json();
        if (data.ok) {
            bossConfigData = data.data;
            document.getElementById('bossMainDate').value = bossConfigData.maintenanceDate || '';
            document.getElementById('bossMainTime').value = bossConfigData.maintenanceTime;
            renderBossList();
        }
    } catch {}
}

function bossTypeChange() {
    const type = document.getElementById('bossNewType').value;
    document.getElementById('bossNewCyclePart').style.display = type === 'cycle' ? 'flex' : 'none';
    document.getElementById('bossNewTriggerPart').style.display = type === 'trigger' ? 'flex' : 'none';
}

function bossUpdateName(idx, val) {
    if (val.trim()) bossConfigData.bosses[idx].name = val.trim();
}

function bossUpdateCycle(idx, val) {
    bossConfigData.bosses[idx].cycleHours = Number(val);
}

function bossUpdateResetTime(idx, val) {
    bossConfigData.bosses[idx].resetTime = val;
}

function renderBossList() {
    const el = document.getElementById('bossList');
    if (!el) return;
    const CYCLE_OPTS = [
        { v: 24, l: '24시간' }, { v: 48, l: '48시간' }, { v: 72, l: '3일' },
        { v: 96, l: '4일' }, { v: 120, l: '5일' }, { v: 168, l: '7일' }
    ];
    if (!bossConfigData.bosses.length) {
        el.innerHTML = '<div style="font-size:12px;color:var(--text-faint)">등록된 보스가 없습니다.</div>';
        return;
    }
    el.innerHTML = bossConfigData.bosses.map((b, i) => {
        const isTrigger = b.type === 'trigger';
        const typeTag = isTrigger
            ? `<span style="font-size:10px;color:#f0b429;background:rgba(240,180,41,0.12);padding:2px 6px;border-radius:4px;white-space:nowrap">연쇄형</span>`
            : '';
        const infoEl = isTrigger
            ? `<span style="font-size:11px;color:var(--text-faint);background:var(--bg2);padding:2px 8px;border-radius:4px;white-space:nowrap">${esc(b.triggerBoss||'')} ×${b.requiredKills||1} +${b.delayMinutes||5}분</span>`
            : `<select style="font-size:11px;background:var(--bg2);color:var(--text-dim);border:1px solid var(--border);border-radius:4px;padding:2px 4px;cursor:pointer" onchange="bossUpdateCycle(${i}, this.value)">${CYCLE_OPTS.map(o => `<option value="${o.v}"${b.cycleHours == o.v ? ' selected' : ''}>${o.l}</option>`).join('')}</select>`;
        const resetInput = !isTrigger
            ? `<input type="time" value="${b.resetTime||''}" title="점검 초기화 시각 (비어있으면 기본 시각)" style="font-size:11px;background:var(--bg2);color:var(--text-dim);border:1px solid var(--border);border-radius:4px;padding:2px 4px;width:105px" onchange="bossUpdateResetTime(${i}, this.value)">`
            : '';
        return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg);border-radius:6px;border:1px solid var(--border);flex-wrap:wrap">
            <input type="text" value="${esc(b.name)}" style="font-size:13px;flex:1;min-width:80px;background:var(--bg2);color:var(--text);border:1px solid var(--border);border-radius:4px;outline:none;padding:3px 7px;cursor:text" onfocus="this.style.borderColor='var(--border-glow)'" onblur="this.style.borderColor='var(--border)'" oninput="bossUpdateName(${i}, this.value)">
            ${typeTag}
            ${infoEl}
            ${resetInput}
            <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-dim);cursor:pointer">
                <input type="checkbox" ${b.enabled ? 'checked' : ''} onchange="bossToggleEnabled(${i}, this.checked)"> 활성
            </label>
            <button class="btn-sm danger" onclick="bossDelete(${i})">삭제</button>
        </div>`;
    }).join('');
}

function bossAddNew() {
    const name = document.getElementById('bossNewName').value.trim();
    if (!name) { showToast('보스명을 입력하세요'); return; }
    if (bossConfigData.bosses.find(b => b.name === name)) { showToast('이미 등록된 보스명입니다'); return; }
    const type = document.getElementById('bossNewType').value;
    const boss = { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), name, type, enabled: true };
    if (type === 'trigger') {
        boss.triggerBoss = document.getElementById('bossNewTriggerBoss').value.trim();
        boss.requiredKills = Number(document.getElementById('bossNewRequiredKills').value) || 1;
        boss.delayMinutes = Number(document.getElementById('bossNewDelayMin').value) || 5;
        if (!boss.triggerBoss) { showToast('트리거 보스명을 입력하세요'); return; }
    } else {
        boss.cycleHours = Number(document.getElementById('bossNewCycle').value);
    }
    bossConfigData.bosses.push(boss);
    document.getElementById('bossNewName').value = '';
    renderBossList();
}

function bossDelete(idx) {
    bossConfigData.bosses.splice(idx, 1);
    renderBossList();
}

function bossToggleEnabled(idx, val) {
    bossConfigData.bosses[idx].enabled = val;
}

async function bossSaveConfig() {
    bossConfigData.maintenanceDate = document.getElementById('bossMainDate').value;
    bossConfigData.maintenanceTime = document.getElementById('bossMainTime').value;
    try {
        const res = await adminFetch('/api/boss/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bossConfigData)
        });
        const data = await res.json();
        showToast(data.ok ? '✅ 보스 설정 저장됨' : '저장 실패: ' + data.error);
    } catch { showToast('서버 연결 실패'); }
}

async function bossApplyMaintenance() {
    const date = document.getElementById('bossMainDate').value;
    const defaultTime = document.getElementById('bossMainTime').value;
    if (!date) { showToast('정기점검 날짜를 선택하세요'); return; }
    const [y, mo, d] = date.split('-');
    const displayDate = y + '년 ' + parseInt(mo) + '월 ' + parseInt(d) + '일';
    const defaultDisplay = defaultTime ? ' (기본 ' + defaultTime + ')' : '';
    if (!confirm(displayDate + ' 기준으로 모든 보스를 초기화하시겠습니까?' + defaultDisplay)) return;
    let ok = 0, fail = 0;
    const enabled = bossConfigData.bosses.filter(b => b.enabled);
    for (const boss of enabled) {
        try {
            if (boss.type === 'trigger') {
                const res = await adminFetch('/api/boss/cuts/' + boss.id, { method: 'DELETE' });
                if ((await res.json()).ok) ok++; else throw new Error();
            } else {
                const time = boss.resetTime || defaultTime;
                if (!time) { ok++; continue; }
                const cutTime = new Date(date + 'T' + time + ':00').toISOString();
                const res = await adminFetch('/api/boss/cuts/' + boss.id, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cutTime, updatedBy: 'maintenance' })
                });
                if ((await res.json()).ok) ok++; else throw new Error();
            }
        } catch { fail++; }
    }
    showToast(fail ? '✅ ' + ok + '개 초기화 · ' + fail + '개 실패' : '✅ ' + ok + '개 보스 초기화 완료');
}

async function bossLogView() {
    document.getElementById('bossLogViewModal').style.display = 'flex';
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('bossLogViewDate').value = today;
    await loadBossLog();
}

async function loadBossLog() {
    const date = document.getElementById('bossLogViewDate').value;
    const url = date ? `/api/boss/log?date=${date}` : '/api/boss/log';
    const tbody = document.getElementById('bossLogViewBody');
    const countEl = document.getElementById('bossLogViewCount');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-faint)">로딩 중...</td></tr>';
    try {
        const res = await adminFetch(url);
        const data = await res.json();
        if (!data.ok) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-faint)">${data.error}</td></tr>`;
            return;
        }
        const entries = data.data;
        countEl.textContent = entries.length ? `총 ${entries.length}건` : '';
        if (!entries.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-faint)">로그 없음</td></tr>';
            return;
        }
        const fmt = iso => new Date(iso).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const sourceLabel = s => ({ paste: '붙여넣기', csv: 'CSV', manual: '직접입력' })[s] || (s || '-');
        tbody.innerHTML = entries.map(e => `<tr>
            <td style="padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text-dim);white-space:nowrap">${fmt(e.ts)}</td>
            <td style="padding:6px 8px;border-bottom:1px solid var(--border)">${e.bossName || e.bossId}</td>
            <td style="padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text-dim);white-space:nowrap">${e.cutTime ? fmt(e.cutTime) : '-'}</td>
            <td style="padding:6px 8px;border-bottom:1px solid var(--border)">${e.by || '-'}</td>
            <td style="padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text-faint)">${sourceLabel(e.source)}</td>
        </tr>`).join('');
    } catch {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-faint)">로드 실패</td></tr>';
    }
}
