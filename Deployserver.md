# Hướng dẫn Deploy Server

Vào thư mục:

Bash


Cập nhật Database (đề phòng có sửa Prisma):

Bash

npx prisma migrate deploy
Khởi động lại Backend (để nhận code mới):

Bash

pm2 restart shopee-api --update-env
(Frontend không cần chạy lệnh gì cả, copy lên xong là F5 web thấy ngay).