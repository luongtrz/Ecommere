import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useProducts } from '@/features/catalog/hooks/useProducts';
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

import { useDeleteProduct } from '../hooks/useAdminProducts';
import { useToast } from '@/hooks/useToast';

export function AdminProductsPage() {
  const { data, isLoading } = useProducts({
    page: 1,
    limit: 100,
    sortBy: 'newest',
  });

  const deleteProduct = useDeleteProduct();
  const toast = useToast();

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

  if (isLoading) {
    return (
      <>
        <SEO title="Quản lý sản phẩm - Admin" />
        <div className="py-12">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Quản lý sản phẩm - Admin" />
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tổng số: {data?.total || 0} sản phẩm
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Thêm sản phẩm
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {!data || data.products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Chưa có sản phẩm nào</p>
                <Button asChild variant="outline">
                  <Link to="/admin/products/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm sản phẩm đầu tiên
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Hình ảnh</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                    <TableHead className="text-center">Biến thể</TableHead>
                    <TableHead className="text-center">Đánh giá</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.slug}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category?.name}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(product.basePrice)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {product.variants?.length || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm">
                            {product.rating?.toFixed(1) || '0.0'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({product.reviewCount || 0})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="Xem chi tiết"
                          >
                            <Link to={`/p/${product.slug}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="Chỉnh sửa"
                          >
                            <Link to={`/admin/products/${product.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Xóa"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(product.id, product.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
