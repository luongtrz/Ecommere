import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validators';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import { STORE_URL } from '@/lib/constants';
import {
  ShieldCheck,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export function LoginPage() {
  const { login, isLoginLoading, loginError, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Read destination from location.state.from if redirected by RequireAuth
  const stateFrom = (
    location.state as
      | { from?: { pathname?: string; search?: string; hash?: string } }
      | undefined
  )?.from;
  const from = stateFrom
    ? `${stateFrom.pathname || '/admin'}${stateFrom.search || ''}${stateFrom.hash || ''}`
    : '/admin';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginInput) => {
    if (rememberMe) {
      try {
        localStorage.setItem('admin_remembered_phone', data.phone);
      } catch {
        // Ignore localStorage errors
      }
    } else {
      try {
        localStorage.removeItem('admin_remembered_phone');
      } catch {
        // Ignore localStorage errors
      }
    }

    login(data, {
      onSuccess: () => {
        navigate(from, { replace: true });
      },
    });
  };

  const errorMessage =
    (loginError?.response?.data as { message?: string } | undefined)?.message ||
    loginError?.message ||
    'Đăng nhập thất bại. Vui lòng kiểm tra lại số điện thoại và mật khẩu.';

  return (
    <>
      <SEO title="Đăng nhập Quản trị - Thai Spray Operations Platform" />

      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 text-slate-900 overflow-x-hidden font-sans">
        {/* ================= LEFT COLUMN: Brand Showcase Panel (55%) ================= */}
        <div className="relative hidden lg:flex lg:w-[50%] xl:w-[55%] flex-col justify-between p-12 xl:p-16 overflow-hidden border-r border-slate-200 bg-white">
          {/* Subtle ambient lighting */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-white to-slate-50 pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-50/60 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-base shadow-sm">
                TS
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 block">
                  Thai Spray <span className="text-teal-600">Admin</span>
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Hệ thống Quản trị Trung tâm
                </span>
              </div>
            </div>
          </div>

          {/* Center Showcase Content */}
          <div className="relative z-10 my-auto py-8 max-w-xl space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                Phiên Bản Quản Trị Vận Hành 2026
              </div>

              <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight leading-[1.2] text-slate-900">
                Kiểm Soát Toàn Diện Kho Vận &amp;{' '}
                <span className="text-teal-600">
                  Đơn Hàng Chai Xịt Thái Lan
                </span>
              </h1>

              <p className="text-sm xl:text-base text-slate-600 leading-relaxed font-normal">
                Tối ưu hóa quy trình xuất nhập kho các dòng chai xịt đuổi chuột
                ARS, diệt côn trùng, tẩy rửa sinh học và đồng bộ hóa đơn hàng đa
                kênh.
              </p>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200">
            <span>
              &copy; {new Date().getFullYear()} Thai Spray Việt Nam • Nền tảng Quản trị
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Bảo mật SSL / TLS
            </span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Modern Bright Auth Panel (45%) ================= */}
        <div className="w-full lg:w-[50%] xl:w-[45%] flex items-center justify-center p-6 sm:p-12 xl:p-16 bg-slate-50 relative">
          <div className="w-full max-w-md relative z-10 space-y-6">
            {/* Mobile-Only Brand Header */}
            <div className="lg:hidden text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-lg shadow-sm">
                TS
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Thai Spray Admin
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  Hệ thống Quản trị Trung tâm
                </p>
              </div>
            </div>

            {/* Form Title */}
            <div className="space-y-1.5 text-left">
              <div className="inline-flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700">
                <Lock className="h-3.5 w-3.5 text-teal-600" />
                Cổng Đăng Nhập Quản Trị Viên
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Đăng Nhập Quản Trị
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                Vui lòng nhập số điện thoại quản trị viên và mật khẩu bảo mật để
                truy cập bảng điều khiển.
              </p>
            </div>

            {/* Auth Form Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  {/* Persistent inline error alert */}
                  {loginError && (
                    <div
                      role="alert"
                      className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium flex items-start gap-2.5"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <div className="flex-1">{errorMessage}</div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-slate-700">
                          Số điện thoại quản trị
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Phone className="h-4 w-4" />
                            </div>
                            <Input
                              type="tel"
                              placeholder="0901234567"
                              autoComplete="tel username"
                              className="pl-10 h-11 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500 text-sm font-medium"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-medium text-slate-700">
                            Mật khẩu truy cập
                          </FormLabel>
                          <button
                            type="button"
                            onClick={() => setForgotPasswordOpen(true)}
                            className="text-xs text-teal-600 hover:text-teal-700 cursor-pointer font-medium transition-colors focus-visible:outline-none focus-visible:underline min-h-[32px] sm:min-h-0 inline-flex items-center"
                          >
                            Quên mật khẩu?
                          </button>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Lock className="h-4 w-4" />
                            </div>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Nhập mật khẩu quản trị"
                              autoComplete="current-password"
                              className="pl-10 pr-12 h-11 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500 text-sm font-medium"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                              className="absolute inset-y-0 right-0 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-r-lg"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <label
                      htmlFor="remember-me"
                      className="flex items-center gap-2 cursor-pointer select-none min-h-[44px] py-1"
                    >
                      <input
                        type="checkbox"
                        id="remember-me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 bg-white text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 font-medium">
                        Ghi nhớ phiên đăng nhập này
                      </span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50"
                    disabled={isLoginLoading}
                  >
                    {isLoginLoading ? (
                      'Đang xác thực thông tin...'
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Truy Cập Bảng Điều Khiển
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  Cổng kết nối an toàn
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Mã hóa 256-bit
                </span>
              </div>
            </div>

            {/* Direct Link back to Customer Store */}
            <div className="text-center">
              <a
                href={STORE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 transition-colors font-medium py-2.5 px-3 min-h-[44px] rounded-lg"
              >
                <span>Chuyển sang giao diện cửa hàng khách hàng</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Support Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900">
              Khôi phục mật khẩu quản trị
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-2 space-y-2">
              <span className="block">
                Hệ thống quản trị Thai Spray không hỗ trợ tự cấp lại mật khẩu trực tuyến nhằm bảo vệ an toàn dữ liệu nội bộ.
              </span>
              <span className="block">
                Vui lòng liên hệ trực tiếp <strong>Quản trị viên cấp cao</strong> hoặc bộ phận Kỹ thuật nội bộ để xác minh danh tính và được cấp lại mật khẩu truy cập.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 sm:justify-end">
            <Button
              type="button"
              className="w-full sm:w-auto h-10 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold"
              onClick={() => setForgotPasswordOpen(false)}
            >
              Đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
