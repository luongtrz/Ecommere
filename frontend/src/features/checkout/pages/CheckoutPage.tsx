import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCart } from '@/features/cart/hooks/useCart';
import { useAddresses } from '@/features/users/hooks/useAddresses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { PAYMENT_METHODS, SHIPPING_METHODS } from '@/lib/constants';
import apiClient from '@/lib/api';
import { ArrowLeft, Truck, CreditCard, Shield, CheckCircle, MapPin, User, Phone, ShoppingBag, Plus } from 'lucide-react';
import { AddressFormDialog } from '@/features/users/components/AddressFormDialog';
import type { Address } from '@/features/users/api/users.api';

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { data: addresses } = useAddresses();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

  // Auto-select default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);

  const [shippingMethod, setShippingMethod] = useState<string>(SHIPPING_METHODS[0].id);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0].id);

  const selectedShipping = SHIPPING_METHODS.find(m => m.id === shippingMethod);
  const shippingFee = selectedShipping?.price || 0;
  const finalTotal = totalPrice + shippingFee;

  const selectedAddress = addresses?.find(addr => addr.id === selectedAddressId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddress) {
      alert('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    if (items.length === 0) {
      alert('Giỏ hàng trống');
      return;
    }

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
      clearCart();
      navigate('/orders');
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

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="container py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                  <Link to="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại giỏ hàng
                  </Link>
                </Button>
              </div>

              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Thanh toán</h1>
                <p className="text-sm text-gray-600 mt-1">{items.length} sản phẩm</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {formatCurrency(finalTotal)}
                </Badge>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mt-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-green-600">Giỏ hàng</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <span className="text-sm font-medium text-blue-600">Thanh toán</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-sm">3</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">Hoàn thành</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8 max-w-7xl">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Information */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      Địa chỉ giao hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6">
                    {!addresses || addresses.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-600 mb-4">Bạn chưa có địa chỉ giao hàng nào</p>
                        <Button type="button" onClick={() => setIsAddressDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm địa chỉ mới
                        </Button>
                      </div>
                    ) : (
                      <>
                        <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                          {addresses.map((address) => (
                            <div key={address.id} className="relative">
                              <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                selectedAddressId === address.id
                                  ? 'border-blue-500 bg-blue-50 shadow-md'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}>
                                <div className="flex items-start gap-3">
                                  <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                                  <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-semibold text-gray-900">{address.fullName}</span>
                                      {address.isDefault && (
                                        <Badge variant="default" className="bg-green-500 text-xs">
                                          Mặc định
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">
                                      <Phone className="h-3 w-3 inline mr-1" />
                                      {address.phone}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                      {address.line1}, {address.ward}, {address.district}, {address.province}
                                    </p>
                                  </Label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setIsAddressDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm địa chỉ mới
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Method */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      Phương thức vận chuyển
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-3">
                      {SHIPPING_METHODS.map((method) => (
                        <div key={method.id} className="relative">
                          <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            shippingMethod === method.id
                              ? 'border-green-500 bg-green-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value={method.id} id={method.id} className="mt-0.5" />
                              <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-semibold text-gray-900">{method.name}</div>
                                    <div className="text-sm text-gray-600 mt-1">{method.days}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-lg text-green-600">{formatCurrency(method.price)}</div>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      Phương thức thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                      {PAYMENT_METHODS.map((method) => (
                        <div key={method.id} className="relative">
                          <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            paymentMethod === method.id
                              ? 'border-purple-500 bg-purple-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value={method.id} id={method.id} className="mt-0.5" />
                              <Label htmlFor={method.id} className="flex-1 cursor-pointer font-medium">
                                {method.name}
                              </Label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <Card className="shadow-xl sticky top-24">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-blue-600" />
                      Đơn hàng ({items.length} sản phẩm)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Order Items */}
                    <div className="space-y-4 mb-6">
                      {items.slice(0, 3).map((item) => (
                        <div key={item.variantId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            <div className="text-xs text-gray-600">{item.scent} - {item.volumeMl}ml</div>
                            <div className="text-xs text-gray-500">SL: {item.quantity}</div>
                          </div>
                          <div className="font-semibold text-sm">{formatCurrency(item.price)}</div>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          và {items.length - 3} sản phẩm khác...
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Price Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tạm tính ({items.length} sản phẩm):</span>
                        <span className="font-medium">{formatCurrency(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Phí vận chuyển:
                        </span>
                        <span className="font-medium text-green-600">
                          {shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}
                        </span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg font-semibold">Tổng cộng:</span>
                      <span className="text-3xl font-bold text-blue-600">
                        {formatCurrency(finalTotal)}
                      </span>
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <Shield className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <div className="text-xs font-medium text-gray-900">Bảo mật</div>
                      </div>
                      <div className="text-center">
                        <Truck className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        <div className="text-xs font-medium text-gray-900">Giao hàng</div>
                      </div>
                      <div className="text-center">
                        <CheckCircle className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                        <div className="text-xs font-medium text-gray-900">Đảm bảo</div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Đang xử lý...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Đặt hàng ngay
                        </div>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center mt-3">
                      Bằng việc đặt hàng, bạn đồng ý với{' '}
                      <Link to="/terms" className="text-blue-600 hover:underline">
                        điều khoản sử dụng
                      </Link>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>

        <AddressFormDialog
          open={isAddressDialogOpen}
          onOpenChange={setIsAddressDialogOpen}
        />
      </div>
    </>
  );
}
