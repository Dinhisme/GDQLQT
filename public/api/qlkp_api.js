document.addEventListener('DOMContentLoaded', function () {
    const addKPForm = document.getElementById('addKPForm');
    if (addKPForm) {
        addKPForm.addEventListener('submit', function (event) {
            event.preventDefault();
            submitKhoaPhongForm();
        });
    }

    const updateKPForm = document.getElementById('updateKPForm');
    if (updateKPForm) {
        updateKPForm.addEventListener('submit', function (event) {
            event.preventDefault();
            updateKhoaPhong();
        });
    }
});

//Bắt đầu gọi API
async function fetchKhoaPhongs() {
    const token = localStorage.getItem("authToken");

    const response = await fetch("/api/khoa-phong", {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || "Không thể lấy dữ liệu khoa phòng");
    }

    return result.data || [];
}

//Load dữ liệu QLND
async function loadQLKPPage() {
    try {
        const khoaPhongList = await fetchKhoaPhongs();

        window.currentKhoaPhongList = khoaPhongList;

        renderQLKPPage(khoaPhongList);

    } catch (error) {
        console.error(error);

        document.getElementById('mainContent').innerHTML = `
            <div class="content-header">
                <h1>Quản lý khoa phòng</h1>
                <p style="color: var(--danger);">
                    Lỗi: ${error.message}
                </p>
            </div>
        `;
    }
}

// Thống kê dữ liệu
function getKhoaPhongStatistics(list) {
    return {
        total: list.length,

        totalAllNguoidung: list.reduce(
            (sum, x) => sum + (x.totalNguoiDungs || 0),
            0
        ),

        totalBKts: list.reduce(
            (sum, x) => sum + (x.baiKiemTraResponses?.length || 0),
            0
        )
    };
}

//Format dd-MM-YYYY
function formatDate(dateStr) {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
}

//Tạo các row cho table
function createKhoaPhongRows(list) {

    return list.map((khoaPhong, index) => {

        return `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td class="col-name">${khoaPhong.ten}<small>Mã: ${khoaPhong.id}</small></td>
                <td class="text-center">${khoaPhong.totalNguoiDungs}</td>
                <td class="text-center">${khoaPhong.baiKiemTraResponses.length}</td>
                            
                <td class="text-center">    
                    <div class="row-actions">
                        <div class="act-btn" onclick="openUpdateKhoaPhongModal('${khoaPhong.id}')">✏️</div>
                        <div class="act-btn del" onclick="deleteKhoaPhong('${khoaPhong.id}')">🗑</div>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

//Đưa dữ liệu ra index
function renderQLKPPage(khoaPhongList) {

    const stats = getKhoaPhongStatistics(khoaPhongList);

    const tableRows = createKhoaPhongRows(khoaPhongList);

    document.getElementById("mainContent").innerHTML = `
        <!-- DEPARTMENT MANAGEMENT -->
        <div class="">
            <!-- HEADER -->
            <div class="section-header">
                <div>

                </div>
                <button class="btn btn-primary" onclick="openModal('addDeptModal')">+ Thêm Khoa / Phòng</button>
            </div>

            <!-- STAT CARDS -->
            <div class="stats-grid-3">
                <div class="stat-card">
                    <div class="stat-icon blue">🏢</div>
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Tổng khoa / phòng</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon teal">👥</div>
                    <div class="stat-value">${stats.totalAllNguoidung}</div>
                    <div class="stat-label">Tổng nhân sự</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon indigo">📄</div>
                    <div class="stat-value">${stats.totalBKts}</div>
                    <div class="stat-label">Tổng bài kiểm tra</div>
                </div>
            </div>

            <!-- COMPLETION TABLE -->
            <div class="section-header">
                <div>
                    <div class="section-title">Bảng Tổng Hợp Theo Khoa/Phòng/TT</div>
                    <div class="section-sub">Chi tiết nhân sự, bài kiểm tra</div>
                </div>
            </div>
            <div class="table-card">
                <table id="tbl-departments" class="display stripe" style="width:100%">
                    <thead>
                        <tr> 
                            <th class="text-center">STT</th>
                            <th>Khoa/Phòng/TT</th>
                            <th class="text-center">Nhân Sự</th>
                            <th class="text-center">Bài KT Bắt Buộc</th>
                            <th class="text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>

        </div>
        <!-- /content -->
    `;

    initKhoaPhongTable();
}

//Khởi tạo Datatable
function initKhoaPhongTable() {

    $('#tbl-departments').DataTable($.extend(true, {}, dtDefaults, {

    }));

}

//Thêm khoa phòng
async function submitKhoaPhongForm() {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    const id = document.getElementById('maKhoaPhong').value.trim();
    const ten = document.getElementById('tenKhoaPhong').value.trim();

    const body = {
        id: id,
        ten: ten
    };

    try {
        const response = await fetch('/api/khoa-phong', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể tạo khoa phòng mới.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        showToast('success', 'Thành công!', `Tạo khoa phòng mới thành công!`);
        closeModal('addDeptModal');
        clearAddKPForm();
        loadQLKPPage();
    } catch (error) {
        console.error('Error creating khoa phòng:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

//ClearForm thêm khoa phòng
function clearAddKPForm() {
    document.getElementById('tenKhoaPhong').value = '';
    document.getElementById('maKhoaPhong').value = '';
}

//mở modal cập nhật kp
function openUpdateKhoaPhongModal(id) {

    window.khoaPhongUpdate = window.currentKhoaPhongList.find(b => b.id === id);

    if (!khoaPhongUpdate) {
        showToast('error', 'Thất bại!', "Không nhận được dữ liệu khoa phòng");
        return;
    }

    console.log("Mở modal cập nhật cho khoa phòng:", khoaPhongUpdate);

    document.getElementById('maKhoaPhongUpdate').value = khoaPhongUpdate.id;
    document.getElementById('tenKhoaPhongUpdate').value = khoaPhongUpdate.ten;

    openModal('updateDeptModal');
}

//Cập nhật câu hỏi
async function updateKhoaPhong() {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    const khoaPhongUpdateId = window.khoaPhongUpdate.id;

    const ten = document.getElementById('tenKhoaPhongUpdate').value.trim();

    const body = {
        ten: ten
    };

    try {
        const response = await fetch(`/api/khoa-phong/${khoaPhongUpdateId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể cập nhật khoa phòng.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        showToast('success', 'Thành công!', `Cập nhật khoa phòng mới thành công!`);
        closeModal('updateDeptModal');
        clearUpdateKPForm();
        loadQLKPPage();

    } catch (error) {
        console.error('Error update khoa phòng:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

//ClearForm thêm văn bản
function clearUpdateKPForm() {
    document.getElementById('tenKhoaPhongUpdate').value = '';
    document.getElementById('maKhoaPhongUpdate').value = '';
}

//Xóa bài kiểm tra
async function deleteKhoaPhong(id) {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`/api/khoa-phong/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể xóa khoa phòng.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        showToast('success', 'Thành công!', `Xóa khoa phòng thành công!`);
        // Xóa khỏi mảng hiện tại
        loadQLKPPage();

    } catch (error) {
        console.error('Error deleting khoa phòng:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}