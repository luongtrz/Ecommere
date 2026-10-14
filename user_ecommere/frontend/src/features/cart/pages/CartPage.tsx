import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCart } from '../hooks/useCart';
import { useRefreshCartPrices } from '../hooks/useRefreshCartPrices';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, CreditCard, Truck, Shield } from 'lucide-react';

export function CartPage() {
  useRefreshCartPrices();
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <>
        <SEO title="Giỏ hàng" />
        <div className="min-h-[70vh] bg-background flex items-center justify-center p-4 py-12 md:py-20">
          <div className="max-w-md w-full bg-card rounded-2xl md:rounded-[1.8rem] border border-black/[0.03] shadow-luxury p-8 animate-fade-in text-center">
            <EmptyState
              icon={<ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto" />}
              title="Giỏ hàng của bạn đang trống"
              description="Hãy khám phá bộ sưu tập nước hoa xịt thơm của chúng tôi"
              action={
                <Button asChild size="lg" className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-luxury font-medium h-12 mt-2 transition-all duration-300">
                  <Link to="/catalog">Bắt đầu mua sắm</Link>
                </Button>
              }
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Giỏ hàng" />
      <div className="min-h-screen bg-background py-8 md:py-16">
        <div className="container max-w-6xl px-4 md:px-6">
          {/* Header */}
          <div className="mb-8 md:mb-12 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild className="p-0 h-auto hover:bg-transparent">
                <Link to="/catalog" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground hover:text-foreground transition-colors group">
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Tiếp tục mua sắm
                </Link>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-foreground/80 block mb-1">
                  Đơn hàng của bạn
                </span>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">
                  Giỏ hàng của bạn
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">{items.length} sản phẩm trong giỏ hàng</p>
              </div>
              <Badge variant="secondary" className="self-start sm:self-auto text-base md:text-lg px-5 py-2 rounded-full font-serif font-bold bg-secondary/80 text-foreground border border-border/60 shadow-sm tabular-nums">
                {formatCurrency(totalPrice)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Cart Items */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.variantId}
                  className="bg-card rounded-2xl md:rounded-[1.8rem] shadow-luxury hover:shadow-luxury-glow transition-all duration-300 border border-black/[0.03] animate-fade-in group p-5 md:p-6"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-secondary/40 border border-black/[0.03] p-1.5 flex items-center justify-center overflow-hidden">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full px-2 py-0.5 shadow-sm">
                        {item.quantity}
                      </Badge>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold text-base md:text-lg text-foreground mb-1.5 truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {item.scent && (
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider rounded-full px-2.5 py-0.5 bg-secondary text-secondary-foreground border border-border/60 font-medium">
                            {item.scent}
                          </Badge>
                        )}
                        {item.volumeMl ? (
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider rounded-full px-2.5 py-0.5 bg-secondary text-secondary-foreground border border-border/60 font-medium">
                            {item.volumeMl}ml
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-lg md:text-xl font-serif font-bold text-foreground tabular-nums">
                        {formatCurrency(item.price)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        Đơn giá: {formatCurrency(item.price)}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.variantId)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors h-9 w-9"
                        aria-label="Xóa sản phẩm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1 bg-secondary/70 border border-border/60 rounded-full p-1 shadow-sm">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-7 w-7 rounded-full hover:bg-card text-foreground transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-semibold text-sm text-foreground tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                          className="h-7 w-7 rounded-full hover:bg-card text-foreground transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="bg-card rounded-2xl md:rounded-[1.8rem] shadow-luxury border border-black/[0.03] sticky top-28 overflow-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="bg-primary p-6 text-primary-foreground">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/70 block mb-1">
                    Tóm tắt
                  </span>
                  <h3 className="text-lg font-serif font-bold text-primary-foreground flex items-center gap-2.5">
                    <CreditCard className="h-5 w-5 text-accent" />
                    Tổng đơn hàng
                  </h3>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-3.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tạm tính ({items.length} sản phẩm):</span>
                      <span className="font-medium text-foreground tabular-nums">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-accent-foreground" />
                        Phí vận chuyển:
                      </span>
                      <span className="text-foreground font-semibold">Miễn phí</span>
                    </div>
                  </div>

                  <div className="border-t border-border/80 pt-5 space-y-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-medium text-foreground">Tổng cộng:</span>
                      <span className="text-2xl font-serif font-bold text-foreground tabular-nums">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>

                    <Button asChild className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-luxury font-medium transition-all duration-300" size="lg">
                      <Link to="/checkout" className="flex items-center justify-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Tiến hành thanh toán
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="w-full h-11 rounded-full border-border hover:bg-muted text-foreground font-medium transition-all duration-300">
                      <Link to="/catalog" className="flex items-center justify-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Tiếp tục mua sắm
                      </Link>
                    </Button>
                  </div>

                  {/* Trust indicators */}
                  <div className="pt-4 border-t border-border/60">
                    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-accent-foreground" />
                        Thanh toán an toàn
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-accent-foreground" />
                        Giao hàng tận nơi
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
