import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordInput) => void;
  isLoading?: boolean;
}

export function ResetPasswordForm({ onSubmit, isLoading }: ResetPasswordFormProps) {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mật khẩu mới
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="--------"
                    className="pl-10 pr-10 h-11 rounded-xl border border-input bg-background focus:bg-card text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-2 focus-visible:ring-ring"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-xs text-destructive" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Xác nhận mật khẩu mới
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="--------"
                    className="pl-10 pr-10 h-11 rounded-xl border border-input bg-background focus:bg-card text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-2 focus-visible:ring-ring"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-xs text-destructive" />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-luxury transition-all hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isLoading}
        >
          {isLoading ? 'Đang đặt lại mật khẩu...' : 'Đặt lại mật khẩu'}
        </Button>
      </form>
    </Form>
  );
}

export default ResetPasswordForm;
