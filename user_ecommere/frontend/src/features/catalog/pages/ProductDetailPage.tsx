import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useProductDetail } from '../hooks/useProductDetail';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Rating } from '@/components/common/Rating';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  PackageCheck,
} from 'lucide-react';

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
    (selectedVariantId
      ? product?.variants.find((v) => v.id === selectedVariantId)
      : undefined) ||
    product?.variants.find((v) => v.stock > 0) ||
    product?.variants[0];
  const isWishlisted = product ? isInWishlist(product.id) : false;
  const isSelectedVariantOutOfStock = !selectedVariant || selectedVariant.stock === 0;

  const handleAddToCart = () => {
    if (!product || !selectedVariant || selectedVariant.stock === 0) return;

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
    if (!product || !selectedVariant || selectedVariant.stock === 0) return;

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Search className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground">
            Không tìm thấy sản phẩm
          </h1>
          <p className="text-sm text-muted-foreground max-w-[65ch]">
            Sản phẩm bạn đang tìm kiếm có thể đã hết hàng hoặc ngừng phân phối.
          </p>
          <Button asChild size="lg" className="min-h-11">
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

      <div className="min-h-screen bg-background pb-20 sm:pb-16">
        {/* Breadcrumb Bar */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
            >
              <Link to={`/c/${product.category?.slug}`} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Về danh mục {product.category?.name}
              </Link>
            </Button>
            <Breadcrumb
              items={[
                { label: 'Sản phẩm', href: '/catalog' },
                { label: product.category?.name || 'Danh mục', href: `/c/${product.category?.slug}` },
                { label: product.name },
              ]}
              className="text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 section-y">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-start">
            {/* LEFT COLUMN: Gallery */}
            <div className="space-y-4">
              {/* Main Showcase Image */}
              <div className="aspect-[4/5] rounded-lg bg-muted overflow-hidden border border-border relative flex items-center justify-center">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                  {hasDiscount && (
                    <Badge variant="destructive" className="rounded-sm font-semibold text-xs">
                      {formatDiscount(originalPrice, finalPrice)}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="rounded-sm text-xs font-medium border border-border bg-card/90"
                  >
                    Chính Hãng Thái Lan
                  </Badge>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-3 right-3 rounded-sm bg-card/90 text-foreground border border-border px-2 py-0.5 text-xs tabular font-medium">
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
                      aria-label={`Xem ảnh ${index + 1}`}
                      className={`aspect-square min-h-11 min-w-11 bg-muted rounded-md overflow-hidden border p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        selectedImage === index
                          ? 'border-primary ring-2 ring-primary'
                          : 'border-border hover:border-foreground/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover rounded-sm"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Info, Pricing & Purchasing */}
            <div className="lg:sticky lg:top-28 self-start space-y-6">
              <div>
                {/* Category link (eyebrow) */}
                <div className="mb-2">
                  <Link
                    to={`/c/${product.category?.slug}`}
                    className="eyebrow normal-case tracking-normal hover:text-foreground transition-colors inline-block text-muted-foreground"
                  >
                    {product.category?.name}
                  </Link>
                </div>

                {/* Product Title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-snug text-balance mb-3">
                  {product.name}
                </h1>

                {/* Rating Row */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mb-4">
                  <div className="flex items-center gap-1.5">
                    <Rating value={product.rating || 5} size="sm" />
                    <span className="font-semibold text-foreground tabular">
                      {(product.rating || 5).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      ({product.reviewCount || 38} đánh giá)
                    </span>
                  </div>
                  <span className="hidden sm:inline text-border" aria-hidden="true">|</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    🔥 Đã bán hơn 1.200 chai
                  </span>
                </div>

                {/* Pricing Box */}
                <div className="border-y border-border py-4 space-y-2 mb-6">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-2xl font-semibold tabular text-foreground">
                      {formatCurrency(finalPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-base text-muted-foreground line-through tabular">
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                    {hasDiscount && (
                      <Badge variant="success" className="rounded-sm text-xs font-medium tabular">
                        Tiết kiệm {formatCurrency(discountSavings)}
                      </Badge>
                    )}
                  </div>

                  {isSelectedVariantOutOfStock ? (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground pt-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-destructive shrink-0 mt-1.5" />
                      <span className="font-medium text-destructive">Hết hàng</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground pt-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-success shrink-0 mt-1.5" />
                      <span className="font-medium text-foreground">Còn hàng trong kho</span>
                      <span>•</span>
                      <span>Đồng kiểm tra hàng trước khi thanh toán COD</span>
                    </div>
                  )}
                </div>

                {/* Short Description */}
                {product.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[65ch] line-clamp-3 mb-6">
                    {product.description}
                  </p>
                )}

                {/* Variant Selector */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2.5 block">
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
                            className={`inline-flex items-center gap-2 rounded-md border min-h-11 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              isOutOfStock
                                ? isSelected
                                  ? 'border-dashed border-border bg-muted/40 text-muted-foreground opacity-60 cursor-not-allowed'
                                  : 'border-border text-muted-foreground line-through opacity-50 cursor-not-allowed'
                                : isSelected
                                ? 'border-primary bg-secondary text-foreground'
                                : 'border-border bg-card text-foreground hover:border-foreground/30'
                            }`}
                          >
                            {isSelected && !isOutOfStock && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            )}
                            <span>{v.scent}</span>
                            {v.volumeMl ? (
                              <span className="text-muted-foreground font-normal">
                                ({v.volumeMl}ml)
                              </span>
                            ) : null}
                            {isOutOfStock && (
                              <span className="text-destructive font-normal ml-1">
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
                    <label className="text-sm font-medium text-foreground mb-2.5 block">
                      Số lượng mua:
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="inline-flex items-center rounded-md border border-border bg-card">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1 || isSelectedVariantOutOfStock}
                          aria-label="Giảm số lượng"
                          className="h-11 w-11 flex items-center justify-center text-foreground hover:bg-muted transition-colors rounded-l-md disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center font-semibold text-foreground text-sm tabular">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(
                              Math.min(selectedVariant?.stock ?? 0, quantity + 1)
                            )
                          }
                          disabled={
                            isSelectedVariantOutOfStock ||
                            quantity >= (selectedVariant?.stock ?? 0)
                          }
                          aria-label="Tăng số lượng"
                          className="h-11 w-11 flex items-center justify-center text-foreground hover:bg-muted transition-colors rounded-r-md disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <span className="text-sm text-muted-foreground">
                        (Có sẵn {selectedVariant?.stock ?? 0} sản phẩm)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Button
                      size="lg"
                      className="flex-1 min-h-11"
                      onClick={handleAddToCart}
                      disabled={isSelectedVariantOutOfStock}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {isSelectedVariantOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      onClick={handleToggleWishlist}
                      aria-label={isWishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          isWishlisted ? 'fill-destructive text-destructive' : 'text-foreground'
                        }`}
                      />
                    </Button>
                  </div>

                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full min-h-11"
                    onClick={handleBuyNow}
                    disabled={isSelectedVariantOutOfStock}
                  >
                    Mua ngay
                  </Button>
                </div>

                {/* Plain List of Trust Points Separated by Hairlines */}
                <div className="border-t border-border pt-6 mt-6">
                  <div className="divide-y divide-border text-sm text-muted-foreground">
                    <div className="flex items-start gap-3 py-3 first:pt-0">
                      <ShieldCheck className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground font-medium">Cam kết chính hãng</strong>: Nhập khẩu trực tiếp từ Thái Lan.
                      </span>
                    </div>
                    <div className="flex items-start gap-3 py-3">
                      <RefreshCw className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground font-medium">Đổi trả 7 ngày</strong>: Miễn phí nếu sản phẩm vỡ hoặc lỗi tem.
                      </span>
                    </div>
                    <div className="flex items-start gap-3 py-3">
                      <CheckCircle2 className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground font-medium">Đồng kiểm tra hàng</strong>: Kiểm tra trước khi trả tiền COD.
                      </span>
                    </div>
                    <div className="flex items-start gap-3 py-3 last:pb-0">
                      <Truck className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground font-medium">Giao nhanh toàn quốc</strong>: Freeship đơn từ 250.000đ.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DETAILS TABS (gold underline) */}
          <div className="mt-16 md:mt-24 pt-12 border-t border-border">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none gap-8">
                <TabsTrigger
                  value="description"
                  className="min-h-11 rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground pb-3 font-medium text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Mô tả sản phẩm
                </TabsTrigger>
                <TabsTrigger
                  value="guide"
                  className="min-h-11 rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground pb-3 font-medium text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Hướng dẫn &amp; An toàn
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-8">
                <div className="surface p-6 md:p-8 space-y-6">
                  <h2 className="text-xl sm:text-2xl font-semibold leading-snug text-foreground">Chi tiết sản phẩm</h2>
                  <div className="text-foreground/90 whitespace-pre-line leading-relaxed text-sm max-w-[65ch]">
                    {product.description}
                  </div>
                  <div className="pt-4 border-t border-border divide-y divide-border text-sm max-w-xl">
                    <div className="py-2.5 first:pt-0 grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] gap-4 items-center">
                      <span className="text-muted-foreground">Xuất xứ:</span>
                      <span className="font-medium text-foreground">Thái Lan (Thailand)</span>
                    </div>
                    <div className="py-2.5 grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] gap-4 items-center">
                      <span className="text-muted-foreground">Thương hiệu:</span>
                      <span className="font-medium text-foreground">Nội địa Thái</span>
                    </div>
                    <div className="py-2.5 last:pb-0 grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] gap-4 items-center">
                      <span className="text-muted-foreground">Hạn sử dụng:</span>
                      <span className="font-medium text-foreground">3 năm kể từ ngày sản xuất</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="guide" className="mt-8">
                <div className="surface p-6 md:p-8 space-y-6">
                  <h2 className="text-xl sm:text-2xl font-semibold leading-snug text-foreground">
                    Hướng dẫn sử dụng &amp; Bảo quản an toàn
                  </h2>
                  <div className="divide-y divide-border text-sm leading-relaxed">
                    <div className="py-4 first:pt-0 flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block mb-1 font-medium">
                          Cách sử dụng hiệu quả:
                        </strong>
                        <span className="text-muted-foreground">
                          Lắc đều trước khi xịt. Xịt trực tiếp vào khu vực cần xử lý (góc tường, gầm tủ, đường đi của côn trùng, bề mặt cần làm sạch) ở khoảng cách 20 - 30cm.
                        </span>
                      </div>
                    </div>

                    <div className="py-4 flex items-start gap-3">
                      <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block mb-1 font-medium">
                          Lưu ý an toàn:
                        </strong>
                        <span className="text-muted-foreground">
                          Để xa tầm tay trẻ em và thú cưng. Tránh xịt trực tiếp vào mắt, mũi hoặc thực phẩm. Rửa sạch tay với nước và xà phòng sau khi sử dụng.
                        </span>
                      </div>
                    </div>

                    <div className="py-4 last:pb-0 flex items-start gap-3">
                      <PackageCheck className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground block mb-1 font-medium">
                          Bảo quản:
                        </strong>
                        <span className="text-muted-foreground">
                          Nơi khô ráo thoáng mát, tránh ánh nắng trực tiếp và nguồn nhiệt cao trên 50°C. Đậy nắp kín sau mỗi lần sử dụng.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
