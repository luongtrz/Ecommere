import { useRef } from 'react';
import { SEO } from '@/lib/seo';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, Shield, RefreshCw, Star, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
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
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
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
    <section className="py-12 border-b border-gray-100">
      <div className="container">
        {/* Category Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Khám phá sản phẩm chất lượng</p>
          </div>
          <Button asChild variant="ghost" className="hidden md:flex text-blue-600 hover:text-blue-700">
            <Link to={`/c/${category.slug}`} className="flex items-center gap-1">
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Products - Desktop Grid, Mobile Horizontal Scroll */}
        <div className="relative">
          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-6">
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

          {/* Mobile Horizontal Scroll */}
          <div className="md:hidden relative">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            >
              {productsData.products.map((product) => (
                <div key={product.id} className="w-[280px] shrink-0">
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

            {/* Mobile Scroll Arrows */}
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-blue-600 z-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-blue-600 z-10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile View All Button */}
        <div className="flex justify-center mt-6 md:hidden">
          <Button asChild variant="outline" className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 px-8">
            <Link to={`/c/${category.slug}`}>
              Xem tất cả {category.name}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { addItem } = useCart();
  const featuresRef = useRef<HTMLDivElement>(null);

  // Filter root categories only
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

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <SEO />

      {/* Hero Section - Compact & Impactful */}
      <section className="relative min-h-[500px] lg:h-[70vh] flex items-center overflow-hidden bg-white pt-20 lg:pt-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 -z-10" />
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[80%] bg-blue-300/10 rounded-full blur-[80px]" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-blue-100 rounded-full px-3 py-1 shadow-sm">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Sản phẩm bán chạy 2026</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1]">
                Mùi hương <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Định hình phong cách</span>
              </h1>

              <p className="text-lg text-gray-600 max-w-md leading-relaxed">
                Khám phá bộ sưu tập nước hoa xịt Thái Lan chính hãng. Thơm lâu, đa dạng, giá tốt nhất.
              </p>

              <div className="flex gap-3">
                <Button asChild size="lg" className="rounded-full bg-gray-900 hover:bg-black text-white px-8 h-12 shadow-lg shadow-gray-200">
                  <Link to="/catalog">Mua ngay</Link>
                </Button>
                <Button variant="outline" size="lg" onClick={scrollToFeatures} className="rounded-full px-8 h-12">
                  Tìm hiểu thêm
                </Button>
              </div>
            </div>

            {/* Compact 3D Visual */}
            <div className="relative h-[400px] hidden lg:flex items-center justify-center">
              <div className="w-[300px] h-[400px] bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-xl rounded-[30px] border border-white/60 shadow-2xl flex items-center justify-center relative animate-float">
                <div className="text-center">
                  <div className="w-32 h-64 bg-gradient-to-b from-gray-100 to-gray-200 rounded-full mx-auto shadow-inner border border-white mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-transparent" />
                  </div>
                  <div className="font-bold text-gray-400 tracking-widest text-sm">CAO CẤP</div>
                </div>
                {/* Floating elements */}
                <div className="absolute top-6 -right-6 bg-white p-3 rounded-xl shadow-lg animate-float-slow">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                    </div>
                    <div className="text-xs font-bold">4.9/5</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee - Standard */}
      <div className="bg-gray-900 py-3 overflow-hidden">
        <div className="flex w-full whitespace-nowrap animate-marquee">
          <div className="flex gap-8 items-center text-white/80 text-sm font-medium uppercase tracking-widest px-4">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="flex items-center gap-8">
                THAI SPRAY SHOP <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Category-Based Product Sections */}
      <div className="bg-gray-50/50">
        <div className="container py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bộ sưu tập nổi bật</h2>
            <div className="h-1 w-12 bg-blue-600 rounded-full mx-auto" />
          </div>
        </div>

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

      {/* Condensed Features */}
      <section ref={featuresRef} className="py-12 bg-white border-t border-gray-100">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Truck, title: 'Giao nhanh 2h', desc: 'Nội thành' },
              { icon: Shield, title: 'Chính hãng', desc: 'Cam kết 100%' },
              { icon: RefreshCw, title: 'Đổi trả', desc: 'Trong 7 ngày' },
              { icon: Zap, title: 'Flash Sale', desc: 'Mỗi tuần' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

