import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import { Sprout, UserPlus } from 'lucide-react';

export function RegisterPage() {
  const { register, isRegisterLoading } = useAuth();

  return (
    <>
      <SEO title="Đăng ký" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo/Brand Section */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4 shadow-lg">
              <Sprout className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Thai Spray Shop
            </h1>
            <p className="text-gray-600">
              Tham gia cộng đồng người yêu nước hoa
            </p>
          </div>

          {/* Register Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-2 text-purple-600">
                  <UserPlus className="h-5 w-5" />
                  <span className="font-semibold">Đăng ký tài khoản</span>
                </div>
              </div>
              <CardDescription className="text-center text-gray-600">
                Tạo tài khoản để khám phá bộ sưu tập nước hoa xịt thơm của chúng tôi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RegisterForm onSubmit={(data) => register(data)} isLoading={isRegisterLoading} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Đã có tài khoản?
                  </span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors duration-200"
                >
                  Đăng nhập ngay
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
