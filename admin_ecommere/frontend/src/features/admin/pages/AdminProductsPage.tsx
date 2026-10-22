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
  Loader2,
  Star,
} from 'lucide-react';
import { useInfiniteAdminProducts } from '@/features/catalog/hooks/useProducts';
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

import { useDeleteProduct } from '../hooks/useAdminProducts';
import { useToast } from '@/hooks/useToast';

const STORE_URL = (
  import.meta.env.VITE_STORE_URL || 'http://localhost:5173'
).replace(/\/$/, '');

export function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const observerTarget = useRef<HTMLDivElement>(null);

  /* State for category filter */
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<any[]>([]); // Flattened for lookup
  const [categoryTree, setCategoryTree] = useState<any[]>([]); // Tree for dropdown

  /* Fetch categories */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const tree = await import('../api/categories.api').then((m) =>
          m.categoriesApi.getTree(),
        );
        setCategoryTree(tree);

        // Flatten for name lookup
        const allCategories: any[] = [];
        const traverse = (nodes: any[], prefix = '') => {
          nodes.forEach((node) => {
            const currentName = prefix + node.name;
            const isLeaf = !node.children || node.children.length === 0;
            allCategories.push({
              ...node,
              displayName: currentName,
              isLeaf,
            });

            if (node.children?.length > 0) {
              traverse(node.children, currentName + ' > ');
            }
          });
        };
        traverse(tree);
        setCategories(allCategories);
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };
    loadCategories();
  }, []);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteAdminProducts({
    limit: 20,
    search: debouncedSearch,
    sortBy: 'newest',
    categoryId, // Pass categoryId to hook
  });

  const deleteProduct = useDeleteProduct();
  const toast = useToast();
  const deletingIdRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const target = observerTarget.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasNextPage, fetchNextPage]);

  const handleDelete = async (id: string, name: string) => {
    if (
      deletingIdRef.current === id ||
      (deleteProduct.isPending && deleteProduct.variables === id)
    ) {
      return;
    }
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa sản phẩm "${name}"? Hành động này không thể hoàn tác.`,
      )
    ) {
      deletingIdRef.current = id;
      deleteProduct.mutate(id, {
        onSuccess: () => {
          toast.success('Xóa sản phẩm thành công');
        },
        onError: () => {
          toast.error('Xóa sản phẩm thất bại. Vui lòng thử lại.');
        },
        onSettled: () => {
          deletingIdRef.current = null;
        },
      });
    }
  };

  const calculateTotalStock = (product: any) => {
    return (
      product.variants?.reduce(
        (acc: number, v: any) => acc + (v.stock || 0),
        0,
      ) || 0
    );
  };

  const products = data?.pages.flatMap((page) => page.products) || [];
  const totalProducts = data?.pages[0]?.total || 0;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-rose-600" />
        <h2 className="text-lg font-semibold text-slate-900">
          Không thể tải danh sách sản phẩm
        </h2>
        <Button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  /* Helper to get selected category name */
  const selectedCategoryName = categories.find(
    (c) => c.id === categoryId,
  )?.displayName;

  /* Recursive render function for category menu */
  const renderCategoryMenu = (nodes: any[]) => {
    return nodes.map((node) => {
      const isLeaf = !node.children || node.children.length === 0;

      if (isLeaf) {
        return (
          <DropdownMenuItem
            key={node.id}
            onClick={() => setCategoryId(node.id)}
            className="cursor-pointer text-slate-700 hover:bg-slate-50 focus:bg-teal-50 focus:text-teal-700"
          >
            <span
              className={
                categoryId === node.id ? 'font-bold text-teal-600' : ''
              }
            >
              {node.name}
            </span>
          </DropdownMenuItem>
        );
      }

      return (
        <DropdownMenuSub key={node.id}>
          <DropdownMenuSubTrigger className="cursor-pointer text-slate-700 hover:bg-slate-50 focus:bg-teal-50 focus:text-teal-700">
            <span
              className={
                categoryId === node.id ? 'font-bold text-teal-600' : ''
              }
            >
              {node.name}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto bg-white border-slate-200 shadow-md">
            <DropdownMenuItem
              onClick={() => setCategoryId(node.id)}
              className="cursor-pointer font-medium border-b border-slate-100 mb-1 text-slate-700 hover:bg-slate-50 focus:bg-teal-50 focus:text-teal-700"
            >
              Xem tất cả {node.name}
            </DropdownMenuItem>
            {renderCategoryMenu(node.children)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    });
  };

  return (
    <>
      <SEO title="Quản lý sản phẩm - Admin" />
      <div className="space-y-6">
        {/* Dominant Heading */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Quản lý sản phẩm
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi danh mục, trạng thái tồn kho và thông tin giá bán sản phẩm
          </p>
        </div>

        {/* Header & Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Tổng sản phẩm
              </CardTitle>
              <Package className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-slate-900">
                {totalProducts}
              </div>
              <p className="text-xs text-slate-400 mt-1">Sản phẩm có sẵn</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Danh mục
              </CardTitle>
              <Tags className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-slate-900">
                --
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Danh mục đang hoạt động
              </p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Tồn kho
              </CardTitle>
              <Box className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-slate-900">
                --
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tổng số lượng tồn kho
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-9 h-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-teal-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`gap-2 h-10 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 ${
                    categoryId
                      ? 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
                      : ''
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {categoryId ? 'Đã lọc' : 'Lọc'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[300px] max-h-[300px] overflow-y-auto bg-white border-slate-200 shadow-md"
              >
                <DropdownMenuLabel className="text-slate-900">
                  Lọc theo danh mục
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200" />
                <DropdownMenuItem
                  onClick={() => setCategoryId(undefined)}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50 focus:bg-teal-50 focus:text-teal-700"
                >
                  <span
                    className={!categoryId ? 'font-bold text-teal-600' : ''}
                  >
                    Tất cả danh mục
                  </span>
                </DropdownMenuItem>
                {renderCategoryMenu(categoryTree)}
              </DropdownMenuContent>
            </DropdownMenu>

            {categoryId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCategoryId(undefined)}
                className="h-10 px-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs"
                title="Xóa bộ lọc"
              >
                Xóa: {selectedCategoryName?.split(' > ').pop()} ✕
              </Button>
            )}
          </div>
          <Button
            asChild
            className="gap-2 shrink-0 h-10 rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <Link to="/admin/products/new">
              <Plus className="h-4 w-4" />
              <span className="inline">Thêm mới</span>
            </Link>
          </Button>
        </div>

        {/* Products Table */}
        <div className="border border-slate-200 bg-white shadow-sm overflow-hidden rounded-xl">
          <div className="relative overflow-x-auto">
            {isLoading ? (
              <div className="py-20">
                <LoadingSpinner />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Package className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">
                  Chưa có sản phẩm nào
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
                  Create your first product to get started managing your
                  catalog.
                </p>
                <Button
                  asChild
                  className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <Link to="/admin/products/new">Tạo sản phẩm</Link>
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent border-b border-slate-200">
                      <TableHead className="w-[80px] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Hình ảnh
                      </TableHead>
                      <TableHead className="min-w-[200px] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Tên sản phẩm
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Danh mục
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Giá bán
                      </TableHead>
                      <TableHead className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Tồn kho
                      </TableHead>
                      <TableHead className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Đánh giá
                      </TableHead>
                      <TableHead className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const totalStock = calculateTotalStock(product);
                      const isDeleting =
                        (deleteProduct.isPending &&
                          deleteProduct.variables === product.id) ||
                        deletingIdRef.current === product.id;
                      return (
                        <TableRow
                          key={product.id}
                          className="group hover:bg-slate-50 transition-colors border-b border-slate-100"
                        >
                          <TableCell className="px-4 py-3">
                            <div className="relative h-12 w-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shadow-sm shrink-0">
                              <img
                                src={
                                  product.images[0] ||
                                  'https://placehold.co/100x100?text=No+Image'
                                }
                                alt={product.name}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex flex-col min-w-[180px]">
                              <Link
                                to={`/admin/products/${product.id}/edit`}
                                className="font-medium text-slate-900 group-hover:text-teal-600 transition-colors cursor-pointer line-clamp-1 hover:underline"
                                title={product.name}
                              >
                                {product.name}
                              </Link>
                              <span className="text-xs text-slate-400 mt-0.5 font-mono">
                                SKU: {product.variants?.[0]?.sku || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {product.category ? (
                              <Badge
                                variant="outline"
                                className="font-normal text-xs bg-slate-50 text-slate-700 border-slate-200"
                              >
                                {product.category.name}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="font-semibold tabular-nums text-slate-900">
                              {formatCurrency(product.basePrice)}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <div
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums ${
                                totalStock > 0
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                  : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                              }`}
                            >
                              {totalStock} sp
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {product.variants?.length || 0} biến thể
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-semibold text-sm text-slate-900 tabular-nums">
                                {product.rating?.toFixed(1) || '0.0'}
                              </span>
                              <span className="text-xs text-slate-400">
                                ({product.reviewCount || 0})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-white border-slate-200 shadow-md"
                              >
                                <DropdownMenuLabel className="text-slate-900">
                                  Thao tác
                                </DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <a
                                    href={`${STORE_URL}/p/${product.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="cursor-pointer text-slate-700 hover:bg-slate-50 focus:bg-teal-50 focus:text-teal-700"
                                  >
                                    <Eye className="mr-2 h-4 w-4" /> Xem chi
                                    tiết
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link
                                    to={`/admin/products/${product.id}/edit`}
                                    className="cursor-pointer text-slate-700 hover:bg-slate-50 focus:bg-teal-50 focus:text-teal-700"
                                  >
                                    <Pencil className="mr-2 h-4 w-4" /> Chỉnh
                                    sửa
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-200" />
                                <DropdownMenuItem
                                  disabled={isDeleting}
                                  className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer"
                                  onClick={() =>
                                    handleDelete(product.id, product.name)
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Xóa sản
                                  phẩm
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
                <div
                  ref={observerTarget}
                  className="h-12 flex items-center justify-center p-4"
                >
                  {isFetchingNextPage && (
                    <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                  )}
                  {!hasNextPage && products.length > 0 && (
                    <span className="text-xs text-slate-400">
                      Đã hiển thị hết sản phẩm
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
