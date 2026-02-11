import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCart } from '@/features/cart/hooks/useCart';
import { useAddresses } from '@/features/users/hooks/useAddresses';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { PAYMENT_METHODS, SHIPPING_METHODS } from '@/lib/constants';
import apiClient from '@/lib/api';
import { ArrowLeft, Truck, CreditCard, MapPin, Shield, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { AddressFormDialog } from '@/features/users/components/AddressFormDialog';
import { CheckoutSteps } from '../components/CheckoutSteps';
import confetti from 'canvas-confetti';

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { data: addresses } = useAddresses();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

  // Default selections
  const [shippingMethod, setShippingMethod] = useState<string>(SHIPPING_METHODS[0].id);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0].id);

  // Auto-select default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);

  const selectedShipping = SHIPPING_METHODS.find(m => m.id === shippingMethod);
  const shippingFee = selectedShipping?.price || 0;
  const finalTotal = totalPrice + shippingFee;
  const selectedAddress = addresses?.find(addr => addr.id === selectedAddressId);

  const handleNextStep = () => {
    if (step === 1 && !selectedAddress) {
      alert("Vui lòng chọn địa chỉ giao hàng");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBackStep = () => {
    setStep(prev => prev - 1);
  };


  const handleSubmit = async () => {
    if (!selectedAddress) return;

    setIsSubmitting(true);
    let orderCreated = false;

    try {
      const orderData = {
        addressId: selectedAddress.id,
        items: items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentMethod,
        shippingFee,
        total: finalTotal,
      };

      await apiClient.post('/orders/checkout', orderData);
      orderCreated = true;
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }

    if (orderCreated) {
      try {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_) {
        // Ignore confetti errors
      }

      setTimeout(() => {
        clearCart();
        navigate('/orders');
      }, 1000);
    }
  };

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [items, navigate]);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <SEO title="Thanh toán" />

      <div className="min-h-screen bg-[#F8F9FA] pb-20">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
          <div className="container py-4 flex items-center justify-between">
            <Link to="/cart" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="font-medium">Quay lại giỏ hàng</span>
            </Link>
            <div className="font-playfair font-bold text-xl tracking-wide text-gray-900">Thanh toán</div>
            <div className="w-32 flex justify-end">
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-100">
                <Shield className="h-3.5 w-3.5" />
                An toàn
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-7xl pt-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* LEFT COLUMN: MAIN PROCESS */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">

              {/* Steps Indicator */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <CheckoutSteps currentStep={step} />
              </div>

              {/* Step Content */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* STEP 1: ADDRESS & SHIPPING */}
                {step === 1 && (
                  <div className="space-y-6">
                    {/* Address Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          Địa chỉ giao hàng
                        </h2>
                        <Button variant="ghost" size="sm" onClick={() => setIsAddressDialogOpen(true)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          + Thêm mới
                        </Button>
                      </div>

                      {!addresses || addresses.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="h-8 w-8 text-gray-300" />
                          </div>
                          <p className="text-gray-500 mb-4">Bạn chưa có địa chỉ nào</p>
                          <Button onClick={() => setIsAddressDialogOpen(true)}>Thêm địa chỉ ngay</Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {addresses.map((addr) => (
                            <div
                              key={addr.id}
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 group ${selectedAddressId === addr.id
                                ? 'border-blue-600 bg-white shadow-lg shadow-blue-100'
                                : 'border-transparent bg-white shadow-sm hover:border-blue-100 hover:shadow-md'
                                }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-gray-900">{addr.fullName}</div>
                                {selectedAddressId === addr.id ? (
                                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-200 group-hover:text-blue-300" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500 mb-3">{addr.phone}</div>
                              <div className="text-sm text-gray-600 leading-relaxed min-h-[40px]">
                                {addr.line1}, {addr.ward}, {addr.district}, {addr.province}
                              </div>
                              {addr.isDefault && (
                                <div className="mt-3">
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-normal">Mặc định</Badge>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator className="bg-gray-100" />

                    {/* Shipping Section */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Truck className="h-5 w-5 text-green-600" />
                        Phương thức vận chuyển
                      </h2>
                      <div className="grid grid-cols-1 gap-3">
                        {SHIPPING_METHODS.map((method) => (
                          <div
                            key={method.id}
                            onClick={() => setShippingMethod(method.id)}
                            className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${shippingMethod === method.id
                              ? 'border-green-500 bg-white shadow-lg shadow-green-50'
                              : 'border-transparent bg-white shadow-sm hover:border-green-100'
                              }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${shippingMethod === method.id ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400'
                                }`}>
                                <Truck className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">{method.name}</div>
                                <div className="text-sm text-gray-500">Nhận hàng trong {method.days}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">{formatCurrency(method.price)}</div>
                              {shippingMethod === method.id && <div className="text-[10px] text-green-600 font-medium uppercase tracking-wider mt-1">Đã chọn</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PAYMENT */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      Chọn phương thức thanh toán
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {PAYMENT_METHODS.map((method) => {
                        const isCOD = method.id === 'COD';
                        return (
                          <div
                            key={method.id}
                            onClick={() => isCOD && setPaymentMethod(method.id)}
                            className={`relative p-6 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-4 ${paymentMethod === method.id
                              ? 'border-purple-600 bg-white shadow-xl shadow-purple-50 scale-[1.02] cursor-pointer'
                              : isCOD
                                ? 'border-transparent bg-white shadow-sm hover:border-purple-100 hover:scale-[1.01] cursor-pointer'
                                : 'border-transparent bg-gray-50 opacity-50 cursor-not-allowed grayscale'
                              }`}
                          >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === method.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                              }`}>
                              {method.id === 'COD' ? <Truck className="h-7 w-7" /> : <CreditCard className="h-7 w-7" />}
                            </div>

                            <div>
                              <div className={`font-bold text-lg mb-1 ${paymentMethod === method.id ? 'text-purple-700' : 'text-gray-900'}`}>
                                {method.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {method.id === 'COD'
                                  ? 'Thanh toán khi nhận hàng'
                                  : <span className="text-red-500 font-medium text-xs bg-red-50 px-2 py-1 rounded-full">Đang bảo trì</span>
                                }
                              </div>
                            </div>

                            {paymentMethod === method.id && (
                              <div className="absolute top-4 right-4">
                                <CheckCircle2 className="h-6 w-6 text-purple-600" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 3: CONFIRM */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Sẵn sàng đặt hàng!</h2>
                      <p className="text-gray-500 max-w-md mx-auto">Vui lòng kiểm tra lại thông tin đơn hàng lần cuối trước khi xác nhận.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Giao tới</h3>
                        <div className="font-bold text-gray-900 text-lg mb-1">{selectedAddress?.fullName}</div>
                        <div className="text-gray-500 mb-2">{selectedAddress?.phone}</div>
                        <div className="text-gray-600">{selectedAddress?.line1}, {selectedAddress?.ward}, {selectedAddress?.district}, {selectedAddress?.province}</div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Thanh toán & Vận chuyển</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Phương thức vận chuyển</div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              <Truck className="h-4 w-4 text-green-600" />
                              {selectedShipping?.name}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Phương thức thanh toán</div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-purple-600" />
                              {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Fixed Action Bar for Mobile/Tablet or Inline for Desktop */}
              <div className="bg-white border-t border-gray-100 p-4 -mx-4 lg:mx-0 lg:rounded-2xl lg:border lg:bg-white lg:p-6 lg:mt-4 sticky bottom-0 z-30 lg:relative lg:z-0">
                <div className="flex gap-4">
                  {step > 1 && (
                    <Button
                      variant="outline"
                      onClick={handleBackStep}
                      className="h-12 w-32 rounded-xl border-gray-200 hover:bg-gray-50 font-medium"
                    >
                      Quay lại
                    </Button>
                  )}
                  <Button
                    onClick={step < 3 ? handleNextStep : handleSubmit}
                    disabled={step === 1 && !selectedAddress || isSubmitting}
                    className={`h-12 flex-1 rounded-xl text-base font-bold shadow-lg transition-all hover:scale-[1.01] ${step < 3
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/25'
                      }`}
                  >
                    {step < 3 ? (
                      <span className="flex items-center gap-2">Tiếp tục <ChevronRight className="h-5 w-5" /></span>
                    ) : (
                      <span className="flex items-center gap-2">{isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}</span>
                    )}
                  </Button>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: SUMMARY (Sticky) */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-28 space-y-6">
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                  <div className="p-6 bg-gray-50/50 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900 flex items-center justify-between">
                      <span>Đơn hàng của bạn</span>
                      <Badge variant="secondary" className="bg-white text-gray-900 border-gray-200">{items.length} sản phẩm</Badge>
                    </h3>
                  </div>

                  <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                      {items.map((item) => (
                        <div key={item.variantId} className="flex gap-4 group">
                          <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 line-clamp-2 text-sm mb-1">{item.name}</div>
                            <div className="flex justify-between items-end">
                              <div className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-md">Sl: {item.quantity}</div>
                              <div className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50/80 space-y-3 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tạm tính</span>
                      <span className="font-medium text-gray-900">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Phí vận chuyển</span>
                      <span className="font-medium text-green-600">
                        {shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}
                      </span>
                    </div>
                    <Separator className="my-2 bg-gray-200" />
                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-bold text-gray-900">Tổng thanh toán</span>
                      <span className="text-2xl font-playfair font-bold text-blue-600">
                        {formatCurrency(finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <AddressFormDialog
          open={isAddressDialogOpen}
          onOpenChange={setIsAddressDialogOpen}
        />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </>
  );
}
