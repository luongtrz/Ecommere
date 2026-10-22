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
  {
    icon: RefreshCw,
    title: 'Đổi trả rõ ràng',
    desc: 'Hỗ trợ trong 7 ngày đầu',
  },
];

const FEATURED_CATEGORY_LIMIT = 4;

function HomeSectionSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-[360px] animate-pulse rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm flex flex-col justify-between"
        >
          <div className="aspect-square w-full rounded-lg bg-slate-100" />
          <div className="space-y-2 pt-3">
            <div className="h-3.5 w-3/4 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>
          <div className="mt-auto pt-3">
            <div className="mb-3 h-4 w-1/3 rounded bg-slate-100" />
            <div className="h-9 w-full rounded-lg bg-slate-100" />
          </div>
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

  return (
    <section
      ref={sectionRef}
      className={`rounded-2xl border border-slate-200/90 p-5 shadow-sm transition-all duration-200 hover:shadow-md md:p-8 ${
        index % 2 === 0
          ? 'bg-white'
          : 'bg-gradient-to-br from-slate-50/90 via-white to-teal-50/20'
      }`}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Danh mục nổi bật</span>
          </div>
          <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {category.name}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Những lựa chọn được khách chọn nhiều khi cần mùi thơm gọn, dễ dùng
            và phù hợp sinh hoạt mỗi ngày.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-teal-200 hover:bg-teal-50/60 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
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
              <div
                key={product.id}
                className="animate-fade-in"
                style={{ animationDelay: `${idx * 80}ms` }}
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
                    onAddToCart(product, product.variants[0])
                  }
                />
              </div>
            ))}
          </div>

          <div className="relative md:hidden">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x snap-mandatory"
            >
              {productsData.products.map((product) => (
                <div key={product.id} className="w-[260px] shrink-0 snap-start">
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
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Cuộn sang trái"
              className="absolute left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-700 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Cuộn sang phải"
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-700 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-95"
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

      <div className="container space-y-10 px-4 py-8 sm:px-6 md:space-y-14 md:py-12">
        {/* Banner Hero Section */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 p-6 shadow-sm transition-all duration-200 hover:shadow-md md:p-10 lg:p-12">
          {/* Decorative ambient background accents */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-slate-100/60 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50/90 px-3.5 py-1.5 text-teal-800 shadow-xs backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-xs font-semibold tracking-wide">
                  Hương thơm cho không gian sống hiện đại
                </span>
              </div>

              <h1 className="font-sans text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                Chọn mùi hương khiến không gian của bạn{' '}
                <span className="text-teal-600">trông có gu hơn</span>.
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                Thai Spray tập trung vào những lựa chọn mùi sạch, tinh khiết,
                gọn và không gắt. Bạn có thể bắt đầu từ mùi bán chạy, hỏi
                chatbot theo không gian sử dụng hoặc lọc theo ngân sách ngay
                trên catalog.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
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
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                >
                  <Link to="/catalog?sort=best_selling">
                    Xem nhóm bán chạy nhất
                  </Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="mx-auto w-full max-w-[420px] lg:max-w-none">
                {/* Main Hero Image Card */}
                <div className="group relative aspect-[4/5] sm:aspect-square w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
                  <img
                    src="/hero-fragrance.png"
                    alt="Thai Spray Luxury Fragrance"
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Recommendation pill at top right */}
                  <div className="absolute right-4 top-4 rounded-full border border-slate-200/80 bg-white/95 px-3.5 py-1.5 shadow-sm backdrop-blur-md">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Khuyên dùng
                    </p>
                    <p className="text-xs font-bold text-slate-900">
                      Woody & Fresh
                    </p>
                  </div>

                  {/* Caption text of the hero image */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent p-6 text-white">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-200">
                      Premium Scent Collection
                    </p>
                    <p className="mt-1 font-sans text-base font-semibold leading-tight text-white sm:text-lg">
                      Mùi hương tinh tế cho nhịp sống hiện đại
                    </p>
                  </div>
                </div>

                {/* Scent notes card */}
                <div className="mt-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">
                    Olfactory Notes
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2.5 sm:gap-4">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      <span className="h-2 w-2 rounded-full bg-teal-600" />
                      <span>Gỗ thông rừng</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span>Xô thơm quýt</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      <span>Bạc hà lạnh</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bestseller strip / Curated products */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md md:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Biên tập bởi Thai Spray</span>
              </div>
              <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Những lựa chọn đang được hỏi nhiều
              </h2>
            </div>
            <Button
              asChild
              variant="ghost"
              className="group -ml-3 self-start rounded-lg px-3 py-2 text-sm font-semibold text-teal-600 transition-colors duration-200 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:ml-0 sm:self-auto"
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
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {curatedProducts?.products.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 80}ms` }}
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

        {/* Highlights and Quick start row */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Highlights */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md md:p-8">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Điểm mạnh của shop
              </p>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                {HIGHLIGHTS.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-sm"
                  >
                    <p className="font-sans text-2xl font-bold tabular-nums tracking-tight text-teal-600 md:text-3xl">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs font-medium leading-snug text-slate-600">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick start chips */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md md:p-8">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Gợi ý bắt đầu nhanh
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {[
                  'Xịt phòng khách',
                  'Body mist nhẹ',
                  'Quà tặng',
                  'Mùi sạch cho xe',
                ].map((item) => (
                  <Link
                    key={item}
                    to={`/search?q=${encodeURIComponent(item)}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              Nhấp vào từ khóa để tìm kiếm nhanh sản phẩm phù hợp.
            </p>
          </div>
        </section>

        {/* Benefits row */}
        <section className="grid gap-4 md:grid-cols-3">
          {BENEFITS.map((item) => (
            <div
              key={item.title}
              className="group flex items-start gap-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-md md:p-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-600 transition-colors duration-200 group-hover:bg-teal-600 group-hover:text-white">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-sans text-base font-bold tracking-tight text-slate-900 md:text-lg">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Category product sections */}
        <div className="space-y-8 md:space-y-12">
          {isLoadingCategories ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200/90 bg-white py-16 shadow-sm">
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
