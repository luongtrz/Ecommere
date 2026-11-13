import { Link, useSearchParams } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import {
  Gift,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

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
              className="text-2xl font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Thai Spray
            </Link>
            <p className="mt-1 text-xs text-primary-foreground/70">
              Chính Hãng Thái Lan
            </p>
          </div>

          <div className="max-w-md space-y-4">
            <div className="inline-block rounded-sm border border-primary-foreground/20 px-3 py-1 text-xs text-primary-foreground/90">
              Tổng Kho Tiện Ích &amp; Vệ Sinh Nhà Cửa Thái Lan
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold leading-snug text-primary-foreground">
              Quyền Lợi Thành Viên Thai Spray
            </h2>

            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Trở thành thành viên để nhận ngay ưu đãi độc quyền, tích lũy điểm
              thưởng khi mua chai xịt đuổi chuột ARS, diệt gián kiến, tẩy rửa
              Magiclean và nước giặt xả Hygiene.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-4 border-t border-primary-foreground/15 text-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-primary-foreground" />
                  <p className="font-semibold text-primary-foreground">
                    100% Nội Địa Thái
                  </p>
                </div>
                <p className="text-primary-foreground/70">Bảo mật 100%</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-primary-foreground" />
                  <p className="font-semibold text-primary-foreground">
                    Giao Hỏa Tốc COD
                  </p>
                </div>
                <p className="text-primary-foreground/70">
                  Tích điểm không giới hạn
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-primary-foreground/15 flex items-center justify-between text-xs text-primary-foreground/70">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Bảo mật thông tin khách hàng tuyệt đối</span>
            </div>
            <span>Hotline: 0901.234.567</span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Form Column ================= */}
        <div className="flex min-h-screen flex-col justify-start py-8 sm:py-12 lg:justify-center lg:py-12 items-center p-6 sm:p-10 lg:p-12 bg-background">
          <div className="w-full max-w-sm space-y-6">
            {/* Top Bar with Về Trang Chủ and Mobile Brand */}
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Về trang chủ</span>
              </Link>
              <div className="lg:hidden">
                <Link to="/" className="text-xl font-bold text-foreground">
                  Thai Spray
                </Link>
              </div>
            </div>

            {/* Header */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground">
                Tạo tài khoản khách hàng
              </h1>
              <p className="text-sm text-muted-foreground">
                Đăng ký thành viên để nhận voucher và ưu đãi độc quyền
              </p>
            </div>

            {/* Special Gift Voucher Banner */}
            <div className="rounded-md border border-border bg-secondary/50 p-3 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <Gift className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-foreground">
                  Tặng Voucher 20.000đ
                </p>
                <p className="text-muted-foreground">
                  Áp dụng cho đơn hàng đầu tiên của bạn
                </p>
              </div>
            </div>

            {/* Referral Notice */}
            {referralCode && (
              <div className="bg-secondary/60 border border-border rounded-md p-3 text-center">
                <p className="text-xs font-semibold text-foreground">
                  🎉 Bạn được giới thiệu bởi bạn bè
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mã giới thiệu:{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {referralCode}
                  </span>
                </p>
              </div>
            )}

            {/* Register Form */}
            <RegisterForm
              onSubmit={(data) => register(data)}
              isLoading={isRegisterLoading}
              defaultReferralCode={referralCode}
            />

            {/* Bottom Login Prompt */}
            <div className="pt-4 text-center text-sm text-muted-foreground border-t border-border">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;
