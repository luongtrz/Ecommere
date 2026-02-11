import { useState } from 'react';
import { SEO } from '@/lib/seo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Share2, Users, Gift, Ticket, History } from 'lucide-react';
import { useReferralInfo, useMyReferrals, useReferralCoupons } from '../hooks/useReferral';
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
            <div className="container py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    <div className="h-48 bg-gray-200 rounded" />
                    <div className="h-48 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    return (
        <>
            <SEO title="Mời bạn bè - Thai Spray" />
            <div className="container py-4 max-w-6xl h-[calc(100vh-64px)] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="mb-4 shrink-0">
                    <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
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
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative shrink-0">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
                            <CardContent className="p-5 relative z-10">
                                <p className="text-xs text-white/80 mb-1 font-medium">Mã giới thiệu của bạn</p>
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
                                    <p className="text-[10px] text-white/70 mb-1">Link giới thiệu</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-mono truncate flex-1">{referralLink}</p>
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
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                                        <Users className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <p className="text-xl font-bold leading-none">{info?.totalReferrals || 0}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Bạn bè đã mời</p>
                                </CardContent>
                            </Card>
                            <Card className="border shadow-sm">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-2">
                                        <Gift className="h-4 w-4 text-green-600" />
                                    </div>
                                    <p className="text-xl font-bold leading-none">{info?.totalCouponsEarned || 0}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Mã đã nhận</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column: Tabs */}
                    <div className="lg:col-span-8 flex flex-col h-full min-h-0">
                        <Tabs defaultValue="coupons" className="h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-2 mb-2 shrink-0">
                                <TabsTrigger value="coupons" className="flex items-center gap-2">
                                    <Ticket className="h-4 w-4" />
                                    Mã ưu đãi
                                </TabsTrigger>
                                <TabsTrigger value="referrals" className="flex items-center gap-2">
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
                                                    <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                                                ))}
                                            </div>
                                        ) : !coupons || coupons.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                                                <Gift className="h-12 w-12 text-muted-foreground/20 mb-3" />
                                                <p className="text-muted-foreground text-sm">
                                                    Chưa có mã giảm giá nào. Hãy mời bạn bè để nhận ưu đãi!
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {coupons.map((coupon) => {
                                                    const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
                                                    const isUsed = coupon.usedCount >= (coupon.maxUses || Infinity);
                                                    return (
                                                        <div
                                                            key={coupon.code}
                                                            className={`flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${isExpired || isUsed ? 'opacity-60 grayscale' : ''}`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isExpired || isUsed ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>
                                                                    <Ticket className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-mono font-bold text-sm text-blue-700">{coupon.code}</p>
                                                                    <p className="text-xs text-secondary-foreground font-medium mt-0.5">
                                                                        {coupon.type === 'PERCENT'
                                                                            ? `Giảm ${coupon.value}%`
                                                                            : coupon.type === 'FIXED'
                                                                                ? `Giảm ${formatCurrency(coupon.value)}`
                                                                                : 'Miễn phí vận chuyển'}
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                        {coupon.maxDiscount ? `Tối đa ${formatCurrency(coupon.maxDiscount)}` : ''}
                                                                        {coupon.validUntil && ` • HSD: ${new Date(coupon.validUntil).toLocaleDateString('vi-VN')}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0 ml-2">
                                                                {isExpired ? (
                                                                    <Badge variant="secondary" className="text-[10px]">Hết hạn</Badge>
                                                                ) : isUsed ? (
                                                                    <Badge variant="secondary" className="text-[10px]">Đã dùng</Badge>
                                                                ) : (
                                                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleCopy(coupon.code)}>
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
                                                    <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
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
                                                    <div className="col-span-3 text-right">Ngày tham gia</div>
                                                    <div className="col-span-3 text-right pr-2">Trạng thái</div>
                                                </div>
                                                {referrals.data.map((item) => (
                                                    <div key={item.id} className="p-3 hover:bg-slate-50 transition-colors grid grid-cols-12 gap-2 items-center">
                                                        <div className="col-span-6 flex items-center gap-3 overflow-hidden">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                                {(item.refereeName || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium truncate">{item.refereeName}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{item.refereeEmail}</p>
                                                            </div>
                                                        </div>
                                                        <div className="col-span-3 text-right text-xs text-muted-foreground">
                                                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                                        </div>
                                                        <div className="col-span-3 text-right">
                                                            {item.couponCode ? (
                                                                <Badge variant="outline" className="text-[10px] border-green-200 bg-green-50 text-green-700">
                                                                    Đã nhận quà
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px]">
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
