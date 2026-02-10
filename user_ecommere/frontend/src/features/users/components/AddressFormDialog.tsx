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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <MapPin className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">{isEdit ? 'Chinh sua dia chi' : 'Them dia chi moi'}</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-700 font-medium">Ho va ten <span className="text-red-500">*</span></Label>
              <Input
                id="fullName"
                required
                className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Nguyen Van A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">So dien thoai <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                required
                type="tel"
                className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line1" className="text-gray-700 font-medium">Dia chi chi tiet <span className="text-red-500">*</span></Label>
            <Input
              id="line1"
              required
              className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all"
              value={formData.line1}
              onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
              placeholder="So nha, ten duong..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label htmlFor="province" className="text-gray-700 font-medium">Tinh/Thanh pho <span className="text-red-500">*</span></Label>
              <Input
                id="province"
                required
                className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="Ho Chi Minh"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district" className="text-gray-700 font-medium">Quan/Huyen <span className="text-red-500">*</span></Label>
              <Input
                id="district"
                required
                className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Quan 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ward" className="text-gray-700 font-medium">Phuong/Xa <span className="text-red-500">*</span></Label>
              <Input
                id="ward"
                required
                className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-all"
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                placeholder="Ben Nghe"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDefault: checked as boolean })
              }
              className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="isDefault" className="cursor-pointer text-gray-700 font-medium">
              Dat lam dia chi mac dinh
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-11 rounded-xl hover:bg-gray-100">
              Huy
            </Button>
            <Button
              type="submit"
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20"
              disabled={createAddress.isPending || updateAddress.isPending}
            >
              {isEdit ? 'Cap nhat' : 'Them dia chi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
