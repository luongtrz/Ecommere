import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validators';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, isResetPasswordLoading, resetPasswordError } =
    useAuth();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

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
                    Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác
                    thực.
                  </AlertDescription>
                </Alert>

                <div className="text-center">
                  <Link
                    to="/forgot-password"
                    className="inline-flex items-center justify-center min-h-11 px-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
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
                    className="inline-flex items-center justify-center min-h-11 px-4 text-sm font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
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
                        : resetPasswordError.response?.data?.message ||
                          'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại.'}
                    </AlertDescription>
                  </Alert>
                )}

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-5"
                  >
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-sm font-medium text-foreground">
                            Mật khẩu mới
                          </FormLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                              <Lock className="h-4 w-4" />
                            </div>
                            <FormControl>
                              <Input
                                type={showNewPassword ? 'text' : 'password'}
                                className="pl-10 pr-11 h-11 rounded-md border-input bg-background text-sm"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              className="absolute inset-y-0 right-0 w-11 h-11 min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={
                                showNewPassword
                                  ? 'Ẩn mật khẩu'
                                  : 'Hiện mật khẩu'
                              }
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground leading-normal">
                            Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký
                            tự đặc biệt (@$!%*?&).
                          </p>
                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-sm font-medium text-foreground">
                            Xác nhận mật khẩu mới
                          </FormLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                              <Lock className="h-4 w-4" />
                            </div>
                            <FormControl>
                              <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                className="pl-10 pr-11 h-11 rounded-md border-input bg-background text-sm"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute inset-y-0 right-0 w-11 h-11 min-h-11 min-w-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={
                                showConfirmPassword
                                  ? 'Ẩn mật khẩu xác nhận'
                                  : 'Hiện mật khẩu xác nhận'
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <FormMessage className="text-sm text-destructive" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-11 min-h-11 rounded-md text-sm font-medium"
                      disabled={isResetPasswordLoading}
                    >
                      {isResetPasswordLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                          Đang đặt lại mật khẩu...
                        </span>
                      ) : (
                        'Đặt lại mật khẩu'
                      )}
                    </Button>
                  </form>
                </Form>

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
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ResetPasswordPage;
