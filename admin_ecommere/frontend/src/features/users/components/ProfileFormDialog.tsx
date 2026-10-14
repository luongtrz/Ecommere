import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileFormDialog({ open, onOpenChange }: ProfileFormDialogProps) {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  // Sync formData với user data khi dialog mở
  useEffect(() => {
    if (open && user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  }, [open, user]);

  const updateProfile = useMutation({
    mutationFn: (data: { name?: string; phone?: string }) => usersApi.updateProfile(data),
    onSuccess: async () => {
      await refreshUser();
      toast.success('Cập nhật thông tin thành công');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Cập nhật thông tin thất bại');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border border-border text-card-foreground shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-card">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Chỉnh sửa thông tin cá nhân
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Cập nhật tên hiển thị và số điện thoại liên hệ của tài khoản
          </DialogDescription>
        </DialogHeader>

        {/* Form Body with Sectioned Fields */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Thông tin cá nhân
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                Họ và tên *
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="bg-background border-input text-foreground focus-visible:ring-ring rounded-xl h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
                className="bg-background border-input text-foreground focus-visible:ring-ring rounded-xl h-10 tabular-nums"
              />
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 -mx-6 -mb-6 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-border bg-background hover:bg-muted text-foreground"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Cập nhật
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
