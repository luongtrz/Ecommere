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
      <div className="container max-w-5xl py-8 px-4 md:px-6">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-medium">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Quản lý địa chỉ" />
      <div className="container max-w-5xl py-8 px-4 md:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Sổ địa chỉ
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý địa chỉ giao hàng của bạn
            </p>
          </div>
          <Button
            onClick={handleAdd}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm địa chỉ
          </Button>
        </div>

        {/* Empty State or List */}
        {!addresses || addresses.length === 0 ? (
          <Card className="border border-border bg-card shadow-sm rounded-xl">
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted/40 mx-auto flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Chưa có địa chỉ nào
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Thêm địa chỉ để thuận tiện cho việc đặt hàng
                  </p>
                </div>
                <Button
                  onClick={handleAdd}
                  className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
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
                className="border border-border bg-card rounded-xl hover:border-primary/40 transition-all duration-300 shadow-sm flex flex-col justify-between"
              >
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base md:text-lg font-semibold text-foreground">
                        {address.fullName}
                      </CardTitle>
                      {address.isDefault && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/15 text-emerald-300 border-emerald-500/25 text-xs gap-1"
                        >
                          <Home className="h-3 w-3 mr-1" />
                          Mặc định
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(address)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                        aria-label="Chỉnh sửa địa chỉ"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(address.id)}
                        disabled={deleteAddress.isPending}
                        className="h-8 w-8 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        aria-label="Xóa địa chỉ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-foreground">SĐT:</span>
                      <span className="tabular-nums text-foreground">{address.phone}</span>
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Địa chỉ:</span> {address.line1}
                    </p>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed">
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
    </>
  );
}
