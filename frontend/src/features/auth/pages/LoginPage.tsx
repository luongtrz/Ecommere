import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import { Sprout, ShoppingBag } from 'lucide-react';

export function LoginPage() {
  const { login, isLoginLoading } = useAuth();

  return (
    <>
      <SEO title="Đăng nhập" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo/Brand Section */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg">
              <Sprout className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Thai Spray Shop
            </h1>
            <p className="text-gray-600">
              Nước hoa xịt thơm chất lượng cao
            </p>
          </div>

          {/* Login Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="font-semibold">Đăng nhập</span>
                </div>
              </div>
              <CardDescription className="text-center text-gray-600">
                Đăng nhập để tiếp tục mua sắm và quản lý đơn hàng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LoginForm onSubmit={(data) => login(data)} isLoading={isLoginLoading} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Chưa có tài khoản?
                  </span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 Thai Spray Shop. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </div>
    </>
  );
}
