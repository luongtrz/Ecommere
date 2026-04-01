import { useRef } from 'react';
import { SEO } from '@/lib/seo';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, Shield, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CategoryProductSectionProps {
  category: any;
  onAddToCart: (product: any, variant: any) => void;
}

function CategoryProductSection({ category, onAddToCart }: CategoryProductSectionProps) {
  const { data: productsData, isLoading } = useProducts({
    categorySlug: category.slug,
    limit: 8,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -300 : 300,
      behavior: 'smooth',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!productsData?.products || productsData.products.length === 0) {
    return null;
  }

  return (
    <section className="py-10">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">{category.name}</h2>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link to={`/c/${category.slug}`} className="flex items-center gap-1">
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

        {/* Mobile Scroll */}
        <div className="md:hidden relative">
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2">
            {productsData.products.map((product) => (
              <div key={product.id} className="w-[240px] shrink-0">
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
          <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white border rounded-full shadow-sm text-muted-foreground z-10">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white border rounded-full shadow-sm text-muted-foreground z-10">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { addItem } = useCart();

  const rootCategories = categories?.filter(c => !c.parentId) || [];

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

      {/* Hero - Clean & Minimal */}
      <section className="border-b">
        <div className="container py-16 lg:py-24">
          <div className="max-w-2xl">
            <h1 className="text-3xl lg:text-5xl font-bold text-foreground tracking-tight leading-[1.15] mb-4">
              Mùi hương
              <br />
              định hình phong cách
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              Khám phá bộ sưu tập nước hoa xịt Thái Lan chính hãng. Thơm lâu, đa dạng, giá tốt nhất.
            </p>
            <div className="flex gap-3">
              <Button asChild size="lg">
                <Link to="/catalog">Khám phá ngay</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/catalog?sort=best_selling">Bán chạy nhất</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="container py-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Truck, title: 'Giao nhanh', desc: 'Nội thành 2h' },
              { icon: Shield, title: 'Chính hãng 100%', desc: 'Cam kết chất lượng' },
              { icon: RefreshCw, title: 'Đổi trả 7 ngày', desc: 'Thủ tục đơn giản' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2">
                <item.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Products */}
      <div className="divide-y">
        {isLoadingCategories ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          rootCategories.map((category) => (
            <CategoryProductSection
              key={category.id}
              category={category}
              onAddToCart={handleAddToCart}
            />
          ))
        )}
      </div>
    </>
  );
}
