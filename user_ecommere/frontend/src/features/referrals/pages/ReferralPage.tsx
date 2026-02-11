import { useState } from 'react';
import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Users, Gift } from 'lucide-react';
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
                    title: 'Thai Spray - Moi ban be',
                    text: `Dang ky tai Thai Spray va nhan uu dai! Dung ma gioi thieu cua toi: ${info?.referralCode}`,
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
            <SEO title="Moi ban be - Thai Spray" />
            <div className="container py-6 md:py-8 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        Moi ban be - Nhan uu dai
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Chia se ma gioi thieu cua ban va nhan ma giam gia khi ban be dang ky thanh cong
                    </p>
                </div>

                {/* Referral Code Card */}
                <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                    <CardContent className="p-6 md:p-8 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <p className="text-sm text-white/80 mb-2 font-medium">
                                    Ma gioi thieu cua ban
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl md:text-4xl font-bold tracking-widest font-mono">
                                        {info?.referralCode || '---'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="secondary"
                                    className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                                    onClick={() => handleCopy(info?.referralCode || '')}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    {copied ? 'Da sao chep!' : 'Sao chep ma'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                                    onClick={handleShare}
                                >
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Chia se
                                </Button>
                            </div>
                        </div>

                        {/* Referral link */}
                        <div className="mt-6 p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                            <p className="text-xs text-white/70 mb-1">Link gioi thieu</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-mono truncate flex-1">{referralLink}</p>
                                <button
                                    onClick={() => handleCopy(referralLink)}
                                    className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{info?.totalReferrals || 0}</p>
                                    <p className="text-xs text-muted-foreground">Ban be da moi</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md bg-white/80 backdrop-blur-xl">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                    <Gift className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{info?.totalCouponsEarned || 0}</p>
                                    <p className="text-xs text-muted-foreground">Ma giam gia da nhan</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coupons from referral */}
                <Card className="mb-6 border-0 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Ma giam gia tu gioi thieu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {couponsLoading ? (
                            <div className="animate-pulse space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                                ))}
                            </div>
                        ) : !coupons || coupons.length === 0 ? (
                            <div className="text-center py-8">
                                <Gift className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">
                                    Chua co ma giam gia nao. Hay moi ban be de nhan uu dai!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {coupons.map((coupon) => {
                                    const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
                                    const isUsed = coupon.usedCount >= (coupon.maxUses || Infinity);
                                    return (
                                        <div
                                            key={coupon.code}
                                            className={`flex items-center justify-between p-4 rounded-xl border ${isExpired || isUsed
                                                ? 'bg-gray-50 border-gray-200 opacity-60'
                                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
                                                }`}
                                        >
                                            <div>
                                                <p className="font-mono font-bold text-sm">{coupon.code}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {coupon.type === 'PERCENT'
                                                        ? `Giam ${coupon.value}%`
                                                        : coupon.type === 'FIXED'
                                                            ? `Giam ${formatCurrency(coupon.value)}`
                                                            : 'Mien phi van chuyen'}
                                                    {coupon.maxDiscount
                                                        ? ` (toi da ${formatCurrency(coupon.maxDiscount)})`
                                                        : ''}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {isExpired ? (
                                                    <Badge variant="secondary" className="text-xs">Het han</Badge>
                                                ) : isUsed ? (
                                                    <Badge variant="secondary" className="text-xs">Da dung</Badge>
                                                ) : (
                                                    <Badge className="bg-green-100 text-green-700 text-xs border-0">
                                                        Con hieu luc
                                                    </Badge>
                                                )}
                                                {coupon.validUntil && (
                                                    <p className="text-[10px] text-muted-foreground mt-1">
                                                        HSD: {new Date(coupon.validUntil).toLocaleDateString('vi-VN')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Referral list */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Ban be da moi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {referralsLoading ? (
                            <div className="animate-pulse space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-12 bg-gray-100 rounded-lg" />
                                ))}
                            </div>
                        ) : !referrals || referrals.data.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">
                                    Chua co ban be nao duoc gioi thieu
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    {referrals.data.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {(item.refereeName || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{item.refereeName}</p>
                                                    <p className="text-xs text-muted-foreground">{item.refereeEmail}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                                </p>
                                                {item.couponCode && (
                                                    <Badge variant="outline" className="text-[10px] mt-0.5">
                                                        {item.couponCode}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {referrals.totalPages > 1 && (
                                    <div className="flex justify-center gap-2 mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() => setPage((p) => p - 1)}
                                        >
                                            Truoc
                                        </Button>
                                        <span className="flex items-center text-sm text-muted-foreground px-3">
                                            {page} / {referrals.totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= referrals.totalPages}
                                            onClick={() => setPage((p) => p + 1)}
                                        >
                                            Tiep
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
