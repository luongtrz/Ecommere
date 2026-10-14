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
    <footer className="mt-20 border-t border-slate-200/80 bg-slate-950 text-slate-300">
      {/* Top Value Propositions */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">100% Chính Hãng</h4>
                <p className="text-xs text-slate-400 mt-0.5">Cam kết hàng Thái Lan nội địa</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Giao Hàng Toàn Quốc</h4>
                <p className="text-xs text-slate-400 mt-0.5">Đóng gói chống sốc an toàn</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Đổi Trả 7 Ngày</h4>
                <p className="text-xs text-slate-400 mt-0.5">Miễn phí nếu vỡ hoặc lỗi tem</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Kiểm Tra Hàng</h4>
                <p className="text-xs text-slate-400 mt-0.5">Đồng kiểm trước khi thanh toán</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-extrabold shadow-lg shadow-teal-500/20">
                TS
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white block">
                  Thai <span className="text-teal-400">Spray</span>
                </span>
                <span className="text-[11px] text-teal-300/80 uppercase tracking-widest font-medium">Hàng Thái Chính Hãng</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Chuyên phân phối sỉ &amp; lẻ các dòng chai xịt gia dụng, xịt côn trùng, tẩy rửa sinh học và tinh dầu thơm phòng nhập khẩu trực tiếp từ Thái Lan.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-950/60 border border-teal-800/40 px-3 py-1 text-xs text-teal-300">
                <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                Hàng Chuẩn Nội Địa
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/40 border border-amber-800/40 px-3 py-1 text-xs text-amber-300">
                Giá Tốt Nhất Thị Trường
              </span>
            </div>
          </div>

          {/* Catalog Categories */}
          <div>
            <h4 className="mb-4 text-base font-semibold text-white">Danh Mục Sản Phẩm</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              {shoppingLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition-colors hover:text-teal-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="mb-4 text-base font-semibold text-white">Hỗ Trợ Khách Hàng</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              {policyLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition-colors hover:text-teal-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="mb-4 text-base font-semibold text-white">Thông Tin Liên Hệ</h4>
            <ul className="space-y-3.5 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <Phone className="mt-1 h-4 w-4 shrink-0 text-teal-400" />
                <div>
                  <span className="block text-white font-medium">0987.654.321</span>
                  <span className="text-xs text-slate-500">Hỗ trợ tư vấn Zalo / Hotline (8h - 22h)</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-1 h-4 w-4 shrink-0 text-teal-400" />
                <span>cskh@thaispray.shop</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-teal-400" />
                <span>Kho tổng: 128 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh (Giao toàn quốc)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-slate-800/80 bg-black/40">
        <div className="container mx-auto px-4 py-5 flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Thai Spray Việt Nam - Chuyên Hàng Gia Dụng &amp; Chai Xịt Thái Lan Cao Cấp.</p>
          <div className="flex items-center gap-5">
            <Link to="/policy/privacy" className="hover:text-slate-400 transition-colors">Bảo mật</Link>
            <Link to="/policy/terms" className="hover:text-slate-400 transition-colors">Điều khoản</Link>
            <span className="text-emerald-500 font-medium flex items-center gap-1.5">
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
