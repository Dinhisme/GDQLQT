document.addEventListener('DOMContentLoaded', function () {
    const addDocForm = document.getElementById('addDocForm');
    if (addDocForm) {
        addDocForm.addEventListener('submit', function (event) {
            event.preventDefault();
            submitQuyTrinhForm();
        });
    }

    const updateDocForm = document.getElementById('updateDocForm');
    if (updateDocForm) {
        updateDocForm.addEventListener('submit', function (event) {
            event.preventDefault();
            updateQuyTrinh();
        });
    }

});

//Load dữ liệu QLQT
async function loadQLQTPage() {
    try {
        const quytrinhList = await fetchQuyTrinh();

        window.currentQuyTrinhList = quytrinhList;

        renderQLQTPage(quytrinhList);

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
async function fetchQuyTrinh() {
    const token = localStorage.getItem("authToken");

    const response = await fetch("/api/quy-trinh", {
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

//Tạo các row cho table
function createQuyTrinhRows(list) {

    return list.map((quytrinh, index) => {

        const badge =
            quytrinh.trangThai === 1
                ? "green"
                : "red";

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${quytrinh.so}</td>
                <td>${quytrinh.tenQuyTrinh}</td>
                <td>
                    <span class="badge badge-purple">
                        ${quytrinh.loaiQuyTrinh}
                    </span>
                </td>
                <td>${quytrinh.phamVi}</td>
                <td>${quytrinh.viTriLuu}</td>
                <td>${formatDate(quytrinh.ngayBanHanh)}</td>
                <td>
                    <span class="badge badge-${badge}">
                        ${quytrinh.trangThai === 1 ? "Hiệu lực" : "Hết hiệu lực"}
                    </span>
                </td>

                <td>
                    <div class="row-actions">
                        <div class="act-btn"
                            onclick="viewUploadedFile('${quytrinh.duongDan ? quytrinh.duongDan.replace(/'/g, "\\'") : ''}')">
                            👁
                        </div>

                        <div class="act-btn"
                            onclick="openUpdateQuyTrinhModal(${quytrinh.id})">
                            ✏️
                        </div>

                        <div class="act-btn del"
                            onclick="deleteQuyTrinh(${quytrinh.id})">
                            🗑
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

//Đưa dữ liệu ra index
function renderQLQTPage(quytrinhList) {

    const stats = getQuyTrinhStatistics(quytrinhList);

    const tableRows = createQuyTrinhRows(quytrinhList);

    document.getElementById("mainContent").innerHTML = `
        <!-- DOCUMENTS PAGE -->
        <div class="page" id="page-qlqt">
            <div class="section-header" style="margin-bottom:20px">
                <div>
                    
                </div>
                <button class="btn btn-primary" onclick="openModal('addDocModal')">+ Thêm Văn Bản</button>
            </div>

            <!-- STATISTICS SECTION -->
            <div class="stats-grid" style="margin-bottom: 24px;">
                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(59, 130, 246, 0.12); color: #2563eb;">📋</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">Tổng Văn Bản</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(5, 150, 105, 0.12); color: #059669;">✓</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.hieuLuc}</div>
                        <div class="stat-label">Đang Hiệu Lực</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(251, 191, 36, 0.12); color: #fbbf24;">⚠</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.hetHieuLuc}</div>
                        <div class="stat-label">Sắp Hết Hạn</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: rgba(239, 68, 68, 0.12); color: #dc2626;">✕</div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.sapHetHan}</div>
                        <div class="stat-label">Hết Hạn</div>
                    </div>
                </div>
            </div>

            <div class="filter-tabs">
                <button class="filter-tab active" data-type="ALL" onclick="setTab(this)">Tất Cả</button>
                <button class="filter-tab" data-type="QUY_TRINH" onclick="setTab(this)">Quy Trình</button>
                <button class="filter-tab" data-type="PDDT" onclick="setTab(this)">Phác Đồ Điều Trị</button>
                <button class="filter-tab" data-type="QUY_DINH" onclick="setTab(this)">Quy Định</button>
                <button class="filter-tab" data-type="HUONG_DAN" onclick="setTab(this)">Hướng Dẫn</button>
                <button class="filter-tab" data-type="THONG_BAO" onclick="setTab(this)">Thông Báo</button>
                <button class="filter-tab" data-type="BAO_CAO" onclick="setTab(this)">Báo Cáo</button>
                <button class="filter-tab" data-type="KHAC" onclick="setTab(this)">Khác</button>
                <button class="filter-tab" data-type="HET_HAN" onclick="setTab(this)">Hết Hạn</button>
            </div>

            <div class="table-card">
                <div class="table-wrap">
                    <table id="tbl-dashboard" class="display stripe" style="width:100%">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Số</th>
                                <th>Tên Văn Bản</th>
                                <th>Thuộc Loại</th>
                                <th>Phạm vi</th>
                                <th>Vị trí lưu</th>
                                <th>Ngày Hiệu Lực</th>
                                <th>Trạng Thái</th>
                                <th>Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    initQuyTrinhTable();
}

//Khởi tạo Datatable
function initQuyTrinhTable() {

    $('#tbl-dashboard').DataTable($.extend(true, {}, dtDefaults, {
        // order: [[3, 'desc']],
        // columnDefs: [
        //     {
        //         orderable: false,
        //         targets: [1, 4]
        //     }
        // ]
    }));

}

//Lọc dữ liệu theo các tab
function filterQuyTrinh(type) {

    const table = $('#tbl-dashboard').DataTable();
    table.columns().search('');

    switch (type) {

        case "QUY_TRINH":
            table.column(3).search('Quy Trình').draw();
            break;

        case "PDDT":
            table.column(3).search('Phác Đồ Điều Trị').draw();
            break;

        case "QUY_DINH":
            table.column(3).search('Quy Định').draw();
            break;

        case "HUONG_DAN":
            table.column(3).search('Hướng Dẫn').draw();
            break;

        case "THONG_BAO":
            table.column(3).search('Thông Báo').draw();
            break;

        case "BAO_CAO":
            table.column(3).search('Báo Cáo').draw();
            break;

        case "KHAC":
            table.column(3).search('Khác').draw();
            break;

        case "HET_HAN":
            table.column(7).search('Hết hiệu lực').draw();
            break;

        case "ALL":
            table.column(3).search('').draw();
        default:
            break;
    }

    table.draw();

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

//Thêm văn bản
async function submitQuyTrinhForm() {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    const so = document.getElementById('soQuyTrinh').value.trim();
    const tenQuyTrinh = document.getElementById('tenQuyTrinh').value.trim();
    const loaiQuyTrinh = document.getElementById('loaiQuyTrinh').value;
    const ngayBanHanh = document.getElementById('ngayBanHanh').value;
    const phamVi = document.getElementById('phamVi').value.trim();
    const viTriLuu = document.getElementById('viTriLuu').value.trim();
    const trangThai = document.getElementById('trangThai').value;
    const fileInput = document.getElementById('fileInput');
    const file = fileInput ? fileInput.files[0] : null;

    if (!tenQuyTrinh) {
        showToast('error', 'Cảnh báo!', `Vui lòng nhập tên văn bản!`);
        return;
    }

    const formData = new FormData();
    formData.append('so', so);
    formData.append('tenQuyTrinh', tenQuyTrinh);
    formData.append('loaiQuyTrinh', loaiQuyTrinh);
    formData.append('ngayBanHanh', ngayBanHanh);
    formData.append('phamVi', phamVi);
    formData.append('viTriLuu', viTriLuu);
    formData.append('trangThai', String(trangThai));
    if (file) {
        formData.append('file', file);
    }

    try {
        const response = await fetch('/api/quy-trinh', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể tạo văn bản mới.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        showToast('success', 'Thành công!', `Tạo Văn Bản mới thành công!`);
        closeModal('addDocModal');
        clearAddDocForm();
        loadQLQTPage();
    } catch (error) {
        console.error('Error creating văn bản:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

//ClearForm thêm văn bản
function clearAddDocForm() {
    document.getElementById('tenQuyTrinh').value = '';
    document.getElementById('loaiQuyTrinh').value = 'Quy định';
    document.getElementById('soQuyTrinh').value = '';
    document.getElementById('ngayBanHanh').value = '';
    document.getElementById('phamVi').value = '';
    document.getElementById('viTriLuu').value = '';
    document.getElementById('trangThai').value = '1';
    if (typeof clearFileUpload === 'function') {
        clearFileUpload();
    }
}

//Mở cửa sổ để cập nhập văn bản
function openUpdateQuyTrinhModal(id) {
    const quytrinhUpdate = window.currentQuyTrinhList.find(q => q.id === id);

    if (!quytrinhUpdate) {
        showToast('error', 'Thất bại!', "Không nhận được dữ liệu Văn Bản");
        return;
    }

    // console.log("Mở modal cập nhật cho Văn Bản:", quytrinhUpdate);

    document.getElementById('soQuyTrinhUpdate').value = quytrinhUpdate.so || '';
    document.getElementById('tenQuyTrinhUpdate').value = quytrinhUpdate.tenQuyTrinh || '';
    document.getElementById('loaiQuyTrinhUpdate').value = quytrinhUpdate.loaiQuyTrinh || 'Quy Trình';
    document.getElementById('ngayBanHanhUpdate').value = quytrinhUpdate.ngayBanHanh || '';
    document.getElementById('phamViUpdate').value = quytrinhUpdate.phamVi || '';
    document.getElementById('viTriLuuUpdate').value = quytrinhUpdate.viTriLuu || '';
    document.getElementById('trangThaiUpdate').value = quytrinhUpdate.trangThai ?? '1';

    openModal('updateDocModal');
}

//Cập nhật văn bản
async function updateQuyTrinh() {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    const so = document.getElementById('soQuyTrinhUpdate').value.trim();
    const tenQuyTrinh = document.getElementById('tenQuyTrinhUpdate').value.trim();
    const loaiQuyTrinh = document.getElementById('loaiQuyTrinhUpdate').value;
    const ngayBanHanh = document.getElementById('ngayBanHanhUpdate').value;
    const phamVi = document.getElementById('phamViUpdate').value.trim();
    const viTriLuu = document.getElementById('viTriLuuUpdate').value.trim();
    const trangThai = document.getElementById('trangThaiUpdate').value;
    const fileInput = document.getElementById('fileInputUpdate');
    const file = fileInput ? fileInput.files[0] : null;

    if (!tenQuyTrinh) {
        showToast('error', 'Cảnh báo!', `Vui lòng nhập tên văn bản!`);
        return;
    }

    const formData = new FormData();
    formData.append('id', window.quytrinhUpdate.id);
    formData.append('so', so);
    formData.append('tenQuyTrinh', tenQuyTrinh);
    formData.append('loaiQuyTrinh', loaiQuyTrinh);
    formData.append('ngayBanHanh', ngayBanHanh);
    formData.append('phamVi', phamVi);
    formData.append('viTriLuu', viTriLuu);
    formData.append('trangThai', String(trangThai));
    if (file) {
        formData.append('file', file);
    }

    try {
        const response = await fetch('/api/quy-trinh', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể cập nhật văn bản.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        showToast('success', 'Thành công!', `Cập nhật văn bản thành công!`);
        closeModal('updateDocModal');
        clearUpdateDocForm();
        loadQLQTPage();
    } catch (error) {
        console.error('Error update văn bản:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

//ClearForm cập nhật văn bản
function clearUpdateDocForm() {
    document.getElementById('tenQuyTrinhUpdate').value = '';
    document.getElementById('loaiQuyTrinhUpdate').value = 'Quy định';
    document.getElementById('soQuyTrinhUpdate').value = '';
    document.getElementById('ngayBanHanhUpdate').value = '';
    document.getElementById('phamViUpdate').value = '';
    document.getElementById('viTriLuuUpdate').value = '';
    document.getElementById('trangThaiUpdate').value = '1';
    if (typeof clearFileUploadUpdate === 'function') {
        clearFileUploadUpdate();
    }
}

//Xóa văn bản
async function deleteQuyTrinh(id) {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`/api/quy-trinh/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể xóa văn bản.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        showToast('success', 'Thành công!', `Xóa văn bản thành công!`);

        // Xóa khỏi mảng hiện tại
        window.currentQuyTrinhList =
            window.currentQuyTrinhList.filter(qt => qt.id !== id);

        // Render lại giao diện
        renderQLQTPage(window.currentQuyTrinhList);

    } catch (error) {
        console.error('Error update văn bản:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

