import { useState, useRef } from 'react';
import { SEO } from '@/lib/seo';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useCart } from '@/features/cart/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Truck, Shield, RefreshCw, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductGridProps {
  categorySlug: string;
  onAddToCart: (product: any, variant: any) => void;
}

function ProductGrid({ categorySlug, onAddToCart }: ProductGridProps) {
  const { data: productsData, isLoading } = useProducts({
    categorySlug,
    limit: 8,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!productsData?.products || productsData.products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Không có sản phẩm nào trong danh mục này.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
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
  );
}

export function HomePage() {
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { addItem } = useCart();
  const featuresRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  // Set default tab when categories load
  if (categories && categories.length > 0 && !activeTab) {
    setActiveTab(categories[0].slug);
  }

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
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Best Seller 2026</span>
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
                  <div className="font-bold text-gray-400 tracking-widest text-sm">PREMIUM</div>
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

      {/* Tabbed Product Showcase */}
      <section className="py-16 bg-gray-50/50">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bộ sưu tập nổi bật</h2>
            <div className="h-1 w-12 bg-blue-600 rounded-full mx-auto" />
          </div>

          {isLoadingCategories ? (
            <div className="flex justify-center"><LoadingSpinner /></div>
          ) : categories && categories.length > 0 ? (
            <Tabs defaultValue={categories[0].slug} value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-8 overflow-x-auto pb-4 scrollbar-hide">
                <TabsList className="h-auto p-1 bg-white border border-gray-100 rounded-full shadow-sm inline-flex">
                  {categories.map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.slug}
                      className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-gray-900 data-[state=active]:text-white transition-all"
                    >
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {categories.map((cat) => (
                <TabsContent key={cat.id} value={cat.slug} className="mt-0 focus-visible:outline-none">
                  <ProductGrid categorySlug={cat.slug} onAddToCart={handleAddToCart} />
                  <div className="flex justify-center mt-10">
                    <Button asChild variant="outline" className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 px-8">
                      <Link to={`/c/${cat.slug}`}>
                        Xem tất cả {cat.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : null}
        </div>
      </section>

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
