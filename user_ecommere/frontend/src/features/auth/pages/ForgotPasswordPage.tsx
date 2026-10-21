import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-foreground rounded-lg mb-3">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Quên mật khẩu
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Nhập email để nhận liên kết đặt lại mật khẩu
            </p>
          </div>

          {/* Forgot Password Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {successMessage && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {forgotPasswordError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {Array.isArray(forgotPasswordError.response?.data?.message)
                      ? forgotPasswordError.response?.data?.message.join(', ')
                      : forgotPasswordError.response?.data?.message ||
                        'Đã có lỗi xảy ra. Vui lòng thử lại sau.'}
                  </AlertDescription>
                </Alert>
              )}

              <ForgotPasswordForm
                onSubmit={handleSubmit}
                isLoading={isForgotPasswordLoading}
              />

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
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default ForgotPasswordPage;
