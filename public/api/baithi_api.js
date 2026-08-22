let baiThi = null;
let QUESTIONS = [];
let TOTAL = 0;
let TOTAL_TIME = 0;

let currentQ = 0;
let answers = [];
let flagged = [];
let timeLeft = 0;
let timerInt = null;
let startTime = 0;
let reviewed = false;
let submitted = false;
let savingAnswer = false;

document.addEventListener('DOMContentLoaded', function () {
    loadTrangLamBai();
});

//Load dữ liệu QLND
async function loadTrangLamBai() {

    try {
        const data = sessionStorage.getItem('dataBaiThi');

        if (!data) {
            throw new Error('Không tìm thấy dữ liệu bài thi.');
        }

        baiThi = JSON.parse(data);

        console.log('Dữ liệu bài thi:', baiThi);

        QUESTIONS = baiThi.cauHois.map(cauHoi => ({
            id: cauHoi.id,
            topic: cauHoi.chuDe,
            diff: cauHoi.doKho === 'Dễ'
                ? 'easy'
                : cauHoi.doKho === 'Khó'
                    ? 'hard'
                    : 'medium',
            text: cauHoi.noiDung,
            opts: cauHoi.dapAns.map(dapAn => ({
                id: dapAn.id,
                text: dapAn.noiDung
            }))
        }));

        TOTAL = QUESTIONS.length;
        TOTAL_TIME = (baiThi.thoiGianPhut || 60) * 60;

        // Map đáp án đã chọn từ API vào vị trí đáp án trên giao diện
        answers = baiThi.cauHois.map(cauHoi => {
            if (cauHoi.dapAnChonId === null || cauHoi.dapAnChonId === undefined) {
                return null;
            }

            const selectedIndex = cauHoi.dapAns.findIndex(
                dapAn => dapAn.id === cauHoi.dapAnChonId
            );

            return selectedIndex >= 0 ? selectedIndex : null;
        });

        flagged = new Array(TOTAL).fill(false);

        timeLeft = TOTAL_TIME;
        currentQ = 0;
        submitted = false;
        startTime = Date.now();

        renderTrangLamBai(baiThi);
        init();

    } catch (error) {
        console.error(error);

        document.getElementById('mainBaiThi').innerHTML = `
            <div class="content-header">
                <h1>Trang làm bài thi</h1>
                <p style="color:var(--danger);">Lỗi: ${error.message}</p>
            </div>
        `;
    }
}

//Đưa dữ liệu ra index
function renderTrangLamBai(baiThi) {

    document.getElementById("mainBaiThi").innerHTML = `
        <!-- ── QUESTION PANEL ── -->
        <div class="q-panel">

            <!-- Q Header -->
            <div class="q-header">
                <div class="q-num-badge" id="qNumBadge">
                Câu 1 / ${baiThi.tongSoCau} 
            </div>
                <div class="q-tags">
                    <span class="q-tag tag-topic" id="qTopic">An toàn lao động</span>
                    <span class="q-tag" id="qDiff">⚡ Trung bình</span>
                </div>
                <div class="q-nav-arrows">
                    <button class="arr-btn" id="btnPrev" onclick="goTo(currentQ - 1)" disabled
                        title="Câu trước">‹</button>
                    <button class="arr-btn" id="btnNext" onclick="goTo(currentQ + 1)" title="Câu tiếp">›</button>
                </div>
            </div>

            <!-- Q Body -->
            <div class="q-body">
                <div class="q-text" id="qText">Loading...</div>

                <div class="options-list" id="optionsList">
                    <!-- rendered by JS -->
                </div>

                <div class="explain-box" id="explainBox"></div>
            </div>

            <!-- Q Footer -->
            <div class="q-footer">
                <div class="footer-left">
                    <button class="btn btn-flag" id="btnFlag" onclick="toggleFlag()">
                        🚩 <span>Đánh dấu</span>
                    </button>
                    <button class="btn btn-ghost" onclick="clearAnswer()">✕ Xóa đáp án</button>
                </div>
                <div style="display:flex;gap:9px;">
                    <button class="btn btn-ghost" id="footPrev" onclick="goTo(currentQ - 1)">‹ Trước</button>
                    <button class="btn btn-primary" id="footNext" onclick="goTo(currentQ + 1)">Tiếp ›</button>
                </div>
            </div>
        </div>

        <!-- ── SIDEBAR PANEL ── -->
        <div class="sidebar-panel">

            <!-- Timer card (mobile duplicate) -->
            <div class="side-card" style="padding:14px 16px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                    <div class="side-title" style="margin-bottom:0;">⏳ Thời Gian</div>
                    <span style="font-size:11px;color:rgba(13,31,60,.45);" id="sideTimerLabel">${baiThi.thoiGianPhut}:00 còn lại</span>
                </div>
                <!-- mini donut progress -->
                <div style="position:relative;width:90px;height:90px;margin:0 auto 10px;">
                    <svg width="90" height="90" style="transform:rotate(-90deg);">
                        <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(59,130,246,0.1)" stroke-width="8" />
                        <circle cx="45" cy="45" r="38" fill="none" stroke="url(#tg)" stroke-width="8"
                            stroke-linecap="round" id="timerCircle" stroke-dasharray="238.76" stroke-dashoffset="0" />
                        <defs>
                            <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#2563eb" />
                                <stop offset="100%" stop-color="#3b82f6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div
                        style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                        <div style="font-family:var(--fh);font-size:16px;font-weight:700;color:#0d1f3c;"
                            id="sideTimerBig">${baiThi.thoiGianPhut}:00</div>
                        <div style="font-size:9px;color:#2563eb;opacity:.7;">phút</div>
                    </div>
                </div>
            </div>

            <!-- Question map -->
            <div class="side-card">
                <div class="side-title">🗺 Bản Đồ Câu Hỏi</div>

                <!-- Legend -->
                <div class="legend">
                    <div class="legend-item">
                        <div class="leg-dot leg-current">●</div> Câu hiện tại
                    </div>
                    <div class="legend-item">
                        <div class="leg-dot leg-answered">✓</div> Đã trả lời
                    </div>
                    <div class="legend-item">
                        <div class="leg-dot leg-flagged">🚩</div> Đánh dấu
                    </div>
                    <div class="legend-item">
                        <div class="leg-dot leg-empty">○</div> Chưa trả lời
                    </div>
                </div>

                <div class="q-grid" id="qGrid">
                    <!-- rendered by JS -->
                </div>

                <!-- Mini stats -->
                <div class="stat-row">
                    <div class="stat-mini">
                        <div class="num" id="statAnswered" style="color:#059669;">0</div>
                        <div class="lbl">Đã trả lời</div>
                    </div>
                    <div class="stat-mini">
                        <div class="num" id="statFlagged" style="color:#d97706;">0</div>
                        <div class="lbl">Đánh dấu</div>
                    </div>
                    <div class="stat-mini">
                        <div class="num" id="statEmpty" style="color:#94a3b8;">
                            ${baiThi.tongSoCau}
                        </div>
                        <div class="lbl">Chưa làm</div>
                    </div>
                </div>
            </div>

            <!-- Exam info -->
            <div class="side-card">
                <div class="side-title">📋 Thông Tin Bài Thi</div>
                <div style="display:flex;flex-direction:column;gap:9px;">
                    <div
                        style="display:flex;justify-content:space-between;font-size:12.5px;padding-bottom:8px;border-bottom:1px solid rgba(59,130,246,.08);">
                        <span style="color:rgba(13,31,60,.6);">Bài kiểm tra</span>
                        <span style="font-weight:600;color:#0d1f3c;text-align:right;max-width:130px;line-height:1.3;">
                            ${baiThi.tenBaiKiemTra}
                        </span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:12.5px;">
                        <span style="color:rgba(13,31,60,.6);">Tổng số câu</span>
                        <span style="font-weight:600;color:#0d1f3c;">
                            ${baiThi.tongSoCau} câu
                        </span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:12.5px;">
                        <span style="color:rgba(13,31,60,.6);">Thời gian</span>
                        <span style="font-weight:600;color:#0d1f3c;">
                            ${baiThi.thoiGianPhut} phút
                        </span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:12.5px;">
                        <span style="color:rgba(13,31,60,.6);">Điểm đạt</span>
                        <span style="font-weight:600;color:#059669;">
                            Không áp dụng
                        </span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:12.5px;">
                        <span style="color:rgba(13,31,60,.6);">Người thi</span>
                        <span style="font-weight:600;color:#059669;">
                            ${baiThi.hoTenNguoiThi}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <!-- /content -->
    `;
}


//INIT
function init() {
    buildGrid();
    renderQ(0);
    updateTimerUI();
    startTimer();
}
/* ─────────────────────────────────────────
   TIMER
───────────────────────────────────────── */
function startTimer() {
    timerInt = setInterval(() => {
        if (submitted) { clearInterval(timerInt); return; }
        timeLeft--;
        if (timeLeft <= 0) {
            timeLeft = 0;
            autoSubmit();
        }
        updateTimerUI();
    }, 1000);
}

function updateTimerUI() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = str;
    document.getElementById('sideTimerBig').textContent = str;
    document.getElementById('sideTimerLabel').textContent = str + ' còn lại';

    // Circle (circumference = 2π × 38 ≈ 238.76)
    const pct = timeLeft / TOTAL_TIME;
    const offset = 238.76 * (1 - pct);
    document.getElementById('timerCircle').style.strokeDashoffset = offset;

    // Color states
    const box = document.getElementById('timerBox');
    box.classList.remove('warning', 'danger');
    if (timeLeft <= 300) box.classList.add('danger');      // ≤ 5 min
    else if (timeLeft <= 600) box.classList.add('warning'); // ≤ 10 min

    // Circle color
    const circ = document.getElementById('timerCircle');
    if (timeLeft <= 300) {
        circ.setAttribute('stroke', '#ef4444');
    } else if (timeLeft <= 600) {
        circ.setAttribute('stroke', '#f59e0b');
    } else {
        circ.setAttribute('stroke', 'url(#tg)');
    }
}

/* ─────────────────────────────────────────
   QUESTION RENDER
───────────────────────────────────────── */
function renderQ(idx) {
    const q = QUESTIONS[idx];
    currentQ = idx;

    // Header
    document.getElementById('qNumBadge').textContent = `Câu ${idx + 1} / ${TOTAL}`;
    document.getElementById('qTopic').textContent = q.topic;

    const diffMap = { easy: '🟢 Dễ', medium: '⚡ Trung bình', hard: '🔴 Khó' };
    const diffClass = { easy: 'tag-easy', medium: 'tag-medium', hard: 'tag-hard' };
    const diffEl = document.getElementById('qDiff');
    diffEl.textContent = diffMap[q.diff];
    diffEl.className = `q-tag ${diffClass[q.diff]}`;

    // Text
    document.getElementById('qText').innerHTML = q.text;

    // Options
    const ol = document.getElementById('optionsList');
    ol.innerHTML = '';

    q.opts.forEach((opt, i) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.dataset.idx = i;

        if (answers[idx] === i) {
            div.classList.add('selected');
        }

        div.innerHTML = `
        <div class="opt-label">${'ABCD'[i]}</div>
        <div class="opt-text"></div>
        <div class="opt-check sel">✓</div>
    `;

        div.querySelector('.opt-text').textContent = opt.text;

        div.addEventListener('click', () => selectOpt(i));
        ol.appendChild(div);
    });

    // Flag button
    const fb = document.getElementById('btnFlag');
    fb.classList.toggle('flagged', flagged[idx]);
    fb.innerHTML = flagged[idx] ? '🚩 <span>Bỏ đánh dấu</span>' : '🚩 <span>Đánh dấu</span>';

    // Nav buttons
    document.getElementById('btnPrev').disabled = idx === 0;
    document.getElementById('footPrev').disabled = idx === 0;

    const isLast = idx === TOTAL - 1;

    document.getElementById('btnNext').textContent = isLast ? '' : '›';
    document.getElementById('footNext').textContent = isLast
        ? 'Nộp Bài ↗'
        : 'Tiếp ›';

    document.getElementById('footNext').onclick = isLast
        ? openConfirm
        : () => goTo(currentQ + 1);

    if (isLast) {
        document.getElementById('footNext').className = 'btn btn-submit';
        document.getElementById('footNext').style.background = 'linear-gradient(135deg,#059669,#10b981)';
    } else {
        document.getElementById('footNext').className = 'btn btn-primary';
        document.getElementById('footNext').style.background = '';
    }

    // Grid
    updateGrid();
    updateProgress();
    updateStats();
}

/* ─────────────────────────────────────────
   SELECT OPTION
───────────────────────────────────────── */
function selectOpt(i) {
    if (submitted) return;
    answers[currentQ] = i;
    renderQ(currentQ);
}

function clearAnswer() {
    if (submitted) return;
    answers[currentQ] = null;
    renderQ(currentQ);
}

async function saveCurrentAnswer() {
    const question = QUESTIONS[currentQ];
    const selectedIndex = answers[currentQ];

    // Không gọi API nếu người dùng chưa chọn đáp án
    if (!question || selectedIndex === null || selectedIndex === undefined) {
        return true;
    }

    if (!baiThi?.ketQuaLamBaiId) {
        console.error('Không tìm thấy ketQuaLamBaiId');
        alert('Không tìm thấy mã kết quả bài làm.');
        return false;
    }

    const selectedAnswer = question.opts[selectedIndex];

    const token = localStorage.getItem('authToken');

    try {
        savingAnswer = true;

        const response = await fetch(
            `/api/ket-qua/${baiThi.ketQuaLamBaiId}/tra-loi`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    cauHoiId: question.id,
                    dapAnChonId: selectedAnswer.id
                })
            }
        );

        const result = await response.json();

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message || 'Không thể lưu câu trả lời.'
            );
        }

        console.log('Đã lưu câu trả lời:', {
            cauHoiId: question.id,
            dapAnChonId: selectedAnswer.id
        });

        return true;

    } catch (error) {
        console.error('Lỗi lưu câu trả lời:', error);
        alert(error.message || 'Lỗi khi lưu câu trả lời.');
        return false;

    } finally {
        savingAnswer = false;
    }
}

async function goTo(idx) {
    if (submitted || savingAnswer) return;
    if (idx < 0 || idx >= TOTAL) return;

    // Chỉ lưu khi bấm chuyển sang câu khác
    const saved = await saveCurrentAnswer();

    if (!saved) return;

    renderQ(idx);

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function toggleFlag() {
    flagged[currentQ] = !flagged[currentQ];
    renderQ(currentQ);
}

/* ─────────────────────────────────────────
   GRID
───────────────────────────────────────── */
function buildGrid() {
    const grid = document.getElementById('qGrid');
    grid.innerHTML = '';
    for (let i = 0; i < TOTAL; i++) {
        const d = document.createElement('div');
        d.className = 'q-dot';
        d.textContent = i + 1;
        d.onclick = () => goTo(i);
        grid.appendChild(d);
    }
}

function updateGrid() {
    const dots = document.querySelectorAll('.q-dot');
    dots.forEach((dot, i) => {
        dot.className = 'q-dot';
        if (i === currentQ) dot.classList.add('current');
        else if (flagged[i]) dot.classList.add('flagged');
        else if (answers[i] !== null) dot.classList.add('answered');
    });
}

/* ─────────────────────────────────────────
   PROGRESS BAR (top)
───────────────────────────────────────── */
function updateProgress() {
    const done = answers.filter(a => a !== null).length;
    const pct = (done / TOTAL) * 100;
    document.getElementById('progFill').style.width = pct + '%';
    document.getElementById('progFrac').textContent = `${done} / ${TOTAL} câu`;
}

/* ─────────────────────────────────────────
   SIDEBAR STATS
───────────────────────────────────────── */
function updateStats() {
    const answered = answers.filter(a => a !== null).length;
    const flags = flagged.filter(Boolean).length;
    const empty = TOTAL - answered;
    document.getElementById('statAnswered').textContent = answered;
    document.getElementById('statFlagged').textContent = flags;
    document.getElementById('statEmpty').textContent = empty;
    document.getElementById('cs-answered').textContent = answered;
    document.getElementById('cs-flagged').textContent = flags;
    document.getElementById('cs-empty').textContent = empty;
    const emptyCount = TOTAL - answered;
    const warn = document.getElementById('confirmWarn');
    if (emptyCount > 0) {
        warn.style.display = 'block';
        document.getElementById('warnCount').textContent = emptyCount;
    } else {
        warn.style.display = 'none';
    }
}

/* ─────────────────────────────────────────
   CONFIRM + SUBMIT
───────────────────────────────────────── */
function openConfirm() {
    updateStats();
    document.getElementById('confirmOverlay').classList.add('open');
}
function closeConfirm() {
    document.getElementById('confirmOverlay').classList.remove('open');
}

function autoSubmit() {
    submitExam();
}

function submitExam() {
    submitted = true;
    clearInterval(timerInt);
    closeConfirm();

    document.querySelectorAll('.option').forEach(option => {
        option.style.pointerEvents = 'none';
    });

    alert('Bạn đã nộp bài thành công.');
}

/* ─────────────────────────────────────────
   KEYBOARD SHORTCUTS
───────────────────────────────────────── */
document.addEventListener('keydown', e => {
    if (submitted) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); goTo(currentQ + 1); }
    if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); goTo(currentQ - 1); }
    if (['a', 'b', 'c', 'd'].includes(k.toLowerCase())) {
        const idx = 'abcd'.indexOf(k.toLowerCase());
        if (idx < QUESTIONS[currentQ].opts.length) {
            selectOpt(idx);
        }
    }
    if (k === 'f' || k === 'F') toggleFlag();
    if (k === 'Enter' && !submitted) openConfirm();
});


/* ─────────────────────────────────────────
   CONFIRM + SUBMIT
───────────────────────────────────────── */
function openConfirm() {
    if (submitted || savingAnswer) return;

    updateStats();
    document.getElementById('confirmOverlay').classList.add('open');
}

function closeConfirm() {
    document.getElementById('confirmOverlay').classList.remove('open');
}

async function autoSubmit() {
    await submitExam();
}

async function submitExam() {
    if (submitted || savingAnswer) return;

    try {
        // Lưu đáp án của câu hiện tại trước khi nộp
        const saved = await saveCurrentAnswer();

        if (!saved) return;

        const token = localStorage.getItem('authToken');

        const response = await fetch(
            `/api/ket-qua/${baiThi.ketQuaLamBaiId}/nop-bai`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({})
            }
        );

        const result = await response.json();

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message || 'Không thể nộp bài.'
            );
        }

        submitted = true;
        clearInterval(timerInt);
        closeConfirm();

        document.querySelectorAll('.option').forEach(option => {
            option.style.pointerEvents = 'none';
        });

        document.querySelectorAll('button').forEach(button => {
            if (
                !button.id.includes('btnFlag') &&
                !button.id.includes('footPrev') &&
                !button.id.includes('btnPrev')
            ) {
                button.disabled = true;
            }
        });

        showToast('success', 'Thành công!', 'Bạn đã nộp bài thành công!');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);

        console.log('Nộp bài thành công:', result);

    } catch (error) {
        console.error('Lỗi nộp bài:', error);
        alert(error.message || 'Lỗi khi nộp bài. Vui lòng thử lại.');
    }
}