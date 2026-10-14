import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProductDetail } from '../hooks/useProductDetail';
import { useCart } from '@/features/cart/hooks/useCart';
import { useWishlist } from '@/features/catalog/hooks/useWishlist';
import { formatCurrency, formatDiscount } from '@/lib/formatters';
import { getImageUrl, cn } from '@/lib/utils';
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
            price: selectedVariant.salePrice ?? selectedVariant.price,
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
            price: product.variants[0]?.salePrice ?? product.variants[0]?.price ?? 0,
        });
    };

    const finalPrice = selectedVariant?.salePrice ?? selectedVariant?.price ?? 0;
    const originalPrice = selectedVariant?.price ?? 0;
    const hasDiscount = selectedVariant?.salePrice != null && selectedVariant.salePrice < originalPrice;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-y-auto md:overflow-hidden gap-0 bg-card border border-border/60 rounded-2xl md:rounded-[1.8rem] shadow-luxury max-h-[92vh] flex flex-col md:flex-row">
                {/* Helper for accessibility if needed */}
                <VisuallyHidden.Root>
                    <DialogTitle>{product?.name || 'Xem nhanh sản phẩm'}</DialogTitle>
                    <DialogDescription>Xem nhanh thông tin sản phẩm</DialogDescription>
                </VisuallyHidden.Root>

                {isLoading || !product ? (
                    <div className="flex-1 flex items-center justify-center p-12 min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Left: Images */}
                        <div className="w-full md:w-1/2 bg-secondary/40 border-b md:border-b-0 md:border-r border-border/50 p-6 flex flex-col justify-center relative flex-shrink-0">
                            <div className="aspect-square relative overflow-hidden rounded-2xl bg-card shadow-sm border border-border/40 mb-4 flex items-center justify-center p-5">
                                <img
                                    src={getImageUrl(product.images[selectedImage])}
                                    alt={product.name}
                                    className="w-full h-full object-contain transition-transform duration-500 ease-out hover:scale-105"
                                />
                                {hasDiscount && (
                                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-bold hover:bg-primary/90 rounded-full px-3 py-1 text-xs shadow-sm">
                                        {formatDiscount(originalPrice, finalPrice)}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex gap-2 justify-center overflow-x-auto pb-2 scrollbar-hide">
                                {product.images.slice(0, 4).map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedImage(idx)}
                                        aria-label={`Xem ảnh ${idx + 1}`}
                                        className={cn(
                                            'w-16 h-16 rounded-xl border overflow-hidden flex-shrink-0 transition-all duration-200 bg-card p-1',
                                            selectedImage === idx
                                                ? 'border-primary ring-2 ring-primary/20 ring-offset-1'
                                                : 'border-border/60 hover:border-primary/50 opacity-70 hover:opacity-100'
                                        )}
                                    >
                                        <img src={getImageUrl(img, { width: 100 })} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Details */}
                        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto md:max-h-[92vh]">
                            <div className="mb-1 flex justify-between items-center pr-8">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-foreground">{product.category?.name}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleToggleWishlist}
                                    aria-label="Thêm vào yêu thích"
                                    className={cn(
                                        'rounded-full transition-colors',
                                        isWishlisted
                                            ? 'text-destructive bg-destructive/10 hover:bg-destructive/15'
                                            : 'text-muted-foreground hover:text-destructive hover:bg-muted'
                                    )}
                                >
                                    <Heart className={cn('h-5 w-5 transition-transform duration-300', isWishlisted && 'fill-destructive text-destructive scale-110')} />
                                </Button>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2 leading-tight">{product.name}</h2>

                            <div className="flex items-baseline gap-3 mb-4">
                                <span className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(finalPrice)}</span>
                                {hasDiscount && (
                                    <span className="text-lg text-muted-foreground line-through tabular-nums">{formatCurrency(originalPrice)}</span>
                                )}
                            </div>

                            <div className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                                {product.description}
                            </div>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Phiên bản:</label>
                                    <Select
                                        value={selectedVariantId || product.variants[0]?.id}
                                        onValueChange={(val) => {
                                            setSelectedVariantId(val);
                                            setQuantity(1);
                                        }}
                                    >
                                        <SelectTrigger className="w-full rounded-xl border-border bg-background text-foreground focus:ring-ring">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
                                            {product.variants.map((v) => (
                                                <SelectItem key={v.id} value={v.id} disabled={v.stock === 0} className="rounded-lg">
                                                    <span className="font-medium">{v.scent}</span> - {v.volumeMl}ml
                                                    {v.stock === 0 && <span className="text-destructive ml-2">(Hết hàng)</span>}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Số lượng:</label>
                                    <div className="flex items-center h-10 w-32 bg-secondary/60 rounded-full border border-border">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            aria-label="Giảm số lượng"
                                            className="h-full w-9 rounded-l-full hover:bg-card text-muted-foreground hover:text-foreground"
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="flex-1 text-center font-semibold text-sm text-foreground tabular-nums">{quantity}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setQuantity(Math.min(selectedVariant?.stock || 99, quantity + 1))}
                                            aria-label="Tăng số lượng"
                                            className="h-full w-9 rounded-r-full hover:bg-card text-muted-foreground hover:text-foreground"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 space-y-3">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={!selectedVariant || selectedVariant.stock === 0}
                                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wider text-xs transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/15 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    {selectedVariant?.stock === 0 ? 'Tạm hết hàng' : 'Thêm vào giỏ'}
                                </Button>
                                <Button variant="outline" asChild className="w-full h-10 rounded-full border-border hover:bg-muted text-foreground font-bold text-xs uppercase tracking-wider">
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
