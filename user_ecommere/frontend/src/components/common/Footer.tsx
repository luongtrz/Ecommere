import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Newsletter Section */}
      <div className="gradient-primary">
        <div className="container py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              Nhan uu dai doc quyen
            </h3>
            <p className="text-blue-100 mb-6">
              Dang ky nhan tin de khong bo lo cac chuong trinh khuyen mai hap dan
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email cua ban..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
              >
                Dang ky
              </button>
            </form>
          </div>
        </div>
      </div>

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
                Cung cap chai xit Thai Lan chinh hang voi da dang mui huong va dung tich. Chat luong dam bao 100%.
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
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Lien ket nhanh</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/catalog" className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200">
                    San pham
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200">
                    Gioi thieu
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200">
                    Lien he
                  </Link>
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Chinh sach</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/policy/shipping" className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200">
                    Van chuyen
                  </Link>
                </li>
                <li>
                  <Link to="/policy/return" className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200">
                    Doi tra
                  </Link>
                </li>
                <li>
                  <Link to="/policy/privacy" className="text-sm text-gray-400 hover:text-white hover:pl-1 transition-all duration-200">
                    Bao mat
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Lien he</h4>
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
                  <span>TP. Ho Chi Minh, Viet Nam</span>
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
              &copy; 2026 Thai Spray Shop. Tat ca quyen duoc bao luu.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Link to="/policy/privacy" className="hover:text-white transition-colors">Bao mat</Link>
              <span className="text-gray-700">|</span>
              <Link to="/policy/terms" className="hover:text-white transition-colors">Dieu khoan</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
