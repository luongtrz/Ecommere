import { Card, CardContent } from '@/components/ui/card';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';

export function LoginPage() {
  const { login, isLoginLoading } = useAuth();

  return (
    <>
      <SEO title="Đăng nhập - Admin" />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-foreground rounded-lg mb-3">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Đăng nhập để quản trị hệ thống
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <LoginForm onSubmit={(data) => login(data)} isLoading={isLoginLoading} />

            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
