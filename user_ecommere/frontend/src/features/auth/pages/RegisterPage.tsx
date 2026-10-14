import { Link, useSearchParams } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import { Gift, ShieldCheck, Sparkles, UserCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export function RegisterPage() {
  const { register, isRegisterLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';

  return (
    <>
      <SEO title="Đăng ký tài khoản - Thai Spray" />

      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground overflow-x-hidden">
        {/* ================= LEFT COLUMN: Visual Lifestyle & Benefits ================= */}
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
                  Chính Hãng Thái Lan
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
                Đặc Quyền Thành Viên
              </div>

              <h1 className="font-serif text-3xl xl:text-4xl 2xl:text-5xl font-normal tracking-tight leading-[1.2] text-foreground">
                Tạo Tài Khoản Khách Hàng,{' '}
                <span className="italic text-accent-foreground font-serif">
                  Nhận Ngay Ưu Đãi
                </span>
              </h1>

              <p className="text-sm xl:text-base text-muted-foreground leading-relaxed font-normal">
                Đăng ký thành viên để nhận voucher và ưu đãi độc quyền khi mua sắm các sản phẩm chăm sóc nhà cửa chính hãng từ Thái Lan.
              </p>
            </div>

            {/* Special Gift Voucher Banner in Showcase */}
            <div className="space-y-3.5 pt-2">
              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-luxury flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground font-bold shadow-sm">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Tặng Voucher 20.000đ</h4>
                  <p className="text-[11px] text-muted-foreground">Áp dụng cho đơn hàng đầu tiên của bạn</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">Bảo mật 100%</h4>
                      <p className="text-[11px] text-muted-foreground">Thông tin bảo mật tuyệt đối</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">Tích điểm không giới hạn</h4>
                      <p className="text-[11px] text-muted-foreground">Quy đổi cho mọi đơn hàng</p>
                    </div>
                  </div>
                </div>
              </div>

              {referralCode && (
                <div className="bg-secondary/70 border border-border rounded-2xl p-3.5 text-center">
                  <p className="text-xs font-semibold text-foreground">
                    🎉 Bạn được giới thiệu bởi bạn bè
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    Mã giới thiệu: <span className="font-mono font-bold text-foreground">{referralCode}</span>
                  </p>
                </div>
              )}
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
            {/* Mobile Brand Header */}
            <div className="lg:hidden flex items-center justify-between mb-2">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-serif font-bold text-base shadow-luxury">
                  TS
                </div>
                <div>
                  <span className="text-lg font-serif font-medium text-foreground">Thai Spray</span>
                  <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Chính Hãng Thái Lan</span>
                </div>
              </Link>
              <Link to="/" className="text-xs font-semibold text-accent-foreground hover:text-foreground transition-colors">
                Trang chủ →
              </Link>
            </div>

            {/* Special Gift Voucher Banner for Mobile / Right Column */}
            <div className="rounded-2xl border border-border bg-card p-3.5 flex items-center gap-3 shadow-luxury">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground font-bold">
                <Gift className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-foreground">Tặng Voucher 20.000đ</p>
                <p className="text-muted-foreground">Áp dụng cho đơn hàng đầu tiên của bạn</p>
              </div>
            </div>

            {/* Referral Notice */}
            {referralCode && (
              <div className="bg-secondary/70 border border-border rounded-2xl p-3 text-center">
                <p className="text-xs font-semibold text-foreground">
                  🎉 Bạn được giới thiệu bởi bạn bè
                </p>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  Mã giới thiệu: <span className="font-mono font-bold text-foreground">{referralCode}</span>
                </p>
              </div>
            )}

            {/* Register Card */}
            <div className="rounded-2xl md:rounded-[1.8rem] border border-border/80 bg-card p-7 sm:p-9 shadow-luxury space-y-6">
              <div className="space-y-1.5">
                <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground block">
                  Đăng ký thành viên
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
                  Tạo Tài Khoản Khách Hàng
                </h1>
                <p className="text-sm text-muted-foreground font-normal">
                  Đăng ký thành viên để nhận voucher và ưu đãi độc quyền
                </p>
              </div>

              <RegisterForm
                onSubmit={(data) => register(data)}
                isLoading={isRegisterLoading}
                defaultReferralCode={referralCode}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground font-normal">
                    Đã có tài khoản?
                  </span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-full border border-border hover:bg-secondary bg-background text-xs font-semibold text-foreground transition-all"
                >
                  <UserCheck className="h-4 w-4 text-accent-foreground" />
                  Đăng nhập tài khoản ngay
                </Link>
              </div>
            </div>

            {/* Trust Guarantees */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground font-normal pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent-foreground" />
                Bảo mật 100%
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-accent-foreground" />
                Tích điểm không giới hạn
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
