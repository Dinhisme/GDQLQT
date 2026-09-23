
/* ── DOC SEARCH & FILTER ── */
let currentView = 'grid';

function quickSearch(term) {
    document.getElementById('docSearchInput').value = term;
    filterDocs();
}

function filterDocs() {
    const q = (document.getElementById('docSearchInput')?.value || '').toLowerCase();
    const l = document.getElementById('filterLoai')?.value || '';
    let p = document.getElementById('filterPhong')?.value || '';
    const tt = document.getElementById('filterTT')?.value || '';

    if(p === 'TẤT CẢ KHOA/PHÒNG/TT') p = '';

    const cards = document.querySelectorAll('#docGrid .doc-card');
    let count = 0;
    cards.forEach(card => {
        const name = card.dataset.so.toLowerCase() + ' ' + card.dataset.name.toLowerCase();

        const loai = card.dataset.loai;
        const phong = card.dataset.phong;
        const ttVal = card.dataset.tt;
        const show =
            (!q || name.includes(q)) &&
            (!l || loai === l) &&
            (!p || phong === p) &&
            (!tt || ttVal === tt);

        card.style.display = show ? '' : 'none';
        if (show) count++;
    });

    document.getElementById('docCount').innerHTML =
        `Hiển thị <strong>${count}</strong> văn bản${q ? ` khớp với "<em>${q}</em>"` : ''}`;
    document.getElementById('docEmpty').style.display = count === 0 ? 'block' : 'none';
}

//Load dữ liệu Tim kiem
async function loadTimKiemPage() {
    try {
        const quytrinhList = await fetchAllQuyTrinh();

        window.currentQuyTrinhList = quytrinhList;

        const khoaPhongList = await fetchKhoaPhongs();

        renderTimKiemPage(quytrinhList, khoaPhongList);

    } catch (error) {
        console.error(error);

        document.getElementById('mainContent').innerHTML = `
            <div class="content-header">
                <h1>Quản lý văn bản</h1>
                <p style="color: var(--danger);">
                    Lỗi: ${error.message}
                </p>
            </div>
        `;
    }
}

//Bắt đầu gọi API
async function fetchAllQuyTrinh() {
    const token = localStorage.getItem("authToken");

    const response = await fetch("/api/tim-kiem/quy-trinh", {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || "Không thể lấy dữ liệu văn bản");
    }

    return result.data || [];
}

//Thống kê dữ liệu
function getQuyTrinhStatistics(list) {
    return {
        total: list.length,
        hieuLuc: list.filter(x => x.trangThai === 1).length,
        hetHieuLuc: list.filter(x => x.trangThai === 0).length,
        sapHetHan: list.filter(x => x.trangThai === 2).length
    };
}

//Format dd-MM-YYYY
function formatDate(dateStr) {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
}

//download file
function downloadUploadedFile(filePath) {
    if (!filePath) {
        showToast(
            'warning',
            'Không có file',
            'Văn Bản này chưa có file đính kèm.'
        );
        return;
    }

    const url = filePath.startsWith('/')
        ? filePath
        : `/${filePath}`;

    const link = document.createElement('a');

    link.href = url;
    link.download = '';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

//Tạo các row cho table
function createDocCard(list) {

    return list.map((quytrinh, index) => {

        const badge = quytrinh.trangThai === 1 ? "green" : "red";

        return `
            <div class="doc-card" data-so="${quytrinh.so}" data-name="${quytrinh.tenQuyTrinh}" data-loai="${quytrinh.loaiQuyTrinh}" data-phong="${quytrinh.tenKhoaPhong}" data-tt="${quytrinh.trangThai === 1 ? "Hiệu lực" : "Hết hiệu lực"}" >
                <div class="doc-card-head">
                    <div class="doc-file-icon fi-pdf"><span class="fi-ext red">${quytrinh.so}</span></div>
                    <div class="doc-card-meta">
                        <div class="doc-card-name">${quytrinh.tenQuyTrinh}</div>
                        <div class="doc-card-dept">${quytrinh.tenKhoaPhong}</div>
                    </div>
                </div>
                <div class="doc-card-desc">Phạm vi: ${quytrinh.phamVi}</div>
                <div class="doc-card-desc">Lưu trữ: ${quytrinh.viTriLuu}</div>
                <div class="doc-card-footer">
                    <div class="doc-card-info">
                        📅 ${formatDate(quytrinh.ngayBanHanh)}
                        <span class="badge b-purple" style="margin-left:6px;">
                            ${quytrinh.loaiQuyTrinh}
                        </span>
                        <span class="badge b-${badge}" style="margin-left:6px;">
                            ${quytrinh.trangThai === 1 ? "Hiệu lực" : "Hết hiệu lực"}
                        </span>
                    </div>
                    <div class="doc-card-actions">
                        <div class="dc-btn" title="Xem" onclick="viewUploadedFile('${quytrinh.duongDan ? quytrinh.duongDan.replace(/'/g, "\\'") : ''}')">👁</div>
                        <div class="dc-btn" title="Tải về" onclick="downloadUploadedFile('${quytrinh.duongDan ? quytrinh.duongDan.replace(/'/g, "\\'") : ''}')">⬇</div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

//Đưa dữ liệu ra index
function renderTimKiemPage(quytrinhList, khoaPhongList) {

    const vanBanCards = createDocCard(quytrinhList);

    document.getElementById("mainContent").innerHTML = `
        <!-- DOCUMENTS SEARCH PAGE -->
            <div class="tab-page" id="page-docs">
                <!-- Hero Search -->
                <div class="search-hero">
                    <div class="sh-hero-title">🔍 TRA CỨU VĂN BẢN</div>
                    <div class="sh-hero-sub">Tìm nhanh các văn bản và tài liệu nội bộ</div>
                    <div class="doc-search-wrap">
                        <span class="doc-search-icon">🔍</span>
                        <input class="doc-search-input" id="docSearchInput" type="text" placeholder="Nhập tên văn bản, từ khóa, mã số..." oninput="filterDocs()">
                        <button class="doc-search-btn" onclick="filterDocs()">Tìm Kiếm</button>
                    </div>
                    <div class="search-chips">
                        <div class="search-chip" onclick="quickSearch('Quy Trình')">Quy Trình</div>
                        <div class="search-chip" onclick="quickSearch('Phác Đồ Điều Trị')">Phác Đồ Điều Trị</div>
                        <div class="search-chip" onclick="quickSearch('Quy Định')">Quy Định</div>
                        <div class="search-chip" onclick="quickSearch('Quyết Định')">Quyết Định</div>
                        <div class="search-chip" onclick="quickSearch('Hướng Dẫn')">Hướng Dẫn</div>
                        <div class="search-chip" onclick="quickSearch('Thông Báo')">Thông Báo</div>
                        <div class="search-chip" onclick="quickSearch('Báo Cáo')">Báo Cáo</div>
                        <div class="search-chip" onclick="quickSearch('Khác')">Khác</div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="doc-filter-bar">

                    <select onchange="filterDocs()" id="filterLoai">
                        <option value="">Tất cả loại</option>
                        <option value="Quy Trình">Quy Trình</option>
                        <option value="Phác Đồ Điều Trị">Phác Đồ Điều Trị</option>
                        <option value="Quy Định">Quy Định</option>
                        <option value="Quyết Định">Quyết Định</option>
                        <option value="Hướng Dẫn">Hướng Dẫn</option>
                        <option value="Thông Báo">Thông Báo</option>
                        <option value="Báo Cáo">Báo Cáo</option>
                        <option value="Khác">Khác</option>
                    </select>

                    <select onchange="filterDocs()" id="filterPhong">
     
                        ${khoaPhongList.map(kp => `<option value="${kp.ten}">${kp.ten}</option>`).join("")}
                    </select>
                    <select onchange="filterDocs()" id="filterTT">
                        <option value="">Tất cả trạng thái</option>
                        <option value="Hiệu lực">Hiệu lực</option>
                        <option value="Hết hiệu lực">Hết hiệu lực</option>
                    </select>
                    
                </div>

                <!-- Results header -->
                <div class="doc-results-header">
                    <div class="doc-results-count" id="docCount">Hiển thị <strong>${quytrinhList.length}</strong> văn bản</div>
                </div>

                <!-- DOC GRID (default) -->
                <div class="doc-grid" id="docGrid">

                    ${vanBanCards}

                    <!-- Empty state (hidden by default) -->
                    <div class="empty-state" id="docEmpty" style="display:none;">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">Không tìm thấy văn bản phù hợp<br><span style="font-size:13px;opacity:.7;">Thử thay đổi từ khóa hoặc bộ lọc</span></div>
                </div>
            </div>
    `;

}

//Xem file đã update của văn bản đó
function viewUploadedFile(filePath) {
    if (!filePath) {
        showToast('warning', 'Không có file', 'Văn Bản này chưa có file đính kèm.');
        return;
    }

    const url = filePath.startsWith('/') ? filePath : `/${filePath}`;
    window.open(url, '_blank');
}
