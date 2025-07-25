# Cloud Storage Application

Ứng dụng lưu trữ đám mây bảo mật với xác thực Firebase và cơ sở dữ liệu PostgreSQL.

## Thiết lập dự án

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Thiết lập biến môi trường
Sao chép file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Sau đó chỉnh sửa file `.env` với thông tin thực tế của bạn:

#### Cấu hình Database
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=database_name
```

#### Cấu hình Firebase
Để lấy thông tin Firebase:
1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào phần Project Settings > General > Your apps
4. Chọn hoặc tạo Web app
5. Copy các giá trị sau vào file `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

### 3. Thiết lập cơ sở dữ liệu
```bash
npm run db:push
```

### 4. Chạy ứng dụng
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5000`

## Tính năng

- ✅ Xác thực người dùng với Firebase
- ✅ Upload file với drag & drop
- ✅ Quản lý file cá nhân
- ✅ Xem trước file (hình ảnh)
- ✅ Chia sẻ file
- ✅ Giao diện responsive
- ✅ Bảo mật cao với access control

## Cấu trúc dự án

```
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Schema và types chung
├── uploads/         # Thư mục lưu file
├── .env            # Biến môi trường (không commit)
└── .env.example    # Template biến môi trường
```

## Lưu ý bảo mật

- File `.env` chứa thông tin nhạy cảm và đã được thêm vào `.gitignore`
- Không bao giờ commit file `.env` lên repository
- Sử dụng `.env.example` để chia sẻ template cấu hình