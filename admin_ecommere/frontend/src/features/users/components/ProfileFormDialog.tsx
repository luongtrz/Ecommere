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
      <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-900 shadow-xl rounded-2xl p-0 gap-0 overflow-hidden font-sans">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            Chỉnh sửa thông tin cá nhân
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 mt-0.5">
            Cập nhật tên hiển thị và số điện thoại liên hệ của tài khoản
          </DialogDescription>
        </DialogHeader>

        {/* Form Body with Sectioned Fields */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Thông tin cá nhân
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-900">
                Họ và tên *
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-900">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
                className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg h-10 tabular-nums text-sm"
              />
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 font-medium text-sm"
            >
              Cập nhật
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
