import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';

export function RegisterPage() {
  const { register, isRegisterLoading } = useAuth();

  return (
    <>
      <SEO title="Đăng ký" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Đăng ký</CardTitle>
          <CardDescription>Tạo tài khoản mới để bắt đầu mua sắm</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm onSubmit={(data) => register(data)} isLoading={isRegisterLoading} />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
