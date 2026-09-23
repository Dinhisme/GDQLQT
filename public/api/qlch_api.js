document.addEventListener('DOMContentLoaded', function () {
    const addCauHoi = document.getElementById('addQuestionForm');
    if (addCauHoi) {
        addCauHoi.addEventListener('submit', function (event) {
            event.preventDefault();
            addCauHoiForm();
        });
    }

    const updateCauHoiForm = document.getElementById('updateQuestionForm');
    if (updateCauHoiForm) {
        updateCauHoiForm.addEventListener('submit', function (event) {
            event.preventDefault();
            updateCauHoi();
        });
    }

    const importCauHoiForm = document.getElementById('importQuestionForm');
    if (importCauHoiForm) {
        importCauHoiForm.addEventListener('submit', function (event) {
            event.preventDefault();
            importCauHoiExcel();
        });
    }
});

//Load dữ liệu QLQT
async function loadQLCHPage() {
    try {
        const cauHoiList = await fetchCauHoi();

        window.currentCauHoiList = cauHoiList;

        renderCauHoiPage(cauHoiList);

    } catch (error) {
        console.error(error);

        document.getElementById('mainContent').innerHTML = `
            <div class="content-header">
                <h1>Quản lý Câu hỏi</h1>
                <p style="color: var(--danger);">
                    Lỗi: ${error.message}
                </p>
            </div>
        `;
    }
}

//Bắt đầu gọi API
async function fetchCauHoi() {
    const token = localStorage.getItem("authToken");

    const response = await fetch("/api/cau-hoi/khoa-phong", {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || "Không thể lấy dữ liệu câu hỏi");
    }

    return result.data || [];
}

//tao cac dap an
function createDapAnCards(dapAns, dapAnDungId) {
    return dapAns.map((dapAn, index) => {
        let lableDapAn;
        switch (dapAn.thuTu) {
            case 1:
                lableDapAn = 'A'
                break;
            case 2:
                lableDapAn = 'B'
                break;
            case 3:
                lableDapAn = 'C'
                break;
            case 4:
                lableDapAn = 'D'
                break;
        }
        return `
            <label class="q-opt q-opt-input ${dapAn.id === dapAnDungId ? "correct" : ""}">
                <input type="radio" name="q${index}" value="${dapAn.noiDung}" class="q-radio">
                <span class="q-opt-label">${lableDapAn}</span> ${dapAn.noiDung}
            </label>
        `;
    }).join("");
}

//Tạo các cau hoi card
function createCauHoiCards(list) {

    return list.map((cauHoi, index) => {

        const dapAns = createDapAnCards(cauHoi.dapAns, cauHoi.dapAnDung.id);

        const badgeLoaiCauHoiMap = {
            tracNghiem: "green",
            dungSai: "blue",
            dat: "pink"
        }

        const badgeLoaiCauHoi = badgeLoaiCauHoiMap[cauHoi.loaiCauHoi] || "Không xác định";
        const loaiCauHoiMap = {
            tracNghiem: "Trắc nghiệm",
            dungSai: "Đúng/Sai",
            dat: "Đạt/Không đạt"
        };

        const loaiCauHoi = loaiCauHoiMap[cauHoi.loaiCauHoi] || "Không xác định";

        let mucDoCauHoi;
        let badgeMucDoCauHoi;
        switch (cauHoi.trangThai) {
            case 0:
                mucDoCauHoi = 'Dễ';
                badgeMucDoCauHoi = 'green';
                break;
            case 1:
                mucDoCauHoi = 'Trung Bình'
                badgeMucDoCauHoi = 'yellow';
                break;
            case 2:
                mucDoCauHoi = 'Khó'
                badgeMucDoCauHoi = 'red';
                break;
        }

        return `
            <div class="q-card">
                <div class="q-meta">
                    <span class="q-num">#${index + 1}</span>
                    <span class="badge q-num">ID: ${cauHoi.id}</span>
                    <span class="badge badge-${badgeLoaiCauHoi}">${loaiCauHoi}</span>
                    <span class="badge badge-${badgeMucDoCauHoi}">${mucDoCauHoi}</span>
                    <span class="badge-right">${cauHoi.quyTrinhGetSo}</span>
                </div>
                <div class="q-text">${cauHoi.noiDung}</div>
                <div class="q-options">
                    ${dapAns}
                </div>
                <div class="q-footer">
                    <span style="font-size:11.5px;color:#2563eb;opacity:.65;">${cauHoi.quyTrinhGetTen}</span>
                    <div class="row-actions">
                        <div class="act-btn" title="Chỉnh sửa" onclick="openUpdateCauHoiModal(${cauHoi.id})">✏️</div>
                        <div class="act-btn" title="Nhân bản" onclick="saoChepCauHoi(${cauHoi.id})">⧉</div>
                        <div class="act-btn del" title="Xóa" onclick="deleteCauHoi(${cauHoi.id})">🗑</div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

//tạo danh sách Văn bản
function createListQuyTrinh(danhSachQuyTrinh) {

    return danhSachQuyTrinh.map((quyTrinh, index) => {
        return `
            <option value="${quyTrinh.id}">${quyTrinh.so} -- ${quyTrinh.tenQuyTrinh}</option>
        `;
    }).join("");

}

//Đưa dữ liệu ra index
async function renderCauHoiPage(cauHoiList) {

    const cardRows = createCauHoiCards(cauHoiList);

    const quytrinhList = await fetchQuyTrinh();

    const quyTrinhSelect = createListQuyTrinh(quytrinhList);

    document.getElementById("mainContent").innerHTML = `
        <!-- QUESTIONS PAGE -->
        <div class="page" id="page-questions">
            <div class="section-header" style="margin-bottom:20px">
                <div>
                    <select id="quyTrinhSelect" class="form-input" style="background: white">
                        <option value="all">--Tất cả Văn bản--</option>
                        ${quyTrinhSelect}
                    </select>
                </div>
                <div style="display:flex;gap:10px;align-items:center;">
                    <button id="btnImportExcel" disabled class="btn btn-excel" onclick="openImportModal()">⬆ Nhập Excel</button>
                    <button id="btnAddQuestion" disabled class="btn btn-primary" onclick="openAddQuestionModal()">+ Thêm Câu Hỏi</button>
                </div>
            </div>

            <div class="filter-tabs">
                <button class="filter-tab active" data-type="all" onclick="setTabCauHoi(this)">Tất Cả</button>
                <button class="filter-tab" data-type="tracNghiem" onclick="setTabCauHoi(this)">Trắc Nghiệm</button>
                <button class="filter-tab" data-type="dat" onclick="setTabCauHoi(this)">Đạt/Không Đạt</button>
                <button class="filter-tab" data-type="dungSai" onclick="setTabCauHoi(this)">Đúng/Sai</button>
            </div>

            <div id="questionList">
                ${cardRows}
            </div>
        </div>
    `;

    initQuyTrinhSelect();
}

//Khởi tạo select search
function initQuyTrinhSelect() {

    $("#quyTrinhSelect").select2({
        placeholder: "Chọn Văn bản...",
        allowClear: false,
        width: "100%"
    });

    $("#quyTrinhSelect").on("change", function () {

        // Cập nhật trạng thái ban đầu
        updateAddQuestionButton();

        const id = $(this).val();
        const ten = $(this).find("option:selected").text();

        window.selectedQuyTrinh = { id, ten };

        // Filter dữ liệu
        filterCauHoiTheoQuyTrinh(id);

    });

}

//update trạng thái phải chọn Văn bản trước khi thêm câu hỏi
function updateAddQuestionButton() {

    const quyTrinhId = $("#quyTrinhSelect").val();
    const btn = document.getElementById("btnAddQuestion");

    const btnImport = document.getElementById("btnImportExcel");

    if (quyTrinhId === "all") {
        btn.disabled = true;
        btnImport.disabled = true;
    } else {
        btn.disabled = false;
        btnImport.disabled = false;
    }
}

//đồng bộ Văn bản tới modal
function syncQuyTrinhToModal() {

    const source = document.getElementById("quyTrinhSelect");

    document.getElementById("quyTrinhSelectAddCauHoi").value = source.options[source.selectedIndex].text;

    document.getElementById("quyTrinhSelectUpdateCauHoi").value = source.options[source.selectedIndex].text;

    document.getElementById("quyTrinhSelectImport").value = source.options[source.selectedIndex].text;

}

//mở modal và gọi các hàm đồng bộ
function openAddQuestionModal() {

    syncQuyTrinhToModal();

    openModal("addQuestionModal");
    changeLoaiCauHoi();
}

// đổ dữ liệu các loại câu hỏi
function changeLoaiCauHoi() {

    const loai = document.getElementById("loaiCauHoi").value;

    const rowCD = document.getElementById("rowCD");
    const dapAnDung = document.getElementById("dapAnDung");

    if (loai === "dat") {

        rowCD.style.display = "none";

        dapAnDung.innerHTML = `
            <option value=0>Đạt</option>
            <option value=1>Không đạt</option>
        `;

        document.getElementById("dapAnA").value = "Đạt";
        document.getElementById("dapAnB").value = "Không đạt";

        document.getElementById("dapAnA").disabled = true;
        document.getElementById("dapAnB").disabled = true;

        document.getElementById("dapAnC").required = false;
        document.getElementById("dapAnD").required = false;

    } else if (loai === "dungSai") {
        rowCD.style.display = "none";

        dapAnDung.innerHTML = `
            <option value=0>Đúng</option>
            <option value=1>Sai</option>
        `;

        document.getElementById("dapAnA").value = "Đúng";
        document.getElementById("dapAnB").value = "Sai";

        document.getElementById("dapAnA").disabled = true;
        document.getElementById("dapAnB").disabled = true;

        document.getElementById("dapAnC").required = false;
        document.getElementById("dapAnD").required = false;
    } else {

        dapAnDung.style.display = "";
        rowCD.style.display = "grid";

        document.getElementById("dapAnA").value = "";
        document.getElementById("dapAnB").value = "";

        document.getElementById("dapAnA").disabled = false;
        document.getElementById("dapAnB").disabled = false;

        document.getElementById("dapAnC").required = true;
        document.getElementById("dapAnD").required = true;

        dapAnDung.innerHTML = `
            <option value=0>A</option>
            <option value=1>B</option>
            <option value=2>C</option>
            <option value=3>D</option>
        `;
    }
}

//đổ dữ liệu các loại câu hỏi
function changeLoaiCauHoiUpdate() {

    const loai = document.getElementById("loaiCauHoiUpdate").value;

    const rowCD = document.getElementById("rowCDUpdate");
    const dapAnDung = document.getElementById("dapAnDungUpdate");

    if (loai === "dat") {

        document.getElementById('rowCDUpdate').style.display = "none";

        document.getElementById('dapAnDungUpdate').innerHTML = `
            <option value=0>Đạt</option>
            <option value=1>Không đạt</option>
        `;

        document.getElementById("dapAnAUpdate").value = "Đạt";
        document.getElementById("dapAnBUpdate").value = "Không đạt";

        document.getElementById("dapAnAUpdate").disabled = true;
        document.getElementById("dapAnBUpdate").disabled = true;

        document.getElementById("dapAnCUpdate").required = false;
        document.getElementById("dapAnDUpdate").required = false;

    } else if (loai === "dungSai") {
        document.getElementById('rowCDUpdate').style.display = "none";

        document.getElementById('dapAnDungUpdate').innerHTML = `
            <option value=0>Đúng</option>
            <option value=1>Sai</option>
        `;

        document.getElementById("dapAnAUpdate").value = "Đúng";
        document.getElementById("dapAnBUpdate").value = "Sai";

        document.getElementById("dapAnAUpdate").disabled = true;
        document.getElementById("dapAnBUpdate").disabled = true;

        document.getElementById("dapAnCUpdate").required = false;
        document.getElementById("dapAnDUpdate").required = false;
    } else {

        document.getElementById('rowCDUpdate').style.display = "grid";

        document.getElementById("dapAnAUpdate").disabled = false;
        document.getElementById("dapAnBUpdate").disabled = false;

        document.getElementById("dapAnCUpdate").required = true;
        document.getElementById("dapAnDUpdate").required = true;

        document.getElementById('dapAnDungUpdate').innerHTML = `
            <option value=0>A</option>
            <option value=1>B</option>
            <option value=2>C</option>
            <option value=3>D</option>
        `;
    }

}

//lọc dữ liệu câu hỏi
async function filterCauHoiTheoQuyTrinh(id) {

    window.listCH = window.currentCauHoiList;

    if (id !== 'all') {
        listCH = listCH.filter(item => item.quyTrinhGetId == id);
    }

    document.getElementById("questionList").innerHTML =
        createCauHoiCards(listCH);

}

//set du lieu theo tab
function setTabCauHoi(el) {

    el.closest('.filter-tabs').querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    const type = el.dataset.type;

    filterTabCauHoi(type);
}

//Lọc dữ liệu theo các tab
function filterTabCauHoi(type) {

    let list = window.listCH;

    if (!list) {
        list = window.currentCauHoiList;
    }

    if (type !== 'all') {
        list = list.filter(item => item.loaiCauHoi == type);
    }

    document.getElementById("questionList").innerHTML =
        createCauHoiCards(list);

}

//Thêm câu hỏi
async function addCauHoiForm() {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    const quyTrinhId = window.selectedQuyTrinh.id;
    const noiDung = document.getElementById('noiDungCauHoi').value.trim();

    const loaiCauHoi = document.getElementById('loaiCauHoi').value;

    const thuTu = window.listCH.length + 1;

    const trangThai = document.getElementById('trangThaiQ').value.trim();

    const dapAns = [
        { noiDung: document.getElementById('dapAnA').value.trim(), thuTu: 1 },
        { noiDung: document.getElementById('dapAnB').value.trim(), thuTu: 2 },
        { noiDung: document.getElementById('dapAnC').value.trim(), thuTu: 3 },
        { noiDung: document.getElementById('dapAnD').value.trim(), thuTu: 4 }
    ].filter(item => item.noiDung !== "");;

    const indexDapAnDung = parseInt(document.getElementById('dapAnDung').value);

    const body = {
        quyTrinhId,
        noiDung,
        loaiCauHoi,
        thuTu,
        dapAns,
        indexDapAnDung,
        trangThai
    };

    try {
        const response = await fetch('/api/cau-hoi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể tạo câu hỏi mới.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        window.currentCauHoiList = await fetchCauHoi();
        await filterCauHoiTheoQuyTrinh(document.getElementById('quyTrinhSelect').value);
        const type = document.querySelector('.filter-tab.active').dataset.type;
        await filterTabCauHoi(type);

        document.getElementById("sidebar-cauhoi").textContent = `${currentCauHoiList.length}`;

        showToast('success', 'Thành công!', `Tạo Câu Hỏi mới thành công!`);
        closeModal('addQuestionModal');
        clearAddQuestionForm();

    } catch (error) {
        console.error('Error creating câu hỏi:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

//ClearForm thêm câu hỏi
function clearAddQuestionForm() {
    document.getElementById('noiDungCauHoi').value = '';
    document.getElementById('loaiCauHoi').value = 'tracNghiem';
    document.getElementById('trangThai').value = '0';
    document.getElementById('dapAnA').value = '';
    document.getElementById('dapAnB').value = '';
    document.getElementById('dapAnC').value = '';
    document.getElementById('dapAnD').value = '';
    document.getElementById('dapAnDung').value = '0';
    document.getElementById('trangThai').value = '1';
}

//Mở modal chỉnh sửa câu hỏi
function openUpdateCauHoiModal(cauHoiId) {

    window.cauHoiUpdate = window.currentCauHoiList.find(ch => ch.id === cauHoiId);

    document.getElementById('quyTrinhSelectUpdateCauHoi').value = window.cauHoiUpdate.quyTrinhGetSo + ' -- ' + window.cauHoiUpdate.quyTrinhGetTen || '';

    document.getElementById('noiDungCauHoiUpdate').value = cauHoiUpdate.noiDung || '';
    document.getElementById('loaiCauHoiUpdate').value = cauHoiUpdate.loaiCauHoi || '';
    document.getElementById('trangThaiQUpdate').value = cauHoiUpdate.trangThai || '1';
    document.getElementById('dapAnAUpdate').value = cauHoiUpdate.dapAns[0]?.noiDung || '';
    document.getElementById('dapAnBUpdate').value = cauHoiUpdate.dapAns[1]?.noiDung || '';
    document.getElementById('dapAnCUpdate').value = cauHoiUpdate.dapAns[2]?.noiDung || '';
    document.getElementById('dapAnDUpdate').value = cauHoiUpdate.dapAns[3]?.noiDung || '';

    changeLoaiCauHoiUpdate();

    if (cauHoiUpdate.dapAnDung.id === cauHoiUpdate.dapAns[0]?.id) {
        document.getElementById('dapAnDungUpdate').value = '0';
    } else if (cauHoiUpdate.dapAnDung.id === cauHoiUpdate.dapAns[1]?.id) {
        document.getElementById('dapAnDungUpdate').value = '1';
    } else if (cauHoiUpdate.dapAnDung.id === cauHoiUpdate.dapAns[2]?.id) {
        document.getElementById('dapAnDungUpdate').value = '2';
    } else if (cauHoiUpdate.dapAnDung.id === cauHoiUpdate.dapAns[3]?.id) {
        document.getElementById('dapAnDungUpdate').value = '3';
    }

    openModal('updateQuestionModal');
}

//Cập nhật câu hỏi
async function updateCauHoi() {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    const cauHoiUpdateId = window.cauHoiUpdate.id;

    const noiDungCauHoiUpdate = document.getElementById('noiDungCauHoiUpdate').value.trim();
    const loaiCauHoiUpdate = document.getElementById('loaiCauHoiUpdate').value;

    const thuTuUpdate = window.cauHoiUpdate.thuTu;

    const trangThaiQUpdate = document.getElementById('trangThaiQUpdate').value;

    let dapAnsUpdate = [];

    if (loaiCauHoiUpdate === 'dat' || loaiCauHoiUpdate === 'dungSai') {
        dapAnsUpdate = [
            { id: window.cauHoiUpdate.dapAns[0]?.id, noiDung: document.getElementById('dapAnAUpdate').value.trim(), thuTu: 1 },
            { id: window.cauHoiUpdate.dapAns[1]?.id, noiDung: document.getElementById('dapAnBUpdate').value.trim(), thuTu: 2 }
        ].filter(item => item.noiDung !== "");
    } else {
        dapAnsUpdate = [
            { id: window.cauHoiUpdate.dapAns[0]?.id, noiDung: document.getElementById('dapAnAUpdate').value.trim(), thuTu: 1 },
            { id: window.cauHoiUpdate.dapAns[1]?.id, noiDung: document.getElementById('dapAnBUpdate').value.trim(), thuTu: 2 },
            { id: window.cauHoiUpdate.dapAns[2]?.id, noiDung: document.getElementById('dapAnCUpdate').value.trim(), thuTu: 3 },
            { id: window.cauHoiUpdate.dapAns[3]?.id, noiDung: document.getElementById('dapAnDUpdate').value.trim(), thuTu: 4 }
        ].filter(item => item.noiDung !== "");
    }

    const indexDapAnDung = parseInt(document.getElementById('dapAnDungUpdate').value);

    const body = {
        quyTrinhId: window.cauHoiUpdate.quyTrinhGetId,
        noiDung: noiDungCauHoiUpdate,
        loaiCauHoi: loaiCauHoiUpdate,
        thuTu: thuTuUpdate,
        dapAns: dapAnsUpdate,
        indexDapAnDung: indexDapAnDung,
        trangThai: trangThaiQUpdate
    };

    try {
        const response = await fetch(`/api/cau-hoi/${cauHoiUpdateId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể cập nhật câu hỏi.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        window.currentCauHoiList = await fetchCauHoi();
        await filterCauHoiTheoQuyTrinh(document.getElementById('quyTrinhSelect').value);
        const type = document.querySelector('.filter-tab.active').dataset.type;
        await filterTabCauHoi(type);

        showToast('success', 'Thành công!', `Cập nhật câu hỏi thành công!`);
        closeModal('updateQuestionModal');
        clearUpdateQuestionForm();

    } catch (error) {
        console.error('Error update câu hỏi:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

//ClearForm update câu hỏi
function clearUpdateQuestionForm() {
    document.getElementById('noiDungCauHoiUpdate').value = '';
    document.getElementById('loaiCauHoiUpdate').value = 'tracNghiem';
    document.getElementById('trangThaiQUpdate').value = '0';
    document.getElementById('dapAnAUpdate').value = '';
    document.getElementById('dapAnBUpdate').value = '';
    document.getElementById('dapAnCUpdate').value = '';
    document.getElementById('dapAnDUpdate').value = '';
    document.getElementById('dapAnDungUpdate').value = '0';
    document.getElementById('trangThaiQUpdate').value = '1';

}

let cauHoiDangSaoChep = null;

function saoChepCauHoi(cauHoiId) {

    const cauHoi = window.currentCauHoiList?.find(
        ch => ch.id === Number(cauHoiId)
    );

    if (!cauHoi) {

        showToast(
            'error',
            'Cảnh báo!',
            'Không tìm thấy câu hỏi cần sao chép.'
        );

        return;
    }

    // Lưu câu hỏi đang chuẩn bị sao chép
    cauHoiDangSaoChep = cauHoi;

    // Đổ dữ liệu vào modal
    document.getElementById('copyQuestionId').textContent =
        cauHoi.id;

    document.getElementById('copyQuestionContent').textContent =
        cauHoi.noiDung;

    // Hiển thị modal
    openModal('copyQuestionModal');

}

function closeCopyQuestionModal() {

    closeModal('copyQuestionModal');
    cauHoiDangSaoChep = null;
}

async function confirmSaoChepCauHoi() {
    if (!cauHoiDangSaoChep) {
        return;
    }

    const cauHoiId = cauHoiDangSaoChep.id;

    const token = localStorage.getItem('authToken');

    try {

        // Disable nút để tránh click nhiều lần
        const button = document.querySelector(
            '#copyQuestionModal .btn-primary'
        );

        if (button) {
            button.disabled = true;
            button.innerHTML = '⏳ Đang sao chép...';
        }

        const response = await fetch(
            `/api/cau-hoi/${cauHoiId}/sao-chep`,
            {
                method: 'POST',

                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            showToast(
                'error',
                'Cảnh báo!',
                data.message ||
                'Không thể sao chép câu hỏi.'
            );

            return;
        }

        // Đóng modal
        closeCopyQuestionModal();

        showToast(
            'success',
            'Thành công!',
            'Sao chép câu hỏi thành công!'
        );

        // Load lại danh sách
        window.currentCauHoiList = await fetchCauHoi();
        await filterCauHoiTheoQuyTrinh(document.getElementById('quyTrinhSelect').value);
        const type = document.querySelector('.filter-tab.active').dataset.type;
        await filterTabCauHoi(type);

    } catch (error) {

        console.error(
            '❌ Lỗi sao chép câu hỏi:',
            error
        );

        showToast(
            'error',
            'Cảnh báo!',
            'Có lỗi xảy ra khi sao chép câu hỏi.'
        );

    } finally {

        const button = document.querySelector(
            '#copyQuestionModal .btn-primary'
        );

        if (button) {
            button.disabled = false;
            button.innerHTML = '⧉ Sao chép câu hỏi';
        }
    }

}

//Xóa câu hỏi
async function deleteCauHoi(id) {
    // Get token from localStorage (prioritize separate token storage)
    let token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`/api/cau-hoi/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data.message || 'Không thể xóa câu hỏi.';
            showToast('error', 'Cảnh báo!', `${message}`);
            return;
        }

        showToast('success', 'Thành công!', `Xóa câu hỏi thành công!`);

        window.currentCauHoiList = await fetchCauHoi();
        await filterCauHoiTheoQuyTrinh(document.getElementById('quyTrinhSelect').value);
        const type = document.querySelector('.filter-tab.active').dataset.type;
        await filterTabCauHoi(type);

        document.getElementById("sidebar-cauhoi").textContent = `${currentCauHoiList.length}`;

    } catch (error) {
        console.error('Error update câu hỏi:', error);
        showToast('error', 'Cảnh báo!', `Lỗi khi gửi dữ liệu. Vui lòng thử lại!`);
    }
}

//Mở modal import excel
function openImportModal() {

    syncQuyTrinhToModal();

    openModal("importModal");
}

//Import Excel
async function importCauHoiExcel() {

    const token = localStorage.getItem("authToken");

    const fileInput =
        document.getElementById("excelFile");

    const quyTrinhId = window.selectedQuyTrinh.id;


    if (!fileInput.files.length) {

        showToast(
            "error",
            "Cảnh báo!",
            "Vui lòng chọn file Excel"
        );

        return;
    }


    if (!quyTrinhId) {

        showToast(
            "error",
            "Cảnh báo!",
            "Vui lòng chọn quy trình"
        );

        return;
    }


    const file = fileInput.files[0];


    const formData = new FormData();

    formData.append(
        "file",
        file
    );

    formData.append(
        "quyTrinhId",
        quyTrinhId
    );


    console.log("📤 Upload Excel:", {
        file: file.name,
        size: file.size,
        type: file.type,
        quyTrinhId
    });


    try {

        const response = await fetch(
            "/api/cau-hoi/import-excel",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                },

                body: formData
            }
        );


        const responseText =
            await response.text();


        let data;

        try {

            data = JSON.parse(responseText);

        } catch (error) {

            console.error(
                "❌ Server trả về:",
                responseText
            );

            throw new Error(
                responseText ||
                "Server trả về dữ liệu không hợp lệ"
            );
        }


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Import Excel thất bại"
            );
        }


        showToast(
            "success",
            "Thành công!",
            data.message ||
            "Import Excel thành công!"
        );


        // Đóng modal
        closeModal("importModal");


        // Load lại danh sách câu hỏi
        window.currentCauHoiList = await fetchCauHoi();
        await filterCauHoiTheoQuyTrinh(document.getElementById('quyTrinhSelect').value);
        const type = document.querySelector('.filter-tab.active').dataset.type;
        await filterTabCauHoi(type);


    } catch (error) {

        console.error(
            "❌ Import Excel Error:",
            error
        );

        showToast(
            "error",
            "Cảnh báo!",
            error.message
        );
    }
}