//Load dữ liệu Dashboard
async function loadDashboardPage() {
    try {
        const trangChu = await fetchTrangChu();

        window.currentBaiKiemTraList = trangChu.listTongBktr;

        renderTrangChuPage(trangChu);

    } catch (error) {
        console.error(error);

        document.getElementById('mainContent').innerHTML = `
            <div class="content-header">
                <h1>Trang chủ</h1>
                <p style="color: var(--danger);">
                    Lỗi: ${error.message}
                </p>
            </div>
        `;
    }
}

//Gọi API lấy dữ liệu
async function fetchTrangChu() {
    const token = localStorage.getItem("authToken");

    const response = await fetch("/api/trang-chu", {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || "Không thể lấy dữ liệu Trang chủ");
    }

    return result.data || [];
}

function getSoNgayConLai(thoiGianKetThuc) {
    const now = new Date();
    const ketThuc = new Date(thoiGianKetThuc);

    const diff = ketThuc - now;

    if (diff <= 0) {
        return 0;
    }

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getThoiHanConLai(thoiGianKetThuc) {
    const now = new Date();
    const ketThuc = new Date(thoiGianKetThuc);

    const diff = ketThuc - now;

    // Đã hết hạn
    if (diff <= 0) {
        return "Đã kết thúc";
    }

    const soNgay = Math.floor(
        diff / (1000 * 60 * 60 * 24)
    );

    // Nếu còn từ 1 ngày trở lên
    if (soNgay >= 1) {
        return `Hết hạn sau ${soNgay} ngày`;
    }

    // Nếu chưa đủ 1 ngày thì tính theo giờ
    const soGio = Math.ceil(
        diff / (1000 * 60 * 60)
    );

    return `Hết hạn sau ${soGio} giờ`;
}

//Tạo các row
function createTrangChuRowsLeft(list) {

    return list.map((baiKiemTra, index) => {

        const soNgayConLai =
            getSoNgayConLai(baiKiemTra.thoiGianKetThuc);

        const thoiHanconLai =
            getThoiHanConLai(baiKiemTra.thoiGianKetThuc);

        const thoiGianKT =
            formatDateTime(baiKiemTra.thoiGianKetThuc);

        let trangThaiText;
        let icon;
        let miniIcon;
        let color;
        let statusBtn;
        if (soNgayConLai <= 0) {

            color = 'blue';
            trangThaiText = 'Đã kết thúc';
            icon = '📋';
            miniIcon = '🔵';
            statusBtn = 'disabled'

        } else if (soNgayConLai < 2) {

            color = 'red';
            trangThaiText = 'Gấp';
            icon = '🚨';
            miniIcon = '🔴';

        } else if (soNgayConLai < 5) {

            color = 'yellow';
            trangThaiText = 'Sắp hết hạn';
            icon = '⚠️';
            miniIcon = '🟡';

        } else {

            color = 'green';
            trangThaiText = 'Còn hạn';
            icon = '✅';
            miniIcon = '🟢';
        }


        let trangThaiTextBtr;
        let badgeTrangThai;
        let textBtn;
        switch (baiKiemTra.trangThai) {
            case 0:
                trangThaiTextBtr = 'Chưa Mở';
                badgeTrangThai = 'yellow';
                statusBtn = 'disabled'
                textBtn = 'Vào Thi'
                break;
            case 1:
                trangThaiTextBtr = 'Đang Mở';
                badgeTrangThai = 'green';
                statusBtn = ''
                textBtn = 'Vào thi'
                break;
            case 2:
                trangThaiTextBtr = 'Đã Đóng';
                badgeTrangThai = 'blue';
                statusBtn = 'disabled'
                textBtn = 'Vào thi'
                break;
        }

        return `
            <div class="exam-card ${color}">
                <div class="exam-icon ei-${color}">
                    ${icon}
                </div>
                <div class="exam-info">
                    <div class="exam-name">
                        ${baiKiemTra.tenBaiKiem}
                    </div>
                    <div class="exam-meta-row">
                        <div class="exam-meta">
                            ⏱ ${baiKiemTra.thoiGianLamBai} phút
                        </div>
                        <div class="exam-meta">
                            ❓ ${baiKiemTra.tongSoCauHoi} câu
                        </div>
                    </div>
                    <div class="exam-deadline dead-${color}">
                        ${miniIcon} ${thoiHanconLai} · ${thoiGianKT}
                    </div>
                </div>
                <div class="exam-right">
                    <span class="badge b-${color}">
                        ${trangThaiText}
                    </span>
                    <span class="badge b-${badgeTrangThai}">
                        ${trangThaiTextBtr}
                    </span>
                    <button class="btn btn-primary btn-sm" ${statusBtn} onclick="openDetailBaiKiemTraModal('${baiKiemTra.id}')">
                       ${textBtn}
                    </button>
                </div>
            </div>
        `;

    }).join("");
}

//Tạo các row
function createTrangChuRowsRight(list) {

    return list.map((baiKiemTra, index) => {

        const soNgayConLai =
            getSoNgayConLai(baiKiemTra.thoiGianBatDau);

        const thoiGianBD =
            formatDateTime(baiKiemTra.thoiGianBatDau);

        let trangThaiText;
        if (soNgayConLai <= 0) {
            miniIcon = '🔵';
        } else if (soNgayConLai < 2) {
            miniIcon = '🔴';
        } else if (soNgayConLai < 5) {
            miniIcon = '🟡';
        } else {
            miniIcon = '🟢';
        }

        return `
            <div class="sched-item">
                <div class="sched-time">
                    <div> Bắt đầu lúc </div>
                   <div> ${thoiGianBD}</div>
                </div>
                 <div class="sched-dot" >${miniIcon}</div>
                <div class="sched-info">
                    <div class="name">${baiKiemTra.tenBaiKiem}</div>
                    <div class="meta">${baiKiemTra.moTa}</div>
                </div>
            </div>
        `;

    }).join("");
}

//Tạo các row
function createTrangChuKQRows(list) {

    if (!list || list.length === 0) {
        return `
        <div class="text-center">
            CHƯA CÓ KẾT QUẢ!
        </div>
    `;
    }

    return list.map((ketQua, index) => {

        return `
            <div class="result-mini">
                <div class="rm-score pass">✅</div>
                <div class="rm-info">
                    <div class="rm-name">${ketQua.tenBaiKiem}</div>
                    <div class="rm-date">${formatDateTime(ketQua.thoiGianNop)} · ${ketQua.soLuongCauLam}/${ketQua.soLuongCauHoi} câu</div>
                </div>
                <span class="badge b-yellow">Chờ chấm</span>
            </div>
        `;

    }).join("");
}

//Thống kê dữ liệu
function getTrangChuStatistics(trangChu) {
    return {
        bktChuaLam: trangChu.listTongBktrChuaLam.length,
        bktDaLam: trangChu.listKq.length,
        diemTrungBinh: trangChu.listKq.reduce(
            (sum, x) => sum + (x.tongdiem || 0), 0
        )
    };
}

//Đưa dữ liệu ra index
function renderTrangChuPage(trangChu) {

    const stats = getTrangChuStatistics(trangChu);

    const baiKiemTraRowsLeft = createTrangChuRowsLeft(trangChu.listTongBktr);

    const baiKiemTraRowsRight = createTrangChuRowsRight(trangChu.listTongBktr);

    const ketQuaRows = createTrangChuKQRows(trangChu.listKq);

    document.getElementById("sidebar-vanban").textContent = `${trangChu.soLuongQT}`;
    document.getElementById("sidebar-cauhoi").textContent = `${trangChu.soLuongCH}`;
    document.getElementById("sidebar-baikiemtra").textContent = `${trangChu.soLuongBKT}`;

    const userLogin = localStorage.getItem('user');

    document.getElementById("mainContent").innerHTML = `

        <!--  DASHBOARD PAGE  -->
        <div class="tab-page active" id="page-dashboard">
    
        <!-- Greeting -->
        <div class="greeting-bar">
            <div class="greet-text">
            <h2>Chào buổi sáng, ${userLogin}! 👋</h2>
            <p>Bạn có 2 bài kiểm tra cần hoàn thành trong tuần này. Chúc bạn làm bài hiệu quả!</p>
            </div>
            <div class="greet-pills">
            <div class="greet-pill urgent">🔴 ${stats.bktChuaLam} bài kiểm tra sắp đến hạn</div>
            <div class="greet-pill">📄 ${trangChu.soLuongQT} văn bản mới được phát hành</div>
            </div>
        </div>

        <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(59, 130, 246, 0.12); color: #2563eb;">📝</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.bktChuaLam}</div>
                    <div class="stat-label">Bài kiểm tra cần hoàn thành</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(5, 150, 105, 0.12); color: #059669;">🏆</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.diemTrungBinh}</div>
                    <div class="stat-label">Điểm Trung bình</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(251, 191, 36, 0.12); color: #fbbf24;">✅</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.bktDaLam}</div>
                    <div class="stat-label">Bài đã hoàn thành</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: rgba(239, 68, 68, 0.12); color: #dc2626;">📄</div>
                <div class="stat-content">
                    <div class="stat-value">${trangChu.soLuongQT}</div>
                    <div class="stat-label">Văn bản phòng bạn</div>
                </div>
            </div>
        </div>
    
        <div class="two-col">
            <!-- Left: Upcoming Exams -->
            <div>
                <div class="sh">
                    <div>
                    <div class="sh-title">Bài Kiểm Tra Sắp Đến Hạn</div>
                    <div class="sh-sub">Cần hoàn thành trước deadline</div>
                    </div>
                </div>
                <div class="exam-list">
                    ${baiKiemTraRowsLeft}
                </div>
            </div>
    
            <!-- Right: Notifications + Schedule -->
            <div style="display:flex;flex-direction:column;gap:18px;">
            <div>
                <div class="sh">
                    <div><div class="sh-title">Lịch Kiểm Tra</div></div>
                </div>
                <div class="schedule-list">
                    ${baiKiemTraRowsRight}
                </div>
            </div>
    
            <div>
                <div class="sh-title">Kết Quả Gần Đây</div>
                <div class="result-mini-list">
                    ${ketQuaRows}
                </div>
            </div>
            </div>
        </div>
    `;

}

//Mở cửa sổ để cập nhập bài kiểm tra
function openDetailBaiKiemTraModal(id) {

    window.baiKiemTraDetail = window.currentBaiKiemTraList.find(b => b.id === Number(id));

    if (!baiKiemTraDetail) {
        showToast('error', 'Thất bại!', "Không nhận được dữ liệu Bài Kiểm Tra");
        return;
    }

    console.log("Mở modal cập nhật cho Bài Kiểm Tra:", baiKiemTraDetail);

    document.getElementById('detailTenBaiKiem').textContent = baiKiemTraDetail.tenBaiKiem;

    document.getElementById('detailSoCauHoi').textContent = baiKiemTraDetail.tongSoCauHoi;

    document.getElementById('detailThoiGianLamBai').textContent = baiKiemTraDetail.thoiGianLamBai;

    document.getElementById('detailThoiGianBatDau').textContent = formatDateTime(baiKiemTraDetail.thoiGianBatDau);

    document.getElementById('detailThoiGianKetThuc').textContent = formatDateTime(baiKiemTraDetail.thoiGianKetThuc);

    const textKhoaPhongs = (baiKiemTraDetail.khoaPhongs || [])
        .map(kp => `<div class="khoa-phong-item">🏥 ${kp.ten}</div>`)
        .join("");

    document.getElementById('detailKhoaPhongThamGia').innerHTML =
        textKhoaPhongs || "Chưa có khoa/phòng tham gia";

    openModal('examModal');
}

//bat dau lam bai
async function batDauLamBai() {

    const baiKiemTraStart = window.baiKiemTraDetail;

    if (!baiKiemTraStart) {
        showToast('error', 'Lỗi!', 'Không tìm thấy thông tin bài kiểm tra.');
        return;
    }

    const now = new Date();

    // 1. Kiểm tra thời gian bắt đầu
    if (baiKiemTraStart.thoiGianBatDau) {
        const thoiGianBatDau = new Date(baiKiemTraStart.thoiGianBatDau);
        if (now < thoiGianBatDau) {
            showToast('warning', 'Chưa đến thời gian!', `Bài kiểm tra sẽ bắt đầu lúc ${formatDateTime(baiKiemTraStart.thoiGianBatDau)}.`);
            return;
        }
    }

    // 2. Kiểm tra thời gian kết thúc
    if (baiKiemTraStart.thoiGianKetThuc) {
        const thoiGianKetThuc = new Date(baiKiemTraStart.thoiGianKetThuc);
        if (now >= thoiGianKetThuc) {
            showToast('warning', 'Bài kiểm tra đã kết thúc!', `Thời gian kết thúc: ${formatDateTime(baiKiemTraStart.thoiGianKetThuc)}.`);
            return;
        }
    }

    // 4. Đủ điều kiện → gọi API
    const token = localStorage.getItem('authToken');

    const body = {
        baiKiemTraId: baiKiemTraStart.id
    };

    try {
        const response = await fetch('/api/ket-qua/bat-dau', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },

            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể bắt đầu bài kiểm tra!';
            showToast('error', 'Cảnh báo!', message);
            return;
        }

        // Bắt đầu làm bài
        showToast('success', 'Thành công!', 'Bài kiểm tra bắt đầu ngay lập tức!');

        closeModal('examModal');

        // TODO:
        // chuyển sang trang làm bài
        // Lưu dữ liệu trước khi chuyển trang
        sessionStorage.setItem('dataBaiThi', JSON.stringify(data.data));

        window.location.href = '/baithi';

    } catch (error) {
        console.error('Error Bắt đầu bài kiểm tra:', error);
        showToast('error', 'Cảnh báo!', 'Lỗi khi gửi dữ liệu. Vui lòng thử lại!');
    }
}

// ===== AUTHENTICATION CHECK =====
// Check if user is logged in and verify token with server
async function checkAuthentication() {
    const token = localStorage.getItem('authToken');

    if (!token) {
        console.warn('⚠️ No authentication token found. Redirecting to login...');
        window.location.href = '/login';
        return false;
    }

    try {
        const response = await fetch('/api/verify-token', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!data.success) {
            console.error('❌ Token verification failed:', data.message);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return false;
        }

        console.log('✅ User authenticated with valid server token');
        return true;

    } catch (error) {
        console.error('❌ Token verification error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return false;
    }
}

// Run authentication check when page loads and wait for result
(async function () {
    const isAuthenticated = await checkAuthentication();

    const userLogin = localStorage.getItem('user');
    const userLoginDepartment = localStorage.getItem('userDepartment');
    document.getElementById('user-name').textContent = userLoginDepartment;
    document.getElementById('user-name2').textContent = userLogin;

    if (!isAuthenticated) {
        // Stop execution if not authenticated
        throw new Error('Unauthorized access');
    }
})();