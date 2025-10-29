import { SEO } from '@/lib/seo';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HomePage() {
  const { data: newProducts, isLoading: isLoadingNew } = useProducts({ 
    sortBy: 'newest', 
    limit: 8 
  });
  const { data: bestSelling, isLoading: isLoadingBest } = useProducts({ 
    sortBy: 'best_selling', 
    limit: 8 
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

  return (
    <>
      <SEO />
      
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
        <div className="container text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Chai Xịt Thái Lan Chính Hãng
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Đa dạng mùi hương, chất lượng cao, giá tốt nhất thị trường
          </p>
          <Button asChild size="lg">
            <Link to="/catalog">
              Khám phá ngay <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* New Products */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Sản phẩm mới nhất</h2>
          <Button asChild variant="outline">
            <Link to="/catalog?sort=newest">Xem tất cả</Link>
          </Button>
        </div>
        
        {isLoadingNew ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newProducts?.products.map((product) => (
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
      </section>

      {/* Best Selling */}
      <section className="bg-muted/50 py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Bán chạy nhất</h2>
            <Button asChild variant="outline">
              <Link to="/catalog?sort=best_selling">Xem tất cả</Link>
            </Button>
          </div>
          
          {isLoadingBest ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {bestSelling?.products.map((product) => (
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
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚚</span>
            </div>
            <h3 className="font-semibold mb-2">Giao hàng nhanh</h3>
            <p className="text-sm text-muted-foreground">Giao hàng toàn quốc trong 1-3 ngày</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="font-semibold mb-2">Chính hãng 100%</h3>
            <p className="text-sm text-muted-foreground">Cam kết sản phẩm chính hãng</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="font-semibold mb-2">Đổi trả dễ dàng</h3>
            <p className="text-sm text-muted-foreground">Đổi trả trong 7 ngày nếu có lỗi</p>
          </div>
        </div>
      </section>
    </>
  );
}
