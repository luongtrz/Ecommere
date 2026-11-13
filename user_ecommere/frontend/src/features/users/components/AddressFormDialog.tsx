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

    try {
      if (isEdit) {
        await updateAddress.mutateAsync({
          id: address.id,
          data: formData,
        });
      } else {
        await createAddress.mutateAsync(formData);
      }

      onOpenChange(false);
    } catch {
      // Giữ dialog mở khi xảy ra lỗi để người dùng có thể thử lại; onError của mutation đã thông báo
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {isEdit ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                Họ và tên <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                required
                className="h-11 text-base sm:text-sm"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                Số điện thoại <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                required
                type="tel"
                className="h-11 text-base sm:text-sm"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="province" className="text-sm font-medium text-foreground">
                Tỉnh/Thành phố <span className="text-destructive">*</span>
              </Label>
              <Input
                id="province"
                required
                className="h-11 text-base sm:text-sm"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="Hồ Chí Minh"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="district" className="text-sm font-medium text-foreground">
                Quận/Huyện <span className="text-destructive">*</span>
              </Label>
              <Input
                id="district"
                required
                className="h-11 text-base sm:text-sm"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Quận 1"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ward" className="text-sm font-medium text-foreground">
                Phường/Xã <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ward"
                required
                className="h-11 text-base sm:text-sm"
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                placeholder="Bến Nghé"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="line1" className="text-sm font-medium text-foreground">
                Địa chỉ chi tiết <span className="text-destructive">*</span>
              </Label>
              <Input
                id="line1"
                required
                className="h-11 text-base sm:text-sm"
                value={formData.line1}
                onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                placeholder="Số nhà, tên đường..."
              />
            </div>
          </div>

          <div className="min-h-11 flex items-center space-x-2.5 pt-1">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDefault: checked as boolean })
              }
            />
            <Label htmlFor="isDefault" className="cursor-pointer text-sm font-normal text-foreground">
              Đặt làm địa chỉ mặc định
            </Label>
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
              disabled={createAddress.isPending || updateAddress.isPending}
            >
              {isEdit ? 'Cập nhật' : 'Thêm địa chỉ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
