import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useAdminOrders, useUpdateOrderStatus } from '../hooks/useAdminOrders';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { OrderStatus } from '../api/admin-orders.api';

const ORDER_STATUS_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', variant: 'outline' },
  PAID: { label: 'Đã thanh toán', variant: 'default' },
  PACKING: { label: 'Đang đóng gói', variant: 'secondary' },
  SHIPPED: { label: 'Đã giao vận', variant: 'default' },
  DELIVERED: { label: 'Đã giao', variant: 'default' },
  CANCELED: { label: 'Đã hủy', variant: 'destructive' },
  REFUNDED: { label: 'Đã hoàn tiền', variant: 'destructive' },
};

const STATUS_TRANSITIONS: Record<string, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELED'],
  PAID: ['PACKING', 'CANCELED', 'REFUNDED'],
  PACKING: ['SHIPPED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: [],
  CANCELED: [],
  REFUNDED: [],
};

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, isError, isFetching } = useAdminOrders({
    page,
    limit: 20,
    status: status === 'ALL' ? undefined : status,
    search: search || undefined,
  });

  const updateStatus = useUpdateOrderStatus();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as OrderStatus | 'ALL');
    setPage(1);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (confirm(`Xác nhận cập nhật trạng thái đơn hàng thành "${ORDER_STATUS_MAP[newStatus].label}"?`)) {
      try {
        await updateStatus.mutateAsync({ orderId, status: newStatus });
      } catch (error) {
        alert('Không thể cập nhật trạng thái đơn hàng');
      }
    }
  };

  return (
    <>
      <SEO title="Quản lý đơn hàng - Admin" />
      <div>
        <h1 className="text-3xl font-bold mb-8">Quản lý đơn hàng</h1>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm theo mã đơn, email khách hàng..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleSearch}>Tìm kiếm</Button>
                </div>
              </div>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  {Object.entries(ORDER_STATUS_MAP).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Danh sách đơn hàng
              {data && <span className="ml-2 text-muted-foreground font-normal">({data.total} đơn)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || isFetching ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded">
                    <Skeleton className="h-16 w-16" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>Không thể tải danh sách đơn hàng</p>
              </div>
            ) : !data || data.data.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                {search || status !== 'ALL' ? 'Không tìm thấy đơn hàng nào' : 'Chưa có đơn hàng nào'}
              </p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Mã đơn</th>
                        <th className="text-left py-3 px-4 font-medium">Khách hàng</th>
                        <th className="text-left py-3 px-4 font-medium">Tổng tiền</th>
                        <th className="text-left py-3 px-4 font-medium">Trạng thái</th>
                        <th className="text-left py-3 px-4 font-medium">Ngày đặt</th>
                        <th className="text-left py-3 px-4 font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{order.code}</div>
                            <div className="text-xs text-muted-foreground">{order.paymentMethod}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{order.user?.name || order.user?.email}</div>
                            {order.user?.phone && (
                              <div className="text-xs text-muted-foreground">{order.user.phone}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{formatCurrency(order.total)}</div>
                            {order.discount > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Giảm: {formatCurrency(order.discount)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={ORDER_STATUS_MAP[order.status].variant}>
                              {ORDER_STATUS_MAP[order.status].label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {formatDateTime(order.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            {STATUS_TRANSITIONS[order.status].length > 0 && (
                              <Select
                                onValueChange={(value) => handleUpdateStatus(order.id, value as OrderStatus)}
                                disabled={updateStatus.isPending}
                              >
                                <SelectTrigger className="w-[140px] h-8">
                                  <SelectValue placeholder="Cập nhật..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_TRANSITIONS[order.status].map((nextStatus) => (
                                    <SelectItem key={nextStatus} value={nextStatus}>
                                      {ORDER_STATUS_MAP[nextStatus].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {data.data.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{order.code}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDateTime(order.createdAt)}
                          </div>
                        </div>
                        <Badge variant={ORDER_STATUS_MAP[order.status].variant}>
                          {ORDER_STATUS_MAP[order.status].label}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">{order.user?.name || order.user?.email}</div>
                        {order.user?.phone && (
                          <div className="text-muted-foreground">{order.user.phone}</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-medium text-lg">{formatCurrency(order.total)}</span>
                        {STATUS_TRANSITIONS[order.status].length > 0 && (
                          <Select
                            onValueChange={(value) => handleUpdateStatus(order.id, value as OrderStatus)}
                            disabled={updateStatus.isPending}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue placeholder="Cập nhật..." />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_TRANSITIONS[order.status].map((nextStatus) => (
                                <SelectItem key={nextStatus} value={nextStatus}>
                                  {ORDER_STATUS_MAP[nextStatus].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-muted-foreground">
                      Trang {data.page} / {data.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === data.totalPages}
                      >
                        Sau
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
