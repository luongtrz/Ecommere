import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { User, Phone, Mail, Lock, Eye, EyeOff, Tag, ArrowRight } from 'lucide-react';

interface RegisterFormProps {
  onSubmit: (data: RegisterInput) => void;
  isLoading?: boolean;
  defaultReferralCode?: string;
}

export function RegisterForm({ onSubmit, isLoading, defaultReferralCode }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      referralCode: defaultReferralCode || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Họ và tên
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    placeholder="Nguyễn Văn A"
                    className="pl-10 h-11 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus-visible:ring-2 focus-visible:ring-teal-500"
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
                    type="tel"
                    placeholder="0912 345 678"
                    className="pl-10 h-11 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus-visible:ring-2 focus-visible:ring-teal-500"
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email <span className="text-slate-400 font-normal lowercase">(không bắt buộc)</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    className="pl-10 h-11 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus-visible:ring-2 focus-visible:ring-teal-500"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs text-rose-600" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Mật khẩu
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ít nhất 6 ký tự"
                      className="pl-10 pr-10 h-11 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus-visible:ring-2 focus-visible:ring-teal-500"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-600" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Xác nhận
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu"
                      className="pl-10 pr-10 h-11 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus-visible:ring-2 focus-visible:ring-teal-500"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-600" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="referralCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Mã giới thiệu <span className="text-slate-400 font-normal lowercase">(nếu có)</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Tag className="h-4 w-4" />
                  </div>
                  <Input
                    placeholder="VD: BANBE2026"
                    className="pl-10 h-11 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm uppercase focus-visible:ring-2 focus-visible:ring-teal-500"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs text-rose-600" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-11 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm transition-colors mt-2 focus-visible:ring-2 focus-visible:ring-teal-500"
          disabled={isLoading}
        >
          {isLoading ? (
            'Đang tạo tài khoản...'
          ) : (
            <span className="flex items-center justify-center gap-2">
              Hoàn Tất Đăng Ký
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
