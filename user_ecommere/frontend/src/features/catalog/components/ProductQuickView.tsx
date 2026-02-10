import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProductDetail } from '../hooks/useProductDetail';
import { useCart } from '@/features/cart/hooks/useCart';
import { useWishlist } from '@/features/catalog/hooks/useWishlist';
import { formatCurrency, formatDiscount } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { Minus, Plus, ShoppingCart, Loader2, Heart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface ProductQuickViewProps {
    slug: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProductQuickView({ slug, open, onOpenChange }: ProductQuickViewProps) {
    const { data: product, isLoading } = useProductDetail(slug);
    const { addItem } = useCart();
    const { toggleItem, isInWishlist } = useWishlist();

    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    // Reset state when product loads or changes
    if (product && !selectedVariantId && product.variants.length > 0) {
        // This might cause infinite loop if not handled carefully, better to calculate derived state
    }

    const selectedVariant = product?.variants.find(v => v.id === selectedVariantId) || product?.variants[0];
    const isWishlisted = product ? isInWishlist(product.id) : false;

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
        }); // addItem now auto-opens drawer

        onOpenChange(false);
    };

    const handleToggleWishlist = () => {
        if (!product) return;
        toggleItem({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            image: product.images[0],
            price: product.variants[0]?.salePrice || product.variants[0]?.price || 0,
        });
    }

    const finalPrice = selectedVariant?.salePrice || selectedVariant?.price || 0;
    const originalPrice = selectedVariant?.price || 0;
    const hasDiscount = selectedVariant?.salePrice && selectedVariant.salePrice < originalPrice;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0 bg-white border-0 rounded-2xl md:h-auto h-[90vh] flex flex-col md:flex-row">
                {/* Helper for accessibility if needed */}
                <VisuallyHidden.Root>
                    <DialogTitle>{product?.name || 'Product Quick View'}</DialogTitle>
                    <DialogDescription>Xem nhanh thông tin sản phẩm</DialogDescription>
                </VisuallyHidden.Root>

                {isLoading || !product ? (
                    <div className="flex-1 flex items-center justify-center p-12 min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <>
                        {/* Left: Images */}
                        <div className="w-full md:w-1/2 bg-gray-50 p-6 flex flex-col justify-center relative">
                            <div className="aspect-square relative overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 mb-4 mix-blend-multiply">
                                <img
                                    src={getImageUrl(product.images[selectedImage])}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                {hasDiscount && (
                                    <Badge className="absolute top-3 left-3 bg-red-500 text-white font-bold hover:bg-red-600">
                                        -{formatDiscount(originalPrice, finalPrice)}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex gap-2 justify-center overflow-x-auto pb-2 scrollbar-none">
                                {product.images.slice(0, 4).map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 ${selectedImage === idx ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                                            }`}
                                    >
                                        <img src={getImageUrl(img)} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Details */}
                        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto max-h-[90vh] md:max-h-auto">
                            <div className="mb-1 flex justify-between items-center">
                                <span className="text-sm font-medium text-blue-600">{product.category?.name}</span>
                                <Button variant="ghost" size="icon" onClick={handleToggleWishlist} className={`hover:bg-rose-50 ${isWishlisted ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`}>
                                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                                </Button>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>

                            <div className="flex items-baseline gap-3 mb-4">
                                <span className="text-2xl font-bold text-blue-600">{formatCurrency(finalPrice)}</span>
                                {hasDiscount && (
                                    <span className="text-lg text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
                                )}
                            </div>

                            <div className="prose prose-sm text-gray-500 mb-6 line-clamp-3">
                                {product.description}
                            </div>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Phiên bản:</label>
                                    <Select
                                        value={selectedVariantId || product.variants[0]?.id}
                                        onValueChange={(val) => {
                                            setSelectedVariantId(val);
                                            setQuantity(1);
                                        }}
                                    >
                                        <SelectTrigger className="w-full rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {product.variants.map((v) => (
                                                <SelectItem key={v.id} value={v.id} disabled={v.stock === 0}>
                                                    <span className="font-medium">{v.scent}</span> - {v.volumeMl}ml
                                                    {v.stock === 0 && <span className="text-red-500 ml-2">(Hết hàng)</span>}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Số lượng:</label>
                                    <div className="flex items-center h-10 w-32 bg-gray-50 rounded-lg border border-gray-200">
                                        <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-full w-9 hover:bg-white text-gray-500">
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="flex-1 text-center font-semibold text-sm">{quantity}</span>
                                        <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.min(selectedVariant?.stock || 99, quantity + 1))} className="h-full w-9 hover:bg-white text-gray-500">
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto space-y-3">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={!selectedVariant || selectedVariant.stock === 0}
                                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 rounded-xl hover:scale-[1.02] transition-transform"
                                >
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    {selectedVariant?.stock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
                                </Button>
                                <Button variant="outline" asChild className="w-full h-11 border-gray-200 rounded-xl hover:bg-gray-50">
                                    <Link to={`/p/${slug}`} onClick={() => onOpenChange(false)}>
                                        Xem chi tiết sản phẩm
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
