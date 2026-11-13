import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import type { ForgotPasswordInput } from '@/lib/validators';

export function ForgotPasswordPage() {
  const { forgotPassword, isForgotPasswordLoading, forgotPasswordError } =
    useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = (data: ForgotPasswordInput) => {
    setSuccessMessage(null);
    forgotPassword(data.email, {
      onSuccess: () => {
        setSuccessMessage(
          'Nếu email tồn tại, liên kết đặt lại mật khẩu sẽ được gửi',
        );
      },
    });
  };

  return (
    <>
      <SEO title="Quên mật khẩu" />

      <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground">
        {/* ================= LEFT COLUMN: Brand Panel ================= */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-primary text-primary-foreground">
          <div>
            <Link
              to="/"
              className="text-2xl font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Thai Spray
            </Link>
            <p className="mt-1 text-xs text-primary-foreground/70">
              Hàng Thái Lan chính hãng
            </p>
          </div>

          <div className="max-w-md space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold leading-snug text-primary-foreground">
              Quên mật khẩu
            </h2>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Nhập email để nhận liên kết đặt lại mật khẩu
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
              <Link to="/" className="text-xl font-bold text-foreground">
                Thai Spray
              </Link>
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11 flex items-center"
              >
                Đăng nhập →
              </Link>
            </div>

            {/* Header */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground">
                Quên mật khẩu
              </h1>
              <p className="text-sm text-muted-foreground">
                Nhập email để nhận liên kết đặt lại mật khẩu
              </p>
            </div>

            {/* Alerts */}
            {successMessage && (
              <Alert className="border-border bg-secondary text-foreground text-sm">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {forgotPasswordError && (
              <Alert variant="destructive" className="text-sm">
                <AlertDescription>
                  {Array.isArray(forgotPasswordError.response?.data?.message)
                    ? forgotPasswordError.response?.data?.message.join(', ')
                    : forgotPasswordError.response?.data?.message ||
                      'Đã có lỗi xảy ra. Vui lòng thử lại sau.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Forgot Password Form */}
            <ForgotPasswordForm
              onSubmit={handleSubmit}
              isLoading={isForgotPasswordLoading}
            />

            {/* Divider & Back Link */}
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
                  className="inline-flex items-center justify-center min-h-11 px-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ForgotPasswordPage;
