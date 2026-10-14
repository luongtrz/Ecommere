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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 text-slate-900 shadow-xl rounded-2xl p-0 gap-0 font-sans">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white sticky top-0 z-10 backdrop-blur">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            {isEdit ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 mt-0.5">
            Điền đầy đủ thông tin địa chỉ để thuận tiện cho việc giao nhận hàng
          </DialogDescription>
        </DialogHeader>

        {/* Form Body with Sectioned Fields */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Thông tin người nhận */}
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Thông tin người nhận
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-slate-900">
                  Họ và tên *
                </Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg h-10 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-900">
                  Số điện thoại *
                </Label>
                <Input
                  id="phone"
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0912345678"
                  className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg h-10 tabular-nums text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin địa chỉ */}
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Địa chỉ nhận hàng
            </div>

            <div className="space-y-2">
              <Label htmlFor="line1" className="text-sm font-medium text-slate-900">
                Địa chỉ chi tiết *
              </Label>
              <Input
                id="line1"
                required
                value={formData.line1}
                onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                placeholder="Số nhà, tên đường..."
                className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ward" className="text-sm font-medium text-slate-900">
                  Phường/Xã *
                </Label>
                <Input
                  id="ward"
                  required
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  placeholder="Phường Bến Nghé"
                  className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg h-10 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm font-medium text-slate-900">
                  Quận/Huyện *
                </Label>
                <Input
                  id="district"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Quận 1"
                  className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg h-10 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province" className="text-sm font-medium text-slate-900">
                  Tỉnh/Thành phố *
                </Label>
                <Input
                  id="province"
                  required
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="Hồ Chí Minh"
                  className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg h-10 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Cài đặt mặc định */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked as boolean })
                }
                className="border-slate-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600 text-white"
              />
              <Label htmlFor="isDefault" className="cursor-pointer text-sm font-medium text-slate-900">
                Đặt làm địa chỉ mặc định
              </Label>
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
              disabled={createAddress.isPending || updateAddress.isPending}
              className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 font-medium text-sm"
            >
              {isEdit ? 'Cập nhật' : 'Thêm địa chỉ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
