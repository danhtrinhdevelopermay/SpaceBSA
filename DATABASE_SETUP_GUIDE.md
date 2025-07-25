# Hướng dẫn thiết lập Database dự phòng

## 🎯 Mục đích
Thiết lập hệ thống database dự phòng để đảm bảo:
- Tự động chuyển đổi khi database chính đầy (500MB)
- Không mất dữ liệu
- Không gián đoạn dịch vụ

## 📝 Các bước thiết lập

### 1. Tạo Database dự phòng
Bạn có thể tạo database từ các provider sau:

**Neon Database (Khuyến nghị):**
- Truy cập: https://neon.tech
- Tạo database mới
- Copy connection string

**Supabase:**
- Truy cập: https://supabase.com
- Tạo project mới
- Lấy PostgreSQL connection string

**Railway:**
- Truy cập: https://railway.app
- Tạo PostgreSQL database
- Copy connection URL

### 2. Cấu hình trong .env
Thêm các biến môi trường sau vào file `.env`:

```env
# Database dự phòng 1
DATABASE_URL_BACKUP1="postgresql://user:password@host:port/database"

# Database dự phòng 2 (tùy chọn)
DATABASE_URL_BACKUP2="postgresql://user:password@host:port/database"
```

### 3. Khởi động lại ứng dụng
```bash
npm run dev
```

## 🔄 Cách hoạt động

### Tự động chuyển đổi:
- **90% dung lượng**: Cảnh báo và chuẩn bị chuyển
- **95% dung lượng**: Tự động chuyển sang database dự phòng
- **Schema sync**: Tự động tạo bảng trong database mới

### Đảm bảo dữ liệu:
- **Đọc**: Tìm kiếm trong tất cả databases
- **Ghi**: Lưu vào database hiện tại (active)
- **Zero data loss**: Không mất dữ liệu cũ

### Giám sát:
- Health check mỗi 30 giây
- Cảnh báo khi database chậm
- Thống kê dung lượng realtime

## 📊 Kiểm tra trạng thái
Truy cập: `http://localhost:5000/system/database/monitor`

## ⚠️ Lưu ý quan trọng
1. **Backup thường xuyên**: Dù có hệ thống dự phòng, vẫn nên backup định kỳ
2. **Monitor dung lượng**: Theo dõi usage để kịp thời thêm database mới
3. **Test failover**: Thỉnh thoảng test chức năng chuyển đổi
4. **Security**: Đảm bảo connection string được bảo mật

## 🚀 Nâng cao
Để thêm nhiều database dự phòng hơn, chỉnh sửa `server/database-manager.ts`:
- Thêm database config mới
- Tăng priority number
- Cập nhật logic chuyển đổi