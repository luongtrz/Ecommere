import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
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
      <div className="container py-8 md:py-12 max-w-5xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48 mb-6" />
          <div className="h-32 bg-muted rounded-lg w-full" />
          <div className="h-24 bg-muted rounded-lg w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Mời bạn bè - Thai Spray" />
      <div className="container py-8 md:py-12 max-w-5xl space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link to="/account" className="hover:text-foreground transition-colors">
            Tài khoản
          </Link>
          <span className="mx-2 text-muted-foreground/60">/</span>
          <span className="text-foreground">Mời bạn bè</span>
        </nav>

        {/* Header */}
        <div className="pb-6 border-b border-border">
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
            Mời bạn bè - Nhận ưu đãi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chia sẻ mã giới thiệu để nhận quà cho cả hai
          </p>
        </div>

        {/* Referral Code Block */}
        <section className="rounded-lg border border-border bg-card p-6">
          <div className="max-w-xl">
            <p className="text-xs text-muted-foreground font-medium mb-2">
              Mã giới thiệu của bạn
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 font-mono text-2xl sm:text-3xl font-bold tracking-widest px-4 py-2.5 rounded-md border border-border bg-muted/40 text-foreground tabular select-all text-center sm:text-left">
                {info?.referralCode || '---'}
              </div>
              <Button
                variant="outline"
                onClick={() => handleCopy(info?.referralCode || '')}
                className="shrink-0"
              >
                <Copy className="mr-2 h-4 w-4" />
                {copied ? 'Đã chép' : 'Sao chép'}
              </Button>
            </div>

            {referralLink && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Link giới thiệu</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono truncate flex-1 text-muted-foreground">
                    {referralLink}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(referralLink)}
                    className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-foreground"
                    aria-label="Sao chép link giới thiệu"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-foreground"
                    aria-label="Chia sẻ link giới thiệu"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2-column stats strip */}
        <section className="grid grid-cols-2 divide-x divide-border border border-border rounded-lg bg-card">
          <div className="p-5 text-center">
            <div className="font-serif text-2xl md:text-3xl font-semibold text-foreground tabular">
              {info?.totalReferrals || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Bạn bè đã mời</p>
          </div>
          <div className="p-5 text-center">
            <div className="font-serif text-2xl md:text-3xl font-semibold text-foreground tabular">
              {info?.totalCouponsEarned || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Mã đã nhận</p>
          </div>
        </section>

        {/* Tabs: Coupons & Referral History */}
        <section>
          <Tabs defaultValue="coupons" className="space-y-4">
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="coupons" className="text-xs sm:text-sm">
                <Ticket className="h-4 w-4 mr-2" />
                Mã ưu đãi
              </TabsTrigger>
              <TabsTrigger value="referrals" className="text-xs sm:text-sm">
                <History className="h-4 w-4 mr-2" />
                Lịch sử mời
              </TabsTrigger>
            </TabsList>

            <TabsContent value="coupons" className="mt-0">
              <div className="border border-border rounded-lg bg-card overflow-hidden">
                {couponsLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : !coupons || coupons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
                    <Gift className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Chưa có mã giảm giá nào. Hãy mời bạn bè để nhận ưu đãi!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {coupons.map((coupon) => {
                      const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
                      const isUsed = coupon.usedCount >= (coupon.maxUses || Infinity);
                      return (
                        <div
                          key={coupon.code}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-colors hover:bg-muted/30 ${
                            isExpired || isUsed ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-md bg-secondary text-foreground border border-border flex items-center justify-center shrink-0">
                              <Ticket className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-mono font-medium text-sm text-foreground">{coupon.code}</p>
                              <p className="text-xs text-foreground font-medium mt-0.5">
                                {coupon.type === 'PERCENT'
                                  ? `Giảm ${coupon.value}%`
                                  : coupon.type === 'FIXED'
                                    ? `Giảm ${formatCurrency(coupon.value)}`
                                    : 'Miễn phí vận chuyển'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {coupon.maxDiscount ? `Tối đa ${formatCurrency(coupon.maxDiscount)}` : ''}
                                {coupon.validUntil && ` • HSD: ${new Date(coupon.validUntil).toLocaleDateString('vi-VN')}`}
                              </p>
                            </div>
                          </div>
                          <div className="self-end sm:self-center shrink-0">
                            {isExpired ? (
                              <Badge variant="secondary" className="rounded-sm text-xs">
                                Hết hạn
                              </Badge>
                            ) : isUsed ? (
                              <Badge variant="secondary" className="rounded-sm text-xs">
                                Đã dùng
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
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
              </div>
            </TabsContent>

            <TabsContent value="referrals" className="mt-0">
              <div className="border border-border rounded-lg bg-card overflow-hidden">
                {referralsLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : !referrals || referrals.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Chưa có bạn bè nào được giới thiệu
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Table Header */}
                    <div className="border-b border-border bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground grid grid-cols-12 gap-2">
                      <div className="col-span-6">Người được mời</div>
                      <div className="col-span-3 text-right">Ngày tham gia</div>
                      <div className="col-span-3 text-right">Trạng thái</div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-border">
                      {referrals.data.map((item) => (
                        <div
                          key={item.id}
                          className="px-4 py-3 transition-colors hover:bg-muted/30 grid grid-cols-12 gap-2 items-center text-sm"
                        >
                          <div className="col-span-6 flex items-center gap-2.5 overflow-hidden">
                            <div className="w-7 h-7 rounded-full bg-secondary text-foreground border border-border flex items-center justify-center font-medium text-xs shrink-0">
                              {(item.refereeName || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {item.refereeName}
                              </p>
                              {item.refereeEmail && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.refereeEmail}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="col-span-3 text-right text-xs text-muted-foreground tabular">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="col-span-3 text-right">
                            {item.couponCode ? (
                              <Badge variant="outline" className="rounded-sm text-xs border-success text-success">
                                Đã nhận quà
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-sm text-xs text-muted-foreground">
                                Đang chờ
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {referrals && referrals.totalPages > 1 && (
                      <div className="p-3 border-t border-border flex justify-center items-center gap-2 bg-muted/20">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                          className="h-8 text-xs"
                        >
                          Trước
                        </Button>
                        <span className="flex items-center text-xs text-muted-foreground px-2 tabular">
                          {page} / {referrals.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= referrals.totalPages}
                          onClick={() => setPage((p) => p + 1)}
                          className="h-8 text-xs"
                        >
                          Tiếp
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </>
  );
}
