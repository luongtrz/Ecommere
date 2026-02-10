import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCart } from '@/features/cart/hooks/useCart';
import { useAddresses } from '@/features/users/hooks/useAddresses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { PAYMENT_METHODS, SHIPPING_METHODS } from '@/lib/constants';
import apiClient from '@/lib/api';
import { ArrowLeft, Truck, CreditCard, CheckCircle, MapPin, Phone, ShoppingBag, Plus, Shield, Package } from 'lucide-react';
import { AddressFormDialog } from '@/features/users/components/AddressFormDialog';

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
      alert('Vui long chon dia chi giao hang');
      return;
    }

    if (items.length === 0) {
      alert('Gio hang trong');
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
      alert('Dat hang that bai. Vui long thu lai.');
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
      <SEO title="Thanh toan" />

      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 shadow-sm sticky top-0 z-40">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild className="p-0 h-auto rounded-full hover:bg-gray-100 pr-3">
                  <Link to="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <ArrowLeft className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Quay lai gio hang</span>
                  </Link>
                </Button>
              </div>

              <div className="hidden md:flex items-center gap-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium border border-green-100">
                  <Shield className="h-3.5 w-3.5" />
                  Thanh toan an toan 100%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8 max-w-6xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-10 animate-fade-in">
            <div className="flex items-center w-full max-w-2xl px-4">
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Gio hang</span>
              </div>
              <div className="flex-1 h-1 bg-green-200 -mx-4 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500" />
              </div>
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-white">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Thanh toan</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 -mx-4 rounded-full" />
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Hoan tat</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                {/* Shipping Information */}
                <Card className="shadow-sm border border-gray-100 overflow-hidden rounded-2xl group hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-gray-100">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-800">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600 border border-blue-100">
                        <MapPin className="h-5 w-5" />
                      </div>
                      Dia chi giao hang
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6 bg-white">
                    {!addresses || addresses.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 mb-4 font-medium">Ban chua co dia chi giao hang nao</p>
                        <Button type="button" onClick={() => setIsAddressDialogOpen(true)} className="rounded-xl shadow-lg shadow-blue-500/10">
                          <Plus className="h-4 w-4 mr-2" />
                          Them dia chi moi
                        </Button>
                      </div>
                    ) : (
                      <>
                        <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId} className="grid grid-cols-1 gap-4">
                          {addresses.map((address) => (
                            <div key={address.id} className="relative">
                              <RadioGroupItem value={address.id} id={address.id} className="peer sr-only" />
                              <Label
                                htmlFor={address.id}
                                className="flex items-start gap-4 p-5 rounded-xl border-2 border-gray-100 cursor-pointer transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50/30 peer-checked:shadow-sm hover:border-blue-200 hover:bg-gray-50"
                              >
                                <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center mt-0.5 peer-checked:border-blue-600 peer-checked:bg-blue-600 transition-colors">
                                  <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="font-bold text-gray-900 text-base">{address.fullName}</span>
                                    {address.isDefault && (
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs py-0.5 px-2 rounded-full">
                                        Mac dinh
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                    {address.phone}
                                  </div>
                                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-100/50 p-2 rounded-lg">
                                    {address.line1}, {address.ward}, {address.district}, {address.province}
                                  </p>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full mt-2 rounded-xl border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 h-12"
                          onClick={() => setIsAddressDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Them dia chi moi
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Method */}
                <Card className="shadow-sm border border-gray-100 overflow-hidden rounded-2xl group hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-b border-gray-100">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-800">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-600 border border-green-100">
                        <Truck className="h-5 w-5" />
                      </div>
                      Phuong thuc van chuyen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 bg-white">
                    <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-3">
                      {SHIPPING_METHODS.map((method) => (
                        <div key={method.id} className="relative">
                          <RadioGroupItem value={method.id} id={method.id} className="peer sr-only" />
                          <Label
                            htmlFor={method.id}
                            className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 cursor-pointer transition-all peer-checked:border-green-500 peer-checked:bg-green-50/30 peer-checked:shadow-sm hover:border-green-200 hover:bg-gray-50"
                          >
                            <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center peer-checked:border-green-600 peer-checked:bg-green-600 transition-colors">
                              <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{method.name}</div>
                              <div className="text-sm text-gray-500 mt-0.5">{method.days}</div>
                            </div>
                            <div className="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                              {formatCurrency(method.price)}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card className="shadow-sm border border-gray-100 overflow-hidden rounded-2xl group hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-b border-gray-100">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-800">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-purple-600 border border-purple-100">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      Phuong thuc thanh toan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 bg-white">
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                      {PAYMENT_METHODS.map((method) => (
                        <div key={method.id} className="relative">
                          <RadioGroupItem value={method.id} id={method.id} className="peer sr-only" />
                          <Label
                            htmlFor={method.id}
                            className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 cursor-pointer transition-all peer-checked:border-purple-500 peer-checked:bg-purple-50/30 peer-checked:shadow-sm hover:border-purple-200 hover:bg-gray-50"
                          >
                            <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center peer-checked:border-purple-600 peer-checked:bg-purple-600 transition-colors">
                              <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100" />
                            </div>
                            <div className="font-medium text-gray-900">{method.name}</div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="sticky top-24 space-y-6">
                  <Card className="shadow-lg border-0 overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl ring-1 ring-black/5">
                    <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-blue-400" />
                        Don hang ({items.length} san pham)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Order Items */}
                      <div className="space-y-4 mb-6 max-h-[240px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {items.map((item) => (
                          <div key={item.variantId} className="flex gap-3 py-2">
                            <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">{item.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{item.scent} - {item.volumeMl}ml</div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-gray-500">x{item.quantity}</span>
                                <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      {/* Price Breakdown */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-base">
                          <span className="text-gray-600">Tam tinh:</span>
                          <span className="font-medium">{formatCurrency(totalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-base">
                          <span className="text-gray-600 flex items-center gap-1.5">
                            <Truck className="h-4 w-4" />
                            Phi van chuyen:
                          </span>
                          <span className="font-medium text-green-600">
                            {shippingFee === 0 ? 'Mien phi' : formatCurrency(shippingFee)}
                          </span>
                        </div>
                      </div>

                      <Separator className="my-6 bg-gray-200" />

                      <div className="flex justify-between items-end mb-6">
                        <span className="text-lg font-bold text-gray-900">Tong cong:</span>
                        <div className="text-right">
                          <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            {formatCurrency(finalTotal)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">Da bao gom VAT</div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Dang xu ly...' : 'Dat hang ngay'}
                      </Button>

                      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <Shield className="h-3 w-3" />
                        Thong tin duoc bao mat tuyet doi
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
