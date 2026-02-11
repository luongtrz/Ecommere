import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import { ShoppingBag } from 'lucide-react';

export function LoginPage() {
  const { login, isLoginLoading } = useAuth();

  return (
    <>
      <SEO title="Đăng nhập" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 -right-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-100/20 rounded-full blur-3xl" />

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Logo/Brand Section */}
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-xl shadow-blue-500/20">
              <span className="text-white font-bold text-xl">TS</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Thai Spray Shop
            </h1>
            <p className="text-gray-500">
              Nước hoa xịt thơm chất lượng cao
            </p>
          </div>

          {/* Login Card */}
          <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-xl rounded-2xl animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="font-semibold">Đăng nhập</span>
                </div>
              </div>
              <CardDescription className="text-center text-gray-500">
                Đăng nhập bằng số điện thoại để tiếp tục mua sắm và quản lý đơn hàng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LoginForm onSubmit={(data) => login(data)} isLoading={isLoginLoading} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/70 px-2 text-gray-400">
                    Chưa có tài khoản?
                  </span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-200"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-400 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <p>&copy; 2026 Thai Spray Shop. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </div>
    </>
  );
}
