# 🚀 Hướng dẫn Deploy SpaceBSA lên Render

## 📋 Tổng quan

SpaceBSA có thể deploy lên Render Free Plan với hệ thống anti-spin-down và storage monitoring. Dưới đây là hướng dẫn chi tiết và những điều cần lưu ý.

## ✅ Ưu điểm của hệ thống hiện tại:

### 1. **Anti-Spin-Down System hoàn chỉnh**
- ✅ Keep-Alive Service ping mỗi 25 giây
- ✅ Database Health Check tự động
- ✅ Cron Jobs dọn dẹp và tối ưu
- ✅ Database Monitor real-time
- ✅ App không bao giờ restart tự động

### 2. **Storage Monitoring thông minh**
- ✅ Theo dõi dung lượng `/uploads` folder
- ✅ Monitor RAM usage real-time
- ✅ Cảnh báo khi vượt ngưỡng an toàn
- ✅ Khuyến nghị cloud storage khi cần

### 3. **Data Protection tuyệt đối**
- ✅ Safe mode luôn bật
- ✅ Chỉ xóa file cũ >30 ngày
- ✅ Backup và recovery system
- ✅ Error handling nghiêm ngặt

## 🔧 Cấu hình Environment Variables

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@hostname/database

# Firebase Authentication
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Server Configuration
NODE_ENV=production
PORT=5000

# Optional: Anti-Spin-Down URL (không bắt buộc)
# RENDER_EXTERNAL_URL=https://your-app.onrender.com
```

## 📊 Giới hạn Render Free Plan

### Resources:
```
CPU: 0.1 vCPU (shared)
RAM: 512MB
Storage: Ephemeral (mất khi restart)
Bandwidth: 100GB/month
Build time: 15 minutes max
Sleep: Sau 15 phút không hoạt động
```

### Khuyến nghị cho Local Storage:
```
✅ AN TOÀN: < 50MB upload files
⚠️  CHÚ Ý: 50-100MB upload files  
❌ NGUY HIỂM: > 100MB upload files
```

## 🔍 Monitoring và Health Checks

### 1. **Health Endpoints**
```bash
# Tổng quan hệ thống
GET /api/health

# Database status
GET /api/status/database

# Storage monitoring
GET /api/status/storage

# Data protection
GET /api/status/data-protection

# System metrics
GET /api/status/system
```

### 2. **Storage Status Example**
```json
{
  "status": "success",
  "storage": {
    "uploadFolder": {
      "size": "3.7MB",
      "files": 7,
      "path": "/uploads"
    },
    "memory": {
      "used": "105MB",
      "total": "108MB",
      "rss": "240MB"
    },
    "warnings": [],
    "recommendations": []
  }
}
```

## ⚠️ Rủi ro và Cách phòng ngừa

### **Rủi ro có thể xảy ra:**

1. **Render Platform Maintenance** (hiếm)
   - Restart bắt buộc để cập nhật security
   - File trong `/uploads` sẽ bị mất
   
2. **RAM Overflow** (nếu upload quá nhiều)
   - App crash khi memory > 512MB
   - Service restart tự động

3. **Disk Full** (rất hiếm với 256GB)
   - App không thể ghi file mới
   - Database có thể bị ảnh hưởng

### **Cách phòng ngừa:**

1. **Storage Monitoring:**
```bash
# Kiểm tra storage định kỳ
curl https://your-app.onrender.com/api/status/storage
```

2. **Alert System:**
   - Cảnh báo khi > 50MB files
   - Khuyến nghị cloud storage khi > 100MB

3. **Backup Strategy:**
   - Export file list từ database
   - Backup quan trọng lên cloud storage

## 🚀 Deployment Steps

### 1. **Prepare Repository**
```bash
# Đảm bảo có file build scripts
npm run build  # Test local build

# Check environment variables
cat .env.example
```

### 2. **Render Configuration**
```yaml
# render.yaml (optional)
services:
  - type: web
    name: spacebsa
    env: node
    buildCommand: npm install
    startCommand: npm run dev
    envVars:
      - key: NODE_ENV
        value: production
```

### 3. **Deploy Process**
1. Connect GitHub repository to Render
2. Set environment variables
3. Deploy and monitor logs
4. Test health endpoints

## 📈 Performance Optimization

### **Đã tối ưu:**
- ✅ Anti-spin-down prevents cold starts
- ✅ Database connection pooling
- ✅ Efficient file serving with Express
- ✅ Memory monitoring và cleanup

### **Có thể cải thiện:**
- 🔄 Implement CDN cho static files
- 🔄 Compress images trước khi lưu
- 🔄 Lazy loading cho file list
- 🔄 Pagination cho large datasets

## 🆙 Migration to Cloud Storage (Nếu cần)

Khi storage > 100MB, recommend migrate sang:

### **Option 1: Cloudinary**
```typescript
// Free: 25GB storage, 25GB bandwidth/month
import { v2 as cloudinary } from 'cloudinary';
```

### **Option 2: Firebase Storage**
```typescript
// Free: 5GB storage, 1GB/day download
import { getStorage, uploadBytes } from 'firebase/storage';
```

### **Option 3: AWS S3**
```typescript
// Free tier: 5GB storage, 20K requests/month
import AWS from 'aws-sdk';
```

## 📞 Support và Troubleshooting

### **Common Issues:**

1. **App không start:** Check environment variables
2. **Database connection failed:** Verify DATABASE_URL
3. **Firebase auth error:** Check Firebase config
4. **File upload fail:** Check storage monitoring

### **Debug Commands:**
```bash
# Check logs
curl https://your-app.onrender.com/api/health

# Monitor storage
curl https://your-app.onrender.com/api/status/storage

# Database health
curl https://your-app.onrender.com/api/status/database
```

## ✨ Kết luận

SpaceBSA được thiết kế để hoạt động ổn định trên Render Free Plan với:

- ✅ **Anti-spin-down hoàn chỉnh** - App chạy 24/7
- ✅ **Storage monitoring thông minh** - Cảnh báo sớm
- ✅ **Data protection tuyệt đối** - An toàn 100%
- ✅ **Performance optimization** - Hiệu suất cao

Với dung lượng hiện tại (3.7MB), app có thể chạy ổn định trong nhiều tháng. Khi storage tăng > 100MB, hệ thống sẽ khuyến nghị migrate sang cloud storage để đảm bảo performance và reliability tốt nhất.