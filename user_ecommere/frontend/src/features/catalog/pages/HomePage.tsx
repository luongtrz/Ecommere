import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/common/ProductCard';
import { useCategories } from '@/features/catalog/hooks/useCategories';
import { useProducts } from '@/features/catalog/hooks/useProducts';
import { useCart } from '@/features/cart/hooks/useCart';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { SEO } from '@/lib/seo';
import type { Product, ProductVariant } from '@/features/catalog/types';

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    title: '100% Chính Hãng Thái Lan',
    desc: 'Hàng nội địa nhập khẩu trực tiếp, đầy đủ mã vạch nguồn gốc',
  },
  {
    icon: Truck,
    title: 'Giao Hàng Hỏa Tốc',
    desc: 'Đóng gói kỹ càng, giao hàng nhanh chóng toàn quốc',
  },
  {
    icon: CheckCircle2,
    title: 'Đổi Trả 7 Ngày',
    desc: 'Cam kết 1 đổi 1 ngay lập tức nếu lỗi hoặc hư hại do vận chuyển',
  },
  {
    icon: Tag,
    title: 'Giá Tốt Tận Gốc',
    desc: 'Sỉ lẻ đồng giá ưu đãi, mua nhiều giảm sâu',
  },
];

const QUICK_TAGS = [
  { label: '🐭 Xịt đuổi chuột ARS', q: 'chuột' },
  { label: '🦎 Xịt thằn lằn & gián', q: 'gián' },
  { label: '🚽 Chai xịt tẩy Magiclean', q: 'tẩy' },
  { label: '🌸 Xịt thơm phòng sả chanh', q: 'sả chanh' },
  { label: '🧺 Nước giặt xả Hygiene', q: 'hygiene' },
];

interface CategoryProductSectionProps {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  index: number;
  onAddToCart: (product: Product, variant: ProductVariant) => void;
}

function CategoryProductSection({ category, index, onAddToCart }: CategoryProductSectionProps) {
  const [isVisible, setIsVisible] = useState(index < 2);
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible || !sectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '160px 0px' }
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
    }
  );

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -300 : 300,
      behavior: 'smooth',
    });
  };

  if (!isLoading && (!productsData?.products || productsData.products.length === 0)) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm space-y-6"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-700 uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            Danh Mục Tiêu Dùng Thái Lan
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {category.name}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Hàng chính hãng nhập khẩu nguyên chai từ Thái Lan, an toàn và hiệu quả vượt trội.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-slate-200 hover:border-teal-400 hover:bg-teal-50 text-teal-700 font-bold self-start md:self-auto"
        >
          <Link to={`/c/${category.slug}`}>
            Xem toàn bộ {category.name}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {isLoading && !productsData ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : null}

      {!isLoading && productsData?.products?.length ? (
        <>
          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5">
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
                onAddToCart={() =>
                  product.variants[0] && onAddToCart(product, product.variants[0])
                }
              />
            ))}
          </div>

          {/* Mobile Horizontal Scroll */}
          <div className="relative md:hidden">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-hide snap-x"
            >
              {productsData.products.map((product) => (
                <div key={product.id} className="w-[240px] shrink-0 snap-start">
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    images={product.images}
                    price={product.basePrice}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    onAddToCart={() =>
                      product.variants[0] && onAddToCart(product, product.variants[0])
                    }
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => scroll('left')}
              className="absolute left-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-md border border-slate-200"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-md border border-slate-200"
              aria-label="Scroll right"
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
  const { addItem } = useCart();
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories();
  const { data: curatedProducts, isLoading: isLoadingCuratedProducts } = useProducts({
    limit: 8,
    sortBy: 'best_selling',
  });

  const rootCategories = useMemo(
    () => categoriesData?.filter((c) => !c.parentId) ?? [],
    [categoriesData]
  );

  const handleAddToCart = (product: Product, variant: ProductVariant) => {
    addItem(product, variant, 1);
  };

  return (
    <>
      <SEO
        title="Thai Spray - Tổng Kho Hàng Tiêu Dùng & Chai Xịt Thái Lan Chính Hãng"
        description="Chuyên phân phối sỉ lẻ chai xịt đuổi chuột ARS, xịt gián kiến, nước tẩy rửa sinh học, nước xả vải và tinh dầu xịt phòng chính hãng Thái Lan. Giao nhanh toàn quốc."
      />

      <div className="container mx-auto px-4 py-6 space-y-10">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-7 md:p-12 text-white shadow-2xl">
          {/* Ambient Lighting Orbs */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Text Column */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/15 px-3.5 py-1.5 text-xs font-bold text-teal-300 backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                TỔNG KHO CHAI XỊT &amp; TIÊU DÙNG THÁI LAN
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl lg:text-[2.85rem] leading-[1.15]">
                  Giải Pháp Tiện Ích &amp; Làm Sạch Chuẩn{' '}
                  <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent">
                    Nội Địa Thái Lan
                  </span>
                </h1>
                <p className="max-w-xl text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                  Tổng hợp các dòng chai xịt đuổi chuột ARS, diệt côn trùng, xịt tẩy rửa đa năng, nước giặt xả và tinh dầu thơm phòng được tin dùng số 1 tại Thái Lan.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold px-7 py-6 text-sm shadow-xl shadow-teal-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Link to="/catalog">
                    Khám Phá Toàn Bộ Sản Phẩm
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-2xl border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-6 text-sm backdrop-blur-sm transition-all"
                >
                  <Link to="/catalog?sort=best_selling">🔥 Bán Chạy Nhất</Link>
                </Button>
              </div>

              {/* Quick Tags */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-teal-200/80 mb-2.5 uppercase tracking-wider">
                  Tìm kiếm phổ biến:
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TAGS.map((tag) => (
                    <Link
                      key={tag.q}
                      to={`/search?q=${encodeURIComponent(tag.q)}`}
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-teal-500/20 hover:border-teal-400/40 hover:text-teal-200 transition-all"
                    >
                      {tag.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Hero Image Column */}
            <div className="relative lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[420px]">
                <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-2xl backdrop-blur-md">
                  <img
                    src="/hero-spray.jpg"
                    alt="Bộ sưu tập chai xịt tiện ích Thái Lan chính hãng"
                    className="w-full h-auto object-cover transform transition-transform duration-700 hover:scale-105"
                    loading="eager"
                  />
                </div>

                {/* Floating Micro Card 1 */}
                <div className="absolute -top-3 -right-3 rounded-2xl bg-amber-500 text-slate-950 px-4 py-2.5 font-black text-xs shadow-xl shadow-amber-500/30 flex items-center gap-1.5 border border-amber-300 animate-bounce [animation-duration:3s]">
                  <Zap className="h-4 w-4 fill-slate-950" />
                  <span>GIẢM ĐẾN 45%</span>
                </div>

                {/* Floating Micro Card 2 */}
                <div className="absolute -bottom-3 -left-3 rounded-2xl bg-white text-slate-900 px-4 py-3 shadow-xl border border-slate-200 hidden sm:flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold">
                    ⭐
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">4.9 / 5.0 Đánh Giá</p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Hơn 5.000 khách hàng tin dùng
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 TRUST BADGES */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_BADGES.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-teal-300 transition-all duration-300"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <item.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* CURATED FLASH DEALS */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-600 uppercase tracking-wider mb-1">
                <Flame className="h-4 w-4 fill-rose-500 text-rose-500" />
                Sản phẩm nổi bật
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Top Sản Phẩm Bán Chạy Nhất
              </h2>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-teal-700 hover:text-teal-800 hover:bg-teal-50 font-bold"
            >
              <Link to="/catalog?sort=best_selling">
                Xem toàn bộ catalog
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoadingCuratedProducts && !curatedProducts ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
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
                  onAddToCart={() =>
                    product.variants[0] && handleAddToCart(product, product.variants[0])
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* CATEGORIES SECTIONS */}
        <div className="space-y-8">
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
