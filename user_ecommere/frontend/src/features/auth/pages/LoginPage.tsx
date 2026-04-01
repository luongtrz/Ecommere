import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';

export function LoginPage() {
  const { login, isLoginLoading } = useAuth();

  return (
    <>
      <SEO title="Đăng nhập" />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-foreground rounded-lg mb-3">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Đăng nhập</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Nhập số điện thoại để tiếp tục
            </p>
          </div>

          {/* Login Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <LoginForm onSubmit={(data) => login(data)} isLoading={isLoginLoading} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">
                    Chưa có tài khoản?
                  </span>
                </div>
              </div>

              <Link
                to="/register"
                className="block text-center text-sm font-medium text-primary hover:underline"
              >
                Đăng ký ngay
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
