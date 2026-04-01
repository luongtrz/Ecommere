import { SEO } from '@/lib/seo';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAdminOrder, useUpdateOrderStatus } from '../hooks/useAdminOrders';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Package, User, MapPin, CreditCard, Clock, CheckCircle } from 'lucide-react';
import type { OrderStatus } from '../api/admin-orders.api';
import { useToast } from '@/hooks/useToast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const ORDER_STATUS_MAP: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }
> = {
    PENDING_PAYMENT: { label: 'Chờ thanh toán', variant: 'outline', icon: Clock },
    PAID: { label: 'Đã thanh toán', variant: 'default', icon: CheckCircle },
    PACKING: { label: 'Đang đóng gói', variant: 'secondary', icon: Package },
    SHIPPED: { label: 'Đã giao vận', variant: 'default', icon: Package },
    DELIVERED: { label: 'Đã giao', variant: 'default', icon: CheckCircle },
    CANCELED: { label: 'Đã hủy', variant: 'destructive', icon: Clock },
    REFUNDED: { label: 'Đã hoàn tiền', variant: 'destructive', icon: Clock },
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

export function AdminOrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const toast = useToast();

    // Fetch single order by ID
    const { data: rawOrder, isLoading } = useAdminOrder(id || '');

    const updateStatus = useUpdateOrderStatus();

    // Parse addressJson if it exists
    const order = rawOrder ? {
        ...rawOrder,
        shippingAddress: rawOrder.addressJson ? JSON.parse(rawOrder.addressJson) : null
    } : null;

    const handleUpdateStatus = async (newStatus: OrderStatus) => {
        if (!order) return;

        toast.promise(
            updateStatus.mutateAsync({ orderId: order.id, status: newStatus }),
            {
                loading: `Đang cập nhật trạng thái đơn hàng ${order.code}...`,
                success: () => {
                    return `✅ Đơn hàng ${order.code} đã được cập nhật thành "${ORDER_STATUS_MAP[newStatus].label}"`;
                },
                error: (err) => {
                    return `❌ Không thể cập nhật đơn hàng: ${err?.message || 'Lỗi không xác định'}`;
                },
            }
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
                <h1 className="text-2xl font-bold">Không tìm thấy đơn hàng</h1>
                <Button asChild>
                    <Link to="/admin/orders">Quay lại danh sách</Link>
                </Button>
            </div>
        );
    }

    const StatusIcon = ORDER_STATUS_MAP[order.status]?.icon || Clock;
    const availableStatuses = STATUS_TRANSITIONS[order.status] || [];

    return (
        <>
            <SEO title={`Đơn hàng ${order.code}`} />

            <div className="space-y-4">
                {/* Header Compact */}
                <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/admin/orders">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                #{order.code}
                                <span className="text-sm font-normal text-muted-foreground">
                                    ({formatDateTime(order.createdAt)})
                                </span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant={ORDER_STATUS_MAP[order.status]?.variant} className="px-3 py-1 text-sm">
                            <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                            {ORDER_STATUS_MAP[order.status]?.label}
                        </Badge>

                        {availableStatuses.length > 0 && (
                            <Select value={order.status} onValueChange={handleUpdateStatus}>
                                <SelectTrigger className="w-[180px] h-9">
                                    <SelectValue placeholder="Cập nhật trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={order.status} disabled>
                                        {ORDER_STATUS_MAP[order.status]?.label}
                                    </SelectItem>
                                    {availableStatuses.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {ORDER_STATUS_MAP[status]?.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column (Products + Customer) */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Products Compact */}
                        <Card>
                            <CardHeader className="py-3 px-4 bg-muted/30">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Sản phẩm ({order.items?.length || 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {order.items?.map((item: any, index: number) => (
                                        <div key={index} className="flex gap-3 p-3 hover:bg-muted/5">
                                            <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 border overflow-hidden">
                                                {item.variant?.product?.images?.[0] && (
                                                    <img
                                                        src={item.variant.product.images[0]}
                                                        alt={item.variant?.product?.name}
                                                        loading="lazy"
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm truncate" title={item.variant?.product?.name}>
                                                    {item.variant?.product?.name}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Phân loại: {item.variant?.scent} - {item.variant?.volumeMl}ml
                                                </p>
                                                <p className="text-xs text-muted-foreground">SKU: {item.variant?.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-sm">{formatCurrency(item.unitPrice)}</p>
                                                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                                                <p className="font-medium text-sm mt-0.5 text-primary">
                                                    {formatCurrency(item.unitPrice * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer & Address Side-by-Side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="py-3 px-4 bg-muted/30">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Khách hàng
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tên:</span>
                                        <span className="font-medium">{order.user?.name || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-medium truncate ml-2">{order.user?.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">SĐT:</span>
                                        <span className="font-medium">{order.user?.phone || 'N/A'}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="py-3 px-4 bg-muted/30">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Giao hàng
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 text-sm space-y-1">
                                    <p className="font-medium">{order.shippingAddress?.fullName}</p>
                                    <p>{order.shippingAddress?.phone}</p>
                                    <p className="text-muted-foreground line-clamp-2">
                                        {order.shippingAddress?.line1}
                                        {order.shippingAddress?.line2 && `, ${order.shippingAddress.line2}`},
                                        {' '}{order.shippingAddress?.ward}, {order.shippingAddress?.district},
                                        {' '}{order.shippingAddress?.province}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column (Payment + Timeline) */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="py-3 px-4 bg-muted/30">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Thanh toán
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Phương thức</span>
                                    <Badge variant="outline">{order.paymentMethod}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Trạng thái</span>
                                    <Badge variant="secondary">{order.paymentStatus}</Badge>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tạm tính</span>
                                    <span>{formatCurrency(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phí vận chuyển</span>
                                    <span>{formatCurrency(order.shippingFee)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Giảm giá</span>
                                    <span className="text-red-600">-{formatCurrency(order.discount)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-base font-bold">
                                    <span>Tổng cộng</span>
                                    <span className="text-primary">{formatCurrency(order.total)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-3 px-4 bg-muted/30">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4 relative pl-2 border-l-2 border-muted ml-1">
                                    <div className="relative pl-4">
                                        <div className="absolute -left-[11px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-white" />
                                        <p className="font-medium text-xs text-muted-foreground mb-0.5">
                                            {formatDateTime(order.createdAt)}
                                        </p>
                                        <p className="text-sm font-medium">Đơn hàng được tạo</p>
                                    </div>

                                    {order.updatedAt !== order.createdAt && (
                                        <div className="relative pl-4">
                                            <div className="absolute -left-[11px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-white" />
                                            <p className="font-medium text-xs text-muted-foreground mb-0.5">
                                                {formatDateTime(order.updatedAt)}
                                            </p>
                                            <p className="text-sm font-medium">Cập nhật gần nhất</p>
                                            <p className="text-xs text-muted-foreground">
                                                Trạng thái: {ORDER_STATUS_MAP[order.status]?.label}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
