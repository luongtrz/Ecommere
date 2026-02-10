import { useRef } from 'react';
import { SEO } from '@/lib/seo';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, Shield, RefreshCw, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Category } from '../api/categories.api';

interface CategoryProductsSectionProps {
  category: Category;
  onAddToCart: (product: any, variant: any) => void;
  index: number;
}

function CategoryProductsSection({ category, onAddToCart, index }: CategoryProductsSectionProps) {
  const { data: productsData, isLoading } = useProducts({
    categorySlug: category.slug,
    limit: 8,
  });

  if (isLoading) return null;
  if (!productsData?.products || productsData.products.length === 0) return null;

  return (
    <section className="py-20 animate-fade-in-up" style={{ animationDelay: `${index * 150}ms` }}>
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-px w-8 bg-blue-600"></span>
              <span className="text-blue-600 font-bold uppercase tracking-wider text-sm">Bo suu tap</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">{category.name}</h2>
          </div>
          <Button asChild variant="ghost" className="rounded-full text-gray-900 group hover:bg-gray-100 px-6">
            <Link to={`/c/${category.slug}`} className="flex items-center gap-2">
              Xem tat ca
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
    </section>
  );
}

export function HomePage() {
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { addItem } = useCart();
  const featuresRef = useRef<HTMLDivElement>(null);

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

      {/* Modern Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-white">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-50 to-transparent -z-10" />
        <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />

        <div className="container relative z-10 pt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Text Content */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 shadow-sm">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold text-blue-900 tracking-wide">Thuong hieu duoc yeu thich nhat 2026</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1] tracking-tight">
                Kham pha <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">The gioi mui huong</span>
                <br /> Dang cap
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                Tu tin the hien ca tinh voi bo suu tap nuoc hoa xit Thai Lan chinh hang.
                Luu huong lau dai, mui huong da dang, phong cach thoi thuong.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 border-0">
                  <Link to="/catalog">
                    Mua sam ngay
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" onClick={scrollToFeatures} className="h-14 px-8 rounded-full text-lg border-2 hover:bg-gray-50 text-gray-700">
                  Tim hieu them
                </Button>
              </div>

              <div className="pt-8 flex items-center gap-8 text-sm font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  100% Chinh hang
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Giao hang nhanh 2h
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  Doi tra mien phi
                </div>
              </div>
            </div>

            {/* Visual Content - 3D Floating Elements Placeholder */}
            <div className="relative h-[600px] hidden lg:block perspective-1000">
              <div className="absolute inset-0 flex items-center justify-center animate-float">
                {/* Main Image Container with Glass Effect */}
                <div className="w-[450px] h-[550px] bg-white/40 backdrop-blur-2xl rounded-[40px] border border-white/50 shadow-2xl shadow-blue-200/50 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  {/* Abstract Shapes representing Products */}
                  <div className="relative z-10 text-center">
                    <div className="w-48 h-80 bg-gradient-to-b from-gray-100 to-gray-200 rounded-full mx-auto shadow-inner border border-white flex items-center justify-center mb-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/50 to-transparent" />
                      <span className="text-gray-400 font-bold text-xl rotate-90">PREMIUM SPRAY</span>
                    </div>
                    <div className="inline-block px-6 py-2 bg-white rounded-full shadow-lg text-blue-900 font-bold text-lg">
                      New Collection 2026
                    </div>
                  </div>

                  {/* Floating Cards */}
                  <div className="absolute top-10 -right-10 bg-white p-4 rounded-2xl shadow-xl animate-float-slow z-20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">4.9/5.0</div>
                        <div className="text-xs text-gray-500">Rating</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-20 -left-8 bg-white p-4 rounded-2xl shadow-xl animate-float z-20" style={{ animationDelay: '1.5s' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Zap className="h-5 w-5 text-green-600 fill-green-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">Ban chay</div>
                        <div className="text-xs text-gray-500">Tuan nay</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-10 border-y border-gray-100 bg-gray-50/50 overflow-hidden">
        <div className="container relative">
          <div className="flex w-full overflow-hidden mask-linear-fade">
            <div className="flex gap-12 sm:gap-24 animate-marquee whitespace-nowrap items-center text-gray-300 font-black text-4xl uppercase tracking-tighter opacity-30 select-none">
              <span>Thai Spray</span>
              <span>Premium Quality</span>
              <span>Authentic</span>
              <span>Fast Delivery</span>
              <span>Best Price</span>
              <span>Thai Spray</span>
              <span>Premium Quality</span>
              <span>Authentic</span>
              <span>Fast Delivery</span>
              <span>Best Price</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-white relative">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Chat luong lam nen thuong hieu</h2>
            <p className="text-gray-600 text-lg">Chung toi cam ket mang den nhung san pham chat luong nhat tu Thai Lan den tan tay ban.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Truck, title: 'Giao hang sieu toc', desc: 'Nhan hang trong 2h tai noi thanh. Mien phi ship cho don tu 500k.', color: 'blue' },
              { icon: Shield, title: 'Bao hanh chinh hang', desc: 'Den gap 10 lan neu phat hien hang gia. Bao hanh doi tra 30 ngay.', color: 'emerald' },
              { icon: RefreshCw, title: 'Ho tro tan tam', desc: 'Doi ngu tu van vien chuyen nghiep, ho tro 24/7 moi thac mac cua ban.', color: 'violet' }
            ].map((feature, idx) => (
              <div key={idx} className="group p-8 rounded-3xl bg-gray-50 hover:bg-white border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-2">
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-7 w-7 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <div className="bg-gray-50/30 pb-24 border-t border-gray-100">
        {isLoadingCategories ? (
          <div className="container py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          categories?.map((category, index) => (
            <CategoryProductsSection
              key={category.id}
              category={category}
              onAddToCart={handleAddToCart}
              index={index}
            />
          ))
        )}
      </div>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-900" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20" />

        <div className="container relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">San sang trai nghiem?</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Hang ngan khach hang da tin tuong va lua chon Thai Spray Shop. Con ban thi sao?
          </p>
          <Button asChild size="lg" className="h-16 px-10 rounded-full text-lg font-bold bg-white text-gray-900 hover:bg-gray-100 hover:scale-105 transition-all shadow-2xl">
            <Link to="/register">
              Tham gia ngay hom nay
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
