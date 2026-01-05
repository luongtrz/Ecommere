import { SEO } from '@/lib/seo';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, Shield, RefreshCw, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Category } from '../api/categories.api';

interface CategoryProductsSectionProps {
  category: Category;
  onAddToCart: (product: any, variant: any) => void;
  isAlternate?: boolean;
}

function CategoryProductsSection({ category, onAddToCart, isAlternate }: CategoryProductsSectionProps) {
  const { data: productsData, isLoading } = useProducts({
    categorySlug: category.slug,
    limit: 8,
  });

  if (isLoading) {
    return (
      <section className={isAlternate ? 'bg-muted/50 py-12' : 'container py-12'}>
        <div className={isAlternate ? 'container' : ''}>
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (!productsData?.products || productsData.products.length === 0) {
    return null;
  }

  return (
    <section className={isAlternate ? 'bg-muted/50 py-12' : 'container py-12'}>
      <div className={isAlternate ? 'container' : ''}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{category.name}</h2>
          <Button asChild variant="outline">
            <Link to={`/category/${category.slug}`}>Xem tất cả</Link>
          </Button>
        </div>

        {/* Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 md:hidden">
            {productsData.products.map((product) => (
              <div key={product.id} className="flex-none w-64 snap-center">
                <ProductCard
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  images={product.images}
                  price={product.basePrice}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  onAddToCart={() => product.variants[0] && onAddToCart(product, product.variants[0])}
                />
              </div>
            ))}
          </div>

          {/* Desktop Grid - Hidden on mobile */}
          <div className="hidden md:contents">
            {productsData.products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                images={product.images}
                price={product.basePrice}
                rating={product.rating}
                reviewCount={product.reviewCount}
                onAddToCart={() => product.variants[0] && onAddToCart(product, product.variants[0])}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
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
      <SEO />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container py-8 md:py-14">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 mb-4">
              <Sprout className="h-4 w-4" />
              <span className="text-xs font-medium">Thai Spray Shop</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Nước Hoa Xịt
              <span className="block text-yellow-300">Thái Lan Chính Hãng</span>
            </h1>
            <p className="text-base md:text-lg text-blue-100 mb-6 max-w-3xl mx-auto leading-relaxed">
              Khám phá bộ sưu tập nước hoa xịt thơm đa dạng mùi hương,
              chất lượng cao cấp với giá tốt nhất thị trường
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="default" className="bg-white text-blue-600 hover:bg-blue-50 text-base px-6">
                <Link to="/catalog">
                  Khám phá ngay <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="default" className="bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-blue-600 text-base px-6 font-medium">
                <Link to="/search">
                  Tìm kiếm sản phẩm
                </Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-xl"></div>
      </section>

      {/* Category-based Product Sections */}
      {isLoadingCategories ? (
        <div className="container py-12">
          <LoadingSpinner />
        </div>
      ) : (
        categories?.map((category, index) => (
          <CategoryProductsSection
            key={category.id}
            category={category}
            onAddToCart={handleAddToCart}
            isAlternate={index % 2 === 1}
          />
        ))
      )}

      {/* Features */}
      <section className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Truck className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Giao hàng nhanh</h3>
            <p className="text-sm text-muted-foreground">Giao hàng toàn quốc trong 1-3 ngày</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Chính hãng 100%</h3>
            <p className="text-sm text-muted-foreground">Cam kết sản phẩm chính hãng</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <RefreshCw className="h-7 w-7 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Đổi trả dễ dàng</h3>
            <p className="text-sm text-muted-foreground">Đổi trả trong 7 ngày nếu có lỗi</p>
          </div>
        </div>
      </section>
    </>
  );
}
