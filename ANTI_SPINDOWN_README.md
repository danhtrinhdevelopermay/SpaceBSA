# 🚀 SpaceBSA Anti-Spin-Down & Database Maintenance System

Hệ thống toàn diện để đảm bảo ứng dụng SpaceBSA và database PostgreSQL luôn hoạt động liên tục, không bao giờ bị tắt và tối ưu hóa hiệu suất.

## 🎯 Mục tiêu chính

- **Chống Spin-Down**: Ngăn chặn server bị tắt do không hoạt động trên các nền tảng cloud như Render
- **Database Always-On**: Đảm bảo database PostgreSQL luôn kết nối và hoạt động
- **Tự động dọn dẹp**: Tự động xóa dữ liệu cũ để tránh database đầy
- **Monitoring**: Theo dõi hiệu suất và sức khỏe hệ thống 24/7
- **Tối ưu hóa**: Tự động tối ưu database để duy trì hiệu suất cao

## 🏗️ Kiến trúc hệ thống

### 1. Keep-Alive Service (`server/keepalive.ts`)

**Chức năng chính:**
- **Self-Ping**: Tự động ping server mỗi 25 giây để tránh sleep timeout
- **Database Health Check**: Kiểm tra kết nối database mỗi phút
- **Detailed Monitoring**: Theo dõi kích thước database và số lượng bảng
- **Auto Recovery**: Tự động khôi phục khi có lỗi kết nối

**Cấu hình:**
```typescript
selfPingInterval: 25000ms // 25 giây - nhanh hơn timeout của Render (30s)
dbHealthCheckInterval: 60000ms // 1 phút
enableLogging: true // Chi tiết logging trong development
```

### 2. Cron Job Service (`server/cron-job.ts`)

**Chức năng chính:**
- **Trash Cleanup**: Xóa file rác mỗi giờ để tránh đầy storage
- **Database Optimization**: Tối ưu database mỗi 24 giờ
- **VACUUM & ANALYZE**: Tự động dọn dẹp và phân tích database
- **Statistics Update**: Cập nhật thống kê để tối ưu query performance

**Cấu hình:**
```typescript
trashCleanupInterval: 3600000ms // 1 giờ
databaseOptimizeInterval: 86400000ms // 24 giờ
```

### 3. Database Monitor (`server/database-monitor.ts`)

**Chức năng chính:**
- **Real-time Metrics**: Thu thập metrics database theo thời gian thực
- **Performance Tracking**: Theo dõi thời gian phản hồi query
- **Connection Monitoring**: Giám sát số kết nối active
- **Alert System**: Cảnh báo khi hiệu suất giảm

**Metrics theo dõi:**
- Database size (MB)
- Active connections
- Average response time
- Table statistics
- Long-running queries
- Lock detection

## 🔧 Cấu hình Environment Variables

Để hệ thống hoạt động tối ưu trên production, cần thiết lập các biến môi trường:

```bash
# Self-ping configuration (cho production)
SERVER_URL=https://yourapp.onrender.com
RENDER_EXTERNAL_URL=https://yourapp.onrender.com

# Monitoring intervals
SELF_PING_INTERVAL=25000
DB_HEALTH_CHECK_INTERVAL=60000
DB_MONITOR_INTERVAL=30000

# Maintenance intervals  
TRASH_CLEANUP_INTERVAL=3600000
DB_OPTIMIZE_INTERVAL=86400000

# Performance thresholds
DB_PERFORMANCE_THRESHOLD=1000
DB_POOL_SIZE=10
```

## 📊 API Endpoints

### Health Check
```
GET /api/health
```
Trả về trạng thái tổng quan của tất cả services:
- Keep-alive status
- Cron job status  
- Database metrics
- System information

### Database Status
```
GET /api/status/database
```
Thông tin chi tiết về database:
- Database size
- Connection count
- Performance metrics
- Table statistics

### System Status
```
GET /api/status/system
```
Thông tin hệ thống:
- Memory usage
- CPU usage
- Uptime
- Service status

## 🚀 Triển khai Production

### 1. Render.com Configuration

**Environment Variables:**
```
SERVER_URL=https://spacbsa.onrender.com
NODE_ENV=production
SELF_PING_INTERVAL=25000
DB_HEALTH_CHECK_INTERVAL=60000
```

**Build Settings:**
- Build Command: `npm run build`
- Start Command: `npm start`

### 2. Database Optimization

Hệ thống tự động thực hiện các tác vụ tối ưu:

**Hàng giờ:**
- Xóa file trash cũ (>3 ngày)
- Xóa shared files hết hạn
- Cleanup session cũ

**Hàng ngày:**
- VACUUM database để reclaim storage
- ANALYZE tables để update statistics
- Cleanup orphaned records
- Performance monitoring

### 3. Monitoring & Alerting

**Console Logs:**
```
[KeepAlive] Self-ping successful: Status 200
[KeepAlive] Database health check successful
[KeepAlive] Database stats - Size: 15MB, Tables: 6
[CronJobs] Trash cleanup completed
[DatabaseMonitor] Health check completed in 45ms
```

**Warning Alerts:**
```
[KeepAlive] WARNING: Database size is 512MB - consider cleanup
[DatabaseMonitor] WARNING: Slow database response (1500ms)
[DatabaseMonitor] Found 2 long-running queries
```

## 🔄 Self-Ping Mechanism

Dựa trên [bài viết của Harsh Git](https://dev.to/harshgit98/solution-for-rendercom-web-services-spin-down-due-to-inactivity-2h8i), nhưng được nâng cấp:

### Cải tiến so với bài gốc:

1. **Smarter Intervals**: 25s thay vì 30s để chắc chắn không timeout
2. **Database Integration**: Kết hợp ping với health check database
3. **Error Handling**: Xử lý lỗi và retry logic
4. **Production Ready**: Chỉ hoạt động khi có SERVER_URL
5. **Comprehensive Logging**: Detailed logs cho debugging

### Code Implementation:

```typescript
// Self-ping every 25 seconds to prevent spin-down
setInterval(async () => {
  try {
    const response = await fetch(`${serverUrl}/api/health`);
    console.log(`Self-ping successful: Status ${response.status}`);
  } catch (error) {
    console.error('Self-ping failed:', error.message);
  }
}, 25000);
```

## 📈 Performance Optimizations

### 1. Database Connection Pooling
- Connection pool size: 10 connections
- Automatic connection health checks
- Connection retry logic

### 2. Query Optimization
- Automatic ANALYZE for query planner
- Index monitoring
- Slow query detection

### 3. Storage Management
- Automatic file cleanup
- Database vacuum operations
- Orphaned record removal

## 🛡️ Security Features

### 1. Rate Limiting
- Health endpoints có built-in rate limiting
- Self-ping sử dụng User-Agent riêng

### 2. Error Handling
- Graceful error recovery
- No sensitive data trong logs
- Automatic retry mechanisms

### 3. Production Safety
- Logging level tự động adjust theo environment
- Development features disabled trong production

## 📋 Maintenance Tasks

### Tự động (không cần can thiệp):
- ✅ Xóa file trash cũ
- ✅ Cleanup shared files hết hạn  
- ✅ Database vacuum và analyze
- ✅ Health monitoring
- ✅ Self-ping để chống spin-down

### Thủ công (khi cần):
- Database backup
- Log rotation
- Security updates

## 🔍 Troubleshooting

### 1. Server vẫn bị spin-down
**Kiểm tra:**
- SERVER_URL có được set chính xác?
- Health endpoint có hoạt động? (`GET /api/health`)
- Logs có show self-ping thành công?

### 2. Database connection issues
**Kiểm tra:**
- DATABASE_URL có chính xác?
- Database monitor có hoạt động?
- Connection pool có đầy?

### 3. Performance issues
**Kiểm tra:**
- Database size qua lớn?
- Có slow queries không?
- Memory usage cao?

## 🎉 Kết quả mong đợi

Với hệ thống này, SpaceBSA sẽ:

- ✅ **Không bao giờ bị spin-down** trên Render
- ✅ **Database luôn online** và responsive
- ✅ **Tự động dọn dẹp** để tránh đầy storage
- ✅ **Performance ổn định** với automatic optimization
- ✅ **Monitoring 24/7** với detailed metrics
- ✅ **Production-ready** với proper error handling

Hệ thống này đảm bảo SpaceBSA có thể chạy liên tục trong tương lai mà không cần can thiệp thủ công!