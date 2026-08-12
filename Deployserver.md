# Hướng dẫn deploy server

Stack hiện tại chạy bằng Docker Compose và Caddy. Không dùng các lệnh PM2 cũ
trong tài liệu trước đây.

Sau khi sync source và tạo hai file production `.env`, chạy từ thư mục repo:

```bash
./setup-azure.sh
```

Script sẽ kiểm tra cấu hình, build image, đồng bộ schema Prisma một lần rồi
khởi động các service. PostgreSQL phải được provision riêng và không chạy seed
destructive trên production.

Chi tiết biến môi trường và DNS xem [DEPLOYMENT.md](DEPLOYMENT.md).
