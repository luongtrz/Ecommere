# Codebase audit findings register

Companion to `docs/codebase-audit-fix-plan.md`. Each entry is one finding from the read-only agy audits run on 2026-10-13, followed by the reviewer's verdict after reading the cited code.

Verdict vocabulary:

- `confirmed`: the code matches the report. The severity shown is the reviewer's.
- `downgraded (agy X -> Y)`: the code matches but the severity is lower than the agent claimed.
- `refuted`: the code does not support the claim.
- `unverified`: needs runtime behaviour or an external service; not confirmed by reading.
- `dup`: same root cause as another finding (the ID is given).

Line numbers are the ones cited by the agents and re-read by the reviewer. Where a line was not re-read, the entry says so.


Rule applied: every Critical/High claim is checked against the cited lines before it goes into the plan. agy severities are re-rated with the reason.

## uf-shop (UFS) — 13 findings, verified 2026-10-13
- UFS-01 (agy High -> Medium): double submit ~1 s after success. CheckoutPage.tsx:115 nulls checkoutKeyRef; :120 finally re-enables the button (disabled={... || isSubmitting} at :395); :134-137 clearCart + navigate after 1000 ms. Window is narrow. Fix: keep an "ordered" state until navigation; do not reset the key before unmount.
- UFS-02 (agy High -> Medium): CheckoutPage.tsx:113 posts with apiClient, no invalidateQueries(ORDERS); useOrders staleTime 2 min. Order list can miss the new order for up to 2 min. Fix: invalidate or use a mutation.
- UFS-03 (agy High -> Medium): listing "Thêm vào giỏ" adds variants[0] without a stock check (ProductCard.tsx:151; CatalogPage.tsx:92-102, :279, :306). Detail page and QuickView do check stock. Server blocks at checkout (orders.service.ts:83, :127, :311-323).
- UFS-04 (agy High -> Low): cart quantity has no stock cap (cartStore.ts:58-68). Server enforces stock atomically (orders.service.ts:311-323): UX only, generic alert on failure (see UFS-13).
- UFS-05 (Medium, confirmed): cart prices persisted in localStorage (cartStore.ts:88-90), never revalidated. Server charges the current price (checkout.dto.ts:34; orders.service.ts recalculates), so displayed and charged totals can differ.
- UFS-06 (Medium, confirmed): OrdersPage.tsx:56 loads one page, no Pagination; counts use allOrders.length (:129).
- UFS-07 (Medium, confirmed): SearchPage.tsx:347-349 "Xem thêm sản phẩm" has no onClick; useProductSearch (:28) has no page.
- UFS-08 (Medium, confirmed): CategoryPage has no Pagination component; the page URL param is written but never used for the query.
- UFS-09 (agy Medium -> Low): CatalogPage.tsx:25, :36-37 parseInt without NaN check. Only reachable via hand-edited URLs.
- UFS-10 (agy Medium -> Low): orders.api.ts:20 JSON.parse without try/catch. addressJson is server-written, so malformed input is unlikely.
- UFS-11 (Low, accepted): FilterSidebar.tsx:163-168 no min<=max check.
- UFS-12 (agy Medium, confirmed as display mismatch, NOT a money exploit): CheckoutPage.tsx:49-53 duplicates free-shipping rule by province text. Server computes its own shipping (orders.service.ts:164, :245-247, :1030-1039) and ignores client shippingFee/total. Fix: remove client rule, show server quote.
- UFS-13 (Low, accepted): alert() hides backend message (CheckoutPage.tsx:118, OrdersPage.tsx:67).
- Not verified (agy): AdminLayout.tsx and RequireAdmin.tsx exist in user frontend src/app but are not mounted in router.tsx. Likely dead code. Verify later with grep.

## Cross-cutting facts verified
- Uncommitted admin auth change (working tree, not on this branch) removes public POST /auth/register from admin backend. Admin frontend still calls it: admin_ecommere/frontend/src/features/auth/api/auth.api.ts:62-64, pages/RegisterPage.tsx:43, hooks/useAuth.ts:39. Must be removed together.
- admin_ecommere/backend/src/chatbot/agent/prompts/system.prompt.ts:31 tells the chat user to log in or register (/login, /register, storefront links) — check whether this is the customer shop prompt copied into the admin backend.
- user and admin prisma/schema.prisma are byte-identical (no drift).
- Backend checkout pricing is server-side (orders.service.ts:164, :245-247): client totals are display-only.

## ub-platform (UBP) — 15 findings, verified 2026-10-13
- UBP-01 (agy High -> Medium): refresh grace period (auth.service.ts:195-225). A replaced token presented within 30 s gets a fresh token pair in the same family and the family is not revoked. Intentional trade-off (comment "F5 spam, network delay"); window is bounded. Fix: cache the rotated token or shorten the window.
- UBP-02 (agy High): REFUTED. csrf_token is set with response.cookie() (token.util.ts:80), and Express defaults cookie path to "/" (from Express docs; node_modules not installed in this checkout, so not confirmed from source).
- UBP-03 (agy High -> Medium): http-exception.filter.ts:34-37 returns raw exception.message for every non-HTTP Error in every environment (Prisma messages can show table/column names). Information disclosure.
- UBP-04 (agy High -> Medium): schema.prisma:49 email String? has no @unique; register checks only phone (auth.service.ts:41); forgotPassword uses findFirst by email (auth.service.ts:295). Data-integrity issue; reset mail is not sent yet (UBP-12).
- UBP-05 (agy Medium -> Low): refresh cookie is SameSite=Lax (token.util.ts:37), so cross-site POST does not carry it. CSRF guard exempts @Public routes; practical impact is near zero.
- UBP-06 (Medium, confirmed): only the global throttler applies (app.module.ts:26-32, default 100 per 60 s); no per-route limit on /auth/login.
- UBP-07 (agy Medium -> Low): main.ts:88 setupSwagger(app) with no NODE_ENV gate. Docs exposure only.
- UBP-08 (agy Medium -> Low): Dockerfile runtime stage copies the whole build /app (devDeps included) and has no USER directive. Hardening.
- UBP-09 (agy Medium -> Low): fileFilter checks client mimetype only, but uploads go to Cloudinary with resource_type 'image' (uploads.service.ts:86), so impact is limited to stored content on the Cloudinary domain.
- UBP-10 (agy Medium -> Low, confirmed): no @@index([userId]) on Address. Small table per user.
- UBP-11 (agy Medium): REFUTED as stated. config.module.ts:6-12 does wire validate. Remaining Low hygiene issue: a second ConfigModule.forRoot without validate at app.module.ts:22. Runtime effect unverified; test by booting without JWT_ACCESS_SECRET.
- UBP-12 (Medium, confirmed): auth.service.ts:316-320 never sends reset email; reset token returned only when NODE_ENV=development. Production users cannot reset passwords, while the API replies that a link "will be sent". Functional gap.
- UBP-13 (Low, confirmed): reviews.service.ts:153 and :188 throw BadRequestException('Unauthorized') instead of 403.
- UBP-14 (Low, confirmed): review.entity.ts:17 "comment" vs create-review.dto.ts:19 "content". Swagger doc mismatch.
- UBP-15 (Low, confirmed): TransformInterceptor output has no success field; SuccessResponseDto declares it (response.dto.ts:5).
- Clean areas (agy, plausible, not re-checked): cycle check in categories; purchase-eligibility check for reviews; UpdateUserDto whitelist; address ownership; password hash excluded by select.

## uf-account (UFA) — 14 findings, verified 2026-10-13
- UFA-01 (agy High -> Medium): SessionRestoreWrapper.tsx:19 calls /auth/refresh outside the api.ts mutex, so it can overlap with the interceptor's refresh. The backend grace period (auth.service.ts:195-225) keeps the family alive, so the "permanent revoke" claim is not supported. Fix: route restore through the same refresh coordinator.
- UFA-02 (agy High -> Low): queued requests replayed in api.ts:88-96 never get _retry, so each request can trigger at most one extra refresh (not a cascade). Fix: set _retry before queueing.
- UFA-03 (agy High -> Low): sse.ts:208-233 has its own refresh outside the mutex (same class as UFA-01). Guest case only changes the error text.
- UFA-04 (agy High -> Medium): auth.api.ts:57, :84, :100 log raw Axios errors via console.error. The error holds the request body, so the password is in the console. Self-visible, but leaks if error monitoring captures console. Fix: log message and status only.
- UFA-05 (agy High): REFUTED. useAuth.ts:55-56 (logout error path) and :62-63 (success path) call queryClient.clear(). Session expiry in api.ts:119-120 does a full reload. Login success does not clear the cache, but logout normally precedes login.
- UFA-06 (agy Medium -> Low): wishlist-storage persists in localStorage and survives logout (useWishlist.ts:46). Not sensitive.
- UFA-07 (agy Medium -> Low, confirmed): agent.api.ts:102-114 getTranscript/getMessages call GET /chatbot/threads/:id/messages. No such route in chatbot.controller.ts. No callers: dead code.
- UFA-08 (agy High -> refuted for deploy): compose.yaml runs a Caddy edge; deploy/caddy/Caddyfile:8-9 and :20-21 route /api/* to the backends. The frontend nginx is never the /api entry in the compose setup. Only a standalone nginx run breaks. Low (documentation / standalone).
- UFA-09 (Low, confirmed): nginx/default.conf has no security headers and no server_tokens off. Caddy headers not checked.
- UFA-10 (agy Medium -> Low): no explicit Cache-Control for index.html. Not verified.
- UFA-11 (Low, confirmed): frontend Dockerfile nginx image has no USER directive (official nginx master runs as root).
- UFA-12 (agy Medium -> Low): chatStore persists on every streamed token (useChatAgent.ts:147). Performance only.
- UFA-13 (Medium, confirmed): referrals.service.ts:88 returns refereeEmail to the referrer; ReferralPage.tsx:262 renders it. PII shown to another user.
- UFA-14 (Medium, confirmed): SessionRestoreWrapper.tsx:27-29 hard-redirects to /login on restore failure, including public pages.

## uf-account (UFA) — 14 findings, verified 2026-10-13
- UFA-01 (agy High -> Medium): SessionRestoreWrapper.tsx:19 calls /auth/refresh outside the api.ts mutex, so it can overlap with the interceptor's refresh. The backend grace period (auth.service.ts:195-225) keeps the family alive, so the "permanent revoke" claim is not supported. Fix: route restore through the same refresh coordinator.
- UFA-02 (agy High -> Low): queued requests replayed in api.ts:88-96 never get _retry, so each request can trigger at most one extra refresh (not a cascade). Fix: set _retry before queueing.
- UFA-03 (agy High -> Low): sse.ts:208-233 has its own refresh outside the mutex (same class as UFA-01). Guest case only changes the error text.
- UFA-04 (agy High -> Medium): auth.api.ts:57, :84, :100 log raw Axios errors via console.error. The error holds the request body, so the password is in the console. Self-visible, but leaks if error monitoring captures console. Fix: log message and status only.
- UFA-05 (agy High): REFUTED. useAuth.ts:55-56 (logout error path) and :62-63 (success path) call queryClient.clear(). Session expiry in api.ts:119-120 does a full reload. Login success does not clear the cache, but logout normally precedes login.
- UFA-06 (agy Medium -> Low): wishlist-storage persists in localStorage and survives logout (useWishlist.ts:46). Not sensitive.
- UFA-07 (agy Medium -> Low, confirmed): agent.api.ts:102-114 getTranscript/getMessages call GET /chatbot/threads/:id/messages. No such route in chatbot.controller.ts. No callers: dead code.
- UFA-08 (agy High -> refuted for deploy): compose.yaml runs a Caddy edge; deploy/caddy/Caddyfile:8-9 and :20-21 route /api/* to the backends. Only a standalone nginx run breaks. Low (documentation / standalone).
- UFA-09 (Low, confirmed): nginx/default.conf has no security headers and no server_tokens off. Caddy headers not checked.
- UFA-10 (agy Medium -> Low): no explicit Cache-Control for index.html. Not verified.
- UFA-11 (Low, confirmed): frontend Dockerfile nginx image has no USER directive (official nginx master runs as root).
- UFA-12 (agy Medium -> Low): chatStore persists on every streamed token (useChatAgent.ts:147). Performance only.
- UFA-13 (Medium, confirmed): referrals.service.ts:88 returns refereeEmail to the referrer; ReferralPage.tsx:262 renders it. PII shown to another user.
- UFA-14 (Medium, confirmed): SessionRestoreWrapper.tsx:27-29 hard-redirects to /login on restore failure, including public pages.

## ab-commerce (ABC) — 15 findings, verified 2026-10-13
- ABC-01 (agy High -> Medium): same exception-filter leak as UBP-03 (http-exception.filter.ts:34-37). Applies to both backends.
- ABC-02 (agy High -> Medium): UpdateVariantDto extends PartialType(CreateVariantDto) (update-variant.dto.ts:4) so stock is writable; products.service.ts:481-493 writes it with no StockMovement. Admin-only. Ledger desync; the admin product form does send stock.
- ABC-03 (agy High -> Medium): uploads.controller.ts:103-104 DELETE is @Roles(ADMIN), but deleteFile passes the client filePath to Cloudinary destroy with no folder-prefix check (uploads.service.ts:60-68). Any admin can delete any asset in the account. Defense-in-depth.
- ABC-04 (agy High -> Medium): confirmed. Transitions allow PAID->CANCELED and PACKING->CANCELED (orders.service.ts:906-920). paymentStatus is only changed for PAID/PACKING/SHIPPED and REFUNDED (orders.service.ts:601-606), so a cancelled order keeps paymentStatus COMPLETED. Admin-triggered.
- ABC-05 (agy High, KEPT): confirmed. Customer cancelOrder allows PAID (orders.service.ts:675-677) and writes paymentStatus FAILED (~line 690) although money was captured. No refund path in the code. Customer-reachable money inconsistency.
- ABC-06 (agy High -> Medium): confirmed. releaseCouponUsage runs only when the prior status is PENDING_PAYMENT (orders.service.ts:629-631 and :701-703). Coupon usage stays consumed after a PAID cancellation.
- ABC-07 (agy High -> Medium): confirmed. DELIVERED->REFUNDED restocks items (orders.service.ts:625-627). Correct only if goods come back; business-rule dependent.
- ABC-08 (agy Medium -> Low): initial stock on product/variant create has no StockMovement row (products.service.ts:324-334, :445-456). Ledger gap only.
- ABC-09 (Medium, confirmed): coupons.service.ts:121-135 update() has no maxUses >= usedCount check and no active-cart check. Admin-only.
- ABC-10 (agy Medium -> Low, confirmed): create-coupon.dto.ts code is only @IsString(); no trim or pattern. Spaces are stored.
- ABC-11 (agy High -> Medium, confirmed): products.service.ts:125-138 loads all matching products with variants, reviews and delivered items, then sorts and slices in memory for BEST_SELLING and RATING. Scaling risk.
- ABC-12 (agy Medium -> Low): low-stock list unbounded, admin-only (inventory.service.ts:139-145).
- ABC-13 (agy Medium -> Low): no index on ProductVariant.stock or Order.couponCode (schema.prisma:169-171, :244-248). Small tables today.
- ABC-14 (agy Low, confirmed): BadRequestException('Unauthorized') on orders and reviews (orders.service.ts:481-483, :668-670). Same class as UBP-13.
- ABC-15 (agy Low, confirmed): MIME-only upload filter (uploads.controller.ts:34-44), route is admin-only. Same class as UBP-09.
- Not checked by agy: admin frontend variant form and stock UX (see ABC-02).

## af-commerce (AFC) — 15 findings (retry run, SUCCESS), verified 2026-10-13
- AFC-01 (agy High -> Medium): same as UFA-04. Raw Axios error logged at auth.api.ts:57.
- AFC-02 (agy High -> Medium): same as UFA-01. SessionRestoreWrapper.tsx:19 refresh outside the mutex; grace period mitigates.
- AFC-03 (agy High -> Low): same as UFA-03. sse.ts refresh outside the mutex.
- AFC-04 (agy Medium -> Low): same as UFA-02 (_retry on queued replay).
- AFC-05 (agy Medium -> Low): api.ts:117-126 refresh failure does not clear the query cache, but it does window.location.href='/login' (full reload) unless already on /login. Edge case only.
- AFC-06 (agy Medium -> Low, confirmed unused): ORDER_STATUS (lib/constants.ts:15) has no references outside constants.ts. Dead constant with a key set that does not match the Prisma enum.
- AFC-07 (agy Medium -> Low, confirmed dead): authApi.register (auth.api.ts:62-64) calls /auth/register, but /register is not routed in admin router.tsx. The admin backend has no register route in the working tree (the user's uncommitted change). Remove together with that change.
- AFC-08 (agy Medium -> Low): orders.api.ts:19 unguarded JSON.parse. Same class as UFS-10.
- AFC-09 (Medium, confirmed): AdminChatbotPage listThreads() has no limit; backend default is 20 (chatbot.controller.ts:169 per agent). Older threads not reachable in UI.
- AFC-10 (agy Medium -> Low, dead): admin features/checkout is not routed (router.tsx has no checkout/cart route). Double-submit is unreachable.
- AFC-11 (agy Low -> refuted for /api): admin nginx has no /api proxy, but Caddy routes /api to admin-backend (deploy/caddy/Caddyfile:8-9). Headers: Low, same as UFA-09.
- AFC-12 (Low, confirmed): customer cart/checkout modules are in the admin bundle but not routed.
- AFC-13 (Low, confirmed): features/orders is dead customer code (not routed).
- AFC-14 (Low, confirmed): AccountPage navigates to /orders and /addresses, which are not in the admin router (NotFound).
- AFC-15 (Low, confirmed): admin Dockerfile uses npm install (not npm ci) and runs nginx as root. Same class as UBP-08 and UFA-11.
- Dead-code cluster: admin app carries customer modules (cart, checkout, orders, auth register, customer account links). Plan item: delete them.

## ab-chatbot (ABA) — 11 findings, verified 2026-10-13
- ABA-01 (agy High -> Medium): chatbot.controller.ts:41 is @Roles(ADMIN) at class level; tool handlers do not re-check ctx.role (agent.nodes.ts:233). Defense in depth. GUEST default (agent.nodes.ts:28) only applies when no ctx is passed.
- ABA-02 (agy High, KEPT): agent.runner.ts:456-458 returns on abort before the superstep commits, while handlers write directly (adjustStock). A retry of a still-pending confirm re-executes stock_remove, so stock is removed twice. Admin-triggered; needs a disconnect at the wrong moment. Fix: idempotency key per threadId + callId for write tools.
- ABA-03 (agy High -> Low): thread.service.ts remove() calls assertOwned(threadId, actor) first, so no IDOR. Race between isThreadRunning and delete remains (robustness).
- ABA-04 (Medium, confirmed): readTranscript drops assistant messages without text (agent.runner.ts:148-150), so the confirmation card does not come back after refresh. Thread can stall.
- ABA-05 (agy High -> Medium): orders.tools.ts:100-116 getOrderTool has no project(), unlike listOrdersTool (project at :97). Customer phone and address go to the third-party LLM and into agent_tool_logs (truncated). Privacy / compliance. checkoutKey is a client idempotency key, not a secret (agy overstated it).
- ABA-06 (agy High -> Medium, same class as ABC-02): update_variant accepts stock (catalog.tools.ts:296, :319) and writes it with no StockMovement.
- ABA-07 (Medium, confirmed by reading the loop): multi-tool batches run sequentially with no compensation (agent.nodes.ts:202-237). Partial state on failure.
- ABA-08 (Low, confirmed): @Throttle keyed by IP (chatbot.controller.ts:58, :102). Shared NAT can throttle other admins.
- ABA-09 (Low): SSE onClose aborts but does not close writer (chatbot.controller.ts:249-254). Ping timer continues.
- ABA-10 (Medium, confirmed): categories.service.ts:278 validateProductAssignment exists but create does not call it, so a category with products can get children (breaks the leaf-only rule).
- ABA-11 (Low, confirmed): audit.service.ts:84-86 stores resultSummary unredacted; only args are redacted.
- Agent's "no finding" areas accepted: SQL injection (no raw SQL in chatbot; reports.service groupBy is allowlisted); prompt injection bypassing confirm (requiresConfirmation enforced server-side); money math (integer schemas).

## af-features (AFF) — 13 findings, verified 2026-10-13
- AFF-01 (agy High -> Medium, confirmed): AdminProductFormPage.tsx:136-166 effect has categories in deps (:163). When categories load, name, description, basePrice, variants and images are reset from the product. Short window: only if the admin types before categories resolve.
- AFF-02 (agy High -> Medium, confirmed): CategoryTreeView.tsx:154-174 calls categoriesApi create/update/delete and fetchTree(), with no invalidateQueries. Admin useCategories has staleTime 30 min (features/admin/hooks/useCategories.ts:9), so other category selects can show deleted or old categories.
- AFF-03 (agy High -> Low, confirmed): AdminOrderDetailPage.tsx:54-57 JSON.parse in render with no try/catch. Crash only on malformed addressJson, which the server writes. Same class as UFS-10 and AFC-08.
- AFF-04 (agy Medium -> Low): uncontrolled Select defaultValue (AdminOrdersPage.tsx:303-306) keeps the rejected status shown after a failed update.
- AFF-05 (Medium, accepted): status dropdown offers all statuses; backend rejects invalid transitions (validateStatusTransition) with a generic toast (AdminOrdersPage.tsx:70-87, :112-114).
- AFF-06 (Medium, accepted): statusFilter change does not reset page (AdminOrdersPage.tsx:185).
- AFF-07 (Medium, accepted): basePrice schema z.number().min(0) allows fractions and 0; backend CreateProductDto requires an integer.
- AFF-08 (Medium, accepted): images not in productFormSchema, so products can be saved with images: [].
- AFF-09 (agy Medium -> Low): useToast returns a new object each render; effect with toast in deps can repeat the error toast.
- AFF-10 (Low, accepted): ImageUpload has no client-side size or MIME checks.
- AFF-11 (Low, accepted): no in-flight guard on product delete.
- AFF-12 (Low, accepted): product mutations do not invalidate the admin dashboard-stats key.
- AFF-13 (Low, accepted): line total is recomputed as unitPrice * quantity instead of lineTotal (AdminOrderDetailPage.tsx:185).
- Clean (agy): no dangerouslySetInnerHTML in common components; no tokens in localStorage or URL; backend controllers use @Roles(ADMIN). Layout-level RequireAuth + RequireAdmin wraps /admin (router.tsx:41-47).

## ub-chatbot (UBA) — 13 findings, verified 2026-10-13
- UBA-01 (agy High, KEPT): resume path drops clientContext. chatbot.controller.ts:107 attaches it only on the stream turn; agent-resume.dto.ts has no clientContext. After confirm, checkout reads ctx.clientContext?.cart (undefined), so it can order the server cart instead of the items the user confirmed. Conditional (client cart + non-empty server cart), but a money-correctness bug.
- UBA-02 (agy High -> Medium, confirmed): orders.service.ts:4-41 sets cartId and cartItemIds only in the server-cart branch. With explicit items, cart items are not deleted after checkout (cart cleanup at orders.service.ts:~370-382 needs cartItemIds).
- UBA-03 (agy High -> Medium, confirmed): checkoutKey is optional (checkout.dto.ts:114-117) and the service only dedupes when it is set (orders.service.ts:16). Chatbot checkout sends none. Same at-least-once class as ABA-02. Fix: deterministic key from threadId + tool call id.
- UBA-04 (agy High -> Low): guest thread without x-chat-session has sessionKeyHash null, and assertOwned rejects it on later turns (thread.service.ts:29-54). API-misuse edge; check that the frontend always sends the header.
- UBA-05 (agy High -> Medium, unverified at runtime): a plain message on an interrupted thread (agent.runner.ts:194-196 builds HumanMessage, not Command). Claimed "permanent wedge" not tested. Needs a runtime check.
- UBA-06 (agy High -> Medium, confirmed): account.tools.ts:400 project = projectList(result) with no masking; referee emails go to the LLM provider. The UI already shows them to the referrer (UFA-13).
- UBA-07 (Medium, confirmed): checkout tool addressId optional (orders.tools.ts:106), and the service throws when neither addressId nor address is given (orders.service.ts:160). LLM calls without addressId fail.
- UBA-08 (agy Medium -> Low): legacy POST /messages returns pendingConfirm with no resume route. Legacy only.
- UBA-09 (Medium, confirmed): thread.service.ts:73-82 deletes agentToolLog rows for the thread, so a user can erase the audit trail of their own tool actions.
- UBA-10 (agy Medium -> Low): cart_clear risk WRITE skips confirmation for USER (confirm-policy.ts:24-26). Cart is client-side and recoverable.
- UBA-11 (Low, accepted): no retention or TTL for checkpoints and agent_threads.
- UBA-12 (Low, accepted): tool_start is emitted before confirm (agent.runner.ts:534-541).
- UBA-13 (Medium, confirmed with UFA-07): getThread returns no messages, and readTranscript is not exposed. Past chats cannot be reloaded; the frontend calls a route that does not exist.

## ub-commerce (UBC) — 13 findings, verified 2026-10-13
- UBC-01 (agy High -> Medium): orders.service.ts:59 couponCode starts null; set only from the server-cart branch (:107). Explicit items drop the coupon. checkout.dto.ts has no couponCode, and the web cart/checkout has no coupon UI (grep found none). Real only for the chatbot checkout, which passes couponCode and gets it silently dropped.
- UBC-02 (agy High -> Medium): assertCheckoutMatchesOrder does not compare shippingMethod or couponCode. Web fingerprint includes shippingMethod (CheckoutPage.tsx:82-83), so web is protected client-side. API clients are not.
- UBC-03 (agy Medium -> Low): client fingerprint lacks coupon, but web has no coupon input, so no effect today.
- UBC-04 (agy High, KEPT, latent): payments.service.ts:45 checks only paymentStatus !== PENDING. There is no order.status check (grep). Admin cancel leaves paymentStatus PENDING (orders.service.ts updateOrderStatus), so createPayment accepts a canceled order. Gateway is mocked today; must be fixed before go-live.
- UBC-05 (agy High, KEPT; consolidated): same as ABC-05 and ABC-06 for the user backend. PAID cancel sets paymentStatus FAILED, skips coupon release, and issues no refund. One work package for both backends.
- UBC-06 (agy High -> Low): cart.service.ts:227 checks minOrder when applying a coupon, and orders.service.ts:229 re-checks at checkout, so an under-minimum order is rejected. Only the API cart total display is wrong.
- UBC-07 (Medium, accepted): getMyCouponsFromReferral filters referrerId only (referrals.service.ts:103), so referees see no welcome coupon.
- UBC-08 (agy High, KEPT): referral rewards issued at registration (referrals.service.ts:184 createReferralCoupon). Coupon model has no userId (schema.prisma:174-183). Fake-account reward farming; any holder of a REF-ER code can redeem. Fix: issue after first DELIVERED/PAID order and bind to the referrer.
- UBC-09 (Medium): in-memory ranking for best_selling and rating, same as ABC-11.
- UBC-10 (Medium): error message leak, same as UBP-03 and ABC-01.
- UBC-11 (Low): Order.couponCode index, same as ABC-13.
- UBC-12 (Medium, confirmed): payments.service.ts:106-115 refundPayment sets REFUNDED directly. No updateOrderStatus and no restoreStockForOrder, so stock is not returned on this refund path (the admin REFUNDED path does restock, ABC-07). Inconsistent.
- UBC-13 (Low, accepted): nested shippingAddress not compared on replay, so a valid retry gets 409.
- Area notes accepted: shipping math is integer; ownership checks on cart, orders, payments; stock decrement uses conditional updateMany inside a serializable transaction (orders.service.ts:311-323).

## ab-platform-a (ABPA) — 14 findings, verified 2026-10-13 (run on gemini-3.8-flash-high)
- ABPA-01 (agy High -> Medium, confirmed by reading): admin auth.service.ts refresh() does not check the role before rotating tokens (the only role check is in login, line 51). A customer refresh token is re-issued with role CUSTOMER, so there is no privilege escalation by itself. It becomes a customer session on the admin backend when both backends share the refresh secret value (not verified, .env not read).
- ABPA-02 (agy High -> Medium, unverified values): admin and user .env.example use the same variable names (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET) and neither sets iss or aud. Whether the values are equal is not verified. Fix: separate ADMIN_* secrets with boot-time validation, plus iss and aud.
- ABPA-03 (agy High -> Medium, confirmed): common/guards/roles.guard.ts:16-18 returns true when no @Roles metadata is present (default allow). Any authenticated token passes handlers without @Roles.
- ABPA-04 (agy High -> Low, confirmed): users.controller.ts:13 has no @Roles. The handlers only read and write the caller's own profile and addresses. Scope issue, merged with ABPB-10.
- ABPA-05 (Medium, dup UBP-03): http-exception.filter.ts:34-37 leaks raw messages.
- ABPA-06 (Medium, confirmed): auth.service.ts:40-54 checks the password before the role. The "Tài khoản không có quyền quản trị" message is returned only after the password is verified, so it reveals that a customer's password is correct (password oracle). Fix: check role and password with one generic error.
- ABPA-07 (Medium, dup UBP-06): no per-route throttle on admin login.
- ABPA-08 (Medium, dup UBP-12): forgot-password sends no email. Email decision: Gmail SMTP.
- ABPA-09 (Low, dup UBP-07): Swagger unconditional (main.ts:88).
- ABPA-10 (Low, dup UBP-08): Dockerfile runs as root.
- ABPA-11 (Low, dup UBP-05): CsrfGuard skips @Public handlers (refresh and logout).
- ABPA-12 (Low, new, confirmed): JwtRefreshStrategy extracts from the body field, but refresh tokens come from cookies. Dead provider.
- ABPA-13 (Low, dup UBP-10): no index on Address.userId.
- ABPA-14 (Low, dup UBP-04): email has no index or unique constraint.
- Uncommitted diff (user work in progress): removes RegisterDto, register() and POST /auth/register. The agent found no defect on the changed lines. Not touched by the fix branch (see plan section 11, decision 6).
- Not verified: clock drift between instances for the 30 s grace period; runtime effect of the duplicate ConfigModule.forRoot.

## ab-platform-b (ABPB) — 10 findings, verified 2026-10-13
- ABPB-01 (agy High -> Medium, dup ABA-10): categories.service.ts validateParentCategory does not reject a parent that already has products (create and update). Breaks the leaf-only rule.
- ABPB-02 (agy High -> Medium, confirmed logic): admin.service.ts:167-169 uses new Date() then setMonth(getMonth() - i). On day 29-31 the month overflows, so labels and ranges are wrong on those days.
- ABPB-03 (Medium, confirmed): admin.service.ts:183-186 uses server local time, not UTC+7, for month boundaries. lastDayOfLastMonth uses lte 23:59:59 and misses the last second.
- ABPB-04 (Medium, confirmed): admin.service.ts:313-332 runs an unbounded groupBy over all delivered order items on every dashboard load.
- ABPB-05 (agy Medium -> Low, dup ABC-13 class): low-stock findMany with no index on ProductVariant.stock.
- ABPB-06 (agy Medium -> Low): getDescendantIds makes one query per child (N+1). Category trees are small.
- ABPB-07 (Medium, confirmed): categories.service.ts:153-160 checks and deletes in two steps with no transaction. A P2003 error reaches HttpExceptionFilter and leaks table details (see UBP-03).
- ABPB-08 (Low, confirmed): CreateCategoryDto name has only @IsString(). An empty slug can be stored.
- ABPB-09 (Low, confirmed): reports.service.ts:237-263 sorts and slices top products in memory (same class as ABC-11).
- ABPB-10 (agy High -> Medium, confirmed exposure): admin OrdersController (checkout, my orders, cancel), CouponsController.validateCoupon, UsersController and ReviewsController customer handlers have no @Roles. Default-allow RolesGuard (ABPA-03) lets any authenticated token through. Severity is High only if the two backends share the JWT secret values (ABPA-02, unverified). Admin FE uses /users/me and /users/addresses (active). /orders/my* and /orders/checkout are called only from unrouted features (orders, checkout, see AFC-12 and AFC-13). Fix: @Roles(ADMIN) at class level for admin controllers, and remove the customer-only handlers from the admin backend.
