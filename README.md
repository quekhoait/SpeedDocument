# SpeedDocument

> Nền tảng hỗ trợ tạo, quản lý, chuyển đổi và ký tài liệu nhanh chóng bằng ứng dụng di động, API backend và trang quản trị.

[![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](./backend)
[![Mobile](https://img.shields.io/badge/mobile-Expo%20%2B%20React%20Native-000020?logo=expo&logoColor=white)](./AppDocument)
[![Admin](https://img.shields.io/badge/admin-React%20%2B%20Vite-646CFF?logo=vite&logoColor=white)](./speeddocument-admin)

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Ảnh hệ thống](#ảnh-hệ-thống)
- [Kiến trúc](#kiến-trúc)
- [Yêu cầu](#yêu-cầu)
- [Cài đặt](#cài-đặt)
- [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
- [Chạy dự án](#chạy-dự-án)
- [Chạy bằng Docker](#chạy-bằng-docker)
- [Kiểm thử](#kiểm-thử)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)

## Giới thiệu

SpeedDocument là hệ thống quản lý tài liệu gồm ba phần chính:

- **Ứng dụng di động:** người dùng đăng ký, đăng nhập, tạo tài liệu, dùng mẫu, chuyển giọng nói thành văn bản và ký tài liệu.
- **Backend API:** xác thực, quản lý người dùng, tài liệu, mẫu tài liệu, chữ ký và các dịch vụ AI.
- **Trang quản trị:** quản lý và theo dõi người dùng, tài liệu, mẫu và số liệu hệ thống.

## Tính năng

- Đăng ký, đăng nhập bằng email và Google OAuth.
- Quản lý hồ sơ và chữ ký cá nhân.
- Tạo tài liệu từ mẫu có sẵn.
- Tải lên, xem trước, cập nhật và ký tài liệu.
- Chuyển giọng nói thành văn bản.
- Tích hợp dịch vụ AI để hỗ trợ xử lý tài liệu.
- Lưu trữ tệp qua Cloudinary.
- Trang quản trị dành cho quản lý người dùng, mẫu và thống kê.

### Sơ đồ hệ thống

![Sơ đồ hệ thống](/KienTruc.png)

## Yêu cầu

- Node.js 20 trở lên.
- npm 10 trở lên.
- PostgreSQL đang chạy tại cổng `5433` theo cấu hình hiện tại của backend.
- Redis nếu sử dụng các chức năng cần cache hoặc hàng đợi.
- Tài khoản Cloudinary, Google OAuth và nhà cung cấp AI nếu sử dụng các chức năng tương ứng.
- Android Studio và Android SDK nếu chạy ứng dụng Android native.
- Expo CLI được cài thông qua lệnh `npx` khi phát triển ứng dụng mobile.

## Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/quekhoait/SpeedDocument.git
cd SpeedDocument
```

### 2. Cài dependencies cho backend

```bash
cd backend
npm install
```

### 3. Cài dependencies cho ứng dụng mobile

Mở terminal mới tại thư mục gốc:

```bash
cd AppDocument
npm install
```

### 4. Cài dependencies cho trang quản trị

Mở terminal mới tại thư mục gốc:

```bash
cd speeddocument-admin
npm install
```

## Cấu hình biến môi trường



### Backend: `backend/.env`

Tạo file `backend/.env`:

```env
NODE_ENV=development
PORT=5000

ACCESS_TOKEN=your_access_token_secret
REFRESH_TOKEN=your_refresh_token_secret

GEMINI_API_KEY=your_gemini_api_key
MODEL_AI=your_ai_model

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
FRONTEND_URL
EMAIL_HOST_USER
EMAIL_HOST_PASSWORD
REDIS_URL

Database: document
User: postgres
Port: 5433
Host: localhost


### Ứng dụng mobile: `AppDocument/.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

Khi chạy trên Android Emulator, có thể cần dùng:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
```

Khi chạy trên điện thoại thật, thay `localhost` bằng địa chỉ IP LAN của máy đang chạy backend.

### Trang quản trị: `speeddocument-admin/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

## Chạy dự án

### Chạy backend API

```bash
cd backend
npm run dev
```

API mặc định chạy tại `http://localhost:5000`.

### Chạy trang quản trị

```bash
cd speeddocument-admin
npm run dev
```

Vite sẽ hiển thị địa chỉ truy cập trong terminal, thường là `http://localhost:5173`.

### Chạy ứng dụng mobile

```bash
cd AppDocument
npm start
```

Sau đó chọn thiết bị hoặc nền tảng cần chạy trong Expo CLI.

Một số lệnh khác:

```bash
npm run android
npm run ios
npm run web
```

## Chạy bằng Docker

Docker Compose hiện hỗ trợ khởi chạy backend và trang quản trị:

```bash
# Tạo backend/.env trước khi chạy
 docker compose up --build
```

Sau khi khởi chạy:

- Backend: `http://localhost:5000`
- Trang quản trị: `http://localhost:3000`

Dừng các container:

```bash
docker compose down
```

> PostgreSQL và Redis cần được chuẩn bị riêng nếu chúng chưa có sẵn trong môi trường chạy Docker. Kiểm tra lại host, port và credentials trước khi khởi động production.

## Kiểm thử

Chạy test backend:

```bash
cd backend
npm test
```

Tạo báo cáo coverage:

```bash
npm run test:coverage
```

Kiểm tra build và lint trang quản trị:

```bash
cd speeddocument-admin
npm run lint
npm run build
```

## Cấu trúc thư mục

```text
SpeedDocument/
├── AppDocument/            # Ứng dụng Expo / React Native
├── backend/                # Backend Node.js / Express và test
├── speeddocument-admin/    # Trang quản trị React / Vite
├── docker-compose.yml      # Cấu hình chạy backend và admin bằng Docker
└── README.md               # Tài liệu dự án
```

## Đóng góp

1. Tạo fork từ repository.
2. Tạo branch mới cho thay đổi của bạn.
3. Commit thay đổi với nội dung rõ ràng.
4. Mở Pull Request và mô tả cách kiểm thử.

## Giấy phép

Dự án sử dụng giấy phép được khai báo trong từng package của repository.
