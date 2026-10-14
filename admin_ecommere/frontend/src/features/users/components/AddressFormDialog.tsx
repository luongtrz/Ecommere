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
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateAddress, useUpdateAddress } from '../hooks/useAddresses';
import type { Address } from '../api/users.api';

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border text-card-foreground shadow-2xl rounded-2xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-card sticky top-0 z-10 backdrop-blur">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {isEdit ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Điền đầy đủ thông tin địa chỉ để thuận tiện cho việc giao nhận hàng
          </DialogDescription>
        </DialogHeader>

        {/* Form Body with Sectioned Fields */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Thông tin liên hệ */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Thông tin người nhận
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  Họ và tên *
                </Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="bg-background border-input text-foreground focus-visible:ring-ring rounded-xl h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Số điện thoại *
                </Label>
                <Input
                  id="phone"
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0912345678"
                  className="bg-background border-input text-foreground focus-visible:ring-ring rounded-xl h-10 tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin địa chỉ */}
          <div className="space-y-4 border-t border-border pt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Địa chỉ nhận hàng
            </div>

            <div className="space-y-2">
              <Label htmlFor="line1" className="text-sm font-medium text-foreground">
                Địa chỉ chi tiết *
              </Label>
              <Input
                id="line1"
                required
                value={formData.line1}
                onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                placeholder="Số nhà, tên đường..."
                className="bg-background border-input text-foreground focus-visible:ring-ring rounded-xl h-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ward" className="text-sm font-medium text-foreground">
                  Phường/Xã *
                </Label>
                <Input
                  id="ward"
                  required
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  placeholder="Phường Bến Nghé"
                  className="bg-background border-input text-foreground focus-visible:ring-ring rounded-xl h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm font-medium text-foreground">
                  Quận/Huyện *
                </Label>
                <Input
                  id="district"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Quận 1"
                  className="bg-background border-input text-foreground focus-visible:ring-ring rounded-xl h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province" className="text-sm font-medium text-foreground">
                  Tỉnh/Thành phố *
                </Label>
                <Input
                  id="province"
                  required
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="Hồ Chí Minh"
                  className="bg-background border-input text-foreground focus-visible:ring-ring rounded-xl h-10"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Cài đặt mặc định */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center space-x-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/30 transition-colors">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked as boolean })
                }
                className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="isDefault" className="cursor-pointer text-sm font-medium text-foreground">
                Đặt làm địa chỉ mặc định
              </Label>
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
              disabled={createAddress.isPending || updateAddress.isPending}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isEdit ? 'Cập nhật' : 'Thêm địa chỉ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
