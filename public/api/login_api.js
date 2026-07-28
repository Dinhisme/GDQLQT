// Toast Notification Function
function showToast(type, title, message, duration = 5000) {
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

    // Auto remove after duration
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// Form validation + simulated submit
var form = document.getElementById('login-form');
var submitBtn = document.getElementById('submit-btn');
var usernameField = document.getElementById('username');
var passwordField = document.getElementById('password');

function setError(input, message) {
    var field = input.closest('.field');
    var errorEl = field.querySelector('.field-error');
    if (message) {
        field.classList.add('has-error');
        errorEl.textContent = message;
    } else {
        field.classList.remove('has-error');
        errorEl.textContent = '';
    }
}

[usernameField, passwordField].forEach(function (input) {
    input.addEventListener('input', function () { setError(input, ''); });
});

form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var valid = true;
    var usernameVal = usernameField.value.trim();
    var passVal = passwordField.value;

    if (!usernameVal) { setError(usernameField, 'Vui lòng nhập username của bạn.'); valid = false; }
    else { setError(usernameField, ''); }

    if (!passVal) { setError(passwordField, 'Vui lòng nhập mật khẩu.'); valid = false; }
    else { setError(passwordField, ''); }

    if (!valid) return;

    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;
    var label = submitBtn.querySelector('.btn-label');

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameVal,
                password: passVal
            })
        });

        const data = await response.json();

        console.log('Response status:', response.status);
        console.log('Response data:', data);

        if (data.success) {
            const userData = data.user.hoTen || {};
            const token = data.token;

            // Store token
            localStorage.setItem('authToken', token);

            // Store user data
            localStorage.setItem('user', userData);

            showToast('success', 'Thành công!', `Chào mừng ${userData}!`);

            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            // Handle error response
            const errorMessage = data.message || data.error || 'Đăng nhập thất bại';

            showToast('error', 'Lỗi đăng nhập', errorMessage);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Đăng Nhập';
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showToast('error', 'Lỗi kết nối', error.message || 'Không thể kết nối tới máy chủ');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đăng Nhập';
    }
});