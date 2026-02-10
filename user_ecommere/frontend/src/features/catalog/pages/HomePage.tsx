import { SEO } from '@/lib/seo';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, Shield, RefreshCw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Category } from '../api/categories.api';

interface CategoryProductsSectionProps {
  category: Category;
  onAddToCart: (product: any, variant: any) => void;
  isAlternate?: boolean;
  index: number;
}

function CategoryProductsSection({ category, onAddToCart, isAlternate, index }: CategoryProductsSectionProps) {
  const { data: productsData, isLoading } = useProducts({
    categorySlug: category.slug,
    limit: 8,
  });

  if (isLoading) {
    return (
      <section className={isAlternate ? 'bg-gray-50/80 py-12' : 'py-12'}>
        <div className="container">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (!productsData?.products || productsData.products.length === 0) {
    return null;
  }

  return (
    <section
      className={`${isAlternate ? 'bg-gray-50/80' : ''} py-12 animate-fade-in`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
            <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mt-2" />
          </div>
          <Button asChild variant="outline" className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all group">
            <Link to={`/c/${category.slug}`}>
              Xem tat ca
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-5">
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

          {/* Desktop Grid */}
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
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white">
        {/* Animated background blobs */}
        <div className="absolute top-0 -left-10 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

        <div className="relative container py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/20">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-medium">Thai Spray Shop - Chat luong so 1</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight animate-fade-in">
              Nuoc Hoa Xit
              <span className="block bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300 bg-clip-text text-transparent mt-2">
                Thai Lan Chinh Hang
              </span>
            </h1>

            <p className="text-lg md:text-xl text-blue-100/90 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
              Kham pha bo suu tap nuoc hoa xit thom da dang mui huong,
              chat luong cao cap voi gia tot nhat thi truong
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '400ms' }}>
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-base px-8 h-12 rounded-full shadow-lg hover:shadow-xl transition-all font-semibold">
                <Link to="/catalog">
                  Kham pha ngay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 text-base px-8 h-12 rounded-full font-medium transition-all">
                <Link to="/search">
                  Tim kiem san pham
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-14 pt-8 border-t border-white/10 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '600ms' }}>
              <div>
                <div className="text-2xl md:text-3xl font-bold">500+</div>
                <div className="text-sm text-blue-200 mt-1">San pham</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold">10K+</div>
                <div className="text-sm text-blue-200 mt-1">Khach hang</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold">4.9</div>
                <div className="text-sm text-blue-200 mt-1">Danh gia</div>
              </div>
            </div>
          </div>
        </div>
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
            index={index}
          />
        ))
      )}

      {/* Features */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Tai sao chon chung toi?</h2>
            <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <Truck className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Giao hang nhanh</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Giao hang toan quoc trong 1-3 ngay. Mien phi cho don tu 500.000d.</p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Chinh hang 100%</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Cam ket san pham chinh hang, nguon goc ro rang tu Thai Lan.</p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                <RefreshCw className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Doi tra de dang</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Doi tra trong 7 ngay neu co loi. Hoan tien 100% neu khong hai long.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
