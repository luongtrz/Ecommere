import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">TS</span>
              </div>
              <span className="font-bold text-foreground">Thai Spray</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Chai xịt Thái Lan chính hãng. Đa dạng mùi hương, chất lượng 100%.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-medium text-foreground mb-3 text-sm">Liên kết</h4>
            <ul className="space-y-2">
              <li><Link to="/catalog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sản phẩm</Link></li>
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Giới thiệu</Link></li>
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Liên hệ</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-medium text-foreground mb-3 text-sm">Chính sách</h4>
            <ul className="space-y-2">
              <li><Link to="/policy/shipping" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Vận chuyển</Link></li>
              <li><Link to="/policy/return" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Đổi trả</Link></li>
              <li><Link to="/policy/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Bảo mật</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium text-foreground mb-3 text-sm">Liên hệ</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>0123 456 789</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span>contact@thaispray.com</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">&copy; 2026 Thai Spray Shop</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/policy/privacy" className="hover:text-foreground transition-colors">Bảo mật</Link>
            <Link to="/policy/terms" className="hover:text-foreground transition-colors">Điều khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
