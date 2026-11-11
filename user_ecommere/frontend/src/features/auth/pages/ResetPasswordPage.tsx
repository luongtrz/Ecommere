import { Link, useSearchParams } from 'react-router-dom';
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

      <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground">
        {/* ================= LEFT COLUMN: Brand Panel ================= */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-primary text-primary-foreground">
          <div>
            <Link
              to="/"
              className="font-serif text-2xl tracking-tight text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Thai Spray
            </Link>
            <p className="mt-1 text-xs text-primary-foreground/70 uppercase tracking-wider">
              Hàng Thái Lan Chính Hãng
            </p>
          </div>

          <div className="max-w-md space-y-4">
            <h2 className="font-serif text-3xl xl:text-4xl leading-tight text-primary-foreground">
              Đặt lại mật khẩu
            </h2>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              {isTokenMissing
                ? 'Liên kết đặt lại mật khẩu'
                : 'Nhập mật khẩu mới cho tài khoản của bạn'}
            </p>
          </div>

          <div className="pt-6 border-t border-primary-foreground/15 text-xs text-primary-foreground/70">
            <span>Thai Spray</span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Form Column ================= */}
        <div className="flex min-h-screen flex-col justify-center items-center p-6 sm:p-10 lg:p-12 bg-background">
          <div className="w-full max-w-sm space-y-6">
            {/* Mobile Brand */}
            <div className="lg:hidden flex items-center justify-between">
              <Link to="/" className="font-serif text-xl tracking-tight text-foreground">
                Thai Spray
              </Link>
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Đăng nhập →
              </Link>
            </div>

            {/* Header */}
            <div className="space-y-1.5">
              <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground">
                Đặt lại mật khẩu
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTokenMissing
                  ? 'Liên kết đặt lại mật khẩu'
                  : 'Nhập mật khẩu mới cho tài khoản của bạn'}
              </p>
            </div>

            {/* Content based on token validity */}
            {isTokenMissing ? (
              <div className="space-y-5">
                <Alert variant="destructive" className="text-sm">
                  <AlertDescription>
                    Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực.
                  </AlertDescription>
                </Alert>

                <div className="text-center">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Yêu cầu liên kết mới
                  </Link>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-3 text-muted-foreground">
                      hoặc
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                  >
                    Quay lại đăng nhập
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {resetPasswordError && (
                  <Alert variant="destructive" className="text-sm">
                    <AlertDescription>
                      {Array.isArray(resetPasswordError.response?.data?.message)
                        ? resetPasswordError.response?.data?.message.join(', ')
                        : (resetPasswordError.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại.')}
                    </AlertDescription>
                  </Alert>
                )}

                <ResetPasswordForm onSubmit={handleSubmit} isLoading={isResetPasswordLoading} />

                <div className="pt-2">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background px-3 text-muted-foreground">
                        Nhớ lại mật khẩu?
                      </span>
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <Link
                      to="/login"
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Quay lại đăng nhập
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ResetPasswordPage;
