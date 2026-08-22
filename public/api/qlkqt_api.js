let currentKetQuaList = [];
const DIEM_DAT = 70;

// Khởi tạo trang
async function loadQLKQPage() {
    try {
        currentKetQuaList = await fetchKetQuaThi();
        renderQLKQPage(currentKetQuaList);
    } catch (error) {
        console.error(error);

        document.getElementById('mainContent').innerHTML = `
            <div class="content-header">
                <h1>Quản lý Kết quả thi</h1>
                <p style="color:var(--danger);">Lỗi: ${error.message}</p>
            </div>
        `;
    }
}

// API trả về trực tiếp một mảng
async function fetchKetQuaThi() {
    const token = localStorage.getItem('authToken');

    const response = await fetch('/api/ket-qua', {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    const body = await response.json();

    console.log('Response API /api/ket-qua:', body);

    if (!response.ok) {
        throw new Error(
            body?.message || 'Không thể lấy dữ liệu kết quả thi.'
        );
    }

    // Hỗ trợ nhiều dạng response từ backend
    const data =
        Array.isArray(body) ? body :
            Array.isArray(body.data) ? body.data :
                Array.isArray(body.result) ? body.result :
                    Array.isArray(body.content) ? body.content :
                        Array.isArray(body.ketQua) ? body.ketQua :
                            null;

    if (!data) {
        throw new Error('Dữ liệu kết quả thi không đúng định dạng mảng.');
    }

    return data;
}

function getQLKQStatistics(list) {
    const daNop = list.filter(item => item.thoiGianNop);
    const dat = daNop.filter(item => Number(item.tongDiem || 0) >= DIEM_DAT);
    const khongDat = daNop.filter(item => Number(item.tongDiem || 0) < DIEM_DAT);

    const diemTrungBinh = daNop.length
        ? daNop.reduce((sum, item) => sum + Number(item.tongDiem || 0), 0) / daNop.length
        : 0;

    return {
        tongLuotThi: list.length,
        daNop: daNop.length,
        dangLam: list.length - daNop.length,
        dat: dat.length,
        khongDat: khongDat.length,
        diemTrungBinh
    };
}

function formatDateTime(value) {
    if (!value) return 'Chưa nộp';

    return new Date(value).toLocaleString('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
}

function formatThoiGianLam(item) {
    if (!item.thoiGianBat || !item.thoiGianNop) {
        return 'Đang làm';
    }

    const diff = new Date(item.thoiGianNop) - new Date(item.thoiGianBat);
    return `${Math.max(0, Math.round(diff / 60000))} phút`;
}

function createKetQuaRows(list) {
    if (!list.length) {
        return `
            <tr>
                <td colspan="9" style="text-align:center;padding:30px;">
                    Chưa có dữ liệu kết quả thi
                </td>
            </tr>
        `;
    }

    return list.map((item, index) => {
        const chiTiets = item.ketQuaChiTiets || [];
        const tongCau = chiTiets.length;
        const soCauDung = chiTiets.filter(ct => ct.laDung === true).length;
        const diem = Number(item.tongDiem || 0);
        const daNop = Boolean(item.thoiGianNop);
        const dat = daNop && diem >= DIEM_DAT;

        const tenNguoiThi = item.tenNguoiThi || 'Chưa cập nhật';
        const tenBaiKiemTra = item.tenBaiKiemTra || 'Chưa cập nhật';

        return `
            <tr>
                <td>
                    <div class="text-center">${index + 1}</div>
                </td>
                <td>
                    <div class="user-cell">
                        <div class="user-info">
                            <div class="name">${tenNguoiThi}</div>
                            <div class="dept">${item.khoaPhongNguoiThi || ''}</div>
                        </div>
                    </div>
                </td>

                <td class="col-main">
                    ${tenBaiKiemTra}
                    <small>${item.tongSoCauHoi} câu · ${tongCau} phút</small>
                </td>

                <td>
                    <div class="score-circle ${dat ? 'score-pass' : 'score-fail'}">
                        ${daNop ? diem : '-'}
                    </div>
                </td>

                <td class="text-center">${formatThoiGianLam(item)}</td>

                <td class="text-center">${soCauDung} / ${tongCau}</td>

                <td class="text-center">
                    <div class="progress-cell">
                        <div class="prog-track">
                            <div class="prog-fill" style="width:${daNop ? Math.min(diem, 100) : 0}%"></div>
                        </div>
                        <span class="prog-pct">${daNop ? diem : 0}%</span>
                    </div>
                </td>

                <td class="text-center">${formatDateTime(item.thoiGianBat)}</td>

                <td class="text-center">
                    ${!daNop
                ? '<span class="badge b-yellow">⏳ Đang làm</span>'
                : dat
                    ? '<span class="badge b-green">✅ Đạt</span>'
                    : '<span class="badge b-red">❌ Không đạt</span>'
            }
                </td>

                <td class="text-center">
                    <div class="row-actions">
                        <button class="act-btn"
                            onclick="xemChiTietKetQua(${item.id})">
                            👁
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderQLKQPage(list) {
    const stats = getQLKQStatistics(list);

    const danhSachBaiThi = [
        ...new Set(list.map(item => item.tenBaiKiemTra).filter(Boolean))
    ];

    document.getElementById('mainContent').innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Kết Quả Thi</div>
                <div class="section-sub">Thống kê và tra cứu kết quả bài thi</div>
            </div>
        </div>


        <div class="doc-filter-bar">
            <input id="searchNguoiThi"
                   type="text"
                   class="search-input"
                   placeholder="Tìm tên người thi..."
                   oninput="filterKetQua()">

            <select id="filterBaiThi" onchange="filterKetQua()">
                <option value="">Tất cả bài kiểm tra</option>
                ${danhSachBaiThi.map(name => `
                    <option value="${name}">${name}</option>
                `).join('')}
            </select>

            <select id="filterTrangThai" onchange="filterKetQua()">
                <option value="">Tất cả kết quả</option>
                <option value="dat">Đạt</option>
                <option value="khongDat">Không đạt</option>
                <option value="dangLam">Đang làm</option>
            </select>
        </div>

        <div class="stats-grid-5">
            <div class="stat-card">
                <div class="stat-icon si-blue">📝</div>
                <div class="stat-value">${stats.tongLuotThi}</div>
                <div class="stat-label">Tổng lượt thi</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon si-green">✅</div>
                <div class="stat-value">${stats.dat}</div>
                <div class="stat-label">Lượt đạt</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon si-red">❌</div>
                <div class="stat-value">${stats.khongDat}</div>
                <div class="stat-label">Lượt không đạt</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon si-amber">⏳</div>
                <div class="stat-value">${stats.dangLam}</div>
                <div class="stat-label">Đang làm</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon si-indigo">🎯</div>
                <div class="stat-value">${stats.diemTrungBinh.toFixed(1)}</div>
                <div class="stat-label">Điểm trung bình</div>
            </div>
        </div>

        <div class="table-card">
            <table id="tbl-results" class="display stripe" style="width:100%">
                <thead>
                    <tr>
                        <th class="text-center">STT</th>
                        <th>Người thi</th>
                        <th>Bài kiểm tra</th>
                        <th>Điểm số</th>
                        <th class="text-center">Thời gian làm</th>
                        <th>Đúng / Tổng</th>
                        <th>Tiến độ đạt</th>
                        <th class="text-center">Ngày thi</th>
                        <th class="text-center">Kết quả</th>
                        <th class="text-center">Thao tác</th>
                    </tr>
                </thead>
                <tbody id="ketQuaTableBody">
                    ${createKetQuaRows(list)}
                </tbody>
            </table>
        </div>
    `;
    initKetQuaTable();
}


//Khởi tạo Datatable
function initKetQuaTable() {
    $('#tbl-results').DataTable($.extend(true, {}, dtDefaults, {}));
}

function filterKetQua() {
    const keyword = document
        .getElementById('searchNguoiThi')
        .value
        .toLowerCase();

    const baiThi = document.getElementById('filterBaiThi').value;
    const trangThai = document.getElementById('filterTrangThai').value;

    const filtered = currentKetQuaList.filter(item => {
        const tenNguoiThi = (item.tenNguoiThi || '').toLowerCase();
        const daNop = Boolean(item.thoiGianNop);
        const dat = daNop && Number(item.tongDiem || 0) >= DIEM_DAT;

        const matchKeyword = tenNguoiThi.includes(keyword);
        const matchBaiThi = !baiThi || item.tenBaiKiemTra === baiThi;

        const matchTrangThai =
            !trangThai ||
            (trangThai === 'dat' && dat) ||
            (trangThai === 'khongDat' && daNop && !dat) ||
            (trangThai === 'dangLam' && !daNop);

        return matchKeyword && matchBaiThi && matchTrangThai;
    });

    document.getElementById('ketQuaTableBody').innerHTML =
        createKetQuaRows(filtered);
}

function xemChiTietKetQua(id) {
    const ketQua = currentKetQuaList.find(item => item.id === id);

    if (!ketQua) return;

    console.log('Chi tiết kết quả:', ketQua);
    alert(`Mã kết quả: ${ketQua.id}\nĐiểm: ${ketQua.tongDiem || 0}`);
}