import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Thai Spray Shop</h3>
            <p className="text-sm text-muted-foreground">
              Cung cấp chai xịt Thái Lan chính hãng với đa dạng mùi hương và dung tích.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Liên kết</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/catalog" className="hover:text-primary">Sản phẩm</Link></li>
              <li><Link to="/about" className="hover:text-primary">Giới thiệu</Link></li>
              <li><Link to="/contact" className="hover:text-primary">Liên hệ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Chính sách</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/policy/shipping" className="hover:text-primary">Vận chuyển</Link></li>
              <li><Link to="/policy/return" className="hover:text-primary">Đổi trả</Link></li>
              <li><Link to="/policy/privacy" className="hover:text-primary">Bảo mật</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>0123 456 789</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>contact@thaispray.com</span>
              </li>
            </ul>
            <div className="flex gap-4 mt-4">
              <a href="#" className="hover:text-primary"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-primary"><Instagram className="h-5 w-5" /></a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Thai Spray Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
