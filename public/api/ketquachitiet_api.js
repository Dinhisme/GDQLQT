let detailResult = null;
let detailQuestions = [];

const detailEscape = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const firstValue = (...values) => values.find(value => value !== undefined && value !== null && value !== '');

function detailDate(value) {
    return value ? new Date(value).toLocaleString('vi-VN', {
        dateStyle: 'short', timeStyle: 'short'
    }) : 'Chưa cập nhật';
}

async function updateResult(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('Phiên đăng nhập đã hết hạn');
    }

    const response = await fetch(endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    const responseText = await response.text();
    let data = {};
    try {
        data = responseText ? JSON.parse(responseText) : {};
    } catch {
        data = { message: responseText };
    }

    if (!response.ok) {
        throw new Error(data.message || 'Không thể cập nhật kết quả bài thi');
    }

    return data;
}

function getDetailResultId() {
    return new URLSearchParams(window.location.search).get('id');
}

async function fetchDetailResult() {
    const token = localStorage.getItem('authToken');
    const resultId = getDetailResultId();

    if (!token) {
        throw new Error('Phiên đăng nhập đã hết hạn');
    }
    if (!resultId) {
        throw new Error('Không tìm thấy mã kết quả thi');
    }

    const response = await fetch(`/api/ket-qua/${encodeURIComponent(resultId)}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    const responseText = await response.text();
    let body = {};

    try {
        body = responseText ? JSON.parse(responseText) : {};
    } catch {
        body = { message: responseText };
    }

    if (!response.ok) {
        throw new Error(body.message || 'Không thể lấy chi tiết kết quả bài thi');
    }

    const result = body.data ?? body.result ?? body;
    const detail = Array.isArray(result) ? result[0] : result;
    if (!detail || typeof detail !== 'object') {
        throw new Error('Dữ liệu chi tiết kết quả không hợp lệ');
    }

    return detail;
}

function detailQuestion(item, index) {
    const question = firstValue(item.cauHoi, item.cauHoiDto, item.question, {});
    const options = firstValue(question.dapAns, question.dapAnDtos, question.answers, item.dapAns, []) || [];
    const selectedId = firstValue(
        item.dapAnChonId,
        item.dapAnChon?.id,
        item.dapAnChon?.ma
    );
    const correctId = firstValue(
        item.dapAnDungId,
        item.dapAnDung?.id,
        question.dapAnDungId,
        question.dapAnDung?.id
    );
    const isCorrect = item.laDung === true || item.laDung === 1 || item.laDung === '1';
    const text = firstValue(item.noiDungCauHoi, item.cauHoiText, question.noiDung, question.text, item.noiDung, `Câu hỏi ${index + 1}`);

    return {
        text,
        topic: firstValue(question.quyTrinhGetSo + ' - ' + question.quyTrinhGetTen, 'Câu hỏi'),
        doKho: question.trangThai,
        options,
        selectedId,
        correctId,
        isCorrect,
        selectedText: firstValue(item.dapAnChon?.noiDung, item.dapAnChonText),
        correctText: firstValue(item.dapAnDung?.noiDung, item.dapAnDungText)
    };
}

function questionStatus(question) {
    if (question.selectedId === undefined || question.selectedId === null) return 'skip';
    return question.isCorrect ? 'correct' : 'wrong';
}

function renderQuestion(question, index) {
    const status = questionStatus(question);
    const statusText = status === 'correct' ? '✅ Đúng' : status === 'wrong' ? '❌ Sai' : '⭕ Bỏ qua';
    const badge = status === 'correct' ? 'b-green' : status === 'wrong' ? 'b-red' : 'b-grey';
    const options = question.options.map((option, optionIndex) => {
        const optionId = firstValue(option.id, option.ma, option.dapAnId);
        const chosen = question.selectedId !== undefined && String(optionId) === String(question.selectedId);
        const correct = question.correctId !== undefined && String(optionId) === String(question.correctId);
        const optionClass = correct ? 'opt-correct' : chosen && !correct ? 'opt-chosen-wrong' : '';
        const marker = correct ? '✅' : chosen ? '❌' : '';
        const note = correct ? ' — Đáp án đúng' : chosen ? ' — Người thi đã chọn' : '';


        return `<div class="qr-option ${optionClass}">
                    <div class="opt-lbl">${String.fromCharCode(65 + optionIndex)}</div>
                    <div style="flex:1">${detailEscape(firstValue(option.noiDung, option.text, option.ten, 'Chưa có nội dung'))}${note}</div>
                    ${marker ? `<div class="opt-icon">${marker}</div>` : ''}
                </div>`;
    }).join('');
    const fallbackAnswer = !options && (question.selectedText || question.correctText)
        ? `<div class="qr-option opt-correct">${detailEscape(question.selectedText || question.correctText)}</div>` : '';

    const diffMap = { 0: ' · 🟢 Dễ', 1: ' · ⚡ Trung bình', 2: ' · 🔴 Khó' };
    const difficulty = diffMap[question.doKho] || '❓ Không xác định';


    return `<div class="q-review-card q-${status}" data-status="${status}">
                <div class="qr-header">
                    <div class="qr-num">Câu ${index + 1}</div>
                    <div class="qr-topic">${detailEscape(question.topic)} ${difficulty}</div>
                    <div class="qr-result"><span class="badge ${badge}">${statusText}</span></div>
                </div>
                <div class="qr-body">
                    <div class="qr-question">${detailEscape(question.text)}</div>
                    <div class="qr-options">${options || fallbackAnswer || '<div class="qr-option">Chưa có dữ liệu đáp án</div>'}</div>
                </div>
            </div>`;
}

function renderDetailPage() {
    try {
        detailQuestions = (detailResult.ketQuaChiTiets || []).map(detailQuestion);
    } catch (error) {
        document.querySelector('.page').innerHTML = `<div class="card card-pad"><div class="card-title">Dữ liệu không hợp lệ</div><p style="margin-top:8px">${detailEscape(error.message)}</p></div>`;
        return;
    }

    const score = Number(detailResult.tongDiem || 0);
    const total = Number(detailResult.tongSoCauHoi || detailQuestions.length);
    const correct = detailQuestions.filter(question => question.isCorrect).length;
    const skipped = detailQuestions.filter(question => questionStatus(question) === 'skip').length;
    const passed = score >= 70;

    let statusExam = detailResult.trangThai;
    let statusExamIcon = '✅';
    let statusSubmitted = '';

    let statusText = '';
    let statusClass = '';

    if (statusExam === 0) {
        statusExam = 'notsubmitted';
        statusExamIcon = '❌';
        statusSubmitted = 'Bài thi chưa được nộp';

        statusText = '❌ Chưa nộp';
        statusClass = 'ht-pending';
    } else if (statusExam === 1) {
        statusExam = 'pending';
        statusExamIcon = '⏳';
        statusSubmitted = 'Kết quả đang chờ duyệt điểm';
        statusText = '⏳ Đang chờ duyệt';
        statusClass = 'ht-pending';
    } else if (statusExam === 2) {
        statusExam = 'approved';
        statusExamIcon = '✅';
        statusSubmitted = 'Kết quả đã được duyệt';
        if (passed) {
            statusText = '✅ Đạt';
            statusClass = 'ht-pass';
        } else {
            statusText = '❌ Không đạt';
            statusClass = 'ht-fail';
        }
    } else if (statusExam === 3) {
        statusExam = 'rejected';
        statusExamIcon = '❌';
        statusSubmitted = 'Kết quả đã bị từ chối';
        statusText = '❌ Đã từ chối';
        statusClass = 'ht-fail';
    }

    const duration = detailResult.thoiGianBat && detailResult.thoiGianNop
        ? Math.max(0, Math.round((new Date(detailResult.thoiGianNop) - new Date(detailResult.thoiGianBat)) / 60000)) + ' phút'
        : 'Đang làm';

    document.querySelector('.page').innerHTML = `
                <div class="hero">
                    <div class="hero-left">
                        <div class="hero-exam">📝 BÀI KIỂM TRA</div>
                        <div class="hero-name">${detailEscape(firstValue(detailResult.tenBaiKiemTra, 'Bài kiểm tra'))}</div>
                        <div class="hero-meta">
                            <div class="hero-meta-item">👤 <strong style="color:#fff">${detailEscape(firstValue(detailResult.tenNguoiThi, 'Chưa cập nhật'))}</strong></div>
                            <div class="hero-meta-item">🏢 ${detailEscape(firstValue(detailResult.khoaPhongNguoiThi, 'Chưa cập nhật'))}</div>
                            <div class="hero-meta-item">📅 ${detailDate(detailResult.thoiGianBat)}</div>
                            <div class="hero-meta-item">⏱ Làm trong ${duration} / ${detailEscape(firstValue(detailResult.thoiGianLamBai, 0))} phút</div>
                        </div>
                    </div>
                    <div class="hero-right">
                        <div class="hero-score ${passed ? 'score-pass' : 'score-fail'}" id="heroScore">${score}</div>
                        <div class="hero-score-sub">trên 100 điểm</div>
                        <div class="hero-tag ${statusClass}" id="heroTag">${statusText}</div>
                    </div>
                </div>

                <!-- ── STATUS BANNER ── -->
                <div class="status-banner sb-${statusExam}" id="statusBanner">
                    <div class="sb-icon">${statusExamIcon}</div>
                    <div class="sb-text">
                        <strong id="sbTitle">${statusSubmitted}</strong>
                        <span id="sbDesc">Mã kết quả #${detailEscape(detailResult.id)} · Trạng thái hệ thống: ${detailEscape(detailResult.trangThai)}</span>
                    </div>
                    <div class="sb-actions" id="sbActions">
                        <button class="btn btn-ghost" onclick="recalcScore()">🔄 Tính Lại Điểm</button>
                        <button class="btn btn-success btn-sm" onclick="openApprove()">✓ Duyệt &amp; Xác Nhận</button>
                        <button class="btn btn-warning btn-sm" onclick="openOverride()">✏ Chỉnh Sửa Điểm</button>
                        <button class="btn btn-danger  btn-sm" onclick="openReject()">✕ Từ Chối</button>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="card card-pad info-card">
                        <div class="card-title">📋 Thông Tin Bài Thi</div><div style="height:8px"></div>
                        <div class="info-row">
                            <span class="info-key">Mã kết quả</span>
                            <span class="info-val">#${detailEscape(detailResult.id)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-key">Bài kiểm tra</span>
                            <span class="info-val">${detailEscape(detailResult.tenBaiKiemTra)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-key">Tổng số câu</span>
                            <span class="info-val" id="totalQuestions">${total} câu</span>
                        </div>
                        <div class="info-row">
                            <span class="info-key">Thời gian quy định</span>
                            <span class="info-val">${detailEscape(firstValue(detailResult.thoiGianLamBai, 0))} phút</span>
                        </div>
                    </div>
                    <div class="card card-pad info-card">
                        <div class="card-title">👤 Thông Tin Người Thi</div>
                        <div style="height:8px"></div>
                        <div class="info-row">
                            <span class="info-key">Họ và tên</span>
                            <span class="info-val">${detailEscape(detailResult.tenNguoiThi)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-key">Khoa / Phòng</span>
                            <span class="info-val">${detailEscape(detailResult.khoaPhongNguoiThi)}</span>
                        </div>
                    </div>
                    <div class="card card-pad info-card">
                        <div class="card-title">⏱ Thời Gian Làm Bài</div>
                        <div style="height:8px"></div>
                        <div class="info-row">
                            <span class="info-key">Bắt đầu</span>
                            <span class="info-val">${detailDate(detailResult.thoiGianBat)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-key">Nộp bài</span>
                            <span class="info-val">${detailDate(detailResult.thoiGianNop)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-key">Thời gian làm</span>
                            <span class="info-val">${duration}</span>
                        </div>
                     </div>
                </div>
                <div class="stat-strip">
                    <div class="card stat-mini">
                        <div class="num green" id="statCorrect">${correct}</div>
                        <div class="lbl">Câu đúng</div>
                    </div>
                    <div class="card stat-mini">
                        <div class="num red" id="statWrong">${Math.max(0, detailQuestions.length - correct - skipped)}</div>
                        <div class="lbl">Câu sai</div>
                    </div>
                    <div class="card stat-mini">
                        <div class="num" style="color:#94a3b8" id="statSkip">${skipped}</div>
                        <div class="lbl">Bỏ qua</div>
                    </div>
                    <div class="card stat-mini">
                        <div class="num blue" id="statScore">${score}</div>
                        <div class="lbl">Điểm số</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-ghost btn-sm" onclick="filterQ('all')" id="qf-all">Tất Cả (${detailQuestions.length})</button>
                    <button class="btn btn-ghost btn-sm" onclick="filterQ('correct')" id="qf-correct">✅ Đúng (${correct})</button>
                    <button class="btn btn-ghost btn-sm" onclick="filterQ('wrong')" id="qf-wrong">❌ Sai (${detailQuestions.length - correct - skipped})</button>
                    <button class="btn btn-ghost btn-sm" onclick="filterQ('skip')" id="qf-skip">⭕ Bỏ qua (${skipped})</button>
                </div>
            </div>

            <div class="q-review-list" id="qReviewList">
                ${detailQuestions.map(renderQuestion).join('') || '<div class="card card-pad">Chưa có chi tiết câu hỏi.</div>'}
            </div>

            <!-- Action row -->
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;flex-wrap:wrap;" id="sbActionsBottom">
                <button class="btn btn-ghost" onclick="recalcScore()">🔄 Tính Lại Điểm</button>
                <button class="btn btn-warning" onclick="openOverride()">✏ Chỉnh Sửa Điểm Tổng</button>
                <button class="btn btn-danger" onclick="openReject()">✕ Từ Chối</button>
                <button class="btn btn-success" onclick="openApprove()">✓ Duyệt &amp; Xác Nhận Điểm</button>
            </div>
            `;
    filterQ('all');

    setStatus(statusExam);
}

async function loadDetailPage() {
    try {
        detailResult = await fetchDetailResult();
        renderDetailPage();
    } catch (error) {
        document.querySelector('.page').innerHTML = `<div class="card card-pad"><div class="card-title">Không thể tải kết quả thi</div><p style="margin-top:8px">${detailEscape(error.message)}</p></div>`;
    }
}

document.addEventListener('DOMContentLoaded', loadDetailPage);

/* ── TABS ── */
function switchTab(id, el) {
    document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    el.classList.add('active');
    if (id === 'compare') $.fn.dataTable.tables({ visible: true, api: true }).columns.adjust();
}

/* ── QUESTION FILTER ── */
function filterQ(type) {
    const btns = ['all', 'correct', 'wrong', 'skip'];
    btns.forEach(b => {
        const btn = document.getElementById('qf-' + b);
        if (b === type) { btn.style.background = 'linear-gradient(135deg,#2563eb,#3b82f6)'; btn.style.color = '#fff'; }
        else { btn.style.background = ''; btn.style.color = ''; }
    });
    document.querySelectorAll('.q-review-card').forEach(card => {
        card.style.display = (type === 'all' || card.dataset.status === type) ? '' : 'none';
    });
}

/* ── RECALC TOTAL SCORE ── */
function recalcScore() {

    const total = document.getElementById('totalQuestions').textContent.replace(/\D/g, '') || 1;

    const qCorrect = document.getElementById('statCorrect').textContent.replace(/\D/g, '') || 0;

    const score = Math.round((qCorrect / total) * 100);

    document.getElementById('heroScore').textContent = score;
    document.getElementById('statScore').textContent = score;
    document.getElementById('approveScore').textContent = score + '/100';
    document.getElementById('overrideInput').value = score;

    showToast('success', 'Thành công!', '🔄 Đã tính lại: ' + score + ' điểm (' + total + '/' + qCorrect + ' câu đúng)');
}

/* ── MODALS ── */
function openApprove() {
    closeAllModals();

    document.getElementById('approveName').textContent = detailEscape(firstValue(detailResult.tenNguoiThi, 'Người thi'));

    const score = Number(detailResult.tongDiem || 0);
    document.getElementById('approveScore').textContent = score + '/100';
    document.getElementById('score-percentage').textContent = score + '%';

    document.getElementById('approveOverlay').classList.add('open');
}

function openOverride() {
    closeAllModals();

    const score = Number(detailResult.tongDiem || 0);
    document.getElementById('diemHienTai').textContent = score;
    document.getElementById('tongDiemTrenCauDung').textContent = '/ 100 điểm (' + document.getElementById('statCorrect').textContent + '/' + document.getElementById('totalQuestions').textContent + ' câu đúng)';

    document.getElementById('overrideOverlay').classList.add('open');
}

function openReject() {
    closeAllModals();
    document.getElementById('rejectOverlay').classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

function closeAllModals() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('open'));
}

document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));

/* ── ACTIONS ── */
async function doApprove() {
    try {
        await updateResult(`/api/ket-qua/${detailResult.id}/duyet`, { method: 'PATCH' });
        closeAllModals();
        detailResult = await fetchDetailResult();
        renderDetailPage();
        showToast('success', 'Thành công!', 'Đã duyệt điểm thành công!');
    } catch (error) {
        showToast('error', 'Không thể duyệt điểm', error.message);
    }
}
async function doOverride() {
    const val = Number(document.getElementById('overrideInput').value);
    if (!Number.isFinite(val) || val < 0 || val > 100) {
        showToast('warning', 'Điểm không hợp lệ', 'Điểm phải nằm trong khoảng từ 0 đến 100.');
        return;
    }

    try {
        await updateResult(`/api/ket-qua/${detailResult.id}/chinh-sua-diem`, {
            method: 'PATCH',
            body: JSON.stringify({ diemMoi: val })
        });
        closeAllModals();
        detailResult = await fetchDetailResult();
        renderDetailPage();
        showToast('success', 'Thành công!', '✏ Đã cập nhật điểm: ' + val + '/100');
    } catch (error) {
        showToast('error', 'Không thể chỉnh sửa điểm', error.message);
    }
}
async function doReject() {
    try {
        await updateResult(`/api/ket-qua/${detailResult.id}/tu-choi`, { method: 'PATCH' });
        closeAllModals();
        detailResult = await fetchDetailResult();
        renderDetailPage();
        showToast('error', 'Đã từ chối kết quả thi', 'Bạn đã từ chối kết quả thi!');
    } catch (error) {
        showToast('error', 'Không thể từ chối kết quả', error.message);
    }
}

async function doUnReject() {
    try {
        await updateResult(`/api/ket-qua/${detailResult.id}/mo-lai`, { method: 'PATCH' });
        closeAllModals();
        detailResult = await fetchDetailResult();
        renderDetailPage();
        showToast('success', 'Đã mở lại kết quả thi', 'Bạn đã mở lại kết quả thi để xem xét!');
    } catch (error) {
        showToast('error', 'Không thể mở lại kết quả', error.message);
    }
}

function setStatus(status) {
    const banner = document.getElementById('statusBanner');
    const heroTag = document.getElementById('heroTag');
    const sbTitle = document.getElementById('sbTitle');
    const sbDesc = document.getElementById('sbDesc');
    const sbActions = document.getElementById('sbActions');
    const sbActionsBottom = document.getElementById('sbActionsBottom');

    if (status === 'approved') {
        banner.className = 'status-banner sb-approved';
        heroTag.className = 'hero-tag ht-pass'; heroTag.textContent = '✅ Đã Duyệt';
        sbTitle.textContent = 'Kết quả đã được duyệt và xác nhận';
        sbDesc.textContent = 'Điểm số đã ghi nhận chính thức. Người thi có thể xem kết quả.';
        sbActions.innerHTML = '<button class="btn btn-ghost btn-sm" onclick="openOverride()">✏ Chỉnh Sửa Lại</button>';
        sbActionsBottom.innerHTML = '<button class="btn btn-warning" onclick="openOverride()">✏ Chỉnh Sửa Điểm Tổng</button>';
        document.getElementById('statusBanner').querySelector('.sb-icon').textContent = '✅';
    } else if (status === 'rejected') {
        banner.className = 'status-banner sb-rejected';
        heroTag.className = 'hero-tag ht-fail'; heroTag.textContent = '✕ Đã Từ Chối';
        sbTitle.textContent = 'Kết quả đã bị từ chối';
        sbDesc.textContent = 'Bài thi được đánh dấu không hợp lệ. Quản lý có thể mở lại để xem xét.';
        sbActions.innerHTML = '<button class="btn btn-warning btn-sm" onclick="doUnReject()">↩ Mở Lại Xem Xét</button>';
        sbActionsBottom.innerHTML = '<button class="btn btn-warning btn-sm" onclick="doUnReject()">↩ Mở Lại Xem Xét</button>';
        document.getElementById('statusBanner').querySelector('.sb-icon').textContent = '✕';
    }

}

// Toast Notification Function
function showToast(type, title, message, duration = 3000) {
    const container = document.getElementById('toastContainer');

    const icons = {
        success: '✓',
        error: '✕',
        warning: '!',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
                <span class="toast-icon">${icons[type]}</span>
                <div class="toast-content">
                    <div class="toast-title">${title}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close" onclick="this.closest('.toast').remove()">×</button>
                <div class="toast-progress"></div>
            `;

    container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 600);
        }
    }, duration);
}