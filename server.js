require('dotenv').config();
const { error } = require('console');
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const originalName = path.basename(file.originalname);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    cb(null, `${Date.now()}-${safeBaseName}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

const javaBackendUrl = process.env.API_URL;
const javaAdminBackendUrl = process.env.ADMIN_API_URL;
const loginBackendUrl = process.env.LOGIN_API_URL;

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// API đăng nhập - Forward to Java Backend
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const loginEndpoint = `${loginBackendUrl}/auth/login`;

    const fetchResponse = await fetch(loginEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const responseText = await fetchResponse.text();

    let data = {};
    try {
      if (responseText) {
        data = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Response text:", responseText);
    }

    if (!fetchResponse.ok) {
      console.error(`❌ Java Backend error: ${fetchResponse.status}`);
      return res.status(fetchResponse.status).json({
        success: false,
        message: fetchResponse.status === 401 ? 'Tên đăng nhập hoặc mật khẩu không chính xác' : 'Đăng nhập thất bại',
        error: data.error || data.message
      });
    }

    const userData = {
      role: data.role,
      hoTen: data.hoTen
    };

    return res.json({
      success: true,
      message: "Đăng nhập thành công",
      user: userData,
      token: data.token || null
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi kết nối tới máy chủ xác thực',
      error: error.message
    });
  }
});

//API Trang chủ
app.get("/admin", async (req, res) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const resAPI = await fetch(`${javaAdminBackendUrl}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        'Authorization': authHeader
      }
    });

    if (!resAPI.ok) {
      console.error(`❌ Java Backend error: ${resAPI.status}`);
      return res.status(resAPI.status).json({
        success: false,
        message: resAPI.message,
        error: await resAPI.text()
      });
    }

    const javaResponse = await resAPI.json();

    return res.json({
      success: true,
      message: "Lấy danh dữ liệu trang chủ thành công!",
      data: javaResponse,
    });

  } catch (e) {
    console.error("❌ NodeJS Error:", e);
    return res.status(500).json({
      success: false,
      message: 'Lỗi NodeJS: ' + e.message
    });
  }
});

// API xác thực token - Verify token with Java Backend
app.get("/api/verify-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    // Forward token verification to Java Backend
    const verifyEndpoint = `${javaAdminBackendUrl}`; // Use any protected endpoint to verify token
    const verifyResponse = await fetch(verifyEndpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      }
    });

    if (!verifyResponse.ok) {
      console.error(`❌ Token verification failed: ${verifyResponse.status}`);
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    // Token is valid
    console.log('✅ Token xác thực thành công');
    return res.json({
      success: true,
      message: 'Token hợp lệ'
    });

  } catch (error) {
    console.error("❌ Token verification error:", error);
    return res.status(401).json({
      success: false,
      message: 'Không thể xác thực token',
      error: error.message
    });
  }
});

//API Quản lý văn bản
app.get("/api/quy-trinh", async (req, res) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const resAPI = await fetch(`${javaBackendUrl}/quy-trinh`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        'Authorization': authHeader
      }
    });

    if (!resAPI.ok) {
      console.error(`❌ Java Backend error: ${resAPI.status}`);
      return res.status(resAPI.status).json({
        success: false,
        message: resAPI.message,
        error: await resAPI.text()
      });
    }

    const javaResponse = await resAPI.json();

    const dataList = Array.isArray(javaResponse) ? javaResponse :
      (javaResponse.data && Array.isArray(javaResponse.data)) ? javaResponse.data :
        [];

    // console.log(`✅ Lấy danh sách góp ý thành công: ${dataList.length} items`);
    return res.json({
      success: true,
      message: "Lấy danh sách văn bản thành công!",
      data: dataList,
      total: dataList.length
    });

  } catch (e) {
    console.error("❌ NodeJS Error:", e);
    return res.status(500).json({
      success: false,
      message: 'Lỗi NodeJS: ' + e.message
    });
  }
});

app.post("/api/quy-trinh", upload.single('file'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const { so, tenQuyTrinh, ngayBanHanh, loaiQuyTrinh, phamVi, viTriLuu, trangThai } = req.body;
    const duongDan = req.file ? `/uploads/${req.file.filename}` : (req.body.duongDan || '');

    const formattedBody = {
      so,
      tenQuyTrinh,
      ngayBanHanh,
      loaiQuyTrinh,
      phamVi,
      viTriLuu,
      duongDan,
      trangThai
    };

    console.log('📤 Gửi đến Java Backend:', formattedBody);
    if (req.file) {
      console.log('📂 File đã lưu:', req.file.filename);
    }

    const resAPI = await fetch(`${javaBackendUrl}/quy-trinh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': authHeader
      },
      body: JSON.stringify(formattedBody)
    });

    const javaResponse = await resAPI.json();

    if (!resAPI.ok) {
      return res.status(resAPI.status).json({
        success: false,
        message: resAPI.message,
        error: javaResponse
      });
    }

    return res.json({
      success: true,
      message: "Tạo văn bản thành công!",
      data: javaResponse
    });

  } catch (e) {
    console.error("❌ NodeJS Error:", e);
    return res.status(500).json({
      success: false,
      message: 'Lỗi NodeJS: ' + e.message
    });
  }
});

app.put("/api/quy-trinh", upload.single('file'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const { id, so, tenQuyTrinh, ngayBanHanh, loaiQuyTrinh, phamVi, viTriLuu, trangThai } = req.body;
    const duongDan = req.file ? `/uploads/${req.file.filename}` : (req.body.duongDan || '');

    const formattedBody = {
      id,
      so,
      tenQuyTrinh,
      ngayBanHanh,
      loaiQuyTrinh,
      phamVi,
      viTriLuu,
      duongDan,
      trangThai
    };

    console.log('📤 Gửi đến Java Backend:', formattedBody);
    if (req.file) {
      console.log('📂 File đã lưu:', req.file.filename);
    }

    const resAPI = await fetch(`${javaBackendUrl}/quy-trinh/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        'Authorization': authHeader
      },
      body: JSON.stringify(formattedBody)
    });

    const javaResponse = await resAPI.json();

    if (!resAPI.ok) {
      return res.status(resAPI.status).json({
        success: false,
        message: resAPI.message,
        error: javaResponse
      });
    }

    return res.json({
      success: true,
      message: "Cập nhật văn bản thành công!",
      data: javaResponse
    });

  } catch (e) {
    console.error("❌ NodeJS Error:", e);
    return res.status(500).json({
      success: false,
      message: 'Lỗi NodeJS: ' + e.message
    });
  }
});

app.delete("/api/quy-trinh/:id", async (req, res) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }

    const { id } = req.params;

    const resAPI = await fetch(`${javaBackendUrl}/quy-trinh/${id}`, {
      method: "DELETE",
      headers: {
        'Authorization': authHeader
      },
    });

    if (!resAPI.ok) {
      const errorText = await resAPI.text();

      return res.status(resAPI.status).json({
        success: false,
        message: errorText || "Không thể xóa văn bản"
      });
    }

    return res.json({
      success: true,
      message: "Xóa văn bản thành công!"
    });

  } catch (e) {
    console.error("❌ NodeJS Error:", e);
    return res.status(500).json({
      success: false,
      message: 'Lỗi NodeJS: ' + e.message
    });
  }
});

// API Quản lý câu hỏi

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
});