import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên *</Label>
              <Input
                id="fullName"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input
                id="phone"
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line1">Địa chỉ chi tiết *</Label>
            <Input
              id="line1"
              required
              value={formData.line1}
              onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
              placeholder="Số nhà, tên đường..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ward">Phường/Xã *</Label>
              <Input
                id="ward"
                required
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                placeholder="Phường Bến Nghé"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">Quận/Huyện *</Label>
              <Input
                id="district"
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Quận 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Tỉnh/Thành phố *</Label>
              <Input
                id="province"
                required
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="Hồ Chí Minh"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDefault: checked as boolean })
              }
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Đặt làm địa chỉ mặc định
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
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
