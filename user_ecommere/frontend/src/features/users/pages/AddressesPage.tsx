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
    if (confirm('Ban co chac chan muon xoa dia chi nay?')) {
      await deleteAddress.mutateAsync(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedAddress(undefined);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-20 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-xl w-full max-w-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Quan ly dia chi" />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="container max-w-5xl py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">So dia chi</h1>
              <p className="text-gray-600">Quan ly dia chi giao hang cua ban</p>
            </div>
            <Button onClick={handleAdd} className="rounded-xl shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-11 px-6">
              <Plus className="h-5 w-5 mr-2" />
              Them dia chi moi
            </Button>
          </div>

          {!addresses || addresses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center animate-fade-in">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <MapPin className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Chua co dia chi nao</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                Hay them dia chi giao hang de thuan tien hon khi mua sam tai Thai Spray Shop
              </p>
              <Button onClick={handleAdd} size="lg" className="rounded-xl">
                <Plus className="h-5 w-5 mr-2" />
                Them dia chi dau tien
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {addresses.map((address) => (
                <Card
                  key={address.id}
                  className={`border transition-all duration-300 rounded-2xl overflow-hidden group hover:shadow-lg ${address.isDefault ? 'border-blue-200 bg-blue-50/10 shadow-md ring-1 ring-blue-100' : 'border-gray-100 shadow-sm hover:border-gray-200'}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${address.isDefault ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                          {address.isDefault ? <Home className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{address.fullName}</h3>
                          {address.isDefault && (
                            <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit mt-0.5">
                              <CheckCircle className="h-3 w-3" />
                              Mac dinh
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => handleEdit(address)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(address.id)}
                          disabled={deleteAddress.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 pl-[52px]">
                      <div className="text-gray-900 font-medium">
                        {address.phone}
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                        {address.line1}, {address.ward}, {address.district}, {address.province}
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
