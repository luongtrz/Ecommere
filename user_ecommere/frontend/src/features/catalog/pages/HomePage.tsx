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
            {productsData.products.slice(0, 4).map((product) => (
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
        <section className="section-shell relative overflow-hidden px-6 py-10 md:px-10 md:py-14 bg-white/50 backdrop-blur-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,225,194,0.75),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(185,225,208,0.65),transparent_30%)]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Hương thơm cho không gian sống hiện đại
              </p>
              <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] text-foreground md:text-6xl font-serif">
                Chọn mùi hương khiến nhà ở, xe hơi và quà tặng của bạn trông có gu hơn.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Thai Spray tập trung vào những lựa chọn dễ dùng, mùi sạch, gọn và không gắt. Bạn có thể bắt đầu từ
                mùi bán chạy, hỏi chatbot theo không gian sử dụng hoặc lọc theo ngân sách ngay trên catalog.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-full px-6 transition-transform duration-300 hover:scale-[1.02] shadow-lg shadow-primary/20">
                  <Link to="/catalog">
                    Khám phá bộ sưu tập
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 border-white/80 bg-white/40 hover:bg-white/70 transition-transform duration-300 hover:scale-[1.02] shadow-sm">
                  <Link to="/catalog?sort=best_selling">Xem nhóm bán chạy nhất</Link>
                </Button>
              </div>
            </div>

            <div className="relative aspect-square w-full max-w-[400px] mx-auto lg:max-w-none rounded-[2rem] overflow-hidden shadow-2xl border border-white/60 group animate-scale-in">
              <img
                src="/hero-fragrance.png"
                alt="Thai Spray Luxury Fragrance"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">Premium Scent Collection</p>
                <h3 className="text-lg font-bold mt-1 font-serif leading-tight">Mùi hương tinh tế cho nhịp sống hiện đại</h3>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="section-shell p-6 bg-white/60 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">Điểm mạnh của shop</p>
            <div className="grid gap-3 grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/80 border border-white/50 p-4 shadow-sm text-center hover:scale-[1.02] transition-all duration-300">
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
              {curatedProducts?.products.map((product) => (
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
