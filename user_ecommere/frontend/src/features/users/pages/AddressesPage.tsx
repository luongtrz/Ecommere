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
      <div className="container max-w-5xl py-12 md:py-16 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded-2xl w-1/4 mb-4" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-44 bg-muted rounded-[1.8rem]" />
            <div className="h-44 bg-muted rounded-[1.8rem]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Quản lý địa chỉ" />
      <div className="min-h-screen bg-background py-8 md:py-16">
        <div className="container max-w-5xl px-4 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/60">
            <div>
              <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground block mb-1">Tài khoản cá nhân</span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">Sổ địa chỉ</h1>
              <p className="text-sm text-muted-foreground mt-1">Quản lý địa chỉ giao hàng của bạn</p>
            </div>
            <Button onClick={handleAdd} className="rounded-full shadow-luxury bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 text-xs font-medium self-start md:self-auto">
              <Plus className="h-4 w-4 mr-2" />
              Thêm địa chỉ mới
            </Button>
          </div>

          {!addresses || addresses.length === 0 ? (
            <div className="bg-card rounded-[1.8rem] shadow-luxury border border-border/60 p-12 md:p-16 text-center animate-fade-in">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <MapPin className="h-8 w-8 text-primary/80" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-foreground mb-2">Chưa có địa chỉ nào</h3>
              <p className="text-muted-foreground mb-6 text-sm max-w-sm mx-auto">
                Hãy thêm địa chỉ giao hàng để thuận tiện hơn khi mua sắm tại Thai Spray Shop
              </p>
              <Button onClick={handleAdd} size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 shadow-luxury">
                <Plus className="h-4 w-4 mr-2" />
                Thêm địa chỉ đầu tiên
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {addresses.map((address) => (
                <Card
                  key={address.id}
                  className={`border transition-all duration-300 rounded-[1.8rem] overflow-hidden group shadow-luxury hover:shadow-luxury-glow hover:-translate-y-0.5 bg-card ${address.isDefault ? 'border-accent/50 ring-1 ring-accent/30' : 'border-border/60'}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-border/50 ${address.isDefault ? 'bg-accent/15 text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}>
                          {address.isDefault ? <Home className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-foreground text-lg leading-tight">{address.fullName}</h3>
                          {address.isDefault && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-foreground bg-accent/20 border border-accent/30 px-2.5 py-0.5 rounded-full w-fit mt-1">
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
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => handleEdit(address)}
                          aria-label="Chỉnh sửa địa chỉ"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(address.id)}
                          disabled={deleteAddress.isPending}
                          aria-label="Xóa địa chỉ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2.5 pl-0 md:pl-14">
                      <div className="text-foreground font-medium text-sm">
                        {address.phone}
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed bg-secondary/30 p-3.5 rounded-xl border border-border/40">
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
