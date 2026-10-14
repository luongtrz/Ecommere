import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '../hooks/useAuth';
import { SEO } from '@/lib/seo';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
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
      <SEO title="Đăng nhập tài khoản - Thai Spray Chính Hãng Thái Lan" />

      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 text-slate-900 overflow-x-hidden font-sans">
        {/* ================= LEFT COLUMN: Visual Lifestyle & Promotions ================= */}
        <div className="relative hidden lg:flex lg:w-[50%] xl:w-[52%] flex-col justify-between p-12 xl:p-16 overflow-hidden bg-teal-50/50 border-r border-slate-200">
          {/* Ambient decorative lights */}
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
                Tổng Kho Tiện Ích &amp; Vệ Sinh Nhà Cửa Thái Lan
              </div>

              <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-bold tracking-tight leading-[1.2] text-slate-900">
                Mua Sắm Tiết Kiệm,{' '}
                <span className="text-teal-600">
                  An Tâm Chuẩn Hàng Thái
                </span>
              </h2>

              <p className="text-sm xl:text-base text-slate-600 leading-relaxed font-normal">
                Đăng nhập để nhận ngay ưu đãi thành viên, tích lũy điểm thưởng khi mua chai xịt đuổi chuột ARS, diệt gián kiến, tẩy rửa Magiclean và nước giặt xả Hygiene.
              </p>
            </div>

            {/* Benefit Badges */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">100% Nội Địa Thái</h4>
                    <p className="text-[11px] text-slate-500">Đền 200% nếu hàng giả</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">Giao Hỏa Tốc COD</h4>
                    <p className="text-[11px] text-slate-500">Kiểm tra hàng trước khi trả</p>
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
          <div className="w-full max-w-md space-y-7">
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

            {/* Form Card Container */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-9 shadow-sm space-y-6">
              {/* Header */}
              <div className="space-y-1.5">
                <span className="uppercase tracking-wider text-[11px] font-semibold text-teal-600 block">
                  Chào mừng trở lại
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Đăng Nhập Tài Khoản
                </h1>
                <p className="text-sm text-slate-600 font-normal">
                  Chào mừng bạn quay lại với Thai Spray Shop
                </p>
              </div>

              {/* Login Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Số điện thoại
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Phone className="h-4 w-4" />
                            </div>
                            <Input
                              placeholder="0912345678"
                              className="pl-10 h-11 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 text-sm"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-rose-600" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                            Mật khẩu
                          </FormLabel>
                          <Link to="/forgot-password" className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">
                            Quên mật khẩu?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Lock className="h-4 w-4" />
                            </div>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pl-10 pr-10 h-11 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 text-sm"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-rose-600" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoginLoading}
                    className="w-full h-11 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm transition-colors mt-2 focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    {isLoginLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Đang xử lý đăng nhập...
                      </span>
                    ) : (
                      'Đăng Nhập Ngay'
                    )}
                  </Button>
                </form>
              </Form>

              {/* Bottom Register Prompt */}
              <div className="pt-4 text-center text-sm text-slate-600 border-t border-slate-200">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors">
                  Đăng ký thành viên mới
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
