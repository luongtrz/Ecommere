import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { SEO } from '@/lib/seo';
import { useCart } from '@/features/cart/hooks/useCart';
import { useAddresses } from '@/features/users/hooks/useAddresses';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCurrency } from '@/lib/formatters';
import { PAYMENT_METHODS, SHIPPING_METHODS, QUERY_KEYS } from '@/lib/constants';
import apiClient from '@/lib/api';
import {
  ArrowLeft,
  Truck,
  CreditCard,
  MapPin,
  Shield,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { AddressFormDialog } from '@/features/users/components/AddressFormDialog';
import { CheckoutSteps } from '../components/CheckoutSteps';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

function generateCheckoutKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { data: addresses } = useAddresses();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const checkoutKeyRef = useRef<{ key: string; fingerprint: string } | null>(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrdered, setIsOrdered] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

  // Default selections
  const [shippingMethod, setShippingMethod] = useState<string>(SHIPPING_METHODS[0].id);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0].id);

  // Mobile collapsed summary
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  // Server-confirmed preview state
  const [serverShippingFee, setServerShippingFee] = useState<number | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [serverDiscount, setServerDiscount] = useState<number>(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPreviewConfirmed, setIsPreviewConfirmed] = useState(false);
  const [previewRetryTrigger, setPreviewRetryTrigger] = useState(0);

  // Auto-select default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses?.find((addr) => addr.id === selectedAddressId);
  const selectedShipping = SHIPPING_METHODS.find((m) => m.id === shippingMethod);
  const shippingFee = serverShippingFee;
  const finalTotal = serverTotal;

  const itemsFingerprint = items
    .map((i) => `${i.variantId}:${i.quantity}:${i.price}`)
    .join(',');

  useEffect(() => {
    if (!selectedAddress) {
      setIsPreviewLoading(false);
      setIsPreviewConfirmed(false);
      setServerShippingFee(null);
      setServerTotal(null);
      setServerDiscount(0);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    setIsPreviewLoading(true);
    setIsPreviewConfirmed(false);

    const fetchPreview = async () => {
      try {
        const previewBody = {
          addressId: selectedAddress.id,
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingMethod,
        };

        const response = await apiClient.post('/orders/preview', previewBody, {
          signal: controller.signal,
        });

        if (isCancelled) return;

        const resData = response.data?.data ?? response.data;
        const fee = typeof resData?.shippingFee === 'number' ? resData.shippingFee : 0;
        const discount = typeof resData?.discount === 'number' ? resData.discount : 0;
        const total =
          typeof resData?.total === 'number'
            ? resData.total
            : typeof resData?.subtotal === 'number'
            ? resData.subtotal - discount + fee
            : totalPrice + fee;

        setServerShippingFee(fee);
        setServerDiscount(discount);
        setServerTotal(total);
        setIsPreviewConfirmed(true);
      } catch (error: any) {
        if (
          isCancelled ||
          error?.name === 'CanceledError' ||
          error?.code === 'ERR_CANCELED'
        ) {
          return;
        }

        console.error('Order preview failed:', error);
        setServerShippingFee(null);
        setServerTotal(null);
        setServerDiscount(0);
        setIsPreviewConfirmed(false);

        const serverMessage = error?.response?.data?.message;
        const message =
          (Array.isArray(serverMessage)
            ? serverMessage
                .map((m: any) => (typeof m === 'string' ? m : String(m)))
                .filter(Boolean)
                .join(', ')
            : null) ||
          (typeof serverMessage === 'string' && serverMessage.trim()
            ? serverMessage
            : null) ||
          'Không thể tính phí vận chuyển. Vui lòng thử lại.';

        toast.error(message, {
          action: {
            label: 'Thử lại',
            onClick: () => setPreviewRetryTrigger((prev) => prev + 1),
          },
        });
      } finally {
        if (!isCancelled) {
          setIsPreviewLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [
    selectedAddress?.id,
    selectedAddress?.province,
    shippingMethod,
    itemsFingerprint,
    totalPrice,
    previewRetryTrigger,
  ]);

  const handleNextStep = () => {
    if (step === 1 && !selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    if (!isPreviewConfirmed) {
      toast.error('Phí vận chuyển chưa được xác nhận. Vui lòng thử lại.');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (
      isOrdered ||
      !selectedAddress ||
      !isPreviewConfirmed ||
      isPreviewLoading ||
      shippingFee === null ||
      finalTotal === null
    ) {
      return;
    }

    const fingerprint = JSON.stringify({
      addressId: selectedAddress.id,
      address: [
        selectedAddress.fullName,
        selectedAddress.phone,
        selectedAddress.province,
        selectedAddress.district,
        selectedAddress.ward,
        selectedAddress.line1,
      ],
      paymentMethod,
      shippingMethod,
      items: items.map((i) => [i.variantId, i.quantity, i.price]),
    });

    let key: string;
    if (!checkoutKeyRef.current || checkoutKeyRef.current.fingerprint !== fingerprint) {
      key = generateCheckoutKey();
      checkoutKeyRef.current = { key, fingerprint };
    } else {
      key = checkoutKeyRef.current.key;
    }

    setIsSubmitting(true);
    let orderCreated = false;

    try {
      const orderData = {
        checkoutKey: key,
        addressId: selectedAddress.id,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentMethod,
        shippingMethod,
        shippingFee,
        total: finalTotal,
      };

      await apiClient.post('/orders/checkout', orderData);
      orderCreated = true;
      setIsOrdered(true);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
    } catch (error) {
      console.error('Order creation failed:', error);
      const serverMessage = (error as any)?.response?.data?.message;
      const message =
        (Array.isArray(serverMessage)
          ? serverMessage
              .map((m: any) => (typeof m === 'string' ? m : String(m)))
              .filter(Boolean)
              .join(', ')
          : null) ||
        (typeof serverMessage === 'string' && serverMessage.trim()
          ? serverMessage
          : null) ||
        'Đặt hàng thất bại. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }

    if (orderCreated) {
      try {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
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

      <div className="min-h-screen bg-background pb-16 md:pb-24">
        {/* Top Header */}
        <header className="border-b border-border bg-card sticky top-0 z-40">
          <div className="container flex h-14 items-center justify-between">
            <Link
              to="/cart"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại giỏ hàng</span>
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-success" />
              <span>An toàn</span>
            </div>
          </div>
        </header>

        <main className="container max-w-6xl py-8 md:py-12">
          {/* Page Heading & Stepper */}
          <div className="mb-8 md:mb-12">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-foreground text-left mb-6">
              Thanh toán
            </h1>
            <CheckoutSteps currentStep={step} />
          </div>

          {/* Mobile Collapsed Summary */}
          <div className="lg:hidden mb-8 border border-border bg-card rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-secondary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={isMobileSummaryOpen}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground">
                  Đơn hàng của bạn ({items.length} sản phẩm)
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    isMobileSummaryOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
              <span className="text-sm font-semibold tabular text-foreground">
                {isPreviewLoading ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang tính...
                  </span>
                ) : finalTotal !== null ? (
                  formatCurrency(finalTotal)
                ) : (
                  formatCurrency(totalPrice)
                )}
              </span>
            </button>

            {isMobileSummaryOpen && (
              <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <div
                      key={item.variantId}
                      className="flex gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">
                          {item.name}
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                          <span>
                            Sl: <span className="tabular">{item.quantity}</span>
                          </span>
                          <span className="font-medium text-foreground tabular">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-3 border-t border-border text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tạm tính</span>
                    <span className="font-medium text-foreground tabular">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  {serverDiscount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Giảm giá</span>
                      <span className="font-medium text-success tabular">
                        -{formatCurrency(serverDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium text-foreground tabular">
                      {isPreviewLoading ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Đang tính...
                        </span>
                      ) : shippingFee !== null ? (
                        shippingFee === 0 ? (
                          'Miễn phí'
                        ) : (
                          formatCurrency(shippingFee)
                        )
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grid Layout: Left form (1fr) + Right summary (400px) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start">
            {/* LEFT COLUMN: Form sections separated by 1px hairlines */}
            <div className="space-y-8">
              {/* STEP 1: ADDRESS & SHIPPING */}
              {step === 1 && (
                <div className="space-y-8">
                  {/* Section 1: Address */}
                  <section aria-labelledby="address-heading">
                    <div className="flex items-center justify-between mb-4">
                      <h2
                        id="address-heading"
                        className="font-sans font-semibold text-lg text-foreground flex items-center gap-2"
                      >
                        <span className="text-muted-foreground">1.</span>
                        <span>Địa chỉ giao hàng</span>
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddressDialogOpen(true)}
                        className="text-sm font-medium hover:bg-secondary"
                      >
                        + Thêm mới
                      </Button>
                    </div>

                    {!addresses || addresses.length === 0 ? (
                      <div className="text-center py-12 rounded-lg border border-dashed border-border bg-card">
                        <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Bạn chưa có địa chỉ nào
                        </p>
                        <Button onClick={() => setIsAddressDialogOpen(true)}>
                          Thêm địa chỉ ngay
                        </Button>
                      </div>
                    ) : (
                      <RadioGroup
                        value={selectedAddressId}
                        onValueChange={setSelectedAddressId}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {addresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <label
                              key={addr.id}
                              htmlFor={`address-${addr.id}`}
                              className={`
                                relative p-4 rounded-md border text-left cursor-pointer transition-colors
                                focus-within:ring-2 focus-within:ring-ring
                                ${
                                  isSelected
                                    ? 'border-primary bg-secondary'
                                    : 'border-border hover:border-foreground/30 bg-card'
                                }
                              `}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div className="font-medium text-foreground text-sm">
                                  {addr.fullName}
                                </div>
                                <RadioGroupItem
                                  value={addr.id}
                                  id={`address-${addr.id}`}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground mb-2">
                                {addr.phone}
                              </div>
                              <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                {addr.line1}, {addr.ward}, {addr.district},{' '}
                                {addr.province}
                              </div>
                              {addr.isDefault && (
                                <div className="mt-3">
                                  <Badge
                                    variant="secondary"
                                    className="rounded-sm font-normal text-xs"
                                  >
                                    Mặc định
                                  </Badge>
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </RadioGroup>
                    )}
                  </section>

                  {/* Section 2: Shipping Method (Separated by border-t border-border pt-8) */}
                  <section
                    aria-labelledby="shipping-heading"
                    className="border-t border-border pt-8"
                  >
                    <h2
                      id="shipping-heading"
                      className="font-sans font-semibold text-lg text-foreground flex items-center gap-2 mb-4"
                    >
                      <span className="text-muted-foreground">2.</span>
                      <span>Phương thức vận chuyển</span>
                    </h2>

                    <RadioGroup
                      value={shippingMethod}
                      onValueChange={setShippingMethod}
                      className="grid grid-cols-1 gap-3"
                    >
                      {SHIPPING_METHODS.map((method) => {
                        const isSelected = shippingMethod === method.id;
                        return (
                          <label
                            key={method.id}
                            htmlFor={`shipping-${method.id}`}
                            className={`
                              flex items-center justify-between p-4 rounded-md border cursor-pointer transition-colors
                              focus-within:ring-2 focus-within:ring-ring
                              ${
                                isSelected
                                  ? 'border-primary bg-secondary'
                                  : 'border-border hover:border-foreground/30 bg-card'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem
                                value={method.id}
                                id={`shipping-${method.id}`}
                              />
                              <Truck className="h-5 w-5 text-muted-foreground shrink-0" />
                              <div>
                                <div className="font-medium text-sm text-foreground">
                                  {method.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Nhận hàng trong {method.days}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-sm text-foreground tabular">
                                {formatCurrency(method.price)}
                              </div>
                              {isSelected && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Đã chọn
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </RadioGroup>
                  </section>
                </div>
              )}

              {/* STEP 2: PAYMENT METHOD */}
              {step === 2 && (
                <div className="space-y-8">
                  <section aria-labelledby="payment-heading">
                    <h2
                      id="payment-heading"
                      className="font-sans font-semibold text-lg text-foreground flex items-center gap-2 mb-4"
                    >
                      <span className="text-muted-foreground">1.</span>
                      <span>Chọn phương thức thanh toán</span>
                    </h2>

                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(val) => setPaymentMethod(val)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {PAYMENT_METHODS.map((method) => {
                        const isCOD = method.id === 'COD';
                        const isSelected = paymentMethod === method.id;

                        return (
                          <label
                            key={method.id}
                            htmlFor={`payment-${method.id}`}
                            className={`
                              relative p-4 rounded-md border transition-colors flex flex-col justify-between gap-4 text-left
                              ${
                                isSelected
                                  ? 'border-primary bg-secondary cursor-pointer focus-within:ring-2 focus-within:ring-ring'
                                  : isCOD
                                  ? 'border-border hover:border-foreground/30 bg-card cursor-pointer focus-within:ring-2 focus-within:ring-ring'
                                  : 'border-border/60 bg-muted/40 opacity-60 cursor-not-allowed'
                              }
                            `}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {method.id === 'COD' ? (
                                  <Truck className="h-5 w-5 text-muted-foreground shrink-0" />
                                ) : (
                                  <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                                )}
                                <div>
                                  <div className="font-medium text-sm text-foreground">
                                    {method.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {method.id === 'COD' ? (
                                      'Thanh toán khi nhận hàng'
                                    ) : (
                                      <Badge
                                        variant="secondary"
                                        className="rounded-sm font-normal text-xs"
                                      >
                                        Đang bảo trì
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {isCOD && (
                                <RadioGroupItem
                                  value={method.id}
                                  id={`payment-${method.id}`}
                                  disabled={!isCOD}
                                />
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </RadioGroup>
                  </section>
                </div>
              )}

              {/* STEP 3: CONFIRM */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="border border-border bg-card rounded-lg p-6 text-center">
                    <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-3" />
                    <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">
                      Sẵn sàng đặt hàng!
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Vui lòng kiểm tra lại thông tin đơn hàng lần cuối trước khi xác nhận.
                    </p>
                  </div>

                  <div className="space-y-8">
                    {/* Section 1: Delivery Address */}
                    <section aria-labelledby="confirm-address-heading">
                      <h3
                        id="confirm-address-heading"
                        className="font-sans font-semibold text-lg text-foreground flex items-center gap-2 mb-3"
                      >
                        <span className="text-muted-foreground">1.</span>
                        <span>Giao tới</span>
                      </h3>
                      <div className="border border-border bg-card rounded-lg p-4 space-y-1">
                        <div className="font-medium text-foreground text-sm">
                          {selectedAddress?.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedAddress?.phone}
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {selectedAddress?.line1}, {selectedAddress?.ward},{' '}
                          {selectedAddress?.district}, {selectedAddress?.province}
                        </div>
                      </div>
                    </section>

                    {/* Section 2: Payment & Shipping */}
                    <section
                      aria-labelledby="confirm-methods-heading"
                      className="border-t border-border pt-8"
                    >
                      <h3
                        id="confirm-methods-heading"
                        className="font-sans font-semibold text-lg text-foreground flex items-center gap-2 mb-3"
                      >
                        <span className="text-muted-foreground">2.</span>
                        <span>Thanh toán & Vận chuyển</span>
                      </h3>
                      <div className="border border-border bg-card rounded-lg p-4 divide-y divide-border">
                        <div className="pb-3">
                          <div className="text-xs text-muted-foreground mb-1">
                            Phương thức vận chuyển
                          </div>
                          <div className="font-medium text-sm text-foreground flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            {selectedShipping?.name}
                          </div>
                        </div>
                        <div className="pt-3">
                          <div className="text-xs text-muted-foreground mb-1">
                            Phương thức thanh toán
                          </div>
                          <div className="font-medium text-sm text-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.name}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {/* Step Navigation for Left Column on Desktop */}
              {step > 1 && (
                <div className="hidden lg:flex items-center pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handleBackStep}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </Button>
                </div>
              )}

              {/* Mobile Actions: Buttons at the end of the form */}
              <div className="lg:hidden pt-6 border-t border-border space-y-3">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={step < 3 ? handleNextStep : handleSubmit}
                  disabled={
                    (step === 1 && !selectedAddress) ||
                    isSubmitting ||
                    isOrdered ||
                    isPreviewLoading ||
                    !isPreviewConfirmed
                  }
                >
                  {step < 3 ? (
                    <span className="flex items-center justify-center gap-2">
                      Tiếp tục <ChevronRight className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {isSubmitting
                        ? 'Đang xử lý...'
                        : isPreviewLoading
                        ? 'Đang tính phí...'
                        : 'Xác nhận đặt hàng'}
                    </span>
                  )}
                </Button>
                {step > 1 && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleBackStep}
                    className="w-full"
                  >
                    Quay lại
                  </Button>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary (Sticky .surface block) */}
            <div className="hidden lg:block lg:sticky lg:top-24">
              <div className="surface p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <h2 className="font-sans font-semibold text-base text-foreground">
                    Đơn hàng của bạn
                  </h2>
                  <Badge
                    variant="secondary"
                    className="rounded-sm font-normal text-xs"
                  >
                    {items.length} sản phẩm
                  </Badge>
                </div>

                {/* Item rows (56px image, name, qty, price tabular) with divide-y */}
                <div className="divide-y divide-border max-h-[360px] overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.variantId}
                      className="flex gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="font-medium text-sm text-foreground truncate">
                          {item.name}
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>
                            Sl: <span className="tabular">{item.quantity}</span>
                          </span>
                          <span className="font-medium text-foreground tabular">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals rows */}
                <div className="space-y-2 pt-4 border-t border-border text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tạm tính</span>
                    <span className="font-medium text-foreground tabular">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  {serverDiscount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Giảm giá</span>
                      <span className="font-medium text-success tabular">
                        -{formatCurrency(serverDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium text-foreground tabular">
                      {isPreviewLoading ? (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Đang tính...
                        </span>
                      ) : shippingFee !== null ? (
                        shippingFee === 0 ? (
                          'Miễn phí'
                        ) : (
                          formatCurrency(shippingFee)
                        )
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                </div>

                {/* Total line text-xl font-semibold */}
                <div className="pt-4 border-t border-border flex justify-between items-baseline">
                  <span className="font-semibold text-base text-foreground">
                    Tổng thanh toán
                  </span>
                  <span className="text-xl font-semibold tabular text-foreground">
                    {isPreviewLoading ? (
                      <span className="inline-flex items-center gap-1.5 text-base font-normal text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tính...
                      </span>
                    ) : finalTotal !== null ? (
                      formatCurrency(finalTotal)
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                {/* Primary full-width Button size="lg" to place the order */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={step < 3 ? handleNextStep : handleSubmit}
                  disabled={
                    (step === 1 && !selectedAddress) ||
                    isSubmitting ||
                    isOrdered ||
                    isPreviewLoading ||
                    !isPreviewConfirmed
                  }
                >
                  {step < 3 ? (
                    <span className="flex items-center justify-center gap-2">
                      Tiếp tục <ChevronRight className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {isSubmitting
                        ? 'Đang xử lý...'
                        : isPreviewLoading
                        ? 'Đang tính phí...'
                        : 'Xác nhận đặt hàng'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>

        <AddressFormDialog
          open={isAddressDialogOpen}
          onOpenChange={setIsAddressDialogOpen}
        />
      </div>
    </>
  );
}
