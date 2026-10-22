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
      <div className="min-h-screen bg-slate-50 font-sans container max-w-5xl py-8 md:py-12 px-4 md:px-6">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <span className="text-sm font-medium">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Quản lý địa chỉ" />
      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="container max-w-5xl py-8 md:py-12 px-4 md:px-6 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Sổ địa chỉ
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Quản lý địa chỉ giao hàng của bạn
              </p>
            </div>
            <Button
              onClick={handleAdd}
              className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 font-medium gap-2 shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm địa chỉ
            </Button>
          </div>

          {/* Empty State or List */}
          {!addresses || addresses.length === 0 ? (
            <Card className="border border-slate-200 bg-white shadow-sm rounded-xl">
              <CardContent className="py-16">
                <div className="text-center max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-teal-50 mx-auto flex items-center justify-center ring-1 ring-teal-100">
                    <MapPin className="h-8 w-8 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      Chưa có địa chỉ nào
                    </h3>
                    <p className="text-sm text-slate-600">
                      Thêm địa chỉ để thuận tiện cho việc đặt hàng
                    </p>
                  </div>
                  <Button
                    onClick={handleAdd}
                    className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm địa chỉ đầu tiên
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {addresses.map((address) => (
                <Card
                  key={address.id}
                  className="border border-slate-200 bg-white rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-sm flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 border-b border-slate-100 p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base md:text-lg font-semibold text-slate-900">
                          {address.fullName}
                        </CardTitle>
                        {address.isDefault && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-0 ring-1 ring-emerald-200 text-xs gap-1 font-medium"
                          >
                            <Home className="h-3 w-3 mr-1 text-emerald-600" />
                            Mặc định
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(address)}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          aria-label="Chỉnh sửa địa chỉ"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(address.id)}
                          disabled={deleteAddress.isPending}
                          className="h-8 w-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          aria-label="Xóa địa chỉ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 p-4 md:p-5 space-y-3">
                    <div className="space-y-2 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">SĐT:</span>
                        <span className="tabular-nums font-semibold text-slate-900">
                          {address.phone}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">
                          Địa chỉ:
                        </span>{' '}
                        <span className="text-slate-700">{address.line1}</span>
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {address.ward}, {address.district}, {address.province}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Dialog */}
          <AddressFormDialog
            address={selectedAddress}
            open={isDialogOpen}
            onOpenChange={handleDialogClose}
          />
        </div>
      </div>
    </>
  );
}
