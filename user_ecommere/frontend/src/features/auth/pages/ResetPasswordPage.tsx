import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import type { ResetPasswordInput } from '@/lib/validators';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, isResetPasswordLoading, resetPasswordError } = useAuth();

  const isTokenMissing = !token || !token.trim();

  const handleSubmit = (data: ResetPasswordInput) => {
    if (!token) return;
    resetPassword({ token: token.trim(), newPassword: data.newPassword });
  };

  return (
    <>
      <SEO title="Đặt lại mật khẩu" />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-foreground rounded-lg mb-3">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Đặt lại mật khẩu</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isTokenMissing
                ? 'Liên kết đặt lại mật khẩu'
                : 'Nhập mật khẩu mới cho tài khoản của bạn'}
            </p>
          </div>

          {/* Reset Password Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {isTokenMissing ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertDescription>
                      Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực.
                    </AlertDescription>
                  </Alert>

                  <Link
                    to="/forgot-password"
                    className="block text-center text-sm font-medium text-primary hover:underline"
                  >
                    Yêu cầu liên kết mới
                  </Link>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">
                        hoặc
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/login"
                    className="block text-center text-sm font-medium text-muted-foreground hover:underline"
                  >
                    Quay lại đăng nhập
                  </Link>
                </div>
              ) : (
                <>
                  {resetPasswordError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {Array.isArray(resetPasswordError.response?.data?.message)
                          ? resetPasswordError.response?.data?.message.join(', ')
                          : (resetPasswordError.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại.')}
                      </AlertDescription>
                    </Alert>
                  )}

                  <ResetPasswordForm onSubmit={handleSubmit} isLoading={isResetPasswordLoading} />

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">
                        Nhớ lại mật khẩu?
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/login"
                    className="block text-center text-sm font-medium text-primary hover:underline"
                  >
                    Quay lại đăng nhập
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default ResetPasswordPage;
