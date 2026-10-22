import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/features/cart/hooks/useCart';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const FREESHIP_THRESHOLD = 250000;

export function CartDrawer() {
  const { items, updateQuantity, removeItem, totalPrice, isOpen, closeCart } =
    useCart();

  const freeshipRemaining = Math.max(0, FREESHIP_THRESHOLD - totalPrice);
  const freeshipProgress = Math.min(
    100,
    Math.round((totalPrice / FREESHIP_THRESHOLD) * 100),
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-slate-200 bg-white shadow-xl">
        <SheetHeader className="px-6 py-4 border-b border-slate-200 bg-white">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-900 font-sans font-bold text-lg tracking-tight">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span>Giỏ Hàng Của Bạn</span>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full tabular-nums">
              {items.length} sản phẩm
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Freeship Progress Meter */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2 font-medium text-slate-600">
              <Truck className="h-4 w-4 text-teal-600" />
              {freeshipRemaining === 0 ? (
                <span className="font-semibold text-emerald-600">Bạn đã đủ điều kiện FREESHIP!</span>
              ) : (
                <span>
                  Mua thêm <strong className="text-slate-900 font-semibold">{formatCurrency(freeshipRemaining)}</strong> để được Freeship
                </span>
              )}
            </div>
            <span className="font-sans font-semibold text-slate-900 tabular-nums">{freeshipProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-500"
              style={{ width: `${freeshipProgress}%` }}
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-xs">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-base tracking-tight">Giỏ hàng của bạn đang trống</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Hãy khám phá các dòng chai xịt Thái Lan đuổi chuột, diệt côn trùng và tẩy rửa tiện ích.
                </p>
              </div>
              <Button
                onClick={closeCart}
                asChild
                className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm h-11 transition-colors duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                <Link to="/catalog">Khám Phá Sản Phẩm Ngay</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 px-6 overflow-y-auto divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.variantId} className="py-4 flex gap-3.5 items-center group">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm transition-transform duration-200 group-hover:scale-[1.02]">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <h4 className="font-sans font-semibold text-sm text-slate-900 line-clamp-1 leading-snug mb-1 tracking-tight">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.scent && (
                          <Badge variant="secondary" className="px-2 py-0 text-[10px] font-medium bg-slate-100 text-slate-700 border-slate-200 rounded-md">
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
                      <span className="font-sans font-semibold text-sm text-slate-900 tabular-nums">
                        {formatCurrency(item.price * item.quantity)}
                      </span>

                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md hover:bg-white text-slate-700 transition-colors"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-7 text-center text-xs font-semibold text-slate-900 tabular-nums">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md hover:bg-white text-slate-700 transition-colors"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
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

            <div className="border-t border-slate-200 px-6 py-4 bg-white space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Tạm tính ({items.length} sản phẩm):</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Vận chuyển:</span>
                  <span className={freeshipRemaining === 0 ? 'text-emerald-600 font-semibold' : 'text-slate-900 font-medium'}>
                    {freeshipRemaining === 0 ? 'Miễn phí' : 'Tính khi thanh toán'}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-slate-900">Tổng cộng:</span>
                  <span className="text-xl font-sans font-bold text-slate-900 tabular-nums">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full h-11 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-teal-500"
                  onClick={closeCart}
                  asChild
                >
                  <Link
                    to="/checkout"
                    className="flex items-center justify-center gap-2"
                  >
                    Tiến Hành Thanh Toán
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors duration-200"
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
