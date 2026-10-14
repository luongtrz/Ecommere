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
    <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-[360px] animate-pulse rounded-[1.8rem] border border-black/[0.03] bg-card/70 shadow-luxury"
        />
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
    <section ref={sectionRef} className="section-shell overflow-hidden p-6 md:p-10 shadow-luxury">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Danh mục nổi bật</p>
          <h2 className="font-serif text-2xl font-semibold leading-tight text-foreground md:text-3xl">{category.name}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Những lựa chọn được khách chọn nhiều khi cần mùi thơm gọn, dễ dùng và phù hợp sinh hoạt mỗi ngày.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full border-border bg-card/80 px-5 text-xs font-bold uppercase tracking-wider text-foreground shadow-sm transition-all duration-300 hover:bg-secondary hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring">
          <Link to={`/c/${category.slug}`}>
            Xem toàn bộ danh mục
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {isLoading && !productsData ? <HomeSectionSkeleton /> : null}

      {!isLoading && productsData?.products?.length ? (
        <>
          <div className="hidden gap-4 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-4">
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
                  variants={product.variants}
                  onAddToCart={() => product.variants[0] && onAddToCart(product, product.variants[0])}
                />
              </div>
            ))}
          </div>

          <div className="relative md:hidden">
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {productsData.products.map((product) => (
                <div key={product.id} className="w-[260px] shrink-0">
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    images={product.images}
                    price={product.basePrice}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    variants={product.variants}
                    onAddToCart={() => product.variants[0] && onAddToCart(product, product.variants[0])}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Cuộn sang trái"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-luxury backdrop-blur-md transition-all duration-200 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Cuộn sang phải"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-luxury backdrop-blur-md transition-all duration-200 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
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
      price: variant.salePrice ?? variant.price,
      scent: variant.scent,
      volumeMl: variant.volumeMl,
    });
  };

  return (
    <>
      <SEO />

      <div className="container space-y-12 py-8 md:space-y-16 md:py-12">
        {/* Editorial Hero Section */}
        <section className="section-shell relative overflow-hidden px-6 py-12 md:px-12 md:py-20 shadow-luxury">
          {/* Ambient decorative glow orbs */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-[80px] animate-float-orb" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-[90px] animate-float-orb [animation-delay:-5s]" />

          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 backdrop-blur-md shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
                  Hương thơm cho không gian sống hiện đại
                </span>
              </div>

              <h1 className="max-w-2xl font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] tracking-tight text-foreground text-balance">
                Chọn mùi hương khiến không gian của bạn{' '}
                <span className="italic text-accent-foreground">trông có gu hơn</span>.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Thai Spray tập trung vào những lựa chọn mùi sạch, tinh khiết, gọn và không gắt. Bạn có thể bắt đầu từ
                mùi bán chạy, hỏi chatbot theo không gian sử dụng hoặc lọc theo ngân sách ngay trên catalog.
              </p>

              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="h-[3.25rem] rounded-full bg-primary px-8 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-luxury transition-all duration-300 hover:scale-[1.02] hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Link to="/catalog">
                    Khám phá bộ sưu tập
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-[3.25rem] rounded-full border-border bg-card/80 px-8 text-xs font-bold uppercase tracking-wider text-foreground shadow-sm transition-all duration-300 hover:bg-secondary hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Link to="/catalog?sort=best_selling">Xem nhóm bán chạy nhất</Link>
                </Button>
              </div>
            </div>

            <div className="relative lg:col-span-5">
              <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
                {/* Main Hero Image Card */}
                <div className="relative aspect-[4/5] sm:aspect-square w-full overflow-hidden rounded-[2rem] border border-black/[0.03] bg-card shadow-luxury group">
                  <img
                    src="/hero-fragrance.png"
                    alt="Thai Spray Luxury Fragrance"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Recommendation pill at top right */}
                  <div className="absolute top-4 right-4 rounded-full border border-white/40 bg-card/90 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Khuyên dùng</p>
                    <p className="text-xs font-extrabold tracking-wide text-foreground">Woody & Fresh</p>
                  </div>

                  {/* Caption text of the hero image */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-6 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">Premium Scent Collection</p>
                    <p className="mt-1 font-serif text-lg font-bold leading-tight text-white">Mùi hương tinh tế cho nhịp sống hiện đại</p>
                  </div>
                </div>

                {/* Scent notes floating card */}
                <div className="mt-4 rounded-[1.8rem] border border-black/[0.03] bg-card/95 p-4.5 shadow-luxury backdrop-blur-md transition-all duration-300 hover:shadow-luxury-glow lg:absolute lg:top-8 lg:-left-8 lg:mt-0 lg:w-[210px]">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent-foreground">Olfactory Notes</p>
                  <div className="mt-2.5 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full bg-primary shadow-sm" />
                      <span>Gỗ thông rừng</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full bg-accent-foreground shadow-sm" />
                      <span>Xô thơm quýt</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground shadow-sm" />
                      <span>Bạc hà lạnh</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bestseller strip / Curated products */}
        <section className="section-shell p-6 md:p-10 shadow-luxury">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Biên tập bởi Thai Spray</p>
              <h2 className="font-serif text-2xl font-semibold leading-tight text-foreground md:text-3xl">Những lựa chọn đang được hỏi nhiều</h2>
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
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
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
                    variants={product.variants}
                    onAddToCart={() => product.variants[0] && handleAddToCart(product, product.variants[0])}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Highlights and Quick start row */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Highlights */}
          <div className="section-shell flex flex-col justify-between p-6 md:p-8 shadow-luxury">
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Điểm mạnh của shop</p>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {HIGHLIGHTS.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-black/[0.03] bg-card/90 p-4 text-center shadow-luxury transition-all duration-300 hover:-translate-y-1 hover:shadow-luxury-glow"
                  >
                    <p className="font-serif text-2xl font-bold text-primary md:text-3xl">{item.value}</p>
                    <p className="mt-1 text-xs font-medium leading-snug text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick start chips */}
          <div className="section-shell flex flex-col justify-between p-6 md:p-8 shadow-luxury">
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Gợi ý bắt đầu nhanh</p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {['Xịt phòng khách', 'Body mist nhẹ', 'Quà tặng', 'Mùi sạch cho xe'].map((item) => (
                  <Link
                    key={item}
                    to={`/search?q=${encodeURIComponent(item)}`}
                    className="rounded-full border border-border bg-card/90 px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">Nhấp vào từ khóa để tìm kiếm nhanh sản phẩm phù hợp.</p>
          </div>
        </section>

        {/* Benefits row */}
        <section className="grid gap-4 md:grid-cols-3">
          {BENEFITS.map((item) => (
            <div
              key={item.title}
              className="section-shell flex items-start gap-4 p-5 md:p-6 shadow-luxury transition-all duration-300 hover:-translate-y-0.5 hover:shadow-luxury-glow"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-foreground">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground md:text-lg">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Category product sections */}
        <div className="space-y-8 md:space-y-12">
          {isLoadingCategories ? (
            <div className="flex justify-center py-12">
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
