import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { SEO } from '@/lib/seo';
import { useCart } from '@/features/cart/hooks/useCart';
import { useAddresses } from '@/features/users/hooks/useAddresses';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle2,
  Circle,
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

  const checkoutKeyRef = useRef<{ key: string; fingerprint: string } | null>(
    null,
  );

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrdered, setIsOrdered] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

  // Default selections
  const [shippingMethod, setShippingMethod] = useState<string>(
    SHIPPING_METHODS[0].id,
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    PAYMENT_METHODS[0].id,
  );

  // Server-confirmed preview state
  const [serverShippingFee, setServerShippingFee] = useState<number | null>(
    null,
  );
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [serverDiscount, setServerDiscount] = useState<number>(0);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPreviewConfirmed, setIsPreviewConfirmed] = useState(false);
  const [previewRetryTrigger, setPreviewRetryTrigger] = useState(0);

  // Auto-select default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddress =
        addresses.find((addr) => addr.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses?.find(
    (addr) => addr.id === selectedAddressId,
  );
  const selectedShipping = SHIPPING_METHODS.find(
    (m) => m.id === shippingMethod,
  );
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
        const fee =
          typeof resData?.shippingFee === 'number' ? resData.shippingFee : 0;
        const discount =
          typeof resData?.discount === 'number' ? resData.discount : 0;
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
    // itemsFingerprint stands in for items: the effect re-runs only when cart content changes,
    // not when the items array identity changes between renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (
      !checkoutKeyRef.current ||
      checkoutKeyRef.current.fingerprint !== fingerprint
    ) {
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

      <div className="min-h-screen bg-slate-50 pb-20">
        {/* Modern Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
          <div className="container max-w-7xl py-3.5 flex items-center justify-between px-4">
            <Link
              to="/cart"
              className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 transition-transform group-hover:-translate-x-0.5">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="font-medium text-sm">Quay lại giỏ hàng</span>
            </Link>
            <div className="font-sans font-bold text-lg md:text-xl tracking-tight text-slate-900">
              Thanh toán
            </div>
            <div className="w-32 flex justify-end">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                An toàn
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-7xl pt-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* LEFT COLUMN: MAIN PROCESS */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 md:gap-8">
              {/* Steps Indicator */}
              <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-slate-200">
                <CheckoutSteps currentStep={step} />
              </div>

              {/* Step Content */}
              <div>
                {/* STEP 1: ADDRESS & SHIPPING */}
                {step === 1 && (
                  <div className="space-y-6">
                    {/* Address Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg md:text-xl font-sans font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
                          <MapPin className="h-5 w-5 text-teal-600" />
                          Địa chỉ giao hàng
                        </h2>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddressDialogOpen(true)}
                          className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-teal-600 hover:text-teal-700 font-medium text-xs px-3 h-8 shadow-sm transition-colors duration-200"
                        >
                          + Thêm mới
                        </Button>
                      </div>

                      {!addresses || addresses.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200 p-6">
                          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                            <MapPin className="h-7 w-7" />
                          </div>
                          <p className="text-sm text-slate-500 mb-4">
                            Bạn chưa có địa chỉ nào
                          </p>
                          <Button
                            onClick={() => setIsAddressDialogOpen(true)}
                            className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-medium text-sm shadow-sm h-10 px-5 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-teal-500"
                          >
                            Thêm địa chỉ ngay
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {addresses.map((addr) => (
                            <div
                              key={addr.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`relative p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                                selectedAddressId === addr.id
                                  ? 'border-teal-600 bg-teal-50/40 shadow-sm ring-1 ring-teal-600/20'
                                  : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-sans font-semibold text-slate-900">
                                  {addr.fullName}
                                </div>
                                {selectedAddressId === addr.id ? (
                                  <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
                                ) : (
                                  <Circle className="h-5 w-5 text-slate-300 group-hover:text-slate-400 shrink-0" />
                                )}
                              </div>
                              <div className="text-sm text-slate-500 mb-2">
                                {addr.phone}
                              </div>
                              <div className="text-sm text-slate-700 leading-relaxed min-h-[40px]">
                                {addr.line1}, {addr.ward}, {addr.district},{' '}
                                {addr.province}
                              </div>
                              {addr.isDefault && (
                                <div className="mt-3">
                                  <Badge
                                    variant="secondary"
                                    className="bg-slate-100 text-slate-700 font-medium rounded-md px-2 py-0.5 text-[10px] border border-slate-200"
                                  >
                                    Mặc định
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator className="bg-slate-200" />

                    {/* Shipping Section */}
                    <div className="space-y-4">
                      <h2 className="text-lg md:text-xl font-sans font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
                        <Truck className="h-5 w-5 text-teal-600" />
                        Phương thức vận chuyển
                      </h2>
                      <div className="grid grid-cols-1 gap-3">
                        {SHIPPING_METHODS.map((method) => (
                          <div
                            key={method.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setShippingMethod(method.id)}
                            className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              shippingMethod === method.id
                                ? 'border-teal-600 bg-teal-50/40 shadow-sm ring-1 ring-teal-600/20'
                                : 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                                  shippingMethod === method.id
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                <Truck className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-sans font-semibold text-slate-900 text-sm sm:text-base">
                                  {method.name}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-500">
                                  Nhận hàng trong {method.days}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-sans font-semibold text-slate-900 tabular-nums text-sm sm:text-base">
                                {formatCurrency(method.price)}
                              </div>
                              {shippingMethod === method.id && (
                                <div className="text-[10px] text-teal-700 font-semibold uppercase tracking-wider mt-0.5">
                                  Đã chọn
                                </div>
                              )}
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
                    <h2 className="text-lg md:text-xl font-sans font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
                      <CreditCard className="h-5 w-5 text-teal-600" />
                      Chọn phương thức thanh toán
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {PAYMENT_METHODS.map((method) => {
                        const isCOD = method.id === 'COD';
                        return (
                          <div
                            key={method.id}
                            role="button"
                            tabIndex={isCOD ? 0 : -1}
                            aria-disabled={!isCOD}
                            onClick={() => isCOD && setPaymentMethod(method.id)}
                            className={`relative p-5 sm:p-6 rounded-xl border-2 transition-all duration-200 flex flex-col items-center text-center gap-3.5 ${
                              paymentMethod === method.id
                                ? 'border-teal-600 bg-teal-50/40 shadow-sm ring-1 ring-teal-600/20 cursor-pointer'
                                : isCOD
                                  ? 'border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md cursor-pointer'
                                  : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                paymentMethod === method.id
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {method.id === 'COD' ? (
                                <Truck className="h-6 w-6" />
                              ) : (
                                <CreditCard className="h-6 w-6" />
                              )}
                            </div>

                            <div>
                              <div
                                className={`font-sans font-semibold text-base mb-1 ${paymentMethod === method.id ? 'text-teal-900' : 'text-slate-900'}`}
                              >
                                {method.name}
                              </div>
                              <div className="text-xs sm:text-sm text-slate-500">
                                {method.id === 'COD' ? (
                                  'Thanh toán khi nhận hàng'
                                ) : (
                                  <span className="text-rose-600 font-medium text-xs bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                                    Đang bảo trì
                                  </span>
                                )}
                              </div>
                            </div>

                            {paymentMethod === method.id && (
                              <div className="absolute top-4 right-4">
                                <CheckCircle2 className="h-5 w-5 text-teal-600" />
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
                    <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-200 text-center">
                      <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600 border border-teal-100">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-sans font-bold text-slate-900 mb-2 tracking-tight">
                        Sẵn sàng đặt hàng!
                      </h2>
                      <p className="text-slate-600 max-w-md mx-auto text-sm">
                        Vui lòng kiểm tra lại thông tin đơn hàng lần cuối trước
                        khi xác nhận.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                        <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider block mb-3">
                          Giao tới
                        </span>
                        <div className="font-sans font-semibold text-slate-900 text-base mb-1">
                          {selectedAddress?.fullName}
                        </div>
                        <div className="text-slate-500 text-sm mb-2">
                          {selectedAddress?.phone}
                        </div>
                        <div className="text-slate-700 text-sm leading-relaxed">
                          {selectedAddress?.line1}, {selectedAddress?.ward},{' '}
                          {selectedAddress?.district},{' '}
                          {selectedAddress?.province}
                        </div>
                      </div>

                      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200">
                        <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider block mb-3">
                          Thanh toán & Vận chuyển
                        </span>
                        <div className="space-y-3.5">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">
                              Phương thức vận chuyển
                            </div>
                            <div className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                              <Truck className="h-4 w-4 text-teal-600" />
                              {selectedShipping?.name}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">
                              Phương thức thanh toán
                            </div>
                            <div className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                              <CreditCard className="h-4 w-4 text-teal-600" />
                              {
                                PAYMENT_METHODS.find(
                                  (p) => p.id === paymentMethod,
                                )?.name
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Action Bar for Mobile/Tablet or Inline for Desktop */}
              <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 -mx-4 lg:mx-0 lg:rounded-xl lg:border lg:bg-white lg:p-5 lg:mt-2 sticky bottom-0 z-30 lg:relative lg:z-0 shadow-sm">
                <div className="flex gap-3 sm:gap-4">
                  {step > 1 && (
                    <Button
                      variant="outline"
                      onClick={handleBackStep}
                      className="h-11 w-28 sm:w-32 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-medium text-slate-700 text-sm transition-colors duration-200"
                    >
                      Quay lại
                    </Button>
                  )}
                  <Button
                    onClick={step < 3 ? handleNextStep : handleSubmit}
                    disabled={
                      (step === 1 && !selectedAddress) ||
                      isSubmitting ||
                      isOrdered ||
                      isPreviewLoading ||
                      !isPreviewConfirmed
                    }
                    className="h-11 flex-1 rounded-lg text-sm sm:text-base font-medium shadow-sm transition-colors duration-200 bg-teal-600 hover:bg-teal-700 text-white focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {step < 3 ? (
                      <span className="flex items-center gap-2">
                        Tiếp tục <ChevronRight className="h-5 w-5" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
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

            {/* RIGHT COLUMN: SUMMARY (Sticky) */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-sans font-semibold text-base sm:text-lg text-slate-900 flex items-center justify-between tracking-tight">
                      <span>Đơn hàng của bạn</span>
                      <Badge
                        variant="secondary"
                        className="bg-white text-slate-700 border-slate-200 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums"
                      >
                        {items.length} sản phẩm
                      </Badge>
                    </h3>
                  </div>

                  <div className="p-4 sm:p-5 max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div
                          key={item.variantId}
                          className="flex gap-3.5 group items-center"
                        >
                          <div className="w-14 h-14 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0 p-1">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 line-clamp-2 text-xs sm:text-sm mb-1">
                              {item.name}
                            </div>
                            <div className="flex justify-between items-end">
                              <div className="text-slate-500 text-xs bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                Sl: {item.quantity}
                              </div>
                              <div className="font-sans font-semibold text-slate-900 text-sm tabular-nums">
                                {formatCurrency(item.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-white space-y-3.5 border-t border-slate-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tạm tính</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                    {serverDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Giảm giá</span>
                        <span className="font-semibold text-rose-600 tabular-nums">
                          -{formatCurrency(serverDiscount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Phí vận chuyển</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {isPreviewLoading ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                            Đang tính...
                          </span>
                        ) : shippingFee !== null ? (
                          shippingFee === 0 ? (
                            <span className="text-emerald-600 font-semibold">
                              Miễn phí
                            </span>
                          ) : (
                            formatCurrency(shippingFee)
                          )
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>
                    <Separator className="my-2 bg-slate-200" />
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-semibold text-slate-900">
                        Tổng thanh toán
                      </span>
                      <span className="text-xl sm:text-2xl font-sans font-bold text-slate-900 tabular-nums">
                        {isPreviewLoading ? (
                          <span className="inline-flex items-center gap-1.5 text-base font-sans text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                            Đang tính...
                          </span>
                        ) : finalTotal !== null ? (
                          formatCurrency(finalTotal)
                        ) : (
                          '—'
                        )}
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
    </>
  );
}
