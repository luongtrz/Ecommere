import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ShieldCheck, Truck, RefreshCw, CheckCircle2 } from 'lucide-react';

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
    <footer className="mt-16 md:mt-24 border-t border-border bg-primary text-primary-foreground">
      {/* Top Value Propositions */}
      <div className="border-b border-primary-foreground/15 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary-foreground/80" />
              <div>
                <h4 className="font-medium text-sm text-primary-foreground">100% Chính Hãng</h4>
                <p className="text-xs text-primary-foreground/80 mt-0.5">Cam kết hàng Thái Lan nội địa</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 shrink-0 text-primary-foreground/80" />
              <div>
                <h4 className="font-medium text-sm text-primary-foreground">Giao Hàng Toàn Quốc</h4>
                <p className="text-xs text-primary-foreground/80 mt-0.5">Đóng gói chống sốc an toàn</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 shrink-0 text-primary-foreground/80" />
              <div>
                <h4 className="font-medium text-sm text-primary-foreground">Đổi Trả 7 Ngày</h4>
                <p className="text-xs text-primary-foreground/80 mt-0.5">Miễn phí nếu vỡ hoặc lỗi tem</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary-foreground/80" />
              <div>
                <h4 className="font-medium text-sm text-primary-foreground">Kiểm Tra Hàng</h4>
                <p className="text-xs text-primary-foreground/80 mt-0.5">Đồng kiểm trước khi thanh toán</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground font-bold">
                TS
              </div>
              <div>
                <span className="text-xl font-bold text-primary-foreground block">
                  Thai <span className="text-accent">Spray</span>
                </span>
                <span className="text-xs text-primary-foreground/80 font-medium">Hàng Thái Chính Hãng</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              Chuyên phân phối sỉ &amp; lẻ các dòng chai xịt gia dụng, xịt côn trùng, tẩy rửa sinh học và tinh dầu thơm phòng nhập khẩu trực tiếp từ Thái Lan.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-sm border border-primary-foreground/20 px-2.5 py-1 text-xs text-primary-foreground/80">
                Hàng Chuẩn Nội Địa
              </span>
              <span className="inline-flex items-center rounded-sm border border-primary-foreground/20 px-2.5 py-1 text-xs text-primary-foreground/80">
                Giá Tốt Nhất Thị Trường
              </span>
            </div>
          </div>

          {/* Catalog Categories */}
          <div>
            <h3 className="text-sm font-semibold text-primary-foreground mb-4">
              Danh Mục Sản Phẩm
            </h3>
            <ul className="space-y-1 text-sm text-primary-foreground/80">
              {shoppingLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="min-h-11 py-2.5 flex items-center transition-colors hover:text-primary-foreground hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-sm font-semibold text-primary-foreground mb-4">
              Hỗ Trợ Khách Hàng
            </h3>
            <ul className="space-y-1 text-sm text-primary-foreground/80">
              {policyLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="min-h-11 py-2.5 flex items-center transition-colors hover:text-primary-foreground hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-semibold text-primary-foreground mb-4">
              Thông Tin Liên Hệ
            </h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li className="flex items-start gap-3">
                <Phone className="mt-2.5 h-5 w-5 shrink-0 text-primary-foreground/80" />
                <div className="min-h-11 flex flex-col justify-center">
                  <a
                    href="tel:0987654321"
                    className="inline-block text-primary-foreground font-medium tabular hover:underline transition-colors focus-visible:underline"
                  >
                    0987.654.321
                  </a>
                  <span className="text-xs text-primary-foreground/80">Hỗ trợ tư vấn Zalo / Hotline (8h - 22h)</span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-primary-foreground/80" />
                <a
                  href="mailto:cskh@thaispray.shop"
                  className="min-h-11 py-2.5 flex items-center hover:text-primary-foreground hover:underline transition-colors"
                >
                  cskh@thaispray.shop
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-2.5 h-5 w-5 shrink-0 text-primary-foreground/80" />
                <span className="min-h-11 py-2.5 flex items-center text-primary-foreground/80">
                  Kho tổng: 128 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh (Giao toàn quốc)
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-primary-foreground/15">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-2 text-xs text-primary-foreground/80 sm:flex-row sm:items-center sm:justify-between">
          <p className="tabular">&copy; {new Date().getFullYear()} Thai Spray Việt Nam - Chuyên Hàng Gia Dụng &amp; Chai Xịt Thái Lan Cao Cấp.</p>
          <div className="flex items-center gap-6">
            <Link
              to="/policy/privacy"
              className="min-h-11 py-2.5 inline-flex items-center hover:text-primary-foreground hover:underline transition-colors"
            >
              Bảo mật
            </Link>
            <Link
              to="/policy/terms"
              className="min-h-11 py-2.5 inline-flex items-center hover:text-primary-foreground hover:underline transition-colors"
            >
              Điều khoản
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
