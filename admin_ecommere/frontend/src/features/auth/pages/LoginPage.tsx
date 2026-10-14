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

      <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground overflow-x-hidden">
        {/* ================= LEFT COLUMN: Dark Brand Showcase Panel (55%) ================= */}
        <div className="relative hidden lg:flex lg:w-[50%] xl:w-[55%] flex-col justify-between p-12 xl:p-16 overflow-hidden border-r border-border bg-card/60 backdrop-blur-xl">
          {/* Subtle ambient lighting */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-lg shadow-primary/20">
                TS
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-foreground block">
                  Thai Spray <span className="text-primary">Admin</span>
                </span>
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                  Hệ Thống Quản Trị Trung Tâm
                </span>
              </div>
            </div>
          </div>

          {/* Center Showcase Content */}
          <div className="relative z-10 my-auto py-8 max-w-xl space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Phiên Bản Quản Trị Vận Hành 2026
              </div>

              <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black tracking-tight leading-[1.15] text-foreground">
                Kiểm Soát Toàn Diện Kho Vận &amp;{' '}
                <span className="text-primary">
                  Đơn Hàng Chai Xịt Thái Lan
                </span>
              </h1>

              <p className="text-sm xl:text-base text-muted-foreground leading-relaxed font-normal">
                Tối ưu hóa quy trình xuất nhập kho các dòng chai xịt đuổi chuột ARS, diệt côn trùng, tẩy rửa sinh học và đồng bộ hóa đơn hàng đa kênh.
              </p>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
            <span>&copy; {new Date().getFullYear()} Thai Spray Việt Nam • Control Platform</span>
            <span className="flex items-center gap-1.5 font-medium text-foreground/80">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Bảo mật SSL / TLS
            </span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: High-End Auth Panel (45%) ================= */}
        <div className="w-full lg:w-[50%] xl:w-[45%] flex items-center justify-center p-6 sm:p-12 xl:p-16 bg-background relative">
          <div className="w-full max-w-md relative z-10 space-y-8">
            {/* Mobile-Only Brand Header */}
            <div className="lg:hidden text-center space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-lg shadow-primary/20">
                TS
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground">Thai Spray Admin</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cổng Quản Trị Hệ Thống</p>
              </div>
            </div>

            {/* Form Title */}
            <div className="space-y-2 text-left">
              <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/25 px-3 py-1 text-xs font-bold text-primary">
                <Lock className="h-3.5 w-3.5" />
                Xác Thực Quyền Quản Trị (Role: ADMIN)
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Đăng Nhập Quản Trị
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                Vui lòng nhập số điện thoại quản trị viên và mật khẩu bảo mật để truy cập bảng điều khiển.
              </p>
            </div>

            {/* Auth Form Card */}
            <div className="rounded-3xl border border-border bg-card/80 p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Số điện thoại Quản trị
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                              <Phone className="h-4 w-4" />
                            </div>
                            <Input
                              type="tel"
                              placeholder="0901234567"
                              className="pl-10 h-12 rounded-xl border-border bg-background/60 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium"
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
                          <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Mật khẩu truy cập
                          </FormLabel>
                          <span className="text-xs text-primary hover:text-primary/80 cursor-pointer font-medium transition-colors">
                            Quên mật khẩu?
                          </span>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                              <Lock className="h-4 w-4" />
                            </div>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Nhập mật khẩu quản trị"
                              className="pl-10 pr-10 h-12 rounded-xl border-border bg-background/60 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium"
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-border bg-background text-primary focus:ring-primary/20 h-4 w-4"
                      />
                      <span>Ghi nhớ phiên đăng nhập này</span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.98]"
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

              <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Cổng kết nối an toàn
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
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
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
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
