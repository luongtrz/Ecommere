import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function LoginPage() {
  const { login, isLoginLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginInput) => {
    login(data);
  };

  return (
    <>
      <SEO title="Đăng nhập Quản trị - Thai Spray Operations Platform" />

      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] text-slate-900 overflow-x-hidden">
        {/* ================= LEFT COLUMN: Visual Showcase & Operational Feed (55%) ================= */}
        <div className="relative hidden lg:flex lg:w-[55%] flex-col justify-between p-12 xl:p-16 overflow-hidden bg-gradient-to-br from-white via-teal-50/40 to-emerald-50/20 border-r border-slate-200/80">
          {/* Top Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white font-black text-base shadow-md shadow-teal-600/20">
                TS
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 block">
                  Thai Spray <span className="text-teal-700">Admin</span>
                </span>
                <span className="text-[11px] text-teal-800 font-bold uppercase tracking-widest">
                  Hệ Thống Quản Trị Trung Tâm
                </span>
              </div>
            </div>

          </div>

          {/* Center Showcase Content */}
          <div className="relative z-10 my-auto py-8 max-w-xl space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-800">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                Phiên Bản Quản Trị Vận Hành 2026
              </div>

              <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black tracking-tight leading-[1.15] text-slate-900">
                Kiểm Soát Toàn Diện Kho Vận &amp;{' '}
                <span className="text-teal-700">
                  Đơn Hàng Chai Xịt Thái Lan
                </span>
              </h1>

              <p className="text-sm xl:text-base text-slate-600 leading-relaxed font-normal">
                Tối ưu hóa quy trình xuất nhập kho các dòng chai xịt đuổi chuột ARS, diệt côn trùng, tẩy rửa sinh học, đồng bộ hóa đơn hàng đa kênh và quản trị cơ sở dữ liệu PostgreSQL.
              </p>
            </div>

          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200/80">
            <span>&copy; {new Date().getFullYear()} Thai Spray Việt Nam • Control Platform</span>
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              Bảo mật SSL / TLS
            </span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: High-End Auth Panel (45%) ================= */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 xl:p-16 bg-white relative">
          <div className="w-full max-w-md relative z-10 space-y-8">
            {/* Mobile-Only Brand Header */}
            <div className="lg:hidden text-center space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white font-black text-xl shadow-md">
                TS
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Thai Spray Admin</h2>
                <p className="text-xs text-teal-700 font-medium uppercase tracking-wider">Cổng Quản Trị Hệ Thống</p>
              </div>
            </div>

            {/* Form Title */}
            <div className="space-y-2 text-left">
              <div className="inline-flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-bold text-teal-800">
                <Lock className="h-3.5 w-3.5 text-teal-600" />
                Xác Thực Quyền Quản Trị (Role: ADMIN)
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Đăng Nhập Quản Trị
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                Vui lòng nhập số điện thoại quản trị viên và mật khẩu bảo mật để truy cập bảng điều khiển.
              </p>
            </div>

            {/* Auth Form Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-lg">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Số điện thoại Quản trị
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Phone className="h-4 w-4" />
                            </div>
                            <Input
                              type="tel"
                              placeholder="0901234567"
                              className="pl-10 h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm font-medium"
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
                          <FormLabel className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Mật khẩu truy cập
                          </FormLabel>
                          <span className="text-xs text-teal-700 hover:text-teal-800 cursor-pointer font-medium">
                            Quên mật khẩu?
                          </span>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Lock className="h-4 w-4" />
                            </div>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Nhập mật khẩu quản trị"
                              className="pl-10 pr-10 h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm font-medium"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500/20 h-4 w-4"
                      />
                      <span>Ghi nhớ phiên đăng nhập này</span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
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

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  Cổng kết nối an toàn
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
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
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-700 transition-colors font-medium"
              >
                <span>Chuyển sang Giao diện Cửa hàng Khách Hàng </span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
