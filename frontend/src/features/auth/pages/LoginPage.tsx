import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';

export function LoginPage() {
  const { login, isLoginLoading } = useAuth();

  return (
    <>
      <SEO title="Đăng nhập" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Đăng nhập</CardTitle>
          <CardDescription>Đăng nhập để tiếp tục mua sắm</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSubmit={(data) => login(data)} isLoading={isLoginLoading} />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
