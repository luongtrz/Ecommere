import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
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
];

const BENEFITS = [
  { icon: Truck, title: 'Giao nhanh', desc: 'Nội thành linh hoạt trong ngày' },
  { icon: Shield, title: 'Chính hãng', desc: 'Danh mục được chọn lọc kỹ' },
  {
    icon: RefreshCw,
    title: 'Đổi trả rõ ràng',
    desc: 'Hỗ trợ trong 7 ngày đầu',
  },
];

const FEATURED_CATEGORY_LIMIT = 4;

function HomeSectionSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x md:grid md:grid-cols-3 xl:grid-cols-4 md:gap-x-6 md:gap-y-8 md:overflow-visible md:pb-0">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="w-64 shrink-0 space-y-3 md:w-auto md:shrink"
        >
          <div className="aspect-[4/5] w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

interface CategoryProductSectionProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  };
  index: number;
  onAddToCart: (product: any, variant: any) => void;
}

function CategoryProductSection({
  category,
  index,
  onAddToCart,
}: CategoryProductSectionProps) {
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

  // Do not render empty category sections (no ghost chrome/headers without products)
  if (
    isVisible &&
    !isLoading &&
    (!productsData || productsData.products.length === 0)
  ) {
    return null;
  }

  return (
    <section ref={sectionRef} className="section-y border-t border-border">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-muted-foreground mb-2 text-balance">
            Danh mục nổi bật
          </p>
          <h2 className="section-title text-balance">{category.name}</h2>
          {category.description && category.description.trim() !== '' ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {category.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Cuộn sang trái"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Cuộn sang phải"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <Button asChild variant="outline" className="min-h-11">
            <Link to={`/c/${category.slug}`}>
              Xem toàn bộ danh mục
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && !productsData ? <HomeSectionSkeleton /> : null}

      {!isLoading && productsData?.products?.length ? (
        <>
          <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6">
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
                variants={product.variants}
                onAddToCart={() =>
                  product.variants[0] &&
                  onAddToCart(product, product.variants[0])
                }
              />
            ))}
          </div>

          <div className="md:hidden">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            >
              {productsData.products.map((product) => (
                <div key={product.id} className="w-64 shrink-0 snap-start">
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    images={product.images}
                    price={product.basePrice}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    variants={product.variants}
                    onAddToCart={() =>
                      product.variants[0] &&
                      onAddToCart(product, product.variants[0])
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

export function HomePage() {
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { addItem } = useCart();
  const { data: curatedProducts, isLoading: isLoadingCuratedProducts } =
    useProducts({
      sortBy: 'best_selling',
      limit: 4,
    });

  const rootCategories = (
    categories?.filter((category) => !category.parentId) || []
  ).slice(0, FEATURED_CATEGORY_LIMIT);

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

      <div className="container">
        <section className="pt-6 pb-10 md:py-16">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col justify-center">
              <p className="eyebrow text-muted-foreground mb-3 text-balance">
                Hương thơm cho không gian sống hiện đại
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-snug text-balance text-foreground max-w-xl">
                Chọn mùi hương khiến không gian của bạn trông có gu hơn.
              </h1>
              <p className="mt-4 max-w-prose text-sm sm:text-base leading-relaxed text-muted-foreground">
                Thai Spray tập trung vào những lựa chọn mùi sạch, tinh khiết,
                gọn và không gắt. Bạn có thể bắt đầu từ mùi bán chạy, hỏi
                chatbot theo không gian sử dụng hoặc lọc theo ngân sách ngay
                trên catalog.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="min-h-11">
                  <Link to="/catalog">
                    Khám phá bộ sưu tập
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="min-h-11"
                >
                  <Link to="/catalog?sort=best_selling">
                    Xem nhóm bán chạy nhất
                  </Link>
                </Button>
              </div>
            </div>

            <div className="aspect-[4/5] w-full overflow-hidden rounded-lg border border-border bg-muted">
              <img
                src="/hero-fragrance.png"
                alt="Thai Spray Luxury Fragrance"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="border-t border-border py-6 md:py-8">
          <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-y-0 md:divide-x md:divide-border">
            {BENEFITS.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3.5 py-4 first:pt-0 last:pb-0 md:py-0 md:px-6 md:first:pl-0 md:last:pr-0"
              >
                <item.icon className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-8 md:py-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="eyebrow text-muted-foreground mb-4 text-balance">
                Điểm mạnh của shop
              </p>
              <div className="grid grid-cols-2 divide-x divide-border">
                {HIGHLIGHTS.map((item) => (
                  <div key={item.label} className="px-4 first:pl-0 last:pr-0">
                    <p className="text-2xl md:text-3xl font-bold text-primary tabular">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-6 lg:border-t-0 lg:border-l lg:border-border lg:pl-8 lg:pt-0">
              <p className="eyebrow text-muted-foreground mb-4 text-balance">
                Gợi ý bắt đầu nhanh
              </p>
              <div className="flex flex-wrap gap-2.5">
                {[
                  'Xịt phòng khách',
                  'Tinh dầu thơm',
                  'Quà tặng',
                  'Mùi sạch cho xe',
                ].map((item) => (
                  <Link
                    key={item}
                    to={`/search?q=${encodeURIComponent(item)}`}
                    className="min-h-11 inline-flex items-center rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item}
                  </Link>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Nhấp vào từ khóa để tìm kiếm nhanh sản phẩm phù hợp.
              </p>
            </div>
          </div>
        </section>

        <section className="section-y border-t border-border">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-muted-foreground mb-2 text-balance">
                Biên tập bởi Thai Spray
              </p>
              <h2 className="section-title text-balance">
                Những lựa chọn đang được hỏi nhiều
              </h2>
            </div>
            <Button
              asChild
              variant="ghost"
              className="justify-start px-0 min-h-11 text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              <Link to="/catalog?sort=best_selling">
                Xem thêm trong catalog
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoadingCuratedProducts && !curatedProducts ? (
            <HomeSectionSkeleton />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-3 xl:grid-cols-4 md:gap-x-6 md:gap-y-8 md:overflow-visible md:pb-0">
              {curatedProducts?.products.map((product) => (
                <div
                  key={product.id}
                  className="w-64 shrink-0 snap-start md:w-auto md:shrink md:snap-align-none"
                >
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    images={product.images}
                    price={product.basePrice}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    variants={product.variants}
                    onAddToCart={() =>
                      product.variants[0] &&
                      handleAddToCart(product, product.variants[0])
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <div>
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
