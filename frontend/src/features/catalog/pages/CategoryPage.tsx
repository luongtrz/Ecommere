import { useParams } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCategoryBySlug } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useCart } from '@/features/cart/hooks/useCart';

export function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { data: category, isLoading: isCategoryLoading } = useCategoryBySlug(categorySlug!);
  const { data: products, isLoading: isProductsLoading } = useProducts({
    categorySlug,
  });
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

  if (isCategoryLoading || isProductsLoading) {
    return (
      <div className="container py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container py-12">
        <EmptyState title="Không tìm thấy danh mục" />
      </div>
    );
  }

  return (
    <>
      <SEO title={category.name} description={category.description} />
      
      <div className="container py-8">
        <Breadcrumb
          items={[
            { label: 'Sản phẩm', href: '/catalog' },
            { label: category.name },
          ]}
          className="mb-6"
        />

        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mb-8">{category.description}</p>
        )}

        {products?.products.length === 0 ? (
          <EmptyState
            title="Chưa có sản phẩm"
            description="Danh mục này chưa có sản phẩm nào"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products?.products.map((product) => (
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
