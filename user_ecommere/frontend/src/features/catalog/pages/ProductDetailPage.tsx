import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useProductDetail } from '../hooks/useProductDetail';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Rating } from '@/components/common/Rating';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useCart } from '@/features/cart/hooks/useCart';
import { formatCurrency, formatDiscount } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { ShoppingCart, Minus, Plus, Heart, Truck, Shield, RefreshCw, ArrowLeft, Search, FileText, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ProductDetailPage() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const { data: product, isLoading } = useProductDetail(productSlug!);
  const { addItem } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const selectedVariant = product?.variants.find(v => v.id === selectedVariantId) || product?.variants[0];

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      image: product.images[0],
      price: selectedVariant.salePrice || selectedVariant.price,
      quantity,
      scent: selectedVariant.scent,
      volumeMl: selectedVariant.volumeMl,
    });

    setQuantity(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h1>
          <p className="text-gray-500 mb-6">Sản phẩm bạn tìm kiếm có thể đã bị xóa hoặc không tồn tại.</p>
          <Button asChild className="rounded-full px-6">
            <Link to="/catalog">Quay lại danh sách sản phẩm</Link>
          </Button>
        </div>
      </div>
    );
  }

  const finalPrice = selectedVariant?.salePrice || selectedVariant?.price || 0;
  const originalPrice = selectedVariant?.price || 0;
  const hasDiscount = selectedVariant?.salePrice && selectedVariant.salePrice < originalPrice;

  return (
    <>
      <SEO
        title={product.name}
        description={product.description}
        image={getImageUrl(product.images[0])}
      />

      <div className="min-h-screen pb-20">
        {/* Product Header - Compact Breadcrumb */}
        <div className="border-b border-white/30 bg-white/30 backdrop-blur-md">
          <div className="container py-3.5 flex items-center justify-between gap-4">
            <Button variant="ghost" size="sm" asChild className="hidden md:flex w-fit rounded-full hover:bg-secondary/60">
              <Link to={`/c/${product.category?.slug}`} className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
              </Link>
            </Button>
            <Breadcrumb
              items={[
                { label: 'Sản phẩm', href: '/catalog' },
                { label: product.category?.name || '', href: `/c/${product.category?.slug}` },
                { label: product.name },
              ]}
              className="text-sm"
            />
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Images (5 cols) */}
            <div className="lg:col-span-5 space-y-4 animate-fade-in">
              <div className="aspect-square bg-white/60 backdrop-blur rounded-[2rem] overflow-hidden shadow-lg border border-white/60 relative group">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {hasDiscount && (
                  <Badge className="absolute top-4 right-4 bg-primary text-secondary hover:bg-primary/90 px-3.5 py-1.5 text-xs font-bold shadow-lg rounded-full">
                    -{formatDiscount(originalPrice, finalPrice)}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-white/60 backdrop-blur rounded-xl overflow-hidden transition-all duration-300 ${selectedImage === index
                      ? 'ring-2 ring-primary ring-offset-2'
                      : 'border border-white/80 hover:border-primary/50 opacity-80 hover:opacity-100'
                      }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} ${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Info & Details (7 cols) */}
            <div className="lg:col-span-7 space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <Badge variant="secondary" className="rounded-full bg-secondary text-primary hover:bg-accent/40 px-3 py-1">
                    {product.category?.name}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-amber-500 font-semibold">
                    <Rating value={product.rating || 0} size="sm" />
                    <span>{product.rating?.toFixed(1)}</span>
                    <span className="text-muted-foreground font-normal">({product.reviewCount} đánh giá)</span>
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">{product.name}</h1>

                <div className="flex items-end gap-3 mb-6">
                  <span className="text-4xl font-extrabold text-primary tracking-tight">
                    {formatCurrency(finalPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xl text-muted-foreground line-through mb-1.5 font-medium">
                      {formatCurrency(originalPrice)}
                    </span>
                  )}
                </div>

                {/* Compact Trust Badges */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { icon: Truck, text: 'Giao nhanh hàng ngày', sub: 'Tối ưu chi phí' },
                    { icon: Shield, text: 'Cam kết chất lượng', sub: 'Lựa chọn tinh gọn' },
                    { icon: RefreshCw, text: 'Đổi trả dễ dàng', sub: 'Hỗ trợ trong 7 ngày' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/45 backdrop-blur-sm border border-white/60 text-center shadow-sm hover:bg-white/65 transition duration-300">
                      <item.icon className="h-5 w-5 text-primary mb-1.5" />
                      <span className="text-xs font-bold text-foreground">{item.text}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Selection & Actions */}
                <div className="section-shell p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">Phiên bản (Mùi/Dung tích):</label>
                      <Select value={selectedVariantId || product.variants[0]?.id} onValueChange={setSelectedVariantId}>
                        <SelectTrigger className="h-11 rounded-xl bg-white/65 border-white/65 focus:bg-white transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-white/70 bg-white/95">
                          {product.variants.map((v) => (
                            <SelectItem key={v.id} value={v.id} disabled={v.stock === 0} className="rounded-lg">
                              <span className="font-semibold">{v.scent}</span> - {v.volumeMl}ml
                              {v.stock === 0 && <span className="text-destructive ml-2 font-medium">(Hết hàng)</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">Số lượng:</label>
                      <div className="flex items-center h-11 bg-white/65 rounded-xl border border-white/65 px-1 w-fit">
                        <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-9 w-9 rounded-lg hover:bg-white transition-all active:scale-90">
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center font-bold text-foreground">{quantity}</span>
                        <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.min(selectedVariant?.stock || 999, quantity + 1))} className="h-9 w-9 rounded-lg hover:bg-white transition-all active:scale-90">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1 h-12 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
                      onClick={handleAddToCart}
                      disabled={!selectedVariant || selectedVariant.stock === 0}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {selectedVariant?.stock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-full hover:text-red-500 active:scale-90 transition-all border-white/80 bg-white/40">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabbed Details - Replaces long scroll */}
              <div className="pt-4">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full justify-start h-auto p-1 bg-secondary/55 backdrop-blur-sm border border-white/50 rounded-xl mb-6">
                    <TabsTrigger value="description" className="rounded-lg px-6 py-2.5 transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                      <FileText className="h-4 w-4 mr-2" />
                      Mô tả chi tiết
                    </TabsTrigger>
                    <TabsTrigger value="specs" className="rounded-lg px-6 py-2.5 transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                      <Info className="h-4 w-4 mr-2" />
                      Thông số & Bảo quản
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-0 animate-fade-in">
                    <div className="prose prose-gray max-w-none prose-p:leading-relaxed prose-headings:font-semibold prose-a:text-primary bg-white/45 backdrop-blur-sm border border-white/50 rounded-2xl p-6 md:p-8">
                      <div className="text-foreground/80 whitespace-pre-line leading-relaxed">
                        {product.description}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="specs" className="mt-0 animate-fade-in">
                    <div className="section-shell p-6 md:p-8">
                      <h4 className="font-bold text-foreground text-lg mb-4">Thông tin kỹ thuật</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                        <div className="flex justify-between border-b border-white/50 pb-2">
                          <span className="text-muted-foreground">Mùi hương</span>
                          <span className="font-semibold text-foreground">{selectedVariant?.scent}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/50 pb-2">
                          <span className="text-muted-foreground">Dung tích</span>
                          <span className="font-semibold text-foreground">{selectedVariant?.volumeMl}ml</span>
                        </div>
                        <div className="flex justify-between border-b border-white/50 pb-2">
                          <span className="text-muted-foreground">Xuất xứ</span>
                          <span className="font-semibold text-foreground">Thái Lan</span>
                        </div>
                        <div className="flex justify-between border-b border-white/50 pb-2">
                          <span className="text-muted-foreground">Thương hiệu</span>
                          <span className="font-semibold text-foreground">{product.category?.name}</span>
                        </div>
                      </div>
                      <div className="mt-6">
                        <h4 className="font-bold text-foreground mb-2">Hướng dẫn bảo quản</h4>
                        <ul className="list-disc list-inside text-foreground/80 space-y-1.5 text-sm">
                          <li>Bảo quản nơi khô ráo, thoáng mát.</li>
                          <li>Tránh ánh nắng trực tiếp từ mặt trời.</li>
                          <li>Đậy nắp kín sau khi sử dụng.</li>
                          <li>Để xa tầm tay trẻ em.</li>
                        </ul>
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
