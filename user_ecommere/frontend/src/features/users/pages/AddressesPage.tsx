import { useState } from 'react';
import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit, Trash2, Home } from 'lucide-react';
import { useAddresses, useDeleteAddress } from '../hooks/useAddresses';
import { AddressFormDialog } from '../components/AddressFormDialog';
import type { Address } from '../api/users.api';

export function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const [selectedAddress, setSelectedAddress] = useState<Address | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEdit = (address: Address) => {
    setSelectedAddress(address);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedAddress(undefined);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      await deleteAddress.mutateAsync(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedAddress(undefined);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Quản lý địa chỉ" />
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sổ địa chỉ</h1>
            <p className="text-gray-600">Quản lý địa chỉ giao hàng của bạn</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm địa chỉ
          </Button>
        </div>

        {!addresses || addresses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chưa có địa chỉ nào</h3>
                <p className="text-gray-600 mb-4">
                  Thêm địa chỉ để thuận tiện cho việc đặt hàng
                </p>
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm địa chỉ đầu tiên
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {addresses.map((address) => (
              <Card key={address.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{address.fullName}</CardTitle>
                      {address.isDefault && (
                        <Badge variant="default" className="bg-green-500">
                          <Home className="h-3 w-3 mr-1" />
                          Mặc định
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(address.id)}
                        disabled={deleteAddress.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-gray-700">
                    <p className="flex items-center gap-2">
                      <span className="font-medium">SĐT:</span>
                      {address.phone}
                    </p>
                    <p>
                      <span className="font-medium">Địa chỉ:</span> {address.line1}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.ward}, {address.district}, {address.province}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddressFormDialog
          address={selectedAddress}
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
        />
      </div>
    </>
  );
}
