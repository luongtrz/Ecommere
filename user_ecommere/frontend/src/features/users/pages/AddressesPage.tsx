import { useState } from 'react';
import { SEO } from '@/lib/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { MapPin, Plus, Edit, Trash2, Home, CheckCircle } from 'lucide-react';
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
      <div className="container max-w-5xl py-8 md:py-12 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded-xl w-1/4 mb-4" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-44 bg-slate-200 rounded-xl" />
            <div className="h-44 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Quản lý địa chỉ" />
      <div className="min-h-screen bg-slate-50 py-8 md:py-12">
        <div className="container max-w-5xl px-4 space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="uppercase tracking-wider text-xs font-semibold text-teal-600 block mb-1">
                Tài khoản cá nhân
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Sổ địa chỉ
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Quản lý địa chỉ giao hàng của bạn
              </p>
            </div>
            <Button
              onClick={handleAdd}
              className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 h-10 px-5 text-sm font-medium shadow-sm transition-colors self-start md:self-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm địa chỉ mới
            </Button>
          </div>

          {!addresses || addresses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 md:p-16 text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-600">
                <MapPin className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                Chưa có địa chỉ nào
              </h3>
              <p className="text-slate-500 mb-6 text-sm max-w-sm mx-auto">
                Hãy thêm địa chỉ giao hàng để thuận tiện hơn khi mua sắm tại
                Thai Spray Shop
              </p>
              <Button
                onClick={handleAdd}
                size="lg"
                className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 h-11 px-6 text-sm font-medium shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm địa chỉ đầu tiên
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {addresses.map((address) => (
                <Card
                  key={address.id}
                  className={`border transition-all duration-200 rounded-xl overflow-hidden group shadow-sm hover:shadow-md hover:-translate-y-0.5 bg-white ${address.isDefault ? 'border-teal-500 ring-1 ring-teal-500/30' : 'border-slate-200'}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${address.isDefault ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                        >
                          {address.isDefault ? (
                            <Home className="h-5 w-5" />
                          ) : (
                            <MapPin className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-tight">
                            {address.fullName}
                          </h3>
                          {address.isDefault && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full w-fit mt-1">
                              <CheckCircle className="h-3 w-3" />
                              Mặc định
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          onClick={() => handleEdit(address)}
                          aria-label="Chỉnh sửa địa chỉ"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          onClick={() => handleDelete(address.id)}
                          disabled={deleteAddress.isPending}
                          aria-label="Xóa địa chỉ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2.5 pl-0 md:pl-14">
                      <div className="text-slate-900 font-medium text-sm">
                        {address.phone}
                      </div>
                      <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                        {address.line1}, {address.ward}, {address.district},{' '}
                        {address.province}
                      </div>
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
      </div>
    </>
  );
}
