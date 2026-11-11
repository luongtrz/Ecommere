import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordInput) => void;
  isLoading?: boolean;
}

export function ResetPasswordForm({ onSubmit, isLoading }: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mật khẩu mới
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="--------"
                  className="h-11 rounded-md border-input bg-background text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-sm text-destructive" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Xác nhận mật khẩu mới
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="--------"
                  className="h-11 rounded-md border-input bg-background text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-sm text-destructive" />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full h-11 rounded-md text-sm font-medium"
          disabled={isLoading}
        >
          {isLoading ? 'Đang đặt lại mật khẩu...' : 'Đặt lại mật khẩu'}
        </Button>
      </form>
    </Form>
  );
}

export default ResetPasswordForm;
