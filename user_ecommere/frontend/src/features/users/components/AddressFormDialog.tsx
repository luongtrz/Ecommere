import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateAddress, useUpdateAddress } from '../hooks/useAddresses';
import type { Address } from '../api/users.api';
import { MapPin } from 'lucide-react';

interface AddressFormDialogProps {
  address?: Address;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddressFormDialog({ address, open, onOpenChange }: AddressFormDialogProps) {
  const isEdit = !!address;
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    line1: '',
    isDefault: false,
  });

  // Sync formData với address khi dialog mở hoặc address thay đổi
  useEffect(() => {
    if (open) {
      if (address) {
        setFormData({
          fullName: address.fullName || '',
          phone: address.phone || '',
          province: address.province || '',
          district: address.district || '',
          ward: address.ward || '',
          line1: address.line1 || '',
          isDefault: address.isDefault || false,
        });
      } else {
        // Reset form khi thêm mới
        setFormData({
          fullName: '',
          phone: '',
          province: '',
          district: '',
          ward: '',
          line1: '',
          isDefault: false,
        });
      }
    }
  }, [open, address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      await updateAddress.mutateAsync({
        id: address.id,
        data: formData,
      });
    } else {
      await createAddress.mutateAsync(formData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-[1.8rem] border border-border/80 bg-card p-6 md:p-8 shadow-luxury">
        <DialogHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-secondary rounded-full flex items-center justify-center text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl md:text-2xl font-serif font-bold text-foreground tracking-tight">
              {isEdit ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground text-sm font-medium">Họ và tên <span className="text-destructive">*</span></Label>
              <Input
                id="fullName"
                required
                className="h-11 rounded-xl bg-secondary/40 border-border/70 focus:bg-background focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all text-foreground placeholder:text-muted-foreground/60"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground text-sm font-medium">Số điện thoại <span className="text-destructive">*</span></Label>
              <Input
                id="phone"
                required
                type="tel"
                className="h-11 rounded-xl bg-secondary/40 border-border/70 focus:bg-background focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all text-foreground placeholder:text-muted-foreground/60"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line1" className="text-foreground text-sm font-medium">Địa chỉ chi tiết <span className="text-destructive">*</span></Label>
            <Input
              id="line1"
              required
              className="h-11 rounded-xl bg-secondary/40 border-border/70 focus:bg-background focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all text-foreground placeholder:text-muted-foreground/60"
              value={formData.line1}
              onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
              placeholder="Số nhà, tên đường..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label htmlFor="province" className="text-foreground text-sm font-medium">Tỉnh/Thành phố <span className="text-destructive">*</span></Label>
              <Input
                id="province"
                required
                className="h-11 rounded-xl bg-secondary/40 border-border/70 focus:bg-background focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all text-foreground placeholder:text-muted-foreground/60"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="Hồ Chí Minh"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district" className="text-foreground text-sm font-medium">Quận/Huyện <span className="text-destructive">*</span></Label>
              <Input
                id="district"
                required
                className="h-11 rounded-xl bg-secondary/40 border-border/70 focus:bg-background focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all text-foreground placeholder:text-muted-foreground/60"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Quận 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ward" className="text-foreground text-sm font-medium">Phường/Xã <span className="text-destructive">*</span></Label>
              <Input
                id="ward"
                required
                className="h-11 rounded-xl bg-secondary/40 border-border/70 focus:bg-background focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all text-foreground placeholder:text-muted-foreground/60"
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                placeholder="Bến Nghé"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-secondary/30 rounded-xl border border-border/40">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDefault: checked as boolean })
              }
              className="w-5 h-5 rounded-md border-border text-primary focus-visible:ring-ring"
            />
            <Label htmlFor="isDefault" className="cursor-pointer text-foreground text-sm font-medium">
              Đặt làm địa chỉ mặc định
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-full border-border hover:bg-secondary text-foreground px-6 text-sm font-medium">
              Hủy
            </Button>
            <Button
              type="submit"
              className="h-11 px-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-luxury text-sm font-medium"
              disabled={createAddress.isPending || updateAddress.isPending}
            >
              {isEdit ? 'Cập nhật' : 'Thêm địa chỉ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
