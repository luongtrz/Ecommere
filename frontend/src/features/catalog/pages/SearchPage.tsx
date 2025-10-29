import { useSearchParams } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useProductSearch } from '../hooks/useProducts';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useCart } from '@/features/cart/hooks/useCart';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const { data, isLoading } = useProductSearch(query);
  const { addItem } = useCart();

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
      <SEO title={`Tìm kiếm: ${query}`} />
      
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-2">
          Kết quả tìm kiếm cho "{query}"
        </h1>
        <p className="text-muted-foreground mb-8">
          {data?.total || 0} sản phẩm được tìm thấy
        </p>

        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : data?.products.length === 0 ? (
          <EmptyState
            title="Không tìm thấy sản phẩm"
            description="Thử tìm kiếm với từ khóa khác"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
        )}
      </div>
    </>
  );
}
