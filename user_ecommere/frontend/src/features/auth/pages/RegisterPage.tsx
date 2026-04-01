import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';

export function RegisterPage() {
  const { register, isRegisterLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';

  return (
    <>
      <SEO title="Đăng ký" />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-foreground rounded-lg mb-3">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Tạo tài khoản</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Đăng ký để bắt đầu mua sắm
            </p>
          </div>

          {/* Referral notice */}
          {referralCode && (
            <div className="bg-muted border rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-foreground">
                Bạn được mời bởi một người bạn
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mã: <span className="font-mono font-medium">{referralCode}</span>
              </p>
            </div>
          )}

          {/* Register Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <RegisterForm
                onSubmit={(data) => register(data)}
                isLoading={isRegisterLoading}
                defaultReferralCode={referralCode}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">
                    Đã có tài khoản?
                  </span>
                </div>
              </div>

              <Link
                to="/login"
                className="block text-center text-sm font-medium text-primary hover:underline"
              >
                Đăng nhập ngay
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
