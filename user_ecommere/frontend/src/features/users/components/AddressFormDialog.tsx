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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-lg">
        <DialogHeader className="pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
              <MapPin className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {isEdit ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-900 text-sm font-medium">Họ và tên <span className="text-rose-600">*</span></Label>
              <Input
                id="fullName"
                required
                className="h-11 rounded-lg bg-white border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all text-slate-900 placeholder:text-slate-400"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-900 text-sm font-medium">Số điện thoại <span className="text-rose-600">*</span></Label>
              <Input
                id="phone"
                required
                type="tel"
                className="h-11 rounded-lg bg-white border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all text-slate-900 placeholder:text-slate-400"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line1" className="text-slate-900 text-sm font-medium">Địa chỉ chi tiết <span className="text-rose-600">*</span></Label>
            <Input
              id="line1"
              required
              className="h-11 rounded-lg bg-white border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all text-slate-900 placeholder:text-slate-400"
              value={formData.line1}
              onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
              placeholder="Số nhà, tên đường..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label htmlFor="province" className="text-slate-900 text-sm font-medium">Tỉnh/Thành phố <span className="text-rose-600">*</span></Label>
              <Input
                id="province"
                required
                className="h-11 rounded-lg bg-white border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all text-slate-900 placeholder:text-slate-400"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="Hồ Chí Minh"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district" className="text-slate-900 text-sm font-medium">Quận/Huyện <span className="text-rose-600">*</span></Label>
              <Input
                id="district"
                required
                className="h-11 rounded-lg bg-white border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all text-slate-900 placeholder:text-slate-400"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Quận 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ward" className="text-slate-900 text-sm font-medium">Phường/Xã <span className="text-rose-600">*</span></Label>
              <Input
                id="ward"
                required
                className="h-11 rounded-lg bg-white border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all text-slate-900 placeholder:text-slate-400"
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                placeholder="Bến Nghé"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDefault: checked as boolean })
              }
              className="w-5 h-5 rounded border-slate-300 text-teal-600 focus-visible:ring-teal-500 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
            />
            <Label htmlFor="isDefault" className="cursor-pointer text-slate-900 text-sm font-medium">
              Đặt làm địa chỉ mặc định
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-6 text-sm font-medium transition-colors">
              Hủy
            </Button>
            <Button
              type="submit"
              className="h-11 px-7 rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 shadow-sm text-sm font-medium transition-colors"
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
