import { useState } from 'react';
import { SEO } from '@/lib/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Share2, Users, Gift, Ticket, History } from 'lucide-react';
import {
  useReferralInfo,
  useMyReferrals,
  useReferralCoupons,
} from '../hooks/useReferral';
import { formatCurrency } from '@/lib/formatters';

export function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);

  const { data: info, isLoading: infoLoading } = useReferralInfo();
  const { data: referrals, isLoading: referralsLoading } = useMyReferrals(page);
  const { data: coupons, isLoading: couponsLoading } = useReferralCoupons();

  const referralLink = info?.referralCode
    ? `${window.location.origin}/register?ref=${info.referralCode}`
    : '';

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Thai Spray - Mời bạn bè',
                    text: `Đăng ký tại Thai Spray và nhận ưu đãi! Dùng mã giới thiệu của tôi: ${info?.referralCode}`,
                    url: referralLink,
                });
            } catch {
                // User cancelled
            }
        } else {
            handleCopy(referralLink);
        }
    };

    if (infoLoading) {
        return (
            <div className="container max-w-6xl py-8 md:py-12 px-4">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-slate-200 rounded-xl w-1/3" />
                    <div className="h-56 bg-slate-200 rounded-2xl" />
                    <div className="h-64 bg-slate-200 rounded-2xl" />
                </div>
            </div>
        );
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Thai Spray - Mời bạn bè',
          text: `Đăng ký tại Thai Spray và nhận ưu đãi! Dùng mã giới thiệu của tôi: ${info?.referralCode}`,
          url: referralLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy(referralLink);
    }
  };

  if (infoLoading) {
    return (
        <>
            <SEO title="Mời bạn bè - Thai Spray" />
            <div className="min-h-screen bg-slate-50 py-8 md:py-12">
                <div className="container max-w-6xl px-4 space-y-6 md:space-y-8">
                    {/* Header */}
                    <div className="pb-6 border-b border-slate-200">
                        <span className="uppercase tracking-wider text-xs font-semibold text-teal-600 block mb-1">Chương trình đối tác</span>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                            Mời bạn bè - Nhận ưu đãi
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Chia sẻ mã giới thiệu để nhận quà cho cả hai
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                        {/* Left Column: Hero Referral Card & Stats */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Hero Referral Code Card */}
                            <Card className="border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-teal-50/30 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                                <CardContent className="p-6 md:p-8 space-y-5">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-teal-700 mb-2 font-semibold">Mã giới thiệu của bạn</p>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-teal-100 shadow-sm">
                                            <span className="text-2xl md:text-3xl font-bold tracking-widest font-mono text-teal-700">
                                                {info?.referralCode || '---'}
                                            </span>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 h-9 px-4 font-medium text-xs shadow-sm transition-colors"
                                                onClick={() => handleCopy(info?.referralCode || '')}
                                            >
                                                <Copy className="mr-1.5 h-3.5 w-3.5" />
                                                {copied ? 'Đã chép' : 'Sao chép'}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-3.5 bg-white rounded-xl border border-teal-100 shadow-sm space-y-1.5">
                                        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Link giới thiệu</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-mono truncate flex-1 text-slate-700">{referralLink}</p>
                                            <button
                                                onClick={() => handleCopy(referralLink)}
                                                className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-teal-600 transition-colors"
                                                aria-label="Sao chép"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={handleShare}
                                                className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-teal-600 transition-colors"
                                                aria-label="Chia sẻ"
                                            >
                                                <Share2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Simple Stats Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                                        <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mb-2.5 text-teal-600">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <p className="text-2xl font-bold text-slate-900 leading-none tabular-nums">{info?.totalReferrals || 0}</p>
                                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mt-2">Bạn bè đã mời</p>
                                    </CardContent>
                                </Card>
                                <Card className="border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                                        <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-2.5 text-emerald-600">
                                            <Gift className="h-5 w-5" />
                                        </div>
                                        <p className="text-2xl font-bold text-emerald-600 leading-none tabular-nums">{info?.totalCouponsEarned || 0}</p>
                                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mt-2">Mã đã nhận</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Right Column: Tabs */}
                        <div className="lg:col-span-7">
                            <Tabs defaultValue="coupons" className="space-y-4">
                                <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200 h-auto">
                                    <TabsTrigger value="coupons" className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm flex items-center justify-center gap-2 text-slate-600">
                                        <Ticket className="h-4 w-4" />
                                        Mã ưu đãi
                                    </TabsTrigger>
                                    <TabsTrigger value="referrals" className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm flex items-center justify-center gap-2 text-slate-600">
                                        <History className="h-4 w-4" />
                                        Lịch sử mời
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="coupons" className="mt-0">
                                    <Card className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
                                        <CardContent className="p-0">
                                            {couponsLoading ? (
                                                <div className="p-6 space-y-3">
                                                    {[1, 2].map((i) => (
                                                        <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                                                    ))}
                                                </div>
                                            ) : !coupons || coupons.length === 0 ? (
                                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-3 text-slate-400">
                                                        <Gift className="h-7 w-7" />
                                                    </div>
                                                    <p className="text-slate-500 text-sm max-w-sm">
                                                        Chưa có mã giảm giá nào. Hãy mời bạn bè để nhận ưu đãi!
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-100">
                                                    {coupons.map((coupon) => {
                                                        const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
                                                        const isUsed = coupon.usedCount >= (coupon.maxUses || Infinity);
                                                        return (
                                                            <div
                                                                key={coupon.code}
                                                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50/60 transition-colors gap-3 ${isExpired || isUsed ? 'opacity-50 grayscale' : ''}`}
                                                            >
                                                                <div className="flex items-start gap-3.5">
                                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 ${isExpired || isUsed ? 'bg-slate-100 text-slate-400' : 'bg-teal-50 text-teal-600'}`}>
                                                                        <Ticket className="h-5 w-5" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-mono font-bold text-sm text-slate-900 tracking-wider">{coupon.code}</p>
                                                                        <p className="text-xs text-rose-600 font-semibold mt-0.5">
                                                                            {coupon.type === 'PERCENT'
                                                                                ? `Giảm ${coupon.value}%`
                                                                                : coupon.type === 'FIXED'
                                                                                    ? `Giảm ${formatCurrency(coupon.value)}`
                                                                                    : 'Miễn phí vận chuyển'}
                                                                        </p>
                                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                                            {coupon.maxDiscount ? `Tối đa ${formatCurrency(coupon.maxDiscount)}` : ''}
                                                                            {coupon.validUntil && ` • HSD: ${new Date(coupon.validUntil).toLocaleDateString('vi-VN')}`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    {isExpired ? (
                                                                        <Badge variant="secondary" className="text-xs rounded-full px-3 bg-slate-100 text-slate-500 border border-slate-200">Hết hạn</Badge>
                                                                    ) : isUsed ? (
                                                                        <Badge variant="secondary" className="text-xs rounded-full px-3 bg-slate-100 text-slate-500 border border-slate-200">Đã dùng</Badge>
                                                                    ) : (
                                                                        <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 font-medium" onClick={() => handleCopy(coupon.code)}>
                                                                            Sao chép
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="referrals" className="mt-0">
                                    <Card className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
                                        <CardContent className="p-0">
                                            {referralsLoading ? (
                                                <div className="p-6 space-y-3">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                                                    ))}
                                                </div>
                                            ) : !referrals || referrals.data.length === 0 ? (
                                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-3 text-slate-400">
                                                        <Users className="h-7 w-7" />
                                                    </div>
                                                    <p className="text-slate-500 text-sm max-w-sm">
                                                        Chưa có bạn bè nào được giới thiệu
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-100">
                                                    <div className="bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 grid grid-cols-12 gap-2 border-b border-slate-200">
                                                        <div className="col-span-6">Người được mời</div>
                                                        <div className="col-span-3 text-right">Ngày tham gia</div>
                                                        <div className="col-span-3 text-right">Trạng thái</div>
                                                    </div>
                                                    {referrals.data.map((item) => (
                                                        <div key={item.id} className="p-4 hover:bg-slate-50/60 transition-colors grid grid-cols-12 gap-2 items-center">
                                                            <div className="col-span-6 flex items-center gap-3 overflow-hidden">
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                                                                    {(item.refereeName || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-slate-900 truncate">{item.refereeName}</p>
                                                                    <p className="text-xs text-slate-500 truncate">{item.refereeEmail}</p>
                                                                </div>
                                                            </div>
                                                            <div className="col-span-3 text-right text-xs text-slate-500">
                                                                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                                            </div>
                                                            <div className="col-span-3 text-right">
                                                                {item.couponCode ? (
                                                                    <Badge variant="outline" className="text-xs rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 font-medium ring-1 ring-emerald-200">
                                                                        Đã nhận quà
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-xs rounded-full border-slate-200 bg-slate-50 text-slate-600 font-medium ring-1 ring-slate-200">
                                                                        Đang chờ
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>

                                        {/* Pagination Footer */}
                                        {referrals && referrals.totalPages > 1 && (
                                            <div className="p-3 border-t border-slate-200 flex justify-center items-center gap-2 bg-slate-50/70">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={page <= 1}
                                                    onClick={() => setPage((p) => p - 1)}
                                                    className="rounded-lg h-8 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium"
                                                >
                                                    Trước
                                                </Button>
                                                <span className="flex items-center text-xs text-slate-500 px-2 tabular-nums font-medium">
                                                    {page} / {referrals.totalPages}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={page >= referrals.totalPages}
                                                    onClick={() => setPage((p) => p + 1)}
                                                    className="rounded-lg h-8 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium"
                                                >
                                                    Tiếp
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
  }

  return (
    <>
      <SEO title="Mời bạn bè - Thai Spray" />
      <div className="container py-4 max-w-6xl h-[calc(100vh-64px)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="mb-4 shrink-0">
          <h1 className="text-xl md:text-2xl font-bold text-primary">
            Mời bạn bè - Nhận ưu đãi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chia sẻ mã giới thiệu để nhận quà cho cả hai
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0 pb-4">
          {/* Left Column: Info & Stats */}
          <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-1">
            {/* Referral Code Card */}
            <Card className="border-0 shadow-lg bg-primary text-primary-foreground overflow-hidden relative shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
              <CardContent className="p-5 relative z-10">
                <p className="text-xs text-white/80 mb-1 font-medium">
                  Mã giới thiệu của bạn
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold tracking-widest font-mono">
                    {info?.referralCode || '---'}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm h-8"
                    onClick={() => handleCopy(info?.referralCode || '')}
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    {copied ? 'Đã chép' : 'Sao chép'}
                  </Button>
                </div>

                <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-[10px] text-white/70 mb-1">
                    Link giới thiệu
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono truncate flex-1">
                      {referralLink}
                    </p>
                    <button
                      onClick={() => handleCopy(referralLink)}
                      className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Share2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats - Compact Grid */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <Card className="border shadow-sm">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mb-2">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xl font-bold leading-none">
                    {info?.totalReferrals || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Bạn bè đã mời
                  </p>
                </CardContent>
              </Card>
              <Card className="border shadow-sm">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <Gift className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xl font-bold leading-none">
                    {info?.totalCouponsEarned || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Mã đã nhận
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Tabs */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-0">
            <Tabs defaultValue="coupons" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-2 shrink-0">
                <TabsTrigger
                  value="coupons"
                  className="flex items-center gap-2"
                >
                  <Ticket className="h-4 w-4" />
                  Mã ưu đãi
                </TabsTrigger>
                <TabsTrigger
                  value="referrals"
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  Lịch sử mời
                </TabsTrigger>
              </TabsList>

              <TabsContent value="coupons" className="flex-1 min-h-0 mt-0">
                <Card className="h-full border shadow-sm flex flex-col">
                  <CardContent className="p-0 flex-1 overflow-y-auto">
                    {couponsLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-16 bg-gray-100 rounded-lg animate-pulse"
                          />
                        ))}
                      </div>
                    ) : !coupons || coupons.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        <Gift className="h-12 w-12 text-muted-foreground/20 mb-3" />
                        <p className="text-muted-foreground text-sm">
                          Chưa có mã giảm giá nào. Hãy mời bạn bè để nhận ưu
                          đãi!
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {coupons.map((coupon) => {
                          const isExpired =
                            coupon.validUntil &&
                            new Date(coupon.validUntil) < new Date();
                          const isUsed =
                            coupon.usedCount >= (coupon.maxUses || Infinity);
                          return (
                            <div
                              key={coupon.code}
                              className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${isExpired || isUsed ? 'opacity-60 grayscale' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isExpired || isUsed ? 'bg-gray-100 text-gray-400' : 'bg-secondary text-primary'}`}
                                >
                                  <Ticket className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-mono font-bold text-sm text-primary">
                                    {coupon.code}
                                  </p>
                                  <p className="text-xs text-secondary-foreground font-medium mt-0.5">
                                    {coupon.type === 'PERCENT'
                                      ? `Giảm ${coupon.value}%`
                                      : coupon.type === 'FIXED'
                                        ? `Giảm ${formatCurrency(coupon.value)}`
                                        : 'Miễn phí vận chuyển'}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {coupon.maxDiscount
                                      ? `Tối đa ${formatCurrency(coupon.maxDiscount)}`
                                      : ''}
                                    {coupon.validUntil &&
                                      ` • HSD: ${new Date(coupon.validUntil).toLocaleDateString('vi-VN')}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                {isExpired ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    Hết hạn
                                  </Badge>
                                ) : isUsed ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    Đã dùng
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => handleCopy(coupon.code)}
                                  >
                                    Sao chép
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="referrals" className="flex-1 min-h-0 mt-0">
                <Card className="h-full border shadow-sm flex flex-col">
                  <CardContent className="p-0 flex-1 overflow-y-auto">
                    {referralsLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-12 bg-gray-100 rounded-lg animate-pulse"
                          />
                        ))}
                      </div>
                    ) : !referrals || referrals.data.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        <Users className="h-12 w-12 text-muted-foreground/20 mb-3" />
                        <p className="text-muted-foreground text-sm">
                          Chưa có bạn bè nào được giới thiệu
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        <div className="bg-muted/50 p-2 text-[10px] font-medium text-muted-foreground grid grid-cols-12 gap-2">
                          <div className="col-span-6 pl-2">Người được mời</div>
                          <div className="col-span-3 text-right">
                            Ngày tham gia
                          </div>
                          <div className="col-span-3 text-right pr-2">
                            Trạng thái
                          </div>
                        </div>
                        {referrals.data.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 hover:bg-slate-50 transition-colors grid grid-cols-12 gap-2 items-center"
                          >
                            <div className="col-span-6 flex items-center gap-3 overflow-hidden">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {(item.refereeName || '?')
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.refereeName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.refereeEmail}
                                </p>
                              </div>
                            </div>
                            <div className="col-span-3 text-right text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString(
                                'vi-VN',
                              )}
                            </div>
                            <div className="col-span-3 text-right">
                              {item.couponCode ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-green-200 bg-green-50 text-green-700"
                                >
                                  Đã nhận quà
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  Đang chờ
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  {/* Pagination Footer */}
                  {referrals && referrals.totalPages > 1 && (
                    <div className="p-2 border-t flex justify-center gap-2 bg-slate-50">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="h-7 text-xs"
                      >
                        Trước
                      </Button>
                      <span className="flex items-center text-xs text-muted-foreground px-2">
                        {page} / {referrals.totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={page >= referrals.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="h-7 text-xs"
                      >
                        Tiếp
                      </Button>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
