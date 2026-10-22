import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useProductDetail } from '../hooks/useProductDetail';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Rating } from '@/components/common/Rating';
import { Button } from '@/components/ui/button';
import { useCart } from '@/features/cart/hooks/useCart';
import { useWishlist } from '@/features/catalog/hooks/useWishlist';
import { formatCurrency, formatDiscount } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import {
  ShoppingCart,
  Minus,
  Plus,
  Heart,
  Truck,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  Search,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Zap,
  PackageCheck,
  Flame,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ProductDetailPage() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const { data: product, isLoading } = useProductDetail(productSlug!);
  const { addItem, openCart } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    setSelectedVariantId('');
    setQuantity(1);
    setSelectedImage(0);
  }, [productSlug]);

  const selectedVariant =
    product?.variants.find((v) => v.id === selectedVariantId) ||
    product?.variants[0];
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      image: product.images[0],
      price: selectedVariant.salePrice ?? selectedVariant.price,
      quantity,
      scent: selectedVariant.scent,
      volumeMl: selectedVariant.volumeMl,
    });

    openCart();
    setQuantity(1);
  };

  const handleBuyNow = () => {
    if (!product || !selectedVariant) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      image: product.images[0],
      price: selectedVariant.salePrice ?? selectedVariant.price,
      quantity,
      scent: selectedVariant.scent,
      volumeMl: selectedVariant.volumeMl,
    });

    navigate('/cart');
  };

  const handleToggleWishlist = () => {
    if (!product) return;

    toggleItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      price: selectedVariant?.salePrice ?? selectedVariant?.price ?? 0,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="border-b border-slate-200 bg-white">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="h-8 w-32 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-5 w-48 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-6 space-y-4">
              <div className="aspect-square rounded-2xl bg-slate-100 border border-slate-200 animate-pulse flex items-center justify-center">
                <LoadingSpinner />
              </div>
              <div className="grid grid-cols-5 gap-3">
                <div className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
                <div className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
                <div className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
                <div className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
                <div className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-6 space-y-6">
              <div className="h-6 w-24 rounded-full bg-slate-100 animate-pulse" />
              <div className="h-10 w-3/4 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="space-y-3">
                <div className="h-5 w-32 rounded bg-slate-100 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-10 w-24 rounded-lg bg-slate-100 animate-pulse" />
                  <div className="h-10 w-24 rounded-lg bg-slate-100 animate-pulse" />
                </div>
              </div>
              <div className="h-14 rounded-lg bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Search className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Không tìm thấy sản phẩm
          </h1>
          <p className="text-sm text-slate-600">
            Sản phẩm bạn đang tìm kiếm có thể đã hết hàng hoặc ngừng phân phối.
          </p>
          <Button
            asChild
            className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-6 font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <Link to="/catalog">Quay lại danh mục sản phẩm</Link>
          </Button>
        </div>
      </div>
    );
  }

  const finalPrice = selectedVariant?.salePrice ?? selectedVariant?.price ?? 0;
  const originalPrice = selectedVariant?.price ?? 0;
  const hasDiscount =
    selectedVariant?.salePrice != null &&
    selectedVariant.salePrice < originalPrice;
  const discountSavings = originalPrice - finalPrice;

  return (
    <>
      <SEO
        title={`${product.name} - Thai Spray Chính Hãng Thái Lan`}
        description={product.description}
        image={getImageUrl(product.images[0])}
      />

      <div className="min-h-screen bg-slate-50 pb-28 md:pb-20">
        {/* Breadcrumb Bar */}
        <div className="border-b border-slate-200 bg-white">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden md:flex rounded-lg hover:bg-slate-50 hover:text-teal-600 text-slate-600 font-medium transition-colors"
            >
              <Link to={`/c/${product.category?.slug}`} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Về danh mục {product.category?.name}
              </Link>
            </Button>
            <Breadcrumb
              items={[
                { label: 'Trang chủ', href: '/' },
                { label: 'Sản phẩm', href: '/catalog' },
                {
                  label: product.category?.name || 'Danh mục',
                  href: `/c/${product.category?.slug}`,
                },
                { label: product.name },
              ]}
              className="text-xs sm:text-sm text-slate-600"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* LEFT COLUMN: Gallery */}
            <div className="lg:col-span-6 lg:sticky lg:top-24 self-start space-y-4">
              {/* Main Showcase Image */}
              <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative group flex items-center justify-center transition-all duration-200 hover:shadow-md">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-contain p-6 sm:p-10 transition-transform duration-300 ease-out group-hover:scale-105"
                />

                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {hasDiscount && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                      <Flame className="h-3.5 w-3.5 fill-current" />
                      {formatDiscount(originalPrice, finalPrice)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white/95 text-slate-700 px-2.5 py-1 text-xs font-medium border border-slate-200 shadow-sm backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                    Chính Hãng Thái Lan
                  </span>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 rounded-md bg-white/90 backdrop-blur-sm border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm tabular-nums">
                  {selectedImage + 1} / {product.images.length || 1}
                </div>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square bg-white rounded-xl overflow-hidden border p-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                        selectedImage === index
                          ? 'border-teal-600 ring-2 ring-teal-100 shadow-sm'
                          : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Micro-Row Under Gallery */}
              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <ShieldCheck className="h-5 w-5 text-teal-600 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-900">
                    100% Nội Địa
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Mã vạch chuẩn Thái
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <PackageCheck className="h-5 w-5 text-teal-600 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-900">
                    Chống Vỡ 3 Lớp
                  </p>
                  <p className="text-[11px] text-slate-500">Đóng gói an toàn</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <Truck className="h-5 w-5 text-teal-600 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-900">
                    Giao Toàn Quốc
                  </p>
                  <p className="text-[11px] text-slate-500">Freeship từ 250k</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Info, Pricing & Purchasing */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                {/* Category & Rating Row */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <Link
                    to={`/c/${product.category?.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 text-xs font-semibold hover:bg-teal-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <Sparkles className="h-3 w-3 text-teal-600" />
                    {product.category?.name}
                  </Link>

                  <div className="flex items-center gap-1.5 text-xs text-slate-900 font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                    <Rating value={product.rating || 5} size="sm" />
                    <span className="tabular-nums">
                      {(product.rating || 5).toFixed(1)}
                    </span>
                    <span className="text-slate-400 font-normal">
                      ({product.reviewCount || 38} đánh giá)
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    Đã bán hơn 1.200 chai
                  </span>
                </div>

                {/* Eyebrow */}
                <p className="uppercase tracking-wider text-[11px] font-semibold text-teal-600 mb-1">
                  {product.category?.name || 'Thai Spray'}
                </p>

                {/* Dominant Heading */}
                <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
                  {product.name}
                </h1>

                {/* Pricing Box */}
                <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3 mb-6 shadow-sm">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-bold text-rose-600 tracking-tight tabular-nums">
                      {formatCurrency(finalPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-base sm:text-lg text-slate-400 line-through font-medium tabular-nums">
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="rounded-md bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-1 text-xs font-bold">
                        Tiết kiệm {formatCurrency(discountSavings)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 flex-wrap">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        selectedVariant?.stock === 0
                          ? 'bg-rose-600'
                          : 'bg-emerald-600'
                      }`}
                    />
                    <span
                      className={`font-semibold ${
                        selectedVariant?.stock === 0
                          ? 'text-rose-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {selectedVariant?.stock === 0
                        ? 'Hết hàng'
                        : 'Còn hàng trong kho'}
                    </span>
                    <span className="text-slate-200">|</span>
                    <span className="text-slate-600">
                      Đồng kiểm tra hàng trước khi thanh toán COD
                    </span>
                  </div>
                </div>

                {/* Variant Selector */}
                <div className="space-y-5 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2.5">
                      Chọn phân loại / Dung tích:
                    </label>
                    <div
                      id="product-variants"
                      className="flex flex-wrap gap-2.5"
                    >
                      {product.variants.map((v) => {
                        const isSelected = selectedVariant?.id === v.id;
                        const isOutOfStock = v.stock === 0;

                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-medium border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                              isSelected
                                ? 'border-teal-600 bg-teal-50 text-teal-700 font-semibold shadow-sm'
                                : isOutOfStock
                                  ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed line-through'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-teal-600" />
                            )}
                            <span>{v.scent}</span>
                            {v.volumeMl ? (
                              <span
                                className={
                                  isSelected
                                    ? 'text-teal-700 font-normal'
                                    : 'text-slate-400 font-normal'
                                }
                              >
                                ({v.volumeMl}ml)
                              </span>
                            ) : null}
                            {isOutOfStock && (
                              <span className="text-rose-600 font-semibold">
                                (Hết hàng)
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2.5">
                      Số lượng mua:
                    </label>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          disabled={
                            !selectedVariant ||
                            selectedVariant.stock === 0 ||
                            quantity <= 1
                          }
                          onClick={() =>
                            setQuantity((prev) => Math.max(1, prev - 1))
                          }
                          className="h-9 w-9 rounded-l-lg rounded-r-none hover:bg-slate-50 text-slate-700 focus-visible:ring-2 focus-visible:ring-teal-500"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-12 text-center font-bold text-slate-900 text-sm tabular-nums">
                          {quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          disabled={
                            !selectedVariant ||
                            selectedVariant.stock === 0 ||
                            quantity >= (selectedVariant?.stock ?? 1)
                          }
                          onClick={() =>
                            setQuantity((prev) =>
                              Math.min(selectedVariant?.stock ?? 1, prev + 1),
                            )
                          }
                          className="h-9 w-9 rounded-r-lg rounded-l-none hover:bg-slate-50 text-slate-700 focus-visible:ring-2 focus-visible:ring-teal-500"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {selectedVariant?.stock === 0 ? (
                        <span className="text-xs text-rose-600 font-semibold">
                          (Hết hàng)
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">
                          (Có sẵn {selectedVariant?.stock ?? 0} sản phẩm)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    size="lg"
                    className="flex-1 h-12 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-teal-500"
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {selectedVariant?.stock === 0
                      ? 'Tạm Hết Hàng'
                      : 'Thêm Vào Giỏ Hàng'}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-lg border border-teal-600 bg-white text-teal-700 hover:bg-teal-50 font-semibold text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-teal-500"
                    onClick={handleBuyNow}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                  >
                    <Zap className="mr-2 h-4 w-4 text-teal-600 fill-teal-100" />
                    Mua Ngay
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleWishlist}
                    aria-label={
                      isWishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'
                    }
                    className={`h-12 w-12 rounded-lg border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      isWishlisted
                        ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                    }`}
                  >
                    <Heart
                      className={`h-5 w-5 ${isWishlisted ? 'fill-rose-600' : ''}`}
                    />
                  </Button>
                </div>

                {/* 4 Guarantee Badges Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-900">
                          Cam kết chính hãng
                        </strong>
                        : Nhập khẩu trực tiếp từ Thái Lan.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <RefreshCw className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-900">
                          Đổi trả 7 ngày
                        </strong>
                        : Miễn phí nếu sản phẩm vỡ hoặc lỗi tem.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-900">
                          Đồng kiểm tra hàng
                        </strong>
                        : Kiểm tra trước khi trả tiền COD.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Truck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-900">
                          Giao nhanh toàn quốc
                        </strong>
                        : Freeship đơn từ 250.000đ.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABS: Description, Usage Guide & Reviews */}
              <div className="pt-6">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full justify-start h-auto p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
                    <TabsTrigger
                      value="description"
                      className="rounded-lg px-4 py-2 font-semibold text-xs sm:text-sm text-slate-600 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      <FileText className="h-4 w-4 mr-2 text-teal-600" />
                      Mô tả sản phẩm
                    </TabsTrigger>
                    <TabsTrigger
                      value="guide"
                      className="rounded-lg px-4 py-2 font-semibold text-xs sm:text-sm text-slate-600 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      <ShieldAlert className="h-4 w-4 mr-2 text-teal-600" />
                      Hướng dẫn &amp; An toàn
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="rounded-lg px-4 py-2 font-semibold text-xs sm:text-sm text-slate-600 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-teal-600" />
                      Đánh giá ({product.reviewCount || 38})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-0">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
                      <h3 className="font-sans text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                        Chi tiết sản phẩm
                      </h3>
                      <div className="text-slate-600 whitespace-pre-line leading-relaxed text-sm">
                        {product.description}
                      </div>
                      <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>
                          <strong className="text-slate-900">Xuất xứ:</strong>{' '}
                          Thái Lan (Thailand)
                        </span>
                        <span>
                          <strong className="text-slate-900">
                            Thương hiệu:
                          </strong>{' '}
                          Nội địa Thái
                        </span>
                        <span>
                          <strong className="text-slate-900">
                            Hạn sử dụng:
                          </strong>{' '}
                          3 năm kể từ ngày sản xuất
                        </span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="guide" className="mt-0">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
                      <h3 className="font-sans text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                        Hướng dẫn sử dụng &amp; Bảo quản an toàn
                      </h3>
                      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-900 block mb-0.5">
                              Cách sử dụng hiệu quả:
                            </strong>
                            Lắc đều trước khi xịt. Xịt trực tiếp vào khu vực cần
                            xử lý (góc tường, gầm tủ, đường đi của côn trùng, bề
                            mặt cần làm sạch) ở khoảng cách 20 - 30cm.
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-900 block mb-0.5">
                              Lưu ý an toàn:
                            </strong>
                            Để xa tầm tay trẻ em và thú cưng. Tránh xịt trực
                            tiếp vào mắt, mũi hoặc thực phẩm. Rửa sạch tay với
                            nước và xà phòng sau khi sử dụng.
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                          <PackageCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-900 block mb-0.5">
                              Bảo quản:
                            </strong>
                            Nơi khô ráo thoáng mát, tránh ánh nắng trực tiếp và
                            nguồn nhiệt cao trên 50°C. Đậy nắp kín sau mỗi lần
                            sử dụng.
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-0">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                        <div>
                          <h3 className="font-sans text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                            Đánh giá từ khách hàng
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Tổng quan phản hồi dựa trên{' '}
                            {product.reviewCount || 38} đánh giá thực tế
                          </p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200 self-start sm:self-auto">
                          <span className="text-3xl font-bold text-slate-900 tabular-nums">
                            {(product.rating || 5).toFixed(1)}
                          </span>
                          <div>
                            <Rating value={product.rating || 5} size="sm" />
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              5/5 sao chuẩn chỉnh
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Breakdown bars */}
                      <div className="space-y-2 text-xs">
                        {[
                          { stars: '5 sao', percent: '88%' },
                          { stars: '4 sao', percent: '10%' },
                          { stars: '3 sao', percent: '2%' },
                          { stars: '2 sao', percent: '0%' },
                          { stars: '1 sao', percent: '0%' },
                        ].map((item) => (
                          <div
                            key={item.stars}
                            className="flex items-center gap-3"
                          >
                            <span className="w-12 text-slate-600 font-medium">
                              {item.stars}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-400"
                                style={{ width: item.percent }}
                              />
                            </div>
                            <span className="w-8 text-right text-slate-500 tabular-nums">
                              {item.percent}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0" />
                        <p className="text-xs text-slate-600 font-medium">
                          100% đánh giá xác thực từ khách hàng đã mua và sử dụng
                          sản phẩm chính hãng tại Thai Spray.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Add to Cart Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md md:hidden shadow-sm">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-500">
                {product.name}
              </p>
              <p className="text-base font-bold text-rose-600 tabular-nums">
                {formatCurrency(finalPrice)}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-10 rounded-lg border border-teal-600 bg-white text-teal-700 font-semibold px-4 hover:bg-teal-50"
              onClick={handleBuyNow}
              disabled={!selectedVariant || selectedVariant.stock === 0}
            >
              Mua Ngay
            </Button>
            <Button
              size="sm"
              className="h-10 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 shadow-sm"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0}
            >
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
              {selectedVariant?.stock === 0
                ? 'Tạm Hết Hàng'
                : 'Thêm Vào Giỏ Hàng'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
