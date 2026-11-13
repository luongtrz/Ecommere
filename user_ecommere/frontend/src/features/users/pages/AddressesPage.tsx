import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { MapPin, Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import {
  useAddresses,
  useDeleteAddress,
  useUpdateAddress,
} from '../hooks/useAddresses';
import { AddressFormDialog } from '../components/AddressFormDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Address } from '../api/users.api';

export function AddressesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: addresses, isLoading } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const updateAddress = useUpdateAddress();
  const [selectedAddress, setSelectedAddress] = useState<Address | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'TK';
    return name
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { label: 'Tài khoản', path: '/account', active: false },
    { label: 'Đơn hàng của tôi', path: '/orders', active: false },
    { label: 'Sổ địa chỉ', path: '/addresses', active: true },
    { label: 'Danh sách yêu thích', path: '/wishlist', active: false },
  ];

  const handleEdit = (address: Address) => {
    setSelectedAddress(address);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedAddress(undefined);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (address: Address) => {
    setAddressToDelete(address);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (addressToDelete) {
      await deleteAddress.mutateAsync(addressToDelete.id);
      setIsDeleteDialogOpen(false);
      setAddressToDelete(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    await updateAddress.mutateAsync({
      id,
      data: { isDefault: true },
    });
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
        <nav
          aria-label="Breadcrumb"
          className="mb-4 text-sm text-muted-foreground"
        >
          <Link to="/" className="hover:text-foreground transition-colors">
            Trang chủ
          </Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <Link
            to="/account"
            className="hover:text-foreground transition-colors"
          >
            Tài khoản
          </Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">Sổ địa chỉ</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 md:gap-10">
          {/* Left Column on Desktop / Ordered below address content on mobile */}
          <aside className="contents md:block md:space-y-6">
            {/* User Identity Box (if user authenticated) */}
            {user && (
              <div className="order-2 md:order-none flex items-center gap-3 p-4 sm:p-0 rounded-lg sm:rounded-none bg-card sm:bg-transparent border sm:border-0 sm:border-b border-border sm:pb-6">
                <div className="h-12 w-12 rounded-full bg-secondary text-foreground flex items-center justify-center font-sans text-base font-semibold border border-border shrink-0">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-base leading-snug text-foreground truncate">
                    {user.name}
                  </p>
                  <Badge
                    variant="secondary"
                    className="rounded-sm text-xs mt-1 font-normal"
                  >
                    {user.role === 'ADMIN'
                      ? 'Quản trị viên'
                      : 'Khách hàng thân thiết'}
                  </Badge>
                </div>
              </div>
            )}

            {/* Account Navigation */}
            <div className="order-3 md:order-none">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Danh mục
              </h3>
              <nav
                aria-label="Menu tài khoản"
                className="flex flex-col space-y-2"
              >
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (!item.active) {
                        navigate(item.path);
                      }
                    }}
                    className={`w-full min-h-11 px-4 py-2.5 rounded-md text-sm text-left flex items-center justify-between transition-colors ${
                      item.active
                        ? 'bg-secondary font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Right Column: Address Book Content */}
          <div className="order-1 md:order-none space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground">
                  Sổ địa chỉ
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Quản lý địa chỉ giao hàng của bạn
                </p>
              </div>
              <Button onClick={handleAdd} className="min-h-11 sm:min-h-9 px-4">
                <Plus className="h-4 w-4 mr-2" />
                Thêm địa chỉ mới
              </Button>
            </div>

            {!addresses || addresses.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 md:p-12 text-center max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-foreground">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold leading-snug text-foreground mb-2">
                  Chưa có địa chỉ nào
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
                  Hãy thêm địa chỉ giao hàng để thuận tiện hơn khi mua sắm tại
                  Thai Spray Shop
                </p>
                <Button onClick={handleAdd} className="min-h-11 px-5">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm địa chỉ đầu tiên
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    data-testid="address-card"
                    className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base leading-snug text-foreground">
                              {address.fullName}
                            </h3>
                            {address.isDefault && (
                              <Badge
                                variant="secondary"
                                className="rounded-sm text-xs font-normal"
                              >
                                Mặc định
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground tabular">
                            {address.phone}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {address.line1}, {address.ward}, {address.district},{' '}
                        {address.province}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border flex-wrap">
                      {!address.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-11 sm:min-h-9 px-3 text-sm mr-auto"
                          onClick={() => handleSetDefault(address.id)}
                          disabled={updateAddress.isPending}
                        >
                          Đặt làm mặc định
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-11 sm:min-h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => handleEdit(address)}
                      >
                        <Edit className="h-4 w-4 mr-1.5" />
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-11 sm:min-h-9 px-3 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        onClick={() => handleDeleteClick(address)}
                        disabled={address.isDefault || deleteAddress.isPending}
                        title={
                          address.isDefault
                            ? 'Không thể xóa địa chỉ mặc định'
                            : undefined
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <AddressFormDialog
          address={selectedAddress}
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
        />

        {/* In-page Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Xóa địa chỉ?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-2">
                Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ không?
                Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>

            {addressToDelete && (
              <div className="rounded-lg border border-border bg-secondary/50 p-4 text-sm text-foreground space-y-1">
                <p className="font-semibold text-foreground">
                  {addressToDelete.fullName} - {addressToDelete.phone}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {addressToDelete.line1}, {addressToDelete.ward},{' '}
                  {addressToDelete.district}, {addressToDelete.province}
                </p>
              </div>
            )}

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto min-h-11 sm:min-h-9"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setAddressToDelete(null);
                }}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-auto min-h-11 sm:min-h-9"
                disabled={deleteAddress.isPending}
                onClick={handleConfirmDelete}
              >
                Xóa địa chỉ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
