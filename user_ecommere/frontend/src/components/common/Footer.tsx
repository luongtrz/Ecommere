import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Sparkles } from 'lucide-react';

const shoppingLinks = [
  { to: '/catalog', label: 'Toàn bộ sản phẩm' },
  { to: '/catalog?sort=best_selling', label: 'Bán chạy nhất' },
  { to: '/search?q=x%E1%BB%8Bt%20ph%C3%B2ng', label: 'Xịt phòng được yêu thích' },
];

const policyLinks = [
  { to: '/policy/shipping', label: 'Chính sách vận chuyển' },
  { to: '/policy/return', label: 'Đổi trả và hoàn tiền' },
  { to: '/policy/privacy', label: 'Bảo mật thông tin' },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-white/60 bg-foreground text-white">
      <div className="container py-12">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-bold text-foreground">
                TS
              </div>
              <div>
                <p className="text-lg font-semibold">Thai Spray</p>
                <p className="text-sm text-white/65">Hương thơm tinh tế cho nhà ở và nhịp sống hiện đại.</p>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/72">
              Chúng tôi chọn những dòng xịt thơm, body mist và hương phòng dễ dùng mỗi ngày, mùi sạch,
              gọn và không tạo cảm giác nồng gắt.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80">
                <Sparkles className="h-4 w-4" />
                Tư vấn mùi theo không gian sử dụng
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80">
                <Sparkles className="h-4 w-4" />
                Đề xuất theo ngân sách và dung tích
              </span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h4 className="mb-4 text-base font-semibold">Mua sắm</h4>
            <ul className="space-y-3 text-sm text-white/72">
              {shoppingLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="mb-4 mt-8 text-base font-semibold">Chính sách</h4>
            <ul className="space-y-3 text-sm text-white/72">
              {policyLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h4 className="mb-4 text-base font-semibold">Liên hệ</h4>
            <ul className="space-y-4 text-sm text-white/72">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                <span>0123 456 789</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                <span>noreply@thaispray.shop</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                <span>TP. Hồ Chí Minh, giao nhanh nội thành và hỗ trợ tư vấn online toàn quốc.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-4 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 Thai Spray. Không gian sống có mùi hương riêng.</p>
          <div className="flex items-center gap-4">
            <Link to="/policy/privacy" className="transition hover:text-white">Bảo mật</Link>
            <Link to="/policy/terms" className="transition hover:text-white">Điều khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
