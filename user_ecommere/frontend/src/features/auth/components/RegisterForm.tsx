import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { User, Phone, Mail, Lock, Eye, EyeOff, Tag } from 'lucide-react';

export interface RegisterFormProps {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-sm font-medium text-foreground">
                Họ và tên
              </FormLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
                <FormControl>
                  <Input
                    placeholder="VD: Nguyễn Văn A"
                    className="pl-10 h-11 rounded-md border-input bg-background text-sm"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage className="text-sm text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-sm font-medium text-foreground">
                Số điện thoại
              </FormLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </div>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="0912 345 678"
                    className="pl-10 h-11 rounded-md border-input bg-background text-sm"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage className="text-sm text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-sm font-medium text-foreground">
                Email <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
              </FormLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    className="pl-10 h-11 rounded-md border-input bg-background text-sm"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage className="text-sm text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-sm font-medium text-foreground">
                Mật khẩu
              </FormLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ít nhất 6 ký tự"
                    className="pl-10 pr-11 h-11 rounded-md border-input bg-background text-sm"
                    {...field}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FormMessage className="text-sm text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-sm font-medium text-foreground">
                Xác nhận mật khẩu
              </FormLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <FormControl>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    className="pl-10 pr-11 h-11 rounded-md border-input bg-background text-sm"
                    {...field}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FormMessage className="text-sm text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referralCode"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-sm font-medium text-foreground">
                Mã giới thiệu <span className="font-normal text-muted-foreground">(nếu có)</span>
              </FormLabel>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Tag className="h-4 w-4" />
                </div>
                <FormControl>
                  <Input
                    placeholder="VD: BANBE2026"
                    className="pl-10 h-11 rounded-md border-input bg-background text-sm uppercase"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage className="text-sm text-destructive" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-11 rounded-md text-sm font-medium mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Đang tạo tài khoản...
            </span>
          ) : (
            'Hoàn tất đăng ký'
          )}
        </Button>
      </form>
    </Form>
  );
}

export default RegisterForm;
