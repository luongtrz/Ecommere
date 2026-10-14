import { Link, useSearchParams } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import { Gift, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

export function RegisterPage() {
  const { register, isRegisterLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';

  return (
    <>
      <SEO title="Đăng ký tài khoản - Thai Spray" />
      <div className="min-h-[85vh] flex items-center justify-center p-4 relative overflow-hidden py-10">
        {/* Background ambient lighting */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-lg shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                TS
              </div>
              <div className="text-left">
                <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
                  Thai <span className="text-teal-600">Spray</span>
                </span>
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Chính Hãng Thái Lan
                </span>
              </div>
            </Link>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight pt-2">
              Tạo Tài Khoản Khách Hàng
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs mx-auto">
              Đăng ký thành viên để nhận voucher và ưu đãi độc quyền
            </p>
          </div>

          {/* Special Gift Voucher Banner */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3.5 flex items-center gap-3 shadow-xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold">
              <Gift className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-amber-950">Tặng Voucher 20.000đ</p>
              <p className="text-amber-800/80 font-medium">Áp dụng cho đơn hàng đầu tiên của bạn</p>
            </div>
          </div>

          {/* Referral Notice */}
          {referralCode && (
            <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-3 text-center">
              <p className="text-xs font-bold text-teal-900">
                🎉 Bạn được giới thiệu bởi bạn bè
              </p>
              <p className="text-[11px] text-teal-700 font-medium mt-0.5">
                Mã giới thiệu: <span className="font-mono font-bold text-teal-900">{referralCode}</span>
              </p>
            </div>
          )}

          {/* Register Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
            <RegisterForm
              onSubmit={(data) => register(data)}
              isLoading={isRegisterLoading}
              defaultReferralCode={referralCode}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">
                  Đã có tài khoản?
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 w-full h-11 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/80 hover:bg-teal-50/50 text-xs font-bold text-slate-700 hover:text-teal-800 transition-all"
              >
                <UserCheck className="h-4 w-4 text-teal-600" />
                Đăng nhập tài khoản ngay
              </Link>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500 font-medium pt-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              Bảo mật 100%
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Tích điểm không giới hạn
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
