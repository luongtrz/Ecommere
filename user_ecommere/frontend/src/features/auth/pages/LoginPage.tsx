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
  CheckCircle2,
  ArrowLeft,
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

      <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground">
        {/* ================= LEFT COLUMN: Brand Panel ================= */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to="/"
                className="font-serif text-2xl tracking-tight text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Thai Spray
              </Link>
              <p className="mt-1 text-xs text-primary-foreground/70 uppercase tracking-wider">
                Hàng Thái Lan Chính Hãng
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Về Trang Chủ</span>
            </Link>
          </div>

          <div className="max-w-md space-y-4">
            <div className="inline-block rounded-sm border border-primary-foreground/20 px-3 py-1 text-xs text-primary-foreground/90">
              Tổng Kho Tiện Ích &amp; Vệ Sinh Nhà Cửa Thái Lan
            </div>

            <h2 className="font-serif text-3xl xl:text-4xl leading-tight text-primary-foreground">
              Mua Sắm Tiết Kiệm, An Tâm Chuẩn Hàng Thái
            </h2>

            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Đăng nhập để nhận ngay ưu đãi thành viên, tích lũy điểm thưởng khi mua chai xịt đuổi chuột ARS, diệt gián kiến, tẩy rửa Magiclean và nước giặt xả Hygiene.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-4 border-t border-primary-foreground/15 text-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-primary-foreground" />
                  <p className="font-semibold text-primary-foreground">100% Nội Địa Thái</p>
                </div>
                <p className="text-primary-foreground/70">Đền 200% nếu hàng giả</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-primary-foreground" />
                  <p className="font-semibold text-primary-foreground">Giao Hỏa Tốc COD</p>
                </div>
                <p className="text-primary-foreground/70">Kiểm tra hàng trước khi trả</p>
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
        <div className="flex min-h-screen flex-col justify-center items-center p-6 sm:p-10 lg:p-12 bg-background">
          <div className="w-full max-w-sm space-y-6">
            {/* Top Bar with Về Trang Chủ and Mobile Brand */}
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Về Trang Chủ</span>
              </Link>
              <div className="lg:hidden">
                <Link to="/" className="font-serif text-xl tracking-tight text-foreground">
                  Thai Spray
                </Link>
              </div>
            </div>

            {/* Header */}
            <div className="space-y-1.5">
              <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground">
                Đăng Nhập Tài Khoản
              </h1>
              <p className="text-sm text-muted-foreground">
                Chào mừng bạn quay lại với Thai Spray Shop
              </p>
            </div>

            {/* Login Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Số điện thoại
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                            <Phone className="h-4 w-4" />
                          </div>
                          <Input
                            type="tel"
                            placeholder="0912345678"
                            className="pl-10 h-11 rounded-md border-input bg-background text-sm"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Mật khẩu
                        </FormLabel>
                        <Link
                          to="/forgot-password"
                          className="text-sm text-primary underline-offset-4 hover:underline"
                        >
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
                            className="pl-10 pr-10 h-11 rounded-md border-input bg-background text-sm"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm text-destructive" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full h-11 rounded-md text-sm font-medium"
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
              <Link
                to="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Đăng ký thành viên mới
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
