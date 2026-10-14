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
    product?.variants.find((v) => v.id === selectedVariantId) || product?.variants[0];
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
      <div className="min-h-screen pb-20">
        <div className="border-b border-border bg-card/60 backdrop-blur-md">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
            <div className="h-5 w-48 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-6 space-y-4">
              <div className="aspect-square rounded-[1.8rem] bg-muted animate-pulse flex items-center justify-center">
                <LoadingSpinner />
              </div>
              <div className="grid grid-cols-5 gap-3">
                <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
                <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
                <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
                <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
                <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-6 space-y-6">
              <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
              <div className="h-10 w-3/4 rounded-xl bg-muted animate-pulse" />
              <div className="h-28 rounded-[1.8rem] bg-muted animate-pulse" />
              <div className="space-y-3">
                <div className="h-5 w-32 rounded bg-muted animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-10 w-24 rounded-full bg-muted animate-pulse" />
                  <div className="h-10 w-24 rounded-full bg-muted animate-pulse" />
                </div>
              </div>
              <div className="h-14 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-20 h-20 bg-secondary/80 rounded-2xl flex items-center justify-center mx-auto text-muted-foreground border border-black/[0.03]">
            <Search className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Không tìm thấy sản phẩm</h1>
          <p className="text-sm text-muted-foreground">
            Sản phẩm bạn đang tìm kiếm có thể đã hết hàng hoặc ngừng phân phối.
          </p>
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 font-semibold shadow-luxury">
            <Link to="/catalog">Quay lại danh mục sản phẩm</Link>
          </Button>
        </div>
      </div>
    );
  }

  const finalPrice = selectedVariant?.salePrice ?? selectedVariant?.price ?? 0;
  const originalPrice = selectedVariant?.price ?? 0;
  const hasDiscount =
    selectedVariant?.salePrice != null && selectedVariant.salePrice < originalPrice;
  const discountSavings = originalPrice - finalPrice;

  return (
    <>
      <SEO
        title={`${product.name} - Thai Spray Chính Hãng Thái Lan`}
        description={product.description}
        image={getImageUrl(product.images[0])}
      />

      <div className="min-h-screen pb-28 md:pb-20">
        {/* Breadcrumb Bar */}
        <div className="border-b border-border bg-card/70 backdrop-blur-md">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden md:flex rounded-full hover:bg-accent/20 hover:text-accent-foreground text-muted-foreground font-medium transition-colors"
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
                { label: product.category?.name || 'Danh mục', href: `/c/${product.category?.slug}` },
                { label: product.name },
              ]}
              className="text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* LEFT COLUMN: Gallery */}
            <div className="lg:col-span-6 lg:sticky lg:top-24 self-start space-y-4">
              {/* Main Showcase Image */}
              <div className="aspect-square bg-card rounded-[1.8rem] overflow-hidden shadow-luxury border border-black/[0.03] relative group flex items-center justify-center transition-all duration-300">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-contain p-6 sm:p-10 transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {hasDiscount && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground shadow-sm">
                      <Flame className="h-3.5 w-3.5 fill-current" />
                      {formatDiscount(originalPrice, finalPrice)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 text-foreground px-3 py-1 text-xs font-medium border border-border/80 backdrop-blur-md shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Chính Hãng Thái Lan
                  </span>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 rounded-full bg-card/90 backdrop-blur-md border border-border/60 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
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
                      className={`aspect-square bg-card rounded-2xl overflow-hidden border p-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        selectedImage === index
                          ? 'border-primary ring-2 ring-primary/20 shadow-luxury scale-[1.02]'
                          : 'border-border/60 opacity-70 hover:opacity-100 hover:border-accent hover:scale-[1.01]'
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
                <div className="p-3.5 rounded-2xl bg-card border border-black/[0.03] shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                  <ShieldCheck className="h-5 w-5 text-accent-foreground mx-auto mb-1.5" />
                  <p className="text-[11px] font-bold text-foreground">100% Nội Địa</p>
                  <p className="text-[10px] text-muted-foreground">Mã vạch chuẩn Thái</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-card border border-black/[0.03] shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                  <PackageCheck className="h-5 w-5 text-accent-foreground mx-auto mb-1.5" />
                  <p className="text-[11px] font-bold text-foreground">Chống Vỡ 3 Lớp</p>
                  <p className="text-[10px] text-muted-foreground">Đóng gói an toàn</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-card border border-black/[0.03] shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                  <Truck className="h-5 w-5 text-accent-foreground mx-auto mb-1.5" />
                  <p className="text-[11px] font-bold text-foreground">Giao Toàn Quốc</p>
                  <p className="text-[10px] text-muted-foreground">Freeship từ 250k</p>
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 text-accent-foreground border border-accent/30 px-3 py-1 text-xs font-semibold hover:bg-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Sparkles className="h-3 w-3 text-accent-foreground" />
                    {product.category?.name}
                  </Link>

                  <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold bg-secondary/80 border border-border px-2.5 py-1 rounded-full">
                    <Rating value={product.rating || 5} size="sm" />
                    <span>{(product.rating || 5).toFixed(1)}</span>
                    <span className="text-muted-foreground font-normal">
                      ({product.reviewCount || 38} đánh giá)
                    </span>
                  </div>

                  <span className="text-xs text-muted-foreground font-medium">
                    Đã bán hơn 1.200 chai
                  </span>
                </div>

                {/* Eyebrow */}
                <p className="uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground mb-1">
                  {product.category?.name || 'Thai Spray'}
                </p>

                {/* Dominant Heading */}
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight leading-[1.15] mb-6">
                  {product.name}
                </h1>

                {/* Pricing Box */}
                <div className="rounded-[1.8rem] bg-card border border-black/[0.03] p-6 space-y-3 mb-6 shadow-luxury">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-serif font-bold text-foreground tracking-tight">
                      {formatCurrency(finalPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-lg text-muted-foreground line-through font-medium">
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1 text-xs font-bold">
                        Tiết kiệm {formatCurrency(discountSavings)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground flex-wrap">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        selectedVariant?.stock === 0 ? 'bg-destructive' : 'bg-emerald-600 animate-pulse'
                      }`}
                    />
                    <span
                      className={`font-semibold ${
                        selectedVariant?.stock === 0 ? 'text-destructive' : 'text-foreground'
                      }`}
                    >
                      {selectedVariant?.stock === 0 ? 'Hết hàng' : 'Còn hàng trong kho'}
                    </span>
                    <span className="text-border">|</span>
                    <span>Đồng kiểm tra hàng trước khi thanh toán COD</span>
                  </div>
                </div>

                {/* Variant Selector */}
                <div className="space-y-5 mb-6">
                  <div>
                    <label className="block uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground mb-2.5">
                      Chọn phân loại / Dung tích:
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {product.variants.map((v) => {
                        const isSelected = selectedVariant?.id === v.id;
                        const isOutOfStock = v.stock === 0;

                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                                : isOutOfStock
                                ? 'border-border bg-muted/50 text-muted-foreground/40 cursor-not-allowed line-through'
                                : 'border-border bg-card text-foreground hover:border-accent hover:bg-secondary/40'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                            <span>{v.scent}</span>
                            {v.volumeMl ? (
                              <span
                                className={
                                  isSelected
                                    ? 'text-primary-foreground/80 font-normal'
                                    : 'text-muted-foreground font-normal'
                                }
                              >
                                ({v.volumeMl}ml)
                              </span>
                            ) : null}
                            {isOutOfStock && (
                              <span className="text-destructive font-semibold">(Hết hàng)</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div>
                    <label className="block uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground mb-2.5">
                      Số lượng mua:
                    </label>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          disabled={!selectedVariant || selectedVariant.stock === 0 || quantity <= 1}
                          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                          className="h-9 w-9 rounded-full hover:bg-secondary text-foreground active:scale-95 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-12 text-center font-bold text-foreground text-sm tabular-nums">
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
                              Math.min(selectedVariant?.stock ?? 1, prev + 1)
                            )
                          }
                          className="h-9 w-9 rounded-full hover:bg-secondary text-foreground active:scale-95 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {selectedVariant?.stock === 0 ? (
                        <span className="text-xs text-destructive font-semibold">
                          (Hết hàng)
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">
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
                    className="flex-1 h-[3.25rem] rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-luxury transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {selectedVariant?.stock === 0 ? 'Tạm Hết Hàng' : 'Thêm Vào Giỏ Hàng'}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="h-[3.25rem] rounded-full border-primary/30 text-foreground hover:bg-secondary font-bold text-sm transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={handleBuyNow}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                  >
                    <Zap className="mr-2 h-4 w-4 fill-primary/30 text-primary" />
                    Mua Ngay
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleWishlist}
                    aria-label={isWishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
                    className={`h-[3.25rem] w-[3.25rem] rounded-full border-border transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring ${
                      isWishlisted
                        ? 'bg-destructive/10 text-destructive border-destructive/30 shadow-sm'
                        : 'bg-card text-muted-foreground hover:text-destructive hover:border-destructive/30'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-destructive' : ''}`} />
                  </Button>
                </div>

                {/* 4 Guarantee Badges Card */}
                <div className="rounded-[1.8rem] border border-black/[0.03] bg-card p-5 shadow-luxury mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">Cam kết chính hãng</strong>: Nhập khẩu trực tiếp từ Thái Lan.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <RefreshCw className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">Đổi trả 7 ngày</strong>: Miễn phí nếu sản phẩm vỡ hoặc lỗi tem.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">Đồng kiểm tra hàng</strong>: Kiểm tra trước khi trả tiền COD.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Truck className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">Giao nhanh toàn quốc</strong>: Freeship đơn từ 250.000đ.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABS: Description, Usage Guide & Reviews */}
              <div className="pt-6">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full justify-start h-auto p-1.5 bg-secondary/80 rounded-full mb-6 border border-border/60">
                    <TabsTrigger
                      value="description"
                      className="rounded-full px-5 py-2.5 font-semibold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <FileText className="h-4 w-4 mr-2 text-accent-foreground" />
                      Mô tả sản phẩm
                    </TabsTrigger>
                    <TabsTrigger
                      value="guide"
                      className="rounded-full px-5 py-2.5 font-semibold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ShieldAlert className="h-4 w-4 mr-2 text-accent-foreground" />
                      Hướng dẫn &amp; An toàn
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="rounded-full px-5 py-2.5 font-semibold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-accent-foreground" />
                      Đánh giá ({product.reviewCount || 38})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-0">
                    <div className="rounded-[1.8rem] border border-black/[0.03] bg-card p-6 md:p-8 shadow-luxury space-y-4">
                      <h3 className="font-serif text-xl font-bold text-foreground">Chi tiết sản phẩm</h3>
                      <div className="text-foreground/90 whitespace-pre-line leading-relaxed text-sm">
                        {product.description}
                      </div>
                      <div className="pt-4 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span><strong className="text-foreground">Xuất xứ:</strong> Thái Lan (Thailand)</span>
                        <span><strong className="text-foreground">Thương hiệu:</strong> Nội địa Thái</span>
                        <span><strong className="text-foreground">Hạn sử dụng:</strong> 3 năm kể từ ngày sản xuất</span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="guide" className="mt-0">
                    <div className="rounded-[1.8rem] border border-black/[0.03] bg-card p-6 md:p-8 shadow-luxury space-y-4">
                      <h3 className="font-serif text-xl font-bold text-foreground">
                        Hướng dẫn sử dụng &amp; Bảo quản an toàn
                      </h3>
                      <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                        <div className="p-4 rounded-2xl bg-secondary/60 border border-border flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-foreground block mb-0.5">Cách sử dụng hiệu quả:</strong>
                            Lắc đều trước khi xịt. Xịt trực tiếp vào khu vực cần xử lý (góc tường, gầm tủ, đường đi của côn trùng, bề mặt cần làm sạch) ở khoảng cách 20 - 30cm.
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-secondary/60 border border-border flex items-start gap-3">
                          <ShieldAlert className="h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-foreground block mb-0.5">Lưu ý an toàn:</strong>
                            Để xa tầm tay trẻ em và thú cưng. Tránh xịt trực tiếp vào mắt, mũi hoặc thực phẩm. Rửa sạch tay với nước và xà phòng sau khi sử dụng.
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-secondary/60 border border-border flex items-start gap-3">
                          <PackageCheck className="h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-foreground block mb-0.5">Bảo quản:</strong>
                            Nơi khô ráo thoáng mát, tránh ánh nắng trực tiếp và nguồn nhiệt cao trên 50°C. Đậy nắp kín sau mỗi lần sử dụng.
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-0">
                    <div className="rounded-[1.8rem] border border-black/[0.03] bg-card p-6 md:p-8 shadow-luxury space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
                        <div>
                          <h3 className="font-serif text-xl font-bold text-foreground">
                            Đánh giá từ khách hàng
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Tổng quan phản hồi dựa trên {product.reviewCount || 38} đánh giá thực tế
                          </p>
                        </div>
                        <div className="flex items-center gap-3 bg-secondary/50 rounded-2xl p-3 border border-border self-start sm:self-auto">
                          <span className="text-3xl font-serif font-bold text-foreground">
                            {(product.rating || 5).toFixed(1)}
                          </span>
                          <div>
                            <Rating value={product.rating || 5} size="sm" />
                            <p className="text-[11px] text-muted-foreground mt-0.5">5/5 sao chuẩn chỉnh</p>
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
                          <div key={item.stars} className="flex items-center gap-3">
                            <span className="w-12 text-muted-foreground font-medium">{item.stars}</span>
                            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: item.percent }}
                              />
                            </div>
                            <span className="w-8 text-right text-muted-foreground tabular-nums">
                              {item.percent}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-accent-foreground shrink-0" />
                        <p className="text-xs text-foreground font-medium">
                          100% đánh giá xác thực từ khách hàng đã mua và sử dụng sản phẩm chính hãng tại Thai Spray.
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
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur-md md:hidden shadow-luxury">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">{product.name}</p>
              <p className="text-base font-bold text-foreground">{formatCurrency(finalPrice)}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-10 rounded-full border-primary/30 text-foreground font-semibold px-4"
              onClick={handleBuyNow}
              disabled={!selectedVariant || selectedVariant.stock === 0}
            >
              Mua Ngay
            </Button>
            <Button
              size="sm"
              className="h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 shadow-sm"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0}
            >
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
              {selectedVariant?.stock === 0 ? 'Tạm Hết Hàng' : 'Thêm Vào Giỏ Hàng'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
