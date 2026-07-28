// FILE UPLOAD HANDLER
const fileInput = document.getElementById('fileInput');
const fileUploadArea = document.querySelector('.file-upload-area');
const fileInfo = document.getElementById('fileInfo');

const fileInputUpdate = document.getElementById('fileInputUpdate');
const fileUploadAreaUpdate = document.querySelector('.file-upload-areaUpdate');
const fileInfoUpdate = document.getElementById('fileInfoUpdate');

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        updateFileDisplay(file);
    }
});

fileInputUpdate.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        updateFileDisplayUpdate(file);
    }
});

// Drag and drop support
fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.style.background = 'rgba(59, 130, 246, 0.08)';
    fileUploadArea.style.borderColor = '#2563eb';
});

fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.style.background = '';
    fileUploadArea.style.borderColor = '';
});

fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.style.background = '';
    fileUploadArea.style.borderColor = '';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        updateFileDisplay(files[0]);
    }
});

// Drag and drop update support
fileUploadAreaUpdate.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadAreaUpdate.style.background = 'rgba(59, 130, 246, 0.08)';
    fileUploadAreaUpdate.style.borderColor = '#2563eb';
});

fileUploadAreaUpdate.addEventListener('dragleave', () => {
    fileUploadAreaUpdate.style.background = '';
    fileUploadAreaUpdate.style.borderColor = '';
});

fileUploadAreaUpdate.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadAreaUpdate.style.background = '';
    fileUploadAreaUpdate.style.borderColor = '';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        updateFileDisplay(files[0]);
    }
});

function updateFileDisplay(file) {
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = 'Kích thước: ' + formatFileSize(file.size);
    fileInfo.style.display = 'block';
    fileUploadArea.style.display = 'none';
}

function updateFileDisplayUpdate(file) {
    document.getElementById('fileNameUpdate').textContent = file.name;
    document.getElementById('fileSizeUpdate').textContent = 'Kích thước: ' + formatFileSize(file.size);
    fileInfoUpdate.style.display = 'block';
    fileUploadAreaUpdate.style.display = 'none';
}

function clearFileUpload() {
    fileInput.value = '';
    fileInfo.style.display = 'none';
    fileUploadArea.style.display = 'block';
}

function clearFileUploadUpdate() {
    fileInputUpdate.value = '';
    fileInfoUpdate.style.display = 'none';
    fileUploadAreaUpdate.style.display = 'block';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function openModal(id) {
    document.getElementById(id).classList.add('open');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

function setTab(el) {

    el.closest('.filter-tabs').querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active')); 
    el.classList.add('active');

    const type = el.dataset.type;

    filterQuyTrinh(type);
}

