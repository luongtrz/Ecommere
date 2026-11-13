import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validators';
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

export interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordInput) => void;
  isLoading?: boolean;
}

export function ForgotPasswordForm({
  onSubmit,
  isLoading,
}: ForgotPasswordFormProps) {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-sm font-medium text-foreground">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="email@example.com"
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
          {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </Button>
      </form>
    </Form>
  );
}

export default ForgotPasswordForm;
