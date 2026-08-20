(function (global) {
    'use strict';

    var STYLE_ID = 'ldg-style';
    var COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#a855f7'];

    var CSS = ''
        + '.ldg{box-sizing:border-box;max-width:820px;margin:0 auto;font-family:Pretendard,"Malgun Gothic","맑은 고딕",sans-serif;color:#1e293b;color-scheme:light}'
        + '.ldg *{box-sizing:border-box}'
        + '.ldg-card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 24px 60px -24px rgba(79,70,229,.3);overflow:hidden}'
        + '.ldg-head{padding:20px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6 55%,#a855f7);color:#fff}'
        + '.ldg-title{margin:0;font-size:20px;font-weight:800;letter-spacing:-.02em}'
        + '.ldg-sub{margin:5px 0 0;font-size:13px;opacity:.88}'
        + '.ldg-body{padding:22px 24px 24px}'
        + '.ldg-sec{margin-bottom:18px}'
        + '.ldg-label{display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:#475569;margin-bottom:8px}'
        + '.ldg-count{font-size:12px;font-weight:700;color:#7c3aed;background:#f5f3ff;padding:2px 10px;border-radius:999px}'
        + '.ldg-inputrow{display:flex;gap:8px}'
        + '.ldg-input{flex:1;min-width:0;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:12px;font-size:14px;outline:none;background:#f8fafc;color:#1e293b;caret-color:#6366f1;transition:border-color .15s,box-shadow .15s,background .15s}'
        + '.ldg-input:focus{border-color:#8b5cf6;background:#fff;box-shadow:0 0 0 4px rgba(139,92,246,.12)}'
        + '.ldg-input::placeholder{color:#94a3b8;opacity:1}'
        + '.ldg-add{padding:0 18px;border:none;border-radius:12px;background:#eef2ff;color:#4f46e5;font-size:14px;font-weight:700;cursor:pointer;transition:background .15s}'
        + '.ldg-add:hover{background:#e0e7ff}'
        + '.ldg-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;min-height:36px}'
        + '.ldg-chip{display:inline-flex;align-items:center;gap:7px;padding:7px 8px 7px 12px;border-radius:999px;background:#f1f5f9;font-size:13px;font-weight:600;color:#334155;animation:ldg-pop .18s ease}'
        + '.ldg-chip i{width:8px;height:8px;border-radius:50%;flex:none}'
        + '.ldg-chip button{display:flex;align-items:center;justify-content:center;width:18px;height:18px;border:none;border-radius:50%;background:rgba(100,116,139,.15);color:#64748b;font-size:12px;line-height:1;cursor:pointer;padding:0}'
        + '.ldg-chip button:hover{background:#fecaca;color:#dc2626}'
        + '.ldg-chip--empty{color:#94a3b8;background:transparent;border:1.5px dashed #e2e8f0;font-weight:500}'
        + '.ldg-hint{font-size:12px;color:#94a3b8;margin:2px 0 16px}'
        + '.ldg-err{font-size:13px;font-weight:600;color:#ef4444;min-height:1.2em;margin-bottom:8px;transition:opacity .2s}'
        + '.ldg-btn{padding:12px 20px;border:none;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 10px 24px -10px rgba(99,102,241,.7);transition:transform .15s,box-shadow .15s,opacity .15s}'
        + '.ldg-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 14px 28px -10px rgba(99,102,241,.8)}'
        + '.ldg-btn:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}'
        + '.ldg-btn--full{width:100%}'
        + '.ldg-btn--ghost{background:#f1f5f9;color:#475569;box-shadow:none}'
        + '.ldg-btn--ghost:hover:not(:disabled){background:#e2e8f0;box-shadow:none}'
        + '.ldg-line{display:flex}'
        + '.ldg-cell{flex:1;display:flex;justify-content:center;align-items:center;min-width:0;padding:2px;position:relative}'
        + '.ldg-pill{max-width:100%;padding:7px 12px;border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:transform .15s,filter .15s}'
        + '.ldg-pill:hover:not(:disabled){transform:translateY(-2px)}'
        + '.ldg-pill:disabled{cursor:default;filter:saturate(.75);opacity:.9}'
        + '.ldg-prize{max-width:100%;padding:7px 12px;border-radius:10px;background:#f1f5f9;color:#94a3b8;font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
        + '.ldg-prize--flip{animation:ldg-flip .5s ease}'
        + '.ldg-prize--win{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#fff;box-shadow:0 8px 18px -8px rgba(245,158,11,.8)}'
        + '.ldg-prize--lose{background:#e2e8f0;color:#64748b}'
        + '.ldg-canvas{display:block;width:100%}'
        + '.ldg-stage{position:relative}'
        + '.ldg-blind{position:absolute;left:-8px;right:-8px;top:47%;bottom:-4px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:repeating-linear-gradient(-45deg,rgba(255,255,255,.07) 0 14px,rgba(255,255,255,0) 14px 28px),linear-gradient(180deg,rgba(99,102,241,.94),rgba(139,92,246,.97));color:#fff;font-size:14px;font-weight:800;letter-spacing:.02em;cursor:pointer;z-index:3;opacity:0;visibility:hidden;transform:translateY(16px);transition:opacity .35s ease,transform .35s ease,visibility .35s;box-shadow:0 12px 30px -14px rgba(99,102,241,.8)}'
        + '.ldg-blind--on{opacity:1;visibility:visible;transform:translateY(0)}'
        + '.ldg-log--blur{filter:blur(5px);pointer-events:none;user-select:none}'
        + '.ldg-actions{display:flex;gap:8px;justify-content:center;margin-top:16px;flex-wrap:wrap}'
        + '.ldg-log{margin:16px 2px 0;display:flex;flex-direction:column;gap:7px;transition:filter .3s}'
        + '.ldg-log-item{display:flex;align-items:center;gap:9px;font-size:13px;color:#475569;animation:ldg-pop .2s ease}'
        + '.ldg-log-item i{width:8px;height:8px;border-radius:50%;flex:none}'
        + '.ldg-log-item b{color:#1e293b}'
        + '.ldg-log-item .ldg-win{color:#b45309;font-weight:800}'
        + '.ldg-confetti{position:absolute;left:50%;top:50%;width:7px;height:7px;border-radius:2px;pointer-events:none;z-index:2;animation:ldg-burst .8s ease-out forwards}'
        + '.ldg-btn--recing{background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;animation:ldg-recpulse 1.2s ease infinite}'
        + '.ldg-replay{margin-top:14px;display:flex;flex-direction:column;gap:8px;animation:ldg-pop .2s ease}'
        + '.ldg-replay video{width:100%;border-radius:14px;background:#0f172a;display:block}'
        + '.ldg-replay-actions{display:flex;gap:8px;justify-content:center}'
        + '@keyframes ldg-recpulse{0%,100%{box-shadow:0 10px 24px -10px rgba(239,68,68,.8)}50%{box-shadow:0 10px 30px -4px rgba(239,68,68,1)}}'
        + '@keyframes ldg-pop{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}'
        + '@keyframes ldg-flip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}'
        + '@keyframes ldg-burst{from{transform:translate(-50%,-50%) rotate(0);opacity:1}to{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(var(--rot));opacity:0}}'
        + '@media (max-width:520px){.ldg-body{padding:16px 14px 18px}.ldg-head{padding:16px 18px}.ldg-pill,.ldg-prize{font-size:11px;padding:6px 7px}.ldg-btn{font-size:13px;padding:10px 14px}}';

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

    function shade(hex, ratio) {
        var num = parseInt(hex.slice(1), 16);
        var r = Math.max(0, Math.min(255, Math.round(((num >> 16) & 255) * (1 + ratio))));
        var g = Math.max(0, Math.min(255, Math.round(((num >> 8) & 255) * (1 + ratio))));
        var b = Math.max(0, Math.min(255, Math.round((num & 255) * (1 + ratio))));
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    function rgba(hex, a) {
        var num = parseInt(hex.slice(1), 16);
        return 'rgba(' + ((num >> 16) & 255) + ',' + ((num >> 8) & 255) + ',' + (num & 255) + ',' + a + ')';
    }

    function roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function Game(container, opts) {
        this.el = container;
        this.opts = {
            players: opts.players || null,
            prizes: opts.prizes || null,
            rows: opts.rows || 14,
            duration: opts.duration || 1300,
            title: opts.title || '사다리 타기',
            onResult: opts.onResult || null
        };
        this.raf = null;
        this.onResize = this.relayout.bind(this);
        this.tick = this.tick.bind(this);
        injectStyle();
        this.el.classList.add('ldg');
        this.card = el('div', 'ldg-card');
        this.el.innerHTML = '';
        this.el.appendChild(this.card);
        if (this.opts.players && this.opts.players.length >= 2) {
            this.start(this.opts.players.slice(), this.opts.prizes ? this.opts.prizes.slice() : []);
        } else {
            this.setupPlayers = [];
            this.setupPrizes = [];
            this.renderSetup();
        }
    }

    Game.prototype.head = function (sub) {
        var head = el('div', 'ldg-head');
        head.appendChild(el('h2', 'ldg-title', '🪜 ' + this.opts.title));
        head.appendChild(el('p', 'ldg-sub', sub));
        return head;
    };

    Game.prototype.renderSetup = function () {
        var self = this;
        if (this.recording) this.stopRecord();
        window.removeEventListener('resize', this.onResize);
        this.card.innerHTML = '';
        this.card.appendChild(this.head('참가자와 결과를 넣고 사다리를 만들어 보세요'));
        var body = el('div', 'ldg-body');

        var err = el('div', 'ldg-err', '');

        function section(labelText, placeholder, list, dotColor) {
            var sec = el('div', 'ldg-sec');
            var label = el('div', 'ldg-label');
            label.appendChild(el('span', null, labelText));
            var count = el('span', 'ldg-count', '0');
            label.appendChild(count);
            var row = el('div', 'ldg-inputrow');
            var input = el('input', 'ldg-input');
            input.placeholder = placeholder;
            var addBtn = el('button', 'ldg-add', '추가');
            addBtn.type = 'button';
            row.appendChild(input);
            row.appendChild(addBtn);
            var chips = el('div', 'ldg-chips');

            function render() {
                chips.innerHTML = '';
                if (!list.length) {
                    chips.appendChild(el('span', 'ldg-chip ldg-chip--empty', '아직 없어요'));
                }
                list.forEach(function (name, i) {
                    var chip = el('span', 'ldg-chip');
                    var dot = el('i');
                    dot.style.background = dotColor ? dotColor : COLORS[i % COLORS.length];
                    chip.appendChild(dot);
                    chip.appendChild(el('span', null, name));
                    var x = el('button', null, '×');
                    x.type = 'button';
                    x.addEventListener('click', function () {
                        list.splice(i, 1);
                        render();
                    });
                    chip.appendChild(x);
                    chips.appendChild(chip);
                });
                count.textContent = String(list.length);
                self.syncCreateBtn();
            }

            function add(raw) {
                raw.split(/[,\r\n]+/).map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (name) {
                    if (list.length >= 12) {
                        err.textContent = '최대 12개까지 넣을 수 있어요.';
                        return;
                    }
                    err.textContent = '';
                    list.push(name);
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
            render();
            return sec;
        }

        body.appendChild(section('참가자 (2~12명)', '이름 입력 후 Enter', this.setupPlayers, null));
        body.appendChild(section('결과 (상품·벌칙 등)', '예) 커피, 아이스크림', this.setupPrizes, '#f59e0b'));
        body.appendChild(el('p', 'ldg-hint', '결과가 비어 있으면 당첨 1개 + 나머지 꽝, 부족하면 나머지는 꽝으로 채워져요.'));
        body.appendChild(err);

        var createBtn = el('button', 'ldg-btn ldg-btn--full', '사다리 만들기 🎲');
        createBtn.type = 'button';
        createBtn.addEventListener('click', function () {
            if (self.setupPlayers.length < 2) return;
            self.fromSetup = true;
            self.start(self.setupPlayers.slice(), self.setupPrizes.slice());
        });
        body.appendChild(createBtn);
        this.createBtn = createBtn;
        this.card.appendChild(body);
        this.syncCreateBtn();
    };

    Game.prototype.syncCreateBtn = function () {
        if (this.createBtn) this.createBtn.disabled = !this.setupPlayers || this.setupPlayers.length < 2;
    };

    Game.prototype.start = function (players, prizes) {
        this.players = players;
        this.basePrizes = prizes;
        this.prizes = this.normalizePrizes(prizes, players.length);
        this.rows = Math.max(8, this.opts.rows);
        this.generate();
        this.renderBoard();
        this.relayout();
        window.addEventListener('resize', this.onResize);
    };

    Game.prototype.normalizePrizes = function (prizes, n) {
        var list = (prizes || []).slice(0, n);
        if (list.length === 0) list.push('당첨 🎉');
        while (list.length < n) list.push('꽝');
        for (var i = list.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
        }
        return list;
    };

    Game.prototype.generate = function () {
        var n = this.players.length;
        this.rungs = [];
        this.paths = [];
        this.traced = {};
        this.revealedEnds = {};
        for (var r = 0; r < this.rows; r++) {
            var row = [];
            for (var g = 0; g < n - 1; g++) {
                row.push(!(g > 0 && row[g - 1]) && Math.random() < 0.36);
            }
            this.rungs.push(row);
        }
        for (var g2 = 0; g2 < n - 1; g2++) {
            var has = this.rungs.some(function (row) { return row[g2]; });
            if (has) continue;
            for (var attempt = 0; attempt < 50; attempt++) {
                var rr = Math.floor(Math.random() * this.rows);
                var row2 = this.rungs[rr];
                if (!(g2 > 0 && row2[g2 - 1]) && !(g2 < n - 2 && row2[g2 + 1])) {
                    row2[g2] = true;
                    break;
                }
            }
        }
    };

    Game.prototype.renderBoard = function () {
        var self = this;
        this.card.innerHTML = '';
        this.card.appendChild(this.head('참가자 ' + this.players.length + '명 · 이름을 누르면 길을 따라가요'));
        var body = el('div', 'ldg-body');

        var top = el('div', 'ldg-line');
        this.nameBtns = [];
        this.players.forEach(function (name, i) {
            var cell = el('div', 'ldg-cell');
            var color = COLORS[i % COLORS.length];
            var btn = el('button', 'ldg-pill', name);
            btn.type = 'button';
            btn.title = name;
            btn.style.background = 'linear-gradient(135deg,' + color + ',' + shade(color, -0.22) + ')';
            btn.style.boxShadow = '0 8px 16px -8px ' + rgba(color, 0.9);
            btn.addEventListener('click', function () { self.trace(i, 0); });
            cell.appendChild(btn);
            top.appendChild(cell);
            self.nameBtns.push(btn);
        });

        this.canvas = el('canvas', 'ldg-canvas');
        this.ctx = this.canvas.getContext('2d');

        var bottom = el('div', 'ldg-line');
        this.prizeCells = [];
        this.prizes.forEach(function () {
            var cell = el('div', 'ldg-cell');
            var card = el('div', 'ldg-prize', '?');
            cell.appendChild(card);
            bottom.appendChild(cell);
            self.prizeCells.push(card);
        });

        var actions = el('div', 'ldg-actions');
        var allBtn = el('button', 'ldg-btn', '모두 열기 ✨');
        allBtn.type = 'button';
        allBtn.addEventListener('click', function () { self.revealAll(); });
        var blindBtn = el('button', 'ldg-btn ldg-btn--ghost', '🙈 결과 가리기');
        blindBtn.type = 'button';
        blindBtn.addEventListener('click', function () { self.toggleBlind(); });
        this.blindBtn = blindBtn;
        var shuffleBtn = el('button', 'ldg-btn ldg-btn--ghost', '다시 섞기');
        shuffleBtn.type = 'button';
        shuffleBtn.addEventListener('click', function () { self.reshuffle(); });
        var recBtn = el('button', 'ldg-btn ldg-btn--ghost', '⏺ 녹화하기');
        recBtn.type = 'button';
        recBtn.addEventListener('click', function () { self.toggleRecord(); });
        this.recBtn = recBtn;
        actions.appendChild(allBtn);
        actions.appendChild(blindBtn);
        actions.appendChild(shuffleBtn);
        actions.appendChild(recBtn);
        if (this.fromSetup) {
            var backBtn = el('button', 'ldg-btn ldg-btn--ghost', '새로 설정');
            backBtn.type = 'button';
            backBtn.addEventListener('click', function () { self.stopLoop(); self.renderSetup(); });
            actions.appendChild(backBtn);
        }

        this.log = el('div', 'ldg-log');
        this.replayHost = el('div');

        var stage = el('div', 'ldg-stage');
        stage.appendChild(this.canvas);
        stage.appendChild(bottom);
        this.blind = el('div', 'ldg-blind', '🙈 결과 가리는 중 · 누르면 공개');
        this.blind.addEventListener('click', function () { self.toggleBlind(); });
        stage.appendChild(this.blind);
        this.blindOn = false;
        this.recording = false;

        body.appendChild(top);
        body.appendChild(stage);
        body.appendChild(actions);
        body.appendChild(this.replayHost);
        body.appendChild(this.log);
        this.card.appendChild(body);
    };

    Game.prototype.relayout = function () {
        if (!this.canvas || !this.canvas.isConnected) return;
        var w = this.canvas.clientWidth || this.canvas.parentNode.clientWidth;
        var h = Math.min(460, Math.max(300, this.rows * 26));
        var dpr = window.devicePixelRatio || 1;
        this.canvas.style.height = h + 'px';
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.geom = { w: w, h: h, topY: 12, botY: h - 12 };
        this.draw();
    };

    Game.prototype.colX = function (i) {
        return (i + 0.5) * this.geom.w / this.players.length;
    };

    Game.prototype.pointsFor = function (start) {
        var g = this.geom;
        var gapY = (g.botY - g.topY) / (this.rows + 1);
        var c = start;
        var pts = [[this.colX(c), g.topY]];
        for (var r = 0; r < this.rows; r++) {
            var y = g.topY + (r + 1) * gapY;
            if (this.rungs[r][c]) {
                pts.push([this.colX(c), y], [this.colX(c + 1), y]);
                c++;
            } else if (c > 0 && this.rungs[r][c - 1]) {
                pts.push([this.colX(c), y], [this.colX(c - 1), y]);
                c--;
            }
        }
        pts.push([this.colX(c), g.botY]);
        return { pts: pts, end: c };
    };

    Game.prototype.draw = function () {
        var ctx = this.ctx;
        var g = this.geom;
        var n = this.players.length;
        var gapY = (g.botY - g.topY) / (this.rows + 1);
        ctx.clearRect(0, 0, g.w, g.h);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#d5dde9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (var i = 0; i < n; i++) {
            ctx.moveTo(this.colX(i), g.topY);
            ctx.lineTo(this.colX(i), g.botY);
        }
        for (var r = 0; r < this.rows; r++) {
            var y = g.topY + (r + 1) * gapY;
            for (var c = 0; c < n - 1; c++) {
                if (this.rungs[r][c]) {
                    ctx.moveTo(this.colX(c), y);
                    ctx.lineTo(this.colX(c + 1), y);
                }
            }
        }
        ctx.stroke();
        for (var a = 0; a < n; a++) {
            ctx.fillStyle = COLORS[a % COLORS.length];
            ctx.beginPath();
            ctx.arc(this.colX(a), g.topY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(this.colX(a), g.botY, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
        for (var p = 0; p < this.paths.length; p++) {
            var path = this.paths[p];
            if (path.progress <= 0) continue;
            var pts = this.pointsFor(path.start).pts;
            var headPt = this.drawPath(pts, path.progress, path.color);
            if (path.progress < 1 && headPt) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(headPt[0], headPt[1], 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = path.color;
                ctx.beginPath();
                ctx.arc(headPt[0], headPt[1], 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    Game.prototype.drawPath = function (pts, ratio, color) {
        var ctx = this.ctx;
        var total = 0;
        var segs = [];
        for (var i = 1; i < pts.length; i++) {
            var len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
            segs.push(len);
            total += len;
        }
        var remain = total * Math.min(1, ratio);
        var head = pts[pts.length - 1];
        ctx.strokeStyle = color;
        ctx.lineWidth = 4.5;
        ctx.globalAlpha = 0.92;
        ctx.shadowColor = rgba(color, 0.5);
        ctx.shadowBlur = 7;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var s = 0; s < segs.length; s++) {
            if (remain >= segs[s]) {
                ctx.lineTo(pts[s + 1][0], pts[s + 1][1]);
                remain -= segs[s];
            } else {
                var t = segs[s] ? remain / segs[s] : 0;
                head = [
                    pts[s][0] + (pts[s + 1][0] - pts[s][0]) * t,
                    pts[s][1] + (pts[s + 1][1] - pts[s][1]) * t
                ];
                ctx.lineTo(head[0], head[1]);
                break;
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        return head;
    };

    Game.prototype.trace = function (i, delay) {
        if (this.traced[i]) return;
        this.traced[i] = true;
        this.nameBtns[i].disabled = true;
        this.paths.push({
            start: i,
            color: COLORS[i % COLORS.length],
            progress: 0,
            t0: performance.now() + (delay || 0),
            dur: this.opts.duration,
            done: false
        });
        if (!this.raf) this.raf = requestAnimationFrame(this.tick);
    };

    Game.prototype.tick = function (now) {
        var active = false;
        for (var i = 0; i < this.paths.length; i++) {
            var p = this.paths[i];
            if (p.done) continue;
            if (now >= p.t0) {
                p.progress = Math.min(1, (now - p.t0) / p.dur);
                if (p.progress >= 1) this.finish(p);
            }
            if (!p.done) active = true;
        }
        this.draw();
        this.raf = active ? requestAnimationFrame(this.tick) : null;
    };

    Game.prototype.finish = function (p) {
        p.done = true;
        var self = this;
        var end = this.pointsFor(p.start).end;
        var prize = this.prizes[end];
        var isWin = prize !== '꽝';
        this.revealedEnds[end] = true;
        var card = this.prizeCells[end];
        card.classList.add('ldg-prize--flip');
        setTimeout(function () {
            card.textContent = prize;
            card.title = prize;
            card.classList.add(isWin ? 'ldg-prize--win' : 'ldg-prize--lose');
            if (isWin) self.confetti(card.parentNode);
        }, 250);
        setTimeout(function () { card.classList.remove('ldg-prize--flip'); }, 520);
        var item = el('div', 'ldg-log-item');
        var dot = el('i');
        dot.style.background = p.color;
        item.appendChild(dot);
        var text = el('span');
        var name = el('b', null, this.players[p.start]);
        text.appendChild(name);
        text.appendChild(document.createTextNode(' → '));
        var prizeSpan = el('span', isWin ? 'ldg-win' : null, prize);
        text.appendChild(prizeSpan);
        item.appendChild(text);
        this.log.appendChild(item);
        if (typeof this.opts.onResult === 'function') {
            this.opts.onResult(this.players[p.start], prize, p.start, end);
        }
    };

    Game.prototype.confetti = function (cell) {
        for (var i = 0; i < 14; i++) {
            var piece = el('span', 'ldg-confetti');
            piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
            piece.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
            piece.style.setProperty('--dy', (Math.random() * -80 - 15) + 'px');
            piece.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
            cell.appendChild(piece);
            setTimeout((function (node) { return function () { node.remove(); }; })(piece), 900);
        }
    };

    Game.prototype.toggleBlind = function () {
        this.blindOn = !this.blindOn;
        this.blind.classList.toggle('ldg-blind--on', this.blindOn);
        this.log.classList.toggle('ldg-log--blur', this.blindOn);
        if (this.blindBtn) this.blindBtn.textContent = this.blindOn ? '👀 결과 보기' : '🙈 결과 가리기';
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
        this.recPillH = 46;
        this.recPrizeH = 46;
        var scale = Math.min(2, window.devicePixelRatio || 1);
        var w = this.geom.w;
        var h = this.recPillH + this.geom.h + this.recPrizeH;
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
        this.recBtn.classList.remove('ldg-btn--ghost');
        this.recBtn.classList.add('ldg-btn--recing');
        var loop = function () {
            if (!self.recording) return;
            self.drawRec();
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
            this.recBtn.classList.add('ldg-btn--ghost');
            this.recBtn.classList.remove('ldg-btn--recing');
        }
    };

    Game.prototype.drawRec = function () {
        var ctx = this.recCtx;
        var g = this.geom;
        var n = this.players.length;
        var pillH = this.recPillH;
        var totalH = pillH + g.h + this.recPrizeH;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, g.w, totalH);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 13px "Noto Sans KR",Pretendard,"Malgun Gothic",sans-serif';
        var cellW = g.w / n;
        for (var i = 0; i < n; i++) {
            var tw = Math.min(ctx.measureText(this.players[i]).width + 26, cellW - 8);
            roundRectPath(ctx, this.colX(i) - tw / 2, 8, tw, 30, 10);
            ctx.fillStyle = COLORS[i % COLORS.length];
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText(this.players[i], this.colX(i), 23, tw - 14);
        }
        ctx.drawImage(this.canvas, 0, pillH, g.w, g.h);
        var py = pillH + g.h + 8;
        for (var j = 0; j < n; j++) {
            var revealed = this.revealedEnds[j];
            var label = revealed ? this.prizes[j] : '?';
            var isWin = revealed && this.prizes[j] !== '꽝';
            var tw2 = Math.min(ctx.measureText(label).width + 26, cellW - 8);
            roundRectPath(ctx, this.colX(j) - tw2 / 2, py, tw2, 30, 10);
            ctx.fillStyle = revealed ? (isWin ? '#f59e0b' : '#e2e8f0') : '#f1f5f9';
            ctx.fill();
            ctx.fillStyle = revealed ? (isWin ? '#ffffff' : '#64748b') : '#94a3b8';
            ctx.fillText(label, this.colX(j), py + 15, tw2 - 14);
        }
        if (this.blindOn) {
            var by = pillH + g.h * 0.47;
            ctx.fillStyle = 'rgba(124,93,242,0.95)';
            roundRectPath(ctx, 0, by, g.w, totalH - by, 12);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '800 14px "Noto Sans KR",Pretendard,"Malgun Gothic",sans-serif';
            ctx.fillText('🙈 결과 가리는 중', g.w / 2, by + (totalH - by) / 2);
            ctx.font = '700 13px "Noto Sans KR",Pretendard,"Malgun Gothic",sans-serif';
        }
    };

    Game.prototype.showReplay = function (url, blob) {
        var self = this;
        this.replayHost.innerHTML = '';
        var box = el('div', 'ldg-replay');
        var video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.muted = true;
        video.playsInline = true;
        video.loop = true;
        box.appendChild(video);
        var row = el('div', 'ldg-replay-actions');
        var saveBtn = el('button', 'ldg-btn', '💾 영상 저장');
        saveBtn.type = 'button';
        saveBtn.addEventListener('click', function () {
            var d = new Date();
            var pad = function (v) { return ('0' + v).slice(-2); };
            var name = '사다리_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()) + '.webm';
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
        var closeBtn = el('button', 'ldg-btn ldg-btn--ghost', '닫기');
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

    Game.prototype.revealAll = function () {
        for (var i = 0; i < this.players.length; i++) {
            this.trace(i, i * 300);
        }
    };

    Game.prototype.reshuffle = function () {
        this.stopLoop();
        this.prizes = this.normalizePrizes(this.basePrizes, this.players.length);
        this.generate();
        this.log.innerHTML = '';
        for (var i = 0; i < this.players.length; i++) {
            this.nameBtns[i].disabled = false;
            this.prizeCells[i].textContent = '?';
            this.prizeCells[i].title = '';
            this.prizeCells[i].className = 'ldg-prize';
        }
        this.draw();
    };

    Game.prototype.stopLoop = function () {
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = null;
    };

    Game.prototype.destroy = function () {
        if (this.recording) this.stopRecord();
        this.stopLoop();
        window.removeEventListener('resize', this.onResize);
        this.el.classList.remove('ldg');
        this.el.innerHTML = '';
    };

    global.LadderGame = {
        mount: function (target, opts) {
            var container = typeof target === 'string' ? document.querySelector(target) : target;
            if (!container) throw new Error('LadderGame: 대상 요소를 찾을 수 없습니다.');
            return new Game(container, opts || {});
        }
    };
})(window);
