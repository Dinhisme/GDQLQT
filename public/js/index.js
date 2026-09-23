const pageMap = {
    dashboard: { title: 'Bảng Điều Khiển', sub: 'Tổng quan hệ thống' },
    tracuu: { title: 'Tra Cứu Văn Bản', sub: 'Tra Cứu Nhanh Chóng Văn Bản' },
    qlqt: { title: 'Quản Lý Quy trình', sub: 'Quản lý / Quy trình' },
    qlch: { title: 'Quản Lý Câu Hỏi', sub: 'Quản lý / Câu hỏi' },
    qlbktr: { title: 'Quản Lý Bài Kiểm Tra', sub: 'Quản lý / Bài kiểm tra' },
    qlkqthi: { title: 'Kết Quả Thi', sub: 'Kết quả / Thống kê' },
    reports: { title: 'Báo Cáo', sub: 'Kết quả / Báo cáo' },
    qlnd: { title: 'Người Dùng', sub: 'Hệ thống / Người dùng' },
    qlkp: { title: 'Khoa / Phòng / TT', sub: 'Hệ thống / Khoa / Phòng / TT' },
    settings: { title: 'Cài Đặt', sub: 'Hệ thống / Cài đặt' },
};

function navigate(page, el) {

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    if (el.classList == 'search-box' || el.classList == 'search-box active') {
        document.getElementById('searchNav').classList.add('active');
    }

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

    loadPage(page);

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
            localStorage.removeItem('role');
            localStorage.removeItem('userDepartment');
            window.location.href = '/login';
            return false;
        }

        // console.log('✅ User authenticated with valid server token', data);

        localStorage.setItem('user', data.user.hoTen);
        localStorage.setItem('role', data.user.role);
        localStorage.setItem('userDepartment', data.user.khoaPhong);

        return true;

    } catch (error) {
        console.error('❌ Token verification error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('userDepartment');
        window.location.href = '/login';
        return false;
    }
}

// Run authentication check when page loads and wait for result
(async function () {
    const isAuthenticated = await checkAuthentication();

    console.log('Authentication check result:', isAuthenticated);

    const userLogin = localStorage.getItem('user');
    const userLoginDepartment = localStorage.getItem('userDepartment');
    const userRole = localStorage.getItem('role');

    document.getElementById('user-name').textContent = userLoginDepartment;
    document.getElementById('user-name2').textContent = userLogin;

    document.getElementById('user-role').textContent = 'Người dùng';

    if (userRole === 'ADMIN') {
        document.getElementById('isADMIN').classList.remove('d-none');
        document.querySelectorAll('.isADMINMobile').forEach(el => el.classList.remove('d-none'));
        document.getElementById('user-role').textContent = 'Quản trị viên';
    }

    const requestedPage = new URLSearchParams(window.location.search).get('page');
    if (requestedPage && pageMap[requestedPage]) {
        const navItem = [...document.querySelectorAll('.nav-item')].find(item =>
            item.getAttribute('onclick')?.includes(`'${requestedPage}'`)
        );
        navigate(requestedPage, navItem || document.body);
        return;
    }

    loadDashboardPage();

    if (!isAuthenticated) {
        // Stop execution if not authenticated
        throw new Error('Unauthorized access');
    }
})();

function loadPage(page) {
    switch (page) {
        case 'dashboard':
            loadDashboardPage();
            break;
        case 'tracuu':
            loadTimKiemPage();
            break;
        case 'qlqt':
            loadQLQTPage();
            break;
        case 'qlch':
            loadQLCHPage();
            break;
        case 'qlbktr':
            loadQLBKTPage();
            break;
        case 'qlkqthi':
            loadQLKQPage();
            break;
        case 'qlnd':
            loadQLNDPage();
            break;
        case 'qlkp':
            loadQLKPPage();
            break;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
    localStorage.removeItem('userDepartment');
    window.location.href = '/login';
}