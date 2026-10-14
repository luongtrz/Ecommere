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

      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground overflow-x-hidden">
        {/* ================= LEFT COLUMN: Visual Lifestyle & Promotions ================= */}
        <div className="relative hidden lg:flex lg:w-[50%] xl:w-[52%] flex-col justify-between p-12 xl:p-16 overflow-hidden bg-card/60 border-r border-border backdrop-blur-sm">
          {/* Ambient decorative lights */}
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
                Tổng Kho Tiện Ích &amp; Vệ Sinh Nhà Cửa Thái Lan
              </div>

              <h1 className="font-serif text-3xl xl:text-4xl 2xl:text-5xl font-normal tracking-tight leading-[1.2] text-foreground">
                Mua Sắm Tiết Kiệm,{' '}
                <span className="italic text-accent-foreground font-serif">
                  An Tâm Chuẩn Hàng Thái
                </span>
              </h1>

              <p className="text-sm xl:text-base text-muted-foreground leading-relaxed font-normal">
                Đăng nhập để nhận ngay ưu đãi thành viên, tích lũy điểm thưởng khi mua chai xịt đuổi chuột ARS, diệt gián kiến, tẩy rửa Magiclean và nước giặt xả Hygiene.
              </p>
            </div>

            {/* Benefit Badges */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">100% Nội Địa Thái</h4>
                    <p className="text-[11px] text-muted-foreground">Đền 200% nếu hàng giả</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground border border-border shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Giao Hỏa Tốc COD</h4>
                    <p className="text-[11px] text-muted-foreground">Kiểm tra hàng trước khi trả</p>
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
          <div className="w-full max-w-md space-y-7">
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

            {/* Form Card Container */}
            <div className="rounded-2xl md:rounded-[1.8rem] border border-border/80 bg-card p-7 sm:p-9 shadow-luxury space-y-6">
              {/* Header */}
              <div className="space-y-1.5">
                <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground block">
                  Chào mừng trở lại
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
                  Đăng Nhập Tài Khoản
                </h2>
                <p className="text-sm text-muted-foreground font-normal">
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
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Số điện thoại
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                              <Phone className="h-4 w-4" />
                            </div>
                            <Input
                              placeholder="0912345678"
                              className="pl-10 h-12 rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring text-sm"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-destructive" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Mật khẩu
                          </FormLabel>
                          <Link to="/forgot-password" className="text-xs text-accent-foreground hover:text-foreground font-medium transition-colors">
                            Quên mật khẩu?
                          </Link>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                              <Lock className="h-4 w-4" />
                            </div>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pl-10 pr-10 h-12 rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring text-sm"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-destructive" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoginLoading}
                    className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-luxury transition-all duration-200 mt-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {isLoginLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        Đang xử lý đăng nhập...
                      </span>
                    ) : (
                      'Đăng Nhập Ngay'
                    )}
                  </Button>
                </form>
              </Form>

              {/* Bottom Register Prompt */}
              <div className="pt-4 text-center text-sm text-muted-foreground border-t border-border">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-semibold text-accent-foreground hover:text-foreground hover:underline transition-colors">
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
