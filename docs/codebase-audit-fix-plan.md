# Kế hoạch audit và sửa lỗi toàn bộ 4 ứng dụng – Thai Spray Shop

> **Trạng thái:** bản đề xuất để review. Tài liệu này chưa sửa code; PR chỉ thêm tài liệu.
> **Ngày:** 2026-10-13 · **Nhánh:** `docs/codebase-audit-fix-plan` · **Phạm vi:** `user_ecommere/{backend,frontend}`, `admin_ecommere/{backend,frontend}`.
> **Danh mục đầy đủ:** `docs/codebase-audit-findings.md` (từng finding, mức độ sau đối chiếu, lý do bác bỏ hoặc hạ mức).

## 1. Tóm tắt

- 10 agent audit chỉ đọc (agy, `gemini-3.8-flash-high`) quét khoảng 50 nghìn dòng mã. Claude đối chiếu lại từng finding High và các finding có vẻ bị đánh giá quá mức, bằng cách đọc đúng dòng mã được dẫn.
- Sau gộp trùng, còn **5 lỗi High duy nhất**, tập trung ở ba chỗ: hủy đơn đã thanh toán, thanh toán cho đơn đã hủy (tiềm ẩn), và luồng xác nhận của chatbot (resume dùng sai giỏ, thao tác ghi bị thực thi lại).
- Có **nhiều finding bị hạ mức hoặc bác bỏ**. Agent đánh giá quá mức phần lớn các High ở frontend (refresh token, cache, double submit) và một số ở backend (lộ thông tin lỗi, lỗi cookie CSRF). Lý do chính: backend có grace period 30 giây khi refresh, có mutex refresh sẵn, hoặc luồng đó không chạy được trên UI (dead code).
- Có **hai quyết định nghiệp vụ** phải có trước khi sửa: chính sách hoàn tiền khi hủy đơn đã thanh toán, và chính sách thưởng giới thiệu (mục 11).

## 2. Phạm vi và phương pháp

| Slice | App | Nội dung | Kết quả |
|---|---|---|---|
| ub-platform | user backend | auth, users, common, config, categories, reviews, uploads, schema | 15 finding, 1 bác bỏ, 1 bác bỏ một phần |
| ub-commerce | user backend | orders, payments, cart, coupons, shipping, referrals, products | 13 finding |
| ub-chatbot | user backend | chatbot (agent, tools, controller) | 13 finding |
| ab-platform-a | admin backend | auth, users, common, config, schema, Dockerfile, app.module | 14 finding (mục 13) |
| ab-platform-b | admin backend | admin dashboard, categories, guard inventory của mọi controller | 10 finding (mục 13) |
| ab-commerce | admin backend | orders, coupons, products, reviews, inventory, uploads, referrals | 15 finding |
| ab-chatbot | admin backend | chatbot (agent, tools, runner) | 11 finding |
| uf-shop | user frontend | catalog, cart, checkout, orders, app shell, common | 13 finding |
| uf-account | user frontend | auth, users, referrals, chatbot UI, lib, nginx, Dockerfile | 14 finding |
| af-features | admin frontend | admin pages, catalog, app shell, common | 13 finding |
| af-commerce | admin frontend | orders, cart, checkout, users, auth, chatbot UI, lib, config | 15 finding |

- **Quy trình:** agy chỉ đọc (`agy-run`) → Claude đọc lại code tại các dòng được dẫn → gắn nhãn `verified`, `downgraded`, `refuted` hoặc `unverified`.
- **Không chạy test, build hay lint** trong bước audit. Quy tắc: agent không chạy test; Claude chỉ chạy test có mục tiêu sau khi sửa.
- **Giới hạn:** không có mạng (không chạy `npm audit`); không đọc file `.env`; không chạy thực tế được hành vi LangGraph interrupt, cookie của Express và transaction của Prisma. Những chỗ này được ghi là `unverified`.

## 3. Kết quả theo mức độ (sau đối chiếu, trước khi gộp trùng)

| App | High | Medium | Low | Bác bỏ / hạ mức |
|---|---:|---:|---:|---|
| user backend (ub-platform, ub-commerce, ub-chatbot) | 4 | 18 | 18 | 11 hạ từ High; 1 bác bỏ (UBP-02) và 1 bác bỏ một phần (UBP-11) |
| admin backend (ab-commerce, ab-chatbot, ab-platform-a/b) | 2 | 27 | 21 | 11 hạ từ High (trong ab-commerce và ab-chatbot); ab-platform không có High sau đối chiếu |
| user frontend (uf-shop, uf-account) | 0 | 12 | 13 | 8 hạ từ High; 2 bác bỏ (UFA-05, UFA-08) |
| admin frontend (af-features, af-commerce) | 0 | 9 | 19 | 6 hạ từ High |

Tổng cộng **146 finding từ 10 báo cáo** (`ab-platform` gồm hai phiên A và B). Trong 146 finding có 3 finding bị bác bỏ hoàn toàn (UBP-02, UFA-05, UFA-08). **Còn 143 finding có hiệu lực: 6 High (5 lỗi riêng sau gộp), 66 Medium, 71 Low.** Sau gộp trùng, số lỗi riêng biệt ít hơn (mục 4–6).

Số liệu là số finding trong từng báo cáo sau khi đối chiếu, nên một lỗi có thể được nhắc ở nhiều báo cáo. Bản gộp trùng nằm ở mục 4–6.

## 4. Lỗi High (giữ lại, sau gộp)

| ID | Lỗi | Vị trí chính | Nguồn | Tác động |
|---|---|---|---|---|
| **H-01** | Khách hủy đơn đã thanh toán: `paymentStatus` bị ghi thành `FAILED`, không có bước hoàn tiền, coupon không được trả lại | `admin_ecommere/backend/src/orders/orders.service.ts:675-705` (`cancelOrder`, đã đọc); `user_ecommere/backend/src/orders/orders.service.ts` (`cancelOrder`, dòng ~796 theo UBC-05) | ABC-05 (High), UBC-05 (High), ABC-06, ABC-04 | Tiền đã thu nhưng hệ thống ghi nhận thất bại; coupon bị giữ; đối soát sai. Khách hàng kích hoạt được. |
| **H-02** | Thanh toán cho đơn đã hủy: `createPayment` chỉ kiểm tra `paymentStatus !== PENDING`, không kiểm tra `order.status`. Admin hủy đơn chờ thanh toán thì `paymentStatus` vẫn là `PENDING` | `user_ecommere/backend/src/payments/payments.service.ts:45`; `orders.service.ts` (updateOrderStatus, nhánh CANCELED) | UBC-04 (High, tiềm ẩn) | Khi nối cổng thanh toán thật, khách có thể bị thu tiền cho đơn đã hủy và đã trả lại kho. Hiện cổng đang mock. |
| **H-03** | Farm thưởng giới thiệu: thưởng cấp ngay khi đăng ký, mã coupon không gắn với người được thưởng (`Coupon` không có `userId`) | `user_ecommere/backend/src/referrals/referrals.service.ts:184` (`processReferral`, `createReferralCoupon`); `schema.prisma:174-183` | UBC-08 (High) | Tạo tài khoản giả để nhận thưởng; ai có mã đều dùng được. |
| **H-04** | Chatbot admin: thao tác ghi bị thực thi lại khi resume. Khi kết nối bị ngắt sau khi handler đã chạy, checkpoint chưa commit, admin retry sẽ chạy lại `stock_remove` | `admin_ecommere/backend/src/chatbot/agent/agent.runner.ts:456-458`; các tool ghi trong `tools/domains/*.ts` | ABA-02 (High) | Tồn kho bị trừ hai lần. Cần kết nối đứt đúng thời điểm, nhưng không có cơ chế chặn. |
| **H-05** | Chatbot user: sau khi khách xác nhận, resume không mang `clientContext`, checkout dùng giỏ server thay vì giỏ khách đã thấy | `user_ecommere/backend/src/chatbot/chatbot.controller.ts:107` (chỉ gắn ở luồng stream); `dtos/agent-resume.dto.ts` (không có `clientContext`) | UBA-01 (High) | Đặt đơn gồm món khác với món khách đã xác nhận. Có điều kiện: có giỏ phía client và giỏ server không rỗng. |

## 5. Lỗi Medium (theo nhóm)

**5.1 Hủy, hoàn tiền, kế toán**
- Admin hủy đơn `PAID`/`PACKING`: `paymentStatus` vẫn `COMPLETED` (`admin orders.service.ts:601-606`, ABC-04).
- Hoàn tiền `DELIVERED → REFUNDED` tự cộng lại tồn kho, đúng nếu hàng về kho, sai nếu không (`admin orders.service.ts:625-627`, ABC-07). **Cần quyết định.**
- Đường `refundPayment` đặt `REFUNDED` trực tiếp, không đi qua luồng chuyển trạng thái, không cộng kho (`user payments.service.ts:106-115`, UBC-12).
- Hủy đơn đã trả tiền không trả lại coupon (`orders.service.ts:629-631, 701-703`, ABC-06).

**5.2 Đặt hàng và idempotency**
- Đối chiếu replay không so `shippingMethod` và `couponCode` ở phía server (UBC-02). Web đã có `shippingMethod` trong fingerprint nên được bảo vệ phía client; API client thì không.
- Luồng chatbot checkout không gửi `checkoutKey`, nên không có idempotency (UBA-03). Cùng lớp với H-04.
- Truyền `items` tường minh thì giỏ server không được dọn sau khi đặt (`orders.service.ts:4-41`, UBA-02).
- Chatbot checkout làm rơi `couponCode` (UBC-01). Web checkout không có ô nhập coupon nên không ảnh hưởng luồng web.
- `addressId` là tuỳ chọn trong tool checkout, nhưng service bắt buộc có (UBA-07).

**5.3 Xác thực và phiên**
- Grace period 30 giây khi refresh cấp token mới trong cùng family (`auth.service.ts:195-225`, UBP-01). Đây là đánh đổi có chủ đích; xem câu hỏi 4.
- Email không unique; `forgotPassword` dùng `findFirst` theo email (`schema.prisma:49`, `auth.service.ts:295`, UBP-04).
- Luồng quên mật khẩu không gửi email ở production; API vẫn trả thông báo "reset link will be sent" (`auth.service.ts:316-320`, UBP-12).
- Không có rate limit riêng cho `/auth/login` và các route auth; chỉ có throttler toàn cục 100 request/phút (`app.module.ts:26-32`, UBP-06).
- Frontend: `SessionRestoreWrapper` gọi refresh ngoài mutex (`SessionRestoreWrapper.tsx:19`, UFA-01, AFC-02); SSE có refresh riêng (`sse.ts:208-233`, UFA-03, AFC-03). Hiện grace period ngăn family bị revoke, nhưng là race dễ vỡ.
- `SessionRestoreWrapper` redirect cứng về `/login` cả trên trang public (`:27-29`, UFA-14).
- Console log lỗi Axios thô, kèm body request chứa mật khẩu (`auth.api.ts:57, 84, 100`, UFA-04, AFC-01).

**5.4 Lộ dữ liệu cá nhân**
- Email người được giới thiệu trả về cho người giới thiệu (`referrals.service.ts:88`, `ReferralPage.tsx:262`, UFA-13).
- Chatbot user đưa email referee vào context LLM (`account.tools.ts:400`, UBA-06).
- Chatbot admin đưa toàn bộ bản ghi đơn (SĐT, địa chỉ) cho LLM vì `getOrderTool` không có `project` (`orders.tools.ts:100-116`, ABA-05).
- `resultSummary` của audit log không được che (`audit.service.ts:84-86`, ABA-11).
- Xoá thread làm mất log công cụ của thread đó (`thread.service.ts:73-82`, UBA-09).
- Exception filter trả `exception.message` nguyên văn cho mọi lỗi không phải HTTP, ở mọi môi trường (`http-exception.filter.ts:34-37`, UBP-03, ABC-01, UBC-10).

**5.5 Tồn kho và ledger**
- `UpdateVariantDto` kế thừa `stock`, nên admin ghi thẳng tồn kho, không tạo `StockMovement` (`update-variant.dto.ts:4`, `products.service.ts:481-493`, ABC-02).
- Chatbot `update_variant` cũng nhận `stock` (`catalog.tools.ts:296, 319`, ABA-06).
- Tồn kho ban đầu khi tạo sản phẩm/variant không có `StockMovement` (`products.service.ts:324-334, 445-456`, ABC-08).

**5.6 Chatbot (agent)**
- Tool của admin không kiểm tra `ctx.role` trong handler (`agent.nodes.ts:233`). Controller đã `@Roles(ADMIN)` ở cấp class (`chatbot.controller.ts:41`), nên đây là lớp phòng thủ bổ sung (ABA-01).
- `readTranscript` bỏ message assistant không có text, nên thẻ xác nhận không hiện lại sau khi tải lại trang (`agent.runner.ts:148-150`, ABA-04).
- Batch tool chạy tuần tự, không bù trừ khi lỗi giữa chừng (`agent.nodes.ts:202-237`, ABA-07).
- Chatbot admin cho phép tạo danh mục con dưới danh mục đã có sản phẩm; `validateProductAssignment` không được gọi khi tạo (`categories.service.ts:278`, ABA-10).
- Không có API đọc lại lịch sử chat; frontend gọi route không tồn tại (`getThread` chỉ trả metadata; UBA-13, UFA-07).
- Chatbot user: `cart_clear` có `risk: WRITE` nên không hỏi xác nhận (`confirm-policy.ts:24-26`, UBA-10, hạ xuống Low).
- Chatbot user: `checkout` tool làm rơi `couponCode` (UBC-01, mục 5.2).
- Trạng thái interrupt: gửi tin nhắn thường lên thread đang chờ xác nhận có thể làm thread kẹt (UBA-05). **Chưa xác minh khi chạy thật.**

**5.7 Giao diện người dùng (storefront)**
- Double submit trong khoảng ~1 giây sau khi đặt thành công: `checkoutKeyRef` bị reset và nút được bật lại (`CheckoutPage.tsx:115, 120, 134-137, 395`, UFS-01).
- Không invalidate cache đơn hàng sau checkout (`CheckoutPage.tsx:113`, UFS-02).
- Nút "Thêm vào giỏ" ở danh sách không kiểm tra tồn kho (`ProductCard.tsx:151`, `CatalogPage.tsx:92-102, 279, 306`, UFS-03).
- Giá trong giỏ lưu localStorage, không được kiểm tra lại (`cartStore.ts:88-90`, UFS-05).
- Trang đơn hàng và danh mục không có phân trang (`OrdersPage.tsx:56, 129`; `CategoryPage`, UFS-06, UFS-08). Nút "Xem thêm" tìm kiếm không có handler (`SearchPage.tsx:347-349`, UFS-07).
- Phí ship miễn phí theo tên tỉnh tính ở client, trong khi server tự tính (`CheckoutPage.tsx:49-53`; server `orders.service.ts:245-247, 1030-1039`, UFS-12). Không phải lỗ hổng tiền, nhưng hiển thị có thể sai.

**5.8 Admin frontend**
- Form sửa sản phẩm: `useEffect` có `categories` trong deps, nên khi danh mục tải xong thì các trường bị ghi đè (`AdminProductFormPage.tsx:136-166`, AFF-01).
- Dropdown trạng thái đơn hiển thị mọi trạng thái, lỗi chỉ hiện thông báo chung (`AdminOrdersPage.tsx:70-87, 112-114`, AFF-05).
- Đổi bộ lọc trạng thái không reset `page` (`AdminOrdersPage.tsx:185`, AFF-06).
- Giá sản phẩm cho phép số lẻ và 0; ảnh không bắt buộc (`AdminProductFormPage.tsx:41-48`, AFF-07, AFF-08).
- Cache danh mục: `staleTime` 30 phút, và `CategoryTreeView` không invalidate (`features/admin/hooks/useCategories.ts:9`, AFF-02).
- Chatbot admin chỉ tải 20 thread (`AdminChatbotPage.tsx:202`, AFC-09).

**5.9 Danh mục, coupon, cấu hình**
- `update` coupon không kiểm tra `maxUses >= usedCount` và không kiểm tra giỏ đang dùng coupon (`coupons.service.ts:121-135`, ABC-09).
- Xoá Cloudinary bằng `filePath` do client gửi, không kiểm tra prefix thư mục app (`uploads.service.ts:60-68`, ABC-03). Route đã là `@Roles(ADMIN)`.
- Danh sách bán chạy và đánh giá tải toàn bộ sản phẩm vào bộ nhớ (`products.service.ts:125-138`, ABC-11; `products.service.ts` của user, UBC-09).
- Lỗi tồn kho thấp không phân trang (`inventory.service.ts:139-145`, ABC-12, Low).

## 6. Lỗi Low và hygiene

- **Index:** `Address.userId` (`schema.prisma:93-108`, UBP-10); `Order.couponCode` (`schema.prisma:244-248`, ABC-13, UBC-11); `ProductVariant.stock` (`schema.prisma:169-171`, ABC-13).
- **Mã lỗi HTTP:** lỗi "Unauthorized" trả 400 thay vì 403/404 (`reviews.service.ts:153, 188`; `orders.service.ts:481-483, 668-670`, UBP-13, ABC-14).
- **Upload:** chỉ kiểm tra MIME do client gửi (`uploads.controller.ts:36-43`, UBP-09, ABC-15). Cloudinary `resource_type: 'image'` giới hạn tác động.
- **Dockerfile:** chạy root, copy cả devDependencies, `npm install` thay vì `npm ci` (`user Dockerfile:15-20`, `admin Dockerfile:8`, `frontend Dockerfile`; UBP-08, AFC-15, UFA-11).
- **Nginx:** thiếu header bảo mật (`frontend/nginx/default.conf`, UFA-09, AFC-11); không cấu hình `Cache-Control` cho `index.html` (UFA-10, chưa xác minh).
- **Swagger:** mở ở production (`main.ts:88`, UBP-07).
- **CSRF:** route `@Public` bỏ qua CSRF guard, nhưng cookie refresh có `SameSite=Lax` (`token.util.ts:37`, UBP-05).
- **Envelope và tài liệu:** `TransformInterceptor` không có `success` (`response.dto.ts:5`, UBP-15); `ReviewEntity.comment` khác `content` (`review.entity.ts:17`, UBP-14).
- **Cấu hình env:** `ConfigModule.forRoot` thứ hai không có `validate` ở `app.module.ts:22` (UBP-11). Đã xác nhận `config.module.ts` có nối `validate`, nên không phải lỗ hổng chính.
- **Parse JSON không an toàn:** `orders.api.ts:20`, `AdminOrderDetailPage.tsx:54-57`, `admin orders.api.ts:19` (UFS-10, AFF-03, AFC-08).
- **Tham số URL:** `parseInt` không kiểm tra NaN (`CatalogPage.tsx:25, 36-37`, UFS-09). Bộ lọc giá không kiểm tra min ≤ max (`FilterSidebar.tsx:163-168`, UFS-11).
- **Thông báo lỗi:** `alert()` làm mất thông điệp backend (`CheckoutPage.tsx:118`, `OrdersPage.tsx:67`, UFS-13).
- **Nhỏ ở admin UI:** select không controlled (`AdminOrdersPage.tsx:303-306`, AFF-04); `useToast` không memo (AFF-09); thiếu kiểm tra file ở `ImageUpload` (AFF-10); không chặn double click xoá (AFF-11); dashboard không invalidate khi đổi sản phẩm (AFF-12); dùng `unitPrice * quantity` thay vì `lineTotal` (AFF-13).
- **Hiệu năng frontend:** `chatStore` ghi localStorage ở mỗi token stream (`useChatAgent.ts:147`, UFA-12).
- **Chatbot:** throttle theo IP, không theo admin (`chatbot.controller.ts:58, 102`, ABA-08); SSE không đóng writer khi client ngắt (`:249-254`, ABA-09); endpoint `/messages` cũ không có resume (UBA-08); tool `cart_clear` (UBA-10); không có retention cho checkpoint (UBA-11); `tool_start` phát trước khi xác nhận (UBA-12); guest thread không gửi `x-chat-session` (UBA-04).
- **Storefront khác:** `wishlist-storage` không xoá khi logout (`useWishlist.ts:46`, UFA-06); `GET /chatbot/threads/:id/messages` không tồn tại nhưng frontend gọi (UFA-07); `CheckoutPage` của admin và cart/orders của customer nằm trong bundle admin (AFC-10, AFC-12, AFC-13, AFC-14).
- **Thêm:** `ORDER_STATUS` không được dùng ở đâu (`constants.ts:15`, AFC-06).
- **Thanh toán (chỉ khi nối cổng thật):** `checkoutKey` tuỳ chọn (`checkout.dto.ts:114-117`), fingerprint client thiếu coupon (`CheckoutPage.tsx:72-85`, UBC-03, không ảnh hưởng luồng web hiện tại).

## 7. Bị bác bỏ hoặc hạ mức

| ID | Agent nói | Kết luận | Lý do (đã đối chiếu code) |
|---|---|---|---|
| UBP-02 | High: cookie `csrf_token` không có `path`, bị giới hạn `/api/auth` | **Bác bỏ** | `token.util.ts:80` dùng `response.cookie()` của Express, mặc định `path: '/'`. Chưa đọc được mã Express trực tiếp (chưa cài `node_modules`), kết luận dựa trên tài liệu Express. |
| UBP-11 | Medium: validation env bị bỏ qua | **Bác bỏ (phần chính)** | `config/config.module.ts:6-12` đã nối `validate`. Còn một `forRoot` thừa không có `validate` (`app.module.ts:22`), mức Low. |
| UFA-05 | High: cache không xoá khi logout | **Bác bỏ** | `useAuth.ts:55-56` (nhánh lỗi) và `:62-63` (nhánh thành công) đều gọi `queryClient.clear()`. Nhánh hết phiên có reload trang. |
| UFA-08 | High: nginx không proxy `/api` | **Không áp dụng cho deploy** | `compose.yaml` có Caddy làm edge; `deploy/caddy/Caddyfile:8-9, 20-21` định tuyến `/api/*` tới backend. Chỉ chạy nginx đơn lẻ mới lỗi. |
| UFA-01, UFA-03, AFC-02, AFC-03 | High: refresh song song làm revoke family | **Hạ xuống Medium/Low** | Backend grace period 30 giây (`auth.service.ts:195-225`) cấp token mới thay vì revoke. Race có thật nhưng không đăng xuất người dùng. |
| UFA-02, AFC-04 | High/Medium: `_retry` thiếu, lặp refresh | **Hạ xuống Low** | Mỗi request chỉ thêm tối đa một lần refresh (`api.ts:88-99`), không lặp vô hạn. |
| UFS-01 | High: double submit | **Medium** | Cửa sổ khoảng 1 giây sau khi thành công. |
| UFS-02 | High: cache đơn cũ | **Medium** | Chỉ khi đã mở `/orders` trong vòng 2 phút trước đó. |
| UFS-03 | High: thêm hàng hết vào giỏ | **Medium** | Server chặn ở checkout (`orders.service.ts:311-323`). |
| UFS-04 | High: giỏ vượt tồn kho | **Low** | Server chặn bằng `updateMany(stock >= qty)` (`orders.service.ts:311-323`). Chỉ là UX. |
| UFS-12 | Medium: phí ship client | **Medium (hiển thị)** | Không phải lỗ hổng tiền: server tự tính và bỏ qua `shippingFee`/`total` do client gửi. |
| UBC-01 | High: coupon bị bỏ | **Medium** | Web checkout không có ô coupon; chỉ ảnh hưởng chatbot/API. |
| UBC-02 | High: replay không so sánh | **Medium** | Web đã có `shippingMethod` trong fingerprint. |
| UBC-06 | High: giỏ hiển thị 0 đồng | **Low** | Checkout vẫn kiểm tra `minOrder` (`orders.service.ts:229`). |
| UBA-02, UBA-03 | High: giỏ không dọn, không `checkoutKey` | **Medium** | Chỉ khi resume bị gửi lại hoặc truyền `items`. |
| UBA-04 | High: guest không resume được | **Low** | Chỉ khi client không gửi `x-chat-session`. |
| UBA-05 | High: tin nhắn thường làm thread kẹt | **Medium, chưa xác minh** | Cần test khi chạy thật. |
| UBA-06 | High: email referee vào LLM | **Medium** | Chung lớp với ABA-05. |
| ABC-04, ABC-06, ABC-07, ABC-01, ABC-02, ABC-03, ABC-11 | High | **Medium** | Admin-triggered, hoặc phụ thuộc quy trình kinh doanh (xem câu hỏi 1–2). |
| ABA-01, ABA-03, ABA-05, ABA-06 | High | **Medium/Low** | Lớp phòng thủ bổ sung, hoặc đã có ownership check (`thread.service.ts assertOwned`); ABA-05 và ABA-06 là vấn đề quyền riêng tư và ledger, mức Medium. |
| AFF-01, AFF-02 | High | **Medium** | Cửa sổ ngắn (AFF-01) hoặc chỉ ảnh hưởng select danh mục (AFF-02). |
| AFF-03 | High: `JSON.parse` trong render | **Low** | `addressJson` do server ghi. |
| UBP-03, UBP-04, UBP-01 | High | **Medium** | Xem mục 5.3–5.4. |

Các kết luận "Medium" và "Low" không bị bác bỏ, chỉ được xác nhận theo mức đã ghi. Chi tiết từng dòng trong `docs/codebase-audit-findings.md`.

## 8. Vấn đề chéo và phụ thuộc

1. **Thay đổi chưa commit trong `admin_ecommere/backend/src/auth`** (bỏ `POST /auth/register`, khoảng 72 dòng, đang nằm trong working tree của bạn, không nằm trong PR này). Admin frontend vẫn gọi `/auth/register` (`features/auth/api/auth.api.ts:62-64`), có `RegisterPage.tsx` và `useAuth.register`. Nếu commit thay đổi backend mà không xoá luồng frontend, sẽ gãy. Đây là WP-1.6, phải làm chung.
2. **Cùng một lỗi ở hai backend:** hủy đơn (H-01), exception filter (5.4), MIME upload, Swagger, Dockerfile, `BadRequest('Unauthorized')`. Sửa song song, mỗi backend một PR, để test riêng.
3. **Refresh token:** cả hai frontend có bộ điều phối refresh riêng trong `lib/api.ts`, và có thêm `SessionRestoreWrapper` và SSE gọi refresh ngoài mutex. Gộp về một bộ điều phối duy nhất (WP-1.2).
4. **Cổng thanh toán còn mock:** H-02 chỉ thành lỗi tiền khi nối cổng thật. Vẫn nên sửa trước khi go-live.
5. **Dead code ở admin frontend:** cart, checkout, orders, link account trỏ tới route không tồn tại, register. Xoá trong một PR riêng (WP-3.3).
6. **Schema Prisma:** hai file `schema.prisma` hiện giống hệt nhau. Mọi thay đổi schema phải làm ở cả hai và chạy migration cho từng backend.
7. **Dữ liệu cá nhân và LLM:** H-05 và các finding PII cần cùng một quyết định (câu hỏi 6).

## 9. Kế hoạch sửa theo đợt

Mỗi work package (WP) được chia thành các phiên `agy-task`, mỗi phiên một lỗi, theo quy tắc của repo. Mỗi WP có tiêu chí chấp nhận quan sát được; Claude chạy kiểm tra có mục tiêu sau khi đọc diff.

### Đợt 0 – Chặn rủi ro tiền và dữ liệu (làm trước khi bật thanh toán thật)

- **WP-0.1 Hủy đơn đã thanh toán** (cả hai backend, H-01)
  - Việc: khi hủy đơn `PAID`/`PACKING`, không ghi `FAILED`; đặt trạng thái cần hoàn tiền (hoặc `REFUNDED` theo câu hỏi 1); trả coupon cho mọi lần hủy có coupon; cộng kho đúng một lần.
  - Chấp nhận: test cho hủy từ `PENDING_PAYMENT`, `PAID`, `PACKING`; coupon `usedCount` giảm; stock tăng đúng một lần; `paymentStatus` không còn `FAILED` cho đơn đã thu tiền.
  - Kiểm tra: test có mục tiêu của `orders` (một lệnh mỗi lần), `tsc --noEmit` trong backend.
- **WP-0.2 Thanh toán từ chối đơn đã hủy** (user backend, H-02)
  - Việc: `createPayment` kiểm tra `order.status === PENDING_PAYMENT`; admin hủy đơn chờ thanh toán thì đặt `paymentStatus = FAILED`.
  - Chấp nhận: tạo payment cho đơn `CANCELED` trả 400/409; đơn chờ thanh toán vẫn tạo được.
- **WP-0.3 Hoàn tiền dùng chung luồng trạng thái** (user backend, UBC-12, ABC-07)
  - Việc: `refundPayment` đi qua cùng hàm chuyển trạng thái với `updateOrderStatus` để cộng kho và ghi nhận đúng. Phụ thuộc câu hỏi 2.
- **WP-0.4 Thưởng giới thiệu** (user backend, H-03, UBC-07) – **cần câu hỏi 3**
  - Việc: cấp thưởng sau đơn đầu tiên đã giao/thanh toán; gắn coupon với người được thưởng (thêm `userId` hoặc bảng riêng, có migration); `getMyCouponsFromReferral` trả thêm coupon của người được mời.
  - Chấp nhận: đăng ký mới không tạo coupon; sau đơn đầu tiên được giao, người được thưởng thấy coupon và chỉ họ dùng được.
- **WP-0.5 Chatbot resume dùng đúng giỏ đã xác nhận** (user backend, H-05, UBA-02, UBA-07, UBC-01)
  - Việc: lưu snapshot giỏ và coupon tại thời điểm xác nhận trong thread state, hoặc truyền `clientContext` vào resume; khi truyền `items` thì vẫn dọn giỏ server; `addressId` mặc định lấy địa chỉ mặc định của user.
  - Chấp nhận: món được đặt đúng bằng món đã hiện ở thẻ xác nhận; giỏ server được dọn; coupon được áp.
- **WP-0.6 Idempotency cho tool ghi khi resume** (cả hai chatbot, H-04, UBA-03)
  - Việc: khóa idempotent theo `threadId + toolCallId` cho `stock_add`, `stock_remove`, `stock_set`, `update_order_status`, `checkout`, `delete_*`; ghi kết quả trước khi trả về.
  - Chấp nhận: resume gửi lại không thực thi lại tool ghi; kết quả cũ được trả về.
- **WP-0.7 Tồn kho chỉ đổi qua `InventoryService`** (admin backend, ABC-02, ABA-06, ABC-08)
  - Việc: bỏ `stock` khỏi `UpdateVariantDto` và khỏi `update_variant` của chatbot; tạo `StockMovement` khi tạo sản phẩm có tồn đầu.
  - Chấp nhận: không còn đường ghi `stock` trực tiếp ngoài `InventoryService`; tồn đầu có dòng ledger.
- **WP-0.8 Chatbot: dữ liệu cá nhân và audit log** (cả hai, ABA-05, UBA-06, ABA-11, UBA-09) – **cần câu hỏi 6**
  - Việc: `project` cho `get_order` (che SĐT, địa chỉ); che email trong `list_my_referrals`; che `resultSummary` trước khi ghi audit; giữ `agentToolLog` khi xoá thread.
  - Chấp nhận: tool không trả SĐT/email thô; audit log còn lại sau khi xoá thread.

### Đợt 1 – Bảo mật và phiên

- **WP-1.1 Exception filter không lộ message nội bộ** (hai backend, UBP-03, ABC-01, UBC-10): trả "Internal server error" ở production, ghi chi tiết ra log.
- **WP-1.2 Bộ điều phối refresh chung** (hai frontend, UFA-01, UFA-03, UFA-02, AFC-02, AFC-03, AFC-04): một hàng đợi refresh trong `lib/api.ts`; `SessionRestoreWrapper` và SSE dùng chung; chặn render cho đến khi restore xong; đặt `_retry` trước khi queue.
- **WP-1.3 Không log thông tin đăng nhập** (hai frontend, UFA-04, AFC-01): log thông điệp và mã trạng thái, không log object lỗi.
- **WP-1.4 Email duy nhất và quên mật khẩu** (user backend, UBP-04, UBP-12) – **cần câu hỏi 5**: migration unique (kiểm tra dữ liệu trùng trước); luồng reset gửi email hoặc trả lỗi rõ ràng ở production.
- **WP-1.5 Rate limit cho auth** (user backend, UBP-06): `@Throttle` cho `login`, `register`, `forgot-password`, `reset-password`.
- **WP-1.6 Xoá đăng ký công khai ở admin** (backend + frontend, mục 8.1): xoá `RegisterPage`, `authApi.register`, `useAuth.register` và route; cùng với thay đổi backend đang chưa commit (cần bạn quyết định, câu hỏi 8).
- **WP-1.7 Xoá Cloudinary chỉ trong thư mục app** (admin backend, ABC-03): kiểm tra prefix và từ chối path có `..`.
- **WP-1.8 Chatbot admin kiểm tra role trong handler** (admin, ABA-01): kiểm tra `ctx.role === 'ADMIN'` trong `createToolsNode` hoặc đầu mỗi handler.
- **WP-1.9 Mã lỗi đúng** (hai backend, UBP-13, ABC-14): `ForbiddenException` hoặc `NotFoundException` thay cho `BadRequestException('Unauthorized')`.
- **WP-1.10 Kiểm tra file upload** (hai backend, UBP-09, ABC-15): kiểm tra magic bytes trước khi gửi Cloudinary.
- **WP-1.11 Hygiene bảo mật:** Swagger chỉ bật ngoài production (UBP-07); xem lại CSRF exemption (UBP-05); Dockerfile chạy non-root và `npm ci`; nginx thêm header; `Cache-Control` cho `index.html`.

### Đợt 2 – Đúng nghiệp vụ và UX

- **WP-2.1 Storefront** (user frontend): double submit (UFS-01); invalidate cache đơn (UFS-02); kiểm tra tồn khi thêm vào giỏ (UFS-03); kiểm tra lại giá và tồn của giỏ khi tải (UFS-05); phân trang đơn và danh mục, nút tìm kiếm (UFS-06, UFS-07, UFS-08); bỏ quy tắc phí ship ở client, hiển thị phí server báo (UFS-12); không redirect cứng khi ở trang public (UFA-14); xoá wishlist khi logout (UFA-06).
- **WP-2.2 Tham số URL và parse an toàn** (user frontend và admin frontend): UFS-09, UFS-10, AFF-03, AFC-08, UFS-11, UFS-13 (thay `alert` bằng toast và thông điệp backend).
- **WP-2.3 Chatbot user và admin – lịch sử:** endpoint đọc lại transcript và thẻ xác nhận sau khi tải lại (UBA-13, ABA-04); sửa frontend gọi route không tồn tại (UFA-07).
- **WP-2.4 Admin frontend:** form sửa sản phẩm không ghi đè khi danh mục tải xong (AFF-01); invalidate cache danh mục (AFF-02); dropdown trạng thái chỉ hiện chuyển đổi hợp lệ và hiện lỗi từ server (AFF-05); reset page khi đổi filter (AFF-06); giá nguyên, ảnh bắt buộc (AFF-07, AFF-08); phân trang thread chatbot (AFC-09).
- **WP-2.5 Coupon và danh mục** (admin backend): kiểm tra `maxUses >= usedCount` và giỏ đang dùng coupon khi update (ABC-09); danh mục cha có sản phẩm không được có con (ABA-10).
- **WP-2.6 Batch tool của chatbot:** bù trừ hoặc chặn batch có nhiều thao tác ghi (ABA-07).

### Đợt 3 – Hiệu năng và dọn dẹp

- **WP-3.1 Index** (một migration cho mỗi backend): `Address.userId`, `Order.couponCode`, `ProductVariant.stock`, và `[userId, couponCode]` nếu cần.
- **WP-3.2 Xếp hạng sản phẩm bằng DB** (hai backend, ABC-11, UBC-09): dùng aggregate và `skip/take`, hoặc cột tổng hợp đã tính sẵn. Danh sách tồn thấp có phân trang (ABC-12).
- **WP-3.3 Xoá dead code admin frontend** (AFC-10, AFC-12, AFC-13, AFC-14, AFC-06, AFC-07) và kiểm tra `AdminLayout`/`RequireAdmin` ở user frontend không được gắn router (uf-shop, chưa xác minh).
- **WP-3.4 Hygiene còn lại:** envelope có `success` (UBP-15); `ReviewEntity.content` (UBP-14); throttle theo user cho chatbot (ABA-08); đóng SSE writer (ABA-09); bỏ endpoint `/messages` cũ (UBA-08); cân nhắc `cart_clear` (UBA-10); retention cho checkpoint (UBA-11); thứ tự sự kiện SSE (UBA-12); `ConfigModule.forRoot` thừa (UBP-11); `trim` mã coupon (ABC-10); tồn đầu có ledger (ABC-08, trong WP-0.7); chat localStorage (UFA-12); `useToast` memo (AFF-09); kiểm tra file phía client (AFF-10); chống double click (AFF-11); invalidate dashboard (AFF-12); `lineTotal` (AFF-13); guest header (UBA-04).

## 10. Quy trình thực hiện

1. Mỗi WP chạy bằng `agy-task` trong worktree riêng. Một lỗi một phiên. Prompt có HARD RULES, không yêu cầu agent chạy test.
2. Claude đọc toàn bộ diff, kiểm tra từng dòng với mục tiêu của WP.
3. Claude chạy test có mục tiêu, **từng lệnh một**, trong worktree. Không chạy nhiều bộ test song song.
4. Commit trên nhánh của WP, không có `Co-Authored-By`, nhiều `-m` mô tả nguyên nhân và phạm vi.
5. Gộp vào nhánh tích hợp theo thứ tự đợt. Mỗi đợt một PR, PR chia theo app khi có thể.
6. Không sửa code ngoài phạm vi của WP. Lỗi mới phát hiện được ghi lại, không sửa trong cùng phiên.

## 11. Quyết định nghiệp vụ

**Đã chốt (trả lời trong phiên, 2026-10-13):**

1. **Hủy đơn đã thanh toán (WP-0.1):** đặt `paymentStatus = REFUNDED` ngay. Trả lại coupon và kho đúng một lần. Không đặt `FAILED`. Cổng hoàn tiền vẫn mock nên chưa gọi cổng.
2. **Hoàn tiền từ `DELIVERED` → `REFUNDED` (WP-0.3):** không tự cộng kho. Kho chỉ cộng khi hủy đơn chưa giao hoặc khi có thao tác nhập hàng.
3. **Thưởng giới thiệu (WP-0.4):** cấp sau đơn đầu tiên của người được mời đã giao. Coupon gắn với người giới thiệu và dùng một lần. Phần thưởng cho người được mời chưa có quyết định riêng, nên giữ theo cấu hình hiện tại (giả định).
4. **Email quên mật khẩu (WP-1.4):** SMTP của Gmail, cấu hình qua biến môi trường (`SMTP_*`). Mật khẩu ứng dụng Gmail không đưa vào repo.
5. **Dữ liệu cá nhân gửi cho LLM (WP-0.8):** giữ nguyên, chấp nhận rủi ro, nên không làm việc che dữ liệu trước khi đưa vào LLM (ABA-05, UBA-06). Vẫn sửa phần ghi log và giữ audit log: che `resultSummary` (ABA-11) và không xoá audit log khi xoá thread (UBA-09). Đây là giả định vì câu trả lời không nói về log.
6. **Thay đổi chưa commit trong `admin_ecommere/backend/src/auth` (WP-1.6):** không ghi đè. Phần xoá đăng ký ở frontend admin làm trong nhánh fix. Phần xoá ở backend để bạn tự commit, nên không đưa vào PR này.

**Mặc định không hỏi:** grace period 30 giây khi refresh (UBP-01) giữ nguyên, chưa đổi.

**Câu hỏi gốc (giữ để truy vết):**

1. **Hủy đơn đã thanh toán (WP-0.1):** hoàn tiền tự động qua cổng hay ghi nhận để đối soát thủ công? Trạng thái sau hủy là `REFUNDED` ngay, hay `CANCELED` + cần hoàn tiền?
2. **Hoàn kho khi `REFUNDED` (ABC-07, WP-0.3):** hàng có về kho khi hoàn tiền không? Nếu không, bỏ việc cộng kho ở trạng thái này.
3. **Thưởng giới thiệu (WP-0.4):** thưởng sau đơn đầu tiên đã giao? Mức thưởng? Coupon có gắn với người được thưởng?
4. **Grace period refresh 30 giây (UBP-01):** giữ, hay rút xuống vài giây? Ảnh hưởng đến race ở frontend (UFA-01, AFC-02).
5. **Email (WP-1.4):** dùng nhà cung cấp nào? Cần chuẩn bị gì trước khi bật luồng quên mật khẩu?
6. **Dữ liệu cá nhân gửi cho LLM (WP-0.8):** có được phép gửi SĐT, địa chỉ, email người khác cho nhà cung cấp LLM không? Nếu không, đưa vào tool dưới dạng đã che.
7. **Cổng thanh toán:** dự kiến go-live khi nào? Quyết định mức ưu tiên của H-02.
8. **Thay đổi chưa commit trong `admin_ecommere/backend/src/auth`:** bạn muốn commit trong PR này (kèm WP-1.6) hay PR riêng? Nếu không commit thì sao?

## 12. Phần chưa kiểm tra (điểm mù)

- **Chạy thật:** hành vi LangGraph interrupt và resume (UBA-05, ABA-02), race trong Prisma transaction, và đường abort của SSE chưa được chạy.
- **Cookie Express:** mặc định `path` dựa trên tài liệu, không đọc từ mã (node_modules không được cài ở checkout này).
- **Phụ thuộc:** không có `npm audit`, không kiểm tra CVE.
- **Cấu hình production:** `.env`, secrets, Caddy đầy đủ (chỉ kiểm tra định tuyến `/api`), `deploy/`, script ở gốc.
- **Prompt chatbot admin:** `system.prompt.ts:31` chỉ dành cho khách (`app === 'USER' && role === 'GUEST'`), đã xác nhận không ảnh hưởng admin.
- **Admin backend platform:** xem mục 13.

## 13. Lịch sử chạy agent (để truy vết)

| Slice | Lần chạy | Kết quả | Ghi chú |
|---|---|---|---|
| af-commerce | 1 | lỗi `503` ở bước eligibility, chưa có token nào được dùng | Chạy lại đúng prompt sau 60 giây trên `gemini-3.8-flash-high`, thành công. |
| ab-platform | 1 | lỗi `502` sau 2107 sự kiện | Lưu log `audit-ab-platform.try1.jsonl`; chạy lại sau 60 giây. |
| ab-platform | 2 | lỗi `503` sau 1407 sự kiện | Lưu log `audit-ab-platform.try2.jsonl`. Lỗi phía Google, không phải quota. |
| ab-platform | 3 | không chạy: agy báo `gemini-3.7-flash-high` không còn trong danh sách model | Dự phòng 3.7 của quy tắc không dùng được. Không dùng model khác (Claude, GPT-OSS). |
| ab-platform-a | 1 | thành công, 14 finding | Chia slice thành hai phiên nhỏ hơn, cùng `gemini-3.8-flash-high`. |
| ab-platform-b | 1 | thành công, 10 finding | Cùng model; có thêm phần kiểm tra guard của mọi controller. |

Log và báo cáo gốc nằm trong `.agy-sessions/` (không commit).
