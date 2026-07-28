const pageMap = {
    dashboard: { title: 'Bảng Điều Khiển', sub: 'Tổng quan hệ thống' },
    qlqt: { title: 'Quản Lý Quy trình', sub: 'Quản lý / Quy trình' },
    questions: { title: 'Quản Lý Câu Hỏi', sub: 'Quản lý / Câu hỏi' },
    tests: { title: 'Quản Lý Bài Kiểm Tra', sub: 'Quản lý / Bài kiểm tra' },
    categories: { title: 'Danh Mục', sub: 'Quản lý / Danh mục' },
    results: { title: 'Kết Quả Thi', sub: 'Kết quả / Thống kê' },
    reports: { title: 'Báo Cáo', sub: 'Kết quả / Báo cáo' },
    users: { title: 'Người Dùng', sub: 'Hệ thống / Người dùng' },
    settings: { title: 'Cài Đặt', sub: 'Hệ thống / Cài đặt' },
};

function navigate(page, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    const info = pageMap[page];
    document.getElementById('pageTitle').textContent = info.title;
    document.getElementById('breadcrumb').textContent = info.sub;
    // sync mobile nav
    document.querySelectorAll('.mob-nav-item').forEach(m => m.classList.remove('active'));
    const mob = document.getElementById('mob-' + page);
    if (mob) mob.classList.add('active');
    if (window.innerWidth <= 768) closeSidebar();

    loadPage(page);
}

function mobileNav(page, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.mob-nav-item').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    const info = pageMap[page];
    document.getElementById('pageTitle').textContent = info.title;
    document.getElementById('breadcrumb').textContent = info.sub;
    // sync sidebar highlight
    document.querySelectorAll('.nav-item').forEach(n => {
        if (n.getAttribute('onclick') && n.getAttribute('onclick').includes("'" + page + "'")) {
            n.classList.add('active');
        }
    });
    // scroll content to top
    document.querySelector('.content').scrollTop = 0;
    window.scrollTo(0, 0);

    loadPage(page);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
}

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
    toast.classList.add('show');

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 6000);
        }
    }, duration);
}

document.addEventListener('DOMContentLoaded', function () {
    loadDashboardPage();
});

function loadPage(page) {
    switch (page) {
        case 'dashboard':
            loadDashboardPage();
            break;
        case 'qlqt':
            loadQLQTPage();
            break;
    }
}