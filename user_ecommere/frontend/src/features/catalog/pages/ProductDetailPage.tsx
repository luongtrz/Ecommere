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
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Search className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Không tìm thấy sản phẩm</h1>
          <p className="text-sm text-slate-500">
            Sản phẩm bạn đang tìm kiếm có thể đã hết hàng hoặc ngừng phân phối.
          </p>
          <Button asChild className="rounded-xl bg-teal-600 hover:bg-teal-700 px-6 font-bold">
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

      <div className="min-h-screen pb-20">
        {/* Breadcrumb Bar */}
        <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden md:flex rounded-xl hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-medium"
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

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* LEFT COLUMN: Gallery */}
            <div className="lg:col-span-5 space-y-4">
              {/* Main Showcase Image */}
              <div className="aspect-square bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 relative group flex items-center justify-center">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-contain p-6 sm:p-8 transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {hasDiscount && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white shadow-md">
                      <Flame className="h-3.5 w-3.5 fill-white" />
                      {formatDiscount(originalPrice, finalPrice)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 text-teal-800 px-3 py-1 text-xs font-bold border border-teal-200/80 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                    Chính Hãng Thái Lan
                  </span>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 rounded-xl bg-slate-900/70 backdrop-blur-md px-3 py-1 text-xs font-bold text-white">
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
                      className={`aspect-square bg-white rounded-2xl overflow-hidden border p-1 transition-all duration-200 ${
                        selectedImage === index
                          ? 'border-teal-600 ring-2 ring-teal-500/30 shadow-md scale-105'
                          : 'border-slate-200 hover:border-teal-300 opacity-70 hover:opacity-100'
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
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-3 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                  <p className="text-[11px] font-bold text-slate-800">100% Nội Địa</p>
                  <p className="text-[10px] text-slate-500">Mã vạch chuẩn Thái</p>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
                  <PackageCheck className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                  <p className="text-[11px] font-bold text-slate-800">Chống Vỡ 3 Lớp</p>
                  <p className="text-[10px] text-slate-500">Đóng gói an toàn</p>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
                  <Truck className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                  <p className="text-[11px] font-bold text-slate-800">Giao Toàn Quốc</p>
                  <p className="text-[10px] text-slate-500">Freeship từ 250k</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Info, Pricing & Purchasing */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                {/* Category & Rating Row */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <Link
                    to={`/c/${product.category?.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 px-3 py-1 text-xs font-bold hover:bg-teal-100 transition-colors"
                  >
                    <Sparkles className="h-3 w-3 text-teal-600" />
                    {product.category?.name}
                  </Link>

                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-full">
                    <Rating value={product.rating || 5} size="sm" />
                    <span>{(product.rating || 5).toFixed(1)}</span>
                    <span className="text-slate-400 font-normal">
                      ({product.reviewCount || 38} đánh giá)
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    🔥 Đã bán hơn 1.200 chai
                  </span>
                </div>

                {/* Product Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">
                  {product.name}
                </h1>

                {/* Pricing Box */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5 space-y-2 mb-6">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-black text-teal-700 tracking-tight">
                      {formatCurrency(finalPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-lg text-slate-400 line-through font-medium">
                        {formatCurrency(originalPrice)}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="rounded-lg bg-rose-100 text-rose-700 px-2.5 py-1 text-xs font-extrabold">
                        Tiết kiệm {formatCurrency(discountSavings)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-semibold text-emerald-700">Còn hàng trong kho</span>
                    <span className="text-slate-300">|</span>
                    <span>Đồng kiểm tra hàng trước khi thanh toán COD</span>
                  </div>
                </div>

                {/* Variant Selector */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-2.5 block">
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
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold border transition-all duration-200 ${
                              isSelected
                                ? 'border-teal-600 bg-teal-50/80 text-teal-900 ring-2 ring-teal-500/20 shadow-sm'
                                : isOutOfStock
                                ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-slate-50'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-teal-600" />}
                            <span>{v.scent}</span>
                            {v.volumeMl ? <span className="text-slate-400 font-normal">({v.volumeMl}ml)</span> : null}
                            {isOutOfStock && <span className="text-rose-500 font-medium">(Hết hàng)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-2.5 block">
                      Số lượng mua:
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="h-9 w-9 rounded-lg hover:bg-slate-100 text-slate-700 active:scale-95"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-12 text-center font-black text-slate-900 text-sm">
                          {quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() =>
                            setQuantity(Math.min(selectedVariant?.stock ?? 999, quantity + 1))
                          }
                          className="h-9 w-9 rounded-lg hover:bg-slate-100 text-slate-700 active:scale-95"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <span className="text-xs text-slate-500 font-medium">
                        (Có sẵn {selectedVariant?.stock ?? 0} sản phẩm)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    size="lg"
                    className="flex-1 h-[3.25rem] rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm shadow-xl shadow-teal-600/25 transition-all hover:scale-[1.01] active:scale-[0.98]"
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {selectedVariant?.stock === 0 ? 'Tạm Hết Hàng' : 'Thêm Vào Giỏ Hàng'}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="h-[3.25rem] rounded-2xl border-teal-600 text-teal-700 hover:bg-teal-50 font-black text-sm transition-all"
                    onClick={handleBuyNow}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                  >
                    <Zap className="mr-2 h-4 w-4 fill-teal-600" />
                    Mua Ngay
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleWishlist}
                    aria-label={isWishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
                    className={`h-[3.25rem] w-[3.25rem] rounded-2xl border-slate-200 transition-all ${
                      isWishlisted
                        ? 'bg-rose-50 text-rose-500 border-rose-200 shadow-md shadow-rose-500/10'
                        : 'bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                  </Button>
                </div>

                {/* 4 Guarantee Badges Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Cam kết chính hãng</strong>: Nhập khẩu trực tiếp từ Thái Lan.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <RefreshCw className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Đổi trả 7 ngày</strong>: Miễn phí nếu sản phẩm vỡ hoặc lỗi tem.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Đồng kiểm tra hàng</strong>: Kiểm tra trước khi trả tiền COD.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Truck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Giao nhanh toàn quốc</strong>: Freeship đơn từ 250.000đ.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABS: Description, Usage Guide & Specs */}
              <div className="pt-6">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full justify-start h-auto p-1.5 bg-slate-100 rounded-2xl mb-6">
                    <TabsTrigger
                      value="description"
                      className="rounded-xl px-5 py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-sm transition-all"
                    >
                      <FileText className="h-4 w-4 mr-2 text-teal-600" />
                      Mô tả sản phẩm
                    </TabsTrigger>
                    <TabsTrigger
                      value="guide"
                      className="rounded-xl px-5 py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-sm transition-all"
                    >
                      <ShieldAlert className="h-4 w-4 mr-2 text-amber-500" />
                      Hướng dẫn &amp; An toàn
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-0">
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm space-y-4">
                      <h3 className="text-lg font-bold text-slate-900">Chi tiết sản phẩm</h3>
                      <div className="text-slate-700 whitespace-pre-line leading-relaxed text-sm">
                        {product.description}
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span><strong>Xuất xứ:</strong> Thái Lan (Thailand)</span>
                        <span><strong>Thương hiệu:</strong> Nội địa Thái</span>
                        <span><strong>Hạn sử dụng:</strong> 3 năm kể từ ngày sản xuất</span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="guide" className="mt-0">
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm space-y-4">
                      <h3 className="text-lg font-bold text-slate-900">
                        Hướng dẫn sử dụng &amp; Bảo quản an toàn
                      </h3>
                      <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                        <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100 flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-teal-950 block mb-0.5">Cách sử dụng hiệu quả:</strong>
                            Lắc đều trước khi xịt. Xịt trực tiếp vào khu vực cần xử lý (góc tường, gầm tủ, đường đi của côn trùng, bề mặt cần làm sạch) ở khoảng cách 20 - 30cm.
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-start gap-3">
                          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-amber-950 block mb-0.5">Lưu ý an toàn:</strong>
                            Để xa tầm tay trẻ em và thú cưng. Tránh xịt trực tiếp vào mắt, mũi hoặc thực phẩm. Rửa sạch tay với nước và xà phòng sau khi sử dụng.
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                          <PackageCheck className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-900 block mb-0.5">Bảo quản:</strong>
                            Nơi khô ráo thoáng mát, tránh ánh nắng trực tiếp và nguồn nhiệt cao trên 50°C. Đậy nắp kín sau mỗi lần sử dụng.
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
