import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCart } from '@/features/cart/hooks/useCart';
import { useAddresses } from '@/features/users/hooks/useAddresses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { PAYMENT_METHODS, SHIPPING_METHODS } from '@/lib/constants';
import apiClient from '@/lib/api';
import { ArrowLeft, Truck, CreditCard, MapPin, ShoppingBag, Plus, Shield, ChevronRight, Check } from 'lucide-react';
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

      // Success Effect
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        clearCart();
        navigate('/orders');
      }, 1000);

    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <>
      <SEO title="Thanh toán" />

      <div className="h-[calc(100vh-64px)] bg-gray-50/50 flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="bg-white border-b border-gray-100 shrink-0">
          <div className="container py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent text-gray-600 hover:text-gray-900">
              <Link to="/cart" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium text-sm">Quay lại</span>
              </Link>
            </Button>
            <div className="font-bold text-base">Thanh toán</div>
            <div className="w-16"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-4 flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

            {/* Left Column: Checkout Process */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full min-h-0">
              <div className="shrink-0 mb-4 px-1">
                <CheckoutSteps currentStep={step} />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4">
                {/* STEP 1: SHIPPING ADDRESS & METHOD */}
                {step === 1 && (
                  <div className="space-y-4 animate-fade-in-up">
                    <Card className="shadow-sm border border-gray-100 rounded-xl">
                      <CardHeader className="bg-gray-50/50 py-3 px-4 border-b">
                        <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          Địa chỉ nhận hàng
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        {!addresses || addresses.length === 0 ? (
                          <div className="text-center py-6">
                            <p className="text-gray-500 mb-3 text-sm">Bạn chưa có địa chỉ giao hàng</p>
                            <Button size="sm" onClick={() => setIsAddressDialogOpen(true)}>Thêm địa chỉ mới</Button>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {addresses.map((addr) => (
                              <div
                                key={addr.id}
                                onClick={() => setSelectedAddressId(addr.id)}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 hover:border-blue-200'}`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-sm text-gray-900">{addr.fullName}</span>
                                      <span className="text-gray-500 text-xs">| {addr.phone}</span>
                                      {addr.isDefault && <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] h-5 px-1.5">Mặc định</Badge>}
                                    </div>
                                    <p className="text-gray-600 text-xs mt-1 leading-relaxed">{addr.line1}, {addr.ward}, {addr.district}, {addr.province}</p>
                                  </div>
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedAddressId === addr.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                    {selectedAddressId === addr.id && <Check className="h-2.5 w-2.5 text-white" />}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => setIsAddressDialogOpen(true)} className="mt-1 w-full text-blue-600 border-dashed border-blue-200 hover:bg-blue-50">
                              <Plus className="h-3.5 w-3.5 mr-2" /> Thêm địa chỉ mới
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border border-gray-100 rounded-xl">
                      <CardHeader className="bg-gray-50/50 py-3 px-4 border-b">
                        <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                          <Truck className="h-4 w-4 text-green-600" />
                          Vận chuyển
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {SHIPPING_METHODS.map((method) => (
                            <div
                              key={method.id}
                              onClick={() => setShippingMethod(method.id)}
                              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${shippingMethod === method.id ? 'border-green-500 bg-green-50/50' : 'border-gray-100 hover:border-green-200'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${shippingMethod === method.id ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>
                                  {shippingMethod === method.id && <Check className="h-2.5 w-2.5 text-white" />}
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-gray-900">{method.name}</div>
                                  <div className="text-xs text-gray-500">{method.days}</div>
                                </div>
                              </div>
                              <span className="font-bold text-sm text-green-700">{formatCurrency(method.price)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* STEP 2: PAYMENT METHOD */}
                {step === 2 && (
                  <div className="space-y-4 animate-fade-in-up">
                    <Card className="shadow-sm border border-gray-100 rounded-xl">
                      <CardHeader className="bg-gray-50/50 py-3 px-4 border-b">
                        <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                          <CreditCard className="h-4 w-4 text-purple-600" />
                          Phương thức thanh toán
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {PAYMENT_METHODS.map((method) => (
                            <div
                              key={method.id}
                              onClick={() => setPaymentMethod(method.id)}
                              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === method.id ? 'border-purple-500 bg-purple-50/50' : 'border-gray-100 hover:border-purple-200'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === method.id ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                                  {paymentMethod === method.id && <Check className="h-2.5 w-2.5 text-white" />}
                                </div>
                                <span className="font-medium text-sm text-gray-900">{method.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* STEP 3: REVIEW */}
                {step === 3 && (
                  <div className="space-y-4 animate-fade-in-up">
                    <Card className="shadow-sm border border-gray-100 rounded-xl">
                      <CardHeader className="bg-gray-50/50 py-3 px-4 border-b">
                        <CardTitle className="text-base text-gray-800">Kiểm tra lại thông tin</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Người nhận</h4>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <p className="font-bold text-sm text-gray-900">{selectedAddress?.fullName}</p>
                              <p className="text-sm text-gray-600">{selectedAddress?.phone}</p>
                              <p className="text-sm text-gray-600 mt-1">{selectedAddress?.line1}, {selectedAddress?.ward}, {selectedAddress?.district}, {selectedAddress?.province}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phương thức</h4>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Vận chuyển: </span>
                                <span className="font-medium text-sm text-gray-900">{selectedShipping?.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Thanh toán: </span>
                                <span className="font-medium text-sm text-gray-900">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Navigation Actions (Bottom of left col) */}
              <div className="pt-4 mt-auto border-t border-gray-100 bg-white">
                <div className="flex gap-3">
                  {step > 1 && (
                    <Button variant="outline" onClick={handleBackStep} className="h-11 px-6 rounded-xl">Quay lại</Button>
                  )}
                  {step < 3 ? (
                    <Button
                      onClick={handleNextStep}
                      disabled={!selectedAddress}
                      className="h-11 flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-sm font-bold"
                    >
                      Tiếp tục <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="h-11 flex-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 shadow-md shadow-green-500/20 text-sm font-bold hover:scale-[1.01] transition-transform"
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5 xl:col-span-4 h-full overflow-hidden flex flex-col">
              <Card className="shadow-lg border-0 overflow-hidden rounded-xl bg-white border border-gray-100 h-full flex flex-col">
                <CardHeader className="bg-gray-900 text-white py-4 px-5 shrink-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-blue-400" />
                    Đơn hàng ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 flex-1 overflow-hidden flex flex-col">
                  <div className="space-y-3 mb-4 flex-1 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.variantId} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className="w-10 h-10 bg-gray-50 rounded-md overflow-hidden border border-gray-100 flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs text-gray-900 truncate">{item.name}</div>
                          <div className="flex justify-between items-center text-xs text-gray-500 mt-0.5">
                            <span>x{item.quantity}</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 mt-auto shrink-0">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span className="font-medium">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Phí vận chuyển:</span>
                      <span className="font-medium text-green-600">
                        {shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-gray-900">Tổng cộng:</span>
                      <span className="text-lg font-extrabold text-blue-600">
                        {formatCurrency(finalTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                    <Shield className="h-3 w-3" />
                    Bảo mật SSL 100%
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <AddressFormDialog
          open={isAddressDialogOpen}
          onOpenChange={setIsAddressDialogOpen}
        />
      </div>
    </>
  );
}
