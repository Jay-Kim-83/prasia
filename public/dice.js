(function (global) {
    'use strict';

    var STYLE_ID = 'dcg-style';
    var COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#a855f7'];
    var PIP_COLORS = ['#4f46e5', '#dc2626', '#059669'];

    var CSS = ''
        + '.dcg{box-sizing:border-box;max-width:640px;margin:0 auto;font-family:Pretendard,"Malgun Gothic","맑은 고딕",sans-serif;color:#1e293b;color-scheme:light}'
        + '.dcg *{box-sizing:border-box}'
        + '.dcg-card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 24px 60px -24px rgba(79,70,229,.3);overflow:hidden}'
        + '.dcg-head{padding:20px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6 55%,#a855f7);color:#fff}'
        + '.dcg-title{margin:0;font-size:20px;font-weight:800;letter-spacing:-.02em}'
        + '.dcg-sub{margin:5px 0 0;font-size:13px;opacity:.88}'
        + '.dcg-body{padding:22px 24px 24px}'
        + '.dcg-label{font-size:13px;font-weight:700;color:#475569;margin-bottom:8px}'
        + '.dcg-seg{display:flex;gap:6px;background:#f1f5f9;padding:5px;border-radius:12px;margin-bottom:18px}'
        + '.dcg-seg button{flex:1;padding:9px 0;border:none;border-radius:9px;background:transparent;color:#64748b;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;transition:all .15s}'
        + '.dcg-seg button.on{background:#fff;color:#4f46e5;box-shadow:0 2px 8px rgba(15,23,42,.12)}'
        + '.dcg-seg button:disabled{cursor:not-allowed;opacity:.6}'
        + '.dcg-stage{position:relative;max-width:520px;margin:0 auto}'
        + '.dcg-canvas{display:block;width:100%}'
        + '.dcg-btn{padding:12px 20px;border:none;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 10px 24px -10px rgba(99,102,241,.7);transition:transform .15s,box-shadow .15s,opacity .15s}'
        + '.dcg-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 14px 28px -10px rgba(99,102,241,.8)}'
        + '.dcg-btn:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}'
        + '.dcg-btn--full{width:100%;font-size:16px;padding:14px 20px}'
        + '.dcg-btn--ghost{background:#f1f5f9;color:#475569;box-shadow:none}'
        + '.dcg-btn--ghost:hover:not(:disabled){background:#e2e8f0;box-shadow:none}'
        + '.dcg-btn--recing{background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;animation:dcg-recpulse 1.2s ease infinite}'
        + '.dcg-result{display:none;margin:14px auto 0;max-width:420px;text-align:center;padding:14px 18px;border-radius:14px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#fff;font-size:15px;box-shadow:0 10px 24px -10px rgba(245,158,11,.8);animation:dcg-pop .25s ease}'
        + '.dcg-result.show{display:block}'
        + '.dcg-result b{font-size:22px;font-weight:900}'
        + '.dcg-actions{display:flex;gap:8px;justify-content:center;margin-top:16px;flex-wrap:wrap}'
        + '.dcg-log{margin:16px 2px 0;display:flex;flex-direction:column;gap:7px}'
        + '.dcg-log-item{display:flex;align-items:center;gap:9px;font-size:13px;color:#475569;animation:dcg-pop .2s ease}'
        + '.dcg-log-item i{width:8px;height:8px;border-radius:50%;flex:none}'
        + '.dcg-log-item b{color:#1e293b}'
        + '.dcg-log-item .dcg-special{color:#b45309;font-weight:800}'
        + '.dcg-confetti{position:absolute;left:50%;top:50%;width:7px;height:7px;border-radius:2px;pointer-events:none;z-index:2;animation:dcg-burst .9s ease-out forwards}'
        + '.dcg-replay{margin-top:14px;display:flex;flex-direction:column;gap:8px;animation:dcg-pop .2s ease}'
        + '.dcg-replay video{width:100%;border-radius:14px;background:#0f172a;display:block}'
        + '.dcg-replay-actions{display:flex;gap:8px;justify-content:center}'
        + '@keyframes dcg-pop{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}'
        + '@keyframes dcg-burst{from{transform:translate(-50%,-50%) rotate(0);opacity:1}to{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(var(--rot));opacity:0}}'
        + '@keyframes dcg-recpulse{0%,100%{box-shadow:0 10px 24px -10px rgba(239,68,68,.8)}50%{box-shadow:0 10px 30px -4px rgba(239,68,68,1)}}'
        + '@media (max-width:520px){.dcg-body{padding:16px 14px 18px}.dcg-head{padding:16px 18px}.dcg-btn{font-size:13px;padding:10px 14px}.dcg-btn--full{font-size:15px;padding:13px}}';

    var PIPS = {
        1: [[0, 0]],
        2: [[-1, -1], [1, 1]],
        3: [[-1, -1], [0, 0], [1, 1]],
        4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
        5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
        6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]]
    };

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function Game(container, opts) {
        this.el = container;
        this.opts = {
            count: Math.max(1, Math.min(3, opts.count || 2)),
            title: opts.title || '주사위 던지기',
            onResult: opts.onResult || null
        };
        this.count = this.opts.count;
        this.values = [null, null, null];
        this.rolling = false;
        this.raf = null;
        this.tick = this.tick.bind(this);
        this.onResize = this.relayout.bind(this);
        injectStyle();
        this.el.classList.add('dcg');
        this.card = el('div', 'dcg-card');
        this.el.innerHTML = '';
        this.el.appendChild(this.card);
        this.renderBoard();
        this.relayout();
        window.addEventListener('resize', this.onResize);
    }

    Game.prototype.renderBoard = function () {
        var self = this;
        this.card.innerHTML = '';
        var head = el('div', 'dcg-head');
        head.appendChild(el('h2', 'dcg-title', '🎲 ' + this.opts.title));
        this.sub = el('p', 'dcg-sub', '주사위 개수를 고르고 던져 보세요 (최대 3개)');
        head.appendChild(this.sub);
        this.card.appendChild(head);
        var body = el('div', 'dcg-body');

        body.appendChild(el('div', 'dcg-label', '주사위 개수'));
        var seg = el('div', 'dcg-seg');
        this.segBtns = [];
        [1, 2, 3].forEach(function (n) {
            var btn = el('button', n === self.count ? 'on' : '', n + '개');
            btn.type = 'button';
            btn.addEventListener('click', function () { self.setCount(n); });
            seg.appendChild(btn);
            self.segBtns.push(btn);
        });
        body.appendChild(seg);

        var stage = el('div', 'dcg-stage');
        this.canvas = el('canvas', 'dcg-canvas');
        this.ctx = this.canvas.getContext('2d');
        stage.appendChild(this.canvas);
        this.stage = stage;
        body.appendChild(stage);

        this.rollBtn = el('button', 'dcg-btn dcg-btn--full', '🎲 던지기!');
        this.rollBtn.type = 'button';
        this.rollBtn.addEventListener('click', function () { self.roll(); });
        body.appendChild(this.rollBtn);

        this.result = el('div', 'dcg-result');
        body.appendChild(this.result);

        var actions = el('div', 'dcg-actions');
        var recBtn = el('button', 'dcg-btn dcg-btn--ghost', '⏺ 녹화하기');
        recBtn.type = 'button';
        recBtn.addEventListener('click', function () { self.toggleRecord(); });
        this.recBtn = recBtn;
        actions.appendChild(recBtn);
        body.appendChild(actions);

        this.replayHost = el('div');
        body.appendChild(this.replayHost);
        this.log = el('div', 'dcg-log');
        body.appendChild(this.log);
        this.recording = false;
        this.card.appendChild(body);
    };

    Game.prototype.setCount = function (n) {
        if (this.rolling) return;
        this.count = n;
        this.segBtns.forEach(function (b, i) { b.className = (i + 1 === n) ? 'on' : ''; });
        this.result.classList.remove('show');
        this.draw();
    };

    Game.prototype.relayout = function () {
        if (!this.canvas || !this.canvas.isConnected) return;
        var w = Math.min(520, this.canvas.parentNode.clientWidth || 520);
        var h = 200;
        var dpr = window.devicePixelRatio || 1;
        this.canvas.style.height = h + 'px';
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.geom = { w: w, h: h };
        this.draw();
    };

    Game.prototype.dicePos = function () {
        var g = this.geom;
        var n = this.count;
        var gap = 24;
        var s = Math.min(128, (g.w - 40 - (n - 1) * gap) / n);
        var totalW = n * s + (n - 1) * gap;
        var x0 = (g.w - totalW) / 2 + s / 2;
        var out = [];
        for (var i = 0; i < n; i++) out.push({ x: x0 + i * (s + gap), y: g.h / 2, s: s });
        return out;
    };

    Game.prototype.draw = function (now) {
        var ctx = this.ctx;
        var g = this.geom;
        ctx.clearRect(0, 0, g.w, g.h);
        var pos = this.dicePos();
        for (var i = 0; i < this.count; i++) {
            var face = this.values[i];
            var angle = 0;
            var lift = 0;
            if (this.rolling && this.anim && this.anim[i]) {
                var a = this.anim[i];
                face = a.showFace;
                angle = Math.sin((a.t || 0) * 22 + i * 2) * 0.3 * (1 - (a.t || 0));
                lift = Math.abs(Math.sin((a.t || 0) * Math.PI * 3)) * (1 - (a.t || 0)) * 16;
            }
            this.drawDie(pos[i].x, pos[i].y - lift, pos[i].s, face, angle, i);
        }
    };

    Game.prototype.drawDie = function (x, y, s, face, angle, idx) {
        var ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle || 0);
        var r = s * 0.2;
        var half = s / 2;
        ctx.beginPath();
        ctx.moveTo(-half + r, -half);
        ctx.arcTo(half, -half, half, half, r);
        ctx.arcTo(half, half, -half, half, r);
        ctx.arcTo(-half, half, -half, -half, r);
        ctx.arcTo(-half, -half, half, -half, r);
        ctx.closePath();
        var grad = ctx.createLinearGradient(0, -half, 0, half);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#eef2f7');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(15,23,42,.22)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();
        if (!face) {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '800 ' + Math.round(s * 0.42) + 'px Pretendard,"Malgun Gothic",sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', 0, 2);
        } else {
            var d = s * 0.24;
            var pr = s * 0.082;
            ctx.fillStyle = PIP_COLORS[idx % PIP_COLORS.length];
            PIPS[face].forEach(function (p) {
                ctx.beginPath();
                ctx.arc(p[0] * d, p[1] * d, pr, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        ctx.restore();
    };

    Game.prototype.roll = function () {
        if (this.rolling) return;
        var now = performance.now();
        this.rolling = true;
        this.rollBtn.disabled = true;
        this.rollBtn.textContent = '두구두구...';
        this.result.classList.remove('show');
        this.segBtns.forEach(function (b) { b.disabled = true; });
        this.anim = [];
        for (var i = 0; i < this.count; i++) {
            this.anim.push({
                t0: now,
                dur: 1100 + i * 260 + Math.random() * 200,
                final: 1 + Math.floor(Math.random() * 6),
                showFace: 1 + Math.floor(Math.random() * 6),
                lastFlip: now,
                t: 0
            });
        }
        if (!this.raf) this.raf = requestAnimationFrame(this.tick);
    };

    Game.prototype.tick = function (now) {
        this.raf = null;
        if (!this.rolling) return;
        var allDone = true;
        for (var i = 0; i < this.count; i++) {
            var a = this.anim[i];
            var t = Math.min(1, (now - a.t0) / a.dur);
            a.t = t;
            if (t < 1) {
                allDone = false;
                var interval = 60 + t * t * 260;
                if (now - a.lastFlip > interval) {
                    a.showFace = 1 + Math.floor(Math.random() * 6);
                    a.lastFlip = now;
                }
            } else {
                a.showFace = a.final;
            }
        }
        this.draw(now);
        if (this.recording) this.drawRec();
        if (allDone) { this.finishRoll(); return; }
        this.raf = requestAnimationFrame(this.tick);
    };

    Game.prototype.finishRoll = function () {
        this.rolling = false;
        var values = [];
        for (var i = 0; i < this.count; i++) {
            this.values[i] = this.anim[i].final;
            values.push(this.anim[i].final);
        }
        this.draw();
        if (this.recording) this.drawRec();
        this.rollBtn.disabled = false;
        this.rollBtn.textContent = '🎲 다시 던지기!';
        this.segBtns.forEach(function (b) { b.disabled = false; });
        var total = values.reduce(function (a, b) { return a + b; }, 0);
        var special = '';
        if (this.count === 3 && values[0] === values[1] && values[1] === values[2]) special = '🎰 트리플!';
        else if (this.count >= 2 && new Set(values).size < values.length) special = '✨ 더블!';
        this.lastText = values.join(' · ') + ' = ' + total + (special ? ' ' + special : '');
        this.result.innerHTML = '';
        this.result.appendChild(document.createTextNode(values.join(' · ') + '  →  합계 '));
        this.result.appendChild(el('b', null, String(total)));
        if (special) this.result.appendChild(document.createTextNode('  ' + special));
        this.result.classList.add('show');
        if (special) this.confetti(this.stage, special.indexOf('트리플') >= 0 ? 26 : 12);
        var li = el('div', 'dcg-log-item');
        var dot = el('i');
        dot.style.background = COLORS[this.log.children.length % COLORS.length];
        li.appendChild(dot);
        var txt = el('span');
        txt.appendChild(document.createTextNode((this.log.children.length + 1) + '번째 · ' + values.join(' · ') + ' = '));
        txt.appendChild(el('b', null, String(total)));
        if (special) txt.appendChild(el('span', 'dcg-special', ' ' + special));
        li.appendChild(txt);
        this.log.insertBefore(li, this.log.firstChild);
        if (typeof this.opts.onResult === 'function') this.opts.onResult(values.slice(), total);
    };

    Game.prototype.confetti = function (host, n) {
        for (var i = 0; i < n; i++) {
            var piece = el('span', 'dcg-confetti');
            piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
            piece.style.setProperty('--dx', (Math.random() * 240 - 120) + 'px');
            piece.style.setProperty('--dy', (Math.random() * -150 - 20) + 'px');
            piece.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
            host.appendChild(piece);
            setTimeout((function (node) { return function () { node.remove(); }; })(piece), 1000);
        }
    };

    Game.prototype.toggleRecord = function () {
        if (this.recording) { this.stopRecord(); return; }
        if (!window.MediaRecorder || !document.createElement('canvas').captureStream) {
            this.recBtn.textContent = '녹화 미지원 브라우저';
            this.recBtn.disabled = true;
            return;
        }
        this.startRecord();
    };

    Game.prototype.startRecord = function () {
        var self = this;
        var mime = '';
        ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].some(function (m) {
            if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) { mime = m; return true; }
            return false;
        });
        var scale = Math.min(2, window.devicePixelRatio || 1);
        var w = this.geom.w;
        var h = this.geom.h + 56;
        this.recCanvas = document.createElement('canvas');
        this.recCanvas.width = Math.round(w * scale);
        this.recCanvas.height = Math.round(h * scale);
        this.recCtx = this.recCanvas.getContext('2d');
        this.recCtx.setTransform(scale, 0, 0, scale, 0, 0);
        this.recChunks = [];
        this.recMime = mime || 'video/webm';
        this.recStream = this.recCanvas.captureStream(30);
        this.recorder = new MediaRecorder(this.recStream, mime ? { mimeType: mime } : undefined);
        this.recorder.ondataavailable = function (e) { if (e.data && e.data.size) self.recChunks.push(e.data); };
        this.recorder.onstop = function () {
            var blob = new Blob(self.recChunks, { type: self.recMime });
            self.showReplay(URL.createObjectURL(blob), blob);
        };
        this.recorder.start(200);
        this.recording = true;
        this.recBtn.textContent = '⏹ 녹화 중지';
        this.recBtn.classList.remove('dcg-btn--ghost');
        this.recBtn.classList.add('dcg-btn--recing');
        var loop = function () {
            if (!self.recording) return;
            if (!self.rolling) self.drawRec();
            self.recRaf = requestAnimationFrame(loop);
        };
        loop();
    };

    Game.prototype.stopRecord = function () {
        this.recording = false;
        if (this.recRaf) cancelAnimationFrame(this.recRaf);
        this.recRaf = null;
        if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
        if (this.recStream) this.recStream.getTracks().forEach(function (t) { t.stop(); });
        if (this.recBtn) {
            this.recBtn.textContent = '⏺ 녹화하기';
            this.recBtn.classList.add('dcg-btn--ghost');
            this.recBtn.classList.remove('dcg-btn--recing');
        }
    };

    Game.prototype.drawRec = function () {
        var ctx = this.recCtx;
        var g = this.geom;
        var h = g.h + 56;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, g.w, h);
        ctx.drawImage(this.canvas, 0, 0, g.w, g.h);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (!this.rolling && this.lastText) {
            ctx.fillStyle = '#f59e0b';
            ctx.font = '900 22px Pretendard,"Malgun Gothic",sans-serif';
            ctx.fillText('🎲 ' + this.lastText, g.w / 2, g.h + 26);
        } else {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '700 15px Pretendard,"Malgun Gothic",sans-serif';
            ctx.fillText(this.rolling ? '두구두구...' : '주사위 던지기', g.w / 2, g.h + 26);
        }
    };

    Game.prototype.showReplay = function (url, blob) {
        var self = this;
        this.replayHost.innerHTML = '';
        var box = el('div', 'dcg-replay');
        var video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.muted = true;
        video.playsInline = true;
        video.loop = true;
        box.appendChild(video);
        var row = el('div', 'dcg-replay-actions');
        var saveBtn = el('button', 'dcg-btn', '💾 영상 저장');
        saveBtn.type = 'button';
        saveBtn.addEventListener('click', function () {
            var d = new Date();
            var pad = function (v) { return ('0' + v).slice(-2); };
            var name = '주사위_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()) + '.webm';
            function fallback() {
                var a = document.createElement('a');
                a.href = url;
                a.download = name;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
            if (window.claude && typeof window.claude.use === 'function') {
                window.claude.use('downloads').then(function (downloads) {
                    if (!downloads) { fallback(); return; }
                    downloads.save({ filename: name, data: blob }).catch(function () {});
                });
                return;
            }
            fallback();
        });
        var closeBtn = el('button', 'dcg-btn dcg-btn--ghost', '닫기');
        closeBtn.type = 'button';
        closeBtn.addEventListener('click', function () {
            URL.revokeObjectURL(url);
            self.replayHost.innerHTML = '';
        });
        row.appendChild(saveBtn);
        row.appendChild(closeBtn);
        box.appendChild(row);
        this.replayHost.appendChild(box);
        video.play().catch(function () {});
    };

    Game.prototype.stopLoop = function () {
        if (this.recording) this.stopRecord();
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = null;
        this.rolling = false;
    };

    Game.prototype.destroy = function () {
        this.stopLoop();
        window.removeEventListener('resize', this.onResize);
        this.el.classList.remove('dcg');
        this.el.innerHTML = '';
    };

    global.DiceGame = {
        mount: function (target, opts) {
            var container = typeof target === 'string' ? document.querySelector(target) : target;
            if (!container) throw new Error('DiceGame: 대상 요소를 찾을 수 없습니다.');
            return new Game(container, opts || {});
        }
    };
})(window);
