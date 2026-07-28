# GDQLQT Node.js Project

## Cấu trúc
- app.js: entry point
- routes/: định tuyến web và api
- controllers/: xử lý request
- services/: gọi API Spring Boot
- public/: file tĩnh và JS frontend

## Môi trường
Sử dụng file .env:

PORT=3000
SPRING_BOOT_API_URL=http://172.16.1.66:9000/api

## Chạy
npm install
npm start
