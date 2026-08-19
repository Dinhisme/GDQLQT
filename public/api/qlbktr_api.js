document.addEventListener('DOMContentLoaded', function () {

    // const addTestsForm = document.getElementById('addTestForm');
    // if (addTestsForm) {
    //     addTestsForm.addEventListener('submit', function (event) {
    //         event.preventDefault();
    //         addTestForm();
    //     });
    // }
});


function formatDateTime(dateTime) {
    if (!dateTime) return "";

    const [date, time] = dateTime.split("T");
    const [yyyy, MM, dd] = date.split("-");
    const [hh, mm] = time.split(":");

    return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
}

//Load dữ liệu QLBKT
async function loadQLBKTPage() {
    try {
        const baiKiemTraList = await fetchBaiKiemTra();

        window.currentBaiKiemTraList = baiKiemTraList;

        document.getElementById("sidebar-baikiemtra").textContent = `${baiKiemTraList.length}`;

        renderBaiKiemTraPage(baiKiemTraList);

    } catch (error) {
        console.error(error);

        document.getElementById('mainContent').innerHTML = `
            <div class="content-header">
                <h1>Quản lý Bài Kiểm Tra</h1>
                <p style="color: var(--danger);">
                    Lỗi: ${error.message}
                </p>
            </div>
        `;
    }
}

//Bắt đầu gọi API
async function fetchBaiKiemTra() {
    const token = localStorage.getItem("authToken");

    const response = await fetch("/api/bai-kiem-tra", {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || "Không thể lấy dữ liệu bài kiểm tra");
    }

    return result.data || [];
}

//Tạo các row cho table
function createBaiKiemTraRows(list) {

    return list.map((baiKiemTra, index) => {

        let trangThaiText;
        let badgeTrangThai;
        switch (baiKiemTra.trangThai) {
            case 0:
                trangThaiText = 'Nháp';
                badgeTrangThai = 'yellow';
                break;
            case 1:
                trangThaiText = 'Đang Mở';
                badgeTrangThai = 'green';
                break;
            case 2:
                trangThaiText = 'Đã Đóng';
                badgeTrangThai = 'blue';
                break;
        }

        let badgeTrangThaiTiLeDat;
        switch (baiKiemTra.tiLeDat) {
            case baiKiemTra.tiLeDat > 80:
                badgeTrangThaiTiLeDat = 'green';
                break;
            case baiKiemTra.tiLeDat > 60:
                badgeTrangThaiTiLeDat = 'yellow';
                break;
            default:
                badgeTrangThaiTiLeDat = 'red';
                break;
        }

        return `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td class="col-name">${baiKiemTra.tenBaiKiem}<small>${baiKiemTra.tongSoCauHoi} câu · ${baiKiemTra.thoiGianLamBai} phút</small></td>
                <td>${baiKiemTra.moTa}</td>
                <td>
                    ${Array.isArray(baiKiemTra.khoaPhongs) && baiKiemTra.khoaPhongs.length > 0
                ? baiKiemTra.khoaPhongs.map(kp => kp.ten).join(', <br> ')
                : 'Không có'}
                </td>
                <td>
                    ${Array.isArray(baiKiemTra.quyTrinhs) && baiKiemTra.quyTrinhs.length > 0
                ? baiKiemTra.quyTrinhs.map(qt => qt.loaiQuyTrinh + ' số: ' + qt.so).join(', <br> ')
                : 'Không có'}
                </td>
                <td class="text-center">${baiKiemTra.tongSoLuotThi}</td>
                <td class="text-center">${baiKiemTra.diemTrungBinh}</td>
                <td class="text-center"><span class="badge badge-${badgeTrangThaiTiLeDat}">${baiKiemTra.tiLeDat}%</span></td>
                <td class="text-center"><span class="badge badge-blue">${baiKiemTra.thoiGianLamBai}</span></td>
                <td class="text-center">${formatDateTime(baiKiemTra.thoiGianBatDau)}</td>
                <td class="text-center">${formatDateTime(baiKiemTra.thoiGianKetThuc)}</td>
                <td class="text-center"><span class="badge badge-${badgeTrangThai}">${trangThaiText}</span></td>
            </tr>
        `;
    }).join("");
}

//Tạo các cau hoi card
function createBaiKiemTraCards(list) {

    return list.map((baiKiemTra, index) => {

        let trangThaiText;
        let badgeTrangThai;
        switch (baiKiemTra.trangThai) {
            case 0:
                trangThaiText = 'Nháp';
                badgeTrangThai = 'yellow';
                break;
            case 1:
                trangThaiText = 'Đang Mở';
                badgeTrangThai = 'green';
                break;
            case 2:
                trangThaiText = 'Đã Đóng';
                badgeTrangThai = 'blue';
                break;
        }

        return `
            <div class="test-card">
                <div class="test-card-title">
                    ${baiKiemTra.tenBaiKiem}
                </div>
                <div class="test-card-desc">${baiKiemTra.moTa}</div>
                <div class="test-meta-row">
                    <div class="test-meta-item">🏷️ <span>${baiKiemTra.id}</span></div>
                    <div class="test-meta-item">❓ <span>${baiKiemTra.tongSoCauHoi} câu</span></div>
                    <div class="test-meta-item">⏱ <span>${baiKiemTra.thoiGianLamBai}p</span></div>
                    <div class="test-meta-item">🎯 <span>${baiKiemTra.diemTrungBinh}</span></div>
                    <div class="test-meta-item">🔀 <span>${baiKiemTra.tronCauHoi === 1 ? 'Có' : 'Không'}</span></div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${baiKiemTra.tiLeDat}%"></div>
                </div>
                <div style="font-size:11px;color:#2563eb;opacity:.6;margin-top:4px;">${baiKiemTra.tongSoLuotThi == 0 ? "Chưa có ai thi" : `${baiKiemTra.tongSoLuotThi} người đã thi`}</div>
                <div class="test-card-footer">
                    <span class="badge badge-${badgeTrangThai}">${trangThaiText}</span>
                    <div class="row-actions">
                        <div class="act-btn">👁</div>
                        <div class="act-btn" onclick="openUpdateBaiKiemTraModal('${baiKiemTra.id}')">✏️</div>
                        <div class="act-btn del" onclick="deleteBaiKiemTra('${baiKiemTra.id}')">🗑</div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

//Đưa dữ liệu ra index
async function renderBaiKiemTraPage(baiKiemTraList) {

    const cardRows = createBaiKiemTraCards(baiKiemTraList);

    // const quytrinhList = await fetchQuyTrinh();

    const tableRows = createBaiKiemTraRows(baiKiemTraList);

    document.getElementById("mainContent").innerHTML = `
        <!-- TESTS PAGE -->
        <div class="page" id="page-tests">
            <div class="section-header" style="margin-bottom:20px">
                <div>

                </div>
                <button class="btn btn-primary" onclick="openModal('addTestModal')">+ Tạo Bài Kiểm Tra</button>
            </div>

            <div class="filter-tabs">
                <button class="filter-tab active" data-type="ALL" onclick="setTabBaiKiemTra(this)">Tất Cả</button>
                <button class="filter-tab" data-type="1" onclick="setTabBaiKiemTra(this)">Đang Mở</button>
                <button class="filter-tab" data-type="2" onclick="setTabBaiKiemTra(this)">Đã Đóng</button>
                <button class="filter-tab" data-type="0" onclick="setTabBaiKiemTra(this)">Nháp</button>
            </div>

            <div class="test-grid" id="testsList">
                ${cardRows}
            </div>
        </div>

        <!-- DETAIL TABLE -->

        <div class="table-card" style="margin-top:30px;">
            <table id="tbl-tests" class="display stripe" style="width:100%">
                <thead>
                    <tr>
                        <th class="text-center">STT</th>
                        <th>Tên Bài Kiểm Tra</th>
                        <th>Mô tả</th>
                        <th>Khoa/Phòng/TT</th>
                        <th>Văn bản</th>
                        <th class="text-center">Lượt Thi</th>
                        <th class="text-center">Điểm TB</th>
                        <th class="text-center">Tỉ Lệ Đạt</th>
                        <th class="text-center">Thời Gian</th>
                        <th class="text-center">Thời Gian Bắt Đầu</th>
                        <th class="text-center">Thời Gian Kết Thúc</th>
                        <th class="text-center">Trạng Thái</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
    initBaiKiemTraTable();
    initQuyTrinhSelectBktr();
}

//Khởi tạo Datatable
function initBaiKiemTraTable() {
    $('#tbl-tests').DataTable($.extend(true, {}, dtDefaults, {}));
}

function getCurrentDateTimeLocal() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

//Khởi tạo select search
async function initQuyTrinhSelectBktr() {

    const quytrinhList = await fetchQuyTrinh();
    const khoaPhongList = await fetchKhoaPhongs();

    const now = getCurrentDateTimeLocal();

    const input = document.getElementById("thoiGianBatDau");
    input.min = now;
    input.value = now;

    const input2 = document.getElementById("thoiGianKetThuc");
    input2.min = now;
    input2.value = now;


    document.getElementById("quyTrinhSelectBktr").innerHTML = `
        ${quytrinhList.map(qt => `<option value="${qt.id}">${qt.so} -- ${qt.tenQuyTrinh}</option>`).join("")}
    `;

    document.getElementById("khoaPhongSelect").innerHTML = `
        ${khoaPhongList.map(kp => `<option value="${kp.id}">${kp.ten}</option>`).join("")}
    `;

    document.getElementById("quyTrinhSelectBktrUpdate").innerHTML = `
        ${quytrinhList.map(qt => `<option value="${qt.id}">${qt.so} -- ${qt.tenQuyTrinh}</option>`).join("")}
    `;

    document.getElementById("khoaPhongSelectUpdate").innerHTML = `
        ${khoaPhongList.map(kp => `<option value="${kp.id}">${kp.ten}</option>`).join("")}
    `;

    $("#quyTrinhSelectBktr").select2({
        placeholder: "Chọn Văn bản...",
        allowClear: false,
        width: "100%"
    });

    $("#khoaPhongSelect").select2({
        placeholder: "Chọn Khoa / Phòng...",
        allowClear: false,
        width: "100%"
    });

    $("#quyTrinhSelectBktrUpdate").select2({
        placeholder: "Chọn Văn bản...",
        allowClear: false,
        width: "100%"
    });

    $("#khoaPhongSelectUpdate").select2({
        placeholder: "Chọn Khoa / Phòng...",
        allowClear: false,
        width: "100%"
    });

}

//Thêm Bài Kiểm Tra
async function addTestForm(trangThai) {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    const tenBaiKiem = document.getElementById('tenBaiKiemTra').value.trim();

    const moTa = document.getElementById('moTa').value.trim();

    const quyTrinhIds = $("#quyTrinhSelectBktr").val();

    const khoaPhongIds = $("#khoaPhongSelect").val();

    const thoiGianLamBai = document.getElementById('thoiGianLamBai').value.trim();

    const tronCauHoi = document.getElementById('tronCauHoi').value.trim();

    const thoiGianBatDau = document.getElementById('thoiGianBatDau').value.trim();

    const thoiGianKetThuc = document.getElementById('thoiGianKetThuc').value.trim();

    const body = {
        tenBaiKiem: tenBaiKiem,
        moTa: moTa,
        quyTrinhIds: quyTrinhIds,
        khoaPhongIds: khoaPhongIds,
        thoiGianLamBai: thoiGianLamBai,
        tronCauHoi: tronCauHoi,
        thoiGianBatDau: thoiGianBatDau,
        thoiGianKetThuc: thoiGianKetThuc,
        trangThai: trangThai
    };

    try {
        const response = await fetch('/api/bai-kiem-tra', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể tạo bài kiểm tra mới.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        loadQLBKTPage();

        showToast('success', 'Thành công!', `Tạo Bài Kiểm Tra mới thành công!`);
        closeModal('addTestModal');
        clearAddTestForm();

    } catch (error) {
        console.error('Error creating bài kiểm tra:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

//ClearForm thêm bài kiểm tra
function clearAddTestForm() {
    document.getElementById('tenBaiKiemTra').value = '';
    document.getElementById('moTa').value = '';
    document.getElementById('quyTrinhSelectBktr').value = '';
    document.getElementById('khoaPhongSelect').value = '';
    document.getElementById('thoiGianBatDau').value = '';
    document.getElementById('thoiGianKetThuc').value = '';
}

//Mở cửa sổ để cập nhập bài kiểm tra
function openUpdateBaiKiemTraModal(id) {

    window.baiKiemTraUpdate = window.currentBaiKiemTraList.find(b => b.id === Number(id));

    if (!baiKiemTraUpdate) {
        showToast('error', 'Thất bại!', "Không nhận được dữ liệu Bài Kiểm Tra");
        return;
    }

    console.log("Mở modal cập nhật cho Bài Kiểm Tra:", baiKiemTraUpdate);

    document.getElementById('tenBaiKiemTraUpdate').value = baiKiemTraUpdate.tenBaiKiem;
    document.getElementById('moTaUpdate').value = baiKiemTraUpdate.moTa;

    $("#quyTrinhSelectBktrUpdate")
        .val(
            (baiKiemTraUpdate.quyTrinhs || [])
                .map(item => String(item.id))
        )
        .trigger("change");

    $("#khoaPhongSelectUpdate")
        .val(
            (baiKiemTraUpdate.khoaPhongs || [])
                .map(item => String(item.id))
        )
        .trigger("change");
    document.getElementById('thoiGianLamBaiUpdate').value = baiKiemTraUpdate.thoiGianLamBai;
    document.getElementById('tronCauHoiUpdate').value = baiKiemTraUpdate.tronCauHoi;
    document.getElementById('thoiGianBatDauUpdate').value = baiKiemTraUpdate.thoiGianBatDau;
    document.getElementById('thoiGianKetThucUpdate').value = baiKiemTraUpdate.thoiGianKetThuc;

    openModal('updateTestModal');
}

//Cập nhật Bài Kiểm Tra
async function updateTestForm(trangThai) {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    const tenBaiKiem = document.getElementById('tenBaiKiemTraUpdate').value.trim();

    const moTa = document.getElementById('moTaUpdate').value.trim();

    const quyTrinhIds = $("#quyTrinhSelectBktrUpdate").val();

    const khoaPhongIds = $("#khoaPhongSelectUpdate").val();

    const thoiGianLamBai = document.getElementById('thoiGianLamBaiUpdate').value.trim();

    const tronCauHoi = document.getElementById('tronCauHoiUpdate').value.trim();

    const thoiGianBatDau = document.getElementById('thoiGianBatDauUpdate').value.trim();

    const thoiGianKetThuc = document.getElementById('thoiGianKetThucUpdate').value.trim();

    const body = {
        tenBaiKiem: tenBaiKiem,
        moTa: moTa,
        quyTrinhIds: quyTrinhIds,
        khoaPhongIds: khoaPhongIds,
        thoiGianLamBai: thoiGianLamBai,
        tronCauHoi: tronCauHoi,
        thoiGianBatDau: thoiGianBatDau,
        thoiGianKetThuc: thoiGianKetThuc,
        trangThai: trangThai
    };

    try {
        const response = await fetch(`/api/bai-kiem-tra/${baiKiemTraUpdate.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể cập nhật bài kiểm tra.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        loadQLBKTPage();

        showToast('success', 'Thành công!', `Cập nhật Bài Kiểm Tra thành công!`);
        closeModal('updateTestModal');
        clearUpdateTestForm();

    } catch (error) {
        console.error('Error updating bài kiểm tra:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

//ClearForm thêm bài kiểm tra
function clearUpdateTestForm() {
    document.getElementById('tenBaiKiemTraUpdate').value = '';
    document.getElementById('moTaUpdate').value = '';
    document.getElementById('quyTrinhSelectBktrUpdate').value = '';
    document.getElementById('khoaPhongSelectUpdate').value = '';
    document.getElementById('thoiGianBatDauUpdate').value = '';
    document.getElementById('thoiGianKetThucUpdate').value = '';
}

//Xóa bài kiểm tra
async function deleteBaiKiemTra(id) {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`/api/bai-kiem-tra/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể xóa bài kiểm tra.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        showToast('success', 'Thành công!', `Xóa bài kiểm tra thành công!`);
        // Xóa khỏi mảng hiện tại
        loadQLBKTPage();

    } catch (error) {
        console.error('Error deleting bài kiểm tra:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

//set du lieu theo tab
function setTabBaiKiemTra(el) {

    el.closest('.filter-tabs').querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const type = el.dataset.type;

    filterTabBaiKiemTra(type);
}

//Lọc dữ liệu theo các tab
function filterTabBaiKiemTra(type) {

    list = window.currentBaiKiemTraList;

    if (type !== 'ALL') {
        list = list.filter(item => item.trangThai == type);
    }

    document.getElementById("testsList").innerHTML =
        createBaiKiemTraCards(list);

}
