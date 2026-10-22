import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import type { ForgotPasswordInput } from '@/lib/validators';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

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

      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 text-slate-900 overflow-x-hidden font-sans">
        {/* ================= LEFT COLUMN: Visual Brand Showcase ================= */}
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
                  Hàng Thái Lan Chính Hãng
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
                Khôi Phục Tài Khoản
              </div>

              <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight leading-[1.2] text-slate-900">
                Lấy Lại Mật Khẩu,{' '}
                <span className="text-teal-600">
                  Tiếp Tục Trải Nghiệm
                </span>
              </h2>

              <p className="text-sm xl:text-base text-slate-600 leading-relaxed font-normal">
                Nhập email đã đăng ký của bạn. Hệ thống sẽ tự động gửi hướng dẫn và đường dẫn bảo mật để bạn thiết lập lại mật khẩu trong giây lát.
              </p>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">Bảo Mật Tuyệt Đối</h4>
                    <p className="text-[11px] text-slate-500">Mã hóa xác thực an toàn</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">Hỗ Trợ Nhanh Chóng</h4>
                    <p className="text-[11px] text-slate-500">Xác nhận email tức thì</p>
                  </div>
                </div>
              </div>
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
            {/* Mobile Brand */}
            <div className="lg:hidden flex items-center justify-between mb-2">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-base shadow-sm">
                  TS
                </div>
                <div>
                  <span className="text-lg font-bold text-slate-900">Thai Spray</span>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Hàng Thái Lan Chính Hãng</span>
                </div>
              </Link>
              <Link to="/" className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                Trang chủ →
              </Link>
            </div>

            {/* Forgot Password Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-9 shadow-sm space-y-6">
              {/* Header */}
              <div className="space-y-1.5">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-teal-600 text-white rounded-xl mb-2 font-bold text-base shadow-sm">
                  TS
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Quên mật khẩu
                </h1>
                <p className="text-sm text-slate-600 font-normal">
                  Nhập email để nhận liên kết đặt lại mật khẩu
                </p>
              </div>

              {successMessage && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {forgotPasswordError && (
                <Alert className="border-rose-200 bg-rose-50 text-rose-800">
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
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-500 font-normal">
                    Nhớ lại mật khẩu?
                  </span>
                </div>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full h-11 rounded-lg border border-slate-200 hover:bg-slate-50 bg-white text-xs font-semibold text-slate-700 transition-colors"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ForgotPasswordPage;
