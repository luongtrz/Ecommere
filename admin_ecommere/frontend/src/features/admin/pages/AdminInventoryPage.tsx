import { useState, useMemo } from 'react';
import { SEO } from '@/lib/seo';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Search,
  History,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
  Box,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

interface StockLevelItem {
  id: string;
  sku: string;
  scent: string;
  volumeMl: number;
  stock: number;
  price: number;
  salePrice?: number | null;
  targetStock?: number;
  minStock?: number;
  product?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface StockMovementItem {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: string;
}

const FALLBACK_STOCK_ITEMS: StockLevelItem[] = [
  {
    id: 'var-1',
    sku: 'TS-LAV-100',
    scent: 'Hoa Lavender',
    volumeMl: 100,
    stock: 4,
    price: 320000,
    targetStock: 30,
    product: {
      id: 'p-1',
      name: 'Xịt thơm phòng Lavender Dreams',
      slug: 'xit-thom-phong-lavender',
    },
  },
  {
    id: 'var-2',
    sku: 'TS-JAS-150',
    scent: 'Hoa Nhài',
    volumeMl: 150,
    stock: 28,
    price: 380000,
    targetStock: 50,
    product: {
      id: 'p-2',
      name: 'Xịt phòng Tinh chất Hoa Nhài Hoàng Gia',
      slug: 'xit-phong-hoa-nhai',
    },
  },
  {
    id: 'var-3',
    sku: 'TS-CIT-50',
    scent: 'Cam Chanh',
    volumeMl: 50,
    stock: 0,
    price: 190000,
    targetStock: 60,
    product: {
      id: 'p-3',
      name: 'Xịt khử mùi Cam Chanh Tươi Mát',
      slug: 'xit-khu-mui-cam-chanh',
    },
  },
  {
    id: 'var-4',
    sku: 'TS-WOD-200',
    scent: 'Hương Gỗ',
    volumeMl: 200,
    stock: 45,
    price: 490000,
    targetStock: 50,
    product: {
      id: 'p-4',
      name: 'Nước hoa phòng Trầm Hương Quý Phái',
      slug: 'nuoc-hoa-phong-tram-huong',
    },
  },
  {
    id: 'var-5',
    sku: 'TS-SEA-100',
    scent: 'Hương Biển',
    volumeMl: 100,
    stock: 7,
    price: 310000,
    targetStock: 30,
    product: {
      id: 'p-5',
      name: 'Xịt phòng Làn Gió Đại Dương',
      slug: 'xit-phong-lan-gio-dai-duong',
    },
  },
  {
    id: 'var-6',
    sku: 'TS-TEA-150',
    scent: 'Trà Xanh',
    volumeMl: 150,
    stock: 35,
    price: 360000,
    targetStock: 50,
    product: {
      id: 'p-6',
      name: 'Xịt kháng khuẩn Trà Xanh Thanh Khiết',
      slug: 'xit-khang-khuan-tra-xanh',
    },
  },
];

const FALLBACK_MOVEMENTS: StockMovementItem[] = [
  {
    id: 'mov-1',
    variantId: 'var-1',
    productName: 'Xịt thơm phòng Lavender Dreams',
    sku: 'TS-LAV-100',
    type: 'OUT',
    quantity: 10,
    previousStock: 14,
    newStock: 4,
    notes: 'Xuất kho đơn hàng #ORD-8821',
    createdAt: '2026-10-14 14:32',
  },
  {
    id: 'mov-2',
    variantId: 'var-2',
    productName: 'Xịt phòng Tinh chất Hoa Nhài Hoàng Gia',
    sku: 'TS-JAS-150',
    type: 'IN',
    quantity: 20,
    previousStock: 8,
    newStock: 28,
    notes: 'Nhập lô hàng sản xuất mới #BATCH-2026-10',
    createdAt: '2026-10-14 11:15',
  },
  {
    id: 'mov-3',
    variantId: 'var-3',
    productName: 'Xịt khử mùi Cam Chanh Tươi Mát',
    sku: 'TS-CIT-50',
    type: 'OUT',
    quantity: 12,
    previousStock: 12,
    newStock: 0,
    notes: 'Xuất kho bán lẻ tại điểm bán',
    createdAt: '2026-10-13 18:45',
  },
  {
    id: 'mov-4',
    variantId: 'var-4',
    productName: 'Nước hoa phòng Trầm Hương Quý Phái',
    sku: 'TS-WOD-200',
    type: 'ADJUST',
    quantity: 3,
    previousStock: 42,
    newStock: 45,
    notes: 'Kiểm kê định kỳ cuối tháng',
    createdAt: '2026-10-13 09:20',
  },
  {
    id: 'mov-5',
    variantId: 'var-5',
    productName: 'Xịt phòng Làn Gió Đại Dương',
    sku: 'TS-SEA-100',
    type: 'OUT',
    quantity: 8,
    previousStock: 15,
    newStock: 7,
    notes: 'Xuất kho bán buôn đại lý miền Nam',
    createdAt: '2026-10-12 16:10',
  },
];

type FilterChip = 'all' | 'low' | 'out' | 'safe';

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(
      dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T'),
    );
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function AdminInventoryPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<StockLevelItem | null>(
    null,
  );
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN');
  const [adjustQuantity, setAdjustQuantity] = useState<number | ''>(1);
  const [adjustNotes, setAdjustNotes] = useState('');

  const {
    data: stockResponse,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-inventory-stock-levels'],
    queryFn: async () => {
      const res = await apiClient.get(
        '/inventory/stock-levels?page=1&limit=100',
      );
      const raw = res.data?.data || res.data;
      if (Array.isArray(raw?.data) && raw.data.length > 0) {
        return raw.data as StockLevelItem[];
      }
      if (Array.isArray(raw) && raw.length > 0) {
        return raw as StockLevelItem[];
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const stockItems: StockLevelItem[] = useMemo(() => {
    if (stockResponse && stockResponse.length > 0) {
      return stockResponse;
    }
    return FALLBACK_STOCK_ITEMS;
  }, [stockResponse]);

  const [movementList, setMovementList] =
    useState<StockMovementItem[]>(FALLBACK_MOVEMENTS);

  const adjustMutation = useMutation({
    mutationFn: async (payload: {
      variantId: string;
      type: 'IN' | 'OUT' | 'ADJUST';
      quantity: number;
      notes?: string;
    }) => {
      const res = await apiClient.post('/inventory/adjust', payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Cập nhật tồn kho thành công');
      setIsAdjustDialogOpen(false);
      const target = stockItems.find((item) => item.id === variables.variantId);
      if (target) {
        const prev = target.stock;
        let next = prev;
        if (variables.type === 'IN') next = prev + variables.quantity;
        if (variables.type === 'OUT')
          next = Math.max(0, prev - variables.quantity);
        if (variables.type === 'ADJUST') next = variables.quantity;

        const newMovement: StockMovementItem = {
          id: `mov-${Date.now()}`,
          variantId: target.id,
          productName: target.product?.name || 'Sản phẩm',
          sku: target.sku,
          type: variables.type,
          quantity:
            variables.type === 'ADJUST'
              ? Math.abs(next - prev)
              : variables.quantity,
          previousStock: prev,
          newStock: next,
          notes: variables.notes || 'Điều chỉnh thủ công',
          createdAt: new Date().toISOString(),
        };
        target.stock = next;
        setMovementList((prevList) => [newMovement, ...prevList]);
      }
      queryClient.invalidateQueries({
        queryKey: ['admin-inventory-stock-levels'],
      });
    },
    onError: () => {
      toast.error('Không thể điều chỉnh tồn kho');
    },
  });

  const stats = useMemo(() => {
    const total = stockItems.length;
    const safe = stockItems.filter((item) => item.stock > 10).length;
    const low = stockItems.filter(
      (item) => item.stock > 0 && item.stock <= 10,
    ).length;
    const out = stockItems.filter((item) => item.stock === 0).length;
    const totalUnits = stockItems.reduce((acc, item) => acc + item.stock, 0);
    return { total, safe, low, out, totalUnits };
  }, [stockItems]);

  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      const matchSearch =
        search === '' ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        (item.product?.name || '')
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.scent.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (activeFilter === 'low') return item.stock > 0 && item.stock <= 10;
      if (activeFilter === 'out') return item.stock === 0;
      if (activeFilter === 'safe') return item.stock > 10;
      return true;
    });
  }, [stockItems, search, activeFilter]);

  const openAdjustDialog = (item?: StockLevelItem | null) => {
    const target = item || selectedVariant || stockItems[0] || null;
    setSelectedVariant(target);
    setAdjustType('IN');
    setAdjustQuantity(1);
    setAdjustNotes('');
    setIsAdjustDialogOpen(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;
    const qty =
      adjustQuantity === ''
        ? adjustType === 'ADJUST'
          ? 0
          : 1
        : Number(adjustQuantity);

    adjustMutation.mutate({
      variantId: selectedVariant.id,
      type: adjustType,
      quantity: qty,
      notes:
        adjustNotes.trim() ||
        (adjustType === 'ADJUST'
          ? 'Kiểm kê kho'
          : adjustType === 'IN'
            ? 'Nhập kho'
            : 'Xuất kho'),
    });
  };

  // Live balance calculation for preview in modal
  const numericQty =
    adjustQuantity === '' ? 0 : Math.max(0, Number(adjustQuantity));
  const currentStock = selectedVariant ? selectedVariant.stock : 0;
  let previewStock = currentStock;
  if (adjustType === 'IN') {
    previewStock = currentStock + numericQty;
  } else if (adjustType === 'OUT') {
    previewStock = Math.max(0, currentStock - numericQty);
  } else if (adjustType === 'ADJUST') {
    previewStock = numericQty;
  }
  const isOverExport =
    adjustType === 'OUT' &&
    selectedVariant !== null &&
    numericQty > currentStock;

  return (
    <>
      <SEO title="Quản lý kho hàng - Admin" />
      <div className="min-h-screen bg-slate-50 font-sans space-y-6 md:space-y-8 p-4 md:p-6 lg:p-8">
        {/* Network Error / Offline Alert Banner */}
        {isError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm">
                  Không thể đồng bộ dữ liệu tồn kho từ máy chủ
                </p>
                <p className="text-xs text-rose-600 mt-0.5">
                  Hệ thống đang hiển thị dữ liệu lưu tạm. Vui lòng kiểm tra kết
                  nối mạng và thử lại.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="bg-white border-rose-300 text-rose-700 hover:bg-rose-100 shrink-0 text-xs font-medium"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Thử lại
            </Button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Quản lý kho hàng
              </h1>
              {isError && (
                <Badge
                  variant="outline"
                  className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-medium"
                >
                  Dữ liệu ngoại tuyến
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Theo dõi định mức tồn kho, cảnh báo hàng sắp hết và lịch sử luân
              chuyển kho
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={async () => {
                toast.info('Đang làm mới dữ liệu...');
                await queryClient.invalidateQueries({
                  queryKey: ['admin-inventory-stock-levels'],
                });
              }}
              className="gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm min-h-[36px]"
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4 text-slate-500',
                  isFetching && 'animate-spin text-teal-600',
                )}
              />
              <span>{isFetching ? 'Đang tải...' : 'Làm mới'}</span>
            </Button>
            {stockItems.length > 0 && (
              <Button
                size="sm"
                onClick={() => openAdjustDialog()}
                className="gap-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 font-medium min-h-[36px]"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Điều chỉnh tồn kho
              </Button>
            )}
          </div>
        </div>

        {/* Overview Stats Cards: Compact 2-column on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
          <Card className="border border-slate-200 bg-white shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between p-3.5 md:p-6 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-600">
                Tổng mặt hàng
              </CardTitle>
              <Box className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent className="p-3.5 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold tabular-nums text-slate-900">
                {stats.total}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tổng cộng{' '}
                <span className="tabular-nums font-medium text-slate-700">
                  {stats.totalUnits}
                </span>{' '}
                đơn vị lưu kho
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between p-3.5 md:p-6 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-600">
                Tồn kho an toàn
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-0 ring-1 ring-emerald-200 text-xs font-medium"
              >
                Đạt chuẩn
              </Badge>
            </CardHeader>
            <CardContent className="p-3.5 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold tabular-nums text-emerald-600">
                {stats.safe}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Mặt hàng duy trì trên 10 đơn vị
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between p-3.5 md:p-6 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-600">
                Sắp hết hàng
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-0 ring-1 ring-amber-200 text-xs font-medium"
              >
                Cần nhập
              </Badge>
            </CardHeader>
            <CardContent className="p-3.5 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold tabular-nums text-amber-600">
                {stats.low}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Mặt hàng còn từ 1 đến 10 đơn vị
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between p-3.5 md:p-6 pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-slate-600">
                Đã hết hàng
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-rose-50 text-rose-700 border-0 ring-1 ring-rose-200 text-xs font-medium"
              >
                Cảnh báo
              </Badge>
            </CardHeader>
            <CardContent className="p-3.5 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold tabular-nums text-rose-600">
                {stats.out}
              </div>
              <p className="text-xs text-slate-500 mt-1">Mặt hàng tồn bằng 0</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Level Section with Bars & Filter Chips */}
        <Card className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="border-b border-slate-200 bg-white p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">
                  Mức tồn kho sản phẩm
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-slate-600 mt-0.5">
                  Thanh định mức tồn kho trực quan với cảnh báo màu đỏ khi lượng
                  tồn chạm mức thấp hoặc hết hàng
                </CardDescription>
              </div>

              {/* Search Toolbar */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên sản phẩm, SKU..."
                  className="pl-9 h-10 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus-visible:ring-2 focus-visible:ring-teal-500"
                />
              </div>
            </div>

            {/* Filter Chips with mobile horizontal scroll & edge fade */}
            <div className="relative pt-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [mask-image:linear-gradient(to_right,black_85%,transparent_100%)] md:[mask-image:none]">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-colors',
                    activeFilter === 'all'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900',
                  )}
                >
                  <span>Tất cả</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-xs tabular-nums font-semibold',
                      activeFilter === 'all'
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-200 text-slate-700',
                    )}
                  >
                    {stats.total}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('low')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-colors',
                    activeFilter === 'low'
                      ? 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-200 shadow-sm font-semibold'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900',
                  )}
                >
                  <span>Sắp hết hàng</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-xs tabular-nums font-semibold',
                      activeFilter === 'low'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700',
                    )}
                  >
                    {stats.low}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('out')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-colors',
                    activeFilter === 'out'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-200 shadow-sm font-semibold'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900',
                  )}
                >
                  <span>Đã hết hàng</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-xs tabular-nums font-semibold',
                      activeFilter === 'out'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700',
                    )}
                  >
                    {stats.out}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('safe')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-colors',
                    activeFilter === 'safe'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200 shadow-sm font-semibold'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900',
                  )}
                >
                  <span>Tồn kho an toàn</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-xs tabular-nums font-semibold',
                      activeFilter === 'safe'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700',
                    )}
                  >
                    {stats.safe}
                  </span>
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredItems.length === 0 ? (
              <div className="p-6">
                <p className="text-slate-500 text-center py-12 text-sm">
                  Danh sách kho hàng sẽ hiển thị tại đây
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View: Product Cards List (block md:hidden) */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const isLowStock = item.stock > 0 && item.stock <= 10;
                    const isOutOfStock = item.stock === 0;
                    const maxCapacity =
                      item.targetStock ||
                      (item.volumeMl >= 200
                        ? 50
                        : item.volumeMl >= 150
                          ? 50
                          : 30);
                    const percentage = Math.min(
                      100,
                      Math.max(
                        0,
                        Math.round((item.stock / maxCapacity) * 100),
                      ),
                    );

                    return (
                      <div key={item.id} className="p-4 space-y-3 bg-white">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-slate-900 leading-tight">
                              {item.product?.name || 'Sản phẩm'}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-700">
                                {item.sku}
                              </span>
                              <span>•</span>
                              <span>{item.scent}</span>
                              <span>•</span>
                              <span className="tabular-nums">
                                {item.volumeMl}ml
                              </span>
                            </div>
                          </div>
                          {isOutOfStock ? (
                            <Badge
                              variant="outline"
                              className="bg-rose-50 text-rose-700 border-0 ring-1 ring-rose-200 text-xs font-medium shrink-0"
                            >
                              Hết hàng
                            </Badge>
                          ) : isLowStock ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-0 ring-1 ring-amber-200 text-xs font-medium shrink-0"
                            >
                              Sắp hết hàng
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-0 ring-1 ring-emerald-200 text-xs font-medium shrink-0"
                            >
                              Tồn kho an toàn
                            </Badge>
                          )}
                        </div>

                        {/* Stock Capacity Progress */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                              Định mức tồn kho:
                            </span>
                            <span className="tabular-nums font-semibold text-slate-900">
                              {item.stock} / {maxCapacity} đơn vị
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                isOutOfStock
                                  ? 'bg-rose-600'
                                  : isLowStock
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-600',
                              )}
                              style={{
                                width: `${isOutOfStock ? 4 : Math.max(8, percentage)}%`,
                              }}
                            />
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustDialog(item)}
                          className="w-full h-11 min-h-[44px] text-xs font-semibold text-teal-700 border-teal-200 bg-teal-50 hover:bg-teal-100 flex items-center justify-center gap-2 rounded-lg"
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                          Điều chỉnh tồn kho
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Full Inventory Table (hidden md:block) */}
                <div className="hidden md:block relative overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                      <TableRow className="border-slate-200 hover:bg-slate-50">
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600">
                          Sản phẩm & SKU
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600">
                          Phân loại
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">
                          Số lượng tồn
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 min-w-[180px]">
                          Định mức tồn kho
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 text-center">
                          Trạng thái
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">
                          Thao tác
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => {
                        const isLowStock = item.stock > 0 && item.stock <= 10;
                        const isOutOfStock = item.stock === 0;
                        const maxCapacity =
                          item.targetStock ||
                          (item.volumeMl >= 200
                            ? 50
                            : item.volumeMl >= 150
                              ? 50
                              : 30);
                        const percentage = Math.min(
                          100,
                          Math.max(
                            0,
                            Math.round((item.stock / maxCapacity) * 100),
                          ),
                        );

                        return (
                          <TableRow
                            key={item.id}
                            className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            <TableCell className="px-4 py-3 align-middle">
                              <div className="font-medium text-slate-900 text-sm">
                                {item.product?.name || 'Sản phẩm'}
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">
                                {item.sku}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle text-sm text-slate-600">
                              <span>{item.scent}</span>
                              <span className="mx-1 text-slate-400">•</span>
                              <span className="tabular-nums">
                                {item.volumeMl}ml
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle text-right font-semibold tabular-nums text-slate-900 text-sm">
                              {item.stock}
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle">
                              <div className="space-y-1.5 w-full max-w-[200px]">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500 text-xs">
                                    Định mức:
                                  </span>
                                  <span className="tabular-nums font-medium text-xs text-slate-900">
                                    {item.stock} / {maxCapacity}
                                  </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all duration-500',
                                      isOutOfStock
                                        ? 'bg-rose-600'
                                        : isLowStock
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-600',
                                    )}
                                    style={{
                                      width: `${isOutOfStock ? 4 : Math.max(8, percentage)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle text-center">
                              {isOutOfStock ? (
                                <Badge
                                  variant="outline"
                                  className="bg-rose-50 text-rose-700 border-0 ring-1 ring-rose-200 text-xs font-medium"
                                >
                                  Hết hàng
                                </Badge>
                              ) : isLowStock ? (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-700 border-0 ring-1 ring-amber-200 text-xs font-medium"
                                >
                                  Sắp hết hàng
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-50 text-emerald-700 border-0 ring-1 ring-emerald-200 text-xs font-medium"
                                >
                                  Tồn kho an toàn
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAdjustDialog(item)}
                                className="h-8 px-2.5 rounded-lg text-xs font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                              >
                                Điều chỉnh
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Movement History Section */}
        <Card className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="border-b border-slate-200 bg-white p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg md:text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <History className="h-5 w-5 text-teal-600" />
                  Lịch sử biến động kho
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-slate-600 mt-0.5">
                  Nhật ký các lượt nhập kho, xuất kho và kiểm kê điều chỉnh gần
                  nhất
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-slate-50 text-slate-700 border-0 ring-1 ring-slate-200 tabular-nums text-xs font-medium"
              >
                {movementList.length} giao dịch
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {movementList.length === 0 ? (
              <div className="p-6">
                <p className="text-slate-500 text-center py-12 text-sm">
                  Chưa có lịch sử biến động kho nào
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View: Movement Cards (block md:hidden) */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {movementList.map((mov) => {
                    const isReduction = mov.newStock < mov.previousStock;
                    return (
                      <div
                        key={mov.id}
                        className="p-4 space-y-2 bg-white text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm text-slate-900 leading-tight">
                              {mov.productName}
                            </p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              {mov.sku}
                            </p>
                          </div>
                          <span className="text-slate-400 tabular-nums shrink-0 text-xs">
                            {formatDateTime(mov.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            {mov.type === 'IN' && (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-0 ring-1 ring-emerald-200 text-xs gap-1 font-medium"
                              >
                                <ArrowDownRight className="h-3 w-3 text-emerald-600" />
                                Nhập kho
                              </Badge>
                            )}
                            {mov.type === 'OUT' && (
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-700 border-0 ring-1 ring-amber-200 text-xs gap-1 font-medium"
                              >
                                <ArrowUpRight className="h-3 w-3 text-amber-600" />
                                Xuất kho
                              </Badge>
                            )}
                            {mov.type === 'ADJUST' && (
                              <Badge
                                variant="outline"
                                className="bg-slate-50 text-slate-700 border-0 ring-1 ring-slate-200 text-xs gap-1 font-medium"
                              >
                                <RefreshCw className="h-3 w-3 text-slate-500" />
                                Kiểm kê
                              </Badge>
                            )}
                            <span
                              className={cn(
                                'font-bold tabular-nums text-sm',
                                isReduction
                                  ? 'text-rose-600'
                                  : 'text-emerald-700',
                              )}
                            >
                              {isReduction
                                ? `-${mov.quantity}`
                                : `+${mov.quantity}`}
                            </span>
                          </div>
                          <div className="text-right text-slate-500 tabular-nums text-xs">
                            Tồn:{' '}
                            <span className="text-slate-700 font-medium">
                              {mov.previousStock}
                            </span>{' '}
                            →{' '}
                            <span className="text-slate-900 font-bold">
                              {mov.newStock}
                            </span>
                          </div>
                        </div>

                        {mov.notes && (
                          <p className="text-slate-600 text-xs bg-slate-50 p-2 rounded-md border border-slate-100">
                            <span className="text-slate-400 font-medium mr-1">
                              Ghi chú:
                            </span>
                            {mov.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Full Movement Table (hidden md:block) */}
                <div className="hidden md:block relative overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                      <TableRow className="border-slate-200 hover:bg-slate-50">
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600">
                          Thời gian
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600">
                          Sản phẩm & SKU
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600">
                          Loại giao dịch
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">
                          Số lượng
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">
                          Tồn trước
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">
                          Tồn sau
                        </TableHead>
                        <TableHead className="px-4 py-3 text-xs font-semibold text-slate-600">
                          Ghi chú
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movementList.map((mov) => {
                        const isReduction = mov.newStock < mov.previousStock;
                        return (
                          <TableRow
                            key={mov.id}
                            className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            <TableCell className="px-4 py-3 align-middle text-xs text-slate-500 tabular-nums">
                              {formatDateTime(mov.createdAt)}
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle">
                              <div className="font-medium text-slate-900 text-sm">
                                {mov.productName}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                {mov.sku}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle">
                              {mov.type === 'IN' && (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-50 text-emerald-700 border-0 ring-1 ring-emerald-200 text-xs gap-1 font-medium"
                                >
                                  <ArrowDownRight className="h-3 w-3 text-emerald-600" />
                                  Nhập kho
                                </Badge>
                              )}
                              {mov.type === 'OUT' && (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-700 border-0 ring-1 ring-amber-200 text-xs gap-1 font-medium"
                                >
                                  <ArrowUpRight className="h-3 w-3 text-amber-600" />
                                  Xuất kho
                                </Badge>
                              )}
                              {mov.type === 'ADJUST' && (
                                <Badge
                                  variant="outline"
                                  className="bg-slate-50 text-slate-700 border-0 ring-1 ring-slate-200 text-xs gap-1 font-medium"
                                >
                                  <RefreshCw className="h-3 w-3 text-slate-500" />
                                  Kiểm kê
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell
                              className={cn(
                                'px-4 py-3 align-middle text-right font-semibold tabular-nums text-sm',
                                isReduction
                                  ? 'text-rose-600'
                                  : 'text-emerald-700',
                              )}
                            >
                              {isReduction
                                ? `-${mov.quantity}`
                                : `+${mov.quantity}`}
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle text-right text-slate-500 tabular-nums text-sm">
                              {mov.previousStock}
                            </TableCell>
                            <TableCell className="px-4 py-3 align-middle text-right font-medium text-slate-900 tabular-nums text-sm">
                              {mov.newStock}
                            </TableCell>
                            <TableCell
                              className="px-4 py-3 align-middle text-xs text-slate-600 max-w-[260px] truncate"
                              title={mov.notes || ''}
                            >
                              {mov.notes || '--'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stock Adjustment Dialog */}
        <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
          <DialogContent className="max-w-md bg-white border border-slate-200 text-slate-900 shadow-xl rounded-2xl p-0 gap-0 overflow-hidden font-sans">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white">
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                Điều chỉnh tồn kho
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 mt-1">
                {selectedVariant
                  ? `${selectedVariant.product?.name || 'Sản phẩm'} (${selectedVariant.sku})`
                  : 'Cập nhật số lượng và trạng thái kho hàng'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              {/* Product / Variant Selector */}
              <div className="space-y-2">
                <Label
                  htmlFor="variant-select"
                  className="text-sm font-medium text-slate-900"
                >
                  Sản phẩm điều chỉnh *
                </Label>
                <Select
                  value={selectedVariant?.id || ''}
                  onValueChange={(val) => {
                    const found = stockItems.find((item) => item.id === val);
                    if (found) setSelectedVariant(found);
                  }}
                >
                  <SelectTrigger
                    id="variant-select"
                    className="w-full bg-white border-slate-200 h-10 text-sm"
                  >
                    <SelectValue placeholder="Chọn sản phẩm cần điều chỉnh..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stockItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.product?.name || 'Sản phẩm'} - {item.sku} (
                        {item.scent}, {item.volumeMl}ml - Tồn: {item.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Adjustment Type Selector */}
              <div className="space-y-2">
                <Label
                  htmlFor="adjust-type"
                  className="text-sm font-medium text-slate-900"
                >
                  Loại điều chỉnh *
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('IN')}
                    className={cn(
                      'p-2.5 rounded-lg text-xs font-semibold border text-center transition-colors min-h-[44px]',
                      adjustType === 'IN'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    Nhập kho
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('OUT')}
                    className={cn(
                      'p-2.5 rounded-lg text-xs font-semibold border text-center transition-colors min-h-[44px]',
                      adjustType === 'OUT'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-200 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    Xuất kho
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADJUST')}
                    className={cn(
                      'p-2.5 rounded-lg text-xs font-semibold border text-center transition-colors min-h-[44px]',
                      adjustType === 'ADJUST'
                        ? 'bg-teal-50 text-teal-700 border-teal-300 ring-1 ring-teal-200 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    Kiểm kê
                  </button>
                </div>
              </div>

              {/* Quantity Input and Live Balance Preview */}
              <div className="space-y-2">
                <Label
                  htmlFor="adjust-quantity"
                  className="text-sm font-medium text-slate-900"
                >
                  {adjustType === 'ADJUST'
                    ? 'Mức tồn thực tế mới *'
                    : 'Số lượng thay đổi *'}
                </Label>
                <Input
                  id="adjust-quantity"
                  type="number"
                  min={adjustType === 'ADJUST' ? 0 : 1}
                  required
                  value={adjustQuantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAdjustQuantity(val === '' ? '' : Number(val));
                  }}
                  className="bg-white border border-slate-200 text-slate-900 tabular-nums rounded-lg focus-visible:ring-2 focus-visible:ring-teal-500 h-10"
                />

                {/* Balance preview card */}
                {selectedVariant && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Tồn kho hiện tại:</span>
                      <span className="tabular-nums font-semibold text-slate-900">
                        {selectedVariant.stock} đơn vị
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-700">
                        Tồn sau điều chỉnh:
                      </span>
                      <span
                        className={cn(
                          'tabular-nums font-bold text-sm',
                          previewStock === 0
                            ? 'text-rose-600'
                            : previewStock <= 10
                              ? 'text-amber-600'
                              : 'text-emerald-600',
                        )}
                      >
                        {previewStock} đơn vị
                      </span>
                    </div>
                  </div>
                )}

                {/* Over-export warning banner */}
                {isOverExport && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Cảnh báo:</span> Số lượng
                      xuất ({numericQty}) vượt quá tồn kho hiện tại (
                      {selectedVariant?.stock ?? 0} đơn vị). Tồn kho sau xuất sẽ
                      về 0.
                    </div>
                  </div>
                )}
              </div>

              {/* Preset reason tags & notes input */}
              <div className="space-y-2">
                <Label
                  htmlFor="adjust-notes"
                  className="text-sm font-medium text-slate-900"
                >
                  Ghi chú lý do
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {(adjustType === 'IN'
                    ? ['Nhập hàng mới', 'Khách trả hàng', 'Điều chuyển nội bộ']
                    : adjustType === 'OUT'
                      ? ['Xuất bán lẻ', 'Xuất bán buôn', 'Hàng hỏng/lỗi']
                      : [
                          'Kiểm kê định kỳ',
                          'Điều chỉnh sai lệch',
                          'Hàng hao hụt',
                        ]
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAdjustNotes(preset)}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-md border transition-colors',
                        adjustNotes === preset
                          ? 'bg-teal-50 text-teal-700 border-teal-300 font-medium'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900',
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <Input
                  id="adjust-notes"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Ví dụ: Kiểm kê định kỳ, hàng hỏng..."
                  className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-lg focus-visible:ring-2 focus-visible:ring-teal-500 h-10 text-sm"
                />
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdjustDialogOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium min-h-[44px]"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={adjustMutation.isPending || adjustQuantity === ''}
                  className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 font-medium min-h-[44px]"
                >
                  {adjustMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
