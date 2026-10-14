import { Link, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import type { ResetPasswordInput } from '@/lib/validators';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

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

      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground overflow-x-hidden">
        {/* ================= LEFT COLUMN: Visual Lifestyle & Security ================= */}
        <div className="relative hidden lg:flex lg:w-[50%] xl:w-[52%] flex-col justify-between p-12 xl:p-16 overflow-hidden bg-card/60 border-r border-border backdrop-blur-sm">
          {/* Ambient lighting */}
          <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl animate-float-orb" />
          <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

          {/* Top Brand Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-serif font-bold text-base shadow-luxury group-hover:scale-105 transition-transform">
                TS
              </div>
              <div>
                <span className="text-xl font-serif font-medium tracking-tight text-foreground block">
                  Thai <span className="text-accent-foreground font-serif">Spray</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] block">
                  Hàng Thái Lan Chính Hãng
                </span>
              </div>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-accent-foreground bg-secondary/80 hover:bg-secondary border border-border px-4 py-2 rounded-full transition-all"
            >
              <span>Về Trang Chủ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Center Brand Showcase */}
          <div className="relative z-10 my-auto py-8 max-w-xl space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3.5 py-1.5 uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
                Thiết Lập Mật Khẩu
              </div>

              <h1 className="font-serif text-3xl xl:text-4xl 2xl:text-5xl font-normal tracking-tight leading-[1.2] text-foreground">
                Đặt Lại Mật Khẩu,{' '}
                <span className="italic text-accent-foreground font-serif">
                  Bảo Vệ Tài Khoản
                </span>
              </h1>

              <p className="text-sm xl:text-base text-muted-foreground leading-relaxed font-normal">
                Thiết lập mật khẩu an toàn mới để tiếp tục trải nghiệm mua sắm tiện lợi tại Thai Spray Shop.
              </p>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Mã Hóa Chuẩn Quốc Tế</h4>
                    <p className="text-[11px] text-muted-foreground">Bảo vệ thông tin cá nhân</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Khuyến Nghị Bảo Mật</h4>
                    <p className="text-[11px] text-muted-foreground">Kết hợp chữ, số và ký tự</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security / Trust Footer */}
          <div className="relative z-10 pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
              <span>Bảo mật thông tin khách hàng tuyệt đối</span>
            </div>
            <span>Hotline: 0901.234.567</span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Form Card ================= */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 xl:p-20 bg-background">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile Brand */}
            <div className="lg:hidden flex items-center justify-between mb-2">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-serif font-bold text-base shadow-luxury">
                  TS
                </div>
                <div>
                  <span className="text-lg font-serif font-medium text-foreground">Thai Spray</span>
                  <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Hàng Thái Lan Chính Hãng</span>
                </div>
              </Link>
              <Link to="/" className="text-xs font-semibold text-accent-foreground hover:text-foreground transition-colors">
                Trang chủ →
              </Link>
            </div>

            {/* Reset Password Card */}
            <div className="rounded-2xl md:rounded-[1.8rem] border border-border/80 bg-card p-7 sm:p-9 shadow-luxury space-y-6">
              {/* Header */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center justify-center w-11 h-11 bg-primary text-primary-foreground rounded-2xl mb-2 font-serif font-bold text-base shadow-luxury">
                  TS
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
                  Đặt lại mật khẩu
                </h1>
                <p className="text-sm text-muted-foreground font-normal">
                  {isTokenMissing
                    ? 'Liên kết đặt lại mật khẩu'
                    : 'Nhập mật khẩu mới cho tài khoản của bạn'}
                </p>
              </div>

              {isTokenMissing ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertDescription>
                      Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực.
                    </AlertDescription>
                  </Alert>

                  <Link
                    to="/forgot-password"
                    className="inline-flex items-center justify-center w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-luxury transition-all"
                  >
                    Yêu cầu liên kết mới
                  </Link>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground font-normal">
                        hoặc
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center w-full h-11 rounded-full border border-border hover:bg-secondary bg-background text-xs font-semibold text-foreground transition-all"
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
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground font-normal">
                        Nhớ lại mật khẩu?
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center w-full h-11 rounded-full border border-border hover:bg-secondary bg-background text-xs font-semibold text-foreground transition-all"
                  >
                    Quay lại đăng nhập
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ResetPasswordPage;
