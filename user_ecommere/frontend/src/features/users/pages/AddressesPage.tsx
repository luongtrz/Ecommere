import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
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
      <div className="container py-8 md:py-12 max-w-5xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48 mb-6" />
          <div className="h-28 bg-muted rounded-lg w-full" />
          <div className="h-28 bg-muted rounded-lg w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Quản lý địa chỉ" />
      <div className="container py-8 md:py-12 max-w-5xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
          <Link to="/account" className="hover:text-foreground transition-colors">
            Tài khoản
          </Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">Sổ địa chỉ</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              Sổ địa chỉ
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý địa chỉ giao hàng của bạn
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm địa chỉ mới
          </Button>
        </div>

        {!addresses || addresses.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 md:p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-foreground">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
              Chưa có địa chỉ nào
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
              Hãy thêm địa chỉ giao hàng để thuận tiện hơn khi mua sắm tại Thai Spray Shop
            </p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm địa chỉ đầu tiên
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-foreground text-base">
                          {address.fullName}
                        </h3>
                        {address.isDefault && (
                          <Badge variant="secondary" className="rounded-sm text-xs font-normal">
                            Mặc định
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground tabular">{address.phone}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {address.line1}, {address.ward}, {address.district}, {address.province}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleEdit(address)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Chỉnh sửa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(address.id)}
                    disabled={deleteAddress.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Xóa
                  </Button>
                </div>
              </div>
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
