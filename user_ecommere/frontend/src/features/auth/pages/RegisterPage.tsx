import { Link, useSearchParams } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import { Gift, ShieldCheck } from 'lucide-react';

export function RegisterPage() {
  const { register, isRegisterLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';

  return (
    <>
      <SEO title="Đăng ký tài khoản - Thai Spray" />

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
              Chính Hãng Thái Lan
            </p>
          </div>

          <div className="max-w-md space-y-4">
            <h2 className="font-serif text-3xl xl:text-4xl leading-tight text-primary-foreground">
              Tạo Tài Khoản Khách Hàng
            </h2>

            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Đăng ký thành viên để nhận voucher và ưu đãi độc quyền
            </p>

            <div className="pt-4 border-t border-primary-foreground/15 text-xs text-primary-foreground/80 space-y-1">
              <p className="font-semibold text-primary-foreground">Tặng Voucher 20.000đ</p>
              <p className="text-primary-foreground/70">Áp dụng cho đơn hàng đầu tiên của bạn</p>
            </div>
          </div>

          <div className="pt-6 border-t border-primary-foreground/15 flex items-center justify-between text-xs text-primary-foreground/70">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Bảo mật 100%</span>
            </div>
            <span>Tích điểm không giới hạn</span>
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
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Trang chủ →
              </Link>
            </div>

            {/* Header */}
            <div className="space-y-1.5">
              <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground">
                Tạo Tài Khoản Khách Hàng
              </h1>
              <p className="text-sm text-muted-foreground">
                Đăng ký thành viên để nhận voucher và ưu đãi độc quyền
              </p>
            </div>

            {/* Special Gift Voucher Banner */}
            <div className="rounded-md border border-border bg-secondary/50 p-3.5 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <Gift className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-foreground">Tặng Voucher 20.000đ</p>
                <p className="text-muted-foreground">Áp dụng cho đơn hàng đầu tiên của bạn</p>
              </div>
            </div>

            {/* Referral Notice */}
            {referralCode && (
              <div className="bg-secondary/60 border border-border rounded-md p-3 text-center">
                <p className="text-xs font-semibold text-foreground">
                  🎉 Bạn được giới thiệu bởi bạn bè
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mã giới thiệu: <span className="font-mono font-semibold text-foreground">{referralCode}</span>
                </p>
              </div>
            )}

            {/* Register Form */}
            <RegisterForm
              onSubmit={(data) => register(data)}
              isLoading={isRegisterLoading}
              defaultReferralCode={referralCode}
            />

            {/* Divider & Login Link */}
            <div className="pt-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">
                    Đã có tài khoản?
                  </span>
                </div>
              </div>

              <div className="text-center mt-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Đăng nhập tài khoản ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;
