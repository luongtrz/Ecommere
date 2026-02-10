import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/features/cart/hooks/useCart';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function CartDrawer() {
    const { items, updateQuantity, removeItem, totalPrice, isOpen, closeCart } = useCart();

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Giỏ hàng ({items.length})
                    </SheetTitle>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-6">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                <ShoppingBag className="h-8 w-8 text-gray-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Giỏ hàng trống</h3>
                                <p className="text-sm text-gray-500 mt-1">Chưa có sản phẩm nào trong giỏ hàng của bạn.</p>
                            </div>
                            <Button variant="outline" onClick={closeCart} className="w-full">
                                Tiếp tục mua sắm
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 px-6 overflow-y-auto">
                            <div className="py-6 space-y-6">
                                {items.map((item) => (
                                    <div key={item.variantId} className="flex gap-4 animate-fade-in">
                                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.name}
                                                className="h-full w-full object-cover object-center"
                                            />
                                        </div>

                                        <div className="flex flex-1 flex-col">
                                            <div>
                                                <div className="flex justify-between text-base font-medium text-gray-900">
                                                    <h3 className="line-clamp-1 mr-2"><a href="#">{item.name}</a></h3>
                                                    <p className="ml-4">{formatCurrency(item.price * item.quantity)}</p>
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500 flex gap-2">
                                                    <Badge variant="secondary" className="px-1.5 h-5 font-normal">{item.scent}</Badge>
                                                    <Badge variant="secondary" className="px-1.5 h-5 font-normal">{item.volumeMl}ml</Badge>
                                                </div>
                                            </div>
                                            <div className="flex flex-1 items-end justify-between text-sm">
                                                <div className="flex items-center gap-1 border rounded-lg p-0.5">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(item.variantId, item.quantity - 1)} disabled={item.quantity <= 1}>
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.variantId)}
                                                    className="font-medium text-red-500 hover:text-red-400 flex items-center gap-1 text-xs"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t px-6 py-6 bg-gray-50/50">
                            <div className="flex justify-between text-base font-medium text-gray-900 mb-4 animate-fade-in">
                                <p>Tổng tiền</p>
                                <p>{formatCurrency(totalPrice)}</p>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500 mb-6">
                                Phí vận chuyển sẽ được tính tại trang thanh toán.
                            </p>
                            <div className="space-y-3">
                                <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 text-base font-bold" onClick={closeCart} asChild>
                                    <Link to="/checkout">
                                        Thanh toán ngay <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full h-12 rounded-xl border-gray-300 hover:bg-white hover:border-gray-400" onClick={closeCart} asChild>
                                    <Link to="/cart">
                                        Xem giỏ hàng chi tiết
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
