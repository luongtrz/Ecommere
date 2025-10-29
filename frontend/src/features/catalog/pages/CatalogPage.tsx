import { useSearchParams } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { useCart } from '@/features/cart/hooks/useCart';
import { PAGINATION, PRODUCT_SORT_OPTIONS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sort') || 'newest';

  const { data, isLoading } = useProducts({
    page,
    limit: PAGINATION.DEFAULT_LIMIT,
    sortBy: sortBy as any,
  });

  const { addItem } = useCart();

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString(), sort: sortBy });
  };

  const handleSortChange = (value: string) => {
    setSearchParams({ page: '1', sort: value });
  };

  const handleAddToCart = (product: any, variant: any) => {
    addItem({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      image: product.images[0],
      price: variant.salePrice || variant.price,
      scent: variant.scent,
      volumeMl: variant.volumeMl,
    });
  };

  return (
    <>
      <SEO title="Sản phẩm" />
      
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Tất cả sản phẩm</h1>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Sắp xếp:</span>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : data?.products.length === 0 ? (
          <EmptyState
            title="Không tìm thấy sản phẩm"
            description="Chưa có sản phẩm nào trong danh mục này"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {data?.products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  images={product.images}
                  price={product.basePrice}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  onAddToCart={() => product.variants[0] && handleAddToCart(product, product.variants[0])}
                />
              ))}
            </div>

            {data && data.totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={data.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
