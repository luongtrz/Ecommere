import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  Sparkles,
  Truck,
} from 'lucide-react';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/common/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useCart } from '@/features/cart/hooks/useCart';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';

const HIGHLIGHTS = [
  { label: 'Mùi hương bán chạy', value: '120+' },
  { label: 'Khách quay lại mua', value: '89%' },
  { label: 'Tư vấn theo không gian', value: '1:1' },
];

const BENEFITS = [
  { icon: Truck, title: 'Giao nhanh', desc: 'Nội thành linh hoạt trong ngày' },
  { icon: Shield, title: 'Chính hãng', desc: 'Danh mục được chọn lọc kỹ' },
  { icon: RefreshCw, title: 'Đổi trả rõ ràng', desc: 'Hỗ trợ trong 7 ngày đầu' },
];

const FEATURED_CATEGORY_LIMIT = 4;

function HomeSectionSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-[360px] animate-pulse rounded-[1.65rem] bg-white/70" />
      ))}
    </div>
  );
}

interface CategoryProductSectionProps {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  index: number;
  onAddToCart: (product: any, variant: any) => void;
}

function CategoryProductSection({ category, index, onAddToCart }: CategoryProductSectionProps) {
  const [isVisible, setIsVisible] = useState(index < 2);
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible || !sectionRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '160px 0px' },
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, [isVisible]);

  const { data: productsData, isLoading } = useProducts(
    {
      categorySlug: category.slug,
      limit: 8,
      sortBy: 'best_selling',
    },
    {
      enabled: isVisible,
    },
  );

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  return (
    <section ref={sectionRef} className="section-shell overflow-hidden p-5 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Danh mục nổi bật</p>
          <h2 className="section-title text-2xl md:text-3xl">{category.name}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Những lựa chọn được khách chọn nhiều khi cần mùi thơm gọn, dễ dùng và phù hợp sinh hoạt mỗi ngày.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full px-5">
          <Link to={`/c/${category.slug}`}>
            Xem toàn bộ danh mục
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {isLoading && !productsData ? <HomeSectionSkeleton /> : null}

      {!isLoading && productsData?.products?.length ? (
        <>
          <div className="hidden gap-5 md:grid md:grid-cols-2 xl:grid-cols-4">
            {productsData.products.slice(0, 4).map((product, idx) => (
              <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
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

          <div className="relative md:hidden">
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {productsData.products.map((product) => (
                <div key={product.id} className="w-[265px] shrink-0">
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
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

export function HomePage() {
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { addItem } = useCart();
  const { data: curatedProducts, isLoading: isLoadingCuratedProducts } = useProducts({
    sortBy: 'best_selling',
    limit: 4,
  });

  const rootCategories = (categories?.filter((category) => !category.parentId) || []).slice(0, FEATURED_CATEGORY_LIMIT);

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

      <div className="container space-y-8 py-6 md:space-y-10 md:py-8">
        <section className="section-shell relative overflow-hidden px-6 py-12 md:px-12 md:py-16 bg-white/40 backdrop-blur-xl border border-white/80 shadow-[0_32px_80px_-40px_rgba(24,46,37,0.2)]">
          {/* Animated Ambient Blobs */}
          <div className="absolute top-[-20%] left-[-10%] h-[350px] w-[350px] rounded-full bg-emerald-300/18 blur-[80px] animate-float-orb pointer-events-none" />
          <div className="absolute bottom-[-15%] right-[-5%] h-[400px] w-[400px] rounded-full bg-amber-200/22 blur-[90px] animate-float-orb [animation-delay:-5s] pointer-events-none" />
          
          <div className="relative grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/90 px-4.5 py-2 text-xs font-bold uppercase tracking-[0.24em] text-primary shadow-sm hover:scale-[1.01] transition-transform duration-300">
                <Sparkles className="h-3.5 w-3.5 text-primary fill-primary/10 animate-pulse" />
                Hương thơm cho không gian sống hiện đại
              </p>
              <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-7xl font-serif">
                Chọn mùi hương khiến không gian của bạn <span className="text-gradient-emerald">trông có gu hơn</span>.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg font-medium">
                Thai Spray tập trung vào những lựa chọn mùi sạch, tinh khiết, gọn và không gắt. Bạn có thể bắt đầu từ
                mùi bán chạy, hỏi chatbot theo không gian sử dụng hoặc lọc theo ngân sách ngay trên catalog.
              </p>
              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
                <Button asChild size="lg" className="h-13 rounded-full px-8 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 shadow-xl shadow-primary/25 hover:shadow-primary/35 bg-primary">
                  <Link to="/catalog">
                    Khám phá bộ sưu tập
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-13 rounded-full px-8 border-white/80 bg-white/50 hover:bg-white/80 hover:-translate-y-0.5 hover:scale-[1.03] transition-all duration-300 shadow-md">
                  <Link to="/catalog?sort=best_selling">Xem nhóm bán chạy nhất</Link>
                </Button>
              </div>
            </div>

            <div className="relative aspect-square w-full max-w-[400px] mx-auto lg:max-w-none rounded-[2.2rem] border border-white/70 shadow-2xl group animate-scale-in">
              <div className="h-full w-full overflow-hidden rounded-[2.2rem] bg-gradient-to-tr from-secondary/50 to-white/30 border border-white/40">
                <img
                  src="/hero-fragrance.png"
                  alt="Thai Spray Luxury Fragrance"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.2s] ease-out"
                />
              </div>
              <div className="absolute inset-0 rounded-[2.2rem] bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">Premium Scent Collection</p>
                <h3 className="text-lg font-bold mt-1 font-serif leading-tight">Mùi hương tinh tế cho nhịp sống hiện đại</h3>
              </div>
              <div className="absolute top-4 right-4 rounded-2xl border border-white/30 bg-white/20 backdrop-blur-md px-4 py-2.5 text-white shadow-lg animate-bounce [animation-duration:4s]">
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/80">Khuyên dùng</p>
                <p className="text-xs font-extrabold mt-0.5 tracking-wide">Woody & Fresh</p>
              </div>
              
              {/* Scent notes overlay */}
              <div className="absolute -bottom-4 -left-4 glass-premium p-4.5 rounded-[1.5rem] max-w-[210px] border border-white/80 shadow-2xl hidden sm:block hover:scale-105 duration-300">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-primary">Olfactory Notes</p>
                <div className="flex flex-col gap-2 mt-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground/90">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 shadow-sm" />
                    <span>Gỗ thông rừng</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground/90">
                    <span className="h-2 w-2 rounded-full bg-amber-400 shadow-sm" />
                    <span>Xô thơm quýt</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground/90">
                    <span className="h-2 w-2 rounded-full bg-blue-400 shadow-sm" />
                    <span>Bạc hà lạnh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="section-shell p-6 bg-white/60 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">Điểm mạnh của shop</p>
            <div className="grid gap-3 grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/90 border border-white/85 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-center hover-glow hover:-translate-y-0.5 transition-all duration-300">
                  <p className="text-2xl font-bold text-primary">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground font-semibold leading-tight">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="section-shell p-6 bg-white/60 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">Gợi ý bắt đầu nhanh</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Xịt phòng khách', 'Body mist nhẹ', 'Quà tặng', 'Mùi sạch cho xe'].map((item) => (
                  <Link
                    key={item}
                    to={`/search?q=${encodeURIComponent(item)}`}
                    className="rounded-full border border-white/60 bg-white/80 px-4 py-2 text-xs font-bold text-foreground transition-all duration-300 hover:scale-[1.02] hover:border-primary/25 hover:bg-secondary shadow-sm"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4">Nhấp vào từ khóa để tìm kiếm nhanh sản phẩm phù hợp.</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {BENEFITS.map((item) => (
            <div key={item.title} className="section-shell flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="section-shell p-5 md:p-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Biên tập bởi Thai Spray</p>
              <h2 className="section-title text-2xl md:text-3xl">Những lựa chọn đang được hỏi nhiều</h2>
            </div>
            <Button asChild variant="ghost" className="justify-start rounded-full px-0 text-muted-foreground hover:bg-transparent hover:text-foreground">
              <Link to="/catalog?sort=best_selling">
                Xem thêm trong catalog
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoadingCuratedProducts && !curatedProducts ? (
            <HomeSectionSkeleton />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {curatedProducts?.products.map((product, index) => (
                <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    images={product.images}
                    price={product.basePrice}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    onAddToCart={() => product.variants[0] && handleAddToCart(product, product.variants[0])}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          {isLoadingCategories ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : (
            rootCategories.map((category, index) => (
              <CategoryProductSection
                key={category.id}
                category={category}
                index={index}
                onAddToCart={handleAddToCart}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
