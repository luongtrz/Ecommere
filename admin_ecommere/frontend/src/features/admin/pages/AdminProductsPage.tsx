import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  Package,
  AlertCircle,
  Box,
  Tags,
  Loader2
} from 'lucide-react';
import { useInfiniteProducts } from '@/features/catalog/hooks/useProducts';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency } from '@/lib/formatters';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useDeleteProduct } from '../hooks/useAdminProducts';
import { useToast } from '@/hooks/useToast';

export function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteProducts({
    limit: 20,
    search: debouncedSearch,
    sortBy: 'newest',
  });

  const deleteProduct = useDeleteProduct();
  const toast = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextPage, fetchNextPage]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"? Hành động này không thể hoàn tác.`)) {
      deleteProduct.mutate(id, {
        onSuccess: () => {
          toast.success('Xóa sản phẩm thành công');
        },
        onError: () => {
          toast.error('Xóa sản phẩm thất bại. Vui lòng thử lại.');
        },
      });
    }
  };

  const calculateTotalStock = (product: any) => {
    return product.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0;
  };

  const products = data?.pages.flatMap((page) => page.products) || [];
  const totalProducts = data?.pages[0]?.total || 0;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-lg font-semibold text-gray-900">Không thể tải danh sách sản phẩm</h2>
        <Button onClick={() => window.location.reload()}>Thử lại</Button>
      </div>
    );
  }

  return (
    <>
      <SEO title="Quản lý sản phẩm - Admin" />
      <div className="space-y-6">

        {/* Header & Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng sản phẩm</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">Sản phẩm có sẵn</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Danh mục</CardTitle>
              <Tags className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Danh mục đang hoạt động</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tồn kho</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Tổng số lượng tồn kho</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Lọc</span>
            </Button>
          </div>
          <Button asChild className="gap-2">
            <Link to="/admin/products/new">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Thêm mới</span>
            </Link>
          </Button>
        </div>

        {/* Products Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="relative overflow-x-auto">
            {isLoading ? (
              <div className="py-20">
                <LoadingSpinner />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Chưa có sản phẩm nào</h3>
                <p className="text-sm text-gray-500 max-w-sm mt-1 mb-6">Create your first product to get started managing your catalog.</p>
                <Button asChild>
                  <Link to="/admin/products/new">
                    Tạo sản phẩm
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Table>
                  <TableHeader className="bg-gray-50/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[80px]">Hình ảnh</TableHead>
                      <TableHead className="min-w-[200px]">Tên sản phẩm</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Giá bán</TableHead>
                      <TableHead className="text-center">Tồn kho</TableHead>
                      <TableHead className="text-center">Đánh giá</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const totalStock = calculateTotalStock(product);
                      return (
                        <TableRow key={product.id} className="group hover:bg-gray-50/50 transition-colors">
                          <TableCell>
                            <div className="relative h-12 w-12 rounded-lg border border-gray-100 overflow-hidden bg-white shadow-sm group-hover:shadow-md transition-shadow">
                              <img
                                src={product.images[0] || 'https://placehold.co/100x100?text=No+Image'}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Link
                                to={`/admin/products/${product.id}/edit`}
                                className="font-semibold text-gray-900 group-hover:text-primary transition-colors cursor-pointer line-clamp-2 hover:underline"
                                title={product.name}
                              >
                                {product.name}
                              </Link>
                              <span className="text-xs text-muted-foreground mt-0.5 font-mono">
                                SKU: {product.variants?.[0]?.sku || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.category ? (
                              <Badge variant="secondary" className="font-normal">
                                {product.category.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(product.basePrice)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${totalStock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                              }`}>
                              {totalStock} sp
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {product.variants?.length || 0} biến thể
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-yellow-400 text-sm">★</span>
                              <span className="font-medium text-sm text-gray-700">{product.rating?.toFixed(1) || '0.0'}</span>
                              <span className="text-xs text-muted-foreground">({product.reviewCount || 0})</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link to={`/p/${product.slug}`} target="_blank" className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/products/${product.id}/edit`} className="cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                                  onClick={() => handleDelete(product.id, product.name)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Xóa sản phẩm
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Sentinel for Infinite Scroll */}
                <div ref={observerTarget} className="h-10 flex items-center justify-center p-4">
                  {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                  {!hasNextPage && products.length > 0 && (
                    <span className="text-xs text-muted-foreground">Đã hiển thị hết sản phẩm</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
