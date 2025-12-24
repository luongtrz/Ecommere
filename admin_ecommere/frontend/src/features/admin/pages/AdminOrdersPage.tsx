import { Link } from 'react-router-dom';
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
import { AlertCircle, ChevronLeft, ChevronRight, Search, Eye, Package } from 'lucide-react';
import type { OrderStatus } from '../api/admin-orders.api';
import { useToast } from '@/hooks/useToast';

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
  const toast = useToast();

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

  const handleUpdateStatus = async (orderId: string, orderCode: string, newStatus: OrderStatus) => {
    const statusLabel = ORDER_STATUS_MAP[newStatus].label;

    toast.promise(
      updateStatus.mutateAsync({ orderId, status: newStatus }),
      {
        loading: `Đang cập nhật trạng thái đơn hàng ${orderCode}...`,
        success: () => {
          return `✅ Đơn hàng ${orderCode} đã được cập nhật thành "${statusLabel}"`;
        },
        error: (err) => {
          return `❌ Không thể cập nhật đơn hàng: ${err?.message || 'Lỗi không xác định'}`;
        },
      }
    );
  };

  // Parse address for display (currently not used but may be needed for order details)
  // const parseAddress = (addressJson: string) => {
  //   try {
  //     const addr = JSON.parse(addressJson);
  //     return `${addr.fullName} - ${addr.phone} - ${addr.line1}, ${addr.ward}, ${addr.district}, ${addr.province}`;
  //   } catch {
  //     return addressJson;
  //   }
  // };


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
            <CardTitle className="text-2xl font-bold">{data?.meta.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription>Đang chờ xử lý</CardDescription>
            <CardTitle className="text-2xl font-bold text-yellow-600">
              {/* Placeholder Logic */}
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
                {data?.orders.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>Không tìm thấy đơn hàng nào</p>
                            </td>
                        </tr>
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
        </Card >
      </div >
    </>
  );
}
