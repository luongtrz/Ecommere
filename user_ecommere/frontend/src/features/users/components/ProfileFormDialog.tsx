import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="sm:rounded-[1.8rem] border border-border/80 bg-card p-6 md:p-8 shadow-luxury max-w-md">
        <DialogHeader className="pb-4 border-b border-border/60">
          <DialogTitle className="text-xl md:text-2xl font-serif font-bold text-foreground tracking-tight">
            Chỉnh sửa thông tin cá nhân
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground text-sm font-medium">Họ và tên *</Label>
            <Input
              id="name"
              required
              className="h-11 rounded-xl bg-secondary/40 border-border/70 focus:bg-background focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all text-foreground placeholder:text-muted-foreground/60"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground text-sm font-medium">Số điện thoại</Label>
            <Input
              id="phone"
              type="tel"
              className="h-11 rounded-xl bg-secondary/40 border-border/70 focus:bg-background focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all text-foreground placeholder:text-muted-foreground/60"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0912345678"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-full border-border hover:bg-secondary text-foreground px-6 text-sm font-medium">
              Hủy
            </Button>
            <Button
              type="submit"
              className="h-11 px-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-luxury text-sm font-medium"
              disabled={updateProfile.isPending}
            >
              Cập nhật
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
