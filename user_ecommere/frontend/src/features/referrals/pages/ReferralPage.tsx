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
            <div className="container max-w-6xl py-12 md:py-16 px-4">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-muted rounded-2xl w-1/3" />
                    <div className="h-56 bg-muted rounded-[1.8rem]" />
                    <div className="h-64 bg-muted rounded-[1.8rem]" />
                </div>
            </div>
        );
    }

    return (
        <>
            <SEO title="Mời bạn bè - Thai Spray" />
            <div className="min-h-screen bg-background py-8 md:py-16">
                <div className="container max-w-6xl px-4 space-y-8">
                    {/* Header */}
                    <div className="pb-6 border-b border-border/60">
                        <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground block mb-1">Chương trình đối tác</span>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">
                            Mời bạn bè - Nhận ưu đãi
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Chia sẻ mã giới thiệu để nhận quà cho cả hai
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Hero Referral Card & Stats */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Hero Referral Code Card */}
                            <Card className="border border-border/60 shadow-luxury bg-primary text-primary-foreground overflow-hidden relative rounded-[1.8rem]">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                                <CardContent className="p-6 md:p-8 relative z-10 space-y-5">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/70 mb-2 font-bold">Mã giới thiệu của bạn</p>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10">
                                            <span className="text-2xl md:text-3xl font-bold tracking-widest font-mono text-primary-foreground">
                                                {info?.referralCode || '---'}
                                            </span>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 border-0 h-9 px-4 font-semibold text-xs shadow-sm"
                                                onClick={() => handleCopy(info?.referralCode || '')}
                                            >
                                                <Copy className="mr-1.5 h-3.5 w-3.5" />
                                                {copied ? 'Đã chép' : 'Sao chép'}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-3.5 bg-primary-foreground/10 rounded-2xl backdrop-blur-sm border border-primary-foreground/10 space-y-1.5">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/70 font-bold">Link giới thiệu</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-mono truncate flex-1 text-primary-foreground/90">{referralLink}</p>
                                            <button
                                                onClick={() => handleCopy(referralLink)}
                                                className="shrink-0 p-1.5 rounded-full hover:bg-primary-foreground/20 text-primary-foreground transition-colors"
                                                aria-label="Sao chép"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={handleShare}
                                                className="shrink-0 p-1.5 rounded-full hover:bg-primary-foreground/20 text-primary-foreground transition-colors"
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
                                <Card className="border border-border/60 bg-card rounded-2xl shadow-luxury hover:shadow-luxury-glow transition-all duration-300 hover:-translate-y-0.5">
                                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                                        <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-2.5 text-primary">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <p className="text-2xl font-serif font-bold text-foreground leading-none tabular-nums">{info?.totalReferrals || 0}</p>
                                        <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground mt-2">Bạn bè đã mời</p>
                                    </CardContent>
                                </Card>
                                <Card className="border border-border/60 bg-card rounded-2xl shadow-luxury hover:shadow-luxury-glow transition-all duration-300 hover:-translate-y-0.5">
                                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2.5 text-emerald-700">
                                            <Gift className="h-5 w-5" />
                                        </div>
                                        <p className="text-2xl font-serif font-bold text-foreground leading-none tabular-nums">{info?.totalCouponsEarned || 0}</p>
                                        <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground mt-2">Mã đã nhận</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Right Column: Tabs */}
                        <div className="lg:col-span-7">
                            <Tabs defaultValue="coupons" className="space-y-4">
                                <TabsList className="grid w-full grid-cols-2 bg-secondary/80 p-1.5 rounded-full border border-border/60 h-auto">
                                    <TabsTrigger value="coupons" className="rounded-full py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center justify-center gap-2">
                                        <Ticket className="h-4 w-4" />
                                        Mã ưu đãi
                                    </TabsTrigger>
                                    <TabsTrigger value="referrals" className="rounded-full py-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center justify-center gap-2">
                                        <History className="h-4 w-4" />
                                        Lịch sử mời
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="coupons" className="mt-0">
                                    <Card className="border border-border/60 bg-card shadow-luxury rounded-[1.8rem] overflow-hidden">
                                        <CardContent className="p-0">
                                            {couponsLoading ? (
                                                <div className="p-6 space-y-3">
                                                    {[1, 2].map((i) => (
                                                        <div key={i} className="h-16 bg-muted/60 rounded-2xl animate-pulse" />
                                                    ))}
                                                </div>
                                            ) : !coupons || coupons.length === 0 ? (
                                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                                    <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-3 text-muted-foreground/60">
                                                        <Gift className="h-7 w-7" />
                                                    </div>
                                                    <p className="text-muted-foreground text-sm max-w-sm">
                                                        Chưa có mã giảm giá nào. Hãy mời bạn bè để nhận ưu đãi!
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-border/40">
                                                    {coupons.map((coupon) => {
                                                        const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
                                                        const isUsed = coupon.usedCount >= (coupon.maxUses || Infinity);
                                                        return (
                                                            <div
                                                                key={coupon.code}
                                                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-secondary/20 transition-colors gap-3 ${isExpired || isUsed ? 'opacity-60 grayscale' : ''}`}
                                                            >
                                                                <div className="flex items-start gap-3.5">
                                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-border/50 ${isExpired || isUsed ? 'bg-muted text-muted-foreground' : 'bg-secondary text-primary'}`}>
                                                                        <Ticket className="h-5 w-5" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-mono font-bold text-sm text-foreground tracking-wider">{coupon.code}</p>
                                                                        <p className="text-xs text-primary font-semibold mt-0.5">
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
                                                                <div className="text-right shrink-0">
                                                                    {isExpired ? (
                                                                        <Badge variant="secondary" className="text-[10px] rounded-full px-3">Hết hạn</Badge>
                                                                    ) : isUsed ? (
                                                                        <Badge variant="secondary" className="text-[10px] rounded-full px-3">Đã dùng</Badge>
                                                                    ) : (
                                                                        <Button size="sm" variant="outline" className="rounded-full h-8 text-xs border-border hover:bg-secondary px-4" onClick={() => handleCopy(coupon.code)}>
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
                                    <Card className="border border-border/60 bg-card shadow-luxury rounded-[1.8rem] overflow-hidden">
                                        <CardContent className="p-0">
                                            {referralsLoading ? (
                                                <div className="p-6 space-y-3">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="h-14 bg-muted/60 rounded-2xl animate-pulse" />
                                                    ))}
                                                </div>
                                            ) : !referrals || referrals.data.length === 0 ? (
                                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                                    <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-3 text-muted-foreground/60">
                                                        <Users className="h-7 w-7" />
                                                    </div>
                                                    <p className="text-muted-foreground text-sm max-w-sm">
                                                        Chưa có bạn bè nào được giới thiệu
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-border/40">
                                                    <div className="bg-secondary/40 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground grid grid-cols-12 gap-2 border-b border-border/40">
                                                        <div className="col-span-6">Người được mời</div>
                                                        <div className="col-span-3 text-right">Ngày tham gia</div>
                                                        <div className="col-span-3 text-right">Trạng thái</div>
                                                    </div>
                                                    {referrals.data.map((item) => (
                                                        <div key={item.id} className="p-4 hover:bg-secondary/20 transition-colors grid grid-cols-12 gap-2 items-center">
                                                            <div className="col-span-6 flex items-center gap-3 overflow-hidden">
                                                                <div className="w-8 h-8 rounded-full bg-secondary border border-border/60 flex items-center justify-center text-foreground font-bold text-xs shrink-0">
                                                                    {(item.refereeName || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-foreground truncate">{item.refereeName}</p>
                                                                    <p className="text-xs text-muted-foreground truncate">{item.refereeEmail}</p>
                                                                </div>
                                                            </div>
                                                            <div className="col-span-3 text-right text-xs text-muted-foreground">
                                                                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                                            </div>
                                                            <div className="col-span-3 text-right">
                                                                {item.couponCode ? (
                                                                    <Badge variant="outline" className="text-[10px] rounded-full border-emerald-500/25 bg-emerald-500/10 text-emerald-700 font-medium">
                                                                        Đã nhận quà
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-[10px] rounded-full border-border bg-muted text-muted-foreground font-medium">
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
                                            <div className="p-3 border-t border-border/40 flex justify-center items-center gap-2 bg-secondary/30">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={page <= 1}
                                                    onClick={() => setPage((p) => p - 1)}
                                                    className="rounded-full h-8 text-xs hover:bg-secondary"
                                                >
                                                    Trước
                                                </Button>
                                                <span className="flex items-center text-xs text-muted-foreground px-2 tabular-nums font-medium">
                                                    {page} / {referrals.totalPages}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={page >= referrals.totalPages}
                                                    onClick={() => setPage((p) => p + 1)}
                                                    className="rounded-full h-8 text-xs hover:bg-secondary"
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
