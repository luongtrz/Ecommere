import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

export function ProfileFormDialog({
  open,
  onOpenChange,
}: ProfileFormDialogProps) {
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
    mutationFn: (data: { name?: string; phone?: string }) =>
      usersApi.updateProfile(data),
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Chỉnh sửa thông tin cá nhân
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-foreground"
              >
                Họ và tên *
              </Label>
              <Input
                id="name"
                required
                className="h-11 text-base sm:text-sm"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-foreground"
              >
                Số điện thoại
              </Label>
              <Input
                id="phone"
                type="tel"
                className="h-11 text-base sm:text-sm"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="0912345678"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto min-h-11 sm:min-h-9"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto min-h-11 sm:min-h-9"
              disabled={updateProfile.isPending}
            >
              Cập nhật
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
