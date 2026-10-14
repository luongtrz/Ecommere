import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-slate-700">Số điện thoại</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <Input
                    type="tel"
                    placeholder="0912 345 678"
                    className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
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
                <FormLabel className="text-xs font-bold text-slate-700">Mật khẩu</FormLabel>
                <button
                  type="button"
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
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
                    placeholder="Nhập mật khẩu của bạn"
                    className="pl-10 pr-10 h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-sm"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
          disabled={isLoading}
        >
          {isLoading ? (
            'Đang xử lý đăng nhập...'
          ) : (
            <span className="flex items-center justify-center gap-2">
              Đăng Nhập Ngay
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
