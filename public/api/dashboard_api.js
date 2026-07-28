//Load dữ liệu Dashboard
async function loadDashboardPage() {
    try {
        const trangChu = await fetchTrangChu();

        renderTrangChuPage(trangChu);

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

//Gọi API lấy dữ liệu
async function fetchTrangChu() {
    const token = localStorage.getItem("authToken");

    const response = await fetch("/admin", {
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

//Tạo các row cho table
function createTrangChuRows(list) {

    return list.map((ketQuaThi, index) => {

        return `
            <tr>
                <td class="col-name">Kiểm Tra Nghiệp Vụ Q1 2026<small>40 câu · 60
                        phút</small></td>
                <td>Toàn công ty</td>
                <td>100</td>
                <td>78.4</td>
                <td><span class="badge badge-green">78%</span></td>
                <td>15/03/2026</td>
                <td><span class="badge badge-green">Hoàn thành</span></td>
            </tr>
        `;

    }).join("");
}

//Đưa dữ liệu ra index
function renderTrangChuPage(trangChu) {

    const tableRows = createTrangChuRows(trangChu.listKq);
    
    document.getElementById("sidebar-vanban").textContent = `${trangChu.soLuongQT}`;
    document.getElementById("sidebar-cauhoi").textContent = `${trangChu.soLuongCH}`;
    document.getElementById("sidebar-baikiemtra").textContent = `${trangChu.soLuongBKT}`;

    document.getElementById("mainContent").innerHTML = `
        <!-- DOCUMENTS PAGE -->
        <div class="page active" id="page-dashboard">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">📄</div>
                    <div class="stat-value">${trangChu.soLuongQT}</div>
                    <div class="stat-label">Tổng Văn bản</div>
                    <div class="stat-delta delta-up">↑ 12 so với tháng trước</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon cyan">❓</div>
                    <div class="stat-value">${trangChu.soLuongCH}</div>
                    <div class="stat-label">Câu hỏi trong kho</div>
                    <div class="stat-delta delta-up">↑ 86 câu hỏi mới</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon indigo">📝</div>
                    <div class="stat-value">${trangChu.soLuongBKT}</div>
                    <div class="stat-label">Bài kiểm tra</div>
                    <div class="stat-delta delta-up">↑ 5 bài kiểm tra mới</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon teal">👥</div>
                    <div class="stat-value">${trangChu.soLuongKQLB}</div>
                    <div class="stat-label">Lượt thi tháng này</div>
                    <div class="stat-delta delta-down">↓ 3% so với kỳ trước</div>
                </div>
            </div>

            <div class="two-col">
                <div>
                    <div class="section-header">
                        <div>
                            <div class="section-title">DANH SÁCH KẾT QUẢ THI</div>
                            <div class="section-sub">Các kết quả thi các ngày qua</div>
                        </div>
                    </div>
                    <div class="table-card">
                        <div class="table-wrap">
                            <table id="tbl-dashboard" class="display stripe" style="width:100%">
                                <thead>
                                    <tr>
                                        <th>Tên Bài Kiểm Tra</th>
                                        <th>Khoa / Phòng</th>
                                        <th>Số Lượt Thi</th>
                                        <th>Điểm TB</th>
                                        <th>Tỉ Lệ Đạt</th>
                                        <th>Ngày Tổ Chức</th>
                                        <th>Trạng Thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    initTrangChuTable();
}

//Khởi tạo Datatable
function initTrangChuTable() {

    $('#tbl-dashboard').DataTable($.extend(true, {}, dtDefaults, {
        order: [[3, 'desc']],
        columnDefs: [
            {
                orderable: false,
                targets: [1, 4]
            }
        ]
    }));

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
    document.getElementById('user-name').textContent = userLogin;
    document.getElementById('user-name2').textContent = userLogin;

    if (!isAuthenticated) {
        // Stop execution if not authenticated
        throw new Error('Unauthorized access');
    }
})();