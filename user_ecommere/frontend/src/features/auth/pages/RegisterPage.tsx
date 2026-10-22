import { Link, useSearchParams } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import {
  Gift,
  ShieldCheck,
  Sparkles,
  UserCheck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export function RegisterPage() {
  const { register, isRegisterLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';

  return (
    <>
      <SEO title="Đăng ký tài khoản - Thai Spray" />

      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 text-slate-900 overflow-x-hidden font-sans">
        {/* ================= LEFT COLUMN: Visual Lifestyle & Benefits ================= */}
        <div className="relative hidden lg:flex lg:w-[50%] xl:w-[52%] flex-col justify-between p-12 xl:p-16 overflow-hidden bg-teal-50/50 border-r border-slate-200">
          {/* Ambient lighting */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-slate-100 blur-3xl" />

          {/* Top Brand Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-base shadow-sm group-hover:bg-teal-700 transition-colors">
                TS
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 block">
                  Thai <span className="text-teal-600">Spray</span>
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                  Chính Hãng Thái Lan
                </span>
              </div>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-teal-700 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg shadow-sm transition-colors"
            >
              <span>Về Trang Chủ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Center Brand Showcase */}
          <div className="relative z-10 my-auto py-8 max-w-xl space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3.5 py-1.5 uppercase tracking-wider text-[10px] font-bold text-teal-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                Đặc Quyền Thành Viên
              </div>

              <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight leading-[1.2] text-slate-900">
                Tạo Tài Khoản Khách Hàng,{' '}
                <span className="text-teal-600">Nhận Ngay Ưu Đãi</span>
              </h2>

              <p className="text-sm xl:text-base text-slate-600 leading-relaxed font-normal">
                Đăng ký thành viên để nhận voucher và ưu đãi độc quyền khi mua
                sắm các sản phẩm chăm sóc nhà cửa chính hãng từ Thái Lan.
              </p>
            </div>

            {/* Special Gift Voucher Banner in Showcase */}
            <div className="space-y-3.5 pt-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm flex items-center gap-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white font-bold shadow-sm">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Tặng Voucher 20.000đ
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Áp dụng cho đơn hàng đầu tiên của bạn
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">
                        Bảo mật 100%
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Thông tin bảo mật tuyệt đối
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">
                        Tích điểm không giới hạn
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Quy đổi cho mọi đơn hàng
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {referralCode && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 text-center">
                  <p className="text-xs font-semibold text-teal-800">
                    Bạn được giới thiệu bởi bạn bè
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    Mã giới thiệu:{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {referralCode}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Security / Trust Footer */}
          <div className="relative z-10 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Bảo mật thông tin khách hàng tuyệt đối</span>
            </div>
            <span>Hotline: 0901.234.567</span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Form Card ================= */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 xl:p-20 bg-white">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile Brand Header */}
            <div className="lg:hidden flex items-center justify-between mb-2">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-base shadow-sm">
                  TS
                </div>
                <div>
                  <span className="text-lg font-bold text-slate-900">
                    Thai Spray
                  </span>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                    Chính Hãng Thái Lan
                  </span>
                </div>
              </Link>
              <Link
                to="/"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                Trang chủ →
              </Link>
            </div>

            {/* Special Gift Voucher Banner for Mobile / Right Column */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 flex items-center gap-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white font-bold">
                <Gift className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-900">
                  Tặng Voucher 20.000đ
                </p>
                <p className="text-slate-600">
                  Áp dụng cho đơn hàng đầu tiên của bạn
                </p>
              </div>
            </div>

            {/* Referral Notice */}
            {referralCode && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-teal-800">
                  Bạn được giới thiệu bởi bạn bè
                </p>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Mã giới thiệu:{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {referralCode}
                  </span>
                </p>
              </div>
            )}

            {/* Register Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-9 shadow-sm space-y-6">
              <div className="space-y-1.5">
                <span className="uppercase tracking-wider text-[11px] font-semibold text-teal-600 block">
                  Đăng ký thành viên
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Tạo Tài Khoản Khách Hàng
                </h1>
                <p className="text-sm text-slate-600 font-normal">
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
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-500 font-normal">
                    Đã có tài khoản?
                  </span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-slate-200 hover:bg-slate-50 bg-white text-xs font-semibold text-slate-700 transition-colors"
                >
                  <UserCheck className="h-4 w-4 text-teal-600" />
                  Đăng nhập tài khoản ngay
                </Link>
              </div>
            </div>

            {/* Trust Guarantees */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500 font-normal pt-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Bảo mật 100%
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-teal-600" />
                Tích điểm không giới hạn
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
