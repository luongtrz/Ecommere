import { SEO } from '@/lib/seo';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAdminOrders, useUpdateOrderStatus } from '../hooks/useAdminOrders';
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
    const { id } = useParams<{ id: string }>();
    const toast = useToast();
    const toast = useToast();

    // Fetch orders with filter by ID
    const { data: ordersData, isLoading } = useAdminOrders({
        page: 1,
        limit: 1,
        search: id // Use order ID as search to get single order
    });

    const updateStatus = useUpdateOrderStatus();

    // Get order from list response
    const rawOrder = ordersData?.data?.[0];

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
            <>
                <SEO title="Đang tải..." />
                <div className="py-12">
                    <LoadingSpinner />
                </div>
            </>
        );
    }

    if (!order) {
        return (
            <>
                <SEO title="Không tìm thấy đơn hàng" />
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold mb-4">Không tìm thấy đơn hàng</h1>
                    <Button asChild>
                        <Link to="/admin/orders">Quay lại danh sách</Link>
                    </Button>
                </div>
            </>
        );
    }

    const StatusIcon = ORDER_STATUS_MAP[order.status]?.icon || Clock;
    const availableStatuses = STATUS_TRANSITIONS[order.status] || [];

    return (
        <>
            <SEO title={`Đơn hàng ${order.code}`} />

            {/* Header */}
            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild className="mb-4">
                    <Link to="/admin/orders" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại danh sách
                    </Link>
                </Button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Đơn hàng #{order.code}</h1>
                        <p className="text-sm text-muted-foreground">
                            Đặt ngày {formatDateTime(order.createdAt)}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Badge variant={ORDER_STATUS_MAP[order.status]?.variant} className="text-lg px-4 py-2">
                            <StatusIcon className="h-4 w-4 mr-2" />
                            {ORDER_STATUS_MAP[order.status]?.label}
                        </Badge>

                        {availableStatuses.length > 0 && (
                            <Select value={order.status} onValueChange={handleUpdateStatus}>
                                <SelectTrigger className="w-48">
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Sản phẩm ({order.items?.length || 0})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items?.map((item: any, index: number) => (
                                    <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                                        <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0">
                                            {item.product?.images?.[0] && (
                                                <img
                                                    src={item.product.images[0]}
                                                    alt={item.product?.name}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{item.product?.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {item.variant?.scent} - {item.variant?.volumeMl}ml
                                            </p>
                                            <p className="text-sm text-muted-foreground">SKU: {item.variant?.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(item.price)}</p>
                                            <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                                            <p className="text-sm font-semibold mt-1">
                                                {formatCurrency(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Thông tin khách hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Tên khách hàng</p>
                                <p className="font-semibold">{order.user?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-semibold">{order.user?.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Số điện thoại</p>
                                <p className="font-semibold">{order.shippingAddress?.phone || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Địa chỉ giao hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <p className="font-semibold">{order.shippingAddress?.fullName}</p>
                                <p className="text-sm">{order.shippingAddress?.phone}</p>
                                <p className="text-sm text-muted-foreground">
                                    {order.shippingAddress?.line1}
                                    {order.shippingAddress?.line2 && `, ${order.shippingAddress.line2}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {order.shippingAddress?.ward}, {order.shippingAddress?.district}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {order.shippingAddress?.province}, {order.shippingAddress?.country}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Payment Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Thanh toán
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Phương thức</span>
                                <span className="font-semibold">{order.paymentMethod}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Tạm tính</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Phí vận chuyển</span>
                                <span>{formatCurrency(order.shippingFee)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Tổng cộng</span>
                                <span className="text-primary">{formatCurrency(order.total)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Lịch sử đơn hàng
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary"></div>
                                    <div>
                                        <p className="font-semibold text-sm">Đơn hàng đã tạo</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDateTime(order.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                {order.updatedAt !== order.createdAt && (
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-muted-foreground"></div>
                                        <div>
                                            <p className="font-semibold text-sm">Cập nhật trạng thái</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateTime(order.updatedAt)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
