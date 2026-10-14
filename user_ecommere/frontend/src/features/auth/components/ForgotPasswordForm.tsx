import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordInput) => void;
  isLoading?: boolean;
}

export function ForgotPasswordForm({ onSubmit, isLoading }: ForgotPasswordFormProps) {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    className="pl-10 h-11 rounded-xl border border-input bg-background focus:bg-card text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-2 focus-visible:ring-ring"
                    {...field}
                  />
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
          {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </Button>
      </form>
    </Form>
  );
}

export default ForgotPasswordForm;
