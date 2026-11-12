import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SEO } from '@/lib/seo';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Share2, Users, Ticket, History, Check } from 'lucide-react';
import { useReferralInfo, useMyReferrals, useReferralCoupons } from '../hooks/useReferral';
import { formatCurrency } from '@/lib/formatters';

export function ReferralPage() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: info, isLoading: infoLoading } = useReferralInfo();
  const { data: referrals, isLoading: referralsLoading } = useMyReferrals(page);
  const { data: coupons, isLoading: couponsLoading } = useReferralCoupons();

  const referralLink = info?.referralCode
    ? `${window.location.origin}/register?ref=${info.referralCode}`
    : '';

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      } catch {
        return false;
      }
    }
  };

  const handleCopyCode = async (code: string) => {
    await copyToClipboard(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = async (link: string) => {
    await copyToClipboard(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCoupon = async (code: string) => {
    await copyToClipboard(code);
    setCopiedCouponCode(code);
    toast.success('Đã sao chép mã giảm giá');
    setTimeout(() => setCopiedCouponCode((curr) => (curr === code ? null : curr)), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Thai Spray - Mời bạn bè',
          text: `Đăng ký tại Thai Spray và nhận ưu đãi! Dùng mã giới thiệu của tôi: ${info?.referralCode || ''}`,
          url: referralLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink(referralLink);
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
        <Breadcrumb items={[{ label: 'Tài khoản', href: '/account' }, { label: 'Mời bạn bè' }]} />

        {/* Header */}
        <div className="pb-6 border-b border-border">
          <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground">
            Mời bạn bè - Nhận ưu đãi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chia sẻ mã giới thiệu để nhận quà cho cả hai
          </p>
        </div>

        {/* Referral Code Block */}
        <section className="rounded-lg border border-border bg-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Referral Code */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Mã giới thiệu của bạn
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 font-semibold text-2xl sm:text-3xl text-foreground tabular select-all px-4 py-2.5 rounded-md border border-border bg-muted/40 text-center sm:text-left min-h-11 flex items-center justify-center sm:justify-start">
                  {info?.referralCode || '---'}
                </div>
                <Button
                  variant="default"
                  onClick={() => handleCopyCode(info?.referralCode || '')}
                  className="shrink-0 min-h-11 px-5"
                >
                  {copiedCode ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Sao chép
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right Column: Referral Link */}
            {referralLink ? (
              <div className="space-y-2 border-t border-border pt-4 md:border-t-0 md:pt-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Link giới thiệu
                </p>
                <div className="flex items-center rounded-md border border-border bg-background px-3 py-2.5 text-xs text-muted-foreground select-all min-h-11 overflow-hidden">
                  <span className="truncate">{referralLink}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(referralLink)}
                    className="min-h-11 flex-1 sm:flex-initial text-xs"
                    aria-label="Sao chép link giới thiệu"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="mr-1.5 h-4 w-4" />
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-4 w-4" />
                        Sao chép link
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="min-h-11 flex-1 sm:flex-initial text-xs"
                    aria-label="Chia sẻ link giới thiệu"
                  >
                    <Share2 className="mr-1.5 h-4 w-4" />
                    Chia sẻ
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* 2-column stats strip */}
        <section className="grid grid-cols-2 divide-x divide-border border border-border rounded-lg bg-card">
          <div className="p-5 text-center">
            <div className="text-2xl md:text-3xl font-semibold text-foreground tabular">
              {info?.totalReferrals || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Bạn bè đã mời</p>
          </div>
          <div className="p-5 text-center">
            <div className="text-2xl md:text-3xl font-semibold text-foreground tabular">
              {info?.totalCouponsEarned || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Mã giảm giá đã nhận</p>
          </div>
        </section>

        {/* Tabs: Coupons & Referral History */}
        <section>
          <Tabs defaultValue="coupons" className="border border-border rounded-lg bg-card overflow-hidden">
            <TabsList className="w-full justify-start border-b border-border bg-muted/20 px-2 sm:px-4">
              <TabsTrigger value="coupons" className="min-h-11 text-xs sm:text-sm">
                <Ticket className="h-4 w-4 mr-2" />
                Mã giảm giá
              </TabsTrigger>
              <TabsTrigger value="referrals" className="min-h-11 text-xs sm:text-sm">
                <History className="h-4 w-4 mr-2" />
                Lịch sử mời
              </TabsTrigger>
            </TabsList>

            <TabsContent value="coupons" className="mt-0">
              {couponsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : !coupons || coupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
                  <Ticket className="h-10 w-10 text-muted-foreground/60 mb-3" />
                  <p className="text-muted-foreground text-sm max-w-sm mb-4">
                    Chưa có mã giảm giá nào. Hãy mời bạn bè để nhận mã giảm giá!
                  </p>
                  <Button variant="outline" size="sm" asChild className="min-h-11">
                    <Link to="/catalog">Khám phá sản phẩm</Link>
                  </Button>
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
                          isExpired || isUsed ? 'opacity-50 grayscale' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-md bg-secondary text-foreground border border-border flex items-center justify-center shrink-0">
                            <Ticket className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground tabular">{coupon.code}</p>
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
                              className="min-h-11 text-xs"
                              onClick={() => handleCopyCoupon(coupon.code)}
                            >
                              {copiedCouponCode === coupon.code ? 'Đã sao chép' : 'Sao chép'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="referrals" className="mt-0">
              {referralsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : !referrals || referrals.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/60 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Chưa có bạn bè nào được giới thiệu
                  </p>
                </div>
              ) : (
                <div>
                  {/* Table Header - desktop only */}
                  <div className="hidden md:grid md:grid-cols-12 gap-2 border-b border-border bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    <div className="col-span-6">Người được mời</div>
                    <div className="col-span-3 text-right">Ngày tham gia</div>
                    <div className="col-span-3 text-right">Trạng thái</div>
                  </div>

                  {/* List / Table Rows */}
                  <div className="divide-y divide-border">
                    {referrals.data.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 transition-colors hover:bg-muted/30 flex flex-col gap-3 md:grid md:grid-cols-12 md:gap-2 md:items-center md:px-4 md:py-3 text-sm"
                      >
                        <div className="md:col-span-6 flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-secondary text-foreground border border-border flex items-center justify-center font-medium text-xs shrink-0">
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
                        <div className="flex items-center justify-between pt-2 border-t border-border/40 md:border-0 md:pt-0 md:contents">
                          <div className="md:col-span-3 md:text-right text-xs text-muted-foreground tabular">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="md:col-span-3 md:text-right">
                            {item.couponCode ? (
                              <Badge variant="outline" className="rounded-sm text-xs border-success text-success font-medium">
                                Đã nhận mã giảm giá
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-sm text-xs text-muted-foreground font-medium">
                                Đang chờ
                              </Badge>
                            )}
                          </div>
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
                        className="min-h-11 px-4 text-xs"
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
                        className="min-h-11 px-4 text-xs"
                      >
                        Tiếp
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </>
  );
}
