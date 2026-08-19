document.addEventListener('DOMContentLoaded', function () {
    const addUserrForm = document.getElementById('addUserForm');
    if (addUserrForm) {
        addUserrForm.addEventListener('submit', function (event) {
            event.preventDefault();
            submitNguoiDungForm();
        });
    }

    const updateUserForm = document.getElementById('updateUserForm');
    if (updateUserForm) {
        updateUserForm.addEventListener('submit', function (event) {
            event.preventDefault();
            updateNguoiDung();
        });
    }
});

//Load dữ liệu QLND
async function loadQLNDPage() {
    try {
        const nguoiDungList = await fetchNguoiDung();

        window.currentNguoiDungList = nguoiDungList;

        renderQLNDPage(nguoiDungList);

    } catch (error) {
        console.error(error);

        document.getElementById('mainContent').innerHTML = `
            <div class="content-header">
                <h1>Quản lý người dùng</h1>
                <p style="color: var(--danger);">
                    Lỗi: ${error.message}
                </p>
            </div>
        `;
    }
}

//Bắt đầu gọi API
async function fetchNguoiDung() {
    const token = localStorage.getItem("authToken");

    const response = await fetch("/api/nguoi-dung", {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || "Không thể lấy dữ liệu người dùng");
    }

    return result.data || [];
}

//Thống kê dữ liệu
function getNguoiDungStatistics(list) {
    return {
        total: list.length,
        hieuLuc: list.filter(x => x.xoa === 0).length,
        quanTriViens: list.filter(x => x.role === "ADMIN").length,
        hetHieuLuc: list.filter(x => x.xoa === 1).length
    };
}

//Format dd-MM-YYYY
function formatDate(dateStr) {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
}

//Tạo các row cho table
function createNguoiDungRows(list) {

    return list.map((nguoidung, index) => {

        return `
            <tr>
                <td class="text-center">${index+1}</td>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">${nguoidung.taiKhoan}</div>
                        <div class="user-cell-info">
                            <div class="name">${nguoidung.hoTen}</div>
                        </div>
                    </div>
                </td>
                <td>${nguoidung.khoaPhong.ten}</td>
                <td class="text-center"><span class="badge badge-${nguoidung.role === "ADMIN" ? "purple" : "blue"}">${nguoidung.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}</span></td>
                <td class="text-center"><span class="badge badge-${nguoidung.xoa === 0 ? "green" : "red"}">${nguoidung.xoa === 0 ? "Hoạt động" : "Vô hiệu hóa"}</span></td>
                <td class="text-center">    
                    <div class="row-actions">
                        <div class="act-btn" onclick="openUpdateNguoiDungModal('${nguoidung.id}')">✏️</div>
                        <div class="act-btn del" onclick="deleteNguoiDung('${nguoidung.id}')">🗑</div>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

//Đưa dữ liệu ra index
function renderQLNDPage(nguoidungList) {

    const stats = getNguoiDungStatistics(nguoidungList);

    const tableRows = createNguoiDungRows(nguoidungList);

    document.getElementById("mainContent").innerHTML = `
        <!-- USER MANAGEMENT -->
        <div >
            <!-- HEADER -->
            <div class="section-header">
                <div>
                    <div class="section-title">Quản Lý Người Dùng</div>
                    <div class="section-sub">Chi tiết danh sách người dùng</div>
                </div>
                <button class="btn btn-primary" onclick="openModal('addUserModal')">+ Thêm Người Dùng</button>
            </div>

            <!-- STAT CARDS -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">👥</div>
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">Tổng người dùng</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon teal">✅</div>
                    <div class="stat-value">${stats.hieuLuc}</div>
                    <div class="stat-label">Đang hoạt động</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon indigo">🔑</div>
                    <div class="stat-value">${stats.quanTriViens}</div>
                    <div class="stat-label">Quản trị viên</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon cyan">⏳</div>
                    <div class="stat-value">${stats.hetHieuLuc}</div>
                    <div class="stat-label">Chờ kích hoạt</div>
                </div>
            </div>

            <!-- FILTER TABS -->
            <div class="filter-tabs">
                <button class="filter-tab active" data-type="all" onclick="setNguoiDung(this)">Tất Cả</button>
                <button class="filter-tab" data-type="ADMIN" onclick="setNguoiDung(this)">Quản Trị Viên</button>
                <button class="filter-tab" data-type="USER" onclick="setNguoiDung(this)">Nhân Viên</button>
            </div>

            <!-- TABLE -->
            <div class="table-card">
                <table id="tbl-users" class="display stripe" style="width:100%">
                    <thead>
                        <tr>
                            <th class="text-center">STT</th>
                            <th>Người Dùng</th>
                            <th>Khoa / Phòng</th>
                            <th class="text-center">Vai Trò</th>
                            <th class="text-center">Trạng Thái</th>
                            <th class="text-center">Thao Tác</th>
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

    initNguoiDungTable();
    initKhoaPhongSelect();
}

//Khởi tạo Datatable
function initNguoiDungTable() {

    $('#tbl-users').DataTable($.extend(true, {}, dtDefaults, {
        // order: [[3, 'desc']],
        // columnDefs: [
        //     {
        //         orderable: false,
        //         targets: [1, 4]
        //     }
        // ]
    }));

}

//Khởi tạo select search
async function initKhoaPhongSelect() {

    const khoaPhongList = await fetchKhoaPhongs();

    document.getElementById("khoaPhongND").innerHTML = `
        ${khoaPhongList.map(kp => `<option value="${kp.id}">${kp.ten}</option>`).join("")}
    `;

    document.getElementById("khoaPhongNDUpdate").innerHTML = `
        ${khoaPhongList.map(kp => `<option value="${kp.id}">${kp.ten}</option>`).join("")}
    `;

    $("#khoaPhongND").select2({
        placeholder: "Chọn Khoa / Phòng...",
        allowClear: false,
        width: "100%"
    });

    $("#khoaPhongNDUpdate").select2({
        placeholder: "Chọn Khoa / Phòng...",
        allowClear: false,
        width: "100%"
    });
}

//set du lieu theo tab
function setNguoiDung(el) {

    el.closest('.filter-tabs').querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const type = el.dataset.type;

    filterNguoiDung(type);
}

//Lọc dữ liệu theo các tab
function filterNguoiDung(type) {

    const table = $('#tbl-users').DataTable();
    table.columns().search('');

    switch (type) {

        case "USER":
            table.column(2).search('Nhân viên').draw();
            break;

        case "ADMIN":
            table.column(2).search('Quản trị viên').draw();
            break;

        case "ALL":
            table.column(2).search('').draw();
        default:
            break;
    }

    table.draw();

}

//Thêm người dùng
async function submitNguoiDungForm() {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    const hoTen = document.getElementById('hoTen').value.trim();
    const taiKhoan = document.getElementById('taiKhoan').value.trim();
    const matKhau = document.getElementById('matKhau').value.trim();
    const role = document.getElementById('role').value;
    const xoa = document.getElementById('xoa').value;
    const khoaPhong = {
        "id": document.getElementById('khoaPhongND').value
    };

    const body = {
        hoTen: hoTen,
        taiKhoan: taiKhoan,
        matKhau: matKhau,
        role: role,
        khoaPhong: khoaPhong,
        xoa: xoa
    };

    try {
        const response = await fetch('/api/nguoi-dung', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể tạo người dùng mới.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        showToast('success', 'Thành công!', `Tạo người dùng mới thành công!`);
        closeModal('addUserModal');
        clearAddQlndForm();
        loadQLNDPage();
    } catch (error) {
        console.error('Error creating người dùng:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

//ClearForm thêm nguoi dung
function clearAddQlndForm() {
    document.getElementById('hoTen').value = '';
    document.getElementById('taiKhoan').value = '';
    document.getElementById('matKhau').value = '';
}

//mở modal cập nhật user
function openUpdateNguoiDungModal(id) {

    window.nguoiDungUpdate = window.currentNguoiDungList.find(b => b.id === Number(id));

    if (!nguoiDungUpdate) {
        showToast('error', 'Thất bại!', "Không nhận được dữ liệu Người dùng");
        return;
    }

    console.log("Mở modal cập nhật cho Người dùng:", nguoiDungUpdate);

    document.getElementById('hoTenUpdate').value = nguoiDungUpdate.hoTen;
    document.getElementById('xoaUpdate').value = nguoiDungUpdate.xoa;
    document.getElementById('roleUpdate').value = nguoiDungUpdate.role;

    $("#khoaPhongNDUpdate").val(nguoiDungUpdate.khoaPhong.id).trigger("change");

    document.getElementById('taiKhoanUpdate').value = nguoiDungUpdate.taiKhoan;

    openModal('updateUserModal');
}

//Cập nhật câu hỏi
async function updateNguoiDung() {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    const nguoiDungUpdateId = window.nguoiDungUpdate.id;

    const hoTen = document.getElementById('hoTenUpdate').value.trim();
    const matKhau = document.getElementById('matKhauUpdate').value.trim();
    const role = document.getElementById('roleUpdate').value;
    const xoa = document.getElementById('xoaUpdate').value;
    const khoaPhong = {
        "id": document.getElementById('khoaPhongNDUpdate').value
    };

    const body = {
        hoTen: hoTen,
        matKhau: matKhau,
        role: role,
        khoaPhong: khoaPhong,
        xoa: xoa
    };

    try {
        const response = await fetch(`/api/nguoi-dung/${nguoiDungUpdateId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể cập nhật người dùng.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        showToast('success', 'Thành công!', `Cập nhật người dùng mới thành công!`);
        closeModal('updateUserModal');
        clearUpdateQlndForm();
        loadQLNDPage();

    } catch (error) {
        console.error('Error update người dùng:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

//ClearForm update
function clearUpdateQlndForm() {
    document.getElementById('hoTenUpdate').value = '';
    document.getElementById('taiKhoanUpdate').value = '';
    document.getElementById('matKhauUpdate').value = '';
}

//Xóa bài kiểm tra
async function deleteNguoiDung(id) {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`/api/nguoi-dung/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể xóa người dùng.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        showToast('success', 'Thành công!', `Xóa người dùng thành công!`);
        // Xóa khỏi mảng hiện tại
        loadQLNDPage();

    } catch (error) {
        console.error('Error deleting người dùng:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}