import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ShieldCheck, Truck, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

const shoppingLinks = [
  { to: '/catalog', label: 'Tất cả sản phẩm' },
  { to: '/catalog?sort=best_selling', label: 'Sản phẩm bán chạy' },
  { to: '/catalog?category=diet-con-trung', label: 'Xịt diệt côn trùng Thái Lan' },
  { to: '/catalog?category=tay-rua-nha-bep', label: 'Tẩy rửa & Vệ sinh nhà cửa' },
  { to: '/catalog?category=thom-phong', label: 'Xịt thơm & Khử mùi phòng' },
];

const policyLinks = [
  { to: '/policy/shipping', label: 'Chính sách vận chuyển siêu tốc' },
  { to: '/policy/return', label: 'Chính sách đổi trả 7 ngày' },
  { to: '/policy/privacy', label: 'Chính sách bảo mật thông tin' },
  { to: '/policy/terms', label: 'Điều khoản sử dụng dịch vụ' },
];

export function Footer() {
  return (
    <footer className="mt-16 md:mt-24 border-t border-border/80 bg-card text-card-foreground">
      {/* Top Value Propositions */}
      <div className="border-b border-border/60 bg-secondary/30 py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-sm transition-all duration-300 hover:shadow-luxury hover:-translate-y-0.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground border border-accent/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif font-semibold text-foreground text-sm">100% Chính Hãng</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Cam kết hàng Thái Lan nội địa</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-sm transition-all duration-300 hover:shadow-luxury hover:-translate-y-0.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground border border-accent/20">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif font-semibold text-foreground text-sm">Giao Hàng Toàn Quốc</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Đóng gói chống sốc an toàn</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-sm transition-all duration-300 hover:shadow-luxury hover:-translate-y-0.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground border border-accent/20">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif font-semibold text-foreground text-sm">Đổi Trả 7 Ngày</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Miễn phí nếu vỡ hoặc lỗi tem</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-sm transition-all duration-300 hover:shadow-luxury hover:-translate-y-0.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground border border-accent/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif font-semibold text-foreground text-sm">Kiểm Tra Hàng</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Đồng kiểm trước khi thanh toán</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links - Editorial 3-Column Layout */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 lg:gap-16">
          {/* Column 1: Brand Info & Values */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-serif text-sm font-bold shadow-md border border-primary/10">
                TS
              </div>
              <div>
                <span className="text-xl font-serif font-bold tracking-tight text-foreground block">
                  Thai Spray
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold block">
                  Hàng Thái Chính Hãng
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Chuyên phân phối sỉ &amp; lẻ các dòng chai xịt gia dụng, xịt côn trùng, tẩy rửa sinh học và tinh dầu thơm phòng nhập khẩu trực tiếp từ Thái Lan.
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary border border-border/80 px-3 py-1 text-xs text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Hàng Chuẩn Nội Địa
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary border border-border/80 px-3 py-1 text-xs text-foreground">
                Giá Tốt Nhất Thị Trường
              </span>
            </div>
          </div>

          {/* Column 2: Navigation & Policies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-6">
            <div>
              <h4 className="mb-4 font-serif text-base font-semibold text-foreground">Danh Mục Sản Phẩm</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {shoppingLinks.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition-colors hover:text-foreground">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-serif text-base font-semibold text-foreground">Hỗ Trợ Khách Hàng</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {policyLinks.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition-colors hover:text-foreground">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 3: Contact Details */}
          <div>
            <h4 className="mb-4 font-serif text-base font-semibold text-foreground">Thông Tin Liên Hệ</h4>
            <ul className="space-y-3.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Phone className="mt-1 h-4 w-4 shrink-0 text-accent-foreground" />
                <div>
                  <span className="block text-foreground font-medium">0987.654.321</span>
                  <span className="text-xs text-muted-foreground">Hỗ trợ tư vấn Zalo / Hotline (8h - 22h)</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-1 h-4 w-4 shrink-0 text-accent-foreground" />
                <span>cskh@thaispray.shop</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent-foreground" />
                <span className="leading-relaxed">Kho tổng: 128 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh (Giao toàn quốc)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-border/80 bg-secondary/30">
        <div className="container mx-auto px-4 py-5 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Thai Spray Việt Nam - Chuyên Hàng Gia Dụng &amp; Chai Xịt Thái Lan Cao Cấp.</p>
          <div className="flex items-center gap-5">
            <Link to="/policy/privacy" className="hover:text-foreground transition-colors">Bảo mật</Link>
            <Link to="/policy/terms" className="hover:text-foreground transition-colors">Điều khoản</Link>
            <span className="rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 px-2.5 py-0.5 font-medium flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Hệ thống hoạt động ổn định
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
