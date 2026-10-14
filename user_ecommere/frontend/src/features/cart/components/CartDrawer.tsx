import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/features/cart/hooks/useCart';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const FREESHIP_THRESHOLD = 250000;

export function CartDrawer() {
  const { items, updateQuantity, removeItem, totalPrice, isOpen, closeCart } = useCart();

  const freeshipRemaining = Math.max(0, FREESHIP_THRESHOLD - totalPrice);
  const freeshipProgress = Math.min(100, Math.round((totalPrice / FREESHIP_THRESHOLD) * 100));

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-slate-200/80 bg-white">
        <SheetHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-black text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span>Giỏ Hàng Của Bạn</span>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2.5 py-0.5 rounded-full">
              {items.length} sản phẩm
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Freeship Progress Meter */}
        <div className="bg-teal-50/70 border-b border-teal-100 px-6 py-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-teal-900">
              <Truck className="h-3.5 w-3.5 text-teal-600" />
              {freeshipRemaining === 0 ? (
                <span className="text-emerald-700">🎉 Bạn đã đủ điều kiện FREESHIP!</span>
              ) : (
                <span>
                  Mua thêm <strong className="text-teal-700">{formatCurrency(freeshipRemaining)}</strong> để được Freeship
                </span>
              )}
            </div>
            <span className="font-extrabold text-teal-700">{freeshipProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-teal-200/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${freeshipProgress}%` }}
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-xs">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Giỏ hàng của bạn đang trống</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Hãy khám phá các dòng chai xịt Thái Lan đuổi chuột, diệt côn trùng và tẩy rửa tiện ích.
                </p>
              </div>
              <Button
                onClick={closeCart}
                asChild
                className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-xs h-11"
              >
                <Link to="/catalog">Khám Phá Sản Phẩm Ngay</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 px-6 overflow-y-auto divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.variantId} className="py-4 flex gap-3.5 items-center">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 p-1">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1 leading-tight mb-1">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.scent && (
                          <Badge variant="secondary" className="px-2 py-0 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md">
                            {item.scent}
                          </Badge>
                        )}
                        {item.volumeMl ? (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {item.volumeMl}ml
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <span className="font-black text-sm text-teal-700">
                        {formatCurrency(item.price * item.quantity)}
                      </span>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md hover:bg-slate-100 text-slate-700"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-7 text-center text-xs font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md hover:bg-slate-100 text-slate-700"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          aria-label="Xóa sản phẩm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200/80 px-6 py-5 bg-slate-50/70 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Tạm tính ({items.length} sản phẩm):</span>
                  <span className="font-medium text-slate-700">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Vận chuyển:</span>
                  <span className={freeshipRemaining === 0 ? 'text-emerald-600 font-bold' : 'text-slate-700'}>
                    {freeshipRemaining === 0 ? 'Miễn phí' : 'Tính khi thanh toán'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Tổng cộng:</span>
                  <span className="text-xl font-black text-teal-700">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
                  onClick={closeCart}
                  asChild
                >
                  <Link to="/checkout" className="flex items-center justify-center gap-2">
                    Tiến Hành Thanh Toán
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-10 rounded-xl border-slate-200 hover:bg-white text-xs font-bold text-slate-700"
                  onClick={closeCart}
                  asChild
                >
                  <Link to="/cart">Xem Trang Giỏ Hàng Chi Tiết</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
