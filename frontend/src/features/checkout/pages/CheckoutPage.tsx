import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCart } from '@/features/cart/hooks/useCart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';
import { PAYMENT_METHODS, SHIPPING_METHODS } from '@/lib/constants';
import apiClient from '@/lib/api';

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    ward: '',
    district: '',
    province: '',
  });
  
    // State
  const [shippingMethod, setShippingMethod] = useState<string>(SHIPPING_METHODS[0].id);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0].id);

  const selectedShipping = SHIPPING_METHODS.find(m => m.id === shippingMethod);
  const shippingFee = selectedShipping?.price || 0;
  const finalTotal = totalPrice + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderData = {
        items: items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        fullName: formData.fullName,
        phone: formData.phone,
        province: formData.province,
        district: formData.district,
        ward: formData.ward,
        line1: formData.address, // Map 'address' field to 'line1'
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
      <div className="container py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin giao hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Họ tên *</Label>
                      <Input
                        id="fullName"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Số điện thoại *</Label>
                      <Input
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Địa chỉ *</Label>
                    <Input
                      id="address"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="ward">Phường/Xã *</Label>
                      <Input
                        id="ward"
                        required
                        value={formData.ward}
                        onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="district">Quận/Huyện *</Label>
                      <Input
                        id="district"
                        required
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Tỉnh/TP *</Label>
                      <Input
                        id="province"
                        required
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Phương thức vận chuyển</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                    {SHIPPING_METHODS.map((method) => (
                      <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between">
                            <span>{method.name}</span>
                            <span className="font-semibold">{formatCurrency(method.price)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{method.days}</p>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Phương thức thanh toán</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    {PAYMENT_METHODS.map((method) => (
                      <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                          {method.name}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Đơn hàng ({items.length} sản phẩm)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí vận chuyển:</span>
                      <span>{formatCurrency(shippingFee)}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center mb-6">
                    <span className="font-semibold">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
