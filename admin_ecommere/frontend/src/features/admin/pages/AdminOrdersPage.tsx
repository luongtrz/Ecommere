import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useState, useEffect } from 'react';
import { useAdminOrders, useUpdateOrderStatus } from '../hooks/useAdminOrders';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Package,
  Calendar,
  Filter
} from 'lucide-react';
import type { OrderStatus } from '../api/admin-orders.api';
import { useToast } from '@/hooks/useToast';
import { Link } from 'react-router-dom';

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  PAID: { label: 'Đã thanh toán', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  PACKING: { label: 'Đang đóng gói', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  SHIPPED: { label: 'Đang giao hàng', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  DELIVERED: { label: 'Giao thành công', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' },
  CANCELED: { label: 'Đã hủy', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
};

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const toast = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = useAdminOrders({
    page,
    limit: 10,
    search: debouncedSearch,
    status: statusFilter !== 'ALL' ? (statusFilter as OrderStatus) : undefined,
  });

  const updateStatusMutation = useUpdateOrderStatus();

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, orderCode: string) => {
    updateStatusMutation.mutate(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Cập nhật trạng thái thành công!</span>
              <span className="text-sm">Đơn hàng #{orderCode} đã chuyển sang {ORDER_STATUS_MAP[newStatus].label}</span>
            </div>
          );
        },
        onError: () => {
          toast.error('Cập nhật thất bại. Vui lòng thử lại.');
        },
      }
    );
  };

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const config = ORDER_STATUS_MAP[status] || { label: status, color: 'text-gray-700', bg: 'bg-gray-100' };
    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}>
        {config.label}
      </div>
    );
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-lg font-semibold text-gray-900">Không thể tải danh sách đơn hàng</h2>
        <Button onClick={() => window.location.reload()}>Thử lại</Button>
      </div>
    );
  }

  // Parse address for display (safely)
  const parseAddress = (addressJson: string | null) => {
    if (!addressJson) return '';
    try {
      const addr = JSON.parse(addressJson);
      return typeof addr === 'object' ? (addr.address || addr.line1 || addressJson) : addressJson;
    } catch {
      return addressJson;
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground mt-1">Theo dõi và xử lý các đơn hàng của cửa hàng.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Calendar className="mr-2 h-4 w-4" />
            Hôm nay: {new Date().toLocaleDateString('vi-VN')}
          </Button>
          <Button>+ Tạo đơn hàng</Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription>Tổng đơn hàng tháng này</CardDescription>
            <CardTitle className="text-2xl font-bold">{data?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription>Đang chờ xử lý</CardDescription>
            <CardTitle className="text-2xl font-bold text-yellow-600">
              --
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription>Doanh thu hôm nay</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600">--</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo mã đơn, khách hàng..."
            className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              {Object.entries(ORDER_STATUS_MAP).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border shadow-sm bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Mã đơn</th>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4 text-right">Tổng tiền</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!data?.data?.length ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Không tìm thấy đơn hàng nào</p>
                    </td>
                  </tr>
                ) : (
                  data?.data?.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link to={`/admin/orders/${order.id}`} className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {order.code}
                          </Link>
                          <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(order.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2 max-w-[300px]">
                          {order.items?.slice(0, 2).map((item: any, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-md border border-gray-100 shadow-sm overflow-hidden shrink-0">
                                {item.variant?.product?.images?.[0] ? (
                                  <img
                                    src={item.variant.product.images[0]}
                                    alt="Product"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <Package className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate" title={item.nameSnapshot}>
                                  {item.nameSnapshot}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  x{item.quantity} {item.scentSnapshot && `• ${item.scentSnapshot}`}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(order.items?.length || 0) > 2 && (
                            <p className="text-xs text-muted-foreground pl-1">
                              +{order.items!.length - 2} sản phẩm khác
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.user?.name || order.user?.email}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{order.user?.phone || 'Chưa cập nhật SĐT'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                          {parseAddress(order.addressJson)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-gray-900">{formatCurrency(order.total)}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex justify-end items-center gap-1">
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 font-normal">
                            {order.paymentMethod}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Quick Status Update */}
                          <Select
                            defaultValue={order.status}
                            onValueChange={(val) => handleUpdateStatus(order.id, val as OrderStatus, order.code)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs bg-white border-gray-200 shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ORDER_STATUS_MAP).map(([key, config]) => (
                                <SelectItem key={key} value={key} className="text-xs">
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-primary" asChild>
                            <Link to={`/admin/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data?.totalPages > 1 && (
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-500">
              Trang {page} / {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="h-8"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
