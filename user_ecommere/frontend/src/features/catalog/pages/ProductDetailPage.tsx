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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Khong tim thay san pham</h1>
          <p className="text-gray-500 mb-6">San pham ban tim kiem co the da bi xoa hoac khong ton tai.</p>
          <Button asChild className="rounded-full px-6">
            <Link to="/catalog">Quay lai danh sach san pham</Link>
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

      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white pb-20">
        {/* Product Header - Compact Breadcrumb */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
          <div className="container py-3 flex items-center justify-between">
            <Breadcrumb
              items={[
                { label: 'San pham', href: '/catalog' },
                { label: product.category?.name || '', href: `/c/${product.category?.slug}` },
                { label: product.name },
              ]}
              className="text-sm"
            />
            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <Link to={`/c/${product.category?.slug}`} className="gap-2 text-gray-500">
                <ArrowLeft className="h-4 w-4" />
                Quay lai
              </Link>
            </Button>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Images (5 cols) */}
            <div className="lg:col-span-5 space-y-4 animate-fade-in">
              <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative group">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {hasDiscount && (
                  <Badge className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm font-bold shadow-lg">
                    -{formatDiscount(originalPrice, finalPrice)}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-white rounded-lg overflow-hidden transition-all duration-200 ${selectedImage === index
                      ? 'ring-2 ring-blue-500 ring-offset-1'
                      : 'border border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'
                      }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Info & Details (7 cols) */}
            <div className="lg:col-span-7 space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100">
                    {product.category?.name}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-amber-500 font-medium">
                    <Rating value={product.rating || 0} size="sm" />
                    <span>{product.rating?.toFixed(1)}</span>
                    <span className="text-gray-400 font-normal">({product.reviewCount} danh gia)</span>
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">{product.name}</h1>

                <div className="flex items-end gap-3 mb-6">
                  <span className="text-4xl font-bold text-blue-600 tracking-tight">
                    {formatCurrency(finalPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xl text-gray-400 line-through mb-1.5">
                      {formatCurrency(originalPrice)}
                    </span>
                  )}
                </div>

                {/* Compact Trust Badges */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { icon: Truck, text: 'Mien phi van chuyen', sub: 'Don tu 500k' },
                    { icon: Shield, text: 'Chinh hang 100%', sub: 'Phat hien gia den gap 10' },
                    { icon: RefreshCw, text: 'Doi tra 7 ngay', sub: 'Thu tuc don gian' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                      <item.icon className="h-5 w-5 text-blue-600 mb-1.5" />
                      <span className="text-xs font-bold text-gray-900">{item.text}</span>
                      <span className="text-[10px] text-gray-500">{item.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Selection & Actions */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Phien ban (Mui/Dung tich):</label>
                      <Select value={selectedVariantId || product.variants[0]?.id} onValueChange={setSelectedVariantId}>
                        <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {product.variants.map((v) => (
                            <SelectItem key={v.id} value={v.id} disabled={v.stock === 0}>
                              <span className="font-medium">{v.scent}</span> - {v.volumeMl}ml
                              {v.stock === 0 && <span className="text-red-500 ml-2">(Het hang)</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">So luong:</label>
                      <div className="flex items-center h-11 bg-gray-50 rounded-xl border border-gray-200 px-1 w-fit">
                        <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-9 w-9 rounded-lg hover:bg-white">
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center font-semibold">{quantity}</span>
                        <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.min(selectedVariant?.stock || 999, quantity + 1))} className="h-9 w-9 rounded-lg hover:bg-white">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1 h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 rounded-xl hover:scale-[1.02] transition-transform"
                      onClick={handleAddToCart}
                      disabled={!selectedVariant || selectedVariant.stock === 0}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {selectedVariant?.stock === 0 ? 'Tam het hang' : 'Them vao gio'}
                    </Button>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-gray-200 hover:text-red-500 hover:border-red-200 hover:bg-red-50">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabbed Details - Replaces long scroll */}
              <div className="pt-4">
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="w-full justify-start h-auto p-1 bg-gray-100/50 rounded-xl mb-6">
                    <TabsTrigger value="description" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Mo ta chi tiet
                    </TabsTrigger>
                    <TabsTrigger value="specs" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Info className="h-4 w-4 mr-2" />
                      Thong so & Bao quan
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-0 animate-fade-in">
                    <div className="prose prose-gray max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-blue-600">
                      <div className="text-gray-600 whitespace-pre-line">
                        {product.description}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="specs" className="mt-0 animate-fade-in">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h4 className="font-bold text-gray-900 mb-4">Thong tin ky thuat</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-500">Mui huong</span>
                          <span className="font-medium text-gray-900">{selectedVariant?.scent}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-500">Dung tich</span>
                          <span className="font-medium text-gray-900">{selectedVariant?.volumeMl}ml</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-500">Xuat xu</span>
                          <span className="font-medium text-gray-900">Thai Lan</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                          <span className="text-gray-500">Thuong hieu</span>
                          <span className="font-medium text-gray-900">{product.category?.name}</span>
                        </div>
                      </div>
                      <div className="mt-6">
                        <h4 className="font-bold text-gray-900 mb-2">Huong dan bao quan</h4>
                        <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                          <li>Bao quan noi kho rao, thoang mat.</li>
                          <li>Tranh anh nang truc tiep tu mat troi.</li>
                          <li>Day nap kin sau khi su dung.</li>
                          <li>De xa tam tay tre em.</li>
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
