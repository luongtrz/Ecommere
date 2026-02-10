import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Main Footer */}
      <div className="bg-gray-900 text-gray-300">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TS</span>
                </div>
                <span className="text-xl font-bold text-white">Thai Spray</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Cung cấp chai xịt Thái Lan chính hãng với đa dạng mùi hương và dung tích. Chất lượng đảm bảo 100%.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-blue-600 transition-colors duration-300">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 transition-all duration-300">
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Liên kết nhanh</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/catalog" className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200">
                    Sản phẩm
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200">
                    Giới thiệu
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200">
                    Liên hệ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Chính sách</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/policy/shipping" className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200">
                    Vận chuyển
                  </Link>
                </li>
                <li>
                  <Link to="/policy/return" className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200">
                    Đổi trả
                  </Link>
                </li>
                <li>
                  <Link to="/policy/privacy" className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200">
                    Bảo mật
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Liên hệ</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-400">
                  <Phone className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                  <span>0123 456 789</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-400">
                  <Mail className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                  <span>contact@thaispray.com</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-400">
                  <MapPin className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                  <span>TP. Hồ Chí Minh, Việt Nam</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-400">
                  <Clock className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                  <span>8:00 - 22:00, T2 - CN</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800">
          <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              &copy; 2026 Thai Spray Shop. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Link to="/policy/privacy" className="hover:text-white transition-colors">Bảo mật</Link>
              <span className="text-gray-700">|</span>
              <Link to="/policy/terms" className="hover:text-white transition-colors">Điều khoản</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
