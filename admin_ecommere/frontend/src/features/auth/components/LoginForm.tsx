import { useState } from 'react';
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
import { Phone, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (data: LoginInput) => void;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 font-sans">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Tài khoản / Số điện thoại
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Nhập số điện thoại hoặc email admin"
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
              <FormLabel className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Mật khẩu bảo mật
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 rounded-lg border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-500 text-sm font-medium"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
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

        <Button
          type="submit"
          className="w-full h-11 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            'Đang xác thực bảo mật...'
          ) : (
            <span className="flex items-center justify-center gap-2">
              Đăng Nhập Quản Trị
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
