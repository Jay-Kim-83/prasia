(function (global) {
    'use strict';

    var STYLE_ID = 'rlt-style';
    var COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#a855f7'];

    var CSS = ''
        + '.rlt{box-sizing:border-box;max-width:640px;margin:0 auto;font-family:Pretendard,"Malgun Gothic","맑은 고딕",sans-serif;color:#1e293b;color-scheme:light}'
        + '.rlt *{box-sizing:border-box}'
        + '.rlt-card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 24px 60px -24px rgba(79,70,229,.3);overflow:hidden}'
        + '.rlt-head{padding:20px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6 55%,#a855f7);color:#fff}'
        + '.rlt-title{margin:0;font-size:20px;font-weight:800;letter-spacing:-.02em}'
        + '.rlt-sub{margin:5px 0 0;font-size:13px;opacity:.88}'
        + '.rlt-body{padding:22px 24px 24px}'
        + '.rlt-sec{margin-bottom:18px}'
        + '.rlt-label{display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:#475569;margin-bottom:8px}'
        + '.rlt-count{font-size:12px;font-weight:700;color:#7c3aed;background:#f5f3ff;padding:2px 10px;border-radius:999px}'
        + '.rlt-inputrow{display:flex;gap:8px}'
        + '.rlt-input{flex:1;min-width:0;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:12px;font-size:14px;outline:none;background:#f8fafc;color:#1e293b;caret-color:#6366f1;transition:border-color .15s,box-shadow .15s,background .15s}'
        + '.rlt-input:focus{border-color:#8b5cf6;background:#fff;box-shadow:0 0 0 4px rgba(139,92,246,.12)}'
        + '.rlt-input::placeholder{color:#94a3b8;opacity:1}'
        + '.rlt-add{padding:0 18px;border:none;border-radius:12px;background:#eef2ff;color:#4f46e5;font-size:14px;font-weight:700;cursor:pointer;transition:background .15s}'
        + '.rlt-add:hover{background:#e0e7ff}'
        + '.rlt-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;min-height:36px}'
        + '.rlt-chip{display:inline-flex;align-items:center;gap:7px;padding:7px 8px 7px 12px;border-radius:999px;background:#f1f5f9;font-size:13px;font-weight:600;color:#334155;animation:rlt-pop .18s ease}'
        + '.rlt-chip i{width:8px;height:8px;border-radius:50%;flex:none}'
        + '.rlt-chip button{display:flex;align-items:center;justify-content:center;width:18px;height:18px;border:none;border-radius:50%;background:rgba(100,116,139,.15);color:#64748b;font-size:12px;line-height:1;cursor:pointer;padding:0}'
        + '.rlt-chip button:hover{background:#fecaca;color:#dc2626}'
        + '.rlt-chip--empty{color:#94a3b8;background:transparent;border:1.5px dashed #e2e8f0;font-weight:500}'
        + '.rlt-hint{font-size:12px;color:#94a3b8;margin:2px 0 14px}'
        + '.rlt-opt{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#475569;margin:0 0 16px;cursor:pointer;user-select:none}'
        + '.rlt-opt input{width:16px;height:16px;accent-color:#8b5cf6;cursor:pointer;margin:0}'
        + '.rlt-err{font-size:13px;font-weight:600;color:#ef4444;min-height:1.2em;margin-bottom:8px}'
        + '.rlt-btn{padding:12px 20px;border:none;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 10px 24px -10px rgba(99,102,241,.7);transition:transform .15s,box-shadow .15s,opacity .15s}'
        + '.rlt-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 14px 28px -10px rgba(99,102,241,.8)}'
        + '.rlt-btn:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}'
        + '.rlt-btn--full{width:100%}'
        + '.rlt-btn--ghost{background:#f1f5f9;color:#475569;box-shadow:none}'
        + '.rlt-btn--ghost:hover:not(:disabled){background:#e2e8f0;box-shadow:none}'
        + '.rlt-btn--recing{background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;animation:rlt-recpulse 1.2s ease infinite}'
        + '.rlt-stage{position:relative;max-width:520px;margin:0 auto}'
        + '.rlt-canvas{display:block;width:100%}'
        + '.rlt-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:88px;height:88px;border-radius:50%;border:none;background:#fff;color:#4f46e5;font-size:16px;font-weight:900;font-family:inherit;cursor:pointer;box-shadow:0 6px 24px rgba(15,23,42,.25),0 0 0 6px rgba(255,255,255,.6);transition:transform .15s,box-shadow .15s;letter-spacing:.02em}'
        + '.rlt-hub:hover:not(:disabled){transform:translate(-50%,-50%) scale(1.06)}'
        + '.rlt-hub:disabled{cursor:not-allowed;color:#a5b4fc}'
        + '.rlt-result{display:none;margin:14px auto 0;max-width:420px;text-align:center;padding:14px 18px;border-radius:14px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#fff;font-size:15px;box-shadow:0 10px 24px -10px rgba(245,158,11,.8);animation:rlt-pop .25s ease}'
        + '.rlt-result.show{display:block}'
        + '.rlt-result b{font-size:20px;font-weight:900}'
        + '.rlt-actions{display:flex;gap:8px;justify-content:center;margin-top:16px;flex-wrap:wrap}'
        + '.rlt-log{margin:16px 2px 0;display:flex;flex-direction:column;gap:7px}'
        + '.rlt-log-item{display:flex;align-items:center;gap:9px;font-size:13px;color:#475569;animation:rlt-pop .2s ease}'
        + '.rlt-log-item i{width:8px;height:8px;border-radius:50%;flex:none}'
        + '.rlt-log-item b{color:#1e293b}'
        + '.rlt-confetti{position:absolute;left:50%;top:50%;width:7px;height:7px;border-radius:2px;pointer-events:none;z-index:2;animation:rlt-burst .9s ease-out forwards}'
        + '.rlt-replay{margin-top:14px;display:flex;flex-direction:column;gap:8px;animation:rlt-pop .2s ease}'
        + '.rlt-replay video{width:100%;border-radius:14px;background:#0f172a;display:block}'
        + '.rlt-replay-actions{display:flex;gap:8px;justify-content:center}'
        + '@keyframes rlt-pop{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}'
        + '@keyframes rlt-burst{from{transform:translate(-50%,-50%) rotate(0);opacity:1}to{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(var(--rot));opacity:0}}'
        + '@keyframes rlt-recpulse{0%,100%{box-shadow:0 10px 24px -10px rgba(239,68,68,.8)}50%{box-shadow:0 10px 30px -4px rgba(239,68,68,1)}}'
        + '@media (max-width:520px){.rlt-body{padding:16px 14px 18px}.rlt-head{padding:16px 18px}.rlt-btn{font-size:13px;padding:10px 14px}.rlt-hub{width:72px;height:72px;font-size:14px}}';

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

    function rgba(hex, a) {
        var num = parseInt(hex.slice(1), 16);
        return 'rgba(' + ((num >> 16) & 255) + ',' + ((num >> 8) & 255) + ',' + (num & 255) + ',' + a + ')';
    }

    function Game(container, opts) {
        this.el = container;
        this.opts = {
            items: opts.items || null,
            duration: opts.duration || 4200,
            sizeRandom: !!opts.sizeRandom,
            title: opts.title || '룰렛 돌림판',
            onResult: opts.onResult || null
        };
        this.raf = null;
        this.rot = -Math.PI / 2;
        this.spinning = false;
        this.tick = this.tick.bind(this);
        this.onResize = this.relayout.bind(this);
        injectStyle();
        this.el.classList.add('rlt');
        this.card = el('div', 'rlt-card');
        this.el.innerHTML = '';
        this.el.appendChild(this.card);
        if (this.opts.items && this.opts.items.length >= 2) {
            this.start(this.opts.items.slice());
        } else {
            this.setupItems = [];
            this.renderSetup();
        }
    }

    Game.prototype.head = function (sub) {
        var head = el('div', 'rlt-head');
        head.appendChild(el('h2', 'rlt-title', '🎡 ' + this.opts.title));
        head.appendChild(el('p', 'rlt-sub', sub));
        return head;
    };

    Game.prototype.renderSetup = function () {
        var self = this;
        if (this.recording) this.stopRecord();
        window.removeEventListener('resize', this.onResize);
        this.card.innerHTML = '';
        this.card.appendChild(this.head('항목을 넣고 돌림판을 만들어 보세요'));
        var body = el('div', 'rlt-body');
        var err = el('div', 'rlt-err', '');
        var list = this.setupItems;

        var sec = el('div', 'rlt-sec');
        var label = el('div', 'rlt-label');
        label.appendChild(el('span', null, '항목 (2~16개)'));
        var count = el('span', 'rlt-count', '0');
        label.appendChild(count);
        var row = el('div', 'rlt-inputrow');
        var input = el('input', 'rlt-input');
        input.placeholder = '예) 치킨, 피자, 족발, 커피';
        var addBtn = el('button', 'rlt-add', '추가');
        addBtn.type = 'button';
        row.appendChild(input);
        row.appendChild(addBtn);
        var chips = el('div', 'rlt-chips');

        function render() {
            chips.innerHTML = '';
            if (!list.length) chips.appendChild(el('span', 'rlt-chip rlt-chip--empty', '아직 없어요'));
            list.forEach(function (name, i) {
                var chip = el('span', 'rlt-chip');
                var dot = el('i');
                dot.style.background = COLORS[i % COLORS.length];
                chip.appendChild(dot);
                chip.appendChild(el('span', null, name));
                var x = el('button', null, '×');
                x.type = 'button';
                x.addEventListener('click', function () { list.splice(i, 1); render(); });
                chip.appendChild(x);
                chips.appendChild(chip);
            });
            count.textContent = String(list.length);
            createBtn.disabled = list.length < 2;
        }

        function add(raw) {
            raw.split(/[,\r\n]+/).map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (entry) {
                var m = entry.match(/^(.+?)\s*[*xX×]\s*(\d{1,2})$/);
                var name = m ? m[1].trim() : entry;
                var cnt = m ? Math.max(1, Math.min(16, parseInt(m[2], 10))) : 1;
                for (var k = 0; k < cnt; k++) {
                    if (list.length >= 16) { err.textContent = '최대 16개까지 넣을 수 있어요.'; return; }
                    err.textContent = '';
                    list.push(name);
                }
            });
            render();
        }

        addBtn.addEventListener('click', function () {
            if (input.value.trim()) { add(input.value); input.value = ''; }
            input.focus();
        });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (input.value.trim()) { add(input.value); input.value = ''; }
            }
        });
        input.addEventListener('input', function () {
            if (input.value.indexOf(',') >= 0) {
                var parts = input.value.split(',');
                input.value = parts.pop();
                add(parts.join(','));
            }
        });
        input.addEventListener('paste', function (e) {
            var text = (e.clipboardData || window.clipboardData).getData('text');
            if (text && /[,\r\n]/.test(text)) {
                e.preventDefault();
                add(text);
                input.value = '';
            }
        });

        sec.appendChild(label);
        sec.appendChild(row);
        sec.appendChild(chips);
        body.appendChild(sec);
        body.appendChild(el('p', 'rlt-hint', '쉼표·줄바꿈으로 한 번에 붙여넣을 수 있고, "치킨*3"처럼 쓰면 같은 항목이 3칸 들어가요.'));
        var opt = el('label', 'rlt-opt');
        var sizeChk = el('input');
        sizeChk.type = 'checkbox';
        sizeChk.checked = !!this.opts.sizeRandom;
        opt.appendChild(sizeChk);
        opt.appendChild(el('span', null, '🎲 칸 크기 랜덤 (큰 칸일수록 잘 걸려요)'));
        body.appendChild(opt);
        body.appendChild(err);

        var createBtn = el('button', 'rlt-btn rlt-btn--full', '돌림판 만들기 🎡');
        createBtn.type = 'button';
        createBtn.addEventListener('click', function () {
            if (list.length < 2) return;
            self.fromSetup = true;
            self.opts.sizeRandom = sizeChk.checked;
            self.start(list.slice());
        });
        body.appendChild(createBtn);
        this.card.appendChild(body);
        render();
    };

    Game.prototype.expand = function (items) {
        var out = [];
        items.forEach(function (entry) {
            var m = String(entry).match(/^(.+?)\s*[*xX×]\s*(\d{1,2})$/);
            var name = m ? m[1].trim() : String(entry);
            var cnt = m ? Math.max(1, Math.min(16, parseInt(m[2], 10))) : 1;
            for (var k = 0; k < cnt && out.length < 16; k++) out.push(name);
        });
        return out;
    };

    Game.prototype.genWeights = function () {
        var self = this;
        this.weights = this.items.map(function () {
            return self.opts.sizeRandom ? 0.55 + Math.random() * 1.45 : 1;
        });
        this.computeAngles();
    };

    Game.prototype.computeAngles = function () {
        var total = 0;
        for (var i = 0; i < this.weights.length; i++) total += this.weights[i];
        var acc = 0;
        this.segs = this.weights.map(function (w) {
            var s = { start: acc / total * Math.PI * 2, size: w / total * Math.PI * 2 };
            acc += w;
            return s;
        });
    };

    Game.prototype.start = function (items) {
        this.items = this.expand(items);
        this.genWeights();
        this.rot = -Math.PI / 2;
        this.spinning = false;
        this.lastWin = null;
        this.renderBoard();
        this.relayout();
        window.addEventListener('resize', this.onResize);
    };

    Game.prototype.renderBoard = function () {
        var self = this;
        this.card.innerHTML = '';
        this.card.appendChild(this.head('항목 ' + this.items.length + '개 · 가운데 버튼을 누르면 돌아가요'));
        var body = el('div', 'rlt-body');

        var stage = el('div', 'rlt-stage');
        this.canvas = el('canvas', 'rlt-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.hub = el('button', 'rlt-hub', '돌리기');
        this.hub.type = 'button';
        this.hub.addEventListener('click', function () { self.spin(); });
        stage.appendChild(this.canvas);
        stage.appendChild(this.hub);
        this.stage = stage;

        this.result = el('div', 'rlt-result');

        var actions = el('div', 'rlt-actions');
        var removeBtn = el('button', 'rlt-btn rlt-btn--ghost', '당첨 항목 제거');
        removeBtn.type = 'button';
        removeBtn.disabled = true;
        removeBtn.addEventListener('click', function () { self.removeWinner(); });
        this.removeBtn = removeBtn;
        var recBtn = el('button', 'rlt-btn rlt-btn--ghost', '⏺ 녹화하기');
        recBtn.type = 'button';
        recBtn.addEventListener('click', function () { self.toggleRecord(); });
        this.recBtn = recBtn;
        actions.appendChild(removeBtn);
        if (this.opts.sizeRandom) {
            var sizeBtn = el('button', 'rlt-btn rlt-btn--ghost', '🎲 크기 섞기');
            sizeBtn.type = 'button';
            sizeBtn.addEventListener('click', function () {
                if (self.spinning) return;
                self.genWeights();
                self.draw();
            });
            actions.appendChild(sizeBtn);
        }
        actions.appendChild(recBtn);
        if (this.fromSetup) {
            var backBtn = el('button', 'rlt-btn rlt-btn--ghost', '새로 설정');
            backBtn.type = 'button';
            backBtn.addEventListener('click', function () {
                self.stopLoop();
                self.setupItems = self.items.slice();
                self.renderSetup();
            });
            actions.appendChild(backBtn);
        }

        this.log = el('div', 'rlt-log');
        this.replayHost = el('div');
        this.recording = false;

        body.appendChild(stage);
        body.appendChild(this.result);
        body.appendChild(actions);
        body.appendChild(this.replayHost);
        body.appendChild(this.log);
        this.card.appendChild(body);
    };

    Game.prototype.relayout = function () {
        if (!this.canvas || !this.canvas.isConnected) return;
        var side = Math.min(520, this.canvas.parentNode.clientWidth || 520);
        var dpr = window.devicePixelRatio || 1;
        this.canvas.style.height = side + 'px';
        this.canvas.width = Math.round(side * dpr);
        this.canvas.height = Math.round(side * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.geom = { side: side, cx: side / 2, cy: side / 2, r: side / 2 - 16 };
        this.draw();
    };

    Game.prototype.draw = function () {
        var ctx = this.ctx;
        var g = this.geom;
        var n = this.items.length;
        ctx.clearRect(0, 0, g.side, g.side);

        ctx.beginPath();
        ctx.arc(g.cx, g.cy, g.r + 10, 0, Math.PI * 2);
        ctx.fillStyle = '#eef2ff';
        ctx.fill();

        for (var i = 0; i < n; i++) {
            var a0 = this.rot + this.segs[i].start;
            ctx.beginPath();
            ctx.moveTo(g.cx, g.cy);
            ctx.arc(g.cx, g.cy, g.r, a0, a0 + this.segs[i].size);
            ctx.closePath();
            ctx.fillStyle = COLORS[i % COLORS.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        var basePx = Math.max(11, Math.round(g.side / 34));
        var maxW = g.r - 64;
        for (var j = 0; j < n; j++) {
            var mid = this.rot + this.segs[j].start + this.segs[j].size / 2;
            var px = Math.max(9, Math.min(basePx, Math.round(this.segs[j].size / 0.36 * basePx)));
            ctx.font = '700 ' + px + 'px Pretendard,"Malgun Gothic",sans-serif';
            ctx.save();
            ctx.translate(g.cx, g.cy);
            ctx.rotate(mid);
            var label = this.items[j];
            while (label.length > 1 && ctx.measureText(label).width > maxW) {
                label = label.slice(0, -1);
            }
            if (label !== this.items[j]) label = label.slice(0, -1) + '…';
            ctx.fillText(label, g.r - 14, 0);
            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(g.cx, g.cy, 52, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(g.cx - 13, g.cy - g.r - 10);
        ctx.lineTo(g.cx + 13, g.cy - g.r - 10);
        ctx.lineTo(g.cx, g.cy - g.r + 16);
        ctx.closePath();
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
    };

    Game.prototype.spin = function () {
        if (this.spinning || this.items.length < 2) return;
        var totalW = 0;
        for (var i = 0; i < this.weights.length; i++) totalW += this.weights[i];
        var pick = Math.random() * totalW;
        var idx = this.weights.length - 1;
        for (var j = 0; j < this.weights.length; j++) {
            pick -= this.weights[j];
            if (pick <= 0) { idx = j; break; }
        }
        var land = this.segs[idx].start + this.segs[idx].size * (0.5 + (Math.random() - 0.5) * 0.6);
        var target = -Math.PI / 2 - land;
        var delta = ((target - this.rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        var turns = 5 + Math.floor(Math.random() * 3);
        this.spinIdx = idx;
        this.a0 = this.rot;
        this.a1 = this.rot + turns * Math.PI * 2 + delta;
        this.t0 = performance.now();
        this.dur = this.opts.duration;
        this.spinning = true;
        this.hub.disabled = true;
        this.hub.textContent = '두구두구';
        this.result.classList.remove('show');
        this.removeBtn.disabled = true;
        if (!this.raf) this.raf = requestAnimationFrame(this.tick);
    };

    Game.prototype.tick = function (now) {
        this.raf = null;
        if (!this.spinning) return;
        var t = Math.min(1, (now - this.t0) / this.dur);
        var e = 1 - Math.pow(1 - t, 4);
        this.rot = this.a0 + (this.a1 - this.a0) * e;
        this.draw();
        if (this.recording) this.drawRec();
        if (t >= 1) { this.finishSpin(); return; }
        this.raf = requestAnimationFrame(this.tick);
    };

    Game.prototype.finishSpin = function () {
        this.spinning = false;
        this.rot = ((this.a1 + Math.PI / 2) % (Math.PI * 2)) - Math.PI / 2;
        this.draw();
        if (this.recording) this.drawRec();
        var item = this.items[this.spinIdx];
        var color = COLORS[this.spinIdx % COLORS.length];
        this.lastWin = this.spinIdx;
        this.hub.disabled = false;
        this.hub.textContent = '한번 더';
        this.result.innerHTML = '';
        this.result.appendChild(document.createTextNode('🎉 당첨 '));
        this.result.appendChild(el('b', null, item));
        this.result.classList.add('show');
        this.removeBtn.disabled = false;
        this.confetti(this.stage);
        var li = el('div', 'rlt-log-item');
        var dot = el('i');
        dot.style.background = color;
        li.appendChild(dot);
        var txt = el('span');
        txt.appendChild(document.createTextNode((this.log.children.length + 1) + '번째 · '));
        txt.appendChild(el('b', null, item));
        li.appendChild(txt);
        this.log.insertBefore(li, this.log.firstChild);
        if (typeof this.opts.onResult === 'function') this.opts.onResult(item, this.spinIdx);
    };

    Game.prototype.removeWinner = function () {
        if (this.lastWin == null || this.spinning) return;
        this.items.splice(this.lastWin, 1);
        this.weights.splice(this.lastWin, 1);
        if (this.weights.length) this.computeAngles();
        this.lastWin = null;
        this.result.classList.remove('show');
        this.removeBtn.disabled = true;
        if (this.items.length < 2) {
            this.hub.disabled = true;
            this.hub.textContent = '항목 부족';
            this.result.textContent = '남은 항목: ' + (this.items[0] || '없음');
            this.result.classList.add('show');
        } else {
            this.hub.textContent = '돌리기';
        }
        var subEl = this.card.querySelector('.rlt-sub');
        if (subEl) subEl.textContent = '항목 ' + this.items.length + '개 · 가운데 버튼을 누르면 돌아가요';
        this.draw();
    };

    Game.prototype.confetti = function (host) {
        for (var i = 0; i < 18; i++) {
            var piece = el('span', 'rlt-confetti');
            piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
            piece.style.setProperty('--dx', (Math.random() * 220 - 110) + 'px');
            piece.style.setProperty('--dy', (Math.random() * -160 - 20) + 'px');
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
        var w = this.geom.side;
        var h = this.geom.side + 56;
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
        this.recBtn.classList.remove('rlt-btn--ghost');
        this.recBtn.classList.add('rlt-btn--recing');
        var loop = function () {
            if (!self.recording) return;
            if (!self.spinning) self.drawRec();
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
            this.recBtn.classList.add('rlt-btn--ghost');
            this.recBtn.classList.remove('rlt-btn--recing');
        }
    };

    Game.prototype.drawRec = function () {
        var ctx = this.recCtx;
        var g = this.geom;
        var h = g.side + 56;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, g.side, h);
        ctx.drawImage(this.canvas, 0, 0, g.side, g.side);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (this.lastWin != null && !this.spinning) {
            ctx.fillStyle = '#f59e0b';
            ctx.font = '900 22px Pretendard,"Malgun Gothic",sans-serif';
            ctx.fillText('🎉 ' + this.items[this.lastWin], g.side / 2, g.side + 26);
        } else {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '700 15px Pretendard,"Malgun Gothic",sans-serif';
            ctx.fillText(this.spinning ? '두구두구...' : '룰렛 돌림판', g.side / 2, g.side + 26);
        }
    };

    Game.prototype.showReplay = function (url, blob) {
        var self = this;
        this.replayHost.innerHTML = '';
        var box = el('div', 'rlt-replay');
        var video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.muted = true;
        video.playsInline = true;
        video.loop = true;
        box.appendChild(video);
        var row = el('div', 'rlt-replay-actions');
        var saveBtn = el('button', 'rlt-btn', '💾 영상 저장');
        saveBtn.type = 'button';
        saveBtn.addEventListener('click', function () {
            var d = new Date();
            var pad = function (v) { return ('0' + v).slice(-2); };
            var name = '룰렛_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()) + '.webm';
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
        var closeBtn = el('button', 'rlt-btn rlt-btn--ghost', '닫기');
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
        this.spinning = false;
    };

    Game.prototype.destroy = function () {
        this.stopLoop();
        window.removeEventListener('resize', this.onResize);
        this.el.classList.remove('rlt');
        this.el.innerHTML = '';
    };

    global.RouletteGame = {
        mount: function (target, opts) {
            var container = typeof target === 'string' ? document.querySelector(target) : target;
            if (!container) throw new Error('RouletteGame: 대상 요소를 찾을 수 없습니다.');
            return new Game(container, opts || {});
        }
    };
})(window);
